# Oracle Score Distribution Design

## Goal

Estimate and visualize the distribution and empirical percentiles of the
maximum achievable final score in solo one-round and ten-round Bank It games.
Report the probability that each oracle-optimal score is at least 1,000.

## Simulation definition

- Simulate 10,000 independent games for each round count using seeds 0 through
  9,999.
- Run one-round and ten-round variants that follow the tested Python dice
  rules.
- The first three rolls of each round are guaranteed safe; a total of seven
  adds 70 during those rolls.
- After the third roll, continue rolling until the first dangerous seven.
- Because the pot never decreases before a bust, the oracle-optimal action is
  to bank the pot immediately before that dangerous seven.
- Sum the oracle-optimal round pots to obtain the best possible final score
  for each one-round or ten-round game.
- There are no opponents and no strategy threshold.

## Outputs

Create reproducible PNG, SVG, and CSV artifacts under
`docs/design/artifacts/learn-plots/`.

Generate matching artifact sets for:

- ten-round games using 10,000 independent seeds from 0 through 9,999; and
- one-round games using the same 10,000 independent seeds.

Each game-length variant will have a distribution histogram and percentile
curve.

Each distribution plot will:

- show the distribution of the 10,000 oracle-optimal final scores;
- use a readable bucket width selected after inspecting the simulated range;
- use a disclosed symmetric-log score axis so the body and heavy doubled-pot
  tail remain readable;
- mark 1,000 with a vertical reference line;
- state the observed percentage of games scoring at least 1,000;
- disclose any scores placed in an overflow bucket to keep the main
  distribution readable; and
- state the seed count, seed range, and round count.

Each percentile plot will:

- plot empirical percentiles P1 through P99 on the x-axis;
- plot the corresponding oracle-optimal score on a logarithmic y-axis;
- mark a score of 1,000 with a horizontal reference line;
- annotate P50, P90, P95, and P99 with their exact sampled scores; and
- state the seed count, seed range, and round count.

The distribution CSVs will contain histogram bucket boundaries, counts, and
percentages, including any overflow bucket. The percentile CSVs will contain
one row per integer percentile from P1 through P99 and its interpolated score.

Keep the existing `oracle-score-distribution.*` names for the ten-round
histogram. Use explicit names for the additional outputs:

- `oracle-score-percentiles-10-rounds.*`
- `oracle-score-distribution-1-round.*`
- `oracle-score-percentiles-1-round.*`

## Verification

- Confirm exactly 10,000 scores are generated for each game length.
- Confirm each ten-round score is the sum of ten completed round maxima.
- Confirm each one-round score is one completed round maximum.
- Cross-check a small deterministic sample against an independently written
  reference simulation.
- Confirm each histogram's counts, including overflow, sum to 10,000.
- Confirm each percentile CSV contains exactly P1 through P99 in order.
- Run the repository's Python rule and plot tests.
- Inspect all four rendered PNGs for clipped data, overlapping labels, and
  legibility.
