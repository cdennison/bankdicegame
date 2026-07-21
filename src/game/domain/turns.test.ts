import { describe, expect, it } from 'vitest';

import { nextActivePlayer, roundStarter } from './turns';

const seats = ['north', 'east', 'south', 'west'] as const;

describe('nextActivePlayer', () => {
  it('moves clockwise to the next active seat', () => {
    expect(nextActivePlayer(seats, seats, 'north')).toBe('east');
  });

  it('wraps clockwise after the final seat', () => {
    expect(nextActivePlayer(seats, seats, 'west')).toBe('north');
  });

  it('skips a banked seat', () => {
    expect(nextActivePlayer(seats, ['north', 'south', 'west'], 'north')).toBe('south');
  });

  it('skips several banked seats', () => {
    expect(nextActivePlayer(seats, ['north', 'west'], 'north')).toBe('west');
  });

  it('returns the only remaining active player from any seat', () => {
    expect(nextActivePlayer(seats, ['south'], 'west')).toBe('south');
  });

  it('throws the active-player invariant for an empty active set', () => {
    expect(() => nextActivePlayer(seats, [], 'north')).toThrowError(
      'Cannot select the next player without any active players.',
    );
  });
});

describe('roundStarter', () => {
  it('rotates clockwise from the original first starter using one-based rounds', () => {
    expect(roundStarter(seats, 2, 1)).toBe('south');
    expect(roundStarter(seats, 2, 2)).toBe('west');
    expect(roundStarter(seats, 2, 3)).toBe('north');
    expect(roundStarter(seats, 2, 5)).toBe('south');
  });

  it('does not depend on the active or final player state from the prior round', () => {
    const lastPlayerFromRoundOne = nextActivePlayer(seats, ['west'], 'east');

    expect(lastPlayerFromRoundOne).toBe('west');
    expect(roundStarter(seats, 1, 2)).toBe('south');
  });
});
