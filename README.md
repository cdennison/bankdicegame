# Bank It strategy simulator

Open `learn/index.html` for an interactive visual explanation of the State Delta
formula, a live banking-target calculator, sample games, and benchmark results.

Open `index.html` for the Bank It landing page. It routes players to `/game`
and curious visitors to the educational material under `/learn`.

## Run the web app locally

Install the JavaScript dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open the printed local URL at `/game/` to play. The landing page is at `/`, and
the strategy explainer is at `/learn/`.

Use these commands for local verification:

```bash
npm test
npm run test:e2e
npm run build
```

## Deploying

The web app (landing page, `/game`, `/rules`, `/learn`) is deployed to Vercel
under the project `bankdicegame` (linked locally via `.vercel/project.json`),
live at https://www.bankdicegame.org. Deploys ship whatever is on disk in the
working directory, not what's committed to git — commit or stash first if you
only want tracked changes to go out.

```bash
vercel                # preview deploy — new URL, does not touch production
vercel --prod --yes   # production deploy — ships straight to the live domain
```

`vercel --prod` runs `npm run build` remotely (via `vite build`) and aliases
the result to `www.bankdicegame.org`. Requires the Vercel CLI (`npm i -g
vercel`) and being logged into the account that owns the `bankdicegame`
project.

`BK1` challenge codes reproduce the first roller and every dice pair in a match.
An exact replay also requires the same opponent lineup in the same order and the
same human decisions. The code alone does not record those choices.

This is a dependency-free Monte Carlo simulator for the shared-pot dice game
**Bank** / **Bank It**. It compares 17 banking strategies in balanced matchups
and prints an easy-to-read terminal ranking.

## Rules modeled

- Two fair six-sided dice and a shared pot.
- The first three rolls are safe. A 7 adds 70; every other roll adds its sum.
- Starting with roll four, a 7 ends the round and unbanked players score zero.
- Starting with roll four, doubles double the entire pot; other rolls add their sum.
- After any completed roll (and after all three safe rolls), any player may bank the
  current pot, add it to their score, and sit out the rest of that round.
- A round ends on a danger-zone 7 or when everybody has banked.
- The highest total after 10 rounds wins.

The default tournament plays every unique four-strategy matchup 200 times. Seats
are shuffled and the first roller rotates between rounds. A tied win is divided
equally among the tied strategies for the primary `Win %` metric.

## Strategy research basis

The policy set deliberately tests the two ideas most often suggested for this
game: a fixed pot threshold and decisions that react to the opponents' scores.
The [BoardGameGeek rules](https://boardgamegeek.com/wiki/page/thing%3A412804),
[Bank Game rules](https://www.bankgame.app/), and
[Steam description](https://store.steampowered.com/app/3439050/Bank_It/) agree on
the core mechanics above. A recent game-theory discussion specifically proposes
threshold strategies and protecting a lead by banking with the second-place
player; published app guidance likewise recommends watching opponents' scores.

This simulator therefore includes seven fixed thresholds, three roll-count
thresholds, a double-seeking policy, and four score-aware policies, plus the
safe baseline. One threshold (`Pot 211 Counter`) was added after a focused sweep
against `Fixed Pot 200`. `Adaptive 150/200/300` banks at 150 while strictly
leading, 200 while tied, and at least 300 while trailing, with further score-gap
pressure. These are plausible policy families to compare, not a claim that each
heuristic is mathematically optimal.

## Run it

```bash
python3 bank_it.py
```

For a quicker run or a different experiment:

```bash
python3 bank_it.py --repeats 20 --players 4 --rounds 10 --seed 123
python3 bank_it.py --matrix
python3 bank_it.py --adaptive-analysis
python3 bank_it.py --policy-table
python3 bank_it.py --compare-solutions
python3 -m unittest -v
```

Use `python3 bank_it.py --help` for every option. Strategies are ordinary Python
callables, so new policies can be added in `strategies()`.

Matrix mode plays every possible pair as a two-player game and prints the row
strategy's win percentage against the column strategy. It also ranks the five
best counters to `Fixed Pot 200`; select another opponent with, for example,
`--target "Adaptive Rank"`. Increase `--matrix-games` for a more precise result.

Adaptive-analysis mode compares fixed Pot 200 against 25 policies formed from
five lead targets and five trailing targets. Every policy faces the same balanced
combinations from an eight-strategy opponent pool. The tie target remains 200;
a lower lead target quantifies more conservative play, while a higher trailing
floor quantifies more aggressive play.

Policy-table mode prints recommended banking targets for score deltas from -500
to +500 at several rounds in two-, four-, and six-player games. It also compares
Fixed Pot 200, Adaptive 150/200/300, and the continuous State Delta policy
against identical balanced opponent pools at each table size.

## Python analysis scripts

Two independent tools simulate the dice game and compare banking strategies. See
`LEARNINGS.md` for the full narrative write-up; this is the quick reference for
what each script/mode does and where the strategies come from.

### Where strategies come from (`bank_it.py`)

- `strategies()` — 17 hand-designed policies: fixed pot thresholds (Pot 60/80/
  100/125/150, Fixed Pot 200), a tuned counter (Pot 211 Counter, built to beat
  Fixed Pot 200), danger-roll counters (One/Three/Five More, Safe Exit), and
  opponent-aware rules (Protect Lead, Catch Up, Adaptive Rank, Adaptive
  150/200/300, State Delta — the strongest discovered policy).
- `submitted_strategies()` — 3 formulas transcribed literally from AI-written
  solution files in `solutions/` (`40.md`, `gpt35.md`, `gpt5.md`), exposed as
  "Solution 4o", "Solution GPT-3.5", "Solution GPT-5".
- `full_field()` = `strategies() + submitted_strategies()` — the combined
  20-strategy field used by the default tournament and `--matrix` mode, so the
  AI-submitted formulas compete head-to-head against every hand-designed rule
  including State Delta.

`plot_strategy_scores.py`'s `SOLO_STRATEGIES` is a separate, smaller subset (10
policies) restricted to rules that never look at opponents — it excludes
State Delta, Protect Lead, Catch Up, Adaptive Rank, and the AI submissions,
because those need real opponent state that solo play can't provide.

### `bank_it.py` — multiplayer tournament simulator

```bash
python3 bank_it.py                          # tournament: win %, outright win %, avg score
python3 bank_it.py --matrix                 # 20x20 pairwise head-to-head win-rate matrix
python3 bank_it.py --matrix --target "State Delta"   # best counters against a given strategy
python3 bank_it.py --adaptive-analysis      # grid-search lead/trailing targets for Adaptive 200
python3 bank_it.py --policy-table           # State Delta's target table + benchmark win rates
python3 bank_it.py --compare-solutions      # AI-submitted formulas vs. State Delta specifically
```

Key knobs: `--players`, `--rounds`, `--repeats`/`--matrix-games`, `--seed`.
`--adaptive-analysis`, `--policy-table`, and `--compare-solutions` operate on
the 17-strategy `strategies()` field only (they reference a fixed named
opponent pool); the default tournament and `--matrix` use the full 20.

Both modes also take `--csv-output <path>`, which writes the results table
to CSV in addition to the terminal printout — use this instead of scraping
the terminal. Tournament CSV columns: `rank, strategy, win_pct, outright_pct,
avg_score`. Matrix CSV: one row per strategy, one column per opponent
strategy, cell = row strategy's win rate against that column (diagonal is
0.5). Reference runs are checked into `docs/design/artifacts/`:
`tournament-full.csv`, `matrix-full.csv`.

```bash
python3 bank_it.py --seed 20260719 --csv-output docs/design/artifacts/tournament-full.csv
python3 bank_it.py --matrix --seed 20260719 --csv-output docs/design/artifacts/matrix-full.csv
```

#### Tournament vs. matrix — what they measure and cost

Both draw from `full_field()` (20 strategies) and share the same `play_game`
engine, but they answer different questions:

- **Tournament** (default, no flags) plays real `--players`-seat games
  (default 4) over every combination of the 20 strategies (`groups_balanced`),
  `--repeats` times each with shuffled seats (default 200). Output: one row
  per strategy — win %, outright win %, avg score — sorted by win rate. This
  answers "in a mixed table of opponents, how often does this strategy come
  out on top?" **Measured full-size run time (defaults: 20 strategies, 4
  players, 10 rounds, 200 repeats/matchup, on this machine): 7m35s.** Runtime
  scales with `C(20, players) * repeats`, so raising `--players` gets
  expensive fast.
- **Matrix** (`--matrix`) plays only 2-player duels, every pair of the 20
  strategies, `--matrix-games` times each (default 5000). Output: a 20x20
  table where cell `[row][col]` is the row strategy's win rate against the
  column strategy, plus a "best counters against `--target`" list. This
  answers "head-to-head, does A beat B?", isolating pairwise dominance from
  any 3rd/4th-opponent noise. **Measured full-size run time (defaults:
  `C(20, 2) = 190` pairs × 5000 games each, on this machine): 4m55s.**

Latest full-size results (seed 20260719): tournament and matrix agree that
State Delta and Adaptive 150/200/300 are the top two by win rate, with
Pot 211 Counter third; Solution GPT-5 lands mid-pack (~4th–5th) while
Solution 4o and Solution GPT-3.5 finish near the bottom on both measures.

A strategy can top the tournament (strong generalist in a crowd) while
losing several individual matchups in the matrix, or vice versa — the two
runs are not expected to agree in general, since a mixed table and a duel are
different games; it just happens that the leaders agree in this run.

### `plot_strategy_scores.py` — solo score-distribution charts

Plays the opponent-blind subset alone against a shared per-seed oracle
(perfect-hindsight banking), producing a CSV + three charts: median/mean dot
chart, oracle-capture bar chart, per-strategy histogram grid.

```bash
python3 plot_strategy_scores.py --games 10000 --rounds 1
python3 plot_strategy_scores.py --threshold-sweep   # sweep Pot N thresholds, plot vs. metrics
```

### `plot_oracle_scores.py` — oracle-only distribution

Perfect-hindsight score distribution with no strategy involved, establishing
the ceiling every rule is measured against.

```bash
python3 plot_oracle_scores.py --linear --rounds 1 --games 10000 --cutoff 0.95
```
