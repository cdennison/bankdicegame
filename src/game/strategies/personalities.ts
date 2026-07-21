import type { Decision, StrategyId } from '../domain/types';
import type { Strategy, StrategyContext } from './types';

const leaderScore = (context: StrategyContext): number =>
  Math.max(...context.opponentScores, 0);

const pythonRound = (value: number): number => {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction !== 0.5) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
};

const stateAwareTarget = (context: StrategyContext): number => {
  const scoreDelta = context.ownScore - leaderScore(context);
  if (scoreDelta === 0) return 200;

  const roundsLeft = context.totalRounds - context.roundNumber + 1;
  const playerPressure = Math.sqrt(Math.max(1, context.totalOpponentCount) / 3);
  const perRoundGap = Math.abs(scoreDelta) / roundsLeft;
  const adjustment = perRoundGap * playerPressure;
  const rawTarget = scoreDelta > 0 ? 150 - 0.25 * adjustment : 300 + 0.5 * adjustment;
  let target = pythonRound(rawTarget / 5) * 5;
  target = Math.max(100, Math.min(400, target));

  const bankedOpponentCount =
    context.totalOpponentCount - context.activeOpponentCount;
  if (scoreDelta < 0 && bankedOpponentCount > 0) {
    target = Math.max(target, Math.min(400, Math.abs(scoreDelta) + 1));
  }
  if (scoreDelta < 0 && context.roundNumber === context.totalRounds) {
    target = Math.max(target, Math.abs(scoreDelta) + 1);
  }
  return target;
};

const decideAtTarget = (context: StrategyContext, target: number): Decision =>
  context.pot >= target ? 'bank' : 'stay';

const STRATEGIES = {
  mira: {
    id: 'mira',
    decide: (context: StrategyContext) => decideAtTarget(context, stateAwareTarget(context)),
  },
  knox: {
    id: 'knox',
    decide: (context: StrategyContext) =>
      context.lastDangerRollWasDouble ||
      context.pot >= 250 ||
      context.dangerRollCount >= 8
        ? 'bank'
        : 'stay',
  },
  vega: {
    id: 'vega',
    decide: (context: StrategyContext) => decideAtTarget(context, 200),
  },
} as const satisfies Readonly<Record<StrategyId, Strategy>>;

export const getStrategy = (id: StrategyId): Strategy => STRATEGIES[id];
