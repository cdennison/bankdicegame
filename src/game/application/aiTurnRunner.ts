import type { Command, DomainEvent, GameState } from '../domain/types';
import type { GameTiming } from './timing';

export type PresentationMode =
  | 'idle'
  | 'thinking'
  | 'rolling'
  | 'revealing'
  | 'banking'
  | 'bust'
  | 'game-complete'
  | 'round-transition';

export interface PresentationStep {
  readonly mode: PresentationMode;
  readonly narration?: string;
  readonly event?: DomainEvent;
}

export interface AutomaticTurnController {
  getState(): GameState;
  getEvents(): readonly DomainEvent[];
  dispatch(command: Command): void;
  present(step: PresentationStep): void;
}

const abortError = (): DOMException => new DOMException('The operation was aborted.', 'AbortError');

const assertActive = (signal: AbortSignal): void => {
  if (signal.aborted) throw abortError();
};

export const delay = (ms: number, signal: AbortSignal): Promise<void> => {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
};

const isStrategy = (state: GameState, playerId: string): boolean =>
  state.config.players.find(({ id }) => id === playerId)?.controller.type === 'strategy';

const hasPendingHuman = (state: GameState): boolean =>
  state.decisionSnapshot?.pendingPlayerIds.some((playerId) =>
    state.config.players.some(
      ({ id, controller }) => id === playerId && controller.type === 'human',
    ),
  ) ?? false;

const playerName = (state: GameState, playerId: string): string =>
  state.config.players.find(({ id }) => id === playerId)?.name ?? 'Player';

const presentEvents = async (
  controller: AutomaticTurnController,
  events: readonly DomainEvent[],
  state: GameState,
  timing: GameTiming,
  signal: AbortSignal,
): Promise<{ readonly dice: boolean; readonly roundComplete: boolean }> => {
  let dice = false;
  let roundComplete = false;
  for (const event of events) {
    assertActive(signal);
    if (event.type === 'DiceRolled') {
      dice = true;
      controller.present({
        mode: 'rolling',
        narration: `${playerName(state, event.playerId)} rolled ${event.dice[0]} and ${event.dice[1]}.`,
        event,
      });
      await delay(timing.dice, signal);
    } else if (event.type === 'PlayerBanked') {
      controller.present({
        mode: 'banking',
        narration: `${playerName(state, event.playerId)} banked ${event.amount} points.`,
        event,
      });
      await delay(timing.banking, signal);
    } else if (event.type === 'RoundBusted') {
      controller.present({
        mode: 'bust',
        narration: `Round ${event.roundNumber} busted. The pot is lost.`,
        event,
      });
      await delay(timing.bust, signal);
    } else if (event.type === 'RoundCompleted') {
      roundComplete = true;
      controller.present({
        mode: 'round-transition',
        narration: `Round ${event.roundNumber} complete.`,
        event,
      });
    } else if (event.type === 'GameCompleted') {
      const names = event.winnerIds.map((id) => playerName(state, id)).join(' and ');
      controller.present({
        mode: 'game-complete',
        narration: `${names} ${event.winnerIds.length === 1 ? 'wins' : 'win'} the game.`,
        event,
      });
    }
  }
  return { dice, roundComplete };
};

export const runAutomaticTurn = async (
  controller: AutomaticTurnController,
  timing: GameTiming,
  signal: AbortSignal,
): Promise<void> => {
  assertActive(signal);
  const state = controller.getState();
  const events = controller.getEvents();
  const presented = events.length > 0
    ? await presentEvents(controller, events, state, timing, signal)
    : { dice: false, roundComplete: false };
  assertActive(signal);

  if (
    state.phase === 'awaiting-roll' &&
    isStrategy(state, state.round.currentPlayerId)
  ) {
    controller.present({
      mode: 'thinking',
      narration: `${playerName(state, state.round.currentPlayerId)} is thinking.`,
    });
    await delay(timing.thinking, signal);
    assertActive(signal);
    controller.dispatch({ type: 'ROLL_DICE' });
    return;
  }

  if (state.phase === 'resolving-roll') {
    if (!presented.dice) {
      controller.present({
        mode: 'rolling',
        narration: `${playerName(state, state.round.currentPlayerId)} is rolling.`,
      });
      await delay(timing.dice, signal);
    }
    assertActive(signal);
    controller.dispatch({ type: 'COMMIT_ROLL' });
    return;
  }

  if (state.phase === 'awaiting-decisions' && !hasPendingHuman(state)) {
    controller.dispatch({ type: 'RESOLVE_STRATEGY_DECISIONS' });
    return;
  }

  if (state.phase === 'resolving-decisions') {
    controller.present({ mode: 'revealing', narration: 'Opponents are choosing.' });
    await delay(timing.strategyReveal, signal);
    assertActive(signal);
    controller.dispatch({ type: 'COMMIT_DECISIONS' });
    return;
  }

  if (state.phase === 'round-complete') {
    if (!presented.roundComplete) {
      controller.present({
        mode: 'round-transition',
        narration: `Round ${state.round.roundNumber} complete.`,
      });
    }
    await delay(timing.roundTransition, signal);
    assertActive(signal);
    controller.dispatch({ type: 'ADVANCE_ROUND' });
    return;
  }

  if (state.phase !== 'game-complete') controller.present({ mode: 'idle' });
};
