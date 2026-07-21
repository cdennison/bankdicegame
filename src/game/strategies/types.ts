import type { Decision, StrategyId } from '../domain/types';

export interface StrategyContext {
  readonly pot: number;
  readonly rollNumber: number;
  readonly dangerRollCount: number;
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly ownScore: number;
  readonly opponentScores: readonly number[];
  readonly activeOpponentCount: number;
  readonly totalOpponentCount: number;
  readonly lastDangerRollWasDouble: boolean;
}

export interface Strategy {
  readonly id: StrategyId;
  decide(context: StrategyContext): Decision;
}
