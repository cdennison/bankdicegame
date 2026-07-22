# Bank It Rules Page Design

**Status:** Approved for implementation planning
**Date:** 2026-07-22

## Summary

Add a public `/rules/` page that presents the supplied Bank It rules as a readable, responsive article. Lightly copyedit capitalization, punctuation, grammar, and obvious typos without changing any game mechanic. Clearly identify and link ThunderHive Games as the source.

## Goals

- Make the complete rules easy to scan on desktop and mobile.
- Preserve every supplied rule and supported round count.
- Credit [ThunderHive Games](https://www.thunderhivegames.com/) near the top and again in the page footer.
- Add discoverable Rules links to the landing-page header and footer.
- Reuse the existing Bank It visual system and accessibility conventions.
- Keep the site dependency-free and deployable as static files.

## Information architecture

The page route is `/rules/`, implemented as `rules/index.html` with page-specific styles in `rules/rules.css`.

The article contains:

1. Object of the Game
2. Starting Out
3. Getting the Game Rolling
4. Important Dice Rules
5. Scoring
6. Ending a Round
7. Ending the Game

A compact introductory hero names the page and source. A numbered contents list links to section anchors. The article uses short paragraphs, lists, and three emphasized rule callouts for rolling 7, rolling doubles, and calling BANK.

## Content treatment

- Retain all facts and mechanics from the supplied copy.
- Correct “one dice” to “one die,” “playand” to “play and,” and similar grammar or spacing errors.
- Replace excessive capitalization with semantic headings and intentional emphasis.
- Preserve the exact game term `BANK` where it represents the player action or shared score.
- Do not add strategy advice or reconcile the supplied rules against the simulator’s current ten-round default.
- Link the source label directly to `https://www.thunderhivegames.com/`.

## Visual design

The page follows `DESIGN.md`:

- Deep ink hero and header, warm paper reading surface.
- Bricolage Grotesque headings, Atkinson Hyperlegible body text, and IBM Plex Mono labels.
- Coral for numbered section markers and BANK actions, blue for structural links, yellow for source and focus cues, and mint for successful banking context.
- Tactile borders and small hard shadows rather than new gradients or decorative motion.
- A readable article width inside the existing 1200px site shell.

The page does not use accordions. All essential rules remain visible, printable, searchable, and reachable by section anchors.

## Navigation

- Add `Rules` to the landing-page primary navigation before the Play action.
- Add `Rules` to the landing-page footer navigation.
- The rules page includes a compact header linking back home, to Play, and to the source.
- Preserve the existing GitHub corner ribbon on the landing page; the rules page does not repeat it.

## Responsive behavior

- Desktop: two-column reading layout with a sticky contents rail and the article body.
- Tablet and mobile: contents becomes a normal block above the article.
- At 375px, every heading and paragraph wraps naturally with no horizontal scrolling.
- Interactive links retain at least a 44px target where presented as navigation controls.

## Accessibility

- Use one `h1`, sequential `h2` section headings, semantic lists, `nav`, `main`, `article`, and `footer` landmarks.
- Include a skip link and visible yellow focus treatment.
- Give the contents navigation and source link descriptive accessible labels.
- Ensure section anchors account for the sticky header offset.
- Maintain WCAG 2.2 AA color contrast.

## Verification

- Confirm the page contains all seven sections and every supplied rule.
- Confirm source links resolve to ThunderHive Games.
- Confirm `/`, `/rules/`, `/game/`, and `/learn/` return successful responses.
- Run the existing Python test suite.
- Capture and inspect `/rules/` at 375, 768, and 1280px.
- Exercise keyboard focus, section-anchor navigation, Home, Play, and source links.
- Scan the staged commit and Git history for sensitive material before pushing.
- Push `main`, redeploy with Vercel CLI, and repeat the production route and browser checks.

## Non-goals

- Changing game logic or simulator defaults.
- Adding a rules editor, print-specific stylesheet, or downloadable PDF.
- Connecting Vercel automatic Git deployment.
- Rewriting unrelated landing-page content or navigation behavior.
