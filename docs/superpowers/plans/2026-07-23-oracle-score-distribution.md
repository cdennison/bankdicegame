# Oracle Score Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simulate and compare distributions and P1–P99 percentile curves for oracle-optimal final scores across 10,000 solo one-round and ten-round Bank It games.

**Architecture:** Use one focused Python module to simulate complete dice sequences without a player strategy, record the final pot immediately before each dangerous seven, and sum the requested number of round maxima. Convert each round-count sample into an auditable histogram and empirical percentile series, then write CSV data and render PNG/SVG artifacts using the repository's existing Matplotlib visual language.

**Tech Stack:** Python 3 standard library, Matplotlib 3.10, `unittest`

## Global Constraints

- Simulate exactly 10,000 independent games using seeds 0 through 9,999 for each round count.
- Generate matching one-round and ten-round artifact sets.
- Follow the tested Python rules, including three safe rolls and the safe-roll 70 bonus for a total of seven.
- After the third roll, the first total of seven ends the round.
- The oracle score for a round is the pot immediately before that dangerous seven.
- There are no opponents and no banking threshold.
- Generate PNG, SVG, and CSV artifacts in `docs/design/artifacts/learn-plots/`.
- Each distribution plot must mark 1,000 and state the observed percentage at or above it.
- Each percentile plot must contain P1 through P99, use a logarithmic score axis, mark 1,000, and annotate P50/P90/P95/P99.
- Histogram counts, including overflow, must sum to 10,000 for each round count.

---

### Task 1: Oracle game simulator

**Files:**
- Create: `plot_oracle_scores.py`
- Create: `test_plot_oracle_scores.py`

**Interfaces:**
- Consumes: Python's `random.Random`, using two `randint(1, 6)` calls per roll.
- Produces: `simulate_oracle_game(rng: random.Random, *, rounds: int = 10) -> int`
- Produces: `simulate_oracle_scores(*, games: int = 100_000, rounds: int = 10, seed_start: int = 0) -> tuple[int, ...]`

- [ ] **Step 1: Write failing deterministic simulator tests**

Create `test_plot_oracle_scores.py` with a sequence RNG and tests that prove safe sevens add 70, danger doubles multiply the pot, the dangerous seven itself adds nothing, ten round scores are summed, and distinct integer seeds are used:

```python
import random
import unittest
from unittest.mock import patch

from plot_oracle_scores import simulate_oracle_game, simulate_oracle_scores


class SequenceRng:
    def __init__(self, values):
        self.values = iter(values)

    def randint(self, low, high):
        self.assert_bounds = (low, high)
        return next(self.values)


class OracleSimulationTests(unittest.TestCase):
    def test_oracle_banks_the_last_pot_before_dangerous_seven(self):
        rng = SequenceRng(
            [
                1, 2,  # pot 3
                3, 4,  # safe seven adds 70: pot 73
                2, 2,  # pot 77
                3, 3,  # danger double: pot 154
                2, 3,  # danger non-double: pot 159
                1, 6,  # dangerous seven: bank previous 159
            ]
        )
        self.assertEqual(simulate_oracle_game(rng, rounds=1), 159)
        self.assertEqual(rng.assert_bounds, (1, 6))

    def test_oracle_game_sums_completed_round_maxima(self):
        one_round = [
            1, 1,
            1, 1,
            1, 1,
            1, 6,
        ]
        self.assertEqual(
            simulate_oracle_game(SequenceRng(one_round * 10), rounds=10),
            60,
        )

    def test_score_batch_uses_one_distinct_rng_seed_per_game(self):
        seen = []

        def reference_game(rng, *, rounds):
            seen.append((rng.random(), rounds))
            return rounds

        with patch("plot_oracle_scores.simulate_oracle_game", side_effect=reference_game):
            scores = simulate_oracle_scores(games=3, rounds=10, seed_start=7)

        expected = [(random.Random(seed).random(), 10) for seed in (7, 8, 9)]
        self.assertEqual(seen, expected)
        self.assertEqual(scores, (10, 10, 10))

    def test_score_batch_rejects_nonpositive_sizes(self):
        with self.assertRaisesRegex(ValueError, "games must be positive"):
            simulate_oracle_scores(games=0)
        with self.assertRaisesRegex(ValueError, "rounds must be positive"):
            simulate_oracle_scores(games=1, rounds=0)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and confirm the missing module failure**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: `ModuleNotFoundError: No module named 'plot_oracle_scores'`.

- [ ] **Step 3: Implement the minimal oracle simulator**

Create `plot_oracle_scores.py`:

```python
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
```

- [ ] **Step 4: Run simulator tests**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: four tests pass.

- [ ] **Step 5: Commit the simulator**

```bash
git add plot_oracle_scores.py test_plot_oracle_scores.py
git commit -m "feat: simulate oracle-optimal solo scores"
```

### Task 2: Auditable histogram and artifacts

**Files:**
- Modify: `plot_oracle_scores.py`
- Modify: `test_plot_oracle_scores.py`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution.csv`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution.png`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution.svg`

**Interfaces:**
- Consumes: `simulate_oracle_scores(...) -> tuple[int, ...]`
- Produces: `Histogram` dataclass with `width`, `upper`, `edges`, `counts`, and `overflow`
- Produces: `build_histogram(scores: tuple[int, ...]) -> Histogram`
- Produces: `write_histogram_csv(histogram: Histogram, path: Path, *, total: int) -> None`
- Produces: `render_histogram(scores: tuple[int, ...], histogram: Histogram, svg_path: Path, png_path: Path, *, target: int = 1_000) -> float`
- Produces: `generate_oracle_artifacts(output_dir: Path, *, games: int = 100_000, rounds: int = 10, seed_start: int = 0) -> tuple[Path, Path, Path, float]`

- [ ] **Step 1: Write failing histogram and artifact tests**

Append tests that require deterministic bucket construction, complete accounting, exact target probability, and all three artifacts:

```python
import csv
import tempfile
from pathlib import Path

from plot_oracle_scores import (
    build_histogram,
    generate_oracle_artifacts,
    render_histogram,
    write_histogram_csv,
)


class OracleArtifactTests(unittest.TestCase):
    def test_histogram_accounts_for_every_score_including_overflow(self):
        scores = (100, 200, 300, 400, 500, 10_000)
        histogram = build_histogram(scores)
        self.assertEqual(sum(histogram.counts) + histogram.overflow, len(scores))
        self.assertGreaterEqual(histogram.upper, 500)
        self.assertEqual(histogram.overflow, 1)

    def test_csv_contains_bucket_counts_and_overflow(self):
        scores = (100, 200, 300, 400, 500, 10_000)
        histogram = build_histogram(scores)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "distribution.csv"
            write_histogram_csv(histogram, path, total=len(scores))
            rows = list(csv.DictReader(path.open(encoding="utf-8")))
        self.assertEqual(sum(int(row["count"]) for row in rows), len(scores))
        self.assertEqual(rows[-1]["bucket_end"], "overflow")

    def test_renderer_returns_exact_at_least_target_rate(self):
        scores = (999, 1000, 1001, 2000)
        histogram = build_histogram(scores)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            rate = render_histogram(
                scores,
                histogram,
                output / "distribution.svg",
                output / "distribution.png",
            )
            self.assertEqual(rate, 75.0)
            self.assertGreater((output / "distribution.svg").stat().st_size, 0)
            self.assertGreater((output / "distribution.png").stat().st_size, 0)

    def test_generator_writes_three_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = generate_oracle_artifacts(
                Path(directory),
                games=20,
                rounds=2,
                seed_start=0,
            )
            csv_path, png_path, svg_path, rate = paths
            self.assertTrue(csv_path.exists())
            self.assertTrue(png_path.exists())
            self.assertTrue(svg_path.exists())
            self.assertGreaterEqual(rate, 0.0)
            self.assertLessEqual(rate, 100.0)
```

- [ ] **Step 2: Run tests and confirm missing interface failures**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: import errors for `build_histogram`, `generate_oracle_artifacts`, `render_histogram`, and `write_histogram_csv`.

- [ ] **Step 3: Implement histogram selection and CSV output**

Add a frozen `Histogram` dataclass. Select the bucket width with the
Freedman-Diaconis rule, rounded up to a multiple of 50 with a minimum of 50.
Set the visible upper bound to the 99.9th percentile rounded up to a bucket
edge. Count larger scores as overflow. Write one row per visible bucket plus
an explicit overflow row, with percentages relative to all games.

Use only standard-library percentile interpolation so the simulation module
does not require NumPy:

```python
@dataclass(frozen=True)
class Histogram:
    width: int
    upper: int
    edges: tuple[int, ...]
    counts: tuple[int, ...]
    overflow: int


def _percentile(ordered: tuple[int, ...], probability: float) -> float:
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return float(ordered[lower])
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def build_histogram(scores: tuple[int, ...]) -> Histogram:
    if not scores:
        raise ValueError("scores must not be empty")
    ordered = tuple(sorted(scores))
    iqr = _percentile(ordered, 0.75) - _percentile(ordered, 0.25)
    raw_width = 2 * iqr / (len(ordered) ** (1 / 3))
    width = max(50, math.ceil(raw_width / 50) * 50)
    upper = math.ceil(_percentile(ordered, 0.999) / width) * width
    edges = tuple(range(0, upper + width, width))
    counts = [0] * (len(edges) - 1)
    overflow = 0
    for score in scores:
        if score >= upper:
            overflow += 1
        else:
            counts[min(score // width, len(counts) - 1)] += 1
    return Histogram(width, upper, edges, tuple(counts), overflow)
```

`write_histogram_csv` writes:

```text
bucket_start,bucket_end,count,percent
```

The final row uses `upper` as `bucket_start` and `overflow` as
`bucket_end`.

- [ ] **Step 4: Implement the renderer and generator**

Render a dark Bank It-styled bar histogram using the existing palette from
`plot_bank_it.py`. The y-axis is the percentage of all games. Draw a coral
vertical line at 1,000 and annotate:

```text
P(oracle-optimal score ≥ 1,000) = XX.XX%
```

The subtitle states `100,000 independent seeds · 10 rounds per game · perfect-hindsight banking`.
The footer reports the visible bucket width and overflow count/percentage.
`render_histogram` returns the exact observed percentage computed directly
from the raw scores, not from histogram buckets.

`generate_oracle_artifacts` simulates scores, asserts their count equals
`games`, builds the histogram, asserts visible counts plus overflow equal
`games`, and writes:

```text
oracle-score-distribution.csv
oracle-score-distribution.png
oracle-score-distribution.svg
```

Add a CLI whose defaults are `--games 100000`, `--rounds 10`,
`--seed-start 0`, and
`--output-dir docs/design/artifacts/learn-plots`. Print the artifact paths,
mean, median, visible maximum, overflow count, and exact at-least-1,000
percentage.

- [ ] **Step 5: Run focused tests**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: eight tests pass.

- [ ] **Step 6: Generate the approved 100,000-game artifacts**

Run:

```bash
.venv/bin/python plot_oracle_scores.py \
  --games 10000 \
  --rounds 10 \
  --seed-start 0 \
  --output-dir docs/design/artifacts/learn-plots
```

Expected: three artifact paths and summary statistics are printed; the CSV
counts sum to 10,000.

- [ ] **Step 7: Run complete Python verification**

Run:

```bash
.venv/bin/python -m unittest test_bank_it.py test_plot_bank_it.py test_plot_oracle_scores.py
```

Expected: all tests pass with no failures or errors.

- [ ] **Step 8: Inspect the rendered image**

Open
`docs/design/artifacts/learn-plots/oracle-score-distribution.png` and confirm:

- the 1,000 reference line and probability annotation are legible;
- no bars, titles, tick labels, or footer text are clipped;
- the long tail is represented through the disclosed overflow count; and
- the displayed percentage matches the CLI output.

- [ ] **Step 9: Commit the implementation and artifacts**

```bash
git add \
  plot_oracle_scores.py \
  test_plot_oracle_scores.py \
  docs/design/artifacts/learn-plots/oracle-score-distribution.csv \
  docs/design/artifacts/learn-plots/oracle-score-distribution.png \
  docs/design/artifacts/learn-plots/oracle-score-distribution.svg
git commit -m "feat: plot oracle-optimal score distribution"
```

### Task 3: One-round comparison and percentile curves

**Files:**
- Modify: `plot_oracle_scores.py`
- Modify: `test_plot_oracle_scores.py`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-10-rounds.csv`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-10-rounds.png`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-10-rounds.svg`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution-1-round.csv`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution-1-round.png`
- Create: `docs/design/artifacts/learn-plots/oracle-score-distribution-1-round.svg`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-1-round.csv`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-1-round.png`
- Create: `docs/design/artifacts/learn-plots/oracle-score-percentiles-1-round.svg`

**Interfaces:**
- Consumes: `simulate_oracle_scores(games=10_000, rounds=N, seed_start=0)` for `N in (10, 1)`.
- Produces: `PercentilePoint(percentile: int, score: float)`.
- Produces: `build_percentiles(scores: tuple[int, ...]) -> tuple[PercentilePoint, ...]`.
- Produces: `write_percentile_csv(points: tuple[PercentilePoint, ...], path: Path) -> None`.
- Produces: `render_percentiles(points, svg_path, png_path, *, games, rounds, seed_start, target=1_000) -> None`.
- Produces: `generate_round_comparison_artifacts(output_dir: Path, *, games: int = 10_000, seed_start: int = 0) -> tuple[Path, ...]`.

- [ ] **Step 1: Write failing percentile and comparison tests**

Extend `test_plot_oracle_scores.py` imports and add:

```python
from plot_oracle_scores import (
    build_percentiles,
    generate_round_comparison_artifacts,
    render_percentiles,
    write_percentile_csv,
)


class OraclePercentileTests(unittest.TestCase):
    def test_percentiles_are_p1_through_p99_with_linear_interpolation(self):
        points = build_percentiles((0, 100, 200, 300, 400))

        self.assertEqual(
            tuple(point.percentile for point in points),
            tuple(range(1, 100)),
        )
        by_percentile = {point.percentile: point.score for point in points}
        self.assertEqual(by_percentile[25], 100.0)
        self.assertEqual(by_percentile[50], 200.0)
        self.assertEqual(by_percentile[75], 300.0)
        self.assertEqual(by_percentile[99], 396.0)

    def test_percentile_csv_has_exact_order_and_rows(self):
        points = build_percentiles((100, 200, 300, 400))
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "percentiles.csv"
            write_percentile_csv(points, path)
            with path.open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))

        self.assertEqual(list(rows[0]), ["percentile", "score"])
        self.assertEqual(len(rows), 99)
        self.assertEqual(rows[0]["percentile"], "1")
        self.assertEqual(rows[-1]["percentile"], "99")

    def test_percentile_renderer_discloses_log_scale_and_key_values(self):
        points = build_percentiles(tuple(range(100, 10_100, 100)))
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg = output / "percentiles.svg"
            render_percentiles(
                points,
                svg,
                output / "percentiles.png",
                games=100,
                rounds=1,
                seed_start=5,
            )
            text = svg.read_text(encoding="utf-8")

        self.assertIn("P1–P99", text)
        self.assertIn("log score axis", text)
        self.assertIn("100 independent seeds (5–104)", text)
        self.assertIn("1 round per game", text)
        for percentile in (50, 90, 95, 99):
            self.assertIn(f"P{percentile}", text)

    def test_comparison_generator_writes_matching_artifact_sets(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = generate_round_comparison_artifacts(
                Path(directory),
                games=100,
                seed_start=0,
            )
            names = {path.name for path in paths}

        self.assertEqual(len(paths), 12)
        self.assertEqual(
            names,
            {
                "oracle-score-distribution.csv",
                "oracle-score-distribution.png",
                "oracle-score-distribution.svg",
                "oracle-score-percentiles-10-rounds.csv",
                "oracle-score-percentiles-10-rounds.png",
                "oracle-score-percentiles-10-rounds.svg",
                "oracle-score-distribution-1-round.csv",
                "oracle-score-distribution-1-round.png",
                "oracle-score-distribution-1-round.svg",
                "oracle-score-percentiles-1-round.csv",
                "oracle-score-percentiles-1-round.png",
                "oracle-score-percentiles-1-round.svg",
            },
        )
```

- [ ] **Step 2: Run the focused suite and confirm RED**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: import failures for the four new percentile/comparison interfaces.

- [ ] **Step 3: Implement empirical percentile data and CSV**

Add:

```python
@dataclass(frozen=True, slots=True)
class PercentilePoint:
    percentile: int
    score: float


def build_percentiles(scores: tuple[int, ...]) -> tuple[PercentilePoint, ...]:
    if not scores:
        raise ValueError("scores must not be empty")
    ordered = tuple(sorted(scores))
    return tuple(
        PercentilePoint(percentile, _percentile(ordered, percentile / 100))
        for percentile in range(1, 100)
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
```

- [ ] **Step 4: Implement the percentile renderer**

Use the existing palette and save helpers. Plot percentile on the x-axis and
score on a logarithmic y-axis. Draw a coral horizontal line at 1,000. Mark
P50, P90, P95, and P99 with points and exact score labels. Include dynamic
seed count/range and singular/plural round copy. The footer must say:

```text
P1–P99 empirical quantiles · log score axis
```

Reject nonpositive `games` or `rounds`, negative `seed_start`, and percentile
scores at or below zero before rendering the log axis.

- [ ] **Step 5: Generalize distribution artifact stems**

Add an optional `stem: str = "oracle-score-distribution"` argument to
`_generate_oracle_artifacts` and `generate_oracle_artifacts`. Build the CSV,
PNG, and SVG names from `stem`, preserving all existing callers and the
ten-round canonical artifact names.

- [ ] **Step 6: Implement the comparison generator**

Implement:

```python
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
        written.extend((*generation.paths, percentile_csv, percentile_png, percentile_svg))
    return tuple(written)
```

Add a `--comparison` flag to the CLI. When present, call
`generate_round_comparison_artifacts`; otherwise preserve the existing
single-round-count CLI behavior.

- [ ] **Step 7: Run focused GREEN verification**

Run:

```bash
.venv/bin/python -m unittest test_plot_oracle_scores.py
```

Expected: all oracle simulation, histogram, percentile, and comparison tests
pass.

- [ ] **Step 8: Generate the full comparison artifacts**

Run:

```bash
.venv/bin/python plot_oracle_scores.py \
  --comparison \
  --games 10000 \
  --seed-start 0 \
  --output-dir docs/design/artifacts/learn-plots
```

Expected: twelve artifact paths are written from the same seeds for one-round
and ten-round samples.

- [ ] **Step 9: Verify artifact accounting**

Run a Python check that asserts:

```python
for distribution_csv in (
    "oracle-score-distribution.csv",
    "oracle-score-distribution-1-round.csv",
):
    rows = list(csv.DictReader((output / distribution_csv).open()))
    assert sum(int(row["count"]) for row in rows) == 10_000

for percentile_csv in (
    "oracle-score-percentiles-10-rounds.csv",
    "oracle-score-percentiles-1-round.csv",
):
    rows = list(csv.DictReader((output / percentile_csv).open()))
    assert [int(row["percentile"]) for row in rows] == list(range(1, 100))
```

- [ ] **Step 10: Run complete Python verification**

Run:

```bash
.venv/bin/python -m unittest \
  test_bank_it.py test_plot_bank_it.py test_plot_oracle_scores.py
```

Expected: every test passes with no failures or errors.

- [ ] **Step 11: Inspect all four PNG charts**

Inspect:

- `oracle-score-distribution.png`
- `oracle-score-percentiles-10-rounds.png`
- `oracle-score-distribution-1-round.png`
- `oracle-score-percentiles-1-round.png`

Confirm titles, seed ranges, round counts, reference lines, probability labels,
P50/P90/P95/P99 annotations, log/symlog disclosures, and footer copy are
legible and unclipped.

- [ ] **Step 12: Commit Task 3**

```bash
git add \
  plot_oracle_scores.py \
  test_plot_oracle_scores.py \
  docs/design/artifacts/learn-plots/oracle-score-distribution-1-round.* \
  docs/design/artifacts/learn-plots/oracle-score-percentiles-10-rounds.* \
  docs/design/artifacts/learn-plots/oracle-score-percentiles-1-round.*
git commit -m "feat: compare one-round oracle score percentiles"
```
