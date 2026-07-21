import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';

import { parseGameCode } from '../../domain/random';
import type { StrategyId } from '../../domain/types';
import type { OpponentProfile } from '../../strategies/reveals';
import { GameCodeField } from '../components/GameCodeField';
import { Icon } from '../components/Icon';
import { PlayerAvatar } from '../components/PlayerAvatar';

export interface SetupSubmission {
  readonly humanName: string;
  readonly opponentIds: readonly StrategyId[];
  readonly seedCode: string;
}

interface SetupScreenProps {
  readonly opponents: Readonly<Record<StrategyId, OpponentProfile>>;
  readonly generateCode: () => string;
  onStart(submission: SetupSubmission): void;
}

const MAX_OPPONENTS = 3;
const HUMAN_ACCENT = '#ffd84d';

export function SetupScreen({ opponents, generateCode, onStart }: SetupScreenProps) {
  const [humanName, setHumanName] = useState('You');
  const [opponentIds, setOpponentIds] = useState<StrategyId[]>([]);
  const [seedCode, setSeedCode] = useState('');
  const [seedError, setSeedError] = useState<string>();
  const gameCodeInput = useRef<HTMLInputElement>(null);
  const canStart = humanName.trim().length > 0 && opponentIds.length > 0;

  useLayoutEffect(() => {
    if (seedError) gameCodeInput.current?.focus();
  }, [seedError]);

  const selectOpponent = (id: StrategyId) => {
    setOpponentIds((current) => {
      if (current.includes(id) || current.length >= MAX_OPPONENTS) return current;
      return [...current, id];
    });
  };

  const removeOpponent = (id: StrategyId) => {
    setOpponentIds((current) => current.filter((opponentId) => opponentId !== id));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canStart) return;

    const normalizedCode = seedCode.trim().toUpperCase();
    if (normalizedCode) {
      const parsed = parseGameCode(normalizedCode);
      if (!parsed.ok) {
        setSeedError(parsed.error.message);
        return;
      }
    }

    setSeedError(undefined);
    onStart({
      humanName: humanName.trim(),
      opponentIds: [...opponentIds],
      seedCode: normalizedCode || generateCode(),
    });
  };

  return (
    <form className="screen setup-screen" aria-labelledby="setup-title" onSubmit={submit}>
      <div className="screen-bar">
        <div><p className="kicker">Build your table</p><h1 id="setup-title">Choose your opponents</h1></div>
        <button className="text-button" type="submit" disabled={!canStart}>Start</button>
      </div>

      <div className="setup-layout">
        <div className="setup-main">
          <label className="field-label" htmlFor="player-name">Your name</label>
          <div className="name-entry">
            <input
              id="player-name"
              name="humanName"
              type="text"
              maxLength={18}
              value={humanName}
              onChange={(event) => setHumanName(event.currentTarget.value)}
              autoComplete="nickname"
              aria-describedby="name-help"
            />
            <span className="human-token" aria-hidden="true"><Icon name="die" /></span>
          </div>
          <p className="field-help" id="name-help">One human pilot. Choose one to three AI challengers.</p>

          <GameCodeField
            ref={gameCodeInput}
            value={seedCode}
            error={seedError}
            onChange={(value) => {
              setSeedCode(value);
              if (seedError) setSeedError(undefined);
            }}
          />

          <div className="lineup-heading">
            <h2>Your lineup</h2>
            <span>{opponentIds.length + 1} / 4</span>
          </div>
          <ul className="lineup-list" aria-label="Your lineup" aria-live="polite">
            <li className="lineup-player" style={{ '--player-color': HUMAN_ACCENT } as CSSProperties}>
              <PlayerAvatar src="Y" alt="Human player avatar" accent={HUMAN_ACCENT} />
              <div><strong>{humanName.trim() || 'Your seat'}</strong><span>Human player</span></div>
              <span className="seat-marker">01</span>
            </li>
            {opponentIds.map((id, index) => {
              const profile = opponents[id];
              return (
                <li className="lineup-player" style={{ '--player-color': profile.accent } as CSSProperties} key={id}>
                  <PlayerAvatar {...profile.avatar} accent={profile.accent} />
                  <div><strong>{profile.name}</strong><span>Local AI challenger · seat {index + 2}</span></div>
                  <button className="remove-player" type="button" aria-label={`Remove ${profile.name}`} onClick={() => removeOpponent(id)}>
                    <Icon name="trash" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="opponent-picker" aria-labelledby="opponent-title">
          <div className="picker-heading"><p className="kicker">AI roster</p><h2 id="opponent-title">Pick a mind to beat</h2></div>
          <div className="opponent-options">
            {(Object.entries(opponents) as [StrategyId, OpponentProfile][]).map(([id, profile]) => {
              const selected = opponentIds.includes(id);
              const disabled = selected || opponentIds.length >= MAX_OPPONENTS;
              return (
                <button
                  className={`opponent-card${selected ? ' selected' : ''}`}
                  type="button"
                  style={{ '--opponent-color': profile.accent } as CSSProperties}
                  disabled={disabled}
                  aria-label={`Select ${profile.name}`}
                  aria-pressed={selected}
                  onClick={() => selectOpponent(id)}
                  key={id}
                >
                  <strong>{profile.name}</strong><span className="plus"><Icon name="plus" /></span>
                  <span className="model">Fictional challenger</span><p>{profile.setupDescription}</p>
                </button>
              );
            })}
          </div>
          <p className="local-note"><span />AI choices run locally. No network or live model calls.</p>
        </aside>
      </div>
    </form>
  );
}
