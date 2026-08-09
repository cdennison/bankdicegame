# What Bank It Teaches

Bank It is a dice game you can explain in a minute. Underneath it is a genuinely
hard decision problem, and you can get to the hard part using nothing but a
random number generator and some counting.

This document is the tour. It goes in three stages, each one harder than the
last, and each one answering a question the previous stage could not.

1. **The oracle** — how high *could* you score if you could see the future?
2. **Rules that ignore everyone else** — how well can a simple rule do?
3. **Rules that watch the opponents** — what changes when winning matters more
   than scoring?

Everything below is reproducible. Every number comes from a script in this
repository, every chart is written from a CSV you can open yourself, and every
simulation is seeded, so running it again gives the same answer.

---

## The rules, briefly

Players share one pot.

- Two dice are rolled. Everyone still in the round shares whatever the pot holds.
- **First three rolls are safe.** The pot goes up by the dice total, except a 7,
  which is worth 70.
- **From the fourth roll on it gets dangerous.** A 7 ends the round and everyone
  still in loses the pot. Doubles *double* the pot. Anything else adds the total.
- At any point after the third roll you may **bank**: you take the pot's current
  value into your own score and sit out the rest of the round.

That is the whole game. The only decision you ever make is *when to bank*.

---

## Stage 1: The oracle

**Question: if you could see the dice in advance, what would you score?**

Start here, before any strategy, because it sets the ceiling. The oracle is not
a strategy — it is a cheat. It looks at the whole round, sees exactly which roll
will bust it, and banks on the roll before. No real player can do this. That is
the point: it tells you what the dice were *willing* to give.

Over 10,000 rounds:

| | Score |
|---|---|
| Median | 96 |
| Mean | 4,150 |
| P90 | 530 |
| P99 | 6,203 |

Stop and look at the median and the mean together. **The mean is forty times
the median.** That is not a mistake, and it is the first real lesson.

The reason is doubles. Doubles multiply the pot, and multiplying compounds. Most
rounds end quickly and are worth a hundred points or so. But every so often a
round strings four or five doubles together and is worth fifty thousand. Those
rare rounds are so enormous that they drag the *average* far above anything you
will actually see.

> **Lesson 1: When outcomes multiply, the average stops describing the typical
> case.** Ask for the median too. If someone quotes you only an average, ask what
> the distribution looks like.

This also explains a plotting decision you will see throughout. A histogram of
oracle scores drawn to full width is unreadable — one bar holds 73% of the
games and the rest of the chart is empty. The published chart clips the top 5%
of rounds and says so in the footnote. Clipping a tail is fine. Clipping it
*silently* is not, which is why the count of hidden games is printed on the
chart.

**Generate it yourself:**

```bash
python plot_oracle_scores.py --linear --rounds 1 --games 10000 --cutoff 0.95
```

Artifacts: `docs/design/artifacts/learn-plots/oracle-score-distribution-1-round-linear-p95.*`

---

## Stage 2: Rules that ignore everyone else

**Question: without seeing the future, how well can a simple rule do?**

Now play for real. A *strategy* here is a rule that looks at the current round
and answers one yes-or-no question: bank now? The twelve rules in this stage all
share a restriction — **they never look at the other players.** They see the
pot and how many dangerous rolls have passed, nothing else.

Two families:

- **Pot thresholds** — "bank when the pot reaches 60 / 80 / 100 / 125 / 150 / 200".
- **Roll counters** — "bank after 1 / 3 / 5 dangerous rolls", or Safe Exit, which
  banks the instant the three safe rolls are done.

Each rule plays the same 10,000 rounds, **on the same dice**. This matters more
than it sounds. Because every rule faces an identical sequence, differences
between them are real differences in the rule, not luck in the draw. It also
means the oracle's score for a round is a genuine upper bound on what any rule
could have taken from that same round.

### Result A: greed raises the average and destroys the typical round

| Rule | Mean | Median | Busts |
|---|---|---|---|
| Safe Exit | 52.5 | 26 | 0% |
| Pot 60 | 60.9 | 77 | 31% |
| Pot 100 | 66.7 | 0 | 52% |
| Pot 150 | 70.3 | 0 | 63% |
| Fixed Pot 200 | 72.9 | 0 | 73% |
| Pot 211 Counter | 73.1 | 0 | 75% |

Read the columns against each other. The mean climbs steadily as the rule gets
greedier — Pot 211 has the best average of the twelve. But its median is **zero**,
because it busts three rounds out of four. A rule with the highest average score
is, on a typical round, scoring nothing at all.

Both numbers are correct. They answer different questions. "What do I average
over many rounds?" and "what happens to me this round?" are not the same
question, and in this game they have opposite answers.

> **Lesson 2: A single summary number encodes a question. Change the question
> and the ranking can reverse.**

### Result B: the ranking flips again when you ask about *capture*

Since every rule and the oracle share the same dice, you can ask a third
question: **of the points that were actually available in this round, what
fraction did the rule take?** Average that ratio over all 10,000 rounds.

| Rule | Share of achievable score |
|---|---|
| Safe Exit | 50.7% |
| One More | 44.1% |
| Pot 60 | 40.0% |
| Pot 100 | 29.1% |
| Fixed Pot 200 | 17.0% |
| Pot 211 Counter | 15.9% |

This is the exact reverse of the mean ranking. Safe Exit — dead last by average
score — captures the largest share of what was available, because it always
takes *something*. The greedy rules capture least: on the three-quarters of
rounds where they bust, they capture zero.

So which rule is best? **The question is still incomplete.** Three reasonable
measures gave three different winners. What is missing is the goal. Bank It is
not scored on your average, your median, or your capture rate. It is scored on
whether you *beat the other players*. Until you say that out loud, "best" has no
meaning.

> **Lesson 3: You cannot optimize until you have written down what you are
> optimizing. Most disagreements about "the best strategy" are really
> disagreements about the objective.**

### A bug worth showing

The capture numbers were wrong the first time they were computed. Some rules
scored **over 100%** of the oracle — impossible, since the oracle takes the most
any player could have taken from that round.

The cause: the shared game engine draws a random starting player *before*
rolling any dice. That consumed a number from the generator, so seed 42 gave the
strategy a different sequence of dice than it gave the oracle. The two were
being compared on different rounds. The fix was to deal each round's dice once
and hand the same list to everybody.

The impossible number is what exposed it. A test now asserts that no strategy
can ever beat the oracle on the same dice, so the bug cannot come back quietly.

> **Lesson 4: Know what your numbers are *not allowed* to do, then check. A
> result that violates a rule of the problem is a bug you can catch; a result
> that is merely wrong may sit there for years.**

**Generate it yourself:**

```bash
python plot_strategy_scores.py --games 10000 --rounds 1
```

Artifacts: `docs/design/artifacts/learn-plots/solo-strategy-scores*.{csv,png,svg}`

---

## Stage 3: Rules that watch the opponents

**Question: what changes when the goal is to win, not to score?**

Stage 2 deliberately blindfolded every rule. Lift the blindfold and the problem
changes category. A player who can see the scoreboard can ask things a solo
player cannot:

- Am I ahead? If so, why take any risk at all?
- It is the last round and I am 200 behind. A safe 40 points loses the game.
  Does a 25% shot at 300 beat a certain loss?
- Everyone else has already banked. The pot is mine alone — does that change
  what it is worth to me?

That last one is the interesting one, and it is what makes Bank It a *game*
rather than a puzzle. When another player banks, they leave the round, but the
pot keeps growing for whoever remains. Your best move depends on their move,
and theirs depends on yours. There is no "correct" threshold in isolation — only
a threshold that is correct *against the rules the others are using*.

This is the step from **optimization** to **game theory**. The full field is 20
strategies: the 12 opponent-blind rules from Stage 2, five more hand-designed
rules that *do* watch the scoreboard (Protect Lead, Catch Up, Adaptive Rank,
Adaptive 150/200/300, State Delta), and three formulas transcribed literally
from AI-written solutions (`solutions/40.md`, `gpt35.md`, `gpt5.md`, labeled
"Solution 4o", "Solution GPT-3.5", "Solution GPT-5"). One rule from Stage 2 is
already a hint of what's coming here: **Pot 211 Counter** is a threshold tuned
specifically to beat an opponent playing Fixed Pot 200. Sitting alone, its 211
is nearly meaningless — its whole reason for existing only shows up once you
put it in a room with the rule it was built to beat.

### Two ways to ask "who's best," and they don't have to agree

- **Tournament** — play a real multiplayer table (`--players` seats), round-robin
  over every combination of the 20 strategies, `--repeats` shuffled replays of
  each combination. Report win %, outright win %, and average score per
  strategy. This is "in a mixed crowd, how often do you come out on top?"
- **Matrix** — play only 2-player duels, every pair against every other pair,
  thousands of games per pair. Report the row strategy's head-to-head win rate
  against the column strategy. This is "does A specifically beat B?", isolated
  from any 3rd or 4th opponent diluting the picture.

A strategy can top the tournament — a strong generalist in a crowd — while
losing individual matrix duels, or the reverse. The two measurements are not
expected to agree in general, because a mixed table and a duel are different
games.

### Result: at the top, they agree — and it holds at two table sizes

| Rank | 4-player tournament | Win % | 8-player tournament | Win % |
|---|---|---|---|---|
| 1 | State Delta | 48.46% | State Delta | 32.92% |
| 2 | Adaptive 150/200/300 | 48.21% | Adaptive 150/200/300 | 32.37% |
| 3 | Pot 211 Counter | 37.31% | Solution GPT-5 | 21.40% |
| 4 | Solution GPT-5 | 33.89% | Pot 211 Counter | 19.58% |
| 5 | Fixed Pot 200 | 33.69% | Five More | 17.89% |

State Delta and Adaptive 150/200/300 — the two rules that track the score gap
continuously and adjust for how many rounds and players remain — take #1 and
#2 in both a 4-player and an 8-player table. That agreement across table sizes
is a real finding, not a given: nothing forces the crowd winner at one table
size to stay the crowd winner at another. Raw win % isn't comparable across
the two columns above — "fair share" is 25% at 4 players and 12.5% at 8 — so
compare *rank* and *margin over the field*, not the percentage itself.

### What moves in the middle, and why

Holding the top and bottom fixed, changing the table from 4 to 8 players
reshuffles everyone in between:

| Strategy | 4p rank | 8p rank | Why |
|---|---|---|---|
| Solution GPT-5 | 4th | 3rd | Its formula explicitly divides pressure by player count — it degrades gracefully as the table grows. |
| Pot 211 Counter | 3rd | 4th | It's a threshold hand-tuned to beat one specific opponent (Fixed Pot 200). With 7 rivals instead of 3, that one matchup is a smaller share of every game, and its edge dilutes. |
| Three More | 13th | 8th | The biggest mover. With more players at the table, more of them bust before you do — a moderately patient roll-counter gets rewarded simply because there's more competition to fail first. |
| Pot 150 | 7th | 10th | A static mid-threshold gets crowded out: more players compete for the same pot, and a fixed number that doesn't adapt loses ground. |

The bottom of the field doesn't move at all: Safe Exit, Solution 4o, and
Solution GPT-3.5 hold the same relative order at both table sizes — being
too passive (Safe Exit) or ignoring the score gap almost entirely (the two
weaker AI formulas) is a flaw table size doesn't fix.

> **Lesson 5: Robustness across conditions is itself evidence.** A rule that
> keeps its rank when you change the number of players is telling you
> something about *why* it works, not just *that* it works. A rule that
> depends heavily on the field composition is not measuring the same thing
> when the field changes.

**Generate it yourself:**

```bash
python3 bank_it.py --seed 20260719 --csv-output docs/design/artifacts/tournament-full.csv
python3 bank_it.py --players 8 --repeats 20 --seed 20260719 --csv-output docs/design/artifacts/tournament-8p-full.csv
python3 bank_it.py --matrix --seed 20260719 --csv-output docs/design/artifacts/matrix-full.csv
```

The 8-player run uses `--repeats 20` instead of the default 200: `C(20, 8)`
matchups makes the full-precision run multi-hour, and 20 repeats/matchup was
enough for a stable ranking at this table size.

Artifacts (source of truth for every number above):
`docs/design/artifacts/tournament-full.csv`,
`docs/design/artifacts/tournament-8p-full.csv`,
`docs/design/artifacts/matrix-full.csv`.

---

## The through-line

Each stage is a better answer to "what should I do?", and each one got there by
fixing the question rather than by computing harder.

| Stage | Question | What it needs |
|---|---|---|
| 1. Oracle | What was possible? | Simulation, and the mean/median distinction |
| 2. Solo rules | What can a real rule get? | Paired comparison, and a chosen objective |
| 3. Opponent-aware | What wins? | Game theory, and statistics with error bars |

The habits that carry across all three:

- **Simulate when the math is hard.** Nobody solves the doubles-chain
  distribution by hand. Ten thousand seeded rounds answer it in seconds.
- **Seed everything.** A result you cannot reproduce is an anecdote.
- **Compare on identical inputs.** Same dice for every rule, or you are
  measuring luck.
- **Report the median next to the mean**, and say how many games you hid when
  you clipped a chart.
- **Write down the objective before declaring a winner.**

---

## Running everything

```bash
python -m venv .venv && .venv/bin/pip install -r requirements-plots.txt

.venv/bin/python plot_oracle_scores.py --linear --rounds 1 --games 10000 --cutoff 0.95
.venv/bin/python plot_strategy_scores.py --games 10000 --rounds 1
.venv/bin/python plot_bank_it.py

.venv/bin/python -m unittest discover -p 'test_*.py'
```

Charts and their source CSVs land in `docs/design/artifacts/learn-plots/`. Open
the CSVs. Every number in this document came out of one of them, and if you
disagree with a conclusion here, the data to argue with is right there.
