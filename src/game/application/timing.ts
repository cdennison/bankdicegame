export interface GameTiming {
  readonly thinking: number;
  readonly dice: number;
  readonly strategyReveal: number;
  readonly roundTransition: number;
}

const noMotion = (): boolean => {
  if (typeof window === 'undefined') return true;
  if (navigator.userAgent.includes('jsdom')) return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};

const MOTION_TIMING: GameTiming = Object.freeze({
  thinking: 650,
  dice: 700,
  strategyReveal: 800,
  roundTransition: 900,
});

const ZERO_TIMING: GameTiming = Object.freeze({
  thinking: 0,
  dice: 0,
  strategyReveal: 0,
  roundTransition: 0,
});

export const TIMING: GameTiming = noMotion() ? ZERO_TIMING : MOTION_TIMING;
