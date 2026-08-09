import { afterEach, describe, expect, it } from 'vitest';

import { playersFixture } from '../domain/fixtures';
import { createGame } from '../domain/reducer';
import { clearGameState, loadGameState, saveGameState } from './persistence';

afterEach(() => {
  clearGameState();
});

describe('game state persistence', () => {
  it('round-trips a game state through the cookie', () => {
    const state = createGame(playersFixture(3));
    saveGameState(state);

    expect(loadGameState()).toEqual(state);
  });

  it('returns null when nothing is stored', () => {
    expect(loadGameState()).toBeNull();
  });

  it('returns null and does not throw for a corrupted cookie value', () => {
    document.cookie = 'bankit_game_v1=not-json; path=/';

    expect(loadGameState()).toBeNull();
  });

  it('removes the stored state', () => {
    const state = createGame(playersFixture(3));
    saveGameState(state);
    clearGameState();

    expect(loadGameState()).toBeNull();
  });
});
