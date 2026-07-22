import { nextActivePlayer } from './turns';
import type { GameState, PlayerDefinition, PlayerId } from './types';

export interface RankedPlayer {
  readonly id: PlayerId;
  readonly name: string;
  readonly score: number;
  readonly active: boolean;
  readonly rank: number;
  readonly controller: PlayerDefinition['controller'];
}

export interface LegalActions {
  readonly canRoll: boolean;
  readonly canStay: boolean;
  readonly canBank: boolean;
  readonly canAdvanceRound: boolean;
}

export interface DecisionLabels {
  readonly stay: 'Roll On' | 'Stay In';
  readonly bank: 'Bank';
}

const noActions = (): LegalActions => ({
  canRoll: false,
  canStay: false,
  canBank: false,
  canAdvanceRound: false,
});

export const selectRankings = (state: GameState): readonly RankedPlayer[] => {
  const definitions = new Map(state.config.players.map((player) => [player.id, player]));
  return state.players
    .map((player) => ({ player, definition: definitions.get(player.id)! }))
    .sort((left, right) =>
      right.player.score - left.player.score ||
      left.definition.seatIndex - right.definition.seatIndex,
    )
    .map(({ player, definition }, index, sorted) => ({
      id: player.id,
      name: definition.name,
      score: player.score,
      active: player.active,
      rank:
        index > 0 && sorted[index - 1]!.player.score === player.score
          ? sorted.findIndex(({ player: candidate }) => candidate.score === player.score) + 1
          : index + 1,
      controller: definition.controller,
    }));
};

export const selectWinners = (state: GameState): readonly RankedPlayer[] => {
  if (state.phase !== 'game-complete') return [];
  const rankings = selectRankings(state);
  return rankings.filter(({ rank }) => rank === 1);
};

export const selectWinnerHeading = (winners: readonly RankedPlayer[]): string => {
  if (winners.length === 0) return 'Match complete';
  if (winners.length === 1) return `${winners[0]!.name} wins!`;
  const names = winners.map(({ name }) => name);
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)} tie!`;
};

export const selectCurrentPlayer = (state: GameState): PlayerDefinition | undefined =>
  state.config.players.find(({ id }) => id === state.round.currentPlayerId);

const defaultHumanId = (state: GameState): PlayerId | undefined =>
  state.config.players.find(({ controller }) => controller.type === 'human')?.id;

export const selectLegalActions = (
  state: GameState,
  playerId: PlayerId | undefined = defaultHumanId(state),
): LegalActions => {
  if (state.phase === 'round-complete') {
    return {
      canRoll: false,
      canStay: false,
      canBank: false,
      canAdvanceRound: true,
    };
  }
  if (!playerId) return noActions();
  const definition = state.config.players.find(({ id }) => id === playerId);
  const player = state.players.find(({ id }) => id === playerId);
  if (definition?.controller.type !== 'human' || !player?.active) return noActions();

  if (state.phase === 'awaiting-roll') {
    return {
      canRoll: state.round.currentPlayerId === playerId,
      canStay: false,
      canBank: false,
      canAdvanceRound: false,
    };
  }

  const isPending =
    state.phase === 'awaiting-decisions' &&
    state.decisionSnapshot?.pendingPlayerIds.includes(playerId) === true &&
    state.decisionSnapshot.decisions[playerId] === undefined;
  return isPending
    ? { canRoll: false, canStay: true, canBank: true, canAdvanceRound: false }
    : noActions();
};

export const selectDecisionLabels = (
  state: GameState,
  playerId: PlayerId | undefined = defaultHumanId(state),
): DecisionLabels | undefined => {
  if (state.round.activePlayerIds.length === 0) return undefined;
  const nextId = nextActivePlayer(
    state.config.players.map(({ id }) => id),
    state.round.activePlayerIds,
    state.round.currentPlayerId,
  );
  const next = state.config.players.find(({ id }) => id === nextId);
  return {
    stay:
      next?.controller.type === 'human' && nextId === playerId
        ? 'Roll On'
        : 'Stay In',
    bank: 'Bank',
  };
};
