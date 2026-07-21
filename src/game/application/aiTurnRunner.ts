import type { Command, GameState } from '../domain/types';
import type { GameTiming } from './timing';

export type PresentationMode =
  | 'idle'
  | 'thinking'
  | 'rolling'
  | 'revealing'
  | 'round-transition';

export interface AutomaticTurnController {
  getState(): GameState;
  dispatch(command: Command): void;
  present(mode: PresentationMode): void;
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

export const runAutomaticTurn = async (
  controller: AutomaticTurnController,
  timing: GameTiming,
  signal: AbortSignal,
): Promise<void> => {
  assertActive(signal);
  const state = controller.getState();

  if (
    state.phase === 'awaiting-roll' &&
    isStrategy(state, state.round.currentPlayerId)
  ) {
    controller.present('thinking');
    await delay(timing.thinking, signal);
    assertActive(signal);
    controller.dispatch({ type: 'ROLL_DICE' });
    return;
  }

  if (state.phase === 'resolving-roll') {
    controller.present('rolling');
    await delay(timing.dice, signal);
    assertActive(signal);
    controller.dispatch({ type: 'COMMIT_ROLL' });
    return;
  }

  if (state.phase === 'awaiting-decisions' && !hasPendingHuman(state)) {
    controller.dispatch({ type: 'RESOLVE_STRATEGY_DECISIONS' });
    return;
  }

  if (state.phase === 'resolving-decisions') {
    controller.present('revealing');
    await delay(timing.strategyReveal, signal);
    assertActive(signal);
    controller.dispatch({ type: 'COMMIT_DECISIONS' });
    return;
  }

  if (state.phase === 'round-complete') {
    controller.present('round-transition');
    await delay(timing.roundTransition, signal);
    assertActive(signal);
    controller.dispatch({ type: 'ADVANCE_ROUND' });
  }
};
