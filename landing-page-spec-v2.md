# Bank It — Landing Page Spec v2

Status: Superseded by `landing-page-spec-v3.md`

This version assumes Bank It will become a real, playable game in which a human
plays against a live AI opponent. The landing page routes visitors to either
`/game` or `/learn`. Those destinations may be placeholders during the first
landing-page build.

## Product promise

Bank It is a push-your-luck dice game where the dice are random but the decisions
are not. Players decide when to protect the points they have and when to risk them
for more while a live AI opponent makes the same choice from the same game state.

## Audience

- Primary: ages 13–18
- Secondary: educators, parents, and curious adults
- Desired first impression: “This looks like a real game.”
- Desired second impression: “I might learn something without it feeling like homework.”

## Messaging hierarchy

1. The dice are random; deciding when to stop is the real game.
2. The opponent is a live AI making decisions alongside the player.
3. Different AI opponents take different approaches to risk.
4. The same experience teaches probability, strategy, AI reasoning, and simulation.
5. Visitors can play immediately or learn how it works first.

## Voice

Bank It is:

- Confident, not boastful
- Competitive, not aggressive
- Intelligent, not academic
- Playful, not childish
- Clear about what the AI does; never mystical or exaggerated

Avoid:

- Corporate fintech or literal banking language
- Casino language such as “bet,” “jackpot,” or “wager”
- Claims that an AI is conscious, emotional, or infallible
- “Latest model” in evergreen copy; the roster should come from game configuration
- Generic AI phrases such as “revolutionary,” “next-generation,” or “powered by magic”

## Page structure

1. Navigation
2. Hero
3. How the game works
4. Hook statement
5. Opponents
6. Learning value
7. Dual path CTA
8. Footer

---

## 1. Navigation

### Content

- Brand: `BANK IT`
- Anchor: `HOW IT WORKS`
- Anchor: `OPPONENTS`
- Link: `LEARN` → `/learn`
- Button: `PLAY NOW` → `/game`

### Behavior

- Minimal, transparent over the hero at the top.
- Gains a solid dark surface and subtle border after scrolling.
- Mobile uses a compact menu with visible text labels.
- The brand mark combines a custom die symbol and wordmark; do not use an emoji.

---

## 2. Hero

### Final copy

Eyebrow:

> A PUSH-YOUR-LUCK DICE GAME AGAINST LIVE AI

Headline:

> The Dice Are Random.<br>
> The Decision Isn’t.

Body:

> Roll to build the pot. Bank to lock in your points. Push too far and a seven
> wipes them out. Your AI opponent faces the same choice—and it never makes it
> quite the same way twice.

Primary CTA:

> PLAY AGAINST THE AI

Routes to `/game`.

Secondary link:

> Learn the strategy first →

Routes to `/learn`.

Support line:

> No account needed to start.

Only include the support line if that promise will be true at launch.

### Hero visual

Show the decision, not a decorative robot:

- A large shared pot in the center: `184`
- Two tactile dice suspended just after a roll
- Player panel: `BANK` and `ROLL AGAIN` controls
- AI decision panel: `THINKING…` resolving to `ROLL AGAIN`
- Small risk readout: `BUST RISK 16.7%`
- Score comparison for `YOU` and the selected AI

This is a stylized preview, not a fully functional game. It must still look
plausible enough that the transition to `/game` feels continuous.

### Layout

- Desktop: asymmetric 5/7 split, copy left and game tableau right.
- Mobile: copy first, visual second, CTA visible before the first major scroll.
- Headline measure: approximately 9–12 words per line at desktop sizes.

---

## 3. How the game works

Section label:

> THREE MOVES. ONE HARD DECISION.

Heading:

> Know when to push. Know when to bank.

Step 1:

Title:

> ROLL

Body:

> Every safe roll grows the shared pot. Doubles can make it explode.

Step 2:

Title:

> DECIDE

Body:

> Lock in the pot now—or risk everything for one more roll.

Step 3:

Title:

> DON’T BUST

Body:

> Once the danger starts, a seven ends the round and wipes out every unbanked player.

Closing microcopy:

> Simple rules. Thousands of possible decisions.

### Visual treatment

- Three connected stations, not three generic feature cards.
- A single probability path travels across roll → decide → outcome.
- Use die, branching-path, and shield/burst SVG symbols from one icon family.

---

## 4. Hook statement

Final copy:

> Your opponent doesn’t get nervous. It doesn’t get greedy. But it can still make
> the wrong call. Can you spot it before it spots yours?

### Treatment

- Full-bleed warm light section between dark sections.
- Oversized dark typography with one phrase highlighted in coral.
- Keep it short, still, and visually quiet so it becomes a deliberate beat.

---

## 5. Opponents

Section label:

> CHOOSE YOUR CHALLENGER

Heading:

> Same dice. Different minds.

Intro:

> Every AI opponent sees the same pot, scores, and rolls you do. What changes is
> how it weighs risk, protects a lead, and fights back from behind.

### Opponent cards

The production roster must be populated from the models actually available in
the game. Do not promise a model that the live game cannot use. The examples
below describe the visual and copy pattern rather than a permanent model list.

Card pattern:

- Generation or play-style badge
- Public-facing opponent name
- Underlying model name, where appropriate
- Risk profile meter with a text label
- One-sentence strategy description
- Status: available, locked, or coming soon

Example A:

- Badge: `LEGACY`
- Name: `THE PIONEER`
- Risk label: `UNPREDICTABLE`
- Description: `An earlier-generation strategy with sharp instincts, strange gambles, and something to prove.`

Example B:

- Badge: `BALANCED`
- Name: `THE ANALYST`
- Risk label: `ADAPTIVE`
- Description: `Tracks the score, the round, and your decisions before choosing how far to push.`

Example C:

- Badge: `FRONTIER`
- Name: `THE ORACLE`
- Risk label: `CALCULATED`
- Description: `A current flagship model that reads the whole table and rarely gives away an easy opening.`

Closing line:

> Start with an earlier generation. Climb the lineup. See how AI strategy changes
> as the models get stronger.

### Accuracy rule

The landing page may display the actual underlying model IDs once the `/game`
roster is configured. Labels such as `LEGACY` and `FRONTIER` are preferable to
`EARLIEST` and `LATEST` because they remain accurate longer.

---

## 6. Learning value

Section label:

> PLAY THE GAME. SEE THE SYSTEM.

Heading:

> Every decision has a reason.

Intro:

> Bank It turns probability, risk, and AI decision-making into something you can
> test one roll at a time.

Feature 1:

Title:

> READ THE ODDS

Body:

> See how the chance of busting changes what the current pot is really worth.

Feature 2:

Title:

> QUESTION THE AI

Body:

> Compare what different models choose—and where their reasoning breaks down.

Feature 3:

Title:

> RUN THE NUMBERS

Body:

> Explore simulations, test strategies, and see which ideas survive thousands of games.

Inline link:

> OPEN THE LEARNING LAB →

Routes to `/learn`.

### Content rule

The landing page introduces the learning value but does not teach the complete
lesson. Detailed rules, formulas, simulator findings, and code belong on `/learn`.

---

## 7. Dual path CTA

Section heading:

> Choose your next move.

The cards have equal size and prominence. They differ in color and emotional
energy, not in perceived importance.

### Game path

Label:

> I’M READY TO RISK IT

Title:

> Challenge the AI

Body:

> Pick an opponent, roll the dice, and find out whether your instincts can beat its strategy.

Button:

> PLAY BANK IT

Routes to `/game`.

### Learn path

Label:

> I WANT TO SEE THE MATH

Title:

> Enter the learning lab

Body:

> Break down the probability, compare AI decisions, and explore the simulations behind the game.

Button:

> EXPLORE HOW IT WORKS

Routes to `/learn`.

---

## 8. Footer

Closing line:

> Roll the dice. Read the risk. Bank it before the machine does.

Links:

- Play → `/game`
- Learn → `/learn`
- How it works → `#how-it-works`
- Opponents → `#opponents`
- Privacy placeholder
- Terms placeholder

Do not create dead legal links. Omit them until destinations exist or clearly
label them as unavailable outside production.

---

## Art direction

### Concept: Tactile Strategy Arcade

The interface feels like a physical tabletop game translated into a sharp digital
system. It should not look like a casino, bank, generic AI startup, or esports
betting site.

Core traits:

- Dark game-table foundation
- Warm paper or bone-colored interruptions
- Chunky physical controls with visible press states
- Crisp probability and score readouts
- Slightly imperfect dice and card geometry
- Spacious composition with a few concentrated bursts of information

### Palette

Use semantic tokens rather than raw values inside components.

- Ink / page background: `#0B1020`
- Raised dark surface: `#141B2F`
- Warm paper: `#F3EEDF`
- Primary text on dark: `#F8F5EC`
- Primary text on light: `#11172A`
- Risk coral: `#FF5A3D`
- Analysis blue: `#4D73FF`
- Score yellow: `#F5C84C`
- Success green: `#36C98F`
- Muted text on dark: `#A8B0C5`
- Hairline on dark: `rgba(255, 255, 255, 0.12)`

Coral represents action and risk. Blue represents analysis and learning. Yellow
is reserved for scores, odds, and small high-attention details. Do not use red
and green as the only way to communicate state.

### Typography

- Display: bold geometric or grotesque face with distinctive punctuation
- Body: highly legible humanist sans
- Data: restrained monospace for scores, odds, badges, and model labels
- Maximum of three families; two is preferable if the body family has a usable mono companion
- Mobile body text: 16px minimum with at least 1.5 line height
- Avoid stereotypical sci-fi fonts and thin techno lettering

Recommended implementation direction:

- Display: `Archivo Black` or a similarly broad grotesque
- Body: `Atkinson Hyperlegible`
- Data: `IBM Plex Mono`

If external font loading is undesirable, use a carefully tuned system-font stack
and retain the hierarchy through weight, width, casing, and spacing.

### Shape and depth

- Card radius: 20–28px depending on scale
- Buttons: 14–18px radius, never fully pill-shaped for large actions
- Borders: high-contrast 1px or low-contrast 2px, used consistently
- Shadows: short, dense, physical shadows rather than soft SaaS glow
- One subtle paper grain or dither texture; no repeated noise over body copy

### Icons and illustration

- Use consistent custom SVG or a single rounded/duotone icon family
- No emoji as structural icons
- No robot head or glowing brain illustration
- AI is represented through decisions, score data, opponent cards, and branching paths
- Dice may be rendered with CSS/SVG so they remain crisp and themeable

---

## Motion

- Dice settle into place once in the hero; no endless rolling loop.
- AI status progresses from `READING TABLE` to a decision in the hero preview.
- Buttons depress 2–3px with a fast physical rebound.
- Opponent cards reveal risk meters when they enter the viewport.
- Section entrances use opacity and transform only.
- Micro-interactions: 150–250ms.
- One-time hero sequence: no longer than 500ms after content is readable.
- Respect `prefers-reduced-motion`; the reduced version shows all final states immediately.
- Never delay navigation for an animation.

---

## Responsive behavior

- Design mobile-first at 375px, then verify 768px, 1024px, and 1440px.
- Minimum interactive target: 44×44px.
- No horizontal carousel is required to understand opponent cards.
- Hero preview stacks below the message on small screens.
- Dual CTA cards stack while retaining equal visual weight.
- Navigation remains usable at 200% zoom.
- Body copy stays within 35–60 characters per line on mobile and 60–75 on desktop.

---

## Accessibility

- Semantic landmarks and sequential heading hierarchy
- Skip link to main content
- Visible 2–4px focus treatment
- WCAG AA contrast for all final token pairs
- Meaningful SVGs labeled; decorative visuals hidden from assistive technology
- AI “thinking” changes announced only in the real game, not in the decorative landing preview
- No information available only through color, hover, or animation
- Page remains complete and understandable with CSS animation disabled

---

## SEO and metadata draft

Title:

> Bank It — Can You Beat an AI at the Ultimate Dice Decision?

Description:

> Play Bank It against a live AI opponent. Roll to grow the pot, bank before you
> bust, and explore the probability and strategy behind every decision.

Social title:

> The dice are random. The decision isn’t.

Social description:

> Challenge a live AI in Bank It, the push-your-luck game of probability, nerve,
> and knowing when to stop.

---

## Implementation boundaries for the first landing build

Build now:

- Complete responsive landing page
- Working `/game` and `/learn` links
- Anchor navigation
- Hero game-preview animation
- Opponent and learning sections using final or placeholder roster data
- Accessible motion and interaction states
- SEO metadata

Do not build yet:

- Live model calls
- Game rules engine or multiplayer state
- Authentication
- The packaged `/learn` curriculum
- Model-specific claims that have not been verified against the launch roster

If `/game` and `/learn` do not exist yet, their links should still use those real
paths so the landing page does not need to be rewritten later.
