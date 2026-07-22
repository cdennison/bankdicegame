import { describe, expect, it } from 'vitest';

import { applyDecisions, freezeDecisionSnapshot } from './decisions';
import { fourSeatFixture, stateAtDecision } from './fixtures';

describe('simultaneous decisions', () => {
  it('freezes one shared view of the pot, scores, and active seats', () => {
    const state = stateAtDecision(fourSeatFixture(), {
      pot: 78,
      scores: [10, 20, 30, 40],
    });

    const snapshot = freezeDecisionSnapshot(state);

    expect(snapshot).toEqual({
      pot: 78,
      scores: { human: 10, mira: 20, guest: 30, vega: 40 },
      activePlayerIds: ['human', 'mira', 'guest', 'vega'],
      pendingPlayerIds: ['human', 'mira', 'guest', 'vega'],
      decisions: {},
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.scores)).toBe(true);
    expect(Object.isFrozen(snapshot.activePlayerIds)).toBe(true);
  });

  it('credits all bankers with the identical frozen pot and removes them together', () => {
    const state = stateAtDecision(fourSeatFixture(), {
      pot: 78,
      scores: [10, 20, 30, 40],
    });
    const next = applyDecisions(state, { human: 'bank', guest: 'bank' });

    expect(next.players.map(({ score }) => score)).toEqual([88, 20, 108, 40]);
    expect(next.round.activePlayerIds).toEqual(['mira', 'vega']);
    expect(state.players.map(({ score }) => score)).toEqual([10, 20, 30, 40]);
    expect(state.round.activePlayerIds).toEqual(['human', 'mira', 'guest', 'vega']);
  });
});
