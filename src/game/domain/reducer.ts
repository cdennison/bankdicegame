import { applyDecisions, freezeDecisionSnapshot } from './decisions';
import { createRandomState, nextInt, parseGameCode, rollDice } from './random';
import { resolveRoll } from './rules';
import { getStrategy } from '../strategies/personalities';
import { nextActivePlayer, roundStarter } from './turns';
import type {
  Command,
  Decision,
  DecisionSnapshot,
  DomainEvent,
  GameConfig,
  GameState,
  PlayerId,
  TransitionResult,
} from './types';

const freezePlayers = (state: GameState['players']): GameState['players'] =>
  Object.freeze(state.map((player) => Object.freeze({ ...player })));

const state = (value: GameState): GameState => Object.freeze(value);

export const createGame = (config: GameConfig): GameState => {
  const parsed = parseGameCode(config.seedCode);
  if (!parsed.ok) throw new RangeError(parsed.error.message);
  const starter = nextInt(createRandomState(parsed.seed), 0, config.players.length - 1);
  const activePlayerIds = Object.freeze(config.players.map(({ id }) => id));
  const currentPlayerId = config.players[starter.value]!.id;
  return state({
    config,
    players: freezePlayers(
      config.players.map(({ id }) => ({ id, score: 0, active: true })),
    ),
    phase: 'awaiting-roll',
    round: Object.freeze({
      roundNumber: 1,
      pot: 0,
      rollNumber: 0,
      dangerRolls: 0,
      activePlayerIds,
      currentPlayerId,
      lastDangerRollWasDouble: false,
    }),
    random: starter.state,
    firstStarterIndex: starter.value,
  });
};

const reject = (current: GameState, command: Command): TransitionResult => ({
  ok: false,
  state: current,
  error: {
    code: 'COMMAND_NOT_ALLOWED',
    command: command.type,
    phase: current.phase,
  },
});

const success = (
  next: GameState,
  events: readonly DomainEvent[] = [],
): TransitionResult => ({
  ok: true,
  state: next,
  events: Object.freeze(events.map((event) => Object.freeze(event))),
});

const withRecordedDecision = (
  current: GameState,
  playerId: PlayerId,
  decision: Decision,
): GameState => {
  const snapshot = current.decisionSnapshot!;
  return state({
    ...current,
    decisionSnapshot: Object.freeze({
      ...snapshot,
      pendingPlayerIds: Object.freeze(
        snapshot.pendingPlayerIds.filter((pendingId) => pendingId !== playerId),
      ),
      decisions: Object.freeze({ ...snapshot.decisions, [playerId]: decision }),
    }),
  });
};

const strategyDecision = (
  current: GameState,
  snapshot: DecisionSnapshot,
  playerId: PlayerId,
): Decision => {
  const definition = current.config.players.find(({ id }) => id === playerId)!;
  if (definition.controller.type !== 'strategy') return snapshot.decisions[playerId]!;
  const ownScore = snapshot.scores[playerId] ?? 0;
  const opponentScores = Object.freeze(
    current.config.players
      .filter(({ id }) => id !== playerId)
      .map(({ id }) => snapshot.scores[id] ?? 0),
  );
  return getStrategy(definition.controller.strategyId).decide(Object.freeze({
    pot: snapshot.pot,
    rollNumber: current.round.rollNumber,
    dangerRollCount: current.round.dangerRolls,
    roundNumber: current.round.roundNumber,
    totalRounds: current.config.rounds,
    ownScore,
    opponentScores,
    activeOpponentCount: snapshot.activePlayerIds.length - 1,
    totalOpponentCount: current.config.players.length - 1,
    lastDangerRollWasDouble: current.round.lastDangerRollWasDouble,
  }));
};

const winners = (current: GameState): readonly PlayerId[] => {
  const high = Math.max(...current.players.map(({ score }) => score));
  return Object.freeze(current.players.filter(({ score }) => score === high).map(({ id }) => id));
};

export const transition = (current: GameState, command: Command): TransitionResult => {
  if (command.type === 'RESTART') {
    return current.phase === 'game-complete'
      ? success(createGame(current.config))
      : reject(current, command);
  }

  if (command.type === 'ROLL_DICE') {
    if (current.phase !== 'awaiting-roll') return reject(current, command);
    const rolled = rollDice(current.random);
    const next = state({
      ...current,
      phase: 'resolving-roll',
      random: rolled.state,
      pendingRoll: Object.freeze({ dice: rolled.dice }),
    });
    return success(next, [
      { type: 'DiceRolled', playerId: current.round.currentPlayerId, dice: rolled.dice },
    ]);
  }

  if (command.type === 'COMMIT_ROLL') {
    if (current.phase !== 'resolving-roll' || !current.pendingRoll) return reject(current, command);
    const rollNumber = current.round.rollNumber + 1;
    const outcome = resolveRoll({
      pot: current.round.pot,
      rollNumber,
      dice: current.pendingRoll.dice,
    });
    const updatedRound = Object.freeze({
      ...current.round,
      pot: outcome.pot,
      rollNumber,
      dangerRolls: current.round.dangerRolls + outcome.dangerRollsAdded,
      lastDangerRollWasDouble: rollNumber > 3 && outcome.isDouble,
    });
    if (outcome.busted) {
      return success(
        state({ ...current, phase: 'round-complete', round: updatedRound, pendingRoll: undefined }),
        [
          { type: 'RoundBusted', roundNumber: updatedRound.roundNumber, pot: updatedRound.pot },
          { type: 'RoundCompleted', roundNumber: updatedRound.roundNumber },
        ],
      );
    }
    const nextRoller =
      rollNumber < 3
        ? nextActivePlayer(
            current.config.players.map(({ id }) => id),
            updatedRound.activePlayerIds,
            updatedRound.currentPlayerId,
          )
        : updatedRound.currentPlayerId;
    const committed = state({
      ...current,
      phase: rollNumber >= 3 ? 'awaiting-decisions' : 'awaiting-roll',
      round: Object.freeze({ ...updatedRound, currentPlayerId: nextRoller }),
      pendingRoll: undefined,
    });
    return success(
      rollNumber >= 3
        ? state({ ...committed, decisionSnapshot: freezeDecisionSnapshot(committed) })
        : committed,
    );
  }

  if (command.type === 'SUBMIT_DECISION') {
    if (
      current.phase !== 'awaiting-decisions' ||
      !current.decisionSnapshot?.pendingPlayerIds.includes(command.playerId) ||
      current.decisionSnapshot.decisions[command.playerId] !== undefined ||
      current.config.players.find(({ id }) => id === command.playerId)?.controller.type !== 'human'
    ) {
      return reject(current, command);
    }
    return success(withRecordedDecision(current, command.playerId, command.decision));
  }

  if (command.type === 'RESOLVE_STRATEGY_DECISIONS') {
    if (current.phase !== 'awaiting-decisions' || !current.decisionSnapshot) {
      return reject(current, command);
    }
    const snapshot = current.decisionSnapshot;
    const humanPending = snapshot.pendingPlayerIds.some((playerId) => {
      const player = current.config.players.find(({ id }) => id === playerId)!;
      return player.controller.type === 'human' && snapshot.decisions[playerId] === undefined;
    });
    if (humanPending) return reject(current, command);
    const decisions = { ...snapshot.decisions };
    for (const playerId of snapshot.pendingPlayerIds) {
      const player = current.config.players.find(({ id }) => id === playerId)!;
      if (player.controller.type === 'strategy') {
        decisions[playerId] = strategyDecision(current, snapshot, playerId);
      }
    }
    return success(
      state({
        ...current,
        phase: 'resolving-decisions',
        decisionSnapshot: Object.freeze({
          ...snapshot,
          pendingPlayerIds: Object.freeze([]),
          decisions: Object.freeze(decisions),
        }),
      }),
    );
  }

  if (command.type === 'COMMIT_DECISIONS') {
    if (current.phase !== 'resolving-decisions' || !current.decisionSnapshot) {
      return reject(current, command);
    }
    const snapshot = current.decisionSnapshot;
    const bankers = snapshot.activePlayerIds.filter(
      (playerId) => snapshot.decisions[playerId] === 'bank',
    );
    const applied = applyDecisions(current, snapshot.decisions);
    const events: DomainEvent[] = bankers.map((playerId) => ({
      type: 'PlayerBanked',
      playerId,
      amount: snapshot.pot,
    }));
    if (applied.round.activePlayerIds.length === 0) {
      events.push({ type: 'RoundCompleted', roundNumber: applied.round.roundNumber });
      return success(
        state({ ...applied, phase: 'round-complete', decisionSnapshot: undefined }),
        events,
      );
    }
    const currentPlayerId = nextActivePlayer(
      current.config.players.map(({ id }) => id),
      applied.round.activePlayerIds,
      current.round.currentPlayerId,
    );
    return success(
      state({
        ...applied,
        phase: 'awaiting-roll',
        round: Object.freeze({ ...applied.round, currentPlayerId }),
        decisionSnapshot: undefined,
      }),
      events,
    );
  }

  if (command.type === 'ADVANCE_ROUND') {
    if (current.phase !== 'round-complete') return reject(current, command);
    if (current.round.roundNumber === current.config.rounds) {
      const winnerIds = winners(current);
      return success(state({ ...current, phase: 'game-complete' }), [
        { type: 'GameCompleted', winnerIds },
      ]);
    }
    const roundNumber = current.round.roundNumber + 1;
    const activePlayerIds = Object.freeze(current.config.players.map(({ id }) => id));
    const currentPlayerId = roundStarter(
      activePlayerIds,
      current.firstStarterIndex,
      roundNumber,
    );
    return success(
      state({
        ...current,
        phase: 'awaiting-roll',
        players: freezePlayers(current.players.map((player) => ({ ...player, active: true }))),
        round: Object.freeze({
          roundNumber,
          pot: 0,
          rollNumber: 0,
          dangerRolls: 0,
          activePlayerIds,
          currentPlayerId,
          lastDangerRollWasDouble: false,
        }),
      }),
    );
  }

  return reject(current, command);
};
