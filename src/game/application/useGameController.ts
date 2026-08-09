import { useCallback, useEffect, useReducer, useRef } from 'react';

import { createGame, transition } from '../domain/reducer';
import {
  selectActiveHumanId,
  selectCurrentPlayer,
  selectDecisionLabels,
  selectLegalActions,
  selectRankings,
  selectWinners,
  type DecisionLabels,
  type LegalActions,
  type RankedPlayer,
} from '../domain/selectors';
import type {
  Command,
  Decision,
  DomainEvent,
  GameConfig,
  GameState,
  PlayerDefinition,
  PlayerId,
} from '../domain/types';
import {
  runAutomaticTurn,
  type AutomaticTurnController,
  type PresentationMode,
  type PresentationStep,
} from './aiTurnRunner';
import { loadGameState, saveGameState, clearGameState } from './persistence';
import { TIMING, type GameTiming } from './timing';

interface EngineState {
  readonly game: GameState | null;
  readonly events: readonly DomainEvent[];
}

type EngineAction =
  | { readonly type: 'START'; readonly config: GameConfig }
  | { readonly type: 'COMMAND'; readonly command: Command }
  | { readonly type: 'RESET' };

const engineReducer = (current: EngineState, action: EngineAction): EngineState => {
  if (action.type === 'RESET') return { game: null, events: [] };
  if (action.type === 'START') return { game: createGame(action.config), events: [] };
  if (!current.game) return current;
  const result = transition(current.game, action.command);
  return result.ok ? { game: result.state, events: result.events } : current;
};

const initialEngineState = (): EngineState => ({ game: loadGameState(), events: [] });

export interface PresentationState {
  readonly mode: PresentationMode;
  readonly narration: string;
  readonly event?: DomainEvent;
}

type PresentationAction =
  | { readonly type: 'STEP'; readonly step: PresentationStep }
  | { readonly type: 'RESET' };

const initialPresentation: PresentationState = {
  mode: 'idle',
  narration: '',
};

const presentationReducer = (
  current: PresentationState,
  action: PresentationAction,
): PresentationState => {
  if (action.type === 'RESET') return initialPresentation;
  return {
    mode: action.step.mode,
    narration: action.step.narration ?? current.narration,
    event: action.step.event,
  };
};

export interface GameController {
  readonly state: GameState | null;
  readonly presentation: PresentationState;
  readonly rankings: readonly RankedPlayer[];
  readonly winners: readonly RankedPlayer[];
  readonly legalActions: LegalActions;
  readonly currentPlayer: PlayerDefinition | undefined;
  readonly decisionLabels: DecisionLabels | undefined;
  readonly activeHumanId: PlayerId | undefined;
  start(config: GameConfig): void;
  roll(): void;
  advanceRound(): void;
  submitDecision(playerId: PlayerId, decision: Decision): void;
  advanceDecisions(): void;
  restart(): void;
  reset(): void;
}

export interface GameControllerOptions {
  readonly timing?: Partial<GameTiming>;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

export const useGameController = (
  options: GameControllerOptions = {},
): GameController => {
  const timing: GameTiming = { ...TIMING, ...options.timing };
  const [engine, dispatchEngine] = useReducer(engineReducer, undefined, initialEngineState);
  const [presentation, dispatchPresentation] = useReducer(
    presentationReducer,
    initialPresentation,
  );
  const activeSequence = useRef<AbortController | null>(null);

  const start = useCallback((config: GameConfig) => {
    activeSequence.current?.abort();
    dispatchPresentation({ type: 'RESET' });
    dispatchEngine({ type: 'START', config });
  }, []);

  const roll = useCallback(() => {
    dispatchEngine({ type: 'COMMAND', command: { type: 'ROLL_DICE' } });
  }, []);

  const advanceRound = useCallback(() => {
    dispatchEngine({ type: 'COMMAND', command: { type: 'ADVANCE_ROUND' } });
  }, []);

  const submitDecision = useCallback((playerId: PlayerId, decision: Decision) => {
    dispatchEngine({
      type: 'COMMAND',
      command: { type: 'SUBMIT_DECISION', playerId, decision },
    });
  }, []);

  const advanceDecisions = useCallback(() => {
    const game = engine.game;
    const snapshot = game?.decisionSnapshot;
    if (!snapshot) return;
    for (const playerId of snapshot.pendingPlayerIds) {
      const isHuman = game!.config.players.find(({ id }) => id === playerId)?.controller.type === 'human';
      if (isHuman && snapshot.decisions[playerId] === undefined) {
        dispatchEngine({
          type: 'COMMAND',
          command: { type: 'SUBMIT_DECISION', playerId, decision: 'stay' },
        });
      }
    }
    dispatchEngine({ type: 'COMMAND', command: { type: 'RESOLVE_STRATEGY_DECISIONS' } });
  }, [engine.game]);

  const restart = useCallback(() => {
    activeSequence.current?.abort();
    dispatchPresentation({ type: 'RESET' });
    if (engine.game) dispatchEngine({ type: 'START', config: engine.game.config });
  }, [engine.game]);

  const reset = useCallback(() => {
    activeSequence.current?.abort();
    dispatchPresentation({ type: 'RESET' });
    dispatchEngine({ type: 'RESET' });
  }, []);

  useEffect(() => {
    if (engine.game) saveGameState(engine.game);
    else clearGameState();
  }, [engine.game]);

  useEffect(() => {
    const game = engine.game;
    if (!game) return;

    activeSequence.current?.abort();
    const abort = new AbortController();
    activeSequence.current = abort;
    const controller: AutomaticTurnController = {
      getState: () => game,
      getEvents: () => engine.events,
      dispatch: (command) => dispatchEngine({ type: 'COMMAND', command }),
      present: (step) => dispatchPresentation({ type: 'STEP', step }),
    };
    void runAutomaticTurn(controller, timing, abort.signal).catch((error: unknown) => {
      if (!isAbortError(error)) queueMicrotask(() => { throw error; });
    });

    return () => {
      abort.abort();
      if (activeSequence.current === abort) activeSequence.current = null;
    };
  }, [
    engine.game,
    engine.events,
    timing.banking,
    timing.bust,
    timing.dice,
    timing.roundTransition,
    timing.strategyReveal,
    timing.thinking,
  ]);

  const state = engine.game;
  const activeHumanId = state ? selectActiveHumanId(state) : undefined;
  return {
    state,
    presentation,
    rankings: state ? selectRankings(state) : [],
    winners: state ? selectWinners(state) : [],
    legalActions: state
      ? selectLegalActions(state, activeHumanId)
      : { canRoll: false, canStay: false, canBank: false, canAdvanceRound: false },
    currentPlayer: state ? selectCurrentPlayer(state) : undefined,
    decisionLabels: state ? selectDecisionLabels(state, activeHumanId) : undefined,
    activeHumanId,
    start,
    roll,
    advanceRound,
    advanceDecisions,
    submitDecision,
    restart,
    reset,
  };
};
