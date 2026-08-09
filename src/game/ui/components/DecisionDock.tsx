import type { DecisionLabels, LegalActions } from '../../domain/selectors';
import type { Decision, PlayerId } from '../../domain/types';

interface DecisionDockProps {
  readonly humanId?: PlayerId;
  readonly humanName?: string;
  readonly humanActive: boolean;
  readonly showTurnOwner?: boolean;
  readonly soloHuman?: boolean;
  readonly legalActions: LegalActions;
  readonly labels?: DecisionLabels;
  readonly nextRoundNumber: number;
  readonly phase: string;
  onRoll(): void;
  onAdvanceRound(): void;
  onContinueDecisions(): void;
  onDecision(playerId: PlayerId, decision: Decision): void;
}

const soloStayLabel = (stay: DecisionLabels['stay']): string => (stay === 'Roll On' ? 'Roll' : 'Continue');

export function DecisionDock({
  humanId,
  humanName,
  humanActive,
  showTurnOwner = false,
  soloHuman = false,
  legalActions,
  labels,
  nextRoundNumber,
  phase,
  onRoll,
  onAdvanceRound,
  onContinueDecisions,
  onDecision,
}: DecisionDockProps) {
  const canRoll = Boolean(humanId && legalActions.canRoll);
  const soloDecision = Boolean(
    soloHuman && humanId && labels && legalActions.canStay && legalActions.canBank,
  );
  const turnOwnerLabel = showTurnOwner && humanName && canRoll
    ? <p className="turn-owner-label">{humanName}'s move</p>
    : null;

  return (
    <section className="action-dock" aria-label="Match actions">
      {legalActions.canAdvanceRound ? (
        <div className="game-actions single-action">
          <button className="game-action" type="button" onClick={onAdvanceRound}>
            Start Round #{nextRoundNumber}
          </button>
        </div>
      ) : phase === 'awaiting-decisions' && soloDecision && humanId && labels ? (
        <div className="game-actions">
          <button className="game-action" type="button" onClick={() => onDecision(humanId, 'stay')}>
            {soloStayLabel(labels.stay)}
          </button>
          <button className="game-action bank-action" type="button" onClick={() => onDecision(humanId, 'bank')}>
            {labels.bank}
          </button>
        </div>
      ) : phase === 'awaiting-decisions' ? (
        <div className="game-actions single-action">
          <button className="game-action continue-action" type="button" onClick={onContinueDecisions}>
            Continue
          </button>
        </div>
      ) : !humanActive ? (
        <p className="observation-status">You banked. Watch the round finish.</p>
      ) : canRoll ? (
        <>
          {turnOwnerLabel}
          <div className="game-actions single-action">
            <button className="game-action" type="button" onClick={onRoll}>Roll</button>
          </div>
        </>
      ) : (
        <p className="observation-status">
          {phase === 'game-complete' ? 'Match complete' : 'Automatic play in progress'}
        </p>
      )}
    </section>
  );
}
