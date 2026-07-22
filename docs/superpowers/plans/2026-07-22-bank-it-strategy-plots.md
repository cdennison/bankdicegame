# Bank It Strategy Plots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate auditable CSV, SVG, and PNG plots for all-strategy convergence and the best fixed banking threshold in balanced four-player simulations.

**Architecture:** Add one plotting module that imports the tested rules from `bank_it.py`, owns balanced-epoch scheduling and statistical accumulation, and renders immutable result rows. Keep Matplotlib lazy-loaded at the rendering boundary so simulation tests remain fast and independent of plotting setup. A small CLI runs the full deterministic experiments and writes all artifacts to one Learn-page asset directory.

**Tech Stack:** Python 3.14, standard-library `argparse`/`csv`/`dataclasses`/`itertools`/`random`, existing `bank_it.py`, Matplotlib 3.10, `unittest`.

## Global Constraints

- Reuse `play_game`, `strategies`, and `submitted_strategies`; do not duplicate or change game rules.
- Every plotted game has four total players and ten rounds.
- Use tie-adjusted win share, shuffled seats, balanced matchup epochs, and seed `20260722` by default.
- Plot 1 includes exactly 20 existing policies and runs 50 full epochs by default.
- Plot 2 includes fixed thresholds 50–400 by 10 and runs 10 full epochs by default.
- The generator must discover the best fixed target from data; it must not assume 200 wins.
- Commit CSV, SVG, and PNG outputs under `docs/design/artifacts/learn-plots/`.
- Preserve the dependency-free core simulator by keeping plot dependencies in `requirements-plots.txt`.

---

### Task 1: Balanced simulation and statistics

**Files:**
- Create: `plot_bank_it.py`
- Create: `test_plot_bank_it.py`

**Interfaces:**
- Consumes: `bank_it.Strategy`, `bank_it.at_pot`, `bank_it.play_game`, `bank_it.strategies`, and `bank_it.submitted_strategies`.
- Produces: `all_strategy_field() -> tuple[Strategy, ...]`, `fixed_threshold_field() -> tuple[Strategy, ...]`, `simulate_balanced_convergence(...) -> SimulationSummary`, `RatePoint`, and `SimulationSummary`.

- [ ] **Step 1: Write failing field and accumulator tests**

Add tests that require exactly 20 unique existing policy names, the exact threshold tuple `range(50, 401, 10)`, deterministic results for identical seeds, balanced final appearances, fractional tie splitting, ordered checkpoints, and a final checkpoint even when the interval does not divide appearances.

```python
class PlotSimulationTests(unittest.TestCase):
    def test_fields_are_exact(self):
        self.assertEqual(len(all_strategy_field()), 20)
        self.assertEqual(len({s.name for s in all_strategy_field()}), 20)
        self.assertEqual(
            tuple(int(s.name.removeprefix("Pot ")) for s in fixed_threshold_field()),
            tuple(range(50, 401, 10)),
        )

    def test_balanced_epochs_are_deterministic_and_complete(self):
        field = all_strategy_field()[:5]
        one = simulate_balanced_convergence(field, players=4, rounds=2, epochs=2, seed=7, checkpoint_every=3)
        two = simulate_balanced_convergence(field, players=4, rounds=2, epochs=2, seed=7, checkpoint_every=3)
        self.assertEqual(one, two)
        self.assertEqual(one.games, 10)
        self.assertEqual({row.appearances for row in one.final_rates}, {8})
        self.assertTrue(all(points[-1].games_played == 8 for points in one.series.values()))
```

Use a patched deterministic `play_game` result in a separate test to prove a two-way tie adds `0.5` to each winner and contributes the fractional outcome to the uncertainty calculation.

- [ ] **Step 2: Run tests to verify RED**

Run: `python3 -m unittest -v test_plot_bank_it.py`

Expected: FAIL because `plot_bank_it` does not exist.

- [ ] **Step 3: Implement immutable result types and exact fields**

Create frozen dataclasses with these public shapes:

```python
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
```

`all_strategy_field()` concatenates `strategies()` and `submitted_strategies()` and rejects duplicate names. `fixed_threshold_field()` constructs `Strategy(f"Pot {target}", "", at_pot(target))` for every target in `range(50, 401, 10)`.

- [ ] **Step 4: Implement randomized balanced epochs**

For each epoch, materialize `itertools.combinations(field, players)`, shuffle the combination order with the seeded RNG, shuffle seats for each matchup, call `play_game`, split one win among tied leaders, and update per-strategy `appearances`, `win_share`, and `win_share_squared`. Record cumulative points whenever `appearances % checkpoint_every == 0`; append the final point if it was not already recorded. Compute the 95% half-width as `1.96 * sample_standard_error` over fractional per-game win shares, returning zero when fewer than two appearances exist.

- [ ] **Step 5: Verify GREEN**

Run: `python3 -m unittest -v test_plot_bank_it.py test_bank_it.py`

Expected: all plot tests and the existing 10 rule tests pass.

- [ ] **Step 6: Commit**

```bash
git add plot_bank_it.py test_plot_bank_it.py
git commit -m "feat: add balanced plot simulations"
```

---

### Task 2: CSV and chart generation

**Files:**
- Modify: `plot_bank_it.py`
- Modify: `test_plot_bank_it.py`
- Create: `requirements-plots.txt`
- Create: `docs/design/artifacts/learn-plots/all-strategies-convergence.csv`
- Create: `docs/design/artifacts/learn-plots/all-strategies-convergence.svg`
- Create: `docs/design/artifacts/learn-plots/all-strategies-convergence.png`
- Create: `docs/design/artifacts/learn-plots/fixed-threshold-sweep.csv`
- Create: `docs/design/artifacts/learn-plots/fixed-threshold-sweep.svg`
- Create: `docs/design/artifacts/learn-plots/fixed-threshold-sweep.png`

**Interfaces:**
- Consumes: `SimulationSummary` and field factories from Task 1.
- Produces: `write_convergence_csv`, `write_threshold_csv`, `render_convergence`, `render_threshold_sweep`, `generate_plots`, and a CLI entry point.

- [ ] **Step 1: Write failing serialization and rendering tests**

Use `tempfile.TemporaryDirectory` with small synthetic summaries. Assert convergence CSV columns are `strategy,games_played,win_rate`; threshold CSV columns are `target,appearances,win_rate,ci95`; files end with the expected number of data rows; both renderers create nonempty SVG and PNG files; and `generate_plots` returns paths for all six outputs.

```python
def test_writers_and_renderers_create_auditable_outputs(self):
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
```

- [ ] **Step 2: Run tests to verify RED**

Run: `.venv/bin/python -m unittest -v test_plot_bank_it.py`

Expected: FAIL because the writers and renderers do not exist.

- [ ] **Step 3: Add isolated plotting dependency setup**

Create `requirements-plots.txt` containing `matplotlib>=3.10,<3.11`. Build the ignored local environment and install it:

```bash
uv venv .venv
uv pip install --python .venv/bin/python -r requirements-plots.txt
```

- [ ] **Step 4: Implement CSV writers and branded renderers**

Write rates as percentages with six decimal places. Lazy-import Matplotlib inside rendering functions and force the noninteractive `Agg` backend. Use the existing Bank It palette (navy background, warm paper text, gold/mint/blue/violet accents), descriptive titles/subtitles, explicit axes, light horizontal grid lines, and direct/legend labels that identify every series without color alone.

The convergence plot includes a dashed 25% reference line. The threshold plot orders targets numerically, fills `win_rate ± ci95`, marks the maximum observed point, and annotates `Best fixed target: {target}`.

- [ ] **Step 5: Implement the deterministic CLI**

Support:

```text
--output-dir PATH
--seed INTEGER
--convergence-epochs INTEGER
--threshold-epochs INTEGER
--checkpoint-every INTEGER
```

Defaults are the spec values. Reject nonpositive epochs/checkpoint intervals through `argparse`. Print the seed, total games, final appearances, and observed best target after a successful run.

- [ ] **Step 6: Verify reduced generation**

Run:

```bash
.venv/bin/python -m unittest -v test_plot_bank_it.py test_bank_it.py
.venv/bin/python plot_bank_it.py --output-dir /tmp/bankit-plot-smoke --convergence-epochs 1 --threshold-epochs 1 --checkpoint-every 1000
```

Expected: tests pass and all six smoke artifacts are nonempty.

- [ ] **Step 7: Generate the full artifacts**

Run:

```bash
.venv/bin/python plot_bank_it.py
```

Expected: 242,250 convergence games, 48,450 appearances per existing strategy, 589,050 threshold games, 65,450 appearances per threshold, and six outputs under `docs/design/artifacts/learn-plots/`.

- [ ] **Step 8: Inspect both PNGs and verify the repository**

Open both PNGs at original resolution and check labels, axes, legend/direct labels, uncertainty band, best-target annotation, clipping, and contrast. Then run:

```bash
.venv/bin/python -m unittest -v
npm test -- --run
npm run typecheck
npm run build
git diff --check
git status --short
```

Expected: Python, TypeScript, and build verification pass; only intended plot code, requirements, tests, and artifacts are modified.

- [ ] **Step 9: Commit**

```bash
git add plot_bank_it.py test_plot_bank_it.py requirements-plots.txt docs/design/artifacts/learn-plots
git commit -m "feat: generate strategy comparison plots"
```
