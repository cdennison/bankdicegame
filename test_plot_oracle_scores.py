import csv
import random
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from plot_oracle_scores import (
    build_histogram,
    generate_oracle_artifacts,
    render_histogram,
    simulate_oracle_game,
    simulate_oracle_scores,
    write_histogram_csv,
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


if __name__ == "__main__":
    unittest.main()
