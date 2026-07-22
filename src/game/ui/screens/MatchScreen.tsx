import { useState } from 'react';

import type { GameController } from '../../application/useGameController';
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
  if (!game) return null;

  const human = game.config.players.find(({ controller: owner }) => owner.type === 'human');
  const humanState = game.players.find(({ id }) => id === human?.id);
  const dice = game.pendingRoll?.dice ?? game.round.lastDice;

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
        />
      </div>
      <DecisionDock
        humanId={human?.id}
        humanActive={humanState?.active ?? false}
        legalActions={controller.legalActions}
        labels={controller.decisionLabels}
        nextRoundNumber={game.round.roundNumber + 1}
        phase={game.phase}
        onRoll={controller.roll}
        onAdvanceRound={controller.advanceRound}
        onDecision={controller.submitDecision}
      />
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
