import { describe, expect, it, vi } from 'vitest';

import {
  createRandomState,
  formatGameCode,
  generateGameCode,
  nextInt,
  nextUint32,
  parseGameCode,
  rollDice,
  type RandomState,
} from './random';

const takeUint32 = (initial: RandomState, count: number) => {
  let state = initial;
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const result = nextUint32(state);
    state = result.state;
    values.push(result.value);
  }

  return { state, values };
};

const takeDice = (initial: RandomState, count: number) => {
  let state = initial;
  const dice: (readonly [number, number])[] = [];

  for (let index = 0; index < count; index += 1) {
    const result = rollDice(state);
    state = result.state;
    dice.push(result.dice);
  }

  return { state, dice };
};

describe('version 1 random stream', () => {
  it('keeps the checked-in uint32 compatibility sequence', () => {
    // Changing these values requires a new BK2 prefix.
    expect(takeUint32(createRandomState(0x12345678), 5).values).toEqual([
      2274908837, 358294691, 1210119364, 2176035992, 1882851208,
    ]);
  });

  it('keeps the checked-in dice compatibility sequence', () => {
    // Changing these values requires a new BK2 prefix.
    expect(takeDice(createRandomState(0x12345678), 5).dice).toEqual([
      [6, 6],
      [5, 3],
      [5, 6],
      [4, 4],
      [6, 4],
    ]);
  });

  it('replays equal call counts from the same starting state', () => {
    const first = takeDice(createRandomState(0x89abcdef), 20);
    const second = takeDice(createRandomState(0x89abcdef), 20);

    expect(first).toEqual(second);
  });

  it('returns dice values from 1 through 6', () => {
    const { dice } = takeDice(createRandomState(0), 1_000);

    expect(dice.flat().every((value) => value >= 1 && value <= 6)).toBe(true);
  });

  it('uses the documented non-zero fallback for a zero seed', () => {
    expect(nextUint32(createRandomState(0)).value).toBe(1085196063);
  });

  it('tracks the original unsigned seed, current value, and draws', () => {
    const initial = createRandomState(-1);
    const next = nextUint32(initial);

    expect(initial).toEqual({ version: 1, seed: 0xffffffff, value: 0xffffffff, draws: 0 });
    expect(next.state).toEqual({
      version: 1,
      seed: 0xffffffff,
      value: next.value,
      draws: 1,
    });
  });
});

describe('nextInt', () => {
  it('returns inclusive bounded integers', () => {
    let state = createRandomState(0x12345678);
    const values: number[] = [];

    for (let index = 0; index < 100; index += 1) {
      const result = nextInt(state, -3, 4);
      state = result.state;
      values.push(result.value);
    }

    expect(values.every((value) => Number.isInteger(value) && value >= -3 && value <= 4)).toBe(true);
  });

  it.each([
    [0.5, 2],
    [0, 2.5],
    [2, 1],
    [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])('rejects an invalid inclusive range [%s, %s]', (min, max) => {
    expect(() => nextInt(createRandomState(1), min, max)).toThrow(RangeError);
  });
});

describe('game codes', () => {
  it.each([0, 1, 0x12345678, 0xffffffff])('round-trips uint32 seed %i', (seed) => {
    expect(parseGameCode(formatGameCode(seed))).toEqual({ ok: true, seed });
  });

  it('uses the exact BK1 format and alphabet', () => {
    expect(formatGameCode(0x12345678)).toBe('BK1-AAKD-JXV2');
    expect(formatGameCode(0xffffffff)).toMatch(/^BK1-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it.each([
    'BK2-AAKD-JXV2',
    'BK1AAKD-JXV2',
    'BK1-AAKD-JXV',
    'BK1-AAKD-JXV22',
    'BK1-AAKD-JXV0',
    'BK1-AAKD-JXVI',
    'bk1-aakd-jxv2',
  ])('rejects malformed code %s', (code) => {
    expect(parseGameCode(code).ok).toBe(false);
  });

  it('rejects a valid-alphabet code whose decoded value exceeds uint32', () => {
    expect(parseGameCode('BK1-BAAA-AAAA').ok).toBe(false);
  });

  it.each([-1, 0x1_0000_0000, 1.5, Number.NaN])('rejects seed %s when formatting', (seed) => {
    expect(() => formatGameCode(seed)).toThrow(RangeError);
  });

  it('reads one uint32 from the injected crypto source exactly once', () => {
    const getRandomValues = vi.fn((values: Uint32Array) => {
      values[0] = 0x12345678;
      return values;
    });

    expect(generateGameCode({ getRandomValues })).toBe('BK1-AAKD-JXV2');
    expect(getRandomValues).toHaveBeenCalledTimes(1);
    expect(getRandomValues.mock.calls[0]?.[0]).toBeInstanceOf(Uint32Array);
    expect(getRandomValues.mock.calls[0]?.[0]).toHaveLength(1);
  });
});
