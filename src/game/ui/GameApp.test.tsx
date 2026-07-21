import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const controller = vi.hoisted(() => ({ state: null, start: vi.fn() }));

vi.mock('../application/useGameController', () => ({
  useGameController: () => controller,
}));

import { GameApp } from './GameApp';

beforeEach(() => controller.start.mockReset());
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
});
