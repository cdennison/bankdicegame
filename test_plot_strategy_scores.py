import csv
import random
import tempfile
import unittest
from pathlib import Path

from bank_it import GameView, Strategy, at_pot, strategies
from plot_oracle_scores import simulate_oracle_game, simulate_oracle_scores
from plot_strategy_scores import (
    SOLO_SOURCE_NAMES,
    SOLO_STRATEGY_NAMES,
    _parse_args,
    generate_strategy_artifacts,
    render_capture_bars,
    render_distribution_grid,
    deal_round,
    oracle_round,
    build_threshold_field,
    generate_threshold_sweep,
    render_summary_dots,
    render_threshold_lines,
    score_round,
    sweep_threshold_summaries,
    threshold_values,
    write_table_csv,
    simulate_paired_scores,
    simulate_strategy_scores,
    solo_field,
    summarize_strategy,
    write_summary_csv,
)


def view(**overrides) -> GameView:
    defaults = {
        "pot": 140,
        "roll": 6,
        "danger_rolls": 3,
        "round_number": 1,
        "rounds": 1,
        "own_score": 0,
        "opponent_scores": (),
        "active_opponents": 0,
        "total_opponents": 0,
        "last_roll_was_double": False,
    }
    return GameView(**{**defaults, **overrides})


class SoloFieldTests(unittest.TestCase):
    def test_field_matches_the_declared_names_in_order(self):
        self.assertEqual(
            tuple(strategy.name for strategy in solo_field()),
            SOLO_STRATEGY_NAMES,
        )

    def test_every_chosen_strategy_ignores_opponent_state(self):
        contexts = (
            {"opponent_scores": (), "own_score": 0, "total_opponents": 0},
            {"opponent_scores": (900, 40), "own_score": 10, "total_opponents": 2},
            {"opponent_scores": (0, 0, 0), "own_score": 800, "total_opponents": 3},
        )
        for strategy in solo_field():
            for pot in (0, 60, 100, 140, 200, 260, 900):
                for danger_rolls in (0, 1, 3, 5, 9):
                    decisions = {
                        strategy.bank(
                            view(pot=pot, danger_rolls=danger_rolls, **context)
                        )
                        for context in contexts
                    }
                    with self.subTest(strategy=strategy.name, pot=pot):
                        self.assertEqual(len(decisions), 1)

    def test_removed_and_renamed_strategies(self):
        names = set(SOLO_STRATEGY_NAMES)

        self.assertNotIn("Pot 211 Counter", names)
        self.assertNotIn("Double Hunter", names)
        self.assertIn("Safe Exit + 1 More", names)
        self.assertIn("Safe Exit + 3 More", names)
        self.assertIn("Safe Exit + 5 More", names)
        self.assertNotIn("One More", names)

    def test_renamed_strategies_keep_their_source_behaviour(self):
        # "Safe Exit + 1 More" must still bank after one danger roll.
        plus_one = next(
            s for s in solo_field() if s.name == "Safe Exit + 1 More"
        )
        for seed in range(50):
            dice = deal_round(random.Random(seed))
            safe_pot = sum(70 if a + b == 7 else a + b for a, b in dice[:3])
            if sum(dice[3]) == 7:
                expected = 0  # busts on the first danger roll, before banking
            elif dice[3][0] == dice[3][1]:
                expected = safe_pot * 2
            else:
                expected = safe_pot + sum(dice[3])
            with self.subTest(seed=seed):
                self.assertEqual(score_round(plus_one, dice), expected)

    def test_opponent_aware_strategies_are_excluded(self):
        excluded = {
            strategy.name for strategy in strategies()
        } - set(SOLO_SOURCE_NAMES)

        self.assertIn("Protect Lead", excluded)
        self.assertIn("Catch Up", excluded)
        self.assertIn("Adaptive Rank", excluded)
        self.assertIn("State Delta", excluded)


class SoloSimulationTests(unittest.TestCase):
    def test_one_score_per_consecutive_seed(self):
        strategy = Strategy("Pot 100", "", at_pot(100))

        scores = simulate_strategy_scores(strategy, games=25, seed_start=7)

        self.assertEqual(len(scores), 25)
        self.assertTrue(all(isinstance(score, int) for score in scores))

    def test_scores_are_reproducible_for_the_same_seed_range(self):
        strategy = solo_field()[3]

        first = simulate_strategy_scores(strategy, games=40, seed_start=0)
        second = simulate_strategy_scores(strategy, games=40, seed_start=0)

        self.assertEqual(first, second)

    def test_seed_start_shifts_the_sample(self):
        strategy = solo_field()[3]

        first = simulate_strategy_scores(strategy, games=40, seed_start=0)
        shifted = simulate_strategy_scores(strategy, games=40, seed_start=40)

        self.assertNotEqual(first, shifted)

    def test_rejects_invalid_sample_sizes(self):
        strategy = solo_field()[0]

        with self.assertRaises(ValueError):
            simulate_strategy_scores(strategy, games=0)
        with self.assertRaises(ValueError):
            simulate_strategy_scores(strategy, rounds=0)
        with self.assertRaises(ValueError):
            simulate_strategy_scores(strategy, seed_start=-1)

    def test_a_higher_threshold_never_banks_a_smaller_pot_on_the_same_seed(self):
        low = Strategy("low", "", at_pot(80))
        high = Strategy("high", "", at_pot(200))

        low_scores = simulate_strategy_scores(low, games=300, seed_start=0)
        high_scores = simulate_strategy_scores(high, games=300, seed_start=0)

        for low_score, high_score in zip(low_scores, high_scores):
            self.assertTrue(high_score == 0 or high_score >= low_score)


class PairedSimulationTests(unittest.TestCase):
    def test_dealt_round_ends_on_the_first_seven_after_the_safe_rolls(self):
        for seed in range(200):
            dice = deal_round(random.Random(seed))
            with self.subTest(seed=seed):
                self.assertGreater(len(dice), 3)
                self.assertEqual(sum(dice[-1]), 7)
                for index, (die_1, die_2) in enumerate(dice[:-1]):
                    if index >= 3:
                        self.assertNotEqual(die_1 + die_2, 7)

    def test_no_strategy_can_ever_beat_the_oracle_on_the_same_dice(self):
        field = solo_field()
        scores, oracle = simulate_paired_scores(field, games=1_000, rounds=1)

        for strategy in field:
            for score, best in zip(scores[strategy.name], oracle):
                with self.subTest(strategy=strategy.name):
                    self.assertLessEqual(score, best)

    def test_oracle_round_matches_the_reference_oracle_simulator(self):
        for seed in range(300):
            paired = oracle_round(deal_round(random.Random(seed)))
            reference = simulate_oracle_game(random.Random(seed), rounds=1)
            with self.subTest(seed=seed):
                self.assertEqual(paired, reference)

    def test_every_strategy_sees_the_same_dice_for_a_given_seed(self):
        field = solo_field()
        scores, _ = simulate_paired_scores(field, games=50, rounds=1)
        dice = [deal_round(random.Random(seed)) for seed in range(50)]

        for strategy in field:
            expected = tuple(score_round(strategy, roll) for roll in dice)
            with self.subTest(strategy=strategy.name):
                self.assertEqual(scores[strategy.name], expected)

    def test_safe_exit_banks_the_three_safe_rolls_every_time(self):
        safe_exit = solo_field()[0]

        for seed in range(200):
            dice = deal_round(random.Random(seed))
            expected = sum(70 if a + b == 7 else a + b for a, b in dice[:3])
            with self.subTest(seed=seed):
                self.assertEqual(score_round(safe_exit, dice), expected)

    def test_paired_simulation_rejects_an_empty_field(self):
        with self.assertRaises(ValueError):
            simulate_paired_scores((), games=10)


class SummaryTests(unittest.TestCase):
    def test_summary_reports_order_statistics_and_oracle_capture(self):
        scores = (0, 0, 100, 200, 300)
        oracle = (100, 100, 200, 400, 400)

        summary = summarize_strategy("demo", scores, oracle_scores=oracle)

        self.assertEqual(summary.name, "demo")
        self.assertEqual(summary.median, 100)
        self.assertEqual(summary.mean, 120)
        self.assertEqual(summary.maximum, 300)
        self.assertEqual(summary.bust_rate, 40.0)
        self.assertAlmostEqual(summary.oracle_capture_pooled, 600 / 1200 * 100)
        self.assertAlmostEqual(
            summary.oracle_capture,
            (0 / 100 + 0 / 100 + 100 / 200 + 200 / 400 + 300 / 400) / 5 * 100,
        )

    def test_summary_rejects_mismatched_oracle_samples(self):
        with self.assertRaises(ValueError):
            summarize_strategy("demo", (1, 2), oracle_scores=(1,))
        with self.assertRaises(ValueError):
            summarize_strategy("demo", (), oracle_scores=())

    def test_csv_has_one_row_per_strategy_with_a_stable_header(self):
        field = solo_field()[:3]
        scores, oracle = simulate_paired_scores(field, games=30, rounds=1)
        summaries = [
            summarize_strategy(
                strategy.name, scores[strategy.name], oracle_scores=oracle
            )
            for strategy in field
        ]

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "summary.csv"
            write_summary_csv(summaries, path)
            with path.open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))

        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0]["strategy"], solo_field()[0].name)
        self.assertIn("oracle_capture", rows[0])
        self.assertIn("bust_rate", rows[0])


class TableTests(unittest.TestCase):
    def test_table_has_the_four_headline_columns_in_order(self):
        field = solo_field()[:3]
        scores, oracle = simulate_paired_scores(field, games=30, rounds=1)
        summaries = [
            summarize_strategy(s.name, scores[s.name], oracle_scores=oracle)
            for s in field
        ]

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "table.csv"
            write_table_csv(summaries, path)
            with path.open(encoding="utf-8") as handle:
                reader = csv.reader(handle)
                header = next(reader)
                rows = list(reader)

        self.assertEqual(
            header, ["strategy", "median", "mean", "bust_pct", "jackpot_p99"]
        )
        self.assertEqual(len(rows), 3)


class ThresholdSweepTests(unittest.TestCase):
    def test_threshold_grid_is_inclusive_and_stepped(self):
        self.assertEqual(
            threshold_values(100, 1000, 100),
            (100, 200, 300, 400, 500, 600, 700, 800, 900, 1000),
        )

    def test_threshold_grid_rejects_bad_bounds(self):
        with self.assertRaises(ValueError):
            threshold_values(0, 100, 10)
        with self.assertRaises(ValueError):
            threshold_values(100, 50, 10)
        with self.assertRaises(ValueError):
            threshold_values(100, 200, 0)

    def test_field_has_one_pot_rule_per_threshold(self):
        field = build_threshold_field((100, 200, 300))

        self.assertEqual([s.name for s in field], ["Pot 100", "Pot 200", "Pot 300"])

    def test_summaries_are_ordered_like_the_thresholds(self):
        thresholds = (100, 200, 300)
        summaries = sweep_threshold_summaries(thresholds, games=200, rounds=1)

        self.assertEqual(len(summaries), 3)
        self.assertEqual([s.name for s in summaries], ["Pot 100", "Pot 200", "Pot 300"])
        # A higher threshold busts at least as often on the same dice.
        busts = [s.bust_rate for s in summaries]
        self.assertEqual(busts, sorted(busts))

    def test_renderer_rejects_mismatched_lengths(self):
        summaries = sweep_threshold_summaries((100, 200), games=100, rounds=1)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            with self.assertRaises(ValueError):
                render_threshold_lines(
                    (100, 200, 300),
                    summaries,
                    output / "a.svg",
                    output / "a.png",
                    games=100,
                )

    def test_generator_writes_svg_and_png(self):
        with tempfile.TemporaryDirectory() as directory:
            svg_path, png_path = generate_threshold_sweep(
                Path(directory),
                start=100,
                stop=300,
                step=100,
                games=200,
                rounds=1,
                stem="sweep",
            )

            self.assertTrue(svg_path.exists())
            self.assertTrue(png_path.exists())


class RendererTests(unittest.TestCase):
    def _summaries(self, count=3, games=30):
        field = solo_field()[:count]
        scores, oracle = simulate_paired_scores(field, games=games, rounds=1)
        return [
            summarize_strategy(
                strategy.name, scores[strategy.name], oracle_scores=oracle
            )
            for strategy in field
        ]

    def test_dot_plot_labels_every_strategy_and_discloses_the_sample(self):
        summaries = self._summaries()

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "dots.svg"
            render_summary_dots(
                summaries,
                svg_path,
                output / "dots.png",
                games=30,
                rounds=1,
            )
            svg_text = svg_path.read_text(encoding="utf-8")

        self.assertIn("1 round per game", svg_text)
        self.assertIn("30 independent seeds", svg_text)

    def test_capture_bars_render_and_disclose_the_measure(self):
        summaries = self._summaries()

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "capture.svg"
            render_capture_bars(
                summaries,
                svg_path,
                output / "capture.png",
                games=30,
                rounds=1,
            )
            svg_text = svg_path.read_text(encoding="utf-8")

        self.assertIn("oracle", svg_text.lower())

    def test_renderers_reject_empty_input(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            with self.assertRaises(ValueError):
                render_summary_dots((), output / "a.svg", output / "a.png", games=1)
            with self.assertRaises(ValueError):
                render_capture_bars((), output / "b.svg", output / "b.png", games=1)
            with self.assertRaises(ValueError):
                render_distribution_grid((), output / "c.svg", output / "c.png", games=1)

    def test_distribution_grid_renders_one_panel_per_strategy(self):
        score_sets = [
            (
                strategy.name,
                simulate_strategy_scores(strategy, games=60, rounds=1),
            )
            for strategy in solo_field()[:5]
        ]

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "grid.svg"
            render_distribution_grid(
                score_sets,
                svg_path,
                output / "grid.png",
                games=60,
                rounds=1,
            )
            svg_text = svg_path.read_text(encoding="utf-8")

        for name, _ in score_sets:
            self.assertIn(name.replace(" ", ""), svg_text.replace(" ", ""))


class ArtifactTests(unittest.TestCase):
    def test_generator_writes_the_table_and_both_charts(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = generate_strategy_artifacts(
                Path(directory),
                games=40,
                rounds=1,
                seed_start=0,
                field=solo_field()[:4],
                stem="solo",
            )

            self.assertEqual(len(paths), 8)
            for path in paths:
                self.assertTrue(path.exists(), path)
            with paths[0].open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))

        self.assertEqual(len(rows), 4)


class CliTests(unittest.TestCase):
    def test_defaults_are_one_round_and_ten_thousand_games(self):
        args = _parse_args([])

        self.assertEqual(args.games, 10_000)
        self.assertEqual(args.rounds, 1)
        self.assertEqual(args.seed_start, 0)

    def test_rejects_nonpositive_games(self):
        with self.assertRaises(SystemExit):
            _parse_args(["--games", "0"])


if __name__ == "__main__":
    unittest.main()
