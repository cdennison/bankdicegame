import { useEffect, useRef } from 'react';

interface RestartDialogProps {
  readonly open: boolean;
  onCancel(): void;
  onConfirm(): void;
}

export function RestartDialog({ open, onCancel, onConfirm }: RestartDialogProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelButton.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="dialog-backdrop"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-title">
        <div>
          <p className="kicker">Clear the table</p>
          <h2 id="restart-title">Restart match?</h2>
          <p>Scores and round progress will return to the beginning.</p>
          <div className="dialog-actions">
            <button ref={cancelButton} type="button" onClick={onCancel}>Cancel</button>
            <button className="confirm" type="button" onClick={onConfirm}>Restart</button>
          </div>
        </div>
      </section>
    </div>
  );
}
