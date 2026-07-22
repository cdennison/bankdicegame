# Bank It Landing Page Design Spec

**Status:** Historical design baseline captured before the next redesign  
**Captured:** 2026-07-21  
**As-built source:** `index.html`, `styles.css`, and `script.js`  
**Prior design source:** `landing-page-spec-v3.md`

This document consolidates the landing-page decisions made through the original brief, two design revisions, implementation, and later product conversations. It preserves what the current page was designed to accomplish. It is not automatic approval to carry every current claim or visual choice into the next design.

## Product truth at capture time

The current landing page was written around a future **live AI** game. Product implementation subsequently moved toward a deterministic first release with fictional opponents—Mira, Knox, and Vega—whose strategies are implemented locally. The React game work exists on `feat/react-game` at the time of capture and is not yet merged into `main`.

Therefore:

- “Live AI” language is part of the historical landing concept.
- Claims that the player is facing GPT-3.5 or GPT-5 directly do not describe the deterministic v1 game.
- The simulation results remain valid research evidence when accompanied by their methodology qualifier.
- The next redesign must choose whether it markets the deterministic v1 honestly, previews the later live-AI vision explicitly, or separates those two ideas.

## Decision history and source priority

1. `docs/design/landing/archive/landing-page-first-draft.md` is the verbatim original brief. It introduced a teen audience, AI rivalry, learning value, and equal `/game` and `/learn` paths. Its model claims and fixed copy were superseded.
2. `landing-page-spec-v2.md` reframed the product as a real game, added a plausible game-state hero, and made all model claims conditional on the actual roster. It is explicitly superseded.
3. `landing-page-spec-v3.md` is the direct design source for the implemented landing page. It centered the mission on teen math engagement and established “Crack the strategy.”
4. `index.html`, `styles.css`, and `script.js` are the authoritative record of what was actually built.
5. `docs/superpowers/specs/2026-07-20-bank-it-react-game-design.md` is the source of truth for the deterministic v1 game, including future support for two to eight seats and multiple local humans.

When sources conflict, preserve the underlying mission but prefer current product truth over obsolete implementation copy.

## Primary mission

Bank It exists to overcome teen disinterest in math by making mathematical thinking useful inside a game they want to win.

The landing page should not feel like a lesson disguised as entertainment. Its central promise is:

> Math gives you an edge. AI gives you an opponent. Bank It lets you test both.

The intended reaction is:

> “Wait—why did the opponent do that, and can I figure out a better move?”

That question connects the immediate appeal of `/game` to the deeper material at `/learn`.

## Audience

### Primary

Teens aged 13–18 who consider math abstract, irrelevant, or assigned rather than useful.

### Secondary

Educators, parents, developers, and curious adults may recognize the educational value, but the page must speak to the teen player rather than to an adult choosing content for them.

### Desired response

1. “This looks like a real game.”
2. “I want to see if my decision beats the opponent’s.”
3. “The math might actually help me win.”
4. “I want to understand or test the strategy.”

## Positioning

For teens who think math feels detached from anything they care about, Bank It is a push-your-luck dice game that turns probability into a competitive advantage. Every mathematical idea begins with a decision the player already wants to make.

## Message architecture

### Primary message

> Crack the strategy. Beat the machine.

### Supporting messages

1. Every roll creates a probability problem with real consequences inside the game.
2. Two opponents can see the same facts and still make different calls.
3. Understanding the risk helps the player challenge a strategy instead of merely watching it.
4. One lucky match proves little; simulations reveal which ideas keep working.
5. Visitors can play at `/game` or investigate the system at `/learn`.

### Signature language

- `CRACK THE STRATEGY`
- `YOUR MOVE`
- `READ THE RISK`
- `QUESTION THE AI`
- `RUN IT AGAIN`
- `STRATEGY UNLOCKED`

### Voice

- Curious: invites the next question.
- Competitive: gives the visitor something to prove.
- Clever: respects attention and intelligence.
- Direct: removes academic padding.
- Honest: explains observable decisions and factors without pretending to expose private chain-of-thought.

### Language to avoid

- “Students will learn…”
- Classroom, worksheet, report-card, or textbook framing.
- Claims that the experience is worthy merely because it is educational.
- Forced slang, childish copy, or condescension.
- Casino language such as bet, jackpot, wager, or gambling wins.
- Fintech or literal banking metaphors.
- Claims that AI is conscious, emotional, infallible, or magical.
- Permanent “earliest,” “latest,” or live-model claims unsupported by `/game`.

## Experience concept

### Strategy Arcade

The implemented direction combines a modern arcade cabinet, tabletop scorecard, and data-annotation layer. It is game-forward without becoming casino-like, technical without becoming corporate, and youthful without becoming childish.

### Arcade console with x-ray mode

The play layer presents dice, the shared pot, scores, and Bank/Roll actions. The strategy layer reveals bust chance, score pressure, rounds remaining, and opponent decision factors. The original implementation calls this second layer the **Strategy Lens**.

The game is the hook. Revealing how it works is the reward.

## Page architecture

The as-built page has ten beats:

1. Navigation
2. Hero challenge
3. Local “What would you do?” decision
4. Math-as-advantage manifesto
5. How Bank It works
6. Opponent decision comparison
7. Three learning paths
8. Simulation evidence
9. `/game` or `/learn` fork
10. Footer

The first meaningful decision appears immediately after the hero so learning begins through action rather than explanation.

## Section specification

### 1. Navigation

Brand: `BANK IT`

Links:

- `HOW TO PLAY` → `#how-to-play`
- `THE AI` → `#ai-opponents`
- `CRACK THE STRATEGY` → `/learn/`
- `PLAY NOW` → `/game/`

Behavior:

- Transparent over the top of the hero; gains a dark blurred surface after scrolling.
- Uses a custom die mark rather than an emoji.
- `PLAY NOW` is the only filled navigation action.
- Mobile opens a full-screen labeled menu with at least 44px targets and Escape-to-close behavior.

### 2. Hero challenge

Eyebrow:

> A DICE GAME. A LIVE AI. YOUR MOVE.

Historical headline:

> Crack the strategy.  
> Beat the machine.

Historical body:

> Bank It turns a push-your-luck dice game into a live battle of probability and AI. Make your call, see what the machine chooses, and uncover the math that can give you the edge.

Actions:

- `PLAY AGAINST THE AI` → `/game/`
- `CRACK THE STRATEGY` → `/learn/`

Microcopy:

> The rules take 30 seconds. Mastering the decision takes longer.

Visual state:

- Round `8 / 10`
- Player score `620`; opponent score `590`
- Shared pot `184`
- Two physical-looking dice
- Bank and Roll Again controls
- Opponent decision status
- Strategy Lens annotations: `1 IN 6`, `+30`, and `2 ROUNDS LEFT`

Composition is an asymmetric desktop split of approximately 42% copy and 58% game state. On mobile, the headline and both actions precede the game board.

### 3. Interactive decision

Label:

> QUICK—WHAT WOULD YOU DO?

Heading:

> The pot is 184. One roll could change everything.

Visible facts are player `620`, opponent `590`, round `8 of 10`, pot `184`, and a `1 in 6` danger-roll bust chance.

The visitor chooses `BANK 184` or `ROLL AGAIN`. The local reveal explains the tradeoff without declaring the choice correct or wrong:

> You’re leading by 30 with two rounds left. Banking protects the lead. Rolling gives you a chance to pull away—but puts all 184 points at risk.

The reveal includes the four factors `1 IN 6`, `+30`, `2`, and `184`, plus `CRACK THIS DECISION` linking to `/learn/`.

### 4. Manifesto

Primary copy:

> Math isn’t the homework here.  
> **It’s how you win.**

Supporting copy:

> Probability reads the risk. Strategy uses it. AI gives you someone to test it against.

This is a still, warm-paper interruption between denser game sections. It contains no CTA.

### 5. How Bank It works

Anchor: `#how-to-play`

Label and heading:

> EASY TO START. HARD TO SOLVE.  
> Three moves. One strategy problem.

Connected steps:

1. `ROLL` — The shared pot grows with every safe roll. Doubles can send it soaring.
2. `READ THE RISK` — Watch the pot, score, and rounds remaining; context changes what the same roll means.
3. `BANK OR PUSH` — Lock in the pot or expose it to another danger roll.

Closing line:

> The dice create the problem. You decide how to solve it.

The steps form one branching path, not three generic feature cards.

### 6. Opponent comparison

Anchor: `#ai-opponents`

Label and heading:

> QUESTION THE AI  
> Same table. Same facts. Different calls.

The as-built scenario shows a pot of `211`, trailing by `85`, one round remaining, and a `1 in 6` bust chance. GPT-3.5, GPT-5, and State Delta cards show different calls, risk profiles, factors, and summaries.

This section is the clearest area of product drift. The next design must not imply that deterministic fictional opponents are live GPT models. A truthful redesign can compare Mira, Knox, and Vega’s documented strategies or explicitly label model-generated strategies as research artifacts.

### 7. Crack the strategy

Label and heading:

> GO BEHIND THE GAME  
> Three ways to crack it.

Paths:

1. `PROBABILITY` — Read the odds; run the same roll 36 times.
2. `ARTIFICIAL INTELLIGENCE` — Question the machine; compare three calls.
3. `SIMULATION + CODE` — Test the strategy; simulate 10,000 games.

The section introduces `/learn`; it does not contain the full lesson.

### 8. Simulation proof

Label and heading:

> LUCK GETS ONE GAME. STRATEGY GETS 200,000.  
> We tested the machines.

Evidence board:

- State Delta — `53.45%`
- GPT-5 strategy — `31.83%`
- GPT-4o strategy — `12.88%`
- GPT-3.5 strategy — `1.84%`

Required qualifier:

> One reproducible 200,000-game, four-strategy simulation. Results do not describe every possible matchup.

The evidence demonstrates why testing beats confidence; it is not a universal model ranking.

### 9. Final choice

Heading:

> Your next move?

The two paths have equal area and visual weight:

- Coral play path: `TEST YOUR INSTINCTS` / `Play Bank It` / `/game/`
- Blue strategy path: `GET THE EDGE` / `Crack the strategy` / `/learn/`

They should feel like two valid next moves, not a primary conversion and a secondary footnote.

### 10. Footer

Closing line:

> Read the risk. Question the AI. Crack the strategy.

Links repeat Play, Crack the Strategy, How to Play, and AI Opponents. Legal links remain absent until real destinations exist.

## Visual identity

### Color tokens

| Token | Value | Intended use |
|---|---:|---|
| `--ink-950` | `#0A1020` | Primary game-table surface |
| `--ink-850` | `#151D32` | Raised dark panels |
| `--paper-050` | `#FFF8E8` | Warm reveal surface |
| `--paper-100` | `#F5EDD9` | Secondary warm surface |
| `--risk-coral` | `#FF5C45` | Play, action, danger, push |
| `--logic-blue` | `#526DFF` | Strategy, annotations, learning |
| `--score-yellow` | `#FFD84D` | Scores, odds, clues |
| `--proof-mint` | `#35D6A0` | Banked and verified outcomes |

Color is always paired with text, iconography, position, or shape.

### Typography

- Display: Bricolage Grotesque, 400–800, with intentionally tight headline composition.
- Body: Atkinson Hyperlegible, regular and bold.
- Data: IBM Plex Mono, 500–700, for scores, probabilities, commands, and labels.
- Full paragraphs remain mixed case; uppercase is reserved for commands and short labels.

### Graphic language

- Chunky physical dice with imperfect edges.
- Scoreboard digits and tabular numbers.
- Strategy annotations that resemble coach’s marks rather than school notes.
- Branching lines, small fractions, score deltas, arrows, and “Strategy Unlocked” stamps.
- Short physical shadows on controls.
- Subtle grain or grid texture on broad surfaces.

Avoid robot heads, glowing brains, generic circuit boards, chat bubbles, stock students, chalkboards, notebooks, coins, banks, poker chips, casino tables, glassmorphism, and decorative glow.

### Layout and shape

- Maximum content width: approximately 1200px.
- Bold asymmetric composition rather than repeated centered cards.
- 8px spacing base with deliberately large section gaps.
- Cards: 18–26px radius.
- Buttons: 12–16px radius with 2–3px press movement.
- Strategy annotations are squarer than game controls.
- Borders are 1–2px and focus states remain explicit.

## Interaction and motion

- The header changes surface after 24px of scrolling.
- The mobile menu exposes visible text labels and traps page scrolling while open.
- The Strategy Lens toggles annotations and preserves `aria-pressed` state.
- The local Bank/Roll decision reveals explanatory copy immediately and supports reset.
- Section content reveals once via IntersectionObserver.
- Motion uses opacity and transform and never delays navigation.
- Reduced motion reveals all content immediately and removes decorative movement.

## Responsive and accessibility requirements

- Reference widths: 375px, 768px, 1024px, and 1440px.
- Minimum interactive target: 44×44px.
- Keyboard operation for the menu, Strategy Lens, and quick decision.
- Visible 3px focus indicator in the implementation.
- Semantic landmarks and sequential heading structure.
- Skip link to `#main`.
- WCAG AA text/control contrast.
- No disabled zoom or required horizontal carousel.
- Decorative SVGs hidden from assistive technology.
- Data charts accompanied by text values and methodology context.

## SEO and social baseline

Historical title:

> Bank It — Crack the Strategy. Beat the AI.

Historical description:

> Challenge a live AI in Bank It, a push-your-luck dice game where probability gives you the edge. Play the game, question the machine, and crack the strategy.

Historical social headline:

> Math isn’t the homework here. It’s how you win.

These lines must be reviewed against the deterministic-v1 product truth during redesign.

## Retain, reconsider, retire

### Retain as durable brand intent

- Teen-first perspective.
- Math as competitive power rather than assigned work.
- “Crack the strategy” as the strongest campaign language.
- Real game states and numbers as the primary visual material.
- `/game` and `/learn` as the two destination paths.
- Honest, testable explanations rather than AI mysticism.
- Simulation evidence with explicit methodology.
- Game-forward visual identity without fintech or casino associations.

### Reconsider during redesign

- Whether the ten-section page is too long before the fork.
- Whether the hero and decision section repeat the same scenario.
- Whether the Strategy Lens belongs on the marketing page now that the game intentionally withholds strategy during play.
- Whether equal-weight Play/Learn paths still match the current conversion goal.
- Whether the dense palette and chunky shadows should evolve to match the finished React game.
- Whether the simulation proof is too research-heavy for the first visit.

### Retire unless product direction changes

- “Live AI” as a current-v1 claim.
- Direct GPT opponent cards as the playable roster.
- “Choose a live AI opponent” in the final CTA.
- Any suggestion that the page exposes model chain-of-thought.

## Redesign acceptance questions

1. Does the first screen look like a game a teen would choose to try?
2. Is the playable product represented truthfully?
3. Does the page create curiosity about a decision before explaining a curriculum?
4. Is math presented as useful power?
5. Are opponents something to question and test rather than admire?
6. Is “Crack the Strategy” at least as compelling as “Play”?
7. Can a visitor understand the difference between `/game` and `/learn` without extra explanation?

## Preserved artifacts

See `docs/design/ARTIFACT_INDEX.md` for the archived briefs, current implementation, landing QA screenshots, game-prototype screens, visual architecture fragments, and completed React-game QA captures.
