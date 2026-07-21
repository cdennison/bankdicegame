import { afterEach, describe, expect, it, vi } from 'vitest';

import { freezeDecisionSnapshot } from '../domain/decisions';
import { playersFixture, stateAtDecision } from '../domain/fixtures';
import { createGame, transition } from '../domain/reducer';
import type { Command, GameState } from '../domain/types';
import { delay, runAutomaticTurn, type AutomaticTurnController } from './aiTurnRunner';

const timing = { thinking: 20, dice: 30, strategyReveal: 40, roundTransition: 50 };

const createController = (initial: GameState) => {
  let state = initial;
  const trace: string[] = [];
  const controller: AutomaticTurnController = {
    getState: () => state,
    dispatch(command: Command) {
      trace.push(command.type);
      const result = transition(state, command);
      if (!result.ok) throw new Error(`Rejected ${command.type}`);
      state = result.state;
    },
    present(mode) {
      trace.push(mode);
    },
  };
  return { controller, trace, getState: () => state };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('automatic turn runner', () => {
  it('shows AI thinking before rolling', async () => {
    vi.useFakeTimers();
    const setup = createController(createGame(playersFixture(2, { humans: [] })));
    const running = runAutomaticTurn(setup.controller, timing, new AbortController().signal);

    expect(setup.trace).toEqual(['thinking']);
    await vi.advanceTimersByTimeAsync(19);
    expect(setup.trace).toEqual(['thinking']);
    await vi.advanceTimersByTimeAsync(1);
    await running;
    expect(setup.trace).toEqual(['thinking', 'ROLL_DICE']);
  });

  it('shows the dice animation before committing a staged roll', async () => {
    vi.useFakeTimers();
    const initial = createGame(playersFixture(2));
    const staged = transition(initial, { type: 'ROLL_DICE' });
    if (!staged.ok) throw new Error('fixture roll rejected');
    const setup = createController(staged.state);
    const running = runAutomaticTurn(setup.controller, timing, new AbortController().signal);

    expect(setup.trace).toEqual(['rolling']);
    await vi.advanceTimersByTimeAsync(30);
    await running;
    expect(setup.trace).toEqual(['rolling', 'COMMIT_ROLL']);
  });

  it('reveals strategy decisions before committing them', async () => {
    vi.useFakeTimers();
    const waiting = stateAtDecision(playersFixture(2, { humans: [] }), {
      pot: 250,
      scores: [0, 0],
    });
    const withSnapshot = Object.freeze({
      ...waiting,
      decisionSnapshot: freezeDecisionSnapshot(waiting),
    });
    const resolved = transition(withSnapshot, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    if (!resolved.ok) throw new Error('fixture decisions rejected');
    const setup = createController(resolved.state);
    const running = runAutomaticTurn(setup.controller, timing, new AbortController().signal);

    expect(setup.trace).toEqual(['revealing']);
    await vi.advanceTimersByTimeAsync(40);
    await running;
    expect(setup.trace).toEqual(['revealing', 'COMMIT_DECISIONS']);
  });

  it.each([
    ['awaiting roll', () => createGame(playersFixture(2, { humans: [] }))],
    ['staged roll', () => {
      const result = transition(createGame(playersFixture(2)), { type: 'ROLL_DICE' });
      if (!result.ok) throw new Error('fixture roll rejected');
      return result.state;
    }],
    ['strategy reveal', () => {
      const waiting = stateAtDecision(playersFixture(2, { humans: [] }), {
        pot: 250,
        scores: [0, 0],
      });
      const result = transition(
        Object.freeze({ ...waiting, decisionSnapshot: freezeDecisionSnapshot(waiting) }),
        { type: 'RESOLVE_STRATEGY_DECISIONS' },
      );
      if (!result.ok) throw new Error('fixture decisions rejected');
      return result.state;
    }],
    ['round transition', () => Object.freeze({
      ...createGame(playersFixture(2)),
      phase: 'round-complete' as const,
    })],
  ])('dispatches nothing pending after cancellation during %s', async (_name, initial) => {
    vi.useFakeTimers();
    const setup = createController(initial());
    const abort = new AbortController();
    const running = runAutomaticTurn(setup.controller, timing, abort.signal);
    abort.abort();
    await expect(running).rejects.toMatchObject({ name: 'AbortError' });
    await vi.runAllTimersAsync();
    expect(setup.trace).toHaveLength(1);
  });

  it('delay rejects immediately when its signal is already aborted', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(delay(100, abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
