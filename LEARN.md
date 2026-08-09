# LEARN.md — outline for `learn/index.html`

This is the content plan for the Bank It learn page. Each section below lists
what to say, why it's true (which script/CSV/chart produced the evidence),
and the tone to hit. Write for a smart teenager: short sentences, concrete
numbers, no jargon left unexplained. Every section should make the reader
want to scroll to the next one — lead with a question or a surprising number,
then answer it.

The page currently (pre-rewrite) is 100% "Section 3" material (the State
Delta formula, calculator, sample games, benchmark table). That content
should be relocated, not rewritten from scratch — see Section 3 below.

---

## Section 1: Basic Observation

Big idea: before you can judge any strategy, you need a ceiling (how good
could you possibly do?) and a floor (what does the dumbest reasonable rule
get you?). Section 1 sets up both with the least amount of theory possible.

### 1.a The oracle chart — "how good is perfect?"

**What to cover:**
- Define the oracle: a player who is told the exact rolls in advance and
  banks at the single best possible moment each round. No one can play
  better than the oracle — it's the mathematical ceiling, not a strategy
  anyone can actually follow live (it cheats by seeing the future).
- Show the oracle's score distribution — most games land in a wide middle
  band, but the tail is huge because of the doubles-double-the-pot rule.
  That's the hook: "the same game can pay out 10x depending on when the
  dice cooperate."
- The point of showing this *first*: every strategy later in the page gets
  measured against how much of the oracle's score it captures. It's the
  yardstick for the rest of the page.

**Data source:**
- `plot_oracle_scores.py` (`--linear --rounds 1 --games 10000 --cutoff 0.95`)
- Charts: `docs/design/artifacts/oracle-score-distribution-1-round-linear-p95.png/.svg`
  (and the un-cutoff / 10-round variants alongside it in
  `docs/design/artifacts/`)
- Percentile tables: `oracle-score-percentiles-1-round.csv`,
  `oracle-score-percentiles-10-rounds.csv`

### 1.b Simple threshold vs. total score

**What to cover:**
- The simplest possible strategy: pick one number, bank whenever the pot
  hits it, never think about opponents. "What if you just picked 100? 150?
  200?"
- Plot average/median score against the threshold value — there's a
  sweet spot, not a straight line. Too low leaves money on the table; too
  high means you get crashed by a 7 too often. Let the reader see the curve
  bend.
- Land the takeaway: a single fixed number already gets you most of the way
  to good play, which sets up "so what's missing?" heading into Sections 2
  and 3.

**Data source:**
- `plot_strategy_scores.py --threshold-sweep`
- Chart: `docs/design/artifacts/learn-plots/solo-threshold-sweep-lines.png/.svg`
- Underlying sweep numbers: `docs/design/artifacts/fixed-threshold-sweep.csv`
- (Optional supporting visual: `solo-strategy-scores.png/.svg` and
  `solo-strategy-scores-table.csv` for the broader solo-strategy comparison,
  and `solo-strategy-scores-oracle-capture.png/.svg` for "% of the oracle's
  score captured" per strategy — a nice bridge back to 1.a's ceiling.)

---

## Section 2: Three AI solutions

Big idea: three different AI models (GPT-3.5, GPT-4o, GPT-5) were each asked
to independently derive a banking formula from the rules alone — no access
to the simulator, no iteration. Section 2 shows what they came up with and
how they actually performed once tested.

**What to cover:**
- Briefly show each formula in its own card (not the full derivation — a
  teen reader doesn't need the algebra, just the shape of the idea): what
  inputs each formula uses (pot, score gap, rounds left, opponents banked)
  and its one-line intuition.
- Be honest about spread in quality — this is the interesting part. One
  formula reasons cleverly about opponents banking early; another barely
  adjusts for the score gap. Naming *why* one does better than another
  (which inputs it uses, which it ignores) teaches the reader what actually
  matters in this game, priming them for Section 3's formula.
- Close with where each one actually lands in the full 20-strategy
  tournament/matrix (rank, not raw formula) — concrete number, not vibes.

**Data source:**
- Formulas verbatim: `solutions/40.md`, `solutions/gpt35.md`, `solutions/gpt5.md`
- Side-by-side notes: `solutions/COMPARISON.md`
- Head-to-head vs. State Delta specifically: `python3 bank_it.py --compare-solutions`
- Overall standing among all 20 strategies: `docs/design/artifacts/tournament-full.csv`
  and `docs/design/artifacts/matrix-full.csv` (rows/cols "Solution 4o",
  "Solution GPT-3.5", "Solution GPT-5")

---

## Section 3: The best solution

Big idea: this is the current page's entire content — the State Delta
formula, live calculator, sample games, and benchmark table — plus the two
simulation methods (tournament and matrix) that prove it's actually the
best, explained simply enough that "trust me, it's the best" becomes "here's
how we know."

**Move into this section, unchanged in substance:**
- The formula panel (`T₀ = 225 − 75σ − 25·𝟙[D=0] − ...`) and its legend —
  keep the plain-English restatement ("protect a lead, hold at a tie, chase
  a deficit") ahead of the math for the teen reader.
- The live decision calculator (interactive, unchanged).
- The three sample games (chasing the leader / protecting the lead / the
  only winning line).
- The results benchmark table (win % by table size).

**New material to add — explain the two simulation types in plain terms:**
- **Tournament**: "Throw State Delta into a mixed table with 3 random
  opponents, thousands of times — how often does it come out on top?" One
  row per strategy, sorted by win rate. This is the "does it work in a messy
  real game" test.
- **Matrix**: "Put State Delta in a 1-on-1 duel against every other
  strategy, one at a time — who wins more?" This isolates head-to-head
  dominance from 3rd/4th-opponent noise, and is the test that answers "yes,
  but does it actually beat the *specific* strategy I'm worried about?"
- Note honestly that a strategy can win the tournament (strong generalist)
  while losing some individual matrix duels — and that in the latest run,
  State Delta and Adaptive 150/200/300 lead both, which is *not* guaranteed
  in general — it's a finding, not a given.

**Data source:**
- `python3 bank_it.py` (tournament), `python3 bank_it.py --matrix`,
  `python3 bank_it.py --policy-table` (target table + benchmark win rates)
- Reference runs: `docs/design/artifacts/tournament-full.csv`,
  `docs/design/artifacts/matrix-full.csv`
- Narrative background: `LEARNINGS.md`, `README.md` ("Tournament vs.
  matrix — what they measure and cost")

---

## AI Prompt disclosures

Each of the four sub-sections (1.a, 1.b, 2, 3) gets a collapsed-by-default
"AI PROMPT" toggle showing the prompt that was used to produce that section's
analysis/script/chart. Collapsed so it doesn't clutter the main reading flow;
click to expand. Real prompts to be supplied later — ship with placeholder
text for now (clearly marked as a placeholder) so the page is structurally
complete.

## Nav / structure notes for the HTML rewrite

- Top nav should reflect the new section order: Basic Observation → AI
  Solutions → Best Solution (with the existing Formula/Calculator/Games/
  Results anchors nested under the last one).
- Keep one consistent "yardstick" visual thread: Section 1 introduces the
  oracle as 100%; Section 2 and 3 should each restate results as "% of
  oracle" or head-to-head win rate so the reader always has the same ruler
  in hand.
- Every section needs one hook line before any chart/table — a question or
  a surprising number — per the "interesting and enticing" requirement.
