import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GameController } from '../../application/useGameController';
import type { GameState, PlayerDefinition } from '../../domain/types';
import { MatchScreen } from './MatchScreen';

const players: PlayerDefinition[] = [
  { id: 'human-1', name: 'Alexandra Never-Truncated', seatIndex: 0, controller: { type: 'human' } },
  ...Array.from({ length: 7 }, (_, index): PlayerDefinition => ({
    id: `ai-${index}`,
    name: `Opponent ${index + 1} With A Full Name`,
    seatIndex: index + 1,
    controller: { type: 'strategy', strategyId: index % 2 ? 'mira' : 'vega' },
  })),
];

const state = (overrides: Partial<GameState> = {}): GameState => ({
  config: { rounds: 10, seedCode: 'BK1-AAKD-JXV2', players },
  players: players.map(({ id }, index) => ({ id, score: (7 - index) * 25, active: true })),
  phase: 'awaiting-roll',
  round: {
    roundNumber: 1,
    pot: 42,
    rollNumber: 2,
    dangerRolls: 0,
    activePlayerIds: players.map(({ id }) => id),
    currentPlayerId: 'human-1',
    lastDangerRollWasDouble: false,
  },
  random: { version: 1, seed: 1, value: 1, draws: 0 },
  firstStarterIndex: 0,
  pendingRoll: { dice: [3, 5] },
  ...overrides,
});

const controller = (overrides: Partial<GameController> = {}): GameController => ({
  state: state(),
  presentation: { mode: 'idle', narration: '' },
  rankings: players.map((player, index) => ({
    ...player,
    score: (7 - index) * 25,
    active: true,
    rank: index + 1,
  })),
  winners: [],
  legalActions: { canRoll: true, canStay: false, canBank: false },
  currentPlayer: players[0],
  decisionLabels: { stay: 'Roll On', bank: 'Bank' },
  start: vi.fn(),
  roll: vi.fn(),
  submitDecision: vi.fn(),
  restart: vi.fn(),
  ...overrides,
});

afterEach(cleanup);

describe('MatchScreen', () => {
  it('renders the round, pot, dice, current roller, and all eight ranked scores', () => {
    render(<MatchScreen controller={controller()} />);

    expect(screen.getByText('Round 1 / 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Pot: 42 points')).toBeInTheDocument();
    expect(screen.getByLabelText('Dice: 3 and 5')).toBeInTheDocument();
    expect(screen.getByText('Alexandra Never-Truncated is up')).toBeInTheDocument();
    const board = screen.getByRole('list', { name: 'Scoreboard' });
    expect(within(board).getAllByRole('listitem')).toHaveLength(8);
    expect(within(board).getByText('Alexandra Never-Truncated')).toBeVisible();
    expect(within(board).getByText('175')).toBeVisible();
  });

  it('offers only Roll before the third safe roll and invokes the controlled action', async () => {
    const user = userEvent.setup();
    const value = controller();
    render(<MatchScreen controller={value} />);

    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Bank' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Roll' }));
    expect(value.roll).toHaveBeenCalledOnce();
  });

  it.each(['Roll On', 'Stay In'] as const)('uses the derived %s decision label', async (label) => {
    const user = userEvent.setup();
    const value = controller({
      state: state({ phase: 'awaiting-decisions' }),
      legalActions: { canRoll: false, canStay: true, canBank: true },
      decisionLabels: { stay: label, bank: 'Bank' },
    });
    render(<MatchScreen controller={value} />);

    await user.click(screen.getByRole('button', { name: label }));
    await user.click(screen.getByRole('button', { name: 'Bank' }));
    expect(value.submitDecision).toHaveBeenNthCalledWith(1, 'human-1', 'stay');
    expect(value.submitDecision).toHaveBeenNthCalledWith(2, 'human-1', 'bank');
  });

  it('shows automatic play instead of controls while AI acts', () => {
    render(<MatchScreen controller={controller({
      legalActions: { canRoll: false, canStay: false, canBank: false },
      currentPlayer: players[1],
      presentation: { mode: 'thinking', narration: 'Opponent 1 is thinking.' },
    })} />);

    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument();
    expect(screen.getByText('Automatic play in progress')).toBeInTheDocument();
  });

  it('marks inactive players as banked in text and observes after the human banks', () => {
    const inactiveState = state({
      players: state().players.map((player) => player.id === 'human-1' ? { ...player, active: false } : player),
      round: { ...state().round, activePlayerIds: players.slice(1).map(({ id }) => id), currentPlayerId: 'ai-0' },
    });
    const rankings = controller().rankings.map((player) =>
      player.id === 'human-1' ? { ...player, active: false } : player,
    );
    render(<MatchScreen controller={controller({
      state: inactiveState,
      rankings,
      legalActions: { canRoll: false, canStay: false, canBank: false },
      currentPlayer: players[1],
    })} />);

    expect(screen.getByText('Banked')).toBeInTheDocument();
    expect(screen.getByText('You banked. Watch the round finish.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bank' })).not.toBeInTheDocument();
  });

  it('announces meaningful controller narration in one polite live region', () => {
    render(<MatchScreen controller={controller({
      presentation: { mode: 'banking', narration: 'Mira banked 42 points.' },
    })} />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Mira banked 42 points.');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('confirms restart accessibly and allows cancellation', async () => {
    const user = userEvent.setup();
    const value = controller();
    render(<MatchScreen controller={value} />);

    await user.click(screen.getByRole('button', { name: 'Restart match' }));
    expect(screen.getByRole('dialog', { name: 'Restart match?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restart match' }));
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(value.restart).toHaveBeenCalledOnce();
  });
});
