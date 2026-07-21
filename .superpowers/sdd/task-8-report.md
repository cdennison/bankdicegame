# Task 8 report: setup screen and v1 validation

## Outcome

Implemented the approved React setup experience with controlled human name, ordered one-to-three opponent selection, optional deterministic challenge code, browser-crypto generation for blank codes, accessible validation, and controller startup through a normalized generic `GameConfig`.

## RED evidence

- Added `src/game/ui/screens/SetupScreen.test.tsx` before production components.
- Command: `npm test -- --run src/game/ui/screens/SetupScreen.test.tsx`
- Result: expected failure. Vitest could not resolve `./SetupScreen` because the screen did not exist yet (`1 failed suite`, `0 tests`).

## GREEN evidence

- Focused command: `npm test -- --run src/game/ui/screens/SetupScreen.test.tsx`
- Result: `1 passed` test file, `6 passed` tests.
- UI verification command: `npm test -- --run src/game/ui && npm run typecheck && npm run build`
- Result: `2 passed` test files, `7 passed` tests; TypeScript exited 0; Vite built all three entries and emitted hashed `/game/` assets.
- Final repository verification: `npm test -- --run && npm run typecheck && npm run build && git diff --check`.
- Final result: `12 passed` test files, `132 passed` tests; typecheck, build, and whitespace checks exited 0.

## Browser/render evidence

- Mobile viewport: `innerWidth 390`, `scrollWidth 390`; Start disabled at zero opponents, enabled after selecting Vega, lineup was `You, Vega`.
- Desktop viewport: `innerWidth 1200`, `scrollWidth 1200`; computed setup columns were `638px 380px`.
- Visually inspected full-page mobile and desktop renders. The approved amber/slate tactile shell, mobile spacing, roster cards, two-column desktop layout, and static avatar tokens render as intended.
- In-app browser runtime was unavailable due missing execution metadata; used the installed `agent-browser` CLI fallback against the local Vite server.

## Static-page and build evidence

- Captured SHA-1 hashes before work and rechecked after implementation: `index.html: OK`, `learn/index.html: OK`.
- `git diff -- index.html learn/index.html` was empty.
- `dist/game/index.html` references hashed `game-Cd6Ak_Ju.js` and `game-T5VH07gt.css` assets.
- The CSS was moved: `game/game.css` no longer exists and `src/game/ui/styles/game.css` is imported by `src/game/main.tsx`.

## Files

- Added: `src/game/ui/screens/SetupScreen.tsx`, `SetupScreen.test.tsx`
- Added: `src/game/ui/components/PlayerAvatar.tsx`, `GameCodeField.tsx`, `Icon.tsx`
- Added: `src/game/ui/styles/game.css`, `src/vite-env.d.ts`
- Modified: `src/game/ui/GameApp.tsx`, `src/game/main.tsx`
- Removed by move: `game/game.css`

## Self-review

- `SetupSubmission` is exactly `{ humanName, opponentIds, seedCode }`.
- Human seat is always first and is the only human; opponent seats follow selection order and use generic IDs (`human-1`, `opponent-<strategyId>`), with no domain-level `you` special case.
- Opponents are unique, selected state uses `aria-pressed`, all roster choices lock at three, and removing a selection makes it available again.
- Blank code generation is injected at the app boundary and uses browser cryptography; supplied code is normalized to uppercase and parsed before startup; invalid input is associated to an inline alert and blocks submission.
- The form uses native submit semantics, so Enter works; labels, descriptions, invalid state, focus visibility, and reduced-motion behavior are present.
- SVG markup is typed in `Icon.tsx`; no unsanitized HTML is used.
- No Match/Results UI or in-game Strategy Lens was introduced; the post-start view is a deliberately safe placeholder for the next task.

## Concerns

- The full baseline stylesheet was moved as requested, so unused future match/results selectors remain in the CSS until those screens are implemented; none of that UI is rendered by this task.
- Static avatar tokens are intentionally temporary and remain replaceable through the existing `avatar.src`/`avatar.alt` profile schema.
