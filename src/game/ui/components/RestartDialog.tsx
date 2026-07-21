import { useLayoutEffect, useRef } from 'react';

interface RestartDialogProps {
  readonly open: boolean;
  onCancel(): void;
  onConfirm(): void;
}

export function RestartDialog({ open, onCancel, onConfirm }: RestartDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    cancelButton.current?.focus();

    const keepFocusInDialog = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) cancelButton.current?.focus();
    };
    document.addEventListener('focusin', keepFocusInDialog, true);

    return () => {
      document.removeEventListener('focusin', keepFocusInDialog, true);
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      returnFocus?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="restart-title"
      aria-describedby="restart-description"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancelRef.current();
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onCancelRef.current();
      }}
    >
      <div>
        <p className="kicker">Clear the table</p>
        <h2 id="restart-title">Restart match?</h2>
        <p id="restart-description">Scores and round progress will return to the beginning.</p>
        <div className="dialog-actions">
          <button ref={cancelButton} type="button" onClick={onCancel}>Cancel</button>
          <button className="confirm" type="button" onClick={onConfirm}>Restart</button>
        </div>
      </div>
    </dialog>
  );
}
