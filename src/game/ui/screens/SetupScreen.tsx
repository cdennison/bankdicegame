import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';

import { parseGameCode } from '../../domain/random';
import type { StrategyId } from '../../domain/types';
import type { OpponentProfile } from '../../strategies/reveals';
import { GameCodeField } from '../components/GameCodeField';
import { Icon } from '../components/Icon';
import { PlayerAvatar } from '../components/PlayerAvatar';

export interface SetupSubmission {
  readonly humanNames: readonly string[];
  readonly opponentIds: readonly StrategyId[];
  readonly seedCode: string;
}

interface SetupScreenProps {
  readonly opponents: Readonly<Record<StrategyId, OpponentProfile>>;
  readonly generateCode: () => string;
  onStart(submission: SetupSubmission): void;
}

const MAX_SEATS = 4;
const HUMAN_ACCENT = '#ffd84d';

export function SetupScreen({ opponents, generateCode, onStart }: SetupScreenProps) {
  const [humanNames, setHumanNames] = useState<string[]>(['You']);
  const [opponentIds, setOpponentIds] = useState<StrategyId[]>([]);
  const [seedCode, setSeedCode] = useState('');
  const [seedError, setSeedError] = useState<string>();
  const gameCodeInput = useRef<HTMLInputElement>(null);
  const seatsTaken = humanNames.length + opponentIds.length;
  const canAddHuman = seatsTaken < MAX_SEATS;
  const canStart =
    humanNames.every((name) => name.trim().length > 0) &&
    humanNames.length + opponentIds.length >= 2;

  useLayoutEffect(() => {
    if (seedError) gameCodeInput.current?.focus();
  }, [seedError]);

  const addHuman = () => {
    setHumanNames((current) => (current.length >= MAX_SEATS ? current : [...current, '']));
  };

  const renameHuman = (index: number, name: string) => {
    setHumanNames((current) => current.map((existing, i) => (i === index ? name : existing)));
  };

  const removeHuman = (index: number) => {
    setHumanNames((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const selectOpponent = (id: StrategyId) => {
    setOpponentIds((current) => {
      if (current.includes(id) || current.length + humanNames.length >= MAX_SEATS) return current;
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
      humanNames: humanNames.map((name) => name.trim()),
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
          <div className="lineup-heading">
            <h2>Human players</h2>
            <span>{humanNames.length} / {MAX_SEATS}</span>
          </div>
          {humanNames.map((name, index) => (
            <div className="name-entry" key={index}>
              <input
                id={index === 0 ? 'player-name' : undefined}
                name={`humanName-${index}`}
                type="text"
                maxLength={18}
                value={name}
                placeholder={`Player ${index + 1}`}
                onChange={(event) => renameHuman(index, event.currentTarget.value)}
                autoComplete="nickname"
                aria-label={`Human player ${index + 1} name`}
              />
              <span className="human-token" aria-hidden="true"><Icon name="die" /></span>
              {humanNames.length > 1 ? (
                <button
                  className="remove-player"
                  type="button"
                  aria-label={`Remove human player ${index + 1}`}
                  onClick={() => removeHuman(index)}
                >
                  <Icon name="trash" />
                </button>
              ) : null}
            </div>
          ))}
          <button className="text-button add-human" type="button" disabled={!canAddHuman} onClick={addHuman}>
            <Icon name="plus" /> Add a human player
          </button>
          <p className="field-help" id="name-help">
            {humanNames.length > 1
              ? 'Human players share this device and take turns, one at a time.'
              : 'One human pilot, or add more to share this device. Fill the rest of the table with AI challengers.'}
          </p>

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
            <span>{seatsTaken} / {MAX_SEATS}</span>
          </div>
          <ul className="lineup-list" aria-label="Your lineup" aria-live="polite">
            {humanNames.map((name, index) => (
              <li className="lineup-player" style={{ '--player-color': HUMAN_ACCENT } as CSSProperties} key={`human-${index}`}>
                <PlayerAvatar src="Y" alt="Human player avatar" accent={HUMAN_ACCENT} />
                <div><strong>{name.trim() || `Player ${index + 1}`}</strong><span>Human player</span></div>
                <span className="seat-marker">{String(index + 1).padStart(2, '0')}</span>
              </li>
            ))}
            {opponentIds.map((id, index) => {
              const profile = opponents[id];
              return (
                <li className="lineup-player" style={{ '--player-color': profile.accent } as CSSProperties} key={id}>
                  <PlayerAvatar {...profile.avatar} accent={profile.accent} />
                  <div><strong>{profile.name}</strong><span>Local AI challenger · seat {humanNames.length + index + 1}</span></div>
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
              const disabled = selected || seatsTaken >= MAX_SEATS;
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
