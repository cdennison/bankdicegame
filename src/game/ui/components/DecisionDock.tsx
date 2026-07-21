import type { DecisionLabels, LegalActions } from '../../domain/selectors';
import type { PlayerId } from '../../domain/types';

interface DecisionDockProps {
  readonly humanId?: PlayerId;
  readonly humanActive: boolean;
  readonly legalActions: LegalActions;
  readonly labels?: DecisionLabels;
  readonly phase: string;
  onRoll(): void;
  onDecision(playerId: PlayerId, decision: 'stay' | 'bank'): void;
}

export function DecisionDock({
  humanId,
  humanActive,
  legalActions,
  labels,
  phase,
  onRoll,
  onDecision,
}: DecisionDockProps) {
  const hasDecision = Boolean(humanId && legalActions.canStay && legalActions.canBank && labels);
  const canRoll = Boolean(humanId && legalActions.canRoll);

  return (
    <section className="action-dock" aria-label="Match actions">
      {!humanActive ? (
        <p className="observation-status">You banked. Watch the round finish.</p>
      ) : canRoll ? (
        <div className="game-actions single-action">
          <button className="game-action" type="button" onClick={onRoll}>Roll</button>
        </div>
      ) : hasDecision && humanId && labels ? (
        <div className="game-actions">
          <button className="game-action" type="button" onClick={() => onDecision(humanId, 'stay')}>
            {labels.stay}
          </button>
          <button className="game-action bank-action" type="button" onClick={() => onDecision(humanId, 'bank')}>
            {labels.bank}
          </button>
        </div>
      ) : (
        <p className="observation-status">
          {phase === 'game-complete' ? 'Match complete' : 'Automatic play in progress'}
        </p>
      )}
    </section>
  );
}
