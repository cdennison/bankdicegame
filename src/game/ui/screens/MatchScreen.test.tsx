import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GameController } from '../../application/useGameController';
import type { GameState, PlayerDefinition } from '../../domain/types';
import { MatchScreen } from './MatchScreen';
import '../styles/game.css';

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
  reset: vi.fn(),
  ...overrides,
});

afterEach(cleanup);

describe('MatchScreen', () => {
  it('renders the round, pot, dice, current roller, and all eight ranked scores', () => {
    render(<MatchScreen controller={controller()} />);

    expect(screen.getByText('Round 1 / 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Pot: 42 points')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Current pot' })).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByLabelText('Dice: 3 and 5')).toBeInTheDocument();
    expect(screen.getByText('Alexandra Never-Truncated is up')).toBeInTheDocument();
    const board = screen.getByRole('list', { name: 'Scoreboard' });
    const rows = within(board).getAllByRole('listitem');
    expect(rows).toHaveLength(8);
    players.forEach((player, index) => {
      const row = rows[index]!;
      const fullName = within(row).getByText(player.name);
      const fullScore = within(row).getByText(String((7 - index) * 25));
      expect(fullName).toBeVisible();
      expect(fullName.textContent).toBe(player.name);
      expect(fullScore).toBeVisible();
      expect(fullScore.textContent).toBe(String((7 - index) * 25));
      expect(getComputedStyle(fullName).textOverflow).not.toBe('ellipsis');
      expect(getComputedStyle(fullName).whiteSpace).not.toBe('nowrap');
      expect(getComputedStyle(fullScore).textOverflow).not.toBe('ellipsis');
    });
  });

  it.each(['idle', 'thinking'] as const)(
    'keeps committed dice visible after presentation becomes %s',
    (mode) => {
      render(<MatchScreen controller={controller({
        state: state({
          pendingRoll: undefined,
          round: { ...state().round, lastDice: [3, 5] },
        }),
        presentation: { mode, narration: mode === 'thinking' ? 'Opponent is thinking.' : '' },
      })} />);

      expect(screen.getByLabelText('Dice: 3 and 5')).toBeInTheDocument();
    },
  );

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
    expect(screen.queryByRole('button', { name: 'Roll On' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stay In' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /roll/i })).not.toBeInTheDocument();
  });

  it('restores human controls when the next round reactivates the banked seat', () => {
    const inactivePlayers = state().players.map((player) =>
      player.id === 'human-1' ? { ...player, active: false } : player,
    );
    const { rerender } = render(<MatchScreen controller={controller({
      state: state({ players: inactivePlayers }),
      rankings: controller().rankings.map((player) =>
        player.id === 'human-1' ? { ...player, active: false } : player,
      ),
      legalActions: { canRoll: false, canStay: false, canBank: false },
    })} />);
    expect(screen.getByText('You banked. Watch the round finish.')).toBeInTheDocument();

    rerender(<MatchScreen controller={controller({
      state: state({ round: { ...state().round, roundNumber: 2, rollNumber: 0, pot: 0 } }),
      legalActions: { canRoll: true, canStay: false, canBank: false },
    })} />);

    expect(screen.getByText('Round 2 / 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
    expect(screen.queryByText('You banked. Watch the round finish.')).not.toBeInTheDocument();
  });

  it.each([
    {
      mode: 'rolling' as const,
      narration: 'Mira rolled 3 and 5.',
      event: { type: 'DiceRolled' as const, playerId: 'ai-0', dice: [3, 5] as const },
    },
    {
      mode: 'banking' as const,
      narration: 'Mira banked 42 points.',
      event: { type: 'PlayerBanked' as const, playerId: 'ai-0', amount: 42 },
    },
    {
      mode: 'bust' as const,
      narration: 'Round 1 busted. The pot is lost.',
      event: { type: 'RoundBusted' as const, roundNumber: 1, pot: 42 },
    },
    {
      mode: 'round-transition' as const,
      narration: 'Round 1 complete.',
      event: { type: 'RoundCompleted' as const, roundNumber: 1 },
    },
  ])('announces meaningful $mode events in one polite live region', ({ mode, narration, event }) => {
    render(<MatchScreen controller={controller({ presentation: { mode, narration, event } })} />);
    const live = screen.getAllByRole('status').find((status) => status.textContent === narration);
    expect(live).toBeDefined();
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(narration);
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it.each([
    { mode: 'thinking' as const, narration: 'Mira is thinking.' },
    { mode: 'revealing' as const, narration: 'Opponents are choosing.' },
    { mode: 'rolling' as const, narration: 'Mira is rolling.' },
  ])('does not announce purely visual $mode narration', ({ mode, narration }) => {
    render(<MatchScreen controller={controller({ presentation: { mode, narration } })} />);
    expect(screen.getByText(narration)).toBeInTheDocument();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(screen.getByRole('status', { name: 'Current pot' })).toHaveTextContent(/^Pot: 42 points$/);
    expect(statuses.find((status) => status.getAttribute('aria-label') === null)).toBeEmptyDOMElement();
  });

  it('exposes only committed pot changes through the atomic pot status', () => {
    const { rerender } = render(<MatchScreen controller={controller({
      state: state({ round: { ...state().round, pot: 42 } }),
      presentation: { mode: 'rolling', narration: 'Mira is rolling.' },
    })} />);
    expect(screen.getByRole('status', { name: 'Current pot' })).toHaveTextContent(/^Pot: 42 points$/);

    rerender(<MatchScreen controller={controller({
      state: state({ round: { ...state().round, pot: 50 } }),
      presentation: { mode: 'idle', narration: '' },
    })} />);

    expect(screen.getByRole('status', { name: 'Current pot' })).toHaveTextContent(/^Pot: 50 points$/);
    expect(screen.queryByText('Mira is rolling.')).not.toBeInTheDocument();
  });

  it('keeps restart keyboard focus modal, handles Escape, and restores the trigger', async () => {
    const user = userEvent.setup();
    render(<MatchScreen controller={controller()} />);
    const trigger = screen.getByRole('button', { name: 'Restart match' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Restart match?' });
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    expect(dialog).toHaveAccessibleDescription('Scores and round progress will return to the beginning.');
    expect(cancel).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    const reopenedDialog = screen.getByRole('dialog', { name: 'Restart match?' });
    const reopenedCancel = within(reopenedDialog).getByRole('button', { name: 'Cancel' });
    const confirm = within(reopenedDialog).getByRole('button', { name: 'Restart' });
    expect(reopenedCancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(reopenedCancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    trigger.focus();
    expect(reopenedCancel).toHaveFocus();
    confirm.focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('restores trigger focus after Cancel and invokes restart after Confirm', async () => {
    const user = userEvent.setup();
    const value = controller();
    render(<MatchScreen controller={value} />);
    const trigger = screen.getByRole('button', { name: 'Restart match' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(value.restart).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });
});
