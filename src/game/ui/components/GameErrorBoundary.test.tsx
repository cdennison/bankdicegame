import { Component, useState, type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame, transition } from '../../domain/reducer';
import { playersFixture } from '../../domain/fixtures';
import { GameErrorBoundary } from './GameErrorBoundary';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

class ThrowingChild extends Component {
  render(): ReactNode {
    throw new Error('unexpected render failure');
  }
}

function RecoveryHarness() {
  const [failed, setFailed] = useState(true);
  return (
    <GameErrorBoundary onRestart={() => setFailed(false)}>
      {failed ? <ThrowingChild /> : <h1>Choose your opponents</h1>}
    </GameErrorBoundary>
  );
}

describe('GameErrorBoundary', () => {
  it('recovers an unexpected render failure into a clean setup view', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<RecoveryHarness />);

    expect(screen.getByRole('heading', { name: 'Game interrupted' })).toBeInTheDocument();
    expect(screen.getByText('Your match could not continue. Start a clean game.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restart' }));

    expect(screen.getByRole('heading', { name: 'Choose your opponents' })).toBeInTheDocument();
    expect(screen.queryByText('Game interrupted')).not.toBeInTheDocument();
  });

  it('does not treat a typed command rejection as an exceptional render failure', () => {
    const current = createGame(playersFixture(2));
    const rejected = transition(current, { type: 'COMMIT_ROLL' });
    render(
      <GameErrorBoundary onRestart={vi.fn()}>
        <p>{rejected.ok ? 'Accepted' : rejected.error.code}</p>
      </GameErrorBoundary>,
    );

    expect(screen.getByText('COMMAND_NOT_ALLOWED')).toBeInTheDocument();
    expect(screen.queryByText('Game interrupted')).not.toBeInTheDocument();
  });
});
