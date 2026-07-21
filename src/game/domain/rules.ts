export interface RollInput {
  readonly pot: number;
  readonly rollNumber: number;
  readonly dice: readonly [number, number];
}

export interface RollOutcome {
  readonly pot: number;
  readonly busted: boolean;
  readonly total: number;
  readonly isDouble: boolean;
  readonly dangerRollsAdded: 0 | 1;
}

const validateDie = (value: number): void => {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new RangeError('Each die must be an integer from 1 through 6.');
  }
};

export const resolveRoll = ({ pot, rollNumber, dice }: RollInput): RollOutcome => {
  if (!Number.isSafeInteger(rollNumber) || rollNumber < 1) {
    throw new RangeError('Roll number must be a positive safe integer.');
  }

  if (dice.length !== 2) {
    throw new RangeError('A roll must contain exactly two dice.');
  }

  const [first, second] = dice;
  validateDie(first);
  validateDie(second);

  const total = first + second;
  const isDouble = first === second;

  if (rollNumber <= 3) {
    return {
      pot: pot + (total === 7 ? 70 : total),
      busted: false,
      total,
      isDouble,
      dangerRollsAdded: 0,
    };
  }

  if (total === 7) {
    return { pot, busted: true, total, isDouble, dangerRollsAdded: 0 };
  }

  return {
    pot: isDouble ? pot * 2 : pot + total,
    busted: false,
    total,
    isDouble,
    dangerRollsAdded: 1,
  };
};
