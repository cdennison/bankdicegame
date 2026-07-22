import { afterEach, describe, expect, it, vi } from 'vitest';

import { freezeDecisionSnapshot } from '../domain/decisions';
import { playersFixture, stateAtDecision } from '../domain/fixtures';
import { createGame, transition } from '../domain/reducer';
import type { Command, DomainEvent, GameState } from '../domain/types';
import {
  delay,
  runAutomaticTurn,
  type AutomaticTurnController,
  type PresentationStep,
} from './aiTurnRunner';

const timing = {
  thinking: 20,
  dice: 30,
  strategyReveal: 40,
  roundTransition: 50,
  banking: 60,
  bust: 70,
};

const createController = (
  initial: GameState,
  events: readonly DomainEvent[] = [],
) => {
  let state = initial;
  const trace: string[] = [];
  const presentations: PresentationStep[] = [];
  const controller: AutomaticTurnController = {
    getState: () => state,
    getEvents: () => events,
    dispatch(command: Command) {
      trace.push(command.type);
      const result = transition(state, command);
      if (!result.ok) throw new Error(`Rejected ${command.type}`);
      state = result.state;
    },
    present(step) {
      presentations.push(step);
      trace.push(step.mode);
    },
  };
  return { controller, presentations, trace, getState: () => state };
};

const committedBanks = () => {
  const waiting = stateAtDecision(playersFixture(4, { humans: [0, 2] }), {
    pot: 80,
    scores: [0, 0, 0, 0],
  });
  const snapshot = freezeDecisionSnapshot(waiting);
  const resolving = Object.freeze({
    ...waiting,
    phase: 'resolving-decisions' as const,
    decisionSnapshot: Object.freeze({
      ...snapshot,
      pendingPlayerIds: Object.freeze([]),
      decisions: Object.freeze({
        'seat-0': 'bank' as const,
        'seat-1': 'stay' as const,
        'seat-2': 'bank' as const,
        'seat-3': 'stay' as const,
      }),
    }),
  });
  const result = transition(resolving, { type: 'COMMIT_DECISIONS' });
  if (!result.ok) throw new Error('fixture bank commit rejected');
  return result;
};

const completedBust = () => {
  const initial = createGame(playersFixture(2));
  const resolving = Object.freeze({
    ...initial,
    phase: 'resolving-roll' as const,
    round: Object.freeze({ ...initial.round, rollNumber: 3, pot: 120 }),
    pendingRoll: Object.freeze({ dice: [3, 4] as const }),
  });
  const result = transition(resolving, { type: 'COMMIT_ROLL' });
  if (!result.ok) throw new Error('fixture bust commit rejected');
  return result;
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

  it('presents simultaneous banks in event order before subsequent AI thinking', async () => {
    vi.useFakeTimers();
    const committed = committedBanks();
    const setup = createController(committed.state, committed.events);
    const running = runAutomaticTurn(setup.controller, timing, new AbortController().signal);

    expect(setup.trace).toEqual(['banking']);
    expect(setup.presentations[0]).toMatchObject({
      narration: 'Seat 1 banked 80 points.',
      event: { type: 'PlayerBanked', playerId: 'seat-0', amount: 80 },
    });
    await vi.advanceTimersByTimeAsync(60);
    expect(setup.trace).toEqual(['banking', 'banking']);
    expect(setup.presentations[1]).toMatchObject({
      narration: 'Seat 3 banked 80 points.',
      event: { type: 'PlayerBanked', playerId: 'seat-2', amount: 80 },
    });
    await vi.advanceTimersByTimeAsync(60);
    expect(setup.trace).toEqual(['banking', 'banking', 'thinking']);
    await vi.advanceTimersByTimeAsync(20);
    await running;
    expect(setup.trace.at(-1)).toBe('ROLL_DICE');
  });

  it('presents a meaningful bust and round completion without advancing the round', async () => {
    vi.useFakeTimers();
    const busted = completedBust();
    const setup = createController(busted.state, busted.events);
    const running = runAutomaticTurn(setup.controller, timing, new AbortController().signal);

    expect(setup.trace).toEqual(['bust']);
    expect(setup.presentations[0]).toMatchObject({
      narration: 'Round 1 busted. The pot is lost.',
      event: { type: 'RoundBusted', roundNumber: 1 },
    });
    await vi.advanceTimersByTimeAsync(70);
    expect(setup.trace).toEqual(['bust', 'round-transition']);
    expect(setup.presentations[1]).toMatchObject({
      narration: 'Round 1 complete.',
      event: { type: 'RoundCompleted', roundNumber: 1 },
    });
    await vi.runAllTimersAsync();
    await running;
    expect(setup.trace).toEqual(['bust', 'round-transition']);
    expect(setup.getState().phase).toBe('round-complete');
  });

  it('presents an unreported round completion without scheduling advancement', async () => {
    vi.useFakeTimers();
    const initial = Object.freeze({
      ...createGame(playersFixture(2)),
      phase: 'round-complete' as const,
    });
    const setup = createController(initial);

    await runAutomaticTurn(setup.controller, timing, new AbortController().signal);
    await vi.runAllTimersAsync();

    expect(setup.trace).toEqual(['round-transition']);
    expect(setup.getState()).toBe(initial);
  });

  it.each([
    ['banking', committedBanks],
    ['bust', completedBust],
  ])('cancellation during %s prevents later presentation and domain dispatch', async (_name, result) => {
    vi.useFakeTimers();
    const completed = result();
    const setup = createController(completed.state, completed.events);
    const abort = new AbortController();
    const running = runAutomaticTurn(setup.controller, timing, abort.signal);
    abort.abort();

    await expect(running).rejects.toMatchObject({ name: 'AbortError' });
    await vi.runAllTimersAsync();
    expect(setup.trace).toHaveLength(1);
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
