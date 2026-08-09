import type { GameState } from '../domain/types';

const COOKIE_NAME = 'bankit_game_v1';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const readCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
};

export const saveGameState = (state: GameState): void => {
  try {
    const encoded = encodeURIComponent(JSON.stringify(state));
    document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch {
    // Storage can fail (quota, private browsing); losing persistence is not fatal.
  }
};

export const loadGameState = (): GameState | null => {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as GameState;
  } catch {
    return null;
  }
};

export const clearGameState = (): void => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
};
