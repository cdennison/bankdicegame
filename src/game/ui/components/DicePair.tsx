interface DicePairProps {
  readonly dice?: readonly [number, number];
  readonly rolling: boolean;
}

function Die({ value }: { readonly value: number }) {
  return <span className="game-die" data-value={value} aria-hidden="true" />;
}

export function DicePair({ dice, rolling }: DicePairProps) {
  if (!dice) return <div className="dice-pair dice-pair-empty" aria-label="Dice not rolled">—</div>;
  return (
    <div className={`dice-pair${rolling ? ' rolling' : ''}`} aria-label={`Dice: ${dice[0]} and ${dice[1]}`}>
      <Die value={dice[0]} />
      <Die value={dice[1]} />
    </div>
  );
}
