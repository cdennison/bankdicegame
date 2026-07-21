import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const controller = vi.hoisted(() => ({
  state: null as null | Record<string, unknown>,
  presentation: { mode: 'idle', narration: '' },
  rankings: [] as Record<string, unknown>[],
  winners: [],
  legalActions: { canRoll: false, canStay: false, canBank: false },
  currentPlayer: undefined as Record<string, unknown> | undefined,
  decisionLabels: { stay: 'Roll On', bank: 'Bank' },
  start: vi.fn(),
  roll: vi.fn(),
  submitDecision: vi.fn(),
  restart: vi.fn(),
}));

vi.mock('../application/useGameController', () => ({
  useGameController: () => controller,
}));

import { GameApp } from './GameApp';

beforeEach(() => {
  controller.state = null;
  controller.rankings = [];
  controller.currentPlayer = undefined;
  controller.start.mockReset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GameApp', () => {
  it('renders the setup heading', () => {
    render(<GameApp />);
    expect(screen.getByRole('heading', { name: /choose your opponents/i })).toBeInTheDocument();
  });

  it('generates one crypto code and starts an exact normalized ordered config', async () => {
    const user = userEvent.setup();
    const getRandomValues = vi.spyOn(window.crypto, 'getRandomValues')
      .mockImplementation((values) => {
        if (values instanceof Uint32Array) values[0] = 0;
        return values;
      });
    render(<GameApp />);

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), 'Rae');
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(controller.start).toHaveBeenCalledWith({
      rounds: 10,
      seedCode: 'BK1-AAAA-AAAA',
      players: [
        { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' } },
        {
          id: 'opponent-vega',
          name: 'Vega',
          seatIndex: 1,
          controller: { type: 'strategy', strategyId: 'vega' },
        },
        {
          id: 'opponent-mira',
          name: 'Mira',
          seatIndex: 2,
          controller: { type: 'strategy', strategyId: 'mira' },
        },
      ],
    });
  });

  it('renders the playable match after the controller has started', () => {
    const human = { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' } };
    controller.state = {
      config: { rounds: 10, seedCode: 'BK1-AAAA-AAAA', players: [human] },
      players: [{ id: 'human-1', score: 0, active: true }],
      phase: 'awaiting-roll',
      round: {
        roundNumber: 1,
        pot: 0,
        rollNumber: 0,
        dangerRolls: 0,
        activePlayerIds: ['human-1'],
        currentPlayerId: 'human-1',
        lastDangerRollWasDouble: false,
      },
      random: {},
      firstStarterIndex: 0,
    };
    controller.rankings = [{ ...human, score: 0, active: true, rank: 1 }];
    controller.currentPlayer = human;
    controller.legalActions = { canRoll: true, canStay: false, canBank: false };

    render(<GameApp />);

    expect(screen.getByLabelText('Bank It match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
    expect(screen.queryByText(/coming next/i)).not.toBeInTheDocument();
  });
});
