import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RankedPlayer } from '../../domain/selectors';
import type { GameConfig } from '../../domain/types';
import { OPPONENT_PROFILES } from '../../strategies/reveals';
import { ResultsScreen } from './ResultsScreen';

const config: GameConfig = {
  rounds: 10,
  seedCode: 'BK1-AAKD-JXV2',
  players: [
    { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' } },
    { id: 'opponent-vega', name: 'Vega', seatIndex: 1, controller: { type: 'strategy', strategyId: 'vega' } },
    { id: 'opponent-mira', name: 'Mira', seatIndex: 2, controller: { type: 'strategy', strategyId: 'mira' } },
  ],
};

const rankings: readonly RankedPlayer[] = [
  { ...config.players[1]!, score: 120, active: false, rank: 1 },
  { ...config.players[0]!, score: 999, active: false, rank: 2 },
  { ...config.players[2]!, score: 40, active: false, rank: 3 },
];

const renderResults = (
  overrides: Partial<React.ComponentProps<typeof ResultsScreen>> = {},
) => {
  const onPlayAgain = vi.fn();
  const onNewGame = vi.fn();
  render(
    <ResultsScreen
      config={config}
      rankings={rankings}
      winners={[rankings[0]!]}
      profiles={OPPONENT_PROFILES}
      onPlayAgain={onPlayAgain}
      onNewGame={onNewGame}
      {...overrides}
    />,
  );
  return { onPlayAgain, onNewGame };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ResultsScreen', () => {
  it('uses the selected winner and ordered rankings exactly as supplied', () => {
    renderResults();

    expect(screen.getByRole('heading', { name: 'Vega wins!' })).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Final rankings' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/1.*Vega.*120/),
      expect.stringMatching(/2.*Rae.*999/),
      expect.stringMatching(/3.*Mira.*40/),
    ]);
  });

  it('announces tied winners from the winner selector output', () => {
    renderResults({ winners: [rankings[0]!, rankings[1]!] });

    expect(screen.getByRole('heading', { name: 'Vega & Rae tie!' })).toBeInTheDocument();
  });

  it('reveals only strategies represented by opponents in this match', () => {
    renderResults();

    expect(screen.getByText('Fixed 200')).toBeInTheDocument();
    expect(screen.getByText('State Delta')).toBeInTheDocument();
    expect(screen.queryByText('Double Hunter')).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('Vega avatar')).not.toHaveLength(0);
    expect(screen.getAllByLabelText('Mira avatar')).not.toHaveLength(0);
  });

  it('keeps the versioned code selectable and politely reports copy success', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderResults();

    const code = screen.getByText('BK1-AAKD-JXV2');
    expect(code).toHaveAttribute('tabindex', '0');
    expect(code).toHaveClass('result-code');
    await user.click(screen.getByRole('button', { name: 'Copy Game Code' }));

    expect(writeText).toHaveBeenCalledWith('BK1-AAKD-JXV2');
    expect(screen.getByRole('status', { name: 'Copy status' })).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status', { name: 'Copy status' })).toHaveTextContent('Game code copied.');
  });

  it('keeps the code selectable and politely reports clipboard failure', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderResults();

    await user.click(screen.getByRole('button', { name: 'Copy Game Code' }));

    expect(screen.getByRole('status', { name: 'Copy status' })).toHaveTextContent('Copy failed. Select the code and copy it manually.');
    expect(screen.getByText('BK1-AAKD-JXV2')).toBeVisible();
  });

  it('delegates rematch and clean-start actions', async () => {
    const user = userEvent.setup();
    const { onPlayAgain, onNewGame } = renderResults();

    await user.click(screen.getByRole('button', { name: 'Play Again' }));
    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(onPlayAgain).toHaveBeenCalledOnce();
    expect(onNewGame).toHaveBeenCalledOnce();
  });
});
