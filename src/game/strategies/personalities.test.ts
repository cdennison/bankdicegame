import { describe, expect, it } from 'vitest';

import type { StrategyId } from '../domain/types';
import { getStrategy } from './personalities';
import { OPPONENT_PROFILES } from './reveals';
import type { StrategyContext } from './types';

const context = (
  overrides: Partial<StrategyContext> = {},
): StrategyContext => ({
  pot: 0,
  rollNumber: 3,
  dangerRollCount: 0,
  roundNumber: 5,
  totalRounds: 10,
  ownScore: 1000,
  opponentScores: [1000, 1000, 1000],
  activeOpponentCount: 3,
  totalOpponentCount: 3,
  lastDangerRollWasDouble: false,
  ...overrides,
});

describe('fictional opponent strategies', () => {
  it('Mira banks at the State Delta target of 340 when down 500 in round 5 at four seats', () => {
    const mira = getStrategy('mira');
    const view = context({
      pot: 339,
      ownScore: 1000,
      opponentScores: [1500, 1000, 1000],
    });

    expect(mira.decide(view)).toBe('stay');
    expect(mira.decide({ ...view, pot: 340 })).toBe('bank');
  });

  it('Mira banks at the State Delta target of 145 when up 200 in round 2 at four seats', () => {
    const mira = getStrategy('mira');
    const view = context({
      pot: 144,
      roundNumber: 2,
      ownScore: 1200,
    });

    expect(mira.decide(view)).toBe('stay');
    expect(mira.decide({ ...view, pot: 145 })).toBe('bank');
  });

  it('Knox banks immediately after a danger double', () => {
    const knox = getStrategy('knox');

    expect(knox.decide(context({ lastDangerRollWasDouble: true }))).toBe('bank');
  });

  it('Knox uses a 250 pot safety cap', () => {
    const knox = getStrategy('knox');

    expect(knox.decide(context({ pot: 249 }))).toBe('stay');
    expect(knox.decide(context({ pot: 250 }))).toBe('bank');
  });

  it('Knox uses an eight-danger-roll safety cap', () => {
    const knox = getStrategy('knox');

    expect(knox.decide(context({ dangerRollCount: 7 }))).toBe('stay');
    expect(knox.decide(context({ dangerRollCount: 8 }))).toBe('bank');
  });

  it('Vega banks at 200 but not 199', () => {
    const vega = getStrategy('vega');

    expect(vega.decide(context({ pot: 199 }))).toBe('stay');
    expect(vega.decide(context({ pot: 200 }))).toBe('bank');
  });

  it('returns a strategy whose ID matches every supported opponent ID', () => {
    const ids: readonly StrategyId[] = ['mira', 'knox', 'vega'];

    expect(ids.map((id) => getStrategy(id).id)).toEqual(ids);
  });
});

describe('opponent profiles', () => {
  it('keeps setup copy personality-only and provides replaceable avatar metadata', () => {
    const setupCopy = Object.values(OPPONENT_PROFILES)
      .map(({ setupDescription }) => setupDescription)
      .join(' ');

    expect(setupCopy).not.toMatch(/State Delta|Double Hunter|Fixed|200|target|formula|model/i);
    for (const profile of Object.values(OPPONENT_PROFILES)) {
      expect(profile.avatar.src).toBeTruthy();
      expect(profile.avatar.alt).toBeTruthy();
      expect(profile.accent).toBeTruthy();
    }
  });

  it('exposes the approved plain-language strategy reveals for Results', () => {
    expect(OPPONENT_PROFILES.mira.resultReveal).toEqual({
      name: 'State Delta',
      description: 'Changes her target using score gap, rounds remaining, and table size.',
    });
    expect(OPPONENT_PROFILES.knox.resultReveal).toEqual({
      name: 'Double Hunter',
      description: 'Chases a danger-zone double with a pot and roll-count safety cap.',
    });
    expect(OPPONENT_PROFILES.vega.resultReveal).toEqual({
      name: 'Fixed 200',
      description: 'Uses the strongest simple baseline from the original experiments.',
    });
  });
});
