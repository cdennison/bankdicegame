import type { PlayerId } from './types';

export const nextActivePlayer = (
  seatOrder: readonly PlayerId[],
  activeIds: readonly PlayerId[],
  afterId: PlayerId,
): PlayerId => {
  if (activeIds.length === 0) {
    throw new Error('Cannot select the next player without any active players.');
  }

  const active = new Set(activeIds);
  const afterIndex = seatOrder.indexOf(afterId);

  for (let offset = 1; offset <= seatOrder.length; offset += 1) {
    const candidate = seatOrder[(afterIndex + offset) % seatOrder.length];
    if (candidate !== undefined && active.has(candidate)) return candidate;
  }

  // Game configuration guarantees that active IDs belong to the seat order.
  return activeIds[0]!;
};

export const roundStarter = (
  seatOrder: readonly PlayerId[],
  firstStarterIndex: number,
  roundNumber: number,
): PlayerId => seatOrder[(firstStarterIndex + roundNumber - 1) % seatOrder.length]!;
