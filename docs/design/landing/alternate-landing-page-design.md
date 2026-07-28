# Bank It — Alternate Landing Page Design: "Match Point"

**Status:** Design proposal for review — not implemented
**Date:** 2026-07-21
**Author:** Sisyphus (design direction), with UI/UX Pro Max design-system research
**Compares against:** the implemented "Strategy Arcade" page (`LANDING_PAGE_DESIGN_SPEC.md`)
**Artifacts:** `docs/design/artifacts/landing-alternate/`

This document proposes one complete, genuinely different landing-page direction. It is design work only: no production code, no application source changes.

---

## 1. UI/UX Pro Max research summary

All searches ran against the bundled `ui-ux-pro-max` database (67 styles, 161 palettes, 57 pairings, 99 UX guidelines) via `scripts/search.py`.

### Queries run

| Query | Mode | Purpose |
|---|---|---|
| `teen gaming entertainment strategy probability bold playful mobile-first` | `--design-system` | Baseline design-system recommendation for the audience/product |
| `dark arcade gaming competition teen energetic bold` | `--design-system` | Second opinion, darker direction |
| `hero-centric interactive choice CTA two-path` | `--domain landing` | Page-structure patterns for a two-destination product |
| `bold dark gaming energetic` | `--domain style` | Style candidates |
| `bold modern gaming energetic` | `--domain typography` | Font pairing candidates |
| `animation accessibility reduced-motion focus` | `--domain ux` | Motion + a11y guardrails |
| `touch target safe-area accessibility` | `--domain web` | Mobile target/inset guardrails |

### Recommended pattern

Two runs converged on a short, hero-dominant structure:

- **Minimal Single Column** — single CTA focus, large typography, generous whitespace, mobile-first, 5 sections (hero → short description → 3 benefits max → CTA → footer).
- **Hero-Centric Design** — hero occupies 60–80% of the fold, one primary CTA at 7:1+ contrast, sticky nav CTA, identical hierarchy on mobile.
- Related landing-domain signal: *Immersive/Interactive Experience* (CTA after an interaction, with a skip option) and *Product Demo + Features* (interactive mockup increases engagement).

**Adopted:** a 6-beat, hero-centric single column. One interactive moment (the freeze-frame decision) sits immediately after the hero, CTA-after-interaction as the pattern recommends.

### Relevant style direction

- The `--design-system` engine twice selected **3D & Hyperrealism** for "gaming." Its own metadata flags it **Performance: Poor** and **Accessibility: Not accessible**, and it prescribes WebGL/Three.js with 3–5 parallax layers.
- The style-domain search surfaced **Vibrant & Block-based** (flat bold color blocks, geometric shapes, 4–6 high-contrast colors, type at 32px+, Tailwind 10/10, Performance: Good, best-for: gaming / youth / entertainment) — flagged only "◐ Ensure WCAG," which is manageable.

**Adopted:** Vibrant & Block-based traits (flat color fields, large type, hard geometry), executed as a sports-broadcast graphic language. **Rejected:** 3D & Hyperrealism, on the database's own performance and accessibility flags, plus our mobile-first weight budget and reduced-motion requirements.

### UX principles adopted (from `ux` and `web` domains)

- Animate 1–2 key elements per view maximum; 150–300ms micro-interactions; ease-out entrances; nothing loops decoratively.
- Respect `prefers-reduced-motion` (all content visible immediately, no scroll-driven effects).
- Visible focus rings on every interactive element; never remove outlines without replacement.
- Touch targets ≥ 44×44px with ≥ 8px spacing between adjacent targets.
- Safe-area insets respected; no full-screen custom gestures that fight scroll/back.

### Accessibility considerations

- Light-first palette makes AA contrast straightforward; every color pairing in §5 was chosen against explicit ratios (listed with the tokens).
- Color never carries meaning alone: bust/risk always pairs signal red with a text label and position; player identity always pairs color with name.
- The stat sheet ships with text values and a methodology qualifier, per the existing spec's evidence rules.
- Reduced-motion: telestrator strokes, count-ups, and wipes all collapse to static, fully-visible states.

### Intentional deviations (recorded, with reasons)

| Recommendation | Decision | Reason |
|---|---|---|
| Fredoka + Nunito pairing (run A) | **Rejected** — Barlow Condensed + Barlow instead | The database's own metadata marks Fredoka/Nunito "best for children's apps." The brief forbids childish styling. The typography database's "Sports/Fitness" pairing fits the broadcast concept and the 13–18 audience. |
| 3D & Hyperrealism style | **Rejected** | Flagged "Performance: Poor / Not accessible" by the database itself; WebGL weight contradicts mobile-first; parallax conflicts with reduced-motion guidance. |
| Neon purple/rose and neon red/blue dark palettes | **Rejected** | Both keep the page dark, which fails the brief's core constraint: genuinely different from the current dark-navy page. A light-first field with flat saturated blocks is the legible break. |
| Single-CTA-focus pattern | **Partially deviated** — two equal fork CTAs at the end | The product truth requires clear routing to both `/game` and `/learn`. The fork is the conversion goal, so the single-CTA rule is applied *per section* (one action per beat) rather than per page. |
| "Avoid minimalist design / static assets" (anti-pattern of the rejected 3D style) | **Deliberately not followed** | That anti-pattern belongs to the rejected style; flat static assets are a feature of the chosen direction. |

---

## 2. Creative concept and rationale

### The concept: **Match Point**

The page is a **sports broadcast of one decisive moment** — and the visitor is in it.

Not an arcade cabinet (the current direction), not a classroom, not a casino. A broadcast: a matchup card, a freeze-frame replay with telestrator marks, scouting reports, a stat sheet, and a channel choice. The page treats a single round-8 decision the way a broadcaster treats match point: show the matchup, freeze the moment, circle the facts, check the numbers, then hand over the remote.

The organizing device is the **replay**. The hero shows the matchup live; the next section freezes the same moment and dissects it. This turns the current page's biggest structural weakness — the hero and the decision section repeating the same scenario — into the concept itself: *of course we replay it. The replay is where you learn to see.*

### Why this is genuinely different from Strategy Arcade

| Dimension | Strategy Arcade (current) | Match Point (proposed) |
|---|---|---|
| Metaphor | Arcade cabinet + scorecard + x-ray annotations | Live sports broadcast + replay + scouting report |
| First impression | Dark navy game table, dense layered panels | Light broadcast studio field, one flat matchup banner |
| Structure | 10 beats, two explainer sections, repeated scenario | 6 beats, each with one job, scenario repeated *intentionally as a replay* |
| Opponent framing | "The AI" / model comparison cards | Rivals with scouting reports and redacted tells |
| Evidence | Research-board proof section | Broadcast stat sheet, one screen, qualified |
| Depth | Chunky physical shadows, grain, layered panels | Flat fields, hard ink outlines, one hard offset shadow on actions only |
| Typography | Bricolage Grotesque mixed-case headlines | Barlow Condensed uppercase broadcast headlines, huge numerals |
| Palette | Ink navy / warm cream / coral / logic blue | Studio chalk / ink / electric pitch green / signal red / game amber |

### Why this converts the v1 constraint into the hook

The honest v1 fact — Mira, Knox, and Vega run fixed, local, deterministic strategies — is a marketing *asset* in this frame. Fixed strategies are **patterns**, and patterns are what athletes study film to beat. The broadcast metaphor makes truthfulness the pitch:

> Every opponent has a tell. They run fixed strategies — no cloud, no hidden model. Fixed means patterned. Patterned means crackable.

No live-AI claims are needed anywhere, and the redacted-scouting-report device protects the game's post-match strategy reveals instead of spoiling them.

### Why this fits the audience and mission

Teens 13–18 may never watch linear sports, but they live in the highlight grammar this borrows: matchup cards, stat overlays, freeze-frames, "he can't keep getting away with it" energy. The frame is competitive without casino language, confident without corporate AI imagery, and fast without forced slang. Math enters exactly where the mission wants it: as the thing that wins the frozen moment — "math isn't the homework; it's the read."

### The intended teen response

1. "You vs. Mira — okay, it's a real game."
2. "Freeze it — wait, *would* I bank there?"
3. "The opponents have tells? I could read that."
4. "The stat sheet says one idea actually wins. Show me why → Film Room."

---

## 3. Messaging hierarchy and final copy

### Hierarchy

1. **Central language:** `CRACK THE STRATEGY.` (hero headline — retained as the strongest campaign language)
2. **Concept line:** `EVERY OPPONENT HAS A TELL.`
3. **Decision line:** `THE READ` — one frozen moment, four facts, your call.
4. **Truth line:** fixed local strategies → patterns → crackable.
5. **Evidence line:** `LUCK GETS ONE GAME. STRATEGY GETS 200,000.`
6. **Routing lines:** `KICKOFF` (`/game`) and `FILM ROOM` (`/learn`).

### Voice

Broadcast-confident: short declaratives, present tense, second person. Curious and competitive per brand voice; zero academic padding; zero casino/fintech vocabulary ("bank" appears only as the game's own verb).

### Final copy, section by section

#### 0. Score-bug navigation

- Brand: die mark + `BANK IT`
- Tag (mono, small): `A PUSH-YOUR-LUCK DICE GAME`
- Links: `THE READ` → `#the-read` · `SCOUTING REPORT` → `#the-tells` · `STAT SHEET` → `#stat-sheet`
- Filled action: `PLAY` → `/game/`
- Mobile: full-screen menu, visible labels, ≥44px targets, Escape to close.

#### 1. Hero — THE MATCHUP

- Eyebrow (mono): `MATCH POINT · A DICE GAME WITH A DECISION PROBLEM`
- Headline (condensed uppercase):
  > **Crack the strategy.**
- Subhead:
  > Bank It is a push-your-luck dice game. The pot climbs, one roll can wipe it out, and the player who reads the table best walks off with it. Probability is the read. You bring the nerve.
- Matchup banner (full-width broadcast bar):
  - Bug: `ROUND 8 / 10`
  - `YOU 620` — VS badge — `MIRA 590`
  - `SHARED POT 184` with two flat dice
  - Status chip: `YOUR CALL`
- CTAs:
  - Primary: `PLAY THE MATCH` → `/game/`
  - Secondary (text link with arrow): `SEE THE READ` → `#the-read`
- Microcopy:
  > The rules take 30 seconds. The decision takes longer.

#### 2. THE READ — the freeze-frame decision

- Label (mono, red flag): `THE READ · INSTANT REPLAY`
- Heading:
  > **Freeze it. The pot is 184.**
- Facts strip (telestrator-circled on the visual; text equivalents inline):
  - `BUST CHANCE — 1 IN 6`
  - `YOUR LEAD — +30`
  - `ROUNDS LEFT — 2`
  - `AT RISK — 184`
- Body:
  > You're 30 up on Mira with two rounds left. Every roll from here is a danger roll: a 7 wipes the pot. Banking locks 184 and protects the lead. Pushing buys separation — at a 1-in-6 price.
- The choice (interactive in production; static states mocked):
  - `BANK 184` / `PUSH YOUR LUCK`
- Reveal copy (same regardless of choice — the page never grades the visitor):
  > There's no wrong answer on one roll. There's a wrong answer over ten thousand rolls. Reading that difference is the whole game — and it's a skill, not a gift.
- Bridge link: `CRACK THIS DECISION` → `/learn/`

#### 3. THE TELLS — scouting reports

- Label: `SCOUTING REPORT`
- Heading:
  > **Every opponent has a tell.**
- Body:
  > Mira, Knox, and Vega each run a fixed strategy that lives on your device — no cloud, no hidden model, no live AI. Fixed means patterned. Patterned means crackable. Their full reads declassify after your first match.

- Card — **MIRA** (teal identity bar):
  - Personality: *Quiet confidence. Seems one move ahead.*
  - Observed tendency: *Banks earlier when she's behind. Later when she can afford it.*
  - Report status: `FULL READ: REDACTED — PLAY A MATCH TO DECLASSIFY`
- Card — **KNOX** (signal-red identity bar):
  - Personality: *Treats every roll like a dare.*
  - Observed tendency: *Stays in when the pot's juiced. Doubles make him braver.*
  - Report status: `FULL READ: REDACTED — PLAY A MATCH TO DECLASSIFY`
- Card — **VEGA** (purple identity bar):
  - Personality: *Unshakable. Impossible to read.*
  - Observed tendency: *The same call in the same spot. Every. Single. Time.*
  - Report status: `FULL READ: REDACTED — PLAY A MATCH TO DECLASSIFY`

#### 4. THE STAT SHEET — simulation evidence

- Label: `THE STAT SHEET`
- Heading:
  > **Luck gets one game. Strategy gets 200,000.**
- Bars (text values always present):
  - `STATE DELTA — 53.45%`
  - `GPT-5 STRATEGY — 31.83%`
  - `GPT-4O STRATEGY — 12.88%`
  - `GPT-3.5 STRATEGY — 1.84%`
- Qualifier (required, verbatim intent):
  > One reproducible 200,000-game, four-strategy simulation. These are documented strategy policies, not live models. Results do not describe every possible matchup.
- Bridge body:
  > One of these strategies is sitting across the table from you tonight. The film room shows all four — and why the winner wins.
- Link: `STUDY THE FILM` → `/learn/`

#### 5. The fork — KICKOFF / FILM ROOM

- Heading: `Pick your channel.`
- Panel A — pitch green field:
  - Bug: `KICKOFF`
  - Headline: `Play Bank It`
  - Copy: *Take the table against Mira, Knox, and Vega. Thirty seconds to learn the rules. Ten rounds to find out if your reads hold.*
  - CTA: `PLAY THE MATCH` → `/game/`
- Panel B — ink dark field:
  - Bug: `FILM ROOM`
  - Headline: `Crack the Strategy`
  - Copy: *Break down the read: the probability behind a danger roll, why two players see the same facts and call it differently, and what 200,000 simulated games say.*
  - CTA: `ENTER THE FILM ROOM` → `/learn/`

#### 6. Footer

- Closing line:
  > Read the risk. Spot the tell. Crack the strategy.
- Links: `PLAY` `/game/` · `FILM ROOM` `/learn/` · `THE READ` `#the-read` · `SCOUTING REPORT` `#the-tells`
- Honesty line (mono, small):
  > V1 TRUTH: OPPONENTS RUN FIXED LOCAL STRATEGIES ON YOUR DEVICE · FUTURE DIRECTION: LIVE AI OPPONENTS — LABELED AS SUCH WHEN IT SHIPS

### Language deliberately not used

No "live AI," no GPT-as-opponent claims, no bet/jackpot/wager, no banking metaphors, no "students will learn," no classroom/worksheet framing, no forced slang.

---

## 4. Page architecture — section-by-section purpose

Six beats, mobile-first single column. Each beat has exactly one job and one action (or none).

| # | Section | Job | Ends with |
|---|---|---|---|
| 0 | Score-bug nav | Orient + one escape hatch to play | `PLAY` |
| 1 | THE MATCHUP | Prove in 3 seconds that this is a real game with a real rival and real stakes | `PLAY THE MATCH` (+ soft scroll link) |
| 2 | THE READ | Let the visitor *feel* the strategic decision once — the bridge from play to curiosity | `CRACK THIS DECISION` → `/learn` |
| 3 | THE TELLS | Make opponents worth beating; state the honest fixed-strategy truth as the hook | (no CTA — momentum beat) |
| 4 | THE STAT SHEET | Prove strategy is real and testable; point curiosity at `/learn` | `STUDY THE FILM` → `/learn` |
| 5 | KICKOFF / FILM ROOM | The unmistakable fork — two equal, plainly-different next moves | `/game` or `/learn` |
| 6 | Footer | Close the loop; state v1 truth + labeled future direction | — |

**What was cut vs. the ten-beat page, and why:** the standalone manifesto (its one good line is absorbed into hero subhead and THE READ's reveal), the three-step how-it-works (absorbed into hero microcopy "30 seconds" + fork copy), and the three learning-path cards (absorbed into the FILM ROOM panel copy). The replay device merges the old hero-game-panel and quick-decision sections into one deliberate two-act moment.

---

## 5. Visual system

### 5.1 Colors

Light-first broadcast palette. Flat fields, no gradients, no glow. Ratios are against the stated pairing.

| Token | Hex | Role | Contrast pairing (ratio) |
|---|---:|---|---|
| `--studio` | `#F1F2EA` | Page field — cool broadcast-studio chalk | with `--ink` text: 15.8:1 |
| `--ink` | `#14171A` | Headlines, body on light, outlines | on `--studio`: 15.8:1; on `--pitch`: 7.4:1; on `--amber`: 8.6:1 |
| `--pitch` | `#00C853` | Play / go / KICKOFF field, safe accents | with `--ink` text: 7.4:1 (never pair with white text: 2.4:1) |
| `--signal` | `#E0281E` | Bust, danger, telestrator marks, red flags | with white text: 4.6:1 (large/bold only); with `--ink`: 3.9:1 (icons/marks + label) |
| `--amber` | `#FFB300` | Scores, the pot, banked outcomes — continuity with the game's action color | with `--ink`: 8.6:1 |
| `--deep` | `#101820` | FILM ROOM panel + stat-sheet section field | with `--studio` text: 14.9:1; with `--amber` text: 7.9:1 |
| `--paper-teal` | `#2EC4B6` | Mira identity (from game) | identity bar only, never sole signal |
| `--paper-red` | `#FF6B5B` | Knox identity (from game family) | identity bar only |
| `--paper-purple` | `#8E7CF3` | Vega identity (from game) | identity bar only |

Rules: `--signal` never appears without a text label. Player colors always appear with names. White text is forbidden on `--pitch` and `--amber`. Only one saturated field per viewport (green *or* dark *or* chalk dominates any screen).

### 5.2 Typography

| Role | Face | Usage |
|---|---|---|
| Display | **Barlow Condensed** 600/700, uppercase, −1% tracking | Headlines (clamp 44–96px), numerals (up to 160px), the VS mark |
| Body | **Barlow** 400/500/600 | Paragraphs (17–19px, 1.55 line-height, ≤ 68ch measure) |
| Data / bugs / labels | **IBM Plex Mono** 500/700, uppercase, +6% tracking | Score bugs, stat values, eyebrows, buttons' small labels — continuity with the current page and the game |

Numerals are always Barlow Condensed tabular-feeling or IBM Plex Mono tabular — the broadcast stat look depends on it. Sentence case for all paragraphs; uppercase reserved for bugs, labels, headlines.

### 5.3 Illustration / imagery direction

No photography, no 3D, no characters' faces. Flat vector broadcast graphics:

- **Flat dice** — rounded-square tiles, ink outline, pip layout, slight (−6°) rotation; the game's physicality simplified into a graphic.
- **Telestrator marks** — hand-drawn-feel circles and arrows in `--signal`, 3px stroke, applied over the frozen game state in THE READ.
- **Score bugs and lower-thirds** — small mono-label chips that tag every section (`THE READ · INSTANT REPLAY`).
- **Redaction bars** — ink blocks over scouting-report lines, with mono stamps.
- **Stat bars** — flat horizontal bars scaled to win percentage.
- Opponent presence = **name + identity color bar + one-line tendency**, echoing the game's scoreboard rows without copying its interface.

### 5.4 Shapes and depth

- Flat color fields with **1.5–2px ink outlines** — broadcast-graphic/sticker feel.
- Radius: cards and panels 10px (vs. current 18–26px); buttons 8px; chips/bugs 4px. Squarer everywhere.
- One shadow style only: **hard 4px offset ink shadow** on interactive elements (buttons, choice cards), which compresses 2px on press — a flattened descendant of the game's chunky ROLL button.
- Diagonal slash dividers (8–12°) between major beats; the VS badge is a rotated ink square.

### 5.5 Spacing and layout

- 8px base unit; section padding mobile 64px / desktop 120px vertical; content max-width 1120px.
- Mobile-first single column; every section is one full-bleed band (`--studio`, `--pitch`, or `--deep`).
- Desktop hero: headline block, then a **full-width matchup lower-third** (not the current right-floating game panel). THE READ: frozen board left (55%), facts + choice right (45%). THE TELLS: three-card row. STAT SHEET: single centered column on `--deep`. Fork: two 50/50 panels.
- Density follows the skill's marketing-page dial (low density): 24–96px spacing scale, never dashboard-tight.

### 5.6 Motion principles

Per the UX-domain guardrails (1–2 animations per view, 150–300ms, ease-out, reduced-motion collapse):

1. **Wipe-in** — each band enters with a 12° clip-path wipe, once, 300ms ease-out, on scroll into view.
2. **Telestrator draw-on** — circles/arrows stroke-draw once when THE READ enters (SVG dash-offset, 600ms total, ease-out).
3. **Count-up** — the pot and stat percentages count up once (≤ 800ms) when first visible.
4. **Press physics** — buttons and choice cards compress their hard shadow on hover/press (transform ≤ 2px, 150ms).
5. **Reduced motion** — everything above becomes instant and fully visible; no wipes, no count-ups, no draw-ons. Content is never hidden pending animation.
6. **Never:** parallax, infinite loops, scroll-jacking, carousels.

---

## 6. Desktop and mobile static mockups

Saved in `docs/design/artifacts/landing-alternate/` (static HTML renders + PNG captures):

| Artifact | Shows |
|---|---|
| `mockup-desktop.html` / `mockup-desktop.png` | Full page at 1440px — all six beats |
| `mockup-mobile.html` / `mockup-mobile.png` | Full page at 390px — the primary design |
| `mockup-states.html` / `mockup-states.png` | Component and interaction states (§7) |

## 7. Component and interaction-state mockups

In `mockup-states.html/.png`:

1. **Nav** — default; mobile menu open (full-screen, labeled links).
2. **THE READ choice card** — unselected; `BANK 184` selected (reveal copy visible, `aria-pressed` true); `PUSH YOUR LUCK` selected (same neutral reveal); reset affordance.
3. **Primary button** — default / hover-pressed (shadow compressed 2px) / focus (3px outline) / disabled.
4. **Scouting card** — default; hover (lift + redaction stamp tilts).
5. **Fork panels** — default; hover (field deepens, CTA arrow slides 4px).
6. **Stat bar** — pre-fill (0%) and filled states.

## 8. Responsive and accessibility specifications

### Responsive

- Reference widths: **375px (primary), 768px, 1024px, 1440px** — designed at 375 first; desktop is an expansion, not the source.
- Mobile (≤767px): single column; matchup banner stacks (YOU — VS — MIRA vertically, pot row beneath); CTAs full-width; READ facts become a 2×2 grid; scouting cards stack; fork panels stack with KICKOFF first; display type clamps to 44–56px.
- Tablet (768–1023px): two-column READ, three-up tells remain, fork stays 50/50.
- Desktop (≥1024px): max-width 1120px centering; matchup becomes one horizontal lower-third.
- No horizontal scrolling anywhere; stat bars use flexible widths; touch targets ≥ 44×44px with ≥ 8px separation; safe-area insets respected on the sticky nav.

### Accessibility

- Semantic landmarks (`header/nav/main/section/footer`), sequential headings, skip link to `#main`.
- Keyboard: menu, READ choice (button group with `aria-pressed`), and all links operable; visible 3px `--ink` focus outline with 2px offset on both light and dark fields.
- WCAG AA contrast per §5.1 pairings; no white text on `--pitch`/`--amber`; `--signal` always paired with a text label.
- The READ choice never grades the answer; reveal copy is identical for both choices and announced politely (live region, `polite`).
- Stat sheet includes text values + methodology qualifier; bars are `role="img"` with full text alternative.
- Reduced motion: all §5.6 motion collapses to static, visible states.
- Decorative SVGs (telestrator marks, slashes, dice) are `aria-hidden`.
- Zoom to 200% and 320px width reflow without loss; no disabled zoom.

---

## 9. Direct comparison with the existing landing page

### What improves

1. **Length and repetition:** ten beats → six; the duplicated hero/decision scenario becomes an intentional replay device instead of an accident.
2. **Truthfulness-by-design:** the fixed-strategy constraint becomes the hook ("fixed means patterned, patterned means crackable"), and the redacted scouting report protects the game's post-match reveals rather than spoiling them. GPT names survive only inside the qualified stat sheet, explicitly as *documented strategy policies*.
3. **Play→curiosity bridge:** THE READ's reveal ("a skill, not a gift") and the stat sheet's "one of these is across the table tonight" both point at `/learn` from inside the game's drama, not from an explainer section.
4. **Fork clarity:** KICKOFF/FILM ROOM names the *feeling* of each destination; a visitor can predict `/game` vs `/learn` with zero extra explanation.
5. **Mobile primacy:** the matchup lower-third, 2×2 facts grid, and stacked fork are designed at 375px first; the current page's hero panel is a desktop composition adapted downward.
6. **Visual distinctness with continuity:** light-first flat broadcast system shares only the game's amber, mono data face, player identity colors, and one hard-shadow press behavior — related, unmistakably not the arcade page.

### What is intentionally removed

- The warm-paper manifesto pause (folded into hero + reveal copy).
- The three-step how-it-works path (folded into microcopy and fork copy).
- The three learning-path cards (folded into the FILM ROOM panel).
- The Strategy Lens marketing demo (the game withholds strategy during play; the freeze-frame READ replaces it honestly).
- Model-comparison opponent cards (retired per the spec's product truth).

### Trade-offs this direction accepts

- **Tonal loudness:** the broadcast frame sustains one energy level; it loses the current page's quiet manifesto breath. Mitigation: the `--deep` stat-sheet band acts as the low-light breather.
- **Sports-reference risk:** a teen indifferent to sports may find the frame neutral rather than magnetic — but the grammar (matchup card, stat overlay, freeze-frame) is highlight-culture native even for non-fans.
- **Type personality:** Barlow Condensed is more conventional than Bricolage Grotesque; the direction trades some type distinctiveness for score-bug authenticity.
- **Social-card drama:** a light-first page produces a less dramatic OG image; mitigated by using the `--deep` stat-sheet composition for share art.
- **Single-moment focus:** betting the page on one decision (pot 184) is sharper but narrower than the current page's breadth; the fork must carry visitors whose curiosity is already general.

### Which teen response it optimizes for

The fast-scrolling highlight native who decides in seconds whether something is a real game, feels the pull of "you vs. Mira," and — when the freeze-frame hits — wants to know whether *their* read was right. Strategy Arcade optimized for a curious browser; Match Point optimizes for a competitor who discovers they're curious.

---

## Appendix — redesign acceptance questions (from the baseline spec)

1. **First screen looks like a game a teen would choose?** Yes — a matchup card with a rival, a score, and a pot reads as a game instantly.
2. **Playable product represented truthfully?** Yes — fixed local strategies stated plainly; future AI labeled as future only.
3. **Curiosity before curriculum?** Yes — the first explanation arrives only after the visitor makes the frozen call.
4. **Math as useful power?** Yes — probability is "the read" that wins the frozen moment.
5. **Opponents to question, not admire?** Yes — scouting reports with tells and redactions.
6. **"Crack the Strategy" ≥ "Play"?** It is the headline, the fork's second half, and the footer close.
7. **`/game` vs `/learn` self-evident?** KICKOFF plays; FILM ROOM explains. No glossary needed.
