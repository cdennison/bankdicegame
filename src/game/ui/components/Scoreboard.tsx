import type { CSSProperties } from 'react';

import type { RankedPlayer } from '../../domain/selectors';
import type { OpponentProfile } from '../../strategies/reveals';

interface ScoreboardProps {
  readonly rankings: readonly RankedPlayer[];
  readonly currentPlayerId: string;
  readonly profiles: Readonly<Record<string, OpponentProfile>>;
}

const HUMAN_ACCENT = '#ffd84d';

export function Scoreboard({ rankings, currentPlayerId, profiles }: ScoreboardProps) {
  return (
    <section className="scoreboard-wrap" aria-labelledby="scoreboard-heading">
      <div className="scoreboard-heading">
        <h2 id="scoreboard-heading">Scoreboard</h2>
        <span>Banked total</span>
      </div>
      <ol className="scoreboard" aria-label="Scoreboard">
        {rankings.map((player) => {
          const profile = player.controller.type === 'strategy'
            ? profiles[player.controller.strategyId]
            : undefined;
          const style = {
            '--row-color': profile?.accent ?? HUMAN_ACCENT,
          } as CSSProperties;
          const isCurrent = player.id === currentPlayerId;
          return (
            <li className={`score-row${isCurrent ? ' current' : ''}`} key={player.id} style={style}>
              <span className="score-rank">#{player.rank}</span>
              <span className="score-player">
                <strong>{player.name}</strong>
                <span>{player.active ? 'Active' : 'Banked'}{isCurrent ? ' · rolling' : ''}</span>
              </span>
              <strong className="score-value">{player.score}</strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
