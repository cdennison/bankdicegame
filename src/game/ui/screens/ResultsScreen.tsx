import { useState } from 'react';

import type { RankedPlayer } from '../../domain/selectors';
import type { GameConfig, StrategyId } from '../../domain/types';
import type { OpponentProfile } from '../../strategies/reveals';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface ResultsScreenProps {
  readonly config: GameConfig;
  readonly rankings: readonly RankedPlayer[];
  readonly winners: readonly RankedPlayer[];
  readonly profiles: Readonly<Record<StrategyId, OpponentProfile>>;
  onPlayAgain(): void;
  onNewGame(): void;
}

const HUMAN_ACCENT = '#ffd84d';

const winnerHeading = (winners: readonly RankedPlayer[]): string => {
  if (winners.length === 0) return 'Match complete';
  if (winners.length === 1) return `${winners[0]!.name} wins!`;
  const names = winners.map(({ name }) => name);
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)} tie!`;
};

export function ResultsScreen({
  config,
  rankings,
  winners,
  profiles,
  onPlayAgain,
  onNewGame,
}: ResultsScreenProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const opponents = config.players.flatMap((player) =>
    player.controller.type === 'strategy'
      ? [{ player, profile: profiles[player.controller.strategyId] }]
      : [],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(config.seedCode);
      setCopyStatus('Game code copied.');
    } catch {
      setCopyStatus('Copy failed. Select the code and copy it manually.');
    }
  };

  return (
    <section className="screen results-screen" aria-labelledby="results-title">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>

      <header className="winner-hero">
        <p className="kicker">Final transmission</p>
        <div className="trophy-wrap" aria-hidden="true">
          <svg viewBox="0 0 64 64"><path d="M20 8h24v12c0 11-5 19-12 19s-12-8-12-19V8Z" /><path d="M20 14H9v5c0 8 5 13 13 13M44 14h11v5c0 8-5 13-13 13M32 39v9M23 56h18M27 48h10v8" /></svg>
        </div>
        <h1 id="results-title">{winnerHeading(winners)}</h1>
        <p>{winners.length > 1 ? 'Shared first place after ten rounds.' : 'The table is settled after ten rounds.'}</p>
      </header>

      <ol className="final-ranking" aria-label="Final rankings">
        {rankings.map((player) => {
          const profile = player.controller.type === 'strategy'
            ? profiles[player.controller.strategyId]
            : undefined;
          return (
            <li className="final-row" key={player.id}>
              <span>{player.rank}</span>
              <PlayerAvatar
                src={profile?.avatar.src ?? player.name.slice(0, 1).toUpperCase()}
                alt={profile?.avatar.alt ?? `${player.name} avatar`}
                accent={profile?.accent ?? HUMAN_ACCENT}
              />
              <b>{player.name}</b>
              <strong>{player.score}</strong>
            </li>
          );
        })}
      </ol>

      <section className="result-reveals" aria-labelledby="reveal-title">
        <p className="kicker" id="reveal-title">Opponent strategies revealed</p>
        <div className="reveal-grid">
          {opponents.map(({ player, profile }) => (
            <article className="result-insight" key={player.id}>
              <PlayerAvatar {...profile.avatar} accent={profile.accent} />
              <div>
                <span>{player.name}</span>
                <h2>{profile.resultReveal.name}</h2>
                <p>{profile.resultReveal.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="result-code-panel" aria-labelledby="result-code-title">
        <div>
          <span id="result-code-title">Game code</span>
          <code className="result-code" tabIndex={0}>{config.seedCode}</code>
        </div>
        <button className="secondary-result" type="button" onClick={copyCode}>Copy Game Code</button>
        <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
      </section>

      <div className="result-actions">
        <button type="button" onClick={onPlayAgain}>Play Again</button>
        <button className="secondary-result" type="button" onClick={onNewGame}>New Game</button>
      </div>
    </section>
  );
}
