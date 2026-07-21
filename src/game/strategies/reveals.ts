import type { StrategyId } from '../domain/types';

export interface OpponentProfile {
  readonly name: string;
  readonly setupDescription: string;
  readonly avatar: {
    readonly src: string;
    readonly alt: string;
  };
  readonly accent: string;
  readonly resultReveal: {
    readonly name: string;
    readonly description: string;
  };
}

export const OPPONENT_PROFILES = {
  mira: {
    name: 'Mira',
    setupDescription: 'Quietly confident, Mira always seems one move ahead.',
    avatar: { src: 'M', alt: 'Mira avatar' },
    accent: '#3ed6a4',
    resultReveal: {
      name: 'State Delta',
      description: 'Changes her target using score gap, rounds remaining, and table size.',
    },
  },
  knox: {
    name: 'Knox',
    setupDescription: 'Knox treats every roll as a dare.',
    avatar: { src: 'K', alt: 'Knox avatar' },
    accent: '#ff8a3d',
    resultReveal: {
      name: 'Double Hunter',
      description: 'Chases a danger-zone double with a pot and roll-count safety cap.',
    },
  },
  vega: {
    name: 'Vega',
    setupDescription: 'Unshakable and difficult to read, Vega never gives anything away.',
    avatar: { src: 'V', alt: 'Vega avatar' },
    accent: '#9d8cff',
    resultReveal: {
      name: 'Fixed 200',
      description: 'Uses the strongest simple baseline from the original experiments.',
    },
  },
} as const satisfies Readonly<Record<StrategyId, OpponentProfile>>;
