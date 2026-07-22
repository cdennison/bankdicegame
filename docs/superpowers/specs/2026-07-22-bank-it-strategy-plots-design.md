# Bank It Strategy Plots Design

**Status:** Approved
**Date:** 2026-07-22

## Goal

Generate two reproducible plots from the repository's tested Python rules before redesigning the Learn page. The plots compare strategies in four-player, ten-round games and must report tie-adjusted win share rather than outright wins.

## Shared simulation rules

- Import and reuse `play_game`, `strategies`, and `submitted_strategies` from `bank_it.py`; do not duplicate or alter the game rules.
- Use four total players, ten rounds, shuffled seats, and balanced matchup combinations.
- Use one documented seed, `20260722`, for matchup order, seating, and every dice roll.
- Split tied wins equally among tied strategies.
- Generate source CSV data alongside SVG and PNG chart files.
- Keep the simulator dependency-free; plotting dependencies belong in a separate plotting requirements file.

## Plot 1: all-strategy convergence

Include all 20 policies: the 17 built-in strategies plus Solution 4o, Solution GPT-3.5, and Solution GPT-5.

Every unique four-strategy combination plays in balanced epochs. Each epoch contains every combination once in randomized order, with seats shuffled inside each game. Run 50 epochs, producing 242,250 games and 48,450 appearances per strategy.

The x-axis is games played by that strategy. The y-axis is its cumulative tie-adjusted win rate. Sample cumulative values at regular checkpoints so the output CSV and SVG remain compact. Draw every strategy, group related policy families with a consistent color system, include a 25% four-player reference line, and label lines clearly without relying on color alone.

## Plot 2: best fixed banking target

Construct 36 deliberately constrained strategies with thresholds from 50 through 400 in increments of 10. Every strategy follows exactly one rule: bank when the shared pot is at least its threshold. It does not inspect score, rank, round, opponents, doubles, or any other state.

Every unique four-threshold combination plays in 10 balanced epochs, producing 589,050 games and 65,450 appearances per threshold. The x-axis is the fixed banking threshold. The y-axis is final tie-adjusted win rate. Include a 95% simulation uncertainty band derived from per-game fractional win shares and mark the highest observed target as `Best fixed target`. The result must be reported as observed under this constrained tournament, not as a universal or game-theoretic optimum. The generator must not assume that 200 wins.

## Outputs

Create a dedicated generator script and these artifacts under `docs/design/artifacts/learn-plots/`:

- `all-strategies-convergence.csv`
- `all-strategies-convergence.svg`
- `all-strategies-convergence.png`
- `fixed-threshold-sweep.csv`
- `fixed-threshold-sweep.svg`
- `fixed-threshold-sweep.png`

The script prints the seed, game counts, appearance counts, and winning fixed threshold so the results can be audited from the terminal.

## Verification

- Unit tests verify balanced appearances, deterministic output, tie splitting, checkpoint calculations, the exact 20-policy field, and the exact 50–400 threshold grid.
- The existing Python test suite remains green.
- A reduced-size smoke mode generates both CSV and image formats during tests or CI.
- The full command is run once to produce the checked-in artifacts.
- Both PNGs are inspected for readable labels, axes, legends, and annotations at their exported dimensions.
