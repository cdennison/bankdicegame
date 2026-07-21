import { describe, expect, it } from 'vitest';

import { createConfig } from './config';
import { fourSeatFixture, playersFixture } from './fixtures';
import { createGame, transition } from './reducer';
import type { Command, GameConfig, GameState } from './types';

const game = (config: GameConfig = fourSeatFixture()): GameState => createGame(config);

const dispatch = (state: GameState, command: Command): GameState => {
  const result = transition(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.code);
  return result.state;
};

const rollAndCommit = (state: GameState): GameState =>
  dispatch(dispatch(state, { type: 'ROLL_DICE' }), { type: 'COMMIT_ROLL' });

const replayTwoSeatRound = (
  dice: readonly (readonly [number, number])[],
  decision: (state: GameState) => 'bank' | 'stay',
): { readonly scores: readonly number[]; readonly choices: readonly ('bank' | 'stay')[] } => {
  let state = game(playersFixture(2, { humans: [0, 1] }));
  const choices: ('bank' | 'stay')[] = [];
  for (const pair of dice) {
    state = dispatch(
      { ...state, phase: 'resolving-roll', pendingRoll: { dice: pair } },
      { type: 'COMMIT_ROLL' },
    );
    if (state.phase === 'round-complete') break;
    if (state.phase === 'awaiting-decisions') {
      const choice = decision(state);
      choices.push(choice);
      state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'seat-0', decision: choice });
      state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'seat-1', decision: choice });
      state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
      state = dispatch(state, { type: 'COMMIT_DECISIONS' });
      if (state.phase === 'round-complete') break;
    }
  }
  return { scores: state.players.map(({ score }) => score), choices };
};

const reject = (state: GameState, command: Command) => {
  expect(transition(state, command)).toEqual({
    ok: false,
    state,
    error: { code: 'COMMAND_NOT_ALLOWED', command: command.type, phase: state.phase },
  });
};

describe('complete reducer lifecycle', () => {
  const threeSeatGoldenFixture = (): GameConfig => {
    const result = createConfig({
      rounds: 10,
      seedCode: 'BK1-AAKD-JXV2',
      players: [
        { id: 'human', name: 'Human', seatIndex: 0, controller: { type: 'human' } },
        {
          id: 'mira', name: 'Mira', seatIndex: 1,
          controller: { type: 'strategy', strategyId: 'mira' },
        },
        {
          id: 'vega', name: 'Vega', seatIndex: 2,
          controller: { type: 'strategy', strategyId: 'vega' },
        },
      ],
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.config;
  };

  it('uses one seeded draw for the first starter and persists the advanced stream', () => {
    const state = game();

    expect(state.firstStarterIndex).toBe(1);
    expect(state.round.currentPlayerId).toBe('mira');
    expect(state.random.draws).toBe(1);
    expect(state.players.map(({ active }) => active)).toEqual([true, true, true, true]);
    reject(state, { type: 'COMMIT_ROLL' });
  });

  it('stages a roll for presentation and consumes exactly two subsequent draws', () => {
    const state = game();
    const rolled = transition(state, { type: 'ROLL_DICE' });

    expect(rolled.ok).toBe(true);
    if (!rolled.ok) return;
    expect(rolled.state.phase).toBe('resolving-roll');
    expect(rolled.state.random.draws).toBe(3);
    expect(rolled.events).toEqual([
      { type: 'DiceRolled', playerId: 'mira', dice: rolled.state.pendingRoll?.dice },
    ]);
    expect(Object.isFrozen(rolled.events[0])).toBe(true);
    reject(rolled.state, { type: 'ROLL_DICE' });
  });

  it('returns safe rolls one and two to awaiting-roll, then opens one frozen decision', () => {
    let state = game();
    state = rollAndCommit(state);
    expect(state.phase).toBe('awaiting-roll');
    expect(state.round.rollNumber).toBe(1);
    expect(state.round.currentPlayerId).toBe('guest');
    state = rollAndCommit(state);
    expect(state.phase).toBe('awaiting-roll');
    expect(state.round.currentPlayerId).toBe('vega');
    state = rollAndCommit(state);
    expect(state.phase).toBe('awaiting-decisions');
    expect(state.round.rollNumber).toBe(3);
    expect(Object.isFrozen(state.decisionSnapshot)).toBe(true);
    reject(state, { type: 'ROLL_DICE' });
  });

  it('records decisions without applying them and commits every bank simultaneously', () => {
    let state = game();
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    const pot = state.round.pot;
    const before = state.players;

    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'human', decision: 'bank' });
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'guest', decision: 'bank' });
    expect(state.players).toBe(before);
    expect(state.decisionSnapshot?.decisions).toMatchObject({ human: 'bank', guest: 'bank' });
    expect(state.decisionSnapshot?.pendingPlayerIds).toEqual(['mira', 'vega']);
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    expect(state.decisionSnapshot?.pendingPlayerIds).toEqual([]);
    const committed = transition(state, { type: 'COMMIT_DECISIONS' });
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(committed.events.filter(({ type }) => type === 'PlayerBanked')).toEqual([
      { type: 'PlayerBanked', playerId: 'human', amount: pot },
      { type: 'PlayerBanked', playerId: 'guest', amount: pot },
    ]);
    expect(committed.state.players[0]?.score).toBe(pot);
    expect(committed.state.players[2]?.score).toBe(pot);
    expect(committed.state.round.activePlayerIds).toEqual(['mira', 'vega']);
    expect(committed.state.round.currentPlayerId).toBe('mira');
    reject(committed.state, { type: 'SUBMIT_DECISION', playerId: 'human', decision: 'stay' });
  });

  it('prevents a banked seat from rolling or being selected until the next round', () => {
    let state = game();
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'human', decision: 'bank' });
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'guest', decision: 'bank' });
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    state = dispatch(state, { type: 'COMMIT_DECISIONS' });
    expect(state.round.currentPlayerId).not.toBe('human');
    expect(state.round.currentPlayerId).not.toBe('guest');
    expect(state.players[0]?.active).toBe(false);
  });

  it('advances exactly once after an all-stay decision', () => {
    let state = game(playersFixture(4, { humans: [0, 1, 2, 3] }));
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    expect(state.round.currentPlayerId).toBe('seat-3');
    for (const playerId of state.round.activePlayerIds) {
      state = dispatch(state, { type: 'SUBMIT_DECISION', playerId, decision: 'stay' });
    }
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    state = dispatch(state, { type: 'COMMIT_DECISIONS' });

    expect(state.round.currentPlayerId).toBe('seat-0');
  });

  it.each([2, 3, 4, 5, 6, 7, 8])('supports %i generic seats with no special human ID', (count) => {
    const config = playersFixture(count, { humans: [] });
    let state = game(config);

    expect(state.players).toHaveLength(count);
    expect(config.players.map(({ id }) => id)).toEqual(
      Array.from({ length: count }, (_, index) => `seat-${index}`),
    );
    expect(state.firstStarterIndex).toBeGreaterThanOrEqual(0);
    expect(state.firstStarterIndex).toBeLessThan(count);
    expect(state.round.activePlayerIds).toEqual(config.players.map(({ id }) => id));
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    expect(state.decisionSnapshot?.activePlayerIds).toHaveLength(count);
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    expect(Object.keys(state.decisionSnapshot?.decisions ?? {})).toHaveLength(count);
    state = dispatch(state, { type: 'COMMIT_DECISIONS' });
    expect(state.round.activePlayerIds.length).toBeGreaterThan(0);
    expect(state.round.activePlayerIds).toContain(state.round.currentPlayerId);
  });

  it('continues through another AI-only decision cycle after every human banks', () => {
    let state = game();
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'human', decision: 'bank' });
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'guest', decision: 'bank' });
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    state = dispatch(state, { type: 'COMMIT_DECISIONS' });
    const draws = state.random.draws;
    state = rollAndCommit(state);
    expect(state.random.draws).toBe(draws + 2);
    if (state.phase === 'awaiting-decisions') {
      expect(state.decisionSnapshot?.activePlayerIds).toEqual(['mira', 'vega']);
      state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
      expect(state.decisionSnapshot?.pendingPlayerIds).toEqual([]);
      state = dispatch(state, { type: 'COMMIT_DECISIONS' });
      expect(['awaiting-roll', 'round-complete']).toContain(state.phase);
    }
  });

  it('restarts a completed game from the same code and deterministic starter', () => {
    const initial = game();
    const complete = {
      ...initial,
      phase: 'game-complete' as const,
      players: initial.players.map((player, index) => ({ ...player, score: index * 10 })),
    };

    expect(transition(complete, { type: 'RESTART' })).toEqual({
      ok: true,
      state: initial,
      events: [],
    });
  });

  it('reports every tied winner when round ten completes', () => {
    const initial = game(playersFixture(2, { humans: [0, 1] }));
    const state = {
      ...initial,
      phase: 'round-complete' as const,
      round: { ...initial.round, roundNumber: 10 },
      players: initial.players.map((player) => ({ ...player, score: 78 })),
    };
    const result = transition(state, { type: 'ADVANCE_ROUND' });

    expect(result).toEqual({
      ok: true,
      state: expect.objectContaining({ phase: 'game-complete' }),
      events: [{ type: 'GameCompleted', winnerIds: ['seat-0', 'seat-1'] }],
    });
  });

  it('ends a round on a danger seven without changing any score', () => {
    const initial = game(playersFixture(2, { humans: [0, 1] }));
    const state = {
      ...initial,
      phase: 'resolving-roll' as const,
      round: { ...initial.round, pot: 78, rollNumber: 3 },
      pendingRoll: { dice: [1, 6] as const },
    };
    const result = transition(state, { type: 'COMMIT_ROLL' });

    expect(result).toEqual({
      ok: true,
      state: expect.objectContaining({
        phase: 'round-complete',
        players: initial.players,
      }),
      events: [
        { type: 'RoundBusted', roundNumber: 1, pot: 78 },
        { type: 'RoundCompleted', roundNumber: 1 },
      ],
    });
  });

  it('reactivates every banked player and rotates from the original starter', () => {
    const initial = game(playersFixture(3, { humans: [0, 1, 2] }));
    const completed = {
      ...initial,
      phase: 'round-complete' as const,
      players: initial.players.map((player) => ({ ...player, active: false })),
      round: { ...initial.round, activePlayerIds: [] },
    };
    const advanced = transition(completed, { type: 'ADVANCE_ROUND' });

    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    expect(advanced.state.players.every(({ active }) => active)).toBe(true);
    expect(advanced.state.round.activePlayerIds).toEqual(['seat-0', 'seat-1', 'seat-2']);
    expect(advanced.state.round.currentPlayerId).toBe('seat-0');
  });

  it('completes the round when every active player banks and orders bank events first', () => {
    let state = game(playersFixture(2, { humans: [0, 1] }));
    state = rollAndCommit(rollAndCommit(rollAndCommit(state)));
    const pot = state.round.pot;
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'seat-0', decision: 'bank' });
    state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'seat-1', decision: 'bank' });
    state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
    const result = transition(state, { type: 'COMMIT_DECISIONS' });

    expect(result).toEqual({
      ok: true,
      state: expect.objectContaining({ phase: 'round-complete' }),
      events: [
        { type: 'PlayerBanked', playerId: 'seat-0', amount: pot },
        { type: 'PlayerBanked', playerId: 'seat-1', amount: pot },
        { type: 'RoundCompleted', roundNumber: 1 },
      ],
    });
  });

  it('returns the exact unchanged state for an illegal command in every phase', () => {
    const initial = game();
    const phases: readonly [GameState['phase'], Command][] = [
      ['awaiting-roll', { type: 'COMMIT_ROLL' }],
      ['resolving-roll', { type: 'ADVANCE_ROUND' }],
      ['awaiting-decisions', { type: 'ROLL_DICE' }],
      ['resolving-decisions', { type: 'ROLL_DICE' }],
      ['round-complete', { type: 'ROLL_DICE' }],
      ['game-complete', { type: 'ROLL_DICE' }],
    ];

    for (const [phase, command] of phases) {
      const phased = { ...initial, phase };
      const result = transition(phased, command);
      expect(result).toEqual({
        ok: false,
        state: phased,
        error: { code: 'COMMAND_NOT_ALLOWED', command: command.type, phase },
      });
      if (!result.ok) expect(result.state).toBe(phased);
    }
  });

  it('matches the checked-in ten-round BK1 golden game', () => {
    let state = game(threeSeatGoldenFixture());
    expect(state.firstStarterIndex).toBe(2);

    for (let commands = 0; state.phase !== 'game-complete' && commands < 1_000; commands += 1) {
      if (state.phase === 'awaiting-roll') state = dispatch(state, { type: 'ROLL_DICE' });
      else if (state.phase === 'resolving-roll') state = dispatch(state, { type: 'COMMIT_ROLL' });
      else if (state.phase === 'awaiting-decisions') {
        if (state.round.activePlayerIds.includes('human')) {
          state = dispatch(state, { type: 'SUBMIT_DECISION', playerId: 'human', decision: 'bank' });
        }
        state = dispatch(state, { type: 'RESOLVE_STRATEGY_DECISIONS' });
      } else if (state.phase === 'resolving-decisions') {
        state = dispatch(state, { type: 'COMMIT_DECISIONS' });
      } else if (state.phase === 'round-complete') {
        state = dispatch(state, { type: 'ADVANCE_ROUND' });
      }
    }

    expect(state.phase).toBe('game-complete');
    expect(state.players.map(({ score }) => score)).toEqual([458, 780, 360]);
  });

  it.each([
    {
      name: 'safe seven worth 70',
      dice: [[3, 4], [1, 2], [2, 3]] as const,
      choice: (state: GameState) => state.round.rollNumber === 3 ? 'bank' as const : 'stay' as const,
      scores: [78, 78],
      choices: ['bank'],
    },
    {
      name: 'danger seven bust',
      dice: [[1, 2], [2, 3], [3, 4], [1, 6]] as const,
      choice: () => 'stay' as const,
      scores: [0, 0],
      choices: ['stay'],
    },
    {
      name: 'danger double',
      dice: [[1, 2], [2, 3], [3, 4], [4, 4]] as const,
      choice: (state: GameState) => state.round.dangerRolls === 1 ? 'bank' as const : 'stay' as const,
      scores: [156, 156],
      choices: ['stay', 'bank'],
    },
  ])('matches the Python golden fixture: $name', ({ dice, choice, scores, choices }) => {
    expect(replayTwoSeatRound(dice, choice)).toEqual({ scores, choices });
  });

  it('validates fixture construction through the public config contract', () => {
    expect(createConfig({ rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: [] }).ok).toBe(false);
  });
});
