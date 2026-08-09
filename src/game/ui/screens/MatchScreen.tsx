import { useEffect, useRef, useState } from 'react';

import type { GameController } from '../../application/useGameController';
import type { PlayerId } from '../../domain/types';
import type { OpponentProfile } from '../../strategies/reveals';
import { OPPONENT_PROFILES } from '../../strategies/reveals';
import { DecisionDock } from '../components/DecisionDock';
import { DicePair } from '../components/DicePair';
import { PotDisplay } from '../components/PotDisplay';
import { RestartDialog } from '../components/RestartDialog';
import { Scoreboard } from '../components/Scoreboard';
import { SpeedModeToggle } from '../components/SpeedModeToggle';
import { TurnNarrator } from '../components/TurnNarrator';

interface MatchScreenProps {
  readonly controller: GameController;
  readonly profiles?: Readonly<Record<string, OpponentProfile>>;
  readonly speedMode?: boolean;
  readonly onSpeedModeChange?: (enabled: boolean) => void;
}

export function MatchScreen({
  controller,
  profiles = OPPONENT_PROFILES,
  speedMode = false,
  onSpeedModeChange = () => undefined,
}: MatchScreenProps) {
  const [restartOpen, setRestartOpen] = useState(false);
  const game = controller.state;

  const humans = game?.config.players.filter(({ controller: owner }) => owner.type === 'human') ?? [];
  const isHotSeat = humans.length > 1;
  const activeHumanId = controller.activeHumanId;
  const [revealedHumanId, setRevealedHumanId] = useState<PlayerId | undefined>(activeHumanId);
  const lastConfigRef = useRef(game?.config);

  useEffect(() => {
    const configChanged = lastConfigRef.current !== game?.config;
    lastConfigRef.current = game?.config;
    setRevealedHumanId((current) => {
      if (configChanged) return activeHumanId;
      if (activeHumanId === undefined) return current;
      if (!isHotSeat) return activeHumanId;
      return current === undefined ? activeHumanId : current;
    });
  }, [game?.config, activeHumanId, isHotSeat]);

  if (!game) return null;

  const awaitingHandoff =
    isHotSeat &&
    game.phase === 'awaiting-roll' &&
    activeHumanId !== undefined &&
    activeHumanId !== revealedHumanId;
  const visibleHumanId = awaitingHandoff ? undefined : activeHumanId;
  const humanState = game.players.find(({ id }) => id === visibleHumanId);
  const visibleHuman = game.config.players.find(({ id }) => id === visibleHumanId);
  const incomingHuman = game.config.players.find(({ id }) => id === activeHumanId);
  const dice = game.pendingRoll?.dice ?? game.round.lastDice;
  const pendingHumanIds =
    isHotSeat && game.phase === 'awaiting-decisions' && game.decisionSnapshot
      ? game.decisionSnapshot.pendingPlayerIds.filter((id) => {
          const definition = game.config.players.find((player) => player.id === id);
          return (
            definition?.controller.type === 'human' &&
            game.decisionSnapshot!.decisions[id] === undefined
          );
        })
      : [];

  return (
    <section className={`screen play-screen${speedMode ? ' speed-mode' : ''}`} aria-label="Bank It match">
      <div className="play-layout">
        <div className="game-board">
          <div className="round-meta">
            <div>
              <span>Match progress</span>
              <strong>Round {game.round.roundNumber} / {game.config.rounds}</strong>
            </div>
            <div className="match-preferences">
              <SpeedModeToggle enabled={speedMode} onChange={onSpeedModeChange} />
              <button className="text-button round-reset" type="button" onClick={() => setRestartOpen(true)}>
                Restart match
              </button>
            </div>
          </div>
          <div className="pot-zone">
            <PotDisplay pot={game.round.pot} rollNumber={game.round.rollNumber} />
            <DicePair dice={dice} rolling={controller.presentation.mode === 'rolling'} />
          </div>
          <TurnNarrator currentPlayer={controller.currentPlayer} presentation={controller.presentation} />
        </div>
        <Scoreboard
          rankings={controller.rankings}
          currentPlayerId={game.round.currentPlayerId}
          profiles={profiles}
          pendingHumanIds={pendingHumanIds}
          onBank={(playerId) => controller.submitDecision(playerId, 'bank')}
        />
      </div>
      {awaitingHandoff ? (
        <section className="action-dock handoff-dock" aria-label="Pass the device">
          <div className="game-actions single-action">
            <p className="handoff-message">Pass the device to <strong>{incomingHuman?.name}</strong></p>
            <button className="game-action" type="button" onClick={() => setRevealedHumanId(activeHumanId)}>
              I'm ready
            </button>
          </div>
        </section>
      ) : (
        <DecisionDock
          humanId={visibleHumanId}
          humanName={visibleHuman?.name}
          showTurnOwner={isHotSeat}
          soloHuman={!isHotSeat}
          humanActive={humanState?.active ?? false}
          legalActions={controller.legalActions}
          labels={controller.decisionLabels}
          nextRoundNumber={game.round.roundNumber + 1}
          phase={game.phase}
          onRoll={controller.roll}
          onAdvanceRound={controller.advanceRound}
          onContinueDecisions={controller.advanceDecisions}
          onDecision={controller.submitDecision}
        />
      )}
      <RestartDialog
        open={restartOpen}
        onCancel={() => setRestartOpen(false)}
        onConfirm={() => {
          setRestartOpen(false);
          controller.restart();
        }}
      />
    </section>
  );
}
