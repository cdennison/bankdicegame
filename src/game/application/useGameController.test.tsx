import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { playersFixture } from '../domain/fixtures';
import { useGameController } from './useGameController';

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
});
