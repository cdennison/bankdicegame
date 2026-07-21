import { useGameController } from '../application/useGameController';
import { createConfig } from '../domain/config';
import { generateGameCode } from '../domain/random';
import type { PlayerDefinition } from '../domain/types';
import { OPPONENT_PROFILES } from '../strategies/reveals';
import { Icon } from './components/Icon';
import { MatchScreen } from './screens/MatchScreen';
import { SetupScreen, type SetupSubmission } from './screens/SetupScreen';

export function GameApp() {
  const controller = useGameController();

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

  return (
    <main className="game-stage">
      <div className="app-shell">
        <header className="game-header">
          <a className="icon-button" href="/" aria-label="Back to Bank It landing page"><Icon name="back" /></a>
          <div className="game-brand"><span className="mini-die" aria-hidden="true">5</span><span>BANK IT</span></div>
          <span className="demo-badge">Local strategy game</span>
        </header>
        {controller.state ? (
          <MatchScreen controller={controller} profiles={OPPONENT_PROFILES} />
        ) : (
          <SetupScreen
            opponents={OPPONENT_PROFILES}
            generateCode={() => generateGameCode({
              getRandomValues: (values) =>
                window.crypto.getRandomValues(values as Uint32Array<ArrayBuffer>),
            })}
            onStart={start}
          />
        )}
      </div>
    </main>
  );
}
