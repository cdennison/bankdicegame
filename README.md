# Bank It strategy simulator

Open `learn/index.html` for an interactive visual explanation of the State Delta
formula, a live banking-target calculator, sample games, and benchmark results.

Open `index.html` for the Bank It landing page. It routes players to `/game`
and curious visitors to the educational material under `/learn`.

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
