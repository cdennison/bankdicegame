# Bank It Design System

## 1. Atmosphere & Identity

Bank It feels like a tactile strategy notebook crossed with a live game table: dark ink surfaces, warm paper, blunt color-coded decisions, and slightly imperfect physical depth. Its signature is the contrast between playful dice-game energy and precise monospaced analysis labels. This document codifies the existing landing-page system; the standalone game prototype keeps its own established screen styling.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Deepest ink | `--ink-950` | `#0a1020` | Hero, footer, black ribbon |
| Ink surface | `--ink-850` | `#151d32` | Cards, controls |
| Warm paper | `--paper-050` | `#fff8e8` | Light page surfaces |
| Risk coral | `--risk-coral` | `#ff5c45` | Risk and primary play actions |
| Logic blue | `--logic-blue` | `#526dff` | Strategy and analysis |
| Score yellow | `--score-yellow` | `#ffd84d` | Score, focus, highlights |
| Proof mint | `--proof-mint` | `#35d6a0` | Success and evidence |
| Text on dark | `--text-on-dark` | `#fff9ed` | High-contrast dark-surface text |
| Muted dark text | `--text-muted-dark` | `#b8c0d4` | Secondary dark-surface text |
| Text on light | `--text-on-light` | `#10172a` | Primary paper-surface text |
| Dark divider | `--line-dark` | `rgba(255,255,255,.14)` | Dark-surface borders |

Colors communicate meaning. Coral marks risk and action, blue marks logic, yellow marks scores and focus, and mint marks proof or success. New work reuses these tokens before adding colors.

## 3. Typography

| Level | Existing expression | Usage |
|---|---|---|
| Display | `clamp(54px, 6.4vw, 90px)`, 800, `.88` | Hero statement |
| Section | `clamp(45px, 6vw, 74px)`, display face | Major headings |
| Component title | `24px` to `37px`, 700–800 | Cards and choices |
| Body large | `18px` to `20px`, 1.55 | Leads and explanations |
| Body | `16px` to `17px`, 1.55 | Default reading text |
| Label | `9px` to `12px`, 700, uppercase | Metadata and controls |

- Display: `var(--display)` / Bricolage Grotesque.
- Body: `var(--body)` / Atkinson Hyperlegible.
- Labels and data: `var(--mono)` / IBM Plex Mono.

The three families have distinct jobs and are already loaded by the landing page.

## 4. Spacing & Layout

- Base rhythm: 4px; common gaps are 8, 12, 16, 20, 24, 28, 32, 48, 64, 80, 96, and 120px.
- Shell: `--shell: 1200px`, centered with 24px desktop and 16px mobile gutters.
- Breakpoints: 1050px for dense grids, 820px for mobile navigation, and 560px for compact phones.
- Sections use generous vertical rhythm; compact labels sit close to the objects they describe.
- Asymmetry, rotated accents, and offset shadows are intentional physical-game cues.

## 5. Components

### Primary links and buttons

- **Structure:** semantic anchors or buttons with visible labels and optional inline SVG.
- **Variants:** coral action, blue action, outline, navigation action.
- **States:** default, hover translation, active browser state, keyboard focus via global `:focus-visible`.
- **Accessibility:** minimum 44px target for primary actions, semantic native elements, visible yellow focus.
- **Motion:** 180–220ms transform and shadow changes only.

### Fixed site header

- **Structure:** brand, navigation links, play action, and mobile menu toggle.
- **States:** transparent, scrolled, mobile menu open.
- **Layout:** fixed shell; mobile navigation becomes a full-viewport panel.
- **Accessibility:** labeled navigation and toggle with `aria-expanded` / `aria-controls`.

### GitHub corner ribbon

- **Structure:** one semantic anchor with the visible copy “Fork me on GitHub”.
- **Variant:** classic black diagonal upper-right ribbon only.
- **States:** default, brighter hover/focus text, slight active translation, global yellow focus ring.
- **Accessibility:** descriptive `aria-label`, 44px minimum target, keyboard reachable, high contrast.
- **Motion:** 180ms color and transform response; no entry animation.
- **Layout:** fixed above the header; header shell reserves right-side space so navigation remains operable at 375, 768, and 1280px.

### Rules article

- **Structure:** compact ink header, short hero, source credit, numbered contents navigation, seven-section article, and source footer.
- **Layout:** two-column reading grid with a sticky 260px contents rail on desktop; contents returns to normal document flow below 900px. Article copy is capped at a comfortable reading measure.
- **Variants:** standard prose section; coral risk callout for rolling 7; blue logic callout for doubles; mint action callout for calling `BANK`.
- **States:** section anchors use a sticky-header offset; navigation and source links use underlines or bordered button treatments on hover and the global yellow keyboard focus ring.
- **Accessibility:** one `h1`, sequential `h2` headings, semantic lists and landmarks, visible skip link, 44px navigation targets, and no hidden or collapsed rules.
- **Surface:** warm paper content, deepest-ink header and footer, two-pixel ink borders, and small hard shadows drawn only from existing color tokens.

## 6. Motion & Interaction

| Type | Duration | Usage |
|---|---|---|
| Micro | 180–220ms ease | Links, buttons, ribbon |
| Reveal | 550ms ease | Existing scroll-reveal content |
| Continuous | 22s linear | Existing hero ticker |

Only transform and opacity carry meaningful motion. `prefers-reduced-motion` collapses non-essential animation and scrolling.

## 7. Depth & Surface

The strategy is mixed and deliberately tactile: borders define dark surfaces, tonal shifts separate major areas, and hard offset shadows make game controls and cards feel physical. The GitHub ribbon uses the same deepest ink and a small token-colored hard shadow rather than introducing a new material.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA with 4.5:1 body-text and 3:1 large-text contrast.
- Every interactive control remains keyboard reachable with a visible focus indicator.
- Touch targets are at least 44px where the component is a primary or fixed action.
- Primary content must not scroll horizontally at 375px.
- Reduced-motion preferences are honored.
- Long-form rules remain readable without horizontal scrolling, and contents links remain usable when the sticky rail collapses on tablet and mobile.

### Accepted debt

No new accessibility or design debt is accepted for the GitHub ribbon or rules article. Existing raw values in the pre-contract landing stylesheet are documented as inherited implementation debt and are not expanded by this change.
