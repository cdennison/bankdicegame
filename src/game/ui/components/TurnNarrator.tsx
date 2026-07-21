import type { PresentationState } from '../../application/useGameController';
import type { PlayerDefinition } from '../../domain/types';

interface TurnNarratorProps {
  readonly currentPlayer?: PlayerDefinition;
  readonly presentation: PresentationState;
}

const announcedModes = new Set([
  'rolling',
  'banking',
  'bust',
  'round-transition',
  'game-complete',
]);

export function TurnNarrator({ currentPlayer, presentation }: TurnNarratorProps) {
  const visualMessage = presentation.narration ||
    (currentPlayer ? `${currentPlayer.name} is up` : 'The table is settling');
  const liveMessage = announcedModes.has(presentation.mode) ? presentation.narration : '';

  return (
    <>
      <div className="turn-message">
        <span className="turn-dot" aria-hidden="true" />
        <strong>{visualMessage}</strong>
        <small>{presentation.mode === 'idle' ? 'Ready for the next move' : 'Match in progress'}</small>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</p>
    </>
  );
}
