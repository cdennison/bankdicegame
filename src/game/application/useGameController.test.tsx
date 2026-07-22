import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { playersFixture } from '../domain/fixtures';
import { useGameController } from './useGameController';
import { ZERO_TIMING } from './timing';

afterEach(() => {
  vi.useRealTimers();
});

describe('useGameController', () => {
  it('derives view data after starting a game', () => {
    const { result } = renderHook(() => useGameController());
    act(() => result.current.start(playersFixture(2)));

    expect(result.current.state).not.toBeNull();
    expect(result.current.rankings).toHaveLength(2);
    expect(result.current.currentPlayer?.id).toBe(result.current.state?.round.currentPlayerId);
  });

  it('aborts pending automatic work before restart', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useGameController({
      timing: { thinking: 100, dice: 100, strategyReveal: 100, roundTransition: 100 },
    }));
    act(() => result.current.start(playersFixture(2, { humans: [] })));
    expect(result.current.presentation.mode).toBe('thinking');

    await act(() => vi.advanceTimersByTimeAsync(50));
    act(() => result.current.restart());
    await act(() => vi.advanceTimersByTimeAsync(50));

    expect(result.current.state?.phase).toBe('awaiting-roll');
    expect(result.current.state?.round.rollNumber).toBe(0);
    unmount();
  });

  it('aborts pending automatic work and clears the match on reset', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useGameController({
      timing: { thinking: 100, dice: 100, strategyReveal: 100, roundTransition: 100 },
    }));
    act(() => result.current.start(playersFixture(2, { humans: [] })));
    expect(result.current.presentation.mode).toBe('thinking');

    await act(() => vi.advanceTimersByTimeAsync(50));
    act(() => result.current.reset());
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(result.current.state).toBeNull();
    expect(result.current.presentation.mode).toBe('idle');
    unmount();
  });

  it('aborts pending automatic work on unmount without unhandled rejections', async () => {
    vi.useFakeTimers();
    const unhandled = vi.fn();
    window.addEventListener('unhandledrejection', unhandled);
    const { result, unmount } = renderHook(() => useGameController({
      timing: { thinking: 100, dice: 100, strategyReveal: 100, roundTransition: 100 },
    }));
    act(() => result.current.start(playersFixture(2, { humans: [] })));
    unmount();
    await vi.runAllTimersAsync();

    expect(unhandled).not.toHaveBeenCalled();
    window.removeEventListener('unhandledrejection', unhandled);
  });

  it('advances a completed round once and reactivates banked seats', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useGameController({
      timing: { thinking: 0, dice: 0, strategyReveal: 0, roundTransition: 0, banking: 0, bust: 0 },
    }));
    act(() => result.current.start(playersFixture(2, { humans: [0, 1] })));

    for (let attempts = 0; attempts < 20 && result.current.state?.phase !== 'round-complete'; attempts += 1) {
      const phase = result.current.state?.phase;
      if (phase === 'awaiting-roll') act(() => result.current.roll());
      if (phase === 'awaiting-decisions') {
        act(() => {
          result.current.submitDecision('seat-0', 'bank');
          result.current.submitDecision('seat-1', 'bank');
        });
      }
      await act(() => vi.runAllTimersAsync());
    }

    expect(result.current.state?.phase).toBe('round-complete');
    expect(result.current.state?.players.every(({ active }) => !active)).toBe(true);

    act(() => result.current.advanceRound());

    expect(result.current.state?.phase).toBe('awaiting-roll');
    expect(result.current.state?.round.roundNumber).toBe(2);
    expect(result.current.state?.players.every(({ active }) => active)).toBe(true);
    unmount();
  });

  it('progresses automatic zero-timing turns without skipping the manual round pause', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useGameController({ timing: ZERO_TIMING }));
    act(() => result.current.start(playersFixture(2, { humans: [] })));

    for (let attempts = 0; attempts < 100 && result.current.state?.phase !== 'round-complete'; attempts += 1) {
      await act(() => vi.runAllTimersAsync());
    }

    expect(result.current.state?.phase).toBe('round-complete');
    expect(result.current.state?.round.roundNumber).toBe(1);
    expect(result.current.legalActions.canAdvanceRound).toBe(true);
    unmount();
  });
});
