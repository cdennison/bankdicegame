#!/usr/bin/env python3
"""Distribution of perfect-hindsight solo scores in Bank It."""

from __future__ import annotations

import random


def simulate_oracle_game(rng: random.Random, *, rounds: int = 10) -> int:
    """Return the ten-round score earned by banking just before every bust."""
    if rounds <= 0:
        raise ValueError("rounds must be positive")

    score = 0
    for _ in range(rounds):
        pot = 0
        roll_number = 0
        while True:
            die_1 = rng.randint(1, 6)
            die_2 = rng.randint(1, 6)
            roll_number += 1
            total = die_1 + die_2

            if roll_number <= 3:
                pot += 70 if total == 7 else total
            elif total == 7:
                score += pot
                break
            elif die_1 == die_2:
                pot *= 2
            else:
                pot += total
    return score


def simulate_oracle_scores(
    *,
    games: int = 100_000,
    rounds: int = 10,
    seed_start: int = 0,
) -> tuple[int, ...]:
    """Return oracle scores from independent consecutive integer seeds."""
    if games <= 0:
        raise ValueError("games must be positive")
    if rounds <= 0:
        raise ValueError("rounds must be positive")
    return tuple(
        simulate_oracle_game(random.Random(seed), rounds=rounds)
        for seed in range(seed_start, seed_start + games)
    )
