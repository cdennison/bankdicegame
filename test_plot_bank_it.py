import math
import unittest
from unittest.mock import patch

from bank_it import Strategy, at_pot
from plot_bank_it import (
    all_strategy_field,
    fixed_threshold_field,
    simulate_balanced_convergence,
)


class PlotSimulationTests(unittest.TestCase):
    def test_fields_are_exact(self):
        self.assertEqual(len(all_strategy_field()), 20)
        self.assertEqual(len({strategy.name for strategy in all_strategy_field()}), 20)
        self.assertEqual(
            tuple(
                int(strategy.name.removeprefix("Pot "))
                for strategy in fixed_threshold_field()
            ),
            tuple(range(50, 401, 10)),
        )

    def test_all_strategy_field_rejects_duplicate_names(self):
        duplicate = Strategy("Duplicate", "", at_pot(100))
        with (
            patch("plot_bank_it.strategies", return_value=(duplicate,)),
            patch("plot_bank_it.submitted_strategies", return_value=(duplicate,)),
        ):
            with self.assertRaisesRegex(ValueError, "duplicate strategy name"):
                all_strategy_field()

    def test_balanced_epochs_are_deterministic_and_complete(self):
        field = all_strategy_field()[:5]
        one = simulate_balanced_convergence(
            field,
            players=4,
            rounds=2,
            epochs=2,
            seed=7,
            checkpoint_every=3,
        )
        two = simulate_balanced_convergence(
            field,
            players=4,
            rounds=2,
            epochs=2,
            seed=7,
            checkpoint_every=3,
        )

        self.assertEqual(one, two)
        self.assertEqual(one.games, 10)
        self.assertEqual({row.appearances for row in one.final_rates}, {8})
        self.assertTrue(
            all(points[-1].games_played == 8 for points in one.series.values())
        )
        self.assertTrue(
            all(
                tuple(point.games_played for point in points) == (3, 6, 8)
                for points in one.series.values()
            )
        )

    def test_ties_split_wins_and_fractional_shares_drive_uncertainty(self):
        field = (
            Strategy("A", "", at_pot(100)),
            Strategy("B", "", at_pot(100)),
        )
        calls = 0

        def tied_then_a_wins(seated_field, rng, rounds):
            nonlocal calls
            calls += 1
            if calls == 1:
                return [10, 10]
            return [10 if strategy.name == "A" else 0 for strategy in seated_field]

        with patch("plot_bank_it.play_game", side_effect=tied_then_a_wins):
            summary = simulate_balanced_convergence(
                field,
                players=2,
                rounds=1,
                epochs=2,
                seed=3,
                checkpoint_every=1,
            )

        rates = {row.strategy: row for row in summary.final_rates}
        self.assertEqual(rates["A"].win_rate, 0.75)
        self.assertEqual(rates["B"].win_rate, 0.25)
        self.assertTrue(math.isclose(rates["A"].ci95, 0.49))
        self.assertTrue(math.isclose(rates["B"].ci95, 0.49))


if __name__ == "__main__":
    unittest.main()
