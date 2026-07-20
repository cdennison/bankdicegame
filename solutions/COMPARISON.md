# Submitted formula comparison

## Method

The three formulas in this directory were translated literally into Python
banking policies. No coefficient was tuned and no strategic override was added.
All games used the simulator's standard 10-round rules, shuffled seats, and
tie-adjusted wins.

Two comparisons were run with seed `20260719`:

1. **Balanced benchmark:** each candidate faced every valid opponent combination
   from the same eight-policy pool: Pot 80, Pot 100, Pot 125, Pot 150, Pot 211
   Counter, Five More, Double Hunter, and Adaptive Rank. Each combination was
   repeated 200 times.
2. **Direct comparison:** each submitted policy played 20,000 two-player games
   against State Delta.
3. **Exact four-way showdown:** all four formulas occupied the same table in
   200,000 four-player games. Seats were shuffled before every game.

The balanced benchmark contains 1,600 games per policy at two players and 11,200
games per policy at four and six players. Because the fields are identical, the
rows are directly comparable; they do not need to sum to 100%.

## Extracted formulas

### `40.md`

\[
T=\frac{P}{7}+10\max(0,-D)F+\frac{5}{R}\left(1-\frac{B}{N}\right)
\]

### `gpt35.md`

\[
T=\frac{140}{R+1}(1+e^{-0.1D})\frac{N-B}{N}(1+0.5F)
\]

### `gpt5.md`

\[
\lambda=\operatorname{clip}\left(
\lambda_0\sqrt{\frac{R}{5.5}}\sqrt{\frac{2}{N}}
e^{D/(100R)}e^{-B/[2(N-1)]}e^{F(D/50-0.7)},
0.0002,0.02\right)
\]

\[
T=\sqrt{\max\left(0,\frac{28}{\lambda}-\frac{133}{3}\right)},
\qquad
\lambda_0=\frac{28}{100^2+133/3}
\]

Every policy uses the submitted decision rule: bank when `P >= T`.

## Results

### Balanced benchmark win rates

| Policy | 2 players | 4 players | 6 players |
|---|---:|---:|---:|
| **State Delta** | **61.78%** | **48.97%** | **40.51%** |
| `40.md` | 24.41% | 9.85% | 6.35% |
| `gpt35.md` | 15.22% | 3.89% | 2.34% |
| `gpt5.md` | 49.31% | 30.45% | 24.26% |

### Directly against State Delta

| Submitted policy | Submitted win share | State Delta win share |
|---|---:|---:|
| `40.md` | 26.62% | **73.38%** |
| `gpt35.md` | 19.73% | **80.27%** |
| `gpt5.md` | 35.84% | **64.16%** |

### All four formulas in every game

| Policy | Tie-adjusted win rate | Outright win rate | Average score |
|---|---:|---:|---:|
| **State Delta** | **53.45%** | **52.97%** | **731.1** |
| `gpt5.md` | 31.83% | 31.35% | 706.9 |
| `40.md` | 12.88% | 12.88% | 547.5 |
| `gpt35.md` | 1.84% | 1.84% | 115.2 |

These tie-adjusted rates sum to exactly 100%. With 200,000 games, the approximate
95% sampling margin is at most about ±0.22 percentage points for an individual
rate near 50%.

With 20,000 direct games, a win share near 50% has an approximate 95% sampling
margin of ±0.7 percentage points. The direct differences are much larger than
simulation noise.

## Why the formulas behaved differently

### `40.md`: effectively banks immediately

Outside a final-round deficit, its rule can be rearranged as:

\[
P\ge\frac{P}{7}+A
\quad\Longleftrightarrow\quad
P\ge\frac{7A}{6},
\qquad A\le\frac{5}{R}.
\]

The effective threshold is therefore at most about 5.83 points. Since the three
safe rolls produce at least 6 points, this policy almost always banks as soon as
the safe phase ends. In the final round while trailing, the `10 × deficit` term
swings to the other extreme and usually creates an unreachable target.

Several worked values in `40.md` do not match its written formula. The simulator
uses the formula itself, not the inconsistent example table.

### `gpt35.md`: score sensitivity is far too large

The term `exp(-0.1D)` changes by a factor of `e` for every 10-point score change.
A 100-point deficit multiplies the exponential component by about 22,026; a
500-point deficit produces `exp(50)`, about `5.18 × 10^21`. Ordinary deficits
therefore make the policy wait for effectively impossible pots.

When tied early, the opposite problem occurs. In round 1 (`R=10`) its four-player
threshold is only about 25.5, so it banks much too early. Also, dividing by
`R + 1` makes the threshold rise as the game gets later, contradicting the file's
claim that the term encourages earlier banking as rounds run out.

The first worked example in `gpt35.md` contains a factor-of-ten arithmetic error:
`12.7 × 1.135` is about 14.4, not 144. The simulator again follows the formula.

### `gpt5.md`: coherent dice math, conservative calibration

This is the strongest submitted answer. Its derivation of the one-more-roll mean
and variance gives the policy a defensible mathematical core. It also responds
smoothly to score, time, field size, and banked opponents.

Its main weakness is calibration. The neutral threshold is explicitly centered
at 100, while the earlier tournament search found useful neutral behavior much
closer to 200. Its risk parameter is clipped, limiting the threshold to about
374. In a final-round deficit larger than that, it can bank a pot that cannot
mathematically take the lead. The file discusses a guarantee-win override, but
that override is not part of its main formula and was therefore not added.

## Conclusion

`gpt5.md` supplied the best analytical derivation of the three submissions, but
State Delta supplied the best empirical policy. The gap comes primarily from
calibration and endgame behavior rather than from the dice-risk calculation
itself. A promising future hybrid would retain GPT-5's derived one-roll variance
model while calibrating its neutral risk parameter and endgame guard to the
observed multiplayer results.

## Reproduce

```bash
python3 bank_it.py --compare-solutions
```
