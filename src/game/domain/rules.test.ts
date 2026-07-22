import { describe, expect, it } from 'vitest';

import { resolveRoll, type RollInput } from './rules';

describe('resolveRoll', () => {
  it('adds 70 for a seven during the first safe roll', () => {
    expect(resolveRoll({ pot: 0, rollNumber: 1, dice: [3, 4] })).toMatchObject({
      pot: 70,
      busted: false,
      dangerRollsAdded: 0,
    });
  });

  it('adds normal sums during safe rolls', () => {
    expect(resolveRoll({ pot: 70, rollNumber: 2, dice: [1, 2] })).toMatchObject({
      pot: 73,
      busted: false,
      total: 3,
      dangerRollsAdded: 0,
    });
  });

  it('does not double the pot for doubles during the first three safe rolls', () => {
    expect(resolveRoll({ pot: 73, rollNumber: 3, dice: [2, 2] })).toMatchObject({
      pot: 77,
      busted: false,
      isDouble: true,
      dangerRollsAdded: 0,
    });
  });

  it('busts on a danger seven while preserving the pre-bust pot', () => {
    expect(resolveRoll({ pot: 13, rollNumber: 4, dice: [1, 6] })).toMatchObject({
      pot: 13,
      busted: true,
      total: 7,
      dangerRollsAdded: 0,
    });
  });

  it('doubles the full pot for doubles in the danger zone', () => {
    expect(resolveRoll({ pot: 78, rollNumber: 4, dice: [4, 4] })).toMatchObject({
      pot: 156,
      busted: false,
      isDouble: true,
      dangerRollsAdded: 1,
    });
  });

  it('adds normal sums and one danger roll in the danger zone', () => {
    expect(resolveRoll({ pot: 78, rollNumber: 5, dice: [2, 3] })).toEqual({
      pot: 83,
      busted: false,
      total: 5,
      isDouble: false,
      dangerRollsAdded: 1,
    });
  });

  it.each([
    [0, 4],
    [7, 4],
    [1.5, 4],
    [Number.NaN, 4],
    [1, 0],
    [1, 7],
    [1, 2.5],
  ])('rejects invalid dice [%s, %s]', (first, second) => {
    expect(() => resolveRoll({ pot: 0, rollNumber: 1, dice: [first, second] })).toThrow(
      RangeError,
    );
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid roll number %s',
    (rollNumber) => {
      expect(() => resolveRoll({ pot: 0, rollNumber, dice: [1, 2] })).toThrow(RangeError);
    },
  );

  it('rejects dice inputs that do not contain exactly two dice', () => {
    const input = { pot: 0, rollNumber: 1, dice: [1] } as unknown as RollInput;

    expect(() => resolveRoll(input)).toThrow(RangeError);
  });
});
