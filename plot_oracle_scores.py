#!/usr/bin/env python3
"""Distribution of perfect-hindsight solo scores in Bank It."""

from __future__ import annotations

import argparse
import csv
import math
import random
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from plot_bank_it import (
    CORAL,
    GOLD,
    MUTED,
    NIGHT,
    PAPER,
    SLATE,
    _pyplot,
    _save_figure,
    _style_axes,
)


DEFAULT_OUTPUT_DIR = Path("docs/design/artifacts/learn-plots")


@dataclass(frozen=True, slots=True)
class Histogram:
    width: int
    upper: int
    edges: tuple[int, ...]
    counts: tuple[int, ...]
    overflow: int


@dataclass(frozen=True, slots=True)
class PercentilePoint:
    percentile: int
    score: float


@dataclass(frozen=True, slots=True)
class _OracleArtifactGeneration:
    paths: tuple[Path, Path, Path]
    scores: tuple[int, ...]
    histogram: Histogram
    rate: float


def simulate_oracle_game(rng: random.Random, *, rounds: int = 10) -> int:
    """Return the score earned by banking just before every bust."""
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
    if seed_start < 0:
        raise ValueError("seed_start must be nonnegative")
    return tuple(
        simulate_oracle_game(random.Random(seed), rounds=rounds)
        for seed in range(seed_start, seed_start + games)
    )


def _percentile(ordered: tuple[int, ...], probability: float) -> float:
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return float(ordered[lower])
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def build_histogram(scores: tuple[int, ...]) -> Histogram:
    """Build deterministic visible buckets plus an explicit long-tail overflow."""
    if not scores:
        raise ValueError("scores must not be empty")
    ordered = tuple(sorted(scores))
    iqr = _percentile(ordered, 0.75) - _percentile(ordered, 0.25)
    raw_width = 2 * iqr / (len(ordered) ** (1 / 3))
    width = max(50, math.ceil(raw_width / 50) * 50)
    percentile_upper = math.ceil(_percentile(ordered, 0.999) / width) * width
    highest_full_edge = max(width, ordered[-1] // width * width)
    upper = min(percentile_upper, highest_full_edge)
    edges = tuple(range(0, upper + width, width))
    counts = [0] * (len(edges) - 1)
    overflow = 0
    for score in scores:
        if score >= upper:
            overflow += 1
        else:
            counts[min(score // width, len(counts) - 1)] += 1
    return Histogram(width, upper, edges, tuple(counts), overflow)


def build_percentiles(scores: tuple[int, ...]) -> tuple[PercentilePoint, ...]:
    if not scores:
        raise ValueError("scores must not be empty")
    ordered = tuple(sorted(scores))
    return tuple(
        PercentilePoint(percentile, _percentile(ordered, percentile / 100))
        for percentile in range(1, 100)
    )


def write_histogram_csv(
    histogram: Histogram,
    path: Path,
    *,
    total: int,
) -> None:
    """Write every visible bucket and the disclosed overflow as percentages."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("bucket_start", "bucket_end", "count", "percent"))
        for start, end, count in zip(
            histogram.edges,
            histogram.edges[1:],
            histogram.counts,
        ):
            writer.writerow((start, end, count, f"{count / total * 100:.6f}"))
        writer.writerow(
            (
                histogram.upper,
                "overflow",
                histogram.overflow,
                f"{histogram.overflow / total * 100:.6f}",
            )
        )


def write_percentile_csv(
    points: tuple[PercentilePoint, ...],
    path: Path,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("percentile", "score"))
        for point in points:
            writer.writerow((point.percentile, f"{point.score:.6f}"))


def render_histogram(
    scores: tuple[int, ...],
    histogram: Histogram,
    svg_path: Path,
    png_path: Path,
    *,
    target: int = 1_000,
    rounds: int = 10,
    seed_start: int = 0,
) -> float:
    """Render the oracle score distribution and return the exact target rate."""
    total = len(scores)
    at_least_target = sum(score >= target for score in scores)
    rate = at_least_target / total * 100
    percentages = [count / total * 100 for count in histogram.counts]
    centers = [
        (start + end) / 2
        for start, end in zip(histogram.edges, histogram.edges[1:])
    ]

    pyplot = _pyplot()
    figure, axis = pyplot.subplots(figsize=(14, 8.5), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    axis.set_xscale("symlog", linthresh=target, linscale=2, base=10)
    axis.bar(
        centers,
        percentages,
        width=histogram.width * 0.88,
        color=GOLD,
        label="Oracle-optimal score",
    )
    axis.axvline(
        target,
        color=CORAL,
        linestyle="--",
        linewidth=2,
        label=f"Reference score ({target:,})",
    )
    axis.text(
        0.985,
        0.96,
        f"P(oracle-optimal score ≥ {target:,}) = {rate:.2f}%",
        transform=axis.transAxes,
        horizontalalignment="right",
        verticalalignment="top",
        color=PAPER,
        fontsize=12,
        fontweight="bold",
        bbox={
            "boxstyle": "round,pad=0.45",
            "facecolor": SLATE,
            "edgecolor": CORAL,
        },
    )
    axis.set_title(
        "How high can perfect-hindsight Bank It scores go?",
        color=PAPER,
        fontsize=22,
        fontweight="bold",
        loc="left",
        pad=31,
    )
    axis.text(
        0,
        1.015,
        f"{total:,} independent seeds "
        f"({seed_start:,}–{seed_start + total - 1:,}) · "
        f"{rounds} {'round' if rounds == 1 else 'rounds'} per game · "
        "perfect-hindsight banking",
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel("Oracle-optimal score", color=PAPER, labelpad=10)
    axis.set_ylabel("Games (%)", color=PAPER, labelpad=10)
    axis.set_xlim(0, histogram.upper)
    legend_location = "center right" if rounds == 1 else "upper left"
    legend = axis.legend(loc=legend_location, frameon=False, fontsize=9)
    for text in legend.get_texts():
        text.set_color(PAPER)
    overflow_rate = histogram.overflow / total * 100
    axis.text(
        0.5,
        -0.14,
        f"Symlog x-axis · Visible bucket width: {histogram.width:,} points · "
        f"Overflow at ≥ {histogram.upper:,}: {histogram.overflow:,} games "
        f"({overflow_rate:.3f}%)",
        transform=axis.transAxes,
        horizontalalignment="center",
        color=MUTED,
        fontsize=9.5,
    )
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)
    return rate


def render_percentiles(
    points: tuple[PercentilePoint, ...],
    svg_path: Path,
    png_path: Path,
    *,
    games: int,
    rounds: int,
    seed_start: int,
    target: int = 1_000,
) -> None:
    if games <= 0:
        raise ValueError("games must be positive")
    if rounds <= 0:
        raise ValueError("rounds must be positive")
    if seed_start < 0:
        raise ValueError("seed_start must be nonnegative")
    if any(point.score <= 0 for point in points):
        raise ValueError("percentile scores must be positive")

    pyplot = _pyplot()
    figure, axis = pyplot.subplots(figsize=(14, 8.5), constrained_layout=True)
    figure.patch.set_facecolor(NIGHT)
    _style_axes(axis)
    axis.set_yscale("log")
    axis.plot(
        [point.percentile for point in points],
        [point.score for point in points],
        color=GOLD,
        linewidth=2.5,
        label="Oracle-optimal percentile",
    )
    axis.axhline(
        target,
        color=CORAL,
        linestyle="--",
        linewidth=2,
        label=f"Reference score ({target:,})",
    )

    by_percentile = {point.percentile: point for point in points}
    annotation_offsets = {
        50: (0, 14),
        90: (-12, 14),
        95: (-12, -28),
        99: (-55, 14),
    }
    for percentile, offset in annotation_offsets.items():
        point = by_percentile[percentile]
        axis.scatter(
            point.percentile,
            point.score,
            color=CORAL,
            edgecolor=PAPER,
            linewidth=0.8,
            s=48,
            zorder=3,
        )
        axis.annotate(
            f"P{percentile} = {point.score:,.2f}",
            xy=(point.percentile, point.score),
            xytext=offset,
            textcoords="offset points",
            color=PAPER,
            fontsize=10,
            fontweight="bold",
            horizontalalignment="center",
            bbox={
                "boxstyle": "round,pad=0.3",
                "facecolor": SLATE,
                "edgecolor": CORAL,
            },
        )

    round_copy = "round" if rounds == 1 else "rounds"
    axis.set_title(
        "How quickly do perfect-hindsight Bank It scores climb?",
        color=PAPER,
        fontsize=22,
        fontweight="bold",
        loc="left",
        pad=31,
    )
    axis.text(
        0,
        1.015,
        f"{games:,} independent seeds "
        f"({seed_start:,}–{seed_start + games - 1:,}) · "
        f"{rounds} {round_copy} per game · "
        "perfect-hindsight banking",
        transform=axis.transAxes,
        color=MUTED,
        fontsize=11,
    )
    axis.set_xlabel("Percentile", color=PAPER, labelpad=10)
    axis.set_ylabel("Oracle-optimal score", color=PAPER, labelpad=10)
    axis.set_xlim(1, 100)
    axis.set_xticks((1, 10, 25, 50, 75, 90, 95, 99))
    legend = axis.legend(loc="upper left", frameon=False, fontsize=9)
    for text in legend.get_texts():
        text.set_color(PAPER)
    axis.text(
        0.5,
        -0.14,
        "P1–P99 empirical quantiles · log score axis",
        transform=axis.transAxes,
        horizontalalignment="center",
        color=MUTED,
        fontsize=9.5,
    )
    _save_figure(figure, svg_path, png_path)
    pyplot.close(figure)


def _generate_oracle_artifacts(
    output_dir: Path,
    *,
    games: int = 100_000,
    rounds: int = 10,
    seed_start: int = 0,
    stem: str = "oracle-score-distribution",
) -> _OracleArtifactGeneration:
    output_dir.mkdir(parents=True, exist_ok=True)
    scores = simulate_oracle_scores(
        games=games,
        rounds=rounds,
        seed_start=seed_start,
    )
    assert len(scores) == games
    histogram = build_histogram(scores)
    assert sum(histogram.counts) + histogram.overflow == games

    csv_path = output_dir / f"{stem}.csv"
    png_path = output_dir / f"{stem}.png"
    svg_path = output_dir / f"{stem}.svg"
    write_histogram_csv(histogram, csv_path, total=games)
    rate = render_histogram(
        scores,
        histogram,
        svg_path,
        png_path,
        rounds=rounds,
        seed_start=seed_start,
    )
    return _OracleArtifactGeneration(
        paths=(csv_path, png_path, svg_path),
        scores=scores,
        histogram=histogram,
        rate=rate,
    )


def generate_oracle_artifacts(
    output_dir: Path,
    *,
    games: int = 100_000,
    rounds: int = 10,
    seed_start: int = 0,
    stem: str = "oracle-score-distribution",
) -> tuple[Path, Path, Path, float]:
    """Simulate independent games and write the auditable histogram artifacts."""
    generation = _generate_oracle_artifacts(
        output_dir,
        games=games,
        rounds=rounds,
        seed_start=seed_start,
        stem=stem,
    )
    csv_path, png_path, svg_path = generation.paths
    return csv_path, png_path, svg_path, generation.rate


def generate_round_comparison_artifacts(
    output_dir: Path,
    *,
    games: int = 10_000,
    seed_start: int = 0,
) -> tuple[Path, ...]:
    written = []
    for rounds, distribution_stem, percentile_stem in (
        (
            10,
            "oracle-score-distribution",
            "oracle-score-percentiles-10-rounds",
        ),
        (
            1,
            "oracle-score-distribution-1-round",
            "oracle-score-percentiles-1-round",
        ),
    ):
        generation = _generate_oracle_artifacts(
            output_dir,
            games=games,
            rounds=rounds,
            seed_start=seed_start,
            stem=distribution_stem,
        )
        points = build_percentiles(generation.scores)
        percentile_csv = output_dir / f"{percentile_stem}.csv"
        percentile_png = output_dir / f"{percentile_stem}.png"
        percentile_svg = output_dir / f"{percentile_stem}.svg"
        write_percentile_csv(points, percentile_csv)
        render_percentiles(
            points,
            percentile_svg,
            percentile_png,
            games=games,
            rounds=rounds,
            seed_start=seed_start,
        )
        written.extend(
            (
                *generation.paths,
                percentile_csv,
                percentile_png,
                percentile_svg,
            )
        )
    return tuple(written)


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
        description="Generate the oracle-optimal Bank It score distribution."
    )
    parser.add_argument("--games", type=_positive_integer, default=10_000)
    parser.add_argument("--rounds", type=_positive_integer, default=10)
    parser.add_argument("--seed-start", type=_nonnegative_integer, default=0)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--comparison",
        action="store_true",
        help="Generate matching ten-round and one-round artifact sets.",
    )
    return parser.parse_args(argv)


def main() -> None:
    args = _parse_args()
    if args.comparison:
        paths = generate_round_comparison_artifacts(
            args.output_dir,
            games=args.games,
            seed_start=args.seed_start,
        )
        for path in paths:
            print(f"Wrote: {path}")
        return

    generation = _generate_oracle_artifacts(
        args.output_dir,
        games=args.games,
        rounds=args.rounds,
        seed_start=args.seed_start,
    )
    scores = generation.scores
    histogram = generation.histogram

    print(f"Games: {len(scores):,} independent seeds")
    print(f"Rounds per game: {args.rounds}")
    print(f"Seed range: {args.seed_start:,}–{args.seed_start + len(scores) - 1:,}")
    print(f"Mean score: {statistics.fmean(scores):,.2f}")
    print(f"Median score: {statistics.median(scores):,.2f}")
    print(f"Visible maximum: {histogram.upper:,}")
    print(f"Overflow: {histogram.overflow:,}")
    print(f"P(score ≥ 1,000): {generation.rate:.2f}%")
    for path in generation.paths:
        print(f"Wrote: {path}")


if __name__ == "__main__":
    main()
