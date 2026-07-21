import { useCallback, useEffect, useReducer, useRef } from 'react';

import { createGame, transition } from '../domain/reducer';
import {
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
} from './aiTurnRunner';
import { TIMING, type GameTiming } from './timing';

interface EngineState {
  readonly game: GameState | null;
  readonly events: readonly DomainEvent[];
}

type EngineAction =
  | { readonly type: 'START'; readonly config: GameConfig }
  | { readonly type: 'COMMAND'; readonly command: Command };

const engineReducer = (current: EngineState, action: EngineAction): EngineState => {
  if (action.type === 'START') return { game: createGame(action.config), events: [] };
  if (!current.game) return current;
  const result = transition(current.game, action.command);
  return result.ok ? { game: result.state, events: result.events } : current;
};

export interface PresentationState {
  readonly mode: PresentationMode;
  readonly narration: string;
  readonly events: readonly DomainEvent[];
}

type PresentationAction =
  | { readonly type: 'MODE'; readonly mode: PresentationMode }
  | { readonly type: 'EVENTS'; readonly events: readonly DomainEvent[] }
  | { readonly type: 'RESET' };

const initialPresentation: PresentationState = {
  mode: 'idle',
  narration: '',
  events: [],
};

const presentationReducer = (
  current: PresentationState,
  action: PresentationAction,
): PresentationState => {
  if (action.type === 'RESET') return initialPresentation;
  if (action.type === 'MODE') return { ...current, mode: action.mode };
  return {
    ...current,
    events: action.events,
    narration: action.events.at(-1)?.type ?? '',
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
  start(config: GameConfig): void;
  roll(): void;
  submitDecision(playerId: PlayerId, decision: Decision): void;
  restart(): void;
}

export interface GameControllerOptions {
  readonly timing?: GameTiming;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

export const useGameController = (
  options: GameControllerOptions = {},
): GameController => {
  const timing = options.timing ?? TIMING;
  const [engine, dispatchEngine] = useReducer(engineReducer, { game: null, events: [] });
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

  const submitDecision = useCallback((playerId: PlayerId, decision: Decision) => {
    dispatchEngine({
      type: 'COMMAND',
      command: { type: 'SUBMIT_DECISION', playerId, decision },
    });
  }, []);

  const restart = useCallback(() => {
    activeSequence.current?.abort();
    dispatchPresentation({ type: 'RESET' });
    if (engine.game) dispatchEngine({ type: 'START', config: engine.game.config });
  }, [engine.game]);

  useEffect(() => {
    dispatchPresentation({ type: 'EVENTS', events: engine.events });
  }, [engine.events]);

  useEffect(() => {
    const game = engine.game;
    if (!game) return;

    activeSequence.current?.abort();
    const abort = new AbortController();
    activeSequence.current = abort;
    dispatchPresentation({ type: 'MODE', mode: 'idle' });
    const controller: AutomaticTurnController = {
      getState: () => game,
      dispatch: (command) => dispatchEngine({ type: 'COMMAND', command }),
      present: (mode) => dispatchPresentation({ type: 'MODE', mode }),
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
    timing.dice,
    timing.roundTransition,
    timing.strategyReveal,
    timing.thinking,
  ]);

  const state = engine.game;
  return {
    state,
    presentation,
    rankings: state ? selectRankings(state) : [],
    winners: state ? selectWinners(state) : [],
    legalActions: state
      ? selectLegalActions(state)
      : { canRoll: false, canStay: false, canBank: false },
    currentPlayer: state ? selectCurrentPlayer(state) : undefined,
    decisionLabels: state ? selectDecisionLabels(state) : undefined,
    start,
    roll,
    submitDecision,
    restart,
  };
};
