# Oracle Score Distribution Design

## Goal

Estimate and visualize the distribution of the maximum achievable final score
in a solo ten-round Bank It game. Report the probability that this
oracle-optimal score is at least 1,000.

## Simulation definition

- Simulate 100,000 independent games using seeds 0 through 99,999.
- Each game contains ten rounds and follows the tested Python dice rules.
- The first three rolls of each round are guaranteed safe; a total of seven
  adds 70 during those rolls.
- After the third roll, continue rolling until the first dangerous seven.
- Because the pot never decreases before a bust, the oracle-optimal action is
  to bank the pot immediately before that dangerous seven.
- Sum the ten oracle-optimal round pots to obtain the best possible final score
  for one game.
- There are no opponents and no strategy threshold.

## Outputs

Create reproducible PNG, SVG, and CSV artifacts under
`docs/design/artifacts/learn-plots/`.

The plot will:

- show the distribution of the 100,000 oracle-optimal final scores;
- use a readable bucket width selected after inspecting the simulated range;
- mark 1,000 with a vertical reference line;
- state the observed percentage of games scoring at least 1,000;
- disclose any scores placed in an overflow bucket to keep the main
  distribution readable; and
- state the seed count and ten-round game definition.

The CSV will contain the histogram bucket boundaries, counts, and percentages,
including any overflow bucket.

## Verification

- Confirm exactly 100,000 scores are generated.
- Confirm each score is the sum of ten completed round maxima.
- Cross-check a small deterministic sample against an independently written
  reference simulation.
- Confirm histogram counts, including overflow, sum to 100,000.
- Run the repository's Python rule and plot tests.
- Inspect the rendered PNG for clipped data, overlapping labels, and legibility.
