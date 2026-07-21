import { describe, expect, it } from 'vitest';

import { freezeDecisionSnapshot } from './decisions';
import { fourSeatFixture, stateAtDecision } from './fixtures';
import { createGame } from './reducer';
import {
  selectCurrentPlayer,
  selectDecisionLabels,
  selectLegalActions,
  selectRankings,
  selectWinners,
} from './selectors';
import type { GameState } from './types';

const withState = (state: GameState, patch: Partial<GameState>): GameState =>
  Object.freeze({ ...state, ...patch });

describe('game selectors', () => {
  it('ranks ties stably in seat order with competition ranks', () => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      players: Object.freeze([
        { id: 'human', score: 40, active: true },
        { id: 'mira', score: 90, active: true },
        { id: 'guest', score: 90, active: true },
        { id: 'vega', score: 10, active: true },
      ]),
    });

    expect(selectRankings(state).map(({ id, rank }) => [id, rank])).toEqual([
      ['mira', 1],
      ['guest', 1],
      ['human', 3],
      ['vega', 4],
    ]);
  });

  it('returns every tied winner after the game completes', () => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      phase: 'game-complete',
      players: Object.freeze([
        { id: 'human', score: 100, active: true },
        { id: 'mira', score: 25, active: true },
        { id: 'guest', score: 100, active: true },
        { id: 'vega', score: 80, active: true },
      ]),
    });

    expect(selectWinners(state).map(({ id }) => id)).toEqual(['human', 'guest']);
  });

  it.each(['resolving-roll', 'resolving-decisions'] as const)(
    'exposes no direct actions while %s',
    (phase) => {
      const initial = createGame(fourSeatFixture());
      const state = withState(initial, { phase });
      expect(selectLegalActions(state, 'human')).toEqual({
        canRoll: false,
        canStay: false,
        canBank: false,
      });
    },
  );

  it('labels staying as Roll On when the human is the next roller', () => {
    const initial = stateAtDecision(fourSeatFixture(), { pot: 40, scores: [0, 0, 0, 0] });
    const state = withState(initial, {
      round: Object.freeze({ ...initial.round, currentPlayerId: 'vega' }),
      decisionSnapshot: freezeDecisionSnapshot(initial),
    });

    expect(selectCurrentPlayer(state)?.id).toBe('vega');
    expect(selectDecisionLabels(state, 'human')).toEqual({ stay: 'Roll On', bank: 'Bank' });
  });

  it('labels staying as Stay In when a strategy is the next roller', () => {
    const initial = stateAtDecision(fourSeatFixture(), { pot: 40, scores: [0, 0, 0, 0] });
    const state = withState(initial, {
      round: Object.freeze({ ...initial.round, currentPlayerId: 'human' }),
      decisionSnapshot: freezeDecisionSnapshot(initial),
    });

    expect(selectDecisionLabels(state, 'human')).toEqual({ stay: 'Stay In', bank: 'Bank' });
  });

  it('returns no decision labels after every player has banked', () => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      phase: 'round-complete',
      round: Object.freeze({ ...initial.round, activePlayerIds: Object.freeze([]) }),
    });

    expect(selectDecisionLabels(state, 'human')).toBeUndefined();
  });

  it('removes direct actions as soon as the released human banks', () => {
    const initial = stateAtDecision(fourSeatFixture(), { pot: 40, scores: [0, 0, 0, 0] });
    const snapshot = freezeDecisionSnapshot(initial);
    const state = withState(initial, {
      decisionSnapshot: Object.freeze({
        ...snapshot,
        pendingPlayerIds: Object.freeze(snapshot.pendingPlayerIds.filter((id) => id !== 'human')),
        decisions: Object.freeze({ human: 'bank' as const }),
      }),
    });

    expect(selectLegalActions(state, 'human')).toEqual({
      canRoll: false,
      canStay: false,
      canBank: false,
    });
  });
});
