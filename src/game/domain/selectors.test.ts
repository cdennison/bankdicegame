import { describe, expect, it } from 'vitest';

import { freezeDecisionSnapshot } from './decisions';
import { fourSeatFixture, stateAtDecision } from './fixtures';
import { createGame } from './reducer';
import {
  selectActiveHumanId,
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
        canAdvanceRound: false,
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
      canAdvanceRound: false,
    });
  });

  it.each([
    'awaiting-roll',
    'resolving-roll',
    'awaiting-decisions',
    'resolving-decisions',
    'game-complete',
  ] as const)('does not allow advancing the round while %s', (phase) => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      phase,
      players: Object.freeze(
        initial.players.map((player) =>
          player.id === 'human' ? Object.freeze({ ...player, active: false }) : player,
        ),
      ),
    });

    expect(selectLegalActions(state, 'human').canAdvanceRound).toBe(false);
  });

  it('exposes advancing as the only legal action when the round is complete', () => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      phase: 'round-complete',
      players: Object.freeze(
        initial.players.map((player) =>
          player.id === 'human' ? Object.freeze({ ...player, active: false }) : player,
        ),
      ),
    });

    expect(selectLegalActions(state, 'human')).toEqual({
      canRoll: false,
      canStay: false,
      canBank: false,
      canAdvanceRound: true,
    });
  });

  it('does not expose a next-round action after the configured final round', () => {
    const initial = createGame(fourSeatFixture());
    const state = withState(initial, {
      phase: 'round-complete',
      round: Object.freeze({ ...initial.round, roundNumber: initial.config.rounds }),
    });

    expect(selectLegalActions(state, 'human').canAdvanceRound).toBe(false);
  });

  describe('selectActiveHumanId (hot-seat resolution across multiple humans)', () => {
    it('returns the human whose turn it is to roll', () => {
      const initial = createGame(fourSeatFixture());
      const state = withState(initial, {
        round: Object.freeze({ ...initial.round, currentPlayerId: 'guest' }),
      });

      expect(selectActiveHumanId(state)).toBe('guest');
    });

    it('returns undefined while a strategy seat is on the clock', () => {
      const initial = createGame(fourSeatFixture());
      const state = withState(initial, {
        round: Object.freeze({ ...initial.round, currentPlayerId: 'mira' }),
      });

      expect(selectActiveHumanId(state)).toBeUndefined();
    });

    it('serializes two pending humans one at a time during awaiting-decisions', () => {
      const initial = stateAtDecision(fourSeatFixture(), { pot: 40, scores: [0, 0, 0, 0] });
      const snapshot = freezeDecisionSnapshot(initial);
      const bothPending = withState(initial, { decisionSnapshot: snapshot });

      expect(snapshot.pendingPlayerIds).toEqual(['human', 'mira', 'guest', 'vega']);
      expect(selectActiveHumanId(bothPending)).toBe('human');

      const humanDecided = withState(initial, {
        decisionSnapshot: Object.freeze({
          ...snapshot,
          decisions: Object.freeze({ human: 'stay' as const }),
        }),
      });

      expect(selectActiveHumanId(humanDecided)).toBe('guest');
    });

    it('feeds the resolved active human into legal actions and decision labels without an explicit id', () => {
      const initial = stateAtDecision(fourSeatFixture(), { pot: 40, scores: [0, 0, 0, 0] });
      const snapshot = freezeDecisionSnapshot(initial);
      const state = withState(initial, {
        decisionSnapshot: Object.freeze({
          ...snapshot,
          decisions: Object.freeze({ human: 'stay' as const }),
        }),
      });

      expect(selectLegalActions(state)).toEqual({
        canRoll: false,
        canStay: true,
        canBank: true,
        canAdvanceRound: false,
      });
      expect(selectDecisionLabels(state)).toEqual({ stay: 'Roll On', bank: 'Bank' });
    });
  });
});
