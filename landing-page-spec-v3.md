# Bank It — Landing Page Design v3

Status: Redesigned around teen math engagement

## Primary mission

Bank It exists to overcome teen disinterest in math by making mathematical
thinking useful inside a game they want to win.

The landing page must not say, “Here is a lesson disguised as a game.” It should
make a stronger promise:

> Math gives you an edge. AI gives you an opponent. Bank It lets you test both.

The desired reaction is not merely “that game looks fun.” It is:

> “Wait—why did the AI do that, and can I figure out a better move?”

That question is the bridge from `/game` to `/learn`.

## Product positioning

For teens who think math feels abstract or irrelevant, Bank It is a live AI dice
game that turns probability into a competitive advantage. Unlike a traditional
lesson, every idea is introduced through a decision the player already cares
about making.

## Core message

> Crack the strategy. Beat the machine.

Supporting messages:

1. Every roll creates a real probability problem.
2. Different AI models can make different decisions from the same facts.
3. Understanding the math helps the player challenge the AI instead of merely watching it.
4. Simulations reveal which strategies survive beyond one lucky game.

## Audience rule

The primary reader is a teen, not an educator deciding what teens should like.

Use:

- Challenge, choice, rivalry, discovery, progress, and mastery
- Short explanations tied to an immediate game state
- Real numbers presented as clues
- AI as something to question, test, and sometimes beat

Avoid:

- “Students will learn…”
- Classroom, worksheet, report-card, or textbook imagery
- Promises that the experience is “educational” or “good for you”
- Childish illustration, rounded nursery-app styling, or forced slang
- Dense formulas without a game decision attached
- Claims that an AI is conscious, emotional, or always correct

## Brand voice

- Curious: always invites the next question
- Competitive: gives the visitor something to prove
- Clever: respects the audience and rewards attention
- Direct: explains ideas without academic padding
- Honest: describes AI decisions without pretending to reveal private chain-of-thought

Signature language:

- `CRACK THE STRATEGY`
- `YOUR MOVE`
- `READ THE RISK`
- `QUESTION THE AI`
- `RUN IT AGAIN`
- `STRATEGY UNLOCKED`

---

# Experience concept

## Arcade console with x-ray mode

The page behaves like a playable strategy board. At first glance it is a bold,
tactile game experience. As the visitor interacts, an “x-ray” layer reveals the
probability, score pressure, and AI decision factors underneath.

The game is the hook. The reveal is the reward. Learning is the act of uncovering
how the game works—not a separate lecture after the fun.

## Core visual device: Strategy Lens

Game elements have two layers:

- **Play layer:** dice, pot, score, BANK, ROLL AGAIN
- **Strategy layer:** bust chance, possible gain, score gap, rounds remaining,
  opponent risk profile

The Strategy Lens may appear as a toggle, scan line, card flip, or expanding
annotation. It should never obscure the immediate decision.

---

# Page architecture

1. Navigation
2. Hero: core challenge
3. Interactive decision: “What would you do?”
4. Manifesto beat: math is how you win
5. How Bank It works
6. AI comparison: same dice, different decisions
7. Crack the strategy: three ways to go deeper
8. Simulation proof
9. Choose `/game` or `/learn`
10. Footer

The first meaningful learning interaction must appear before the visitor reaches
the third section.

---

# 1. Navigation

Brand:

> BANK IT

Links:

- `HOW TO PLAY` → `#how-to-play`
- `THE AI` → `#ai-opponents`
- `CRACK THE STRATEGY` → `/learn`
- `PLAY NOW` → `/game`

Design:

- Custom die mark, never an emoji
- `CRACK THE STRATEGY` receives a small electric-blue underline or lens symbol
- `PLAY NOW` is the single filled navigation button
- Mobile menu retains visible labels and 44px minimum targets

---

# 2. Hero

Eyebrow:

> A DICE GAME. A LIVE AI. YOUR MOVE.

Headline:

> Crack the Strategy.<br>
> Beat the Machine.

Body:

> Bank It turns a push-your-luck dice game into a live battle of probability and
> AI. Make your call, see what the machine chooses, and uncover the math that can
> give you the edge.

Primary CTA:

> PLAY AGAINST THE AI

Routes to `/game`.

Secondary CTA:

> CRACK THE STRATEGY

Routes to `/learn`.

Microcopy:

> The rules take 30 seconds. Mastering the decision takes longer.

## Hero visual

The right side shows a frozen moment from a real-looking match:

- `ROUND 8 / 10`
- `YOU 620` versus `AI 590`
- Shared pot: `184`
- Two dice showing the last roll
- `BANK 184` and `ROLL AGAIN` controls
- AI status: `READING THE TABLE…`

The Strategy Lens briefly activates and annotates:

- `BUST CHANCE: 1 IN 6`
- `YOU'RE AHEAD: +30`
- `2 ROUNDS LEFT`

The AI makes a visible decision, but the page does not pretend to expose hidden
chain-of-thought. It reports decision factors and a concise summary only.

## Hero composition

- Bold asymmetric split: copy occupies roughly 42%, game state 58%
- Oversized pot number becomes the visual anchor
- One die may break the card boundary to add physical energy
- No generic robot, brain, circuit-board, or chatbot imagery
- On mobile, headline and both CTAs appear before the game state

---

# 3. Interactive decision

Section label:

> QUICK—WHAT WOULD YOU DO?

Heading:

> The pot is 184. One roll could change everything.

Visible state:

- You: `620`
- AI: `590`
- Round: `8 of 10`
- Pot: `184`
- Bust chance on the next danger roll: `1 in 6`

Choices:

> BANK 184

> ROLL AGAIN

The interaction works locally and does not require the future game backend.

## Reveal after the choice

Heading:

> You made the call. Now crack it.

Decision summary:

> You’re leading by 30 with two rounds left. Banking protects the lead. Rolling
> gives you a chance to pull away—but puts all 184 points at risk.

AI response example:

> THE AI BANKED. It valued protecting the lead more than chasing a bigger pot.

Strategy factors:

- `1 IN 6` — immediate bust chance
- `+30` — current score lead
- `2` — rounds remaining
- `184` — points at risk

Follow-up CTA:

> CRACK THIS DECISION →

Routes to a future relevant section on `/learn`; use `/learn` until anchors exist.

## Interaction principle

Do not label the choice right or wrong. One outcome does not prove a strategy.
The reveal should create curiosity about repeated play and simulation.

---

# 4. Manifesto beat

Full-width copy:

> Math isn’t the homework here.<br>
> **It’s how you win.**

Supporting line:

> Probability reads the risk. Strategy uses it. AI gives you someone to test it against.

Design:

- Warm, nearly white background interrupts the dark game surface
- Large dark display type
- “It’s how you win” receives an electric-blue hand-drawn underline
- Sparse annotation fragments such as `1/6`, `+184`, and `10 rounds` sit at the edges
- No CTA; this section is a confident pause

---

# 5. How Bank It works

Anchor: `#how-to-play`

Section label:

> EASY TO START. HARD TO SOLVE.

Heading:

> Three moves. One strategy problem.

## Step 1

Title:

> ROLL

Body:

> The shared pot grows with every safe roll. Doubles can send it soaring.

Strategy annotation:

> More points create more reward—and more to lose.

## Step 2

Title:

> READ THE RISK

Body:

> Watch the pot, the score, and the rounds remaining. The same roll can mean
> something different when you’re ahead or behind.

Strategy annotation:

> This is where probability becomes strategy.

## Step 3

Title:

> BANK OR PUSH

Body:

> Lock in the pot or risk it for another roll. Once the danger begins, a seven
> wipes out every player who has not banked.

Strategy annotation:

> There is no perfect move without context.

Closing line:

> The dice create the problem. You decide how to solve it.

## Visual treatment

- One connected path rather than three unrelated cards
- Physical dice and pot on the play layer
- Blue x-ray annotations on the strategy layer
- The path branches at BANK / PUSH and rejoins at the next round

---

# 6. AI comparison

Anchor: `#ai-opponents`

Section label:

> QUESTION THE AI

Heading:

> Same table. Same facts. Different calls.

Intro:

> Every opponent sees the same pot, scores, and rolls. Different models can still
> weigh the risk differently. That does not make one automatically right.

## Primary visual: decision comparison

Show one shared scenario above three model cards:

- Pot: `211`
- Player position: `TRAILING BY 85`
- Rounds remaining: `1`
- Bust chance: `1 IN 6`

Each configured model card shows:

- Actual public model or generation name
- Optional secondary persona name
- Decision: `BANK` or `ROLL AGAIN`
- Risk profile: conservative, balanced, or aggressive
- Three visible factors it used
- A short decision summary, not chain-of-thought

Example summary:

> ROLL AGAIN — Banking 211 still leaves this opponent behind, so it accepts more risk.

Section CTA:

> SEE WHY THE MODELS DISAGREE →

Routes to `/learn`.

## Roster rule

- Real model identity is prominent; personas are secondary
- The roster must come from the future game configuration
- Do not use permanent “earliest” or “latest” claims
- Never promise a live model that `/game` cannot actually use

---

# 7. Crack the strategy

Section label:

> GO BEHIND THE GAME

Heading:

> Three ways to crack it.

Intro:

> You do not need to memorize a formula. Start with a move you want to understand.

## Path 1

Badge:

> PROBABILITY

Title:

> Read the odds

Body:

> Find out what “one in six” really means when 184 points are on the line.

Teaser interaction:

> Run the same roll 36 times

## Path 2

Badge:

> ARTIFICIAL INTELLIGENCE

Title:

> Question the machine

Body:

> Compare model decisions, inspect the factors they used, and find the situations
> where stronger models still make weak calls.

Teaser interaction:

> Compare three AI calls

## Path 3

Badge:

> SIMULATION + CODE

Title:

> Test the strategy

Body:

> One lucky game proves nothing. Run thousands and see which ideas keep winning.

Teaser interaction:

> Simulate 10,000 games

Section CTA:

> CRACK THE STRATEGY

Routes to `/learn`.

---

# 8. Simulation proof

Section label:

> LUCK GETS ONE GAME. STRATEGY GETS 200,000.

Heading:

> We tested the machines.

Body:

> The strategy work behind Bank It compares AI-generated formulas and human-built
> policies across hundreds of thousands of simulated games. The point is not to
> trust the smartest-sounding answer. It is to test what actually works.

## Result board

Use the existing reproducible four-way result as a teaser:

- `STATE DELTA` — `53.45%`
- `GPT-5 STRATEGY` — `31.83%`
- `GPT-4o STRATEGY` — `12.88%`
- `GPT-3.5 STRATEGY` — `1.84%`

Label clearly:

> Tie-adjusted wins in one 200,000-game four-strategy simulation.

Supporting line:

> A newer model can produce a stronger strategy. It can still lose to a better-tested idea.

CTA:

> SEE THE EXPERIMENT →

Routes to `/learn`.

## Data rule

This result is evidence from the existing simulator, not a claim about every
possible game or live model. Keep the methodology qualifier visible.

---

# 9. Final choice

Heading:

> Your next move?

Both cards have equal area and visual weight. The play card is kinetic and coral;
the strategy card is investigative and electric blue.

## Game path

Label:

> TEST YOUR INSTINCTS

Title:

> Play Bank It

Body:

> Choose a live AI opponent, make the calls, and see whether your strategy holds up.

Button:

> CHALLENGE THE AI

Routes to `/game`.

## Learn path

Label:

> GET THE EDGE

Title:

> Crack the strategy

Body:

> Use probability, compare AI decisions, and test the ideas hiding underneath every roll.

Button:

> CRACK THE STRATEGY

Routes to `/learn`.

---

# 10. Footer

Closing line:

> Read the risk. Question the AI. Crack the strategy.

Links:

- Play → `/game`
- Crack the strategy → `/learn`
- How to play → `#how-to-play`
- AI opponents → `#ai-opponents`

Omit legal links until real destinations exist.

---

# Visual identity

## Art direction: Strategy Arcade

The visual system combines a modern arcade cabinet, a tabletop scorecard, and an
interactive data annotation layer. It is energetic without becoming casino-like,
technical without becoming corporate, and approachable without becoming childish.

## Color system

Primary surfaces:

- `--ink-950: #0A1020` — dark game-table surface
- `--ink-850: #151D32` — raised game panels
- `--paper-050: #FFF8E8` — warm strategy/reveal sections
- `--paper-100: #F5EDD9` — secondary light surface

Signals:

- `--risk-coral: #FF5C45` — action, danger, roll/push
- `--logic-blue: #526DFF` — strategy lens, learning, AI factors
- `--score-yellow: #FFD84D` — scores, probabilities, unlocked clues
- `--proof-mint: #35D6A0` — verified result, banked state

Text:

- `--text-on-dark: #FFF9ED`
- `--text-muted-dark: #B8C0D4`
- `--text-on-light: #10172A`
- `--text-muted-light: #4E5870`

Rules:

- Coral is the play/risk channel
- Blue is the strategy/AI-learning channel
- Yellow highlights numbers worth noticing
- Mint confirms outcomes; it does not compete with the main CTAs
- Color never communicates a state without text, shape, or icon support

## Typography

Recommended direction:

- Display: `Bricolage Grotesque` or similarly characterful grotesque
- Body: `Atkinson Hyperlegible`
- Data: `IBM Plex Mono`

Treatment:

- Large, tightly composed display headlines
- Friendly body copy with generous line height
- Monospaced scores, probabilities, model names, and badges
- Selective uppercase for commands, never for full paragraphs
- Mathematical notation is large and visual, not typeset like a textbook

Avoid bubbly children’s fonts, faux-futuristic techno fonts, and condensed esports
type for body content.

## Graphic language

- Chunky dice with imperfect physical edges
- Scoreboard digits and tabular numbers
- Blue strategy annotations resembling coach’s marks, not school notes
- Branching decision lines
- “Strategy unlocked” stamps
- Small fractions, arrows, and score deltas used as clues
- Subtle grain on large surfaces only

No robot heads, glowing brains, stock student photography, chalkboards, notebooks,
coins, banks, poker chips, or casino tables.

## Layout

- Bold asymmetric compositions rather than a repeated centered-card pattern
- Bento-style groupings only when they express a real relationship
- Sections alternate play layer, reveal layer, and proof layer
- Maximum content width around 1200px
- Text measure 60–75 characters on desktop and 35–60 on mobile
- Spacing follows an 8px base scale with intentionally large section gaps

## Shape and depth

- Cards: 18–26px radius
- Buttons: 12–16px radius with short physical shadows
- Strategy annotations: square or clipped corners to distinguish them from game controls
- Borders: 1–2px with clearly defined hover and focus states
- Avoid translucent glass cards and decorative glow

---

# Motion and interaction

- Hero dice settle once; they do not roll forever
- Strategy Lens annotations draw in after the game state is readable
- Buttons depress 2–3px and rebound in 150–220ms
- The quick-decision reveal responds immediately to keyboard, pointer, or touch
- Model decisions crossfade; no simulated typing delay longer than 300ms
- Simulation numbers may count once when visible, but final values remain available immediately
- Motion uses transform and opacity only where possible
- No animation delays navigation
- `prefers-reduced-motion` shows all final states without decorative transitions

The page should reward interaction, not require it. Every essential idea remains
understandable without hover or animation.

---

# Responsive and accessibility requirements

- Test at 375px, 768px, 1024px, and 1440px
- Minimum 44×44px interactive targets
- Support keyboard operation for the quick-decision challenge
- Visible 2–4px focus indicators
- Sequential heading hierarchy and semantic landmarks
- Skip link to main content
- WCAG AA contrast for text and controls
- Never disable zoom
- No horizontal carousel required to understand the AI comparison
- At 200% zoom, navigation and decision controls remain usable
- Decorative SVGs are hidden from assistive technology; meaningful ones are labeled
- Result charts include equivalent text values and methodology context

---

# SEO and social copy

Title:

> Bank It — Crack the Strategy. Beat the AI.

Description:

> Challenge a live AI in Bank It, a push-your-luck dice game where probability
> gives you the edge. Play the game, question the machine, and crack the strategy.

Social headline:

> Math isn’t the homework here. It’s how you win.

Social description:

> One pot. One decision. A live AI across the table. Can you crack the strategy?

---

# First landing-page build boundary

Build now:

- Complete responsive landing page
- Local “What would you do?” interaction and reveal
- Strategy Lens visual treatment
- Real `/game` and `/learn` links
- Anchor navigation
- Static or locally animated AI comparison
- Existing simulation proof with methodology label
- Accessible motion, focus, and responsive behavior
- SEO and social metadata

Do not build yet:

- Live AI calls
- Full game engine
- Authentication
- `/learn` curriculum
- Model roster claims not supported by the future `/game` configuration

The first build may route to unfinished `/game` and `/learn` paths, but those URLs
should be used from the beginning.

---

# Final design test

Before approving the landing page, ask:

1. Does the first screen look like a game teens would choose to try?
2. Does the first interaction make the visitor curious about why a move works?
3. Is math presented as useful power rather than assigned work?
4. Is AI something the visitor can question and test rather than simply admire?
5. Does “Crack the Strategy” feel as exciting as “Play Now”?

If any answer is no, the mission is not yet visible enough.
