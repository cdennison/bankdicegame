# Bank It — Landing Page Build Spec

Single-page marketing site. Target audience: ages 13-18. Tone: confident, energetic, slightly competitive. No copy should be altered — use verbatim below unless a component note says otherwise.

---

## PAGE STRUCTURE (top to bottom)

1. Nav (optional, minimal)
2. Hero
3. Hook statement (standalone, high-impact section)
4. Opponents section (2-3 cards)
5. Educational value section (3 feature cards)
6. Dual CTA section (2 cards side by side, stacking on mobile)
7. Footer

---

## SECTION 1: HERO

**Component:** Full-width hero, centered text, dice/AI visual motif in background (subtle, not distracting).

- eyebrow_text: "🎲 The dice game where math meets machine learning"
- headline (h1): "Can You Out-Roll an AI?"
- subheadline (p): "Bank It is a push-your-luck dice game where every roll is a gamble against artificial intelligence. Roll smart, know when to stop, and beat the machine before it beats you."

No CTA button in hero — save CTA emphasis for Section 6.

---

## SECTION 2: HOOK STATEMENT

**Component:** Standalone full-width band, large centered text, high contrast background (visually distinct from hero, e.g. inverted colors). Short section, meant to be a scroll-stopping beat.

- text (large, h2-sized): "Your opponent doesn't get nervous. It doesn't get greedy. It calculates. Can you beat that?"

---

## SECTION 3: OPPONENTS

**Component:** Section with heading + 2 opponent cards (expandable to more later). Cards should look like "fighter select" cards — model name, short descriptor, vibe.

**Section heading (h2):** "Meet Your Opponents"

**Intro line (p):** "Every AI you face has its own personality, its own risk tolerance, and its own strategy. Pick your opponent from across AI history."

**Card 1 — Old-school opponent**
- badge: "EARLIEST"
- name: "GPT-3.5"
- description: "One of the earliest large language models ever released to the public. Scrappy, a little unpredictable, rolls with old-school instincts. Beating it feels like time travel."

**Card 2 — Cutting-edge opponent**
- badge: "LATEST"
- name: "GPT-5.6"
- description: "One of the most advanced AI models in the world. Calculates odds instantly, adapts to your play style, rarely makes a bad call. Think you can outsmart it?"

**Closing line below cards (p, smaller text):** "Every model in between is fair game too. Climb the ladder from the earliest AI to the latest, and see how differently each one thinks."

---

## SECTION 4: EDUCATIONAL VALUE

**Component:** Section with heading + 3-column feature grid (stacks on mobile). Each column: icon, title, short paragraph.

**Section heading (h2):** "More Than a Game"

**Intro line (p):** "Bank It isn't just about rolling dice — it's a hands-on way to learn how probability, risk, and AI decision-making actually work."

**Feature 1**
- icon: math/calculator icon
- title: "Math"
- body: "Every roll is a probability problem. Learn to calculate your odds of busting before you decide to push your luck."

**Feature 2**
- icon: brain/AI icon
- title: "AI & Machine Learning"
- body: "See how different AI models \"think\" through the same decision, and understand why older and newer models play so differently."

**Feature 3**
- icon: code brackets icon
- title: "Coding & Simulations"
- body: "Peek under the hood to see how the AI's strategy is built, and try tweaking the logic yourself."

**Closing line (p):** "Whether you're here to win or here to learn, you're building real skills every time you play."

---

## SECTION 5: DUAL CTA

**Component:** Two equal-weight cards side by side (stack vertically on mobile). Visually distinct from each other (e.g. one warm/bold color for "Play," one cooler/calmer color for "Learn") so they read as two different paths, not a primary/secondary hierarchy.

**Section heading (h2):** "Ready to Play?"

**Card A — Play path**
- icon: dice icon
- title: "Beat the AI"
- body: "Jump straight into the game. Pick your opponent — from GPT-3.5 to GPT-5.6 — and see if you can out-roll the machine."
- button_text: "CHALLENGE THE AI"
- button_action: primary CTA → routes to game/play flow

**Card B — Learn path**
- icon: chart/graph icon
- title: "Learn the Math Behind It"
- body: "Curious how it all works? Explore the probability, strategy, and AI logic that powers Bank It before you play."
- button_text: "EXPLORE THE SCIENCE"
- button_action: secondary CTA → routes to educational/learn content

---

## SECTION 6: FOOTER

- tagline (p): "No two AI opponents play the same. No two games go the same way. Every roll teaches you something — win or lose."
- closing line (bold, larger): "Roll the dice. Outsmart the machine. Bank It."
- standard footer links/legal as needed (not specified here)

---

## DESIGN NOTES FOR IMPLEMENTATION

- Age range 13-18: bold, high-contrast, game-forward visual style. Avoid corporate/fintech-bank aesthetic despite the name "Bank It" — lean into dice-game/arcade energy, not literal banking imagery.
- Section 2 (hook statement) should feel like a distinct visual "beat" — different background treatment from the sections around it so it doesn't blend in.
- Dual CTA cards (Section 5) should feel like equally weighted choices, not "main action + fine print" — matching size, matching visual prominence.
- Keep copy verbatim as written above; do not paraphrase or shorten during implementation.
