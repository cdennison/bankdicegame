interface GameCodeFieldProps {
  readonly value: string;
  readonly error?: string;
  onChange(value: string): void;
}

const helpId = 'game-code-help';
const errorId = 'game-code-error';

export function GameCodeField({ value, error, onChange }: GameCodeFieldProps) {
  return (
    <div className="game-code-field">
      <label className="field-label" htmlFor="game-code">Challenge code <span>Optional</span></label>
      <input
        id="game-code"
        name="gameCode"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value.toUpperCase())}
        placeholder="BK1-XXXX-XXXX"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
      />
      <p className="field-help" id={helpId}>Leave blank for a new table, or enter a code to replay the same dice.</p>
      {error ? <p className="field-error" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
