import { useState } from 'react';

import { ZERO_TIMING } from '../application/timing';
import { useGameController } from '../application/useGameController';
import { createConfig } from '../domain/config';
import { formatGameCode, generateGameCode, parseGameCode } from '../domain/random';
import type { PlayerDefinition } from '../domain/types';
import { OPPONENT_PROFILES } from '../strategies/reveals';
import { Icon } from './components/Icon';
import { GameErrorBoundary } from './components/GameErrorBoundary';
import { MatchScreen } from './screens/MatchScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SetupScreen, type SetupSubmission } from './screens/SetupScreen';

export function GameApp() {
  const [speedMode, setSpeedMode] = useState(false);
  const controller = useGameController({ timing: speedMode ? ZERO_TIMING : undefined });

  const newGame = () => {
    setSpeedMode(false);
    controller.reset();
  };

  const generateCode = () => generateGameCode({
    getRandomValues: (values) =>
      window.crypto.getRandomValues(values as Uint32Array<ArrayBuffer>),
  });

  const start = (submission: SetupSubmission) => {
    const players: PlayerDefinition[] = [
      { id: 'human-1', name: submission.humanName, seatIndex: 0, controller: { type: 'human' } },
      ...submission.opponentIds.map((strategyId, index) => ({
        id: `opponent-${strategyId}`,
        name: OPPONENT_PROFILES[strategyId].name,
        seatIndex: index + 1,
        controller: { type: 'strategy' as const, strategyId },
      })),
    ];
    const result = createConfig({ rounds: 10, seedCode: submission.seedCode, players });
    if (result.ok) controller.start(result.config);
  };

  const playAgain = () => {
    const current = controller.state?.config;
    if (!current) return;
    let seedCode = generateCode();
    if (seedCode === current.seedCode) {
      const parsed = parseGameCode(seedCode);
      if (parsed.ok) seedCode = formatGameCode((parsed.seed + 1) >>> 0);
    }
    const result = createConfig({ ...current, seedCode, players: current.players });
    if (result.ok) controller.start(result.config);
  };

  const content = controller.state
    ? controller.state.phase === 'game-complete'
      ? (
          <ResultsScreen
            config={controller.state.config}
            rankings={controller.rankings}
            winners={controller.winners}
            profiles={OPPONENT_PROFILES}
            onPlayAgain={playAgain}
            onNewGame={newGame}
          />
        )
      : (
          <MatchScreen
            controller={controller}
            profiles={OPPONENT_PROFILES}
            speedMode={speedMode}
            onSpeedModeChange={setSpeedMode}
          />
        )
    : (
        <SetupScreen
          opponents={OPPONENT_PROFILES}
          generateCode={generateCode}
          onStart={start}
        />
      );

  return (
    <main className="game-stage">
      <div className="app-shell">
        <header className="game-header">
          <a className="icon-button" href="/" aria-label="Back to Bank It landing page"><Icon name="back" /></a>
          <div className="game-brand"><span className="mini-die" aria-hidden="true">5</span><span>BANK IT</span></div>
          <div className="header-actions">
            <a className="strategy-link" href="/learn/">
              <Icon name="scan" /> <span>Crack the strategy</span>
            </a>
            <span className="demo-badge">Local strategy game</span>
          </div>
        </header>
        <GameErrorBoundary onRestart={newGame}>{content}</GameErrorBoundary>
      </div>
    </main>
  );
}
