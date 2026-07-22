import { createConfig } from './config';
import { createGame } from './reducer';
import type { GameConfig, GameState, PlayerDefinition, StrategyId } from './types';

interface FixtureOptions {
  readonly humans?: readonly number[];
  readonly strategies?: readonly StrategyId[];
  readonly seedCode?: string;
}

export const playersFixture = (
  count: number,
  options: FixtureOptions = {},
): GameConfig => {
  const humans = new Set(options.humans ?? [0]);
  const strategies = options.strategies ?? ['mira', 'knox', 'vega'];
  const players: PlayerDefinition[] = Array.from({ length: count }, (_, seatIndex) => ({
    id: `seat-${seatIndex}`,
    name: `Seat ${seatIndex + 1}`,
    seatIndex,
    controller: humans.has(seatIndex)
      ? { type: 'human' as const }
      : {
          type: 'strategy' as const,
          strategyId: strategies[seatIndex % strategies.length] ?? 'mira',
        },
  }));
  const result = createConfig({
    rounds: 10,
    seedCode: options.seedCode ?? 'BK1-AAKD-JXV2',
    players,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.config;
};

export const fourSeatFixture = (): GameConfig => {
  const result = createConfig({
    rounds: 10,
    seedCode: 'BK1-AAKD-JXV2',
    players: [
      { id: 'human', name: 'Human', seatIndex: 0, controller: { type: 'human' } },
      {
        id: 'mira',
        name: 'Mira',
        seatIndex: 1,
        controller: { type: 'strategy', strategyId: 'mira' },
      },
      { id: 'guest', name: 'Guest', seatIndex: 2, controller: { type: 'human' } },
      {
        id: 'vega',
        name: 'Vega',
        seatIndex: 3,
        controller: { type: 'strategy', strategyId: 'vega' },
      },
    ],
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.config;
};

export const stateAtDecision = (
  config: GameConfig,
  values: { readonly pot: number; readonly scores: readonly number[] },
): GameState => {
  const initial = createGame(config);
  return Object.freeze({
    ...initial,
    phase: 'awaiting-decisions' as const,
    players: Object.freeze(
      initial.players.map((player, index) =>
        Object.freeze({ ...player, score: values.scores[index] ?? 0 }),
      ),
    ),
    round: Object.freeze({ ...initial.round, pot: values.pot, rollNumber: 3 }),
  });
};
