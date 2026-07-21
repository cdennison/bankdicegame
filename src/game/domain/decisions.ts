import type { Decision, DecisionSnapshot, GameState, PlayerId } from './types';

const frozenIds = (ids: readonly PlayerId[]): readonly PlayerId[] =>
  Object.freeze([...ids]);

export const freezeDecisionSnapshot = (state: GameState): DecisionSnapshot => {
  const activePlayerIds = frozenIds(state.round.activePlayerIds);
  return Object.freeze({
    pot: state.round.pot,
    scores: Object.freeze(
      Object.fromEntries(state.players.map(({ id, score }) => [id, score])),
    ),
    activePlayerIds,
    pendingPlayerIds: frozenIds(activePlayerIds),
    decisions: Object.freeze({}),
  });
};

export const applyDecisions = (
  state: GameState,
  decisions: Readonly<Partial<Record<PlayerId, Decision>>>,
): GameState => {
  const snapshot = state.decisionSnapshot ?? freezeDecisionSnapshot(state);
  const bankers = new Set(
    snapshot.activePlayerIds.filter((playerId) => decisions[playerId] === 'bank'),
  );
  const players = Object.freeze(
    state.players.map((player) =>
      bankers.has(player.id)
        ? Object.freeze({ ...player, score: player.score + snapshot.pot, active: false })
        : player,
    ),
  );
  const activePlayerIds = frozenIds(
    state.round.activePlayerIds.filter((playerId) => !bankers.has(playerId)),
  );
  return Object.freeze({
    ...state,
    players,
    round: Object.freeze({ ...state.round, activePlayerIds }),
  });
};
