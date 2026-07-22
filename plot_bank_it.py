#!/usr/bin/env python3
"""Balanced simulation data for Bank It strategy plots."""

from __future__ import annotations

import itertools
import math
import random
from dataclasses import dataclass
from typing import Sequence

from bank_it import (
    Strategy,
    at_pot,
    play_game,
    strategies,
    submitted_strategies,
)


@dataclass(frozen=True)
class RatePoint:
    strategy: str
    games_played: int
    win_rate: float


@dataclass(frozen=True)
class FinalRate:
    strategy: str
    appearances: int
    win_rate: float
    ci95: float


@dataclass(frozen=True)
class SimulationSummary:
    games: int
    series: dict[str, tuple[RatePoint, ...]]
    final_rates: tuple[FinalRate, ...]


def all_strategy_field() -> tuple[Strategy, ...]:
    """Return every existing policy, rejecting ambiguous duplicate names."""
    field = strategies() + submitted_strategies()
    names = [strategy.name for strategy in field]
    if len(names) != len(set(names)):
        raise ValueError("duplicate strategy name")
    return field


def fixed_threshold_field() -> tuple[Strategy, ...]:
    """Return fixed-pot policies from 50 through 400 in steps of 10."""
    return tuple(
        Strategy(f"Pot {target}", "", at_pot(target))
        for target in range(50, 401, 10)
    )


def _ci95(appearances: int, win_share: float, win_share_squared: float) -> float:
    if appearances < 2:
        return 0.0
    sample_variance = (
        win_share_squared - win_share * win_share / appearances
    ) / (appearances - 1)
    sample_standard_error = math.sqrt(max(0.0, sample_variance) / appearances)
    return 1.96 * sample_standard_error


def simulate_balanced_convergence(
    field: Sequence[Strategy],
    *,
    players: int,
    rounds: int,
    epochs: int,
    seed: int,
    checkpoint_every: int,
) -> SimulationSummary:
    """Simulate shuffled complete matchup epochs and retain cumulative rates."""
    ordered_field = tuple(field)
    rng = random.Random(seed)
    appearances = {strategy.name: 0 for strategy in ordered_field}
    win_shares = {strategy.name: 0.0 for strategy in ordered_field}
    win_share_squares = {strategy.name: 0.0 for strategy in ordered_field}
    points: dict[str, list[RatePoint]] = {
        strategy.name: [] for strategy in ordered_field
    }
    games = 0

    for _ in range(epochs):
        matchups = list(itertools.combinations(ordered_field, players))
        rng.shuffle(matchups)
        for matchup in matchups:
            seated_field = list(matchup)
            rng.shuffle(seated_field)
            scores = play_game(seated_field, rng, rounds=rounds)
            high_score = max(scores)
            winners = {index for index, score in enumerate(scores) if score == high_score}
            share = 1.0 / len(winners)
            games += 1

            for index, strategy in enumerate(seated_field):
                name = strategy.name
                outcome = share if index in winners else 0.0
                appearances[name] += 1
                win_shares[name] += outcome
                win_share_squares[name] += outcome * outcome
                if appearances[name] % checkpoint_every == 0:
                    points[name].append(
                        RatePoint(
                            strategy=name,
                            games_played=appearances[name],
                            win_rate=win_shares[name] / appearances[name],
                        )
                    )

    for strategy in ordered_field:
        name = strategy.name
        played = appearances[name]
        if not points[name] or points[name][-1].games_played != played:
            points[name].append(
                RatePoint(
                    strategy=name,
                    games_played=played,
                    win_rate=win_shares[name] / played if played else 0.0,
                )
            )

    final_rates = tuple(
        FinalRate(
            strategy=strategy.name,
            appearances=appearances[strategy.name],
            win_rate=(
                win_shares[strategy.name] / appearances[strategy.name]
                if appearances[strategy.name]
                else 0.0
            ),
            ci95=_ci95(
                appearances[strategy.name],
                win_shares[strategy.name],
                win_share_squares[strategy.name],
            ),
        )
        for strategy in ordered_field
    )
    return SimulationSummary(
        games=games,
        series={name: tuple(strategy_points) for name, strategy_points in points.items()},
        final_rates=final_rates,
    )
