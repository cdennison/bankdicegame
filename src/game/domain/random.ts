export interface RandomState {
  readonly version: 1;
  readonly seed: number;
  readonly value: number;
  readonly draws: number;
}

export type SeedResult =
  | { readonly ok: true; readonly seed: number }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_GAME_CODE';
        readonly message: string;
      };
    };

interface CryptoSource {
  getRandomValues(values: Uint32Array): Uint32Array;
}

const UINT32_SIZE = 0x1_0000_0000;
const UINT32_MAX = UINT32_SIZE - 1;
const ZERO_FALLBACK = 0x6d2b79f5;
const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GAME_CODE_PATTERN = /^BK1-([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4})-([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4})$/;

const nextValue = (value: number): number => {
  let x = value || ZERO_FALLBACK;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
};

const randomState = (seed: number, value: number, draws: number): RandomState =>
  Object.freeze({ version: 1, seed, value, draws });

export const createRandomState = (seed: number): RandomState => {
  const unsignedSeed = seed >>> 0;
  return randomState(unsignedSeed, unsignedSeed, 0);
};

export const nextUint32 = (
  state: RandomState,
): { readonly state: RandomState; readonly value: number } => {
  const value = nextValue(state.value);
  return {
    state: randomState(state.seed, value, state.draws + 1),
    value,
  };
};

export const nextInt = (
  state: RandomState,
  min: number,
  max: number,
): { readonly state: RandomState; readonly value: number } => {
  const range = max - min + 1;
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    range > UINT32_SIZE
  ) {
    throw new RangeError('Bounds must define an inclusive integer range of at most 2^32 values.');
  }

  const limit = Math.floor(UINT32_SIZE / range) * range;
  let currentState = state;

  while (true) {
    const result = nextUint32(currentState);
    currentState = result.state;
    if (result.value < limit) {
      return { state: currentState, value: min + (result.value % range) };
    }
  }
};

export const rollDice = (
  state: RandomState,
): { readonly state: RandomState; readonly dice: readonly [number, number] } => {
  const first = nextInt(state, 1, 6);
  const second = nextInt(first.state, 1, 6);
  return { state: second.state, dice: Object.freeze([first.value, second.value]) };
};

export const formatGameCode = (seed: number): string => {
  if (!Number.isInteger(seed) || seed < 0 || seed > UINT32_MAX) {
    throw new RangeError('Game seed must be an unsigned 32-bit integer.');
  }

  let remaining = seed;
  let encoded = '';
  for (let index = 0; index < 8; index += 1) {
    encoded = GAME_CODE_ALPHABET[remaining % 32] + encoded;
    remaining = Math.floor(remaining / 32);
  }

  return `BK1-${encoded.slice(0, 4)}-${encoded.slice(4)}`;
};

const invalidGameCode = (): SeedResult => ({
  ok: false,
  error: {
    code: 'INVALID_GAME_CODE',
    message: 'Game code must use the BK1-XXXX-XXXX format and encode a uint32 seed.',
  },
});

export const parseGameCode = (code: string): SeedResult => {
  const match = GAME_CODE_PATTERN.exec(code);
  if (!match) return invalidGameCode();

  const encoded = `${match[1]}${match[2]}`;
  let seed = 0;
  for (const character of encoded) {
    seed = seed * 32 + GAME_CODE_ALPHABET.indexOf(character);
  }

  return seed <= UINT32_MAX ? { ok: true, seed } : invalidGameCode();
};

export const generateGameCode = (crypto: CryptoSource): string => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return formatGameCode(values[0]);
};
