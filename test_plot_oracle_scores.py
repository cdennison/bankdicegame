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
