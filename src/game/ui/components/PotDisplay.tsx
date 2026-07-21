interface PotDisplayProps {
  readonly pot: number;
  readonly rollNumber: number;
}

export function PotDisplay({ pot, rollNumber }: PotDisplayProps) {
  return (
    <div className="pot-display" aria-label={`Pot: ${pot} points`}>
      <span className="pot-label">Table pot</span>
      <strong className="pot-total">{pot}</strong>
      <span className="roll-status">Roll {rollNumber + 1} next</span>
    </div>
  );
}
