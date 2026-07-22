import { describe, expect, it } from 'vitest';

import { createConfig } from './config';
import type { PlayerDefinition } from './types';

const human = (id: string, seatIndex: number): PlayerDefinition => ({
  id,
  name: id,
  seatIndex,
  controller: { type: 'human' },
});

const strategy = (id: string, seatIndex: number): PlayerDefinition => ({
  id,
  name: id,
  seatIndex,
  controller: { type: 'strategy', strategyId: 'mira' },
});

const input = (players: readonly PlayerDefinition[], rounds = 10) => ({
  rounds,
  seedCode: 'BK1-AAKD-JXV2',
  players,
});

describe('createConfig', () => {
  it.each([
    [2, [human('p1', 0), strategy('p2', 1)]],
    [8, Array.from({ length: 8 }, (_, index) => strategy(`p${index}`, index))],
  ])('accepts %i ordered seats', (_count, players) => {
    expect(createConfig(input(players)).ok).toBe(true);
  });

  it.each([
    [1, [human('only', 0)]],
    [9, Array.from({ length: 9 }, (_, index) => strategy(`p${index}`, index))],
  ])('rejects a player count of %i', (_count, players) => {
    expect(createConfig(input(players))).toEqual({
      ok: false,
      error: {
        code: 'INVALID_PLAYER_COUNT',
        message: 'Bank It requires 2 to 8 players.',
      },
    });
  });

  it('rejects duplicate player IDs', () => {
    expect(createConfig(input([human('same', 0), strategy('same', 1)]))).toEqual({
      ok: false,
      error: {
        code: 'DUPLICATE_PLAYER_ID',
        message: 'Player IDs must be unique.',
      },
    });
  });

  it('rejects duplicate seat indexes', () => {
    expect(createConfig(input([human('p1', 0), strategy('p2', 0)]))).toEqual({
      ok: false,
      error: {
        code: 'DUPLICATE_SEAT_INDEX',
        message: 'Seat indexes must be unique.',
      },
    });
  });

  it('rejects non-integer seat indexes', () => {
    expect(createConfig(input([human('p1', 0), strategy('p2', 1.5)]))).toEqual({
      ok: false,
      error: {
        code: 'INVALID_SEAT_INDEX',
        message: 'Seat indexes must be integers.',
      },
    });
  });

  it.each([
    ['zero humans', [strategy('p1', 0), strategy('p2', 1)]],
    ['several humans', [human('p1', 0), human('p2', 1), human('p3', 2)]],
  ])('accepts configurations with %s', (_description, players) => {
    expect(createConfig(input(players)).ok).toBe(true);
  });

  it('requires exactly ten rounds for rules version 1', () => {
    expect(createConfig(input([human('p1', 0), strategy('p2', 1)], 9))).toEqual({
      ok: false,
      error: {
        code: 'INVALID_ROUND_COUNT',
        message: 'Bank It rules version 1 requires exactly 10 rounds.',
      },
    });
  });

  it('sorts players by seat and returns immutable normalized definitions', () => {
    const source = [strategy('p2', 4), human('p1', 2)];
    const result = createConfig(input(source));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.config.players.map(({ id }) => id)).toEqual(['p1', 'p2']);
    expect(result.config.players).not.toBe(source);
    expect(Object.isFrozen(result.config)).toBe(true);
    expect(Object.isFrozen(result.config.players)).toBe(true);
    expect(result.config.players.every(Object.isFrozen)).toBe(true);
    expect(result.config.players.every(({ controller }) => Object.isFrozen(controller))).toBe(true);
  });
});
