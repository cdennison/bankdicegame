import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGame, transition } from '../domain/reducer';
import type { GameConfig } from '../domain/types';

const controller = vi.hoisted(() => ({
  state: null as null | Record<string, unknown>,
  presentation: { mode: 'idle', narration: '' },
  rankings: [] as Record<string, unknown>[],
  winners: [] as Record<string, unknown>[],
  legalActions: { canRoll: false, canStay: false, canBank: false, canAdvanceRound: false },
  currentPlayer: undefined as Record<string, unknown> | undefined,
  decisionLabels: { stay: 'Roll On', bank: 'Bank' },
  activeHumanId: undefined as string | undefined,
  start: vi.fn(),
  roll: vi.fn(),
  advanceRound: vi.fn(),
  submitDecision: vi.fn(),
  restart: vi.fn(),
  reset: vi.fn(),
}));

const useGameControllerMock = vi.hoisted(() => vi.fn((_options: unknown) => controller));

vi.mock('../application/useGameController', () => ({
  useGameController: (options: unknown) => {
    useGameControllerMock(options);
    return controller;
  },
}));

import { GameApp } from './GameApp';

const human = { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' as const } };
const matchState = () => ({
  config: { rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: [human] },
  players: [{ id: human.id, score: 42, active: true }],
  phase: 'awaiting-roll',
  round: {
    roundNumber: 1, pot: 0, rollNumber: 0, dangerRolls: 0,
    activePlayerIds: [human.id], currentPlayerId: human.id, lastDangerRollWasDouble: false,
  },
  random: {},
  firstStarterIndex: 0,
});
const completedState = () => ({
  ...matchState(),
  phase: 'game-complete',
  players: [{ id: human.id, score: 42, active: false }],
  round: { ...matchState().round, roundNumber: 10, activePlayerIds: [] },
});

beforeEach(() => {
  controller.state = null;
  controller.rankings = [];
  controller.winners = [];
  controller.currentPlayer = undefined;
  controller.activeHumanId = undefined;
  controller.start.mockReset();
  controller.reset.mockReset();
  controller.restart.mockReset();
  controller.advanceRound.mockReset();
  useGameControllerMock.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GameApp', () => {
  it('uses normal timing by default and zero timing after Speed Mode is enabled', async () => {
    const user = userEvent.setup();
    controller.state = matchState();
    const { rerender } = render(<GameApp />);

    expect(useGameControllerMock).toHaveBeenLastCalledWith({ timing: undefined });
    await user.click(screen.getByRole('button', { name: 'Speed Mode Off' }));
    rerender(<GameApp />);

    expect(useGameControllerMock).toHaveBeenLastCalledWith({
      timing: {
        thinking: 0, dice: 0, strategyReveal: 0, banking: 0, bust: 0, roundTransition: 0,
      },
    });
  });

  it('keeps Speed Mode enabled through Play Again', async () => {
    const user = userEvent.setup();
    controller.state = matchState();
    const { rerender } = render(<GameApp />);
    await user.click(screen.getByRole('button', { name: 'Speed Mode Off' }));
    controller.state = completedState();
    rerender(<GameApp />);
    await user.click(screen.getByRole('button', { name: 'Play Again' }));

    expect(useGameControllerMock).toHaveBeenLastCalledWith({ timing: expect.objectContaining({ dice: 0 }) });
  });

  it('turns Speed Mode off before resetting for New Game', async () => {
    const user = userEvent.setup();
    controller.state = matchState();
    const { rerender } = render(<GameApp />);
    await user.click(screen.getByRole('button', { name: 'Speed Mode Off' }));
    controller.state = completedState();
    rerender(<GameApp />);
    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(controller.reset).toHaveBeenCalledOnce();
    expect(useGameControllerMock).toHaveBeenLastCalledWith({ timing: undefined });
  });

  it('turns Speed Mode off when recovering from a render error', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    controller.state = matchState();
    const { rerender } = render(<GameApp />);
    await user.click(screen.getByRole('button', { name: 'Speed Mode Off' }));

    controller.state = { ...matchState(), config: { ...matchState().config, players: null } };
    rerender(<GameApp />);
    controller.reset.mockImplementation(() => { controller.state = null; });
    await user.click(screen.getByRole('button', { name: 'Restart' }));

    expect(controller.reset).toHaveBeenCalledOnce();
    expect(useGameControllerMock).toHaveBeenLastCalledWith({ timing: undefined });
  });

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

    await user.clear(screen.getByLabelText(/human player 1 name/i));
    await user.type(screen.getByLabelText(/human player 1 name/i), 'Rae');
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
    controller.activeHumanId = human.id;
    controller.legalActions = {
      canRoll: true,
      canStay: false,
      canBank: false,
      canAdvanceRound: false,
    };

    render(<GameApp />);

    expect(screen.getByLabelText('Bank It match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
    expect(screen.queryByText(/coming next/i)).not.toBeInTheDocument();
  });

  it('renders selector-owned results and starts one new-code rematch with the exact lineup', async () => {
    const user = userEvent.setup();
    const players = [
      { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' as const } },
      { id: 'opponent-vega', name: 'Vega', seatIndex: 1, controller: { type: 'strategy' as const, strategyId: 'vega' as const } },
      { id: 'opponent-mira', name: 'Mira', seatIndex: 2, controller: { type: 'strategy' as const, strategyId: 'mira' as const } },
    ];
    controller.state = {
      config: { rounds: 10, seedCode: 'BK1-AAKD-JXV2', players },
      players: players.map(({ id }, index) => ({ id, score: 100 - index, active: false })),
      phase: 'game-complete',
      round: { roundNumber: 10, pot: 0, rollNumber: 3, dangerRolls: 0, activePlayerIds: [], currentPlayerId: 'human-1', lastDangerRollWasDouble: false },
      random: {},
      firstStarterIndex: 0,
    };
    controller.rankings = [
      { ...players[1], score: 77, active: false, rank: 1 },
      { ...players[0], score: 999, active: false, rank: 2 },
      { ...players[2], score: 20, active: false, rank: 3 },
    ];
    controller.winners = [controller.rankings[0]];
    const getRandomValues = vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((values) => {
      if (values instanceof Uint32Array) values[0] = 0;
      return values;
    });

    render(<GameApp />);
    expect(screen.getByRole('heading', { name: 'Vega wins!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play Again' }));

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(controller.start).toHaveBeenCalledOnce();
    expect(controller.start).toHaveBeenCalledWith({
      rounds: 10,
      seedCode: 'BK1-AAAA-AAAA',
      players,
    });
    expect(controller.start.mock.calls[0]![0].seedCode).not.toBe('BK1-AAKD-JXV2');
    expect(controller.restart).not.toHaveBeenCalled();
  });

  it('resets a completed match to a clean setup', async () => {
    const user = userEvent.setup();
    controller.state = {
      config: { rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: [] },
      players: [], phase: 'game-complete', round: {}, random: {}, firstStarterIndex: 0,
    };
    controller.rankings = [];
    controller.winners = [];
    controller.reset.mockImplementation(() => { controller.state = null; });
    const { rerender } = render(<GameApp />);

    await user.click(screen.getByRole('button', { name: 'New Game' }));
    rerender(<GameApp />);

    expect(controller.reset).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: /choose your opponents/i })).toBeInTheDocument();
  });

  it('moves focus and announces the selector-owned winner when a match becomes complete', () => {
    const human = { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' as const } };
    controller.state = {
      config: { rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: [human] },
      players: [{ id: human.id, score: 42, active: true }],
      phase: 'awaiting-roll',
      round: { roundNumber: 10, pot: 0, rollNumber: 3, dangerRolls: 0, activePlayerIds: [human.id], currentPlayerId: human.id, lastDangerRollWasDouble: false },
      random: {}, firstStarterIndex: 0,
    };
    controller.rankings = [{ ...human, score: 42, active: true, rank: 1 }];
    controller.currentPlayer = human;
    const { rerender } = render(<GameApp />);

    controller.state = {
      ...controller.state,
      players: [{ id: human.id, score: 42, active: false }],
      phase: 'game-complete',
      round: { ...controller.state.round as object, activePlayerIds: [] },
    };
    controller.rankings = [{ ...human, score: 42, active: false, rank: 1 }];
    controller.winners = [controller.rankings[0]!];
    rerender(<GameApp />);

    const results = screen.getByRole('region', { name: 'Match results' });
    expect(results).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Rae wins!' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Match result announcement' })).toHaveTextContent('Rae wins!');
    expect(screen.getAllByRole('status', { name: 'Match result announcement' })).toHaveLength(1);
  });

  it('re-entering an old code recreates its first starter and dice through public engine APIs', async () => {
    const user = userEvent.setup();
    const originalConfig: GameConfig = {
      rounds: 10,
      seedCode: 'BK1-AAKD-JXV2',
      players: [
        { id: 'human-1', name: 'Rae', seatIndex: 0, controller: { type: 'human' } },
        { id: 'opponent-vega', name: 'Vega', seatIndex: 1, controller: { type: 'strategy', strategyId: 'vega' } },
      ],
    };
    const firstSequence = (gameConfig: GameConfig) => {
      const initial = createGame(gameConfig);
      const rolled = transition(initial, { type: 'ROLL_DICE' });
      if (!rolled.ok) throw new Error(rolled.error.code);
      return {
        starter: initial.round.currentPlayerId,
        dice: rolled.state.pendingRoll?.dice,
      };
    };
    controller.state = {
      config: originalConfig,
      players: [], phase: 'game-complete', round: {}, random: {}, firstStarterIndex: 0,
    };
    controller.rankings = [];
    controller.winners = [];
    controller.reset.mockImplementation(() => { controller.state = null; });
    const { rerender } = render(<GameApp />);

    await user.click(screen.getByRole('button', { name: 'New Game' }));
    rerender(<GameApp />);
    await user.clear(screen.getByLabelText(/human player 1 name/i));
    await user.type(screen.getByLabelText(/human player 1 name/i), 'Rae');
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.type(screen.getByLabelText(/challenge code/i), originalConfig.seedCode);
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    const reenteredConfig = controller.start.mock.calls[0]![0];
    expect(firstSequence(reenteredConfig)).toEqual(firstSequence(originalConfig));
  });
});
