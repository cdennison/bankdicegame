import { useState } from 'react';

import type { GameController } from '../../application/useGameController';
import type { OpponentProfile } from '../../strategies/reveals';
import { OPPONENT_PROFILES } from '../../strategies/reveals';
import { DecisionDock } from '../components/DecisionDock';
import { DicePair } from '../components/DicePair';
import { PotDisplay } from '../components/PotDisplay';
import { RestartDialog } from '../components/RestartDialog';
import { Scoreboard } from '../components/Scoreboard';
import { TurnNarrator } from '../components/TurnNarrator';

interface MatchScreenProps {
  readonly controller: GameController;
  readonly profiles?: Readonly<Record<string, OpponentProfile>>;
}

export function MatchScreen({ controller, profiles = OPPONENT_PROFILES }: MatchScreenProps) {
  const [restartOpen, setRestartOpen] = useState(false);
  const game = controller.state;
  if (!game) return null;

  const human = game.config.players.find(({ controller: owner }) => owner.type === 'human');
  const humanState = game.players.find(({ id }) => id === human?.id);
  const eventDice = controller.presentation.event?.type === 'DiceRolled'
    ? controller.presentation.event.dice
    : undefined;
  const dice = game.pendingRoll?.dice ?? eventDice;

  return (
    <section className="screen play-screen" aria-label="Bank It match">
      <div className="play-layout">
        <div className="game-board">
          <div className="round-meta">
            <div>
              <span>Match progress</span>
              <strong>Round {game.round.roundNumber} / {game.config.rounds}</strong>
            </div>
            <button className="text-button round-reset" type="button" onClick={() => setRestartOpen(true)}>
              Restart match
            </button>
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
        phase={game.phase}
        onRoll={controller.roll}
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
