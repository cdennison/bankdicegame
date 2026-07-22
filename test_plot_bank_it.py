import csv
import io
import inspect
import math
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import plot_bank_it
from bank_it import Strategy, at_pot, strategies, submitted_strategies
from plot_bank_it import (
    FinalRate,
    RatePoint,
    SimulationSummary,
    all_strategy_field,
    fixed_threshold_field,
    generate_plots,
    render_convergence,
    render_threshold_sweep,
    simulate_balanced_convergence,
    write_convergence_csv,
    write_threshold_csv,
)


class PlotSimulationTests(unittest.TestCase):
    def test_fields_are_exact(self):
        self.assertEqual(
            tuple(strategy.name for strategy in all_strategy_field()),
            tuple(
                strategy.name
                for strategy in strategies() + submitted_strategies()
            ),
        )
        self.assertEqual(len(all_strategy_field()), 20)
        self.assertEqual(len({strategy.name for strategy in all_strategy_field()}), 20)
        self.assertEqual(
            tuple(
                int(strategy.name.removeprefix("Pot "))
                for strategy in fixed_threshold_field()
            ),
            tuple(range(50, 401, 10)),
        )

    def test_simulation_defaults_are_public_and_usable(self):
        parameters = inspect.signature(simulate_balanced_convergence).parameters
        self.assertEqual(parameters["players"].default, 4)
        self.assertEqual(parameters["rounds"].default, 10)
        self.assertEqual(parameters["seed"].default, 20260722)

        field = all_strategy_field()[:4]
        with patch("plot_bank_it.play_game", return_value=[1, 1, 1, 1]) as game:
            summary = simulate_balanced_convergence(
                field,
                epochs=1,
                checkpoint_every=1,
            )

        self.assertEqual(summary.games, 1)
        self.assertEqual({row.appearances for row in summary.final_rates}, {1})
        self.assertEqual(game.call_args.kwargs["rounds"], 10)

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

    def test_fixed_targets_are_seated_against_each_other(self):
        targets = {150, 200, 250, 300}
        field = tuple(
            strategy
            for strategy in fixed_threshold_field()
            if int(strategy.name.removeprefix("Pot ")) in targets
        )
        seated_matchups = []

        def capture_matchup(seated_field, rng, rounds):
            seated_matchups.append({strategy.name for strategy in seated_field})
            return [0, 0, 0, 0]

        with patch("plot_bank_it.play_game", side_effect=capture_matchup):
            simulate_balanced_convergence(
                field,
                players=4,
                rounds=1,
                epochs=1,
                seed=19,
                checkpoint_every=1,
            )

        self.assertIn({"Pot 150", "Pot 200", "Pot 250", "Pot 300"}, seated_matchups)

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


class PlotArtifactTests(unittest.TestCase):
    def setUp(self):
        self.summary = SimulationSummary(
            games=3,
            series={
                "Pot 100": (
                    RatePoint("Pot 100", 1, 0.5),
                    RatePoint("Pot 100", 3, 1 / 3),
                ),
                "Pot 200": (RatePoint("Pot 200", 3, 2 / 3),),
            },
            final_rates=(
                FinalRate("Pot 200", 3, 2 / 3, 0.1),
                FinalRate("Pot 100", 3, 1 / 3, 0.05),
            ),
        )

    def test_csv_writers_use_auditable_columns_percentages_and_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            convergence = output / "convergence.csv"
            threshold = output / "threshold.csv"

            write_convergence_csv(self.summary, convergence)
            write_threshold_csv(self.summary, threshold)

            with convergence.open(newline="", encoding="utf-8") as handle:
                convergence_rows = list(csv.reader(handle))
            with threshold.open(newline="", encoding="utf-8") as handle:
                threshold_rows = list(csv.reader(handle))

            self.assertEqual(
                convergence_rows[0], ["strategy", "games_played", "win_rate"]
            )
            self.assertEqual(len(convergence_rows), 4)
            self.assertEqual(convergence_rows[1], ["Pot 100", "1", "50.000000"])
            self.assertEqual(
                threshold_rows[0], ["target", "appearances", "win_rate", "ci95"]
            )
            self.assertEqual(len(threshold_rows), 3)
            self.assertEqual(threshold_rows[1][0], "100")
            self.assertEqual(threshold_rows[1][2:], ["33.333333", "5.000000"])

    def test_full_output_csv_cardinalities_without_full_simulation(self):
        convergence = SimulationSummary(
            games=0,
            series={
                f"Strategy {strategy}": tuple(
                    RatePoint(f"Strategy {strategy}", checkpoint, 0.25)
                    for checkpoint in range(1, 50)
                )
                for strategy in range(20)
            },
            final_rates=(),
        )
        threshold = SimulationSummary(
            games=0,
            series={},
            final_rates=tuple(
                FinalRate(f"Pot {target}", 65450, 0.25, 0.01)
                for target in range(50, 401, 10)
            ),
        )
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            convergence_path = output / "convergence.csv"
            threshold_path = output / "threshold.csv"

            write_convergence_csv(convergence, convergence_path)
            write_threshold_csv(threshold, threshold_path)

            self.assertEqual(len(convergence_path.read_text().splitlines()) - 1, 980)
            self.assertEqual(len(threshold_path.read_text().splitlines()) - 1, 36)

    def test_renderers_create_nonempty_svg_and_png_files(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            convergence_svg = output / "convergence.svg"
            convergence_png = output / "convergence.png"
            threshold_svg = output / "threshold.svg"
            threshold_png = output / "threshold.png"

            render_convergence(self.summary, convergence_svg, convergence_png)
            render_threshold_sweep(self.summary, threshold_svg, threshold_png)

            paths = (
                convergence_svg,
                convergence_png,
                threshold_svg,
                threshold_png,
            )
            self.assertTrue(all(path.stat().st_size > 0 for path in paths))

    def test_svg_rendering_is_byte_stable(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            first_svg = output / "first.svg"
            second_svg = output / "second.svg"

            render_threshold_sweep(self.summary, first_svg, output / "first.png")
            render_threshold_sweep(self.summary, second_svg, output / "second.png")

            self.assertEqual(first_svg.read_bytes(), second_svg.read_bytes())

    def test_generated_text_uses_unix_lines_without_trailing_spaces(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            csv_path = output / "data.csv"
            svg_path = output / "plot.svg"

            write_convergence_csv(self.summary, csv_path)
            render_threshold_sweep(self.summary, svg_path, output / "plot.png")

            for path in (csv_path, svg_path):
                content = path.read_bytes()
                self.assertNotIn(b"\r", content)
                self.assertTrue(
                    all(line == line.rstrip() for line in content.splitlines())
                )

    def test_generate_plots_returns_six_auditable_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            paths = generate_plots(
                output,
                seed=11,
                convergence_epochs=1,
                threshold_epochs=1,
                convergence_field=all_strategy_field()[:4],
                threshold_field=fixed_threshold_field()[:4],
            )
            self.assertEqual(len(paths), 6)
            self.assertTrue(all(path.stat().st_size > 0 for path in paths))

    def test_cli_rejects_nonpositive_simulation_counts(self):
        script = Path(__file__).with_name("plot_bank_it.py")
        for option in (
            "--convergence-epochs",
            "--threshold-epochs",
            "--checkpoint-every",
        ):
            result = subprocess.run(
                [sys.executable, str(script), option, "0"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("positive integer", result.stderr)

    def test_best_target_annotation_points_inward_at_plot_edges(self):
        self.assertEqual(plot_bank_it._best_annotation_offset(0, 36), (18, 24))
        self.assertEqual(plot_bank_it._best_annotation_offset(35, 36), (-180, 24))

    def test_default_constants_and_parser_values_are_exact(self):
        self.assertEqual(
            plot_bank_it.DEFAULT_OUTPUT_DIR,
            Path("docs/design/artifacts/learn-plots"),
        )
        self.assertEqual(plot_bank_it.DEFAULT_SEED, 20260722)
        self.assertEqual(plot_bank_it.DEFAULT_CONVERGENCE_EPOCHS, 50)
        self.assertEqual(plot_bank_it.DEFAULT_THRESHOLD_EPOCHS, 10)
        self.assertEqual(plot_bank_it.DEFAULT_CHECKPOINT_EVERY, 1000)

        args = plot_bank_it._parse_args([])
        self.assertEqual(args.output_dir, plot_bank_it.DEFAULT_OUTPUT_DIR)
        self.assertEqual(args.seed, 20260722)
        self.assertEqual(args.convergence_epochs, 50)
        self.assertEqual(args.threshold_epochs, 10)
        self.assertEqual(args.checkpoint_every, 1000)

    def test_boundary_maximum_language_is_exact_in_plot_and_cli(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            svg_path = output / "threshold.svg"
            render_threshold_sweep(self.summary, svg_path, output / "threshold.png")
            svg = svg_path.read_text(encoding="utf-8")

        self.assertEqual(
            plot_bank_it._highest_observed_label(200, 200),
            "Highest observed in tested range: 200 (range maximum)",
        )
        self.assertIn("Highest observed in tested range:", svg)
        self.assertIn("200 (range maximum)", svg)
        self.assertIn("Larger targets were not evaluated", svg)
        self.assertNotIn("Best fixed target", svg)

        arguments = SimpleNamespace(
            output_dir=Path("unused"),
            seed=20260722,
            convergence_epochs=50,
            threshold_epochs=10,
            checkpoint_every=1000,
        )
        output = io.StringIO()
        with (
            patch("plot_bank_it._parse_args", return_value=arguments),
            patch(
                "plot_bank_it._generate_plot_data",
                return_value=((Path("one"),), self.summary, self.summary),
            ),
            redirect_stdout(output),
        ):
            plot_bank_it.main()

        cli = output.getvalue()
        self.assertIn("Highest observed in tested range: 200 (range maximum)", cli)
        self.assertIn("Larger targets were not evaluated", cli)
        self.assertNotIn("Observed best fixed target", cli)

    def test_interior_winner_does_not_claim_range_maximum(self):
        interior = SimulationSummary(
            games=3,
            series={},
            final_rates=(
                FinalRate("Pot 100", 3, 0.2, 0.1),
                FinalRate("Pot 200", 3, 0.5, 0.1),
                FinalRate("Pot 300", 3, 0.3, 0.1),
            ),
        )
        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            svg_path = output_dir / "threshold.svg"
            render_threshold_sweep(interior, svg_path, output_dir / "threshold.png")
            svg = svg_path.read_text(encoding="utf-8")

        self.assertEqual(
            plot_bank_it._highest_observed_label(200, 300),
            "Highest observed in tested range: 200",
        )
        self.assertIn("Highest observed in tested range:", svg)
        self.assertIn("<!-- 200 -->", svg)
        self.assertNotIn("range maximum", svg)
        self.assertNotIn("Larger targets were not evaluated", svg)

        arguments = SimpleNamespace(
            output_dir=Path("unused"),
            seed=20260722,
            convergence_epochs=50,
            threshold_epochs=10,
            checkpoint_every=1000,
        )
        output = io.StringIO()
        with (
            patch("plot_bank_it._parse_args", return_value=arguments),
            patch(
                "plot_bank_it._generate_plot_data",
                return_value=((Path("one"),), self.summary, interior),
            ),
            redirect_stdout(output),
        ):
            plot_bank_it.main()

        cli = output.getvalue()
        self.assertIn("Highest observed in tested range: 200", cli)
        self.assertNotIn("range maximum", cli)
        self.assertNotIn("Larger targets were not evaluated", cli)


if __name__ == "__main__":
    unittest.main()
