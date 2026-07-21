import type {
  ConfigError,
  ConfigResult,
  Controller,
  GameConfig,
  GameConfigInput,
  PlayerDefinition,
} from './types';

const invalid = (error: ConfigError): ConfigResult => ({ ok: false, error });

const freezeController = (controller: Controller): Controller =>
  Object.freeze(
    controller.type === 'human'
      ? { type: 'human' }
      : { type: 'strategy', strategyId: controller.strategyId },
  );

const freezePlayer = (player: PlayerDefinition): PlayerDefinition =>
  Object.freeze({
    id: player.id,
    name: player.name,
    seatIndex: player.seatIndex,
    controller: freezeController(player.controller),
  });

export const createConfig = (input: GameConfigInput): ConfigResult => {
  if (input.players.length < 2 || input.players.length > 8) {
    return invalid({
      code: 'INVALID_PLAYER_COUNT',
      message: 'Bank It requires 2 to 8 players.',
    });
  }

  if (input.rounds !== 10) {
    return invalid({
      code: 'INVALID_ROUND_COUNT',
      message: 'Bank It rules version 1 requires exactly 10 rounds.',
    });
  }

  if (input.players.some(({ seatIndex }) => !Number.isInteger(seatIndex))) {
    return invalid({
      code: 'INVALID_SEAT_INDEX',
      message: 'Seat indexes must be integers.',
    });
  }

  if (new Set(input.players.map(({ id }) => id)).size !== input.players.length) {
    return invalid({
      code: 'DUPLICATE_PLAYER_ID',
      message: 'Player IDs must be unique.',
    });
  }

  if (
    new Set(input.players.map(({ seatIndex }) => seatIndex)).size !==
    input.players.length
  ) {
    return invalid({
      code: 'DUPLICATE_SEAT_INDEX',
      message: 'Seat indexes must be unique.',
    });
  }

  const players = Object.freeze(
    input.players
      .map(freezePlayer)
      .sort((left, right) => left.seatIndex - right.seatIndex),
  );

  const config: GameConfig = Object.freeze({
    rounds: 10,
    seedCode: input.seedCode,
    players,
  });

  return { ok: true, config };
};
