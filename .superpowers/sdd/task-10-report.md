# Task 10 report: results, challenge-code reuse, and recoverable errors

## Outcome

Implemented the completed-match results route, selector-owned winner/ranking presentation,
selected-opponent strategy reveals, reusable versioned challenge code, seeded rematches, clean
new-game reset, and render-error recovery. The landing and learn pages were not modified.

## RED evidence

Command:

```text
npm test -- --run src/game/ui/screens/ResultsScreen.test.tsx src/game/ui/components/GameErrorBoundary.test.tsx
```

Observed both suites fail before production implementation because Vite could not resolve the
missing `ResultsScreen` and `GameErrorBoundary` modules. This was the expected Task 10 RED.

## GREEN evidence

Targeted Task 10 command after implementation:

```text
Test Files  2 passed (2)
Tests       8 passed (8)
```

Full fresh verification before commit:

```text
npm test -- --run
Test Files  15 passed (15)
Tests       162 passed (162)

npm run typecheck
tsc -b (exit 0)

npm run build
vite build (exit 0, 45 modules transformed)
```

The build produced `dist/index.html`, `dist/learn/index.html`, and `dist/game/index.html`. Vite
continued to show the pre-existing warning that the landing page's classic `script.js` tag cannot
be bundled without `type="module"`; it did not fail the build.

## Copy, replay, and error evidence

- Results tests inject rankings whose scores conflict with their supplied order and inject winners
  independently. The rendered winner and ordered list follow those selector outputs exactly.
- Single-winner and tied-winner copy are covered. Only strategy profiles in the completed config
  appear, and their `PlayerAvatar` metadata is used.
- Clipboard success calls `writeText` with the BK1 code and announces a polite success status.
  Clipboard rejection announces manual-copy guidance while the focusable, `user-select: text` code
  remains visible.
- Play Again keeps the exact ordered player definitions/controllers/names, makes exactly one
  browser-crypto call, creates a different BK1 code, and calls `controller.start(newConfig)` rather
  than `restart`. A one-call deterministic fallback prevents an unlikely crypto collision from
  reusing the old code.
- New Game calls controller reset. Reset aborts active presentation work, resets presentation, and
  clears engine state before Setup renders.
- Re-entering the old code through Setup is tested via public `createGame` and `transition` APIs;
  the first starter and first dice pair match the original old-code config without state mutation.
- The error boundary catches a throwing render child and exposes concise Restart recovery. Restart
  executes reset before clearing the boundary. A typed `COMMAND_NOT_ALLOWED` rejection renders as
  ordinary data and does not enter recovery.

## Styling and visual QA

The result implementation extends the approved existing trophy/confetti/ranking/action CSS. It
adds portrait-ready ranking and reveal avatar rows, a compact selectable-code panel, mobile stacking,
and an explicit reduced-motion rule that removes confetti.

Automated screenshot QA was attempted but blocked by the worker environment: the preferred
`agent-browser` CLI is absent, the in-app browser could not initialize its sandbox metadata, and
the installed Playwright package has no Chromium binary. No new browser binary was downloaded.
Responsive/result behavior remains covered by UI tests and static CSS/build verification.

## Files

- `src/game/ui/screens/ResultsScreen.tsx`
- `src/game/ui/screens/ResultsScreen.test.tsx`
- `src/game/ui/components/GameErrorBoundary.tsx`
- `src/game/ui/components/GameErrorBoundary.test.tsx`
- `src/game/ui/GameApp.tsx`
- `src/game/ui/GameApp.test.tsx`
- `src/game/application/useGameController.ts`
- `src/game/application/useGameController.test.tsx`
- `src/game/ui/screens/MatchScreen.test.tsx`
- `src/game/ui/styles/game.css`

## Self-review and concerns

- Domain ownership is preserved: no winner or ranking computation was added to UI code.
- The only controller surface added is `reset`; existing same-config `restart` behavior remains for
  the in-match restart dialog.
- Config and player ordering remain validated through `createConfig` for both setup and rematch.
- No test-only mutation API was added to production code.
- Concern: visual screenshot QA needs a worker/browser image with Chromium installed; this is the
  only unverified item. Automated tests, typecheck, build, static pages, and diff checks are green.
