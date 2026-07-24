import csv
import random
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from plot_oracle_scores import (
    build_histogram,
    build_percentiles,
    generate_oracle_artifacts,
    generate_round_comparison_artifacts,
    render_histogram,
    render_percentiles,
    simulate_oracle_game,
    simulate_oracle_scores,
    write_histogram_csv,
    write_percentile_csv,
)


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

    def test_score_batch_rejects_negative_seed_start(self):
        with self.assertRaisesRegex(ValueError, "seed_start must be nonnegative"):
            simulate_oracle_scores(games=1, seed_start=-1)

    def test_scores_match_structurally_independent_reference_simulator(self):
        def reference_score(seed: int) -> int:
            rng = random.Random(seed)
            score = 0
            for _ in range(10):
                safe_rolls = [
                    rng.randint(1, 6) + rng.randint(1, 6)
                    for _ in range(3)
                ]
                pot = sum(70 if total == 7 else total for total in safe_rolls)
                while True:
                    die_1 = rng.randint(1, 6)
                    die_2 = rng.randint(1, 6)
                    if die_1 + die_2 == 7:
                        break
                    if die_1 == die_2:
                        pot *= 2
                    else:
                        pot += die_1 + die_2
                score += pot
            return score

        seeds = (0, 1, 7, 42, 999)

        actual = tuple(
            simulate_oracle_game(random.Random(seed))
            for seed in seeds
        )

        self.assertEqual(
            actual,
            tuple(reference_score(seed) for seed in seeds),
        )

    def test_cli_rejects_negative_seed_start(self):
        result = subprocess.run(
            [
                sys.executable,
                "plot_oracle_scores.py",
                "--games",
                "1",
                "--seed-start",
                "-1",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 2)
        self.assertIn("must be a nonnegative integer", result.stderr)


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
            with path.open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))

        self.assertEqual(sum(int(row["count"]) for row in rows), len(scores))
        self.assertEqual(rows[-1]["bucket_end"], "overflow")

    def test_renderer_returns_exact_at_least_target_rate(self):
        scores = (999, 1000, 1001, 2000)
        histogram = build_histogram(scores)

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "distribution.svg"
            png_path = output / "distribution.png"
            rate = render_histogram(scores, histogram, svg_path, png_path)
            svg_text = svg_path.read_text(encoding="utf-8")

            self.assertEqual(rate, 75.0)
            self.assertGreater(svg_path.stat().st_size, 0)
            self.assertGreater(png_path.stat().st_size, 0)
            self.assertIn("4 independent seeds", svg_text)

    def test_renderer_uses_singular_round_copy(self):
        scores = (100, 200, 300, 400)
        histogram = build_histogram(scores)

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "distribution.svg"
            render_histogram(
                scores,
                histogram,
                svg_path,
                output / "distribution.png",
                rounds=1,
            )
            svg_text = svg_path.read_text(encoding="utf-8")

        self.assertIn("1 round per game", svg_text)
        self.assertNotIn("1 rounds per game", svg_text)

    def test_generator_writes_three_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = generate_oracle_artifacts(
                Path(directory),
                games=20,
                rounds=2,
                seed_start=5,
            )
            csv_path, png_path, svg_path, rate = paths

            self.assertTrue(csv_path.exists())
            self.assertTrue(png_path.exists())
            self.assertTrue(svg_path.exists())
            with csv_path.open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))
            svg_text = svg_path.read_text(encoding="utf-8")
            self.assertEqual(sum(int(row["count"]) for row in rows), 20)
            self.assertEqual(rows[-1]["bucket_end"], "overflow")
            self.assertIn("20 independent seeds (5–24)", svg_text)
            self.assertIn("2 rounds per game", svg_text)
            self.assertIn("Symlog x-axis", svg_text)
            self.assertIn(f"= {rate:.2f}%", svg_text)
            self.assertGreaterEqual(rate, 0.0)
            self.assertLessEqual(rate, 100.0)


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

    def test_percentile_renderer_rejects_invalid_log_axis_inputs(self):
        points = build_percentiles((100, 200, 300, 400))
        invalid_points = build_percentiles((-100, 0, 100, 200))
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg = output / "percentiles.svg"
            png = output / "percentiles.png"
            with self.assertRaisesRegex(ValueError, "games must be positive"):
                render_percentiles(
                    points,
                    svg,
                    png,
                    games=0,
                    rounds=1,
                    seed_start=0,
                )
            with self.assertRaisesRegex(ValueError, "rounds must be positive"):
                render_percentiles(
                    points,
                    svg,
                    png,
                    games=4,
                    rounds=0,
                    seed_start=0,
                )
            with self.assertRaisesRegex(
                ValueError,
                "seed_start must be nonnegative",
            ):
                render_percentiles(
                    points,
                    svg,
                    png,
                    games=4,
                    rounds=1,
                    seed_start=-1,
                )
            with self.assertRaisesRegex(
                ValueError,
                "percentile scores must be positive",
            ):
                render_percentiles(
                    invalid_points,
                    svg,
                    png,
                    games=4,
                    rounds=1,
                    seed_start=0,
                )

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


if __name__ == "__main__":
    unittest.main()
