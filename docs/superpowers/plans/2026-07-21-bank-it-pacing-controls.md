# Bank It Pacing Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep committed dice visible, require an explicit start action between rounds, and add an off-by-default zero-animation Speed Mode.

**Architecture:** The domain persists the last committed dice but retains the existing `round-complete` and `ADVANCE_ROUND` lifecycle. Selectors expose manual round advancement, the controller dispatches it, and React owns Speed Mode as presentation-only state that swaps timing values and a CSS animation-suppression class.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, and Playwright.

## Global Constraints

- Do not change Bank It rules, seeded random consumption, scores, strategy decisions, active-seat rotation, or ten-round completion.
- One seed still determines the starting roller and every dice pair.
- Banking still removes a player for the current round only.
- Speed Mode defaults off, preserves the manual between-round pause, persists through Play Again, and resets on New Game.
- Round 10 proceeds directly to Results.
- Preserve `/`, `/learn`, the approved visual language, keyboard access, live announcements, and reduced-motion behavior.
- Follow test-driven development and commit each task after focused and regression verification.

---

### Task 1: Persist the last committed dice in round state

**Files:**
- Modify: `src/game/domain/types.ts`
- Modify: `src/game/domain/reducer.ts`
- Modify: `src/game/domain/reducer.test.ts`
- Modify: `src/game/ui/screens/MatchScreen.tsx`
- Modify: `src/game/ui/screens/MatchScreen.test.tsx`

**Interfaces:**
- Produces: `RoundState.lastDice?: readonly [number, number]`.
- Match dice source: `game.pendingRoll?.dice ?? game.round.lastDice`.

- [ ] **Step 1: Write failing reducer and screen tests**

Add tests that stage and commit `[3, 5]`, assert `pendingRoll` is cleared while `round.lastDice` remains `[3, 5]`, render the committed state after presentation returns to idle, and still find `Dice: 3 and 5`. Advance the round and assert `lastDice` is absent.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/game/domain/reducer.test.ts src/game/ui/screens/MatchScreen.test.tsx`
Expected: FAIL because `RoundState` does not retain committed dice and idle presentation renders the empty dice state.

- [ ] **Step 3: Implement the minimal domain-backed persistence**

Add the optional readonly field, set it from `current.pendingRoll.dice` in `COMMIT_ROLL`, omit it in newly created rounds, and use it as the non-staged UI fallback. Do not store dice in React state or consume randomness again.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run src/game/domain/reducer.test.ts src/game/ui/screens/MatchScreen.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/domain src/game/ui/screens/MatchScreen.tsx src/game/ui/screens/MatchScreen.test.tsx
git commit -m "fix: keep committed dice visible"
```

---

### Task 2: Pause between rounds behind a legal start action

**Files:**
- Modify: `src/game/domain/selectors.ts`
- Modify: `src/game/domain/selectors.test.ts`
- Modify: `src/game/application/aiTurnRunner.ts`
- Modify: `src/game/application/aiTurnRunner.test.ts`
- Modify: `src/game/application/useGameController.ts`
- Modify: `src/game/application/useGameController.test.tsx`
- Modify: `src/game/ui/components/DecisionDock.tsx`
- Modify: `src/game/ui/screens/MatchScreen.tsx`
- Modify: `src/game/ui/screens/MatchScreen.test.tsx`

**Interfaces:**
- Extends: `LegalActions` with `canAdvanceRound: boolean`.
- Extends: `GameController` with `advanceRound(): void`.
- Extends: `DecisionDock` with `nextRoundNumber` and `onAdvanceRound`.

- [ ] **Step 1: Write failing automatic-runner and legal-action tests**

Assert a `round-complete` automatic turn presents `RoundCompleted` but never dispatches `ADVANCE_ROUND`, even after timers drain. Assert `selectLegalActions` returns only `canAdvanceRound: true` in `round-complete` and false in all other phases.

- [ ] **Step 2: Write failing controller and UI tests**

Assert `advanceRound()` dispatches once from `round-complete`. Render round 1 complete and require one enabled button named `Start Round #2`; clicking it calls `advanceRound`. Assert no start-round button exists at `game-complete`.

- [ ] **Step 3: Verify RED**

Run: `npm test -- --run src/game/domain/selectors.test.ts src/game/application src/game/ui/screens/MatchScreen.test.tsx`
Expected: FAIL because the runner auto-advances and the controller/dock lack the manual action.

- [ ] **Step 4: Implement the manual gate**

Remove the automatic delay/dispatch in the `round-complete` branch while preserving event presentation. Add the selector flag and controller command wrapper. Render `Start Round #${game.round.roundNumber + 1}` from the legal action before observation-state branches, including when the human banked.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run src/game/domain/selectors.test.ts src/game/application src/game/ui/screens/MatchScreen.test.tsx && npm run typecheck`
Expected: PASS with no automatic `ADVANCE_ROUND` dispatch.

- [ ] **Step 6: Commit**

```bash
git add src/game/domain/selectors* src/game/application src/game/ui/components/DecisionDock.tsx src/game/ui/screens/MatchScreen*
git commit -m "feat: pause before each new round"
```

---

### Task 3: Add the off-by-default Speed Mode preference

**Files:**
- Modify: `src/game/application/timing.ts`
- Modify: `src/game/application/useGameController.ts`
- Modify: `src/game/application/useGameController.test.tsx`
- Create: `src/game/ui/components/SpeedModeToggle.tsx`
- Create: `src/game/ui/components/SpeedModeToggle.test.tsx`
- Modify: `src/game/ui/GameApp.tsx`
- Modify: `src/game/ui/GameApp.test.tsx`
- Modify: `src/game/ui/screens/MatchScreen.tsx`
- Modify: `src/game/ui/screens/MatchScreen.test.tsx`
- Modify: `src/game/ui/styles/game.css`
- Modify: `e2e/game.spec.ts`

**Interfaces:**
- Produces: exported immutable `ZERO_TIMING: GameTiming`.
- Extends: `MatchScreen` with `speedMode: boolean` and `onSpeedModeChange(enabled: boolean): void`.

- [ ] **Step 1: Write failing toggle and timing tests**

Assert the toggle defaults to `aria-pressed="false"` with visible `Speed Mode Off`, changes to On after activation, and calls the controlled callback. Assert GameApp passes normal timing by default, zero timing after enabling, retains the preference through Play Again, and resets it before New Game setup.

- [ ] **Step 2: Write failing match/CSS behavior tests**

Assert the match root receives `speed-mode` only while enabled and the toggle stays keyboard operable. Verify CSS contains a scoped speed-mode rule that disables animations and transitions without hiding live regions or actions.

- [ ] **Step 3: Verify RED**

Run: `npm test -- --run src/game/application/useGameController.test.tsx src/game/ui`
Expected: FAIL because the preference and toggle do not exist.

- [ ] **Step 4: Implement Speed Mode**

Export `ZERO_TIMING`. Own `speedMode` in GameApp, call `useGameController({ timing: speedMode ? ZERO_TIMING : undefined })`, pass controlled toggle props into MatchScreen, keep the value through Play Again, and set it false before `controller.reset()` on New Game/error recovery. Add `.speed-mode` animation/transition suppression scoped to the game screen.

- [ ] **Step 5: Update the public browser journey**

For every completed round 1–9, click the exact `Start Round #X` action before awaiting the next round. Add a separate public assertion that Speed Mode is Off initially and changes to On. Keep exact seeded final scores and reveals.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
python3 -m unittest -v test_bank_it.py
git diff --check
```

Expected: all tests pass; Playwright mobile and desktop complete all ten rounds with the explicit start actions; all three HTML entries build; Python remains 10/10.

- [ ] **Step 7: Commit**

```bash
git add src/game e2e/game.spec.ts
git commit -m "feat: add speed mode"
```
