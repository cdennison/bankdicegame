interface SpeedModeToggleProps {
  readonly enabled: boolean;
  readonly onChange: (enabled: boolean) => void;
}

export function SpeedModeToggle({ enabled, onChange }: SpeedModeToggleProps) {
  return (
    <button
      className="speed-mode-toggle"
      type="button"
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
    >
      Speed Mode {enabled ? 'On' : 'Off'}
    </button>
  );
}
