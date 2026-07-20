# Bank It simulator progress

## Goal

Build a reproducible Python simulator for standard Bank / Bank It rules, compare
banking policies, and turn the results into practical strategy guidance.

## Implemented

- Standard two-dice rules: three safe rolls, safe 7 worth 70, danger-zone 7
  crashes unbanked players, danger doubles double the pot, and banked players sit
  out the round.
- Configurable games, rounds, players, repeats, and random seed.
- Balanced multiplayer tournaments with shuffled seats and rotating first rollers.
- Tie-adjusted win rate, outright win rate, and average-score terminal reports.
- Head-to-head matrix (`--matrix`) with row-versus-column win rates.
- Adaptive-policy sweep (`--adaptive-analysis`) across five leading thresholds
  and five trailing thresholds.
- State-dependent target tables and two-, four-, and six-player benchmarks
  (`--policy-table`).
- Self-contained interactive HTML explainer (`index.html`) with the unified
  equation, live decision calculator, sample games, and benchmark table.
- Literal implementations and controlled comparisons of the three formulas in
  `solutions/` (`--compare-solutions`).
- Eight deterministic tests covering rules and tournament behavior.

## Findings so far

1. In the original 14-strategy four-player tournament, fixed Pot 200 was the
   strongest tested policy at 42.56% across its balanced appearances.
2. In direct play, a tuned Pot 211 threshold beat known Pot 200 at about 62.8%.
   This is a specialized counter, not the best general group policy.
3. Score-aware play materially changed the group result. In a 16-strategy,
   364,000-game tournament, the earlier adaptive 150/200/225 policy won 49.68%
   of its appearances, versus 34.06% for fixed Pot 200.
4. A controlled 25-policy sweep compared every policy against the same balanced
   eight-strategy opponent field. Across 16,800 games per policy, fixed Pot 200
   won 30.45%, while the best tested adaptive setting won 48.65%.
5. The strongest region was a leading target around 125-150 and a trailing floor
   around 275-300. The difference between 275 and 300 was too small to treat as
   proof of an exact optimum.
6. After tuning the continuous delta formula, a 200-games-per-matchup benchmark
   produced these win rates against identical balanced opponent pools:
   - Fixed Pot 200: 54.66% / 30.82% / 19.24% at 2 / 4 / 6 players.
   - Adaptive 150/200/300: 65.28% / 48.63% / 40.56%.
   - State Delta: 63.56% / 49.08% / 40.41%.
   State Delta slightly led at four players, was effectively even with the bucket
   policy at six, and trailed it by 1.72 points head-to-head across the two-player
   benchmark field.
7. Three independently submitted formulas were tested without retuning. State
   Delta beat `40.md`, `gpt35.md`, and `gpt5.md` directly with 73.38%, 80.27%,
   and 64.16% tie-adjusted win share respectively. GPT-5 was the strongest
   submission and the only one with a dice-derived risk calculation.
8. In a separate 200,000-game showdown with all four formulas at the same table
   every game, tie-adjusted wins were State Delta 53.45%, GPT-5 31.83%, 4o
   12.88%, and GPT-3.5 1.84%.

## Current named policies

- `Fixed Pot 200`: always banks at 200.
- `Pot 211 Counter`: specialized response to a known Fixed Pot 200 opponent.
- `Adaptive 150/200/300`: banks at 150 while strictly leading, 200 while tied,
  and at least 300 while trailing, with extra pressure for score gap and timing.
- `State Delta`: begins from 150 while leading or 300 while trailing, then changes
  the target continuously using score gap per remaining round and player count.

## Interpretation and limitations

“Conservative” means banking at a lower threshold. For example, 150 is 25%
earlier than 200. “Aggressive” means requiring a larger pot; 300 is 50% above
the fixed baseline. Win rate depends on the opponent field and player count, so
head-to-head results are not interchangeable with group results. Current adaptive
policies still reduce game state to coarse leading/tied/trailing buckets.

## State Delta formula

The urgency term is `abs(delta) / rounds_left * sqrt(opponents / 3)`, normalized
to four players. While leading, the target is `150 - 0.25 * urgency`; while
trailing it is `300 + 0.50 * urgency`. Targets are rounded to five and normally
clamped to 100-400. A trailing player in the final round must target at least one
point more than the deficit. This is an empirically tuned heuristic, not a solved
game-theoretic optimum.

## Next investigation

Validate the continuous coefficients with larger samples and richer opponent
fields, consider score distribution/rank rather than only distance to the leader,
and investigate whether player-count-specific coefficients outperform the single
square-root scaling rule.
