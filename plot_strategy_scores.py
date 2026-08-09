#!/usr/bin/env python3
"""Solo score distributions for strategies that ignore the opponents."""

from __future__ import annotations

import argparse
import csv
import random
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from dataclasses import replace

from bank_it import GameView, Strategy, at_pot, strategies
from plot_bank_it import (
    BLUE,
    CORAL,
    GOLD,
    MINT,
    MUTED,
    NIGHT,
    PAPER,
    SLATE,
    VIOLET,
    _pyplot,
    _save_figure,
    _style_axes,
)
from plot_oracle_scores import build_linear_histogram


DEFAULT_OUTPUT_DIR = Path("docs/design/artifacts/learn-plots")

# Opponent-blind policies from bank_it.strategies(), each paired with the
# display name it carries on the charts.  (source name, chart label)
SOLO_STRATEGIES = (
    ("Safe Exit", "Safe Exit"),
    ("One More", "Safe Exit + 1 More"),
    ("Pot 60", "Pot 60"),
    ("Pot 80", "Pot 80"),
    ("Pot 100", "Pot 100"),
    ("Pot 125", "Pot 125"),
    ("Pot 150", "Pot 150"),
    ("Three More", "Safe Exit + 3 More"),
    ("Fixed Pot 200", "Fixed Pot 200"),
    ("Five More", "Safe Exit + 5 More"),
)

SOLO_SOURCE_NAMES = tuple(source for source, _ in SOLO_STRATEGIES)
SOLO_STRATEGY_NAMES = tuple(label for _, label in SOLO_STRATEGIES)


@dataclass(frozen=True, slots=True)
class StrategySummary:
    name: str
    mean: float
    median: float
    p25: float
    p75: float
    p90: float
    p99: float
    maximum: int
    bust_rate: float
    oracle_capture: float
    oracle_capture_pooled: float


def solo_field() -> tuple[Strategy, ...]:
    """Return the opponent-blind strategies with their chart labels."""
    by_name = {strategy.name: strategy for strategy in strategies()}
    missing = [source for source in SOLO_SOURCE_NAMES if source not in by_name]
    if missing:
        raise ValueError(f"unknown strategy names: {missing}")
    return tuple(
        replace(by_name[source], name=label) for source, label in SOLO_STRATEGIES
    )


def deal_round(rng: random.Random) -> tuple[tuple[int, int], ...]:
    """Deal one solo round's dice, ending on the roll that busts it.

    Every player of the round -- each strategy and the oracle -- is scored
    against this one list, so per-seed comparisons are genuinely paired.
    ``bank_it.play_game`` cannot be reused for that: it draws a starting
    player from the same generator, which shifts the dice stream.
    """
    dice: list[tuple[int, int]] = []
    while True:
        die_1, die_2 = rng.randint(1, 6), rng.randint(1, 6)
        dice.append((die_1, die_2))
        if len(dice) > 3 and die_1 + die_2 == 7:
            return tuple(dice)


def _pot_after(dice: Sequence[tuple[int, int]], index: int, pot: int) -> int:
    """Apply roll ``index`` (0-based) of a round to the running pot."""
    die_1, die_2 = dice[index]
    total = die_1 + die_2
    if index < 3:
        return pot + (70 if total == 7 else total)
    if die_1 == die_2:
        return pot * 2
    return pot + total


def score_round(strategy: Strategy, dice: Sequence[tuple[int, int]]) -> int:
    """Score one round for a solo strategy, returning 0 when it never banks."""
    pot = 0
    danger_rolls = 0
    for index in range(len(dice)):
        die_1, die_2 = dice[index]
        if index >= 3 and die_1 + die_2 == 7:
            return 0
        pot = _pot_after(dice, index, pot)
        if index >= 3:
            danger_rolls += 1
        if index + 1 < 3:
            continue
        view = GameView(
            pot=pot,
            roll=index + 1,
            danger_rolls=danger_rolls,
            round_number=1,
            rounds=1,
            own_score=0,
            opponent_scores=(),
            active_opponents=0,
            total_opponents=0,
            last_roll_was_double=die_1 == die_2 and index >= 3,
        )
        if strategy.bank(view):
            return pot
    return 0


def oracle_round(dice: Sequence[tuple[int, int]]) -> int:
    """Score one round with perfect hindsight: bank just before the bust."""
    pot = 0
    for index in range(len(dice) - 1):
        pot = _pot_after(dice, index, pot)
    return pot


def simulate_paired_scores(
    field: Sequence[Strategy],
    *,
    games: int = 10_000,
    rounds: int = 1,
    seed_start: int = 0,
) -> tuple[dict[str, tuple[int, ...]], tuple[int, ...]]:
    """Score every strategy and the oracle on one shared dice stream per seed."""
    if games <= 0:
        raise ValueError("games must be positive")
    if rounds <= 0:
        raise ValueError("rounds must be positive")
    if seed_start < 0:
        raise ValueError("seed_start must be nonnegative")
    if not field:
        raise ValueError("field must not be empty")

    totals: dict[str, list[int]] = {strategy.name: [] for strategy in field}
    oracle_totals: list[int] = []
    for seed in range(seed_start, seed_start + games):
        rng = random.Random(seed)
        deals = [deal_round(rng) for _ in range(rounds)]
        for strategy in field:
            totals[strategy.name].append(
                sum(score_round(strategy, dice) for dice in deals)
            )
        oracle_totals.append(sum(oracle_round(dice) for dice in deals))
    return (
        {name: tuple(scores) for name, scores in totals.items()},
        tuple(oracle_totals),
    )


def simulate_strategy_scores(
    strategy: Strategy,
    *,
    games: int = 10_000,
    rounds: int = 1,
    seed_start: int = 0,
) -> tuple[int, ...]:
    """Play the strategy alone, one independent seed per game."""
    scores, _ = simulate_paired_scores(
        (strategy,),
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )
    return scores[strategy.name]


def _quantile(ordered: tuple[int, ...], probability: float) -> float:
    position = (len(ordered) - 1) * probability
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def summarize_strategy(
    name: str,
    scores: tuple[int, ...],
    *,
    oracle_scores: tuple[int, ...],
) -> StrategySummary:
    """Summarize one strategy, including its share of the achievable score.

    ``oracle_capture`` averages the per-seed ratio, which answers "on a typical
    round, how much of the reachable pot did this rule take?".  The pooled
    total ratio is kept alongside it, but a handful of enormous oracle rounds
    dominate that sum, so every rule scores a low single-digit percentage.
    """
    if not scores:
        raise ValueError("scores must not be empty")
    if len(scores) != len(oracle_scores):
        raise ValueError("scores and oracle_scores must be the same length")

    ordered = tuple(sorted(scores))
    oracle_total = sum(oracle_scores)
    ratios = [
        score / oracle if oracle else 0.0
        for score, oracle in zip(scores, oracle_scores)
    ]
    return StrategySummary(
        name=name,
        mean=statistics.fmean(scores),
        median=statistics.median(scores),
        p25=_quantile(ordered, 0.25),
        p75=_quantile(ordered, 0.75),
        p90=_quantile(ordered, 0.90),
        p99=_quantile(ordered, 0.99),
        maximum=ordered[-1],
        bust_rate=sum(score == 0 for score in scores) / len(scores) * 100,
        oracle_capture=statistics.fmean(ratios) * 100,
        oracle_capture_pooled=(
            sum(scores) / oracle_total * 100 if oracle_total else 0.0
        ),
    )


def write_summary_csv(
    summaries: Sequence[StrategySummary],
    path: Path,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(
            (
                "strategy",
                "mean",
                "median",
                "p25",
                "p75",
                "p90",
                "p99",
                "maximum",
                "bust_rate",
                "oracle_capture",
                "oracle_capture_pooled",
            )
        )
        for summary in summaries:
            writer.writerow(
                (
                    summary.name,
                    f"{summary.mean:.4f}",
                    f"{summary.median:.4f}",
                    f"{summary.p25:.4f}",
                    f"{summary.p75:.4f}",
                    f"{summary.p90:.4f}",
                    f"{summary.p99:.4f}",
                    summary.maximum,
                    f"{summary.bust_rate:.4f}",
                    f"{summary.oracle_capture:.4f}",
                    f"{summary.oracle_capture_pooled:.4f}",
                )
            )


def _stat_lines(summary: StrategySummary) -> tuple[str, ...]:
    """The four headline stats, in the fixed reporting order."""
    return (
        f"median {summary.median:,.0f}",
        f"mean {summary.mean:,.0f}",
        f"bust {summary.bust_rate:.0f}%",
        f"jackpot P99 {summary.p99:,.0f}",
    )


def _stat_caption(summary: StrategySummary) -> str:
    return " · ".join(_stat_lines(summary))


def write_table_csv(summaries: Sequence[StrategySummary], path: Path) -> None:
    """Write the headline table: median, mean, bust chance, and the P99 jackpot."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(
            ("strategy", "median", "mean", "bust_pct", "jackpot_p99")
        )
        for summary in summaries:
            writer.writerow(
                (
                    summary.name,
                    f"{summary.median:.0f}",
                    f"{summary.mean:.1f}",
                    f"{summary.bust_rate:.1f}",
                    f"{summary.p99:.0f}",
                )
            )


def render_summary_dots(
    summaries: Sequence[StrategySummary],
    svg_path: Path,
    png_path: Path,
    *,
    games: int,
    rounds: int = 1,
    seed_start: int = 0,
) -> None:
    """Plot each strategy's median, mean, and P25–P75 band on a shared axis."""
    if not summaries:
        raise ValueError("summaries must not be empty")

    ordered = sorted(summaries, key=lambda summary: summary.mean)
    positions = range(len(ordered))
    label_x = max(summary.p75 for summary in ordered) * 1.06

    pyplot = _pyplot()
    figure, axis = pyplot.subplots(figsize=(12, 7.5), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    axis.grid(axis="y", alpha=0)
    axis.grid(axis="x", color=PAPER, alpha=0.12, linewidth=0.8)

    for position, summary in zip(positions, ordered):
        axis.plot(
            (summary.p25, summary.p75),
            (position, position),
            color=MUTED,
            linewidth=3,
            alpha=0.55,
            solid_capstyle="round",
            zorder=1,
        )
    axis.scatter(
        [summary.p25 for summary in ordered],
        list(positions),
        color=MUTED,
        s=0,
    )
    axis.scatter(
        [summary.median for summary in ordered],
        list(positions),
        color=GOLD,
        s=90,
        zorder=3,
        label="Median score",
    )
    axis.scatter(
        [summary.mean for summary in ordered],
        list(positions),
        color=CORAL,
        s=70,
        marker="D",
        zorder=3,
        label="Mean score",
    )
    axis.plot([], [], color=MUTED, linewidth=3, alpha=0.55, label="Middle half (P25–P75)")

    for position, summary in zip(positions, ordered):
        axis.text(
            label_x,
            position,
            _stat_caption(summary),
            color=MUTED,
            fontsize=8,
            verticalalignment="center",
        )

    axis.set_yticks(list(positions))
    axis.set_yticklabels([summary.name for summary in ordered], color=PAPER, fontsize=10)
    axis.set_xlim(-6, label_x * 2.05)
    axis.set_title(
        "Playing alone: what does each banking rule actually score?",
        color=PAPER,
        fontsize=20,
        fontweight="bold",
        loc="left",
        pad=64,
    )
    axis.text(
        0,
        1.015,
        f"{games:,} independent seeds "
        f"({seed_start:,}–{seed_start + games - 1:,}) · "
        f"{rounds} {'round' if rounds == 1 else 'rounds'} per game · "
        "no opponents, no opponent-aware rules",
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel("Score", color=PAPER, labelpad=10)
    legend = axis.legend(
        loc="lower left",
        bbox_to_anchor=(0, 1.045),
        ncol=3,
        frameon=False,
        fontsize=9,
    )
    for text in legend.get_texts():
        text.set_color(PAPER)
    axis.text(
        0.5,
        -0.13,
        "Greedy rules earn the highest average and a median of zero: "
        "they bust most rounds and make it back on the few they survive.",
        transform=axis.transAxes,
        horizontalalignment="center",
        color=MUTED,
        fontsize=9.5,
    )
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def render_capture_bars(
    summaries: Sequence[StrategySummary],
    svg_path: Path,
    png_path: Path,
    *,
    games: int,
    rounds: int = 1,
    seed_start: int = 0,
) -> None:
    """Plot how much of the perfect-hindsight score each rule captures."""
    if not summaries:
        raise ValueError("summaries must not be empty")

    ordered = sorted(summaries, key=lambda summary: summary.oracle_capture)
    positions = range(len(ordered))
    best = ordered[-1]

    pyplot = _pyplot()
    figure, axis = pyplot.subplots(figsize=(12, 7.5), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    axis.grid(axis="y", alpha=0)
    axis.grid(axis="x", color=PAPER, alpha=0.12, linewidth=0.8)

    span = max(summary.oracle_capture for summary in ordered)
    colors = [MINT if summary is best else GOLD for summary in ordered]
    axis.barh(
        list(positions),
        [summary.oracle_capture for summary in ordered],
        color=colors,
        height=0.72,
    )
    stat_x = span * 1.16
    for position, summary in zip(positions, ordered):
        axis.text(
            summary.oracle_capture + span * 0.015,
            position,
            f"{summary.oracle_capture:.1f}%",
            color=PAPER,
            fontsize=9,
            verticalalignment="center",
        )
        axis.text(
            stat_x,
            position,
            _stat_caption(summary),
            color=MUTED,
            fontsize=8,
            verticalalignment="center",
        )

    axis.set_yticks(list(positions))
    axis.set_yticklabels([summary.name for summary in ordered], color=PAPER, fontsize=10)
    axis.set_title(
        "How close does each rule get to perfect hindsight?",
        color=PAPER,
        fontsize=20,
        fontweight="bold",
        loc="left",
        pad=31,
    )
    axis.text(
        0,
        1.015,
        f"{games:,} independent seeds "
        f"({seed_start:,}–{seed_start + games - 1:,}) · "
        f"{rounds} {'round' if rounds == 1 else 'rounds'} per game · "
        "average per-round share of the score the oracle would have taken",
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel(
        "Share of the round's achievable score (%), averaged over games",
        color=PAPER,
        labelpad=10,
    )
    axis.set_xlim(0, span * 2.05)
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def render_distribution_grid(
    score_sets: Sequence[tuple[str, tuple[int, ...]]],
    svg_path: Path,
    png_path: Path,
    *,
    games: int,
    rounds: int = 1,
    cutoff: float = 0.95,
    columns: int = 4,
    summaries: Sequence[StrategySummary] | None = None,
) -> None:
    """Render one clipped linear histogram per strategy on a shared x-axis."""
    if not score_sets:
        raise ValueError("score_sets must not be empty")
    if columns <= 0:
        raise ValueError("columns must be positive")

    by_name = {summary.name: summary for summary in (summaries or ())}
    histograms = [
        (name, build_linear_histogram(scores, cutoff=cutoff), scores)
        for name, scores in score_sets
    ]
    upper = max(histogram.upper for _, histogram, _ in histograms)
    rows = -(-len(histograms) // columns)

    pyplot = _pyplot()
    figure, axes = pyplot.subplots(
        rows,
        columns,
        figsize=(4.0 * columns, 2.9 * rows),
        constrained_layout=True,
        squeeze=False,
    )
    figure.patch.set_facecolor(NIGHT)

    for index, axis in enumerate(axes.flat):
        if index >= len(histograms):
            axis.set_visible(False)
            continue
        name, histogram, scores = histograms[index]
        _style_axes(axis)
        total = len(scores)
        centers = [
            (start + end) / 2
            for start, end in zip(histogram.edges, histogram.edges[1:])
        ]
        axis.bar(
            centers,
            [count / total * 100 for count in histogram.counts],
            width=histogram.width * 0.9,
            color=GOLD,
        )
        axis.axvline(statistics.median(scores), color=CORAL, linestyle="--", linewidth=1.6)
        axis.set_xlim(0, upper)
        axis.set_title(name, color=PAPER, fontsize=11, fontweight="bold", loc="left")
        summary = by_name.get(name) or summarize_strategy(
            name, tuple(scores), oracle_scores=tuple(scores)
        )
        axis.text(
            0.97,
            0.92,
            "\n".join(_stat_lines(summary)),
            transform=axis.transAxes,
            horizontalalignment="right",
            verticalalignment="top",
            color=MUTED,
            fontsize=8,
            linespacing=1.35,
        )

    figure.suptitle(
        "Cautious rules cluster around a small score; greedy rules spike at zero",
        color=PAPER,
        fontsize=18,
        fontweight="bold",
        x=0.006,
        horizontalalignment="left",
    )
    figure.supxlabel(
        f"Score · {games:,} seeds · {rounds} {'round' if rounds == 1 else 'rounds'} "
        f"per game · shared linear axis, top {(1 - cutoff) * 100:g}% of games clipped",
        color=MUTED,
        fontsize=10,
    )
    figure.supylabel("Games (%)", color=PAPER, fontsize=10)
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def generate_strategy_artifacts(
    output_dir: Path,
    *,
    games: int = 10_000,
    rounds: int = 1,
    seed_start: int = 0,
    field: Sequence[Strategy] | None = None,
    stem: str = "solo-strategy-scores",
) -> tuple[Path, ...]:
    """Simulate the solo field and write the summary table and both charts."""
    chosen = tuple(field) if field is not None else solo_field()
    scores_by_name, oracle_scores = simulate_paired_scores(
        chosen,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )
    score_sets = [(strategy.name, scores_by_name[strategy.name]) for strategy in chosen]
    summaries = [
        summarize_strategy(name, scores, oracle_scores=oracle_scores)
        for name, scores in score_sets
    ]

    summary_csv = output_dir / f"{stem}.csv"
    write_summary_csv(summaries, summary_csv)

    table_csv = output_dir / f"{stem}-table.csv"
    write_table_csv(summaries, table_csv)

    dots_svg = output_dir / f"{stem}.svg"
    dots_png = output_dir / f"{stem}.png"
    render_summary_dots(
        summaries,
        dots_svg,
        dots_png,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )

    capture_svg = output_dir / f"{stem}-oracle-capture.svg"
    capture_png = output_dir / f"{stem}-oracle-capture.png"
    render_capture_bars(
        summaries,
        capture_svg,
        capture_png,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )

    grid_svg = output_dir / f"{stem}-distributions.svg"
    grid_png = output_dir / f"{stem}-distributions.png"
    render_distribution_grid(
        score_sets,
        grid_svg,
        grid_png,
        games=games,
        rounds=rounds,
        summaries=summaries,
    )

    return (
        summary_csv,
        table_csv,
        dots_png,
        dots_svg,
        capture_png,
        capture_svg,
        grid_png,
        grid_svg,
    )


def threshold_values(start: int = 100, stop: int = 1_000, step: int = 100) -> tuple[int, ...]:
    """Return the inclusive threshold grid, e.g. 100, 200, …, 1000."""
    if start <= 0 or step <= 0:
        raise ValueError("start and step must be positive")
    if stop < start:
        raise ValueError("stop must be at least start")
    return tuple(range(start, stop + 1, step))


def build_threshold_field(thresholds: Sequence[int]) -> tuple[Strategy, ...]:
    """One 'bank at pot ≥ N' strategy per threshold."""
    if not thresholds:
        raise ValueError("thresholds must not be empty")
    return tuple(
        Strategy(f"Pot {value}", f"Bank when the pot reaches {value}.", at_pot(value))
        for value in thresholds
    )


def sweep_threshold_summaries(
    thresholds: Sequence[int],
    *,
    games: int = 10_000,
    rounds: int = 1,
    seed_start: int = 0,
) -> tuple[StrategySummary, ...]:
    """Summarize each pot threshold over one shared dice stream per seed."""
    field = build_threshold_field(thresholds)
    scores_by_name, oracle_scores = simulate_paired_scores(
        field,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )
    return tuple(
        summarize_strategy(
            strategy.name, scores_by_name[strategy.name], oracle_scores=oracle_scores
        )
        for strategy in field
    )


def render_threshold_lines(
    thresholds: Sequence[int],
    summaries: Sequence[StrategySummary],
    svg_path: Path,
    png_path: Path,
    *,
    games: int,
    rounds: int = 1,
    seed_start: int = 0,
) -> None:
    """Plot median, mean, P99, and bust rate against the banking threshold.

    The four metrics live on very different scales -- median stays at 0, mean
    barely moves, P99 climbs into the thousands, bust rate approaches 100% --
    so each gets its own auto-scaled panel over a shared threshold axis rather
    than being crushed onto one.
    """
    if not thresholds:
        raise ValueError("thresholds must not be empty")
    if len(thresholds) != len(summaries):
        raise ValueError("thresholds and summaries must be the same length")

    xs = list(thresholds)
    panels = (
        ("Median score", "points", GOLD, [s.median for s in summaries]),
        ("Mean score", "points", CORAL, [s.mean for s in summaries]),
        ("Jackpot (P99)", "points", VIOLET, [s.p99 for s in summaries]),
        ("Bust rate", "%", BLUE, [s.bust_rate for s in summaries]),
    )

    pyplot = _pyplot()
    figure, axes = pyplot.subplots(2, 2, figsize=(12, 8.5), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    figure.get_layout_engine().set(hspace=0.14, wspace=0.06)

    for axis, (label, unit, color, ys) in zip(axes.flat, panels):
        _style_axes(axis)
        axis.plot(xs, ys, color=color, linewidth=2.6, marker="o", markersize=5)
        axis.set_xticks(xs)
        axis.tick_params(axis="x", labelbottom=True)
        axis.set_xlabel(
            "Banking threshold (bank when the pot reaches this)",
            color=PAPER,
            labelpad=8,
        )
        axis.set_title(f"{label} ({unit})", color=PAPER, fontsize=13, fontweight="bold", loc="left")
        top = max(ys)
        axis.set_ylim(0, top * 1.15 if top > 0 else 1)
        first, last = ys[0], ys[-1]
        axis.text(
            0.97,
            0.06,
            f"{first:,.0f} → {last:,.0f}{'%' if unit == '%' else ''}",
            transform=axis.transAxes,
            horizontalalignment="right",
            color=MUTED,
            fontsize=9.5,
        )

    figure.suptitle(
        "Raise the threshold and only the jackpot and bust rate really move",
        color=PAPER,
        fontsize=18,
        fontweight="bold",
        x=0.006,
        horizontalalignment="left",
    )
    figure.supxlabel(
        f"{games:,} seeds ({seed_start:,}–{seed_start + games - 1:,}) · "
        f"{rounds} {'round' if rounds == 1 else 'rounds'} per game · "
        "solo play, one 'Pot N' rule per threshold · each panel auto-scaled",
        color=MUTED,
        fontsize=10,
    )
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def generate_threshold_sweep(
    output_dir: Path,
    *,
    start: int = 100,
    stop: int = 1_000,
    step: int = 100,
    games: int = 10_000,
    rounds: int = 1,
    seed_start: int = 0,
    stem: str = "solo-threshold-sweep-lines",
) -> tuple[Path, Path]:
    """Simulate the threshold grid and write the line chart (SVG + PNG)."""
    thresholds = threshold_values(start, stop, step)
    summaries = sweep_threshold_summaries(
        thresholds, games=games, rounds=rounds, seed_start=seed_start
    )
    svg_path = output_dir / f"{stem}.svg"
    png_path = output_dir / f"{stem}.png"
    render_threshold_lines(
        thresholds,
        summaries,
        svg_path,
        png_path,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )
    return svg_path, png_path


def _positive_integer(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


def _nonnegative_integer(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be a nonnegative integer")
    return parsed


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare solo score distributions for opponent-blind strategies."
    )
    parser.add_argument("--games", type=_positive_integer, default=10_000)
    parser.add_argument("--rounds", type=_positive_integer, default=1)
    parser.add_argument("--seed-start", type=_nonnegative_integer, default=0)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--stem", default=None)
    parser.add_argument(
        "--threshold-sweep",
        action="store_true",
        help="Render the threshold-vs-metrics line chart instead of the strategy set.",
    )
    parser.add_argument("--sweep-start", type=_positive_integer, default=100)
    parser.add_argument("--sweep-stop", type=_positive_integer, default=1_000)
    parser.add_argument("--sweep-step", type=_positive_integer, default=100)
    return parser.parse_args(argv)


def main() -> None:
    args = _parse_args()
    if args.threshold_sweep:
        paths = generate_threshold_sweep(
            args.output_dir,
            start=args.sweep_start,
            stop=args.sweep_stop,
            step=args.sweep_step,
            games=args.games,
            rounds=args.rounds,
            seed_start=args.seed_start,
            stem=args.stem or "solo-threshold-sweep-lines",
        )
        for path in paths:
            print(f"Wrote: {path}")
        return

    paths = generate_strategy_artifacts(
        args.output_dir,
        games=args.games,
        rounds=args.rounds,
        seed_start=args.seed_start,
        stem=args.stem or "solo-strategy-scores",
    )
    for path in paths:
        print(f"Wrote: {path}")


if __name__ == "__main__":
    main()
