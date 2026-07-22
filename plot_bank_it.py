#!/usr/bin/env python3
"""Balanced simulation data for Bank It strategy plots."""

from __future__ import annotations

import argparse
import csv
import itertools
import math
import random
from dataclasses import dataclass
from pathlib import Path
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


DEFAULT_OUTPUT_DIR = Path("docs/design/artifacts/learn-plots")
DEFAULT_SEED = 20260722
DEFAULT_CONVERGENCE_EPOCHS = 50
DEFAULT_THRESHOLD_EPOCHS = 10
DEFAULT_CHECKPOINT_EVERY = 1000

NIGHT = "#08121d"
SLATE = "#152b37"
PAPER = "#f8f3e8"
MUTED = "#a9bcc3"
GOLD = "#ffb43f"
MINT = "#3ed6a4"
BLUE = "#5974ff"
VIOLET = "#9d8cff"
CORAL = "#ff654d"


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
    players: int = 4,
    rounds: int = 10,
    epochs: int,
    seed: int = 20260722,
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


def write_convergence_csv(summary: SimulationSummary, path: Path) -> None:
    """Write cumulative tie-adjusted rates as percentages."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("strategy", "games_played", "win_rate"))
        for strategy, points in summary.series.items():
            for point in points:
                writer.writerow(
                    (strategy, point.games_played, f"{point.win_rate * 100:.6f}")
                )


def _fixed_target(name: str) -> int:
    try:
        return int(name.removeprefix("Pot "))
    except ValueError as error:
        raise ValueError(f"invalid fixed-threshold strategy name: {name!r}") from error


def write_threshold_csv(summary: SimulationSummary, path: Path) -> None:
    """Write numerically ordered fixed-target rates and confidence intervals."""
    path.parent.mkdir(parents=True, exist_ok=True)
    rates = sorted(summary.final_rates, key=lambda row: _fixed_target(row.strategy))
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("target", "appearances", "win_rate", "ci95"))
        for row in rates:
            writer.writerow(
                (
                    _fixed_target(row.strategy),
                    row.appearances,
                    f"{row.win_rate * 100:.6f}",
                    f"{row.ci95 * 100:.6f}",
                )
            )


def _pyplot():
    import matplotlib

    matplotlib.use("Agg", force=True)
    matplotlib.rcParams["svg.hashsalt"] = "bank-it-20260722"
    from matplotlib import pyplot

    return pyplot


def _style_axes(axis) -> None:
    axis.set_facecolor(SLATE)
    axis.tick_params(colors=MUTED, labelsize=9)
    for spine in axis.spines.values():
        spine.set_color("#3a5360")
    axis.grid(axis="y", color=PAPER, alpha=0.12, linewidth=0.8)
    axis.set_axisbelow(True)


def _save_figure(figure, svg_path: Path, png_path: Path) -> None:
    svg_path.parent.mkdir(parents=True, exist_ok=True)
    png_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        svg_path,
        format="svg",
        facecolor=figure.get_facecolor(),
        metadata={
            "Creator": "Bank It deterministic plot generator",
            "Date": "2026-07-22",
        },
    )
    svg_text = "\n".join(
        line.rstrip() for line in svg_path.read_text(encoding="utf-8").splitlines()
    )
    svg_path.write_text(f"{svg_text}\n", encoding="utf-8")
    figure.savefig(
        png_path,
        format="png",
        dpi=180,
        facecolor=figure.get_facecolor(),
    )


def _strategy_color(name: str) -> str:
    if name.startswith("Solution"):
        return VIOLET
    if name.startswith("Pot") or name.startswith("Fixed Pot"):
        return GOLD
    if "Adaptive" in name or "State-Aware" in name:
        return MINT
    if "Lead" in name or "Catch" in name:
        return BLUE
    return CORAL


def render_convergence(
    summary: SimulationSummary,
    svg_path: Path,
    png_path: Path,
) -> None:
    """Render every strategy's cumulative tie-adjusted win-rate history."""
    pyplot = _pyplot()
    figure, axis = pyplot.subplots(figsize=(16, 10), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    line_styles = ("-", "--", "-.", ":")
    markers = ("o", "s", "^", "D", "v")

    for index, (strategy, points) in enumerate(summary.series.items()):
        axis.plot(
            [point.games_played for point in points],
            [point.win_rate * 100 for point in points],
            color=_strategy_color(strategy),
            linestyle=line_styles[index % len(line_styles)],
            marker=markers[index % len(markers)],
            markevery=max(1, len(points) // 8),
            markersize=3.5,
            linewidth=1.7,
            alpha=0.9,
            label=strategy,
        )

    axis.axhline(
        25,
        color=PAPER,
        linestyle="--",
        linewidth=1.3,
        alpha=0.75,
        label="Four-player reference (25%)",
    )
    axis.set_title(
        "Which Bank It strategies hold up?",
        color=PAPER,
        fontsize=23,
        fontweight="bold",
        loc="left",
        pad=31,
    )
    axis.text(
        0,
        1.015,
        "Cumulative tie-adjusted win rate across balanced four-player matchups",
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel("Games played by each strategy", color=PAPER, labelpad=10)
    axis.set_ylabel("Cumulative win rate (%)", color=PAPER, labelpad=10)
    legend = axis.legend(
        loc="upper center",
        bbox_to_anchor=(0.5, -0.11),
        ncol=4,
        frameon=False,
        fontsize=8.5,
        labelcolor=PAPER,
        handlelength=3,
    )
    for text in legend.get_texts():
        text.set_color(PAPER)
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def render_threshold_sweep(
    summary: SimulationSummary,
    svg_path: Path,
    png_path: Path,
) -> None:
    """Render the constrained fixed-threshold sweep with 95% uncertainty."""
    pyplot = _pyplot()
    rates = sorted(summary.final_rates, key=lambda row: _fixed_target(row.strategy))
    targets = [_fixed_target(row.strategy) for row in rates]
    wins = [row.win_rate * 100 for row in rates]
    intervals = [row.ci95 * 100 for row in rates]
    lower = [max(0, rate - interval) for rate, interval in zip(wins, intervals)]
    upper = [rate + interval for rate, interval in zip(wins, intervals)]
    best_index = max(range(len(rates)), key=lambda index: wins[index])

    figure, axis = pyplot.subplots(figsize=(13, 8), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    axis.fill_between(
        targets,
        lower,
        upper,
        color=BLUE,
        alpha=0.22,
        label="95% simulation uncertainty",
    )
    axis.plot(
        targets,
        wins,
        color=GOLD,
        marker="o",
        markersize=5,
        linewidth=2.2,
        label="Observed fixed-target win rate",
    )
    axis.scatter(
        [targets[best_index]],
        [wins[best_index]],
        s=115,
        color=MINT,
        edgecolor=NIGHT,
        linewidth=1.5,
        zorder=4,
        label="Highest observed in tested range",
    )
    best_target = targets[best_index]
    tested_maximum = targets[-1]
    highest_label = _highest_observed_label(best_target, tested_maximum)
    axis.annotate(
        highest_label.replace(": ", ":\n", 1),
        xy=(targets[best_index], wins[best_index]),
        xytext=_best_annotation_offset(best_index, len(rates)),
        textcoords="offset points",
        color=PAPER,
        fontsize=11,
        fontweight="bold",
        arrowprops={"arrowstyle": "->", "color": MINT, "linewidth": 1.5},
        bbox={"boxstyle": "round,pad=0.45", "facecolor": SLATE, "edgecolor": MINT},
    )
    axis.set_title(
        "Fixed-target results across the tested range",
        color=PAPER,
        fontsize=22,
        fontweight="bold",
        loc="left",
        pad=31,
    )
    range_subtitle = f"Targets {targets[0]}–{tested_maximum} only"
    if best_target == tested_maximum:
        range_subtitle += " · Larger targets were not evaluated"
    axis.text(
        0,
        1.015,
        range_subtitle,
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel("Fixed banking target", color=PAPER, labelpad=10)
    axis.set_ylabel("Tie-adjusted win rate (%)", color=PAPER, labelpad=10)
    axis.set_xticks(targets[::2])
    legend = axis.legend(loc="best", frameon=False, fontsize=9)
    for text in legend.get_texts():
        text.set_color(PAPER)
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def _best_annotation_offset(index: int, point_count: int) -> tuple[int, int]:
    """Place a best-point callout toward the plot interior."""
    return (-180, 24) if index >= point_count / 2 else (18, 24)


def _highest_observed_label(target: int, tested_maximum: int) -> str:
    label = f"Highest observed in tested range: {target}"
    return f"{label} (range maximum)" if target == tested_maximum else label


def _generate_plot_data(
    output_dir: Path,
    *,
    seed: int,
    convergence_epochs: int,
    threshold_epochs: int,
    checkpoint_every: int,
    convergence_field: Sequence[Strategy],
    threshold_field: Sequence[Strategy],
) -> tuple[tuple[Path, ...], SimulationSummary, SimulationSummary]:
    output_dir.mkdir(parents=True, exist_ok=True)
    convergence = simulate_balanced_convergence(
        convergence_field,
        epochs=convergence_epochs,
        seed=seed,
        checkpoint_every=checkpoint_every,
    )
    threshold = simulate_balanced_convergence(
        threshold_field,
        epochs=threshold_epochs,
        seed=seed,
        checkpoint_every=checkpoint_every,
    )
    convergence_csv = output_dir / "all-strategies-convergence.csv"
    convergence_svg = output_dir / "all-strategies-convergence.svg"
    convergence_png = output_dir / "all-strategies-convergence.png"
    threshold_csv = output_dir / "fixed-threshold-sweep.csv"
    threshold_svg = output_dir / "fixed-threshold-sweep.svg"
    threshold_png = output_dir / "fixed-threshold-sweep.png"
    paths = (
        convergence_csv,
        convergence_svg,
        convergence_png,
        threshold_csv,
        threshold_svg,
        threshold_png,
    )
    write_convergence_csv(convergence, convergence_csv)
    render_convergence(convergence, convergence_svg, convergence_png)
    write_threshold_csv(threshold, threshold_csv)
    render_threshold_sweep(threshold, threshold_svg, threshold_png)
    return paths, convergence, threshold


def generate_plots(
    output_dir: Path,
    *,
    seed: int = DEFAULT_SEED,
    convergence_epochs: int = DEFAULT_CONVERGENCE_EPOCHS,
    threshold_epochs: int = DEFAULT_THRESHOLD_EPOCHS,
    checkpoint_every: int = DEFAULT_CHECKPOINT_EVERY,
    convergence_field: Sequence[Strategy] | None = None,
    threshold_field: Sequence[Strategy] | None = None,
) -> tuple[Path, ...]:
    """Generate the two auditable CSV/SVG/PNG plot sets."""
    paths, _, _ = _generate_plot_data(
        output_dir,
        seed=seed,
        convergence_epochs=convergence_epochs,
        threshold_epochs=threshold_epochs,
        checkpoint_every=checkpoint_every,
        convergence_field=convergence_field or all_strategy_field(),
        threshold_field=threshold_field or fixed_threshold_field(),
    )
    return paths


def _positive_integer(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate deterministic Bank It strategy plots."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument(
        "--convergence-epochs",
        type=_positive_integer,
        default=DEFAULT_CONVERGENCE_EPOCHS,
    )
    parser.add_argument(
        "--threshold-epochs",
        type=_positive_integer,
        default=DEFAULT_THRESHOLD_EPOCHS,
    )
    parser.add_argument(
        "--checkpoint-every",
        type=_positive_integer,
        default=DEFAULT_CHECKPOINT_EVERY,
    )
    return parser.parse_args(argv)


def main() -> None:
    args = _parse_args()
    paths, convergence, threshold = _generate_plot_data(
        args.output_dir,
        seed=args.seed,
        convergence_epochs=args.convergence_epochs,
        threshold_epochs=args.threshold_epochs,
        checkpoint_every=args.checkpoint_every,
        convergence_field=all_strategy_field(),
        threshold_field=fixed_threshold_field(),
    )
    convergence_appearances = sorted(
        {row.appearances for row in convergence.final_rates}
    )
    threshold_appearances = sorted({row.appearances for row in threshold.final_rates})
    best = max(threshold.final_rates, key=lambda row: row.win_rate)
    best_target = _fixed_target(best.strategy)
    tested_maximum = max(
        _fixed_target(row.strategy) for row in threshold.final_rates
    )
    print(f"Seed: {args.seed}")
    print(
        "Convergence: "
        f"{convergence.games:,} games; final appearances {convergence_appearances}"
    )
    print(
        f"Threshold sweep: {threshold.games:,} games; "
        f"final appearances {threshold_appearances}"
    )
    print(_highest_observed_label(best_target, tested_maximum))
    if best_target == tested_maximum:
        print("Larger targets were not evaluated.")
    print(f"Wrote {len(paths)} artifacts to {args.output_dir}")


if __name__ == "__main__":
    main()
