# Bank It React Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete ten-round Bank It game at `/game` for one human and one to three deterministic fictional opponents, using a reproducible game seed and a pure TypeScript rules engine that already supports two to eight seats.

**Architecture:** A framework-free domain reducer owns rules, seeded randomness, active seats, simultaneous banking, scores, and winners. A React controller translates domain events into cancellable presentation timing, while setup, match, and result screens render typed view data without calculating outcomes. The repository remains a Vite multi-page app so the existing landing and learning HTML pages continue to work.

**Tech Stack:** Vite 8, React, TypeScript, Vitest, Testing Library, and Playwright.

## Global Constraints

- `/game` is the only page migrated to React in this plan; `/` and `/learn` remain static.
- A released match has exactly one human and one to three deterministic opponents.
- Every match has exactly ten rounds.
- The domain engine supports two to eight seats and never assumes a single human or a player ID/name of `you`.
- Banking removes a player from rolls and decisions for the rest of the current round only; every seat reactivates next round.
- All eligible Bank/Stay choices use one frozen snapshot and apply simultaneously.
- One versioned seed determines the starting roller and every dice pair; no ambient randomness is called after game creation.
- Opponent formulas and recommendations stay hidden during play and receive short plain-language reveals only on Results.
- No live-model API, backend, online multiplayer, mid-game teaching, match persistence, or research simulator UI is included.
- Preserve the approved mobile-first visual language in `game/game.css` while moving it into the React source tree.
- Preserve existing uncommitted user work and never stage unrelated changes.
- Use Node.js 20.19 or newer; the current workspace uses Node.js 26.5.0.

---

## File Structure

### Root toolchain and entries

- Create `package.json`: scripts and dependencies.
- Create `package-lock.json`: generated dependency lock.
- Create `tsconfig.json`: shared TypeScript project references.
- Create `tsconfig.app.json`: browser and React compiler settings.
- Create `tsconfig.node.json`: Vite configuration compiler settings.
- Create `vite.config.ts`: React plugin, tests, and three HTML build inputs.
- Create `playwright.config.ts`: browser test server and mobile/desktop projects.
- Modify `game/index.html`: minimal Vite entry with `#root` and `src/game/main.tsx`.
- Preserve `index.html` and `learn/index.html` as static build entries.

### Game feature

- Create `src/game/domain/types.ts`: domain types and discriminated unions.
- Create `src/game/domain/config.ts`: setup validation and normalized game configuration.
- Create `src/game/domain/random.ts`: versioned game-code and deterministic PRNG.
- Create `src/game/domain/rules.ts`: roll and pot rules.
- Create `src/game/domain/turns.ts`: active-seat traversal and round starters.
- Create `src/game/domain/decisions.ts`: frozen snapshots and simultaneous choice application.
- Create `src/game/domain/reducer.ts`: legal command transitions and domain events.
- Create `src/game/domain/selectors.ts`: legal actions, ranks, winners, and UI-facing derived state.
- Create `src/game/strategies/types.ts`: strategy boundary.
- Create `src/game/strategies/personalities.ts`: Mira, Knox, and Vega policies.
- Create `src/game/strategies/reveals.ts`: public personality and result copy.
- Create `src/game/application/timing.ts`: cancellable delay abstraction.
- Create `src/game/application/aiTurnRunner.ts`: automatic AI sequence.
- Create `src/game/application/useGameController.ts`: React reducer/controller adapter.
- Create `src/game/ui/GameApp.tsx`: screen selection and error boundary.
- Create `src/game/ui/screens/SetupScreen.tsx`: player, opponent, and seed setup.
- Create `src/game/ui/screens/MatchScreen.tsx`: live board composition.
- Create `src/game/ui/screens/ResultsScreen.tsx`: rankings, reveals, and game-code actions.
- Create focused components under `src/game/ui/components/` for avatars, dice, scoreboard, status, actions, dialogs, and seed fields.
- Move `game/game.css` to `src/game/ui/styles/game.css` and adapt selectors only where React state requires it.
- Create `src/game/main.tsx`: React root.

### Tests

- Create colocated `*.test.ts` and `*.test.tsx` files for domain, strategies, controller, and UI.
- Create `src/game/test/setup.ts`: DOM matcher setup.
- Create `e2e/game.spec.ts`: deterministic ten-round browser flow and responsive checks.

---

### Task 1: Establish the Vite multi-page React test shell

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/game/main.tsx`
- Create: `src/game/ui/GameApp.tsx`
- Create: `src/game/ui/GameApp.test.tsx`
- Create: `src/game/test/setup.ts`
- Modify: `game/index.html`
- Verify unchanged: `index.html`
- Verify unchanged: `learn/index.html`

**Interfaces:**
- Produces: Vite dev/build/test scripts and a React entry at `/game/`.
- Produces: `GameApp(): JSX.Element` as the feature root.

- [ ] **Step 1: Add package metadata and dependencies**

Create `package.json` with this exact baseline:

```json
{
  "name": "bank-it",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b",
    "test": "vitest",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Install React runtime plus Vite, TypeScript, Vitest, jsdom, Testing Library, and Playwright development dependencies:

```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/node @types/react @types/react-dom @playwright/test
```

Expected: `package.json` and `package-lock.json` exist; install exits 0.

- [ ] **Step 2: Configure TypeScript and Vite multi-page inputs**

Use the Vite 8 multi-page API verified in the official documentation:

```json
// tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

```ts
// vite.config.ts
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game/index.html'),
        learn: resolve(import.meta.dirname, 'learn/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/game/test/setup.ts'],
  },
});
```

Set `strict: true`, `noEmit: true`, `jsx: "react-jsx"`, browser libraries, and Vitest/Jest-DOM types in `tsconfig.app.json`. Include `src` and `vite.config.ts` through project references.

- [ ] **Step 3: Write the failing entry test**

```tsx
// src/game/ui/GameApp.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameApp } from './GameApp';

describe('GameApp', () => {
  it('renders the setup heading', () => {
    render(<GameApp />);
    expect(screen.getByRole('heading', { name: /choose your opponents/i })).toBeInTheDocument();
  });
});
```

Run: `npm test -- --run src/game/ui/GameApp.test.tsx`  
Expected: FAIL because `GameApp` and test setup do not exist.

- [ ] **Step 4: Add the minimal React entry**

Create `src/game/test/setup.ts` importing `@testing-library/jest-dom/vitest`. Make `GameApp` return a `<main>` with the setup heading. Make `src/game/main.tsx` create a root in `#root`. Replace `game/index.html` with a standard document containing `<div id="root"></div>` and `<script type="module" src="/src/game/main.tsx"></script>`.

- [ ] **Step 5: Verify all three page entries**

Run: `npm test -- --run src/game/ui/GameApp.test.tsx && npm run typecheck && npm run build`  
Expected: PASS; `dist/index.html`, `dist/game/index.html`, and `dist/learn/index.html` exist.

- [ ] **Step 6: Commit the shell**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts game/index.html src/game
git commit -m "build: establish React game shell"
```

---

### Task 2: Define generic game configuration and domain types

**Files:**
- Create: `src/game/domain/types.ts`
- Create: `src/game/domain/config.ts`
- Create: `src/game/domain/config.test.ts`

**Interfaces:**
- Produces: `PlayerId`, `StrategyId`, `PlayerDefinition`, `PlayerState`, `Controller`, `GameConfigInput`, `GameConfig`, `GameState`, `RoundState`, `DecisionSnapshot`, `Command`, `DomainEvent`, `ConfigResult`, and `TransitionResult`.
- Produces: `createConfig(input: GameConfigInput): ConfigResult`.

- [ ] **Step 1: Write setup validation tests**

Cover two and eight valid seats, rejection of one or nine seats, duplicate IDs, duplicate seat indexes, zero or several humans as domain-valid configurations, and enforcement of ten rounds for the released rules version.

```ts
expect(createConfig({ rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: twoPlayers }).ok).toBe(true);
expect(createConfig({ rounds: 10, seedCode: 'BK1-AAKD-JXV2', players: onePlayer })).toEqual({
  ok: false,
  error: { code: 'INVALID_PLAYER_COUNT', message: 'Bank It requires 2 to 8 players.' },
});
```

Run: `npm test -- --run src/game/domain/config.test.ts`  
Expected: FAIL because the modules do not exist.

- [ ] **Step 2: Define the discriminated domain types**

Define `StrategyId = 'mira' | 'knox' | 'vega'`. Use controller variants `{ type: 'human' }` and `{ type: 'strategy'; strategyId: StrategyId }`. Define phases `awaiting-roll`, `resolving-roll`, `awaiting-decisions`, `resolving-decisions`, `round-complete`, and `game-complete`. Define decisions as `bank | stay`; never add a special human ID.

- [ ] **Step 3: Implement configuration normalization**

Sort players by `seatIndex`, reject duplicate IDs/indexes, require integer seat indexes, and return immutable normalized definitions. Do not enforce the v1 one-human limit here; that belongs to `SetupScreen` validation.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- --run src/game/domain/config.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit the domain contract**

```bash
git add src/game/domain
git commit -m "feat: define generic game domain"
```

---

### Task 3: Add one versioned seed and deterministic dice stream

**Files:**
- Create: `src/game/domain/random.ts`
- Create: `src/game/domain/random.test.ts`

**Interfaces:**
- Produces: `RandomState { version: 1; seed: number; value: number; draws: number }`.
- Produces: `createRandomState(seed: number): RandomState`.
- Produces: `nextUint32(state): { state: RandomState; value: number }`.
- Produces: `nextInt(state, min, max): { state: RandomState; value: number }`.
- Produces: `rollDice(state): { state: RandomState; dice: readonly [number, number] }`.
- Produces: `formatGameCode(seed): string`, `parseGameCode(code): SeedResult`, and `generateGameCode(crypto): string`.

- [ ] **Step 1: Write deterministic and validation tests**

Test a fixed seed against a checked-in sequence of five `uint32` values and five dice pairs. Test that the starting state plus equal call counts always match, values remain 1–6, malformed prefixes/characters are rejected, formatting round-trips, and `generateGameCode` calls `getRandomValues` exactly once.

```ts
expect(takeUint32(createRandomState(0x12345678), 5).values).toEqual([
  2274908837, 358294691, 1210119364, 2176035992, 1882851208,
]);
expect(takeDice(createRandomState(0x12345678), 5).dice).toEqual([
  [6, 6], [5, 3], [5, 6], [4, 4], [6, 4],
]);
expect(parseGameCode(formatGameCode(0x12345678))).toEqual({ ok: true, seed: 0x12345678 });
```

Run: `npm test -- --run src/game/domain/random.test.ts`  
Expected: FAIL because `random.ts` does not exist.

- [ ] **Step 2: Implement a stable v1 generator**

Use a documented 32-bit xorshift transition and rejection sampling for bounded integers. Treat the all-zero internal value as `0x6d2b79f5`. Encode the unsigned seed with alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` under `BK1-XXXX-XXXX`; reject codes whose decoded value exceeds `0xffffffff`.

```ts
const nextValue = (value: number): number => {
  let x = value || 0x6d2b79f5;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
};
```

- [ ] **Step 3: Confirm the compatibility fixtures**

Keep the literal `uint32` and dice values from Step 1 unchanged. Add a comment above them that changing these values requires a new `BK2` prefix.

- [ ] **Step 4: Run random tests and typecheck**

Run: `npm test -- --run src/game/domain/random.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit deterministic randomness**

```bash
git add src/game/domain/random.ts src/game/domain/random.test.ts
git commit -m "feat: add reproducible game seeds"
```

---

### Task 4: Port dice, pot, and active-turn rules from Python

**Files:**
- Create: `src/game/domain/rules.ts`
- Create: `src/game/domain/rules.test.ts`
- Create: `src/game/domain/turns.ts`
- Create: `src/game/domain/turns.test.ts`

**Interfaces:**
- Produces: `resolveRoll(input: RollInput): RollOutcome`.
- Produces: `nextActivePlayer(seatOrder, activeIds, afterId): PlayerId`.
- Produces: `roundStarter(seatOrder, firstStarterIndex, roundNumber): PlayerId`.

- [ ] **Step 1: Write Python-parity roll tests**

```ts
expect(resolveRoll({ pot: 0, rollNumber: 1, dice: [3, 4] })).toMatchObject({ pot: 70, busted: false });
expect(resolveRoll({ pot: 13, rollNumber: 4, dice: [1, 6] })).toMatchObject({ pot: 13, busted: true });
expect(resolveRoll({ pot: 78, rollNumber: 4, dice: [4, 4] })).toMatchObject({ pot: 156, busted: false, dangerRollsAdded: 1 });
```

Also cover normal sums, doubles during safe rolls not doubling, and invalid dice/roll inputs.

- [ ] **Step 2: Write turn traversal tests**

Test clockwise traversal, wraparound, skipping one or several banked seats, one remaining active player, and rotating the round starter independently of who banked last round.

Run: `npm test -- --run src/game/domain/rules.test.ts src/game/domain/turns.test.ts`  
Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement pure rules and turns**

Return structured outcomes rather than mutating state. A danger seven must preserve the pre-bust pot in the outcome for narration while marking the round busted. `nextActivePlayer` must throw an invariant error only when called with an empty active set.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run src/game/domain/rules.test.ts src/game/domain/turns.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit rules**

```bash
git add src/game/domain/rules* src/game/domain/turns*
git commit -m "feat: port Bank It roll and turn rules"
```

---

### Task 5: Port fictional opponent strategies behind one boundary

**Files:**
- Create: `src/game/strategies/types.ts`
- Create: `src/game/strategies/personalities.ts`
- Create: `src/game/strategies/personalities.test.ts`
- Create: `src/game/strategies/reveals.ts`

**Interfaces:**
- Consumes: `StrategyId` from `src/game/domain/types.ts`.
- Produces: `StrategyContext` equivalent to Python `GameView`.
- Produces: `Strategy { id; decide(context): Decision }`.
- Produces: `getStrategy(id): Strategy`.
- Produces: `OPPONENT_PROFILES` containing setup copy, avatar metadata, and result reveal copy.

- [ ] **Step 1: Write policy parity tests**

Test Mira/State Delta target cases from Python (`-500` in round 5 at four seats banks at 340; `+200` in round 2 banks at 145), Knox banking after a danger double or at the 250/8-roll caps, and Vega banking at 200 but not 199.

Run: `npm test -- --run src/game/strategies/personalities.test.ts`  
Expected: FAIL because strategy modules do not exist.

- [ ] **Step 2: Implement the strategy-only context and formulas**

Port `state_aware_target`, Double Hunter, and Fixed Pot 200 literally. Use exhaustive `StrategyId = 'mira' | 'knox' | 'vega'`. Do not pass seed state, future dice, pending choices, React state, or timers into `StrategyContext`.

- [ ] **Step 3: Add public profile/reveal data**

Setup descriptions are personality-only. Results reveal `State Delta`, `Double Hunter`, or `Fixed 200` plus the approved one-sentence explanation. Define `avatar.src`, `avatar.alt`, and `accent` fields so future cartoon sci-fi portrait assets can replace the initial avatar tokens without changing the profile schema.

- [ ] **Step 4: Run strategy tests**

Run: `npm test -- --run src/game/strategies/personalities.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit opponents**

```bash
git add src/game/strategies
git commit -m "feat: add deterministic opponent personalities"
```

---

### Task 6: Implement simultaneous decisions and the complete reducer

**Files:**
- Create: `src/game/domain/decisions.ts`
- Create: `src/game/domain/decisions.test.ts`
- Create: `src/game/domain/reducer.ts`
- Create: `src/game/domain/reducer.test.ts`
- Create: `src/game/domain/fixtures.ts`

**Interfaces:**
- Consumes: random, rules, turns, configuration, and strategies from Tasks 2–5.
- Produces: `createGame(config): GameState`.
- Produces: `transition(state, command): TransitionResult`.
- Produces: `freezeDecisionSnapshot(state): DecisionSnapshot`.
- Produces: `applyDecisions(state, decisions): GameState`.

- [ ] **Step 1: Write frozen-snapshot tests**

Create a four-seat fixture with two humans and two strategies. Assert every decision sees the same pot/scores/active IDs; applying a bank for seats 0 and 2 credits both with the same pot and removes both together. Assert a banked seat cannot submit again, cannot roll, and is active again after `ADVANCE_ROUND`.

- [ ] **Step 2: Write reducer phase tests**

Cover game creation, seeded starting roller, safe rolls 1–2 automatically returning to `awaiting-roll`, safe roll 3 opening decisions, danger seven entering `round-complete`, all-banked completion, AI-only continuation after the human banks, ten-round completion, ties, and restart.

For each phase, dispatch one illegal command and assert:

```ts
expect(result).toEqual({
  ok: false,
  state,
  error: { code: 'COMMAND_NOT_ALLOWED', command: 'ROLL_DICE', phase: 'awaiting-decisions' },
});
```

Run: `npm test -- --run src/game/domain/decisions.test.ts src/game/domain/reducer.test.ts`  
Expected: FAIL because decision and reducer modules do not exist.

- [ ] **Step 3: Implement decision collection and simultaneous commit**

Store `pendingPlayerIds` and submitted decisions on the frozen snapshot. `SUBMIT_DECISION` records but does not apply a choice. `RESOLVE_STRATEGY_DECISIONS` fills AI choices from the same snapshot. `COMMIT_DECISIONS` applies every bank together, emits `PlayerBanked` events, then selects the next active roller or ends the round.

- [ ] **Step 4: Implement the reducer lifecycle**

`ROLL_DICE` consumes the next pair and enters `resolving-roll`; `COMMIT_ROLL` applies the outcome after presentation. Use typed events including `DiceRolled`, `RoundBusted`, `PlayerBanked`, `RoundCompleted`, and `GameCompleted`. Reset active IDs for every new round and rotate the starter from the original seeded index.

- [ ] **Step 5: Add Python golden fixtures**

Port the fixed sequences from `test_bank_it.py` and assert final scores `[78, 78]`, `[0, 0]`, and `[156, 156]` with matching strategy choices. Add the ten-round `BK1-AAKD-JXV2` fixture with seats Human/Mira/Vega, the human banking at the first eligible choice each round, seeded first seat `2`, and final scores `[458, 780, 360]`.

- [ ] **Step 6: Run the complete domain suite**

Run: `npm test -- --run src/game/domain src/game/strategies && npm run typecheck`  
Expected: PASS, including parameterized 2–8-seat invariants.

- [ ] **Step 7: Verify Python remains green**

Run: `python3 -m unittest -v test_bank_it.py`  
Expected: 10 tests PASS.

- [ ] **Step 8: Commit the engine**

```bash
git add src/game/domain src/game/strategies
git commit -m "feat: implement deterministic Bank It engine"
```

---

### Task 7: Add selectors and a cancellable React game controller

**Files:**
- Create: `src/game/domain/selectors.ts`
- Create: `src/game/domain/selectors.test.ts`
- Create: `src/game/application/timing.ts`
- Create: `src/game/application/aiTurnRunner.ts`
- Create: `src/game/application/aiTurnRunner.test.ts`
- Create: `src/game/application/useGameController.ts`
- Create: `src/game/application/useGameController.test.tsx`

**Interfaces:**
- Produces: `selectRankings`, `selectWinners`, `selectLegalActions`, `selectCurrentPlayer`, and `selectDecisionLabels`.
- Produces: `GameController { state; presentation; start; roll; submitDecision; restart }`.
- Produces: `runAutomaticTurn(controller, timing, signal): Promise<void>`.

- [ ] **Step 1: Write selector tests**

Assert stable tie ranking, multiple winners, no actions in resolving phases, `Roll On / Bank` when a human is the next roller, `Stay In / Bank` when an AI rolls next, and no direct actions after the released human banks.

- [ ] **Step 2: Write fake-time controller tests**

Assert AI thinking precedes roll, dice animation precedes `COMMIT_ROLL`, strategy reveal precedes `COMMIT_DECISIONS`, and an `AbortController` prevents every pending dispatch after restart/unmount.

Run: `npm test -- --run src/game/domain/selectors.test.ts src/game/application`  
Expected: FAIL because selectors/controller modules do not exist.

- [ ] **Step 3: Implement pure selectors**

Derive all labels, ranks, winners, and enabled actions from domain state. Do not copy scores, rankings, legal actions, or current player into React state.

- [ ] **Step 4: Implement timing and AI sequencing**

Expose `delay(ms, signal)` that rejects with `AbortError` on cancellation. Sequence only presentation; every outcome must enter through `transition`. Keep durations in one `TIMING` object and set them to zero under reduced motion or tests.

- [ ] **Step 5: Implement `useGameController`**

Use React `useReducer` for domain transitions and a small presentation-state reducer for current narration/animation. Track the active abort controller in a ref; abort it before restart and cleanup. Derive values with selectors rather than storing redundant state, following current React guidance.

- [ ] **Step 6: Run controller tests**

Run: `npm test -- --run src/game/domain/selectors.test.ts src/game/application && npm run typecheck`  
Expected: PASS with no unhandled timer promises.

- [ ] **Step 7: Commit the application boundary**

```bash
git add src/game/domain/selectors* src/game/application
git commit -m "feat: add cancellable game controller"
```

---

### Task 8: Build the setup screen and v1 validation

**Files:**
- Create: `src/game/ui/screens/SetupScreen.tsx`
- Create: `src/game/ui/screens/SetupScreen.test.tsx`
- Create: `src/game/ui/components/PlayerAvatar.tsx`
- Create: `src/game/ui/components/GameCodeField.tsx`
- Create: `src/game/ui/components/Icon.tsx`
- Modify: `src/game/ui/GameApp.tsx`
- Move: `game/game.css` to `src/game/ui/styles/game.css`
- Modify: `src/game/main.tsx`

**Interfaces:**
- Consumes: opponent profiles, `parseGameCode`, and controller `start`.
- Produces: `SetupSubmission { humanName; opponentIds; seedCode }`.

- [ ] **Step 1: Write setup interaction tests**

Test one human name, selection of one to three unique opponents, disabled Start with zero opponents, rejection of a fourth opponent, valid challenge code, inline invalid-code error, generated code when blank, and keyboard submission.

Run: `npm test -- --run src/game/ui/screens/SetupScreen.test.tsx`  
Expected: FAIL because the screen does not exist.

- [ ] **Step 2: Build controlled setup components**

Use generic opponent IDs and profile data. Enforce exactly one human and one to three AIs in this screen only. On submit, create ordered seats with the human first and selected strategies after it, then pass the normalized input to `start`.

- [ ] **Step 3: Migrate the approved setup styling**

Move the existing CSS file, import it from `main.tsx`, and reproduce the approved header, lineup cards, AI roster, local-strategy note, responsive two-column desktop layout, focus styles, and reduced-motion block. Keep SVG icons in `Icon.tsx`; do not inject unsanitized HTML.

- [ ] **Step 4: Run setup and visual shell tests**

Run: `npm test -- --run src/game/ui && npm run typecheck && npm run build`  
Expected: PASS; `/game/` build references hashed React assets.

- [ ] **Step 5: Commit setup UI**

```bash
git add game/index.html src/game/ui src/game/main.tsx
git commit -m "feat: build game setup experience"
```

---

### Task 9: Build the match board and decision flow

**Files:**
- Create: `src/game/ui/screens/MatchScreen.tsx`
- Create: `src/game/ui/screens/MatchScreen.test.tsx`
- Create: `src/game/ui/components/DicePair.tsx`
- Create: `src/game/ui/components/PotDisplay.tsx`
- Create: `src/game/ui/components/Scoreboard.tsx`
- Create: `src/game/ui/components/TurnNarrator.tsx`
- Create: `src/game/ui/components/DecisionDock.tsx`
- Create: `src/game/ui/components/RestartDialog.tsx`
- Modify: `src/game/ui/GameApp.tsx`
- Modify: `src/game/ui/styles/game.css`

**Interfaces:**
- Consumes: `GameController`, selectors, domain events, and opponent profiles.
- Produces: controlled Roll, Stay, Bank, and Restart actions.

- [ ] **Step 1: Write match rendering and control tests**

Test round `1/10`, pot and dice, current roller, ranked scores, safe-roll banking suppression, `Roll On / Bank`, `Stay In / Bank`, automatic-control state during AI sequences, banked-row status, no human controls after banking, restart confirmation, and eight-row scoreboard rendering without truncating names or scores.

Run: `npm test -- --run src/game/ui/screens/MatchScreen.test.tsx`  
Expected: FAIL because match components do not exist.

- [ ] **Step 2: Implement controlled board components**

Every button uses `selectLegalActions`; disabled state must not be inferred from CSS. Scoreboard rows use player IDs as keys. Announce roll, bank, bust, round, and game events through one polite live region without announcing purely visual animation states.

- [ ] **Step 3: Connect the decision dock**

Before roll three, show only the rolling action. After eligible rolls, bind Bank and Stay/roll-on labels from `selectDecisionLabels`. When the human has banked, replace the dock with an observation status while automatic AI play continues for the remainder of that round. Restore human decisions when the next round reactivates the seat.

- [ ] **Step 4: Apply responsive and reduced-motion styling**

Retain amber tactile actions, slate surfaces, dice, compact mobile board, and desktop information rail. Remove the current in-game Strategy Lens because the approved scope defers teaching until results. Make eight score rows vertically scroll within the board on short screens; never add horizontal scrolling.

- [ ] **Step 5: Run match tests and build**

Run: `npm test -- --run src/game/ui/screens/MatchScreen.test.tsx src/game/application && npm run typecheck && npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit the match experience**

```bash
git add src/game/ui
git commit -m "feat: build playable match interface"
```

---

### Task 10: Build results, challenge-code reuse, and recoverable errors

**Files:**
- Create: `src/game/ui/screens/ResultsScreen.tsx`
- Create: `src/game/ui/screens/ResultsScreen.test.tsx`
- Create: `src/game/ui/components/GameErrorBoundary.tsx`
- Create: `src/game/ui/components/GameErrorBoundary.test.tsx`
- Modify: `src/game/ui/GameApp.tsx`
- Modify: `src/game/ui/styles/game.css`

**Interfaces:**
- Consumes: winner/ranking selectors, opponent reveals, seed code, restart/new-game controller methods.
- Produces: Copy Game Code, Play Again with a new seed, and New Game actions.

- [ ] **Step 1: Write results and replay tests**

Cover single winner, tied winners, ordered final rankings, selected-opponent reveals only, copy success/failure status, Play Again retaining lineup with a different code, New Game returning to setup, and re-entering the old code recreating its first roller/dice sequence.

- [ ] **Step 2: Write error-boundary tests**

Render a throwing child, assert a concise recovery screen, activate Restart, and assert a clean Setup screen. Verify expected typed command rejections do not trigger the error boundary.

Run: `npm test -- --run src/game/ui/screens/ResultsScreen.test.tsx src/game/ui/components/GameErrorBoundary.test.tsx`  
Expected: FAIL because result/error components do not exist.

- [ ] **Step 3: Implement Results and copy feedback**

Use rankings and winner selectors without recomputation. Show the versioned code as selectable text even if Clipboard API access fails. Results reveal only the strategies for opponents in the completed match.

- [ ] **Step 4: Implement replay semantics and error recovery**

Play Again creates a new crypto seed with the same ordered lineup. New Game clears the controller to Setup. Error recovery aborts presentation work before resetting.

- [ ] **Step 5: Add portrait-ready result styling**

Keep cartoon sci-fi avatars behind `PlayerAvatar` metadata. Preserve trophy, confetti, ranking, and action hierarchy; reduced motion suppresses confetti movement.

- [ ] **Step 6: Run UI tests and build**

Run: `npm test -- --run src/game/ui && npm run typecheck && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit results**

```bash
git add src/game/ui
git commit -m "feat: add results and seeded rematches"
```

---

### Task 11: Add deterministic browser coverage and final documentation

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/game.spec.ts`
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the complete `/game` experience.
- Produces: reproducible browser verification and operator instructions.

- [ ] **Step 1: Configure browser projects**

Configure Playwright to run `npm run dev -- --host 127.0.0.1`, reuse no stale server in CI, and test a 375×812 mobile viewport plus a 1280×900 desktop viewport. Store screenshots/traces only on failure under ignored output directories.

- [ ] **Step 2: Write the failing seeded browser journey**

The test enters `BK1-AAKD-JXV2`, selects Mira and Vega in that order, starts, chooses Bank at the first eligible choice in every round, completes ten rounds, and asserts final scores Human `458`, Mira `780`, and Vega `360` plus both opponent reveals. Add assertions that mobile and desktop document widths equal their viewport widths.

Run: `npm run test:e2e -- --project=mobile`  
Expected: PASS through Results with the checked-in scores and no horizontal overflow.

- [ ] **Step 3: Run the same public flow on desktop**

Run: `npm run test:e2e -- --project=desktop`  
Expected: PASS through Results at 1280×900 with the action dock visible. Both projects must use accessible roles and public controls; no test-only game-state mutation hook is allowed.

- [ ] **Step 4: Document local operation and challenge codes**

Update `README.md` with `npm install`, `npm run dev`, `/game/`, `npm test`, `npm run test:e2e`, and `npm run build`. Explain that `BK1` codes reproduce dice streams, while exact match replay also requires the lineup and human decisions. Add `test-results/` and `playwright-report/` to `.gitignore`.

- [ ] **Step 5: Run the full verification suite**

Run:

```bash
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
python3 -m unittest -v test_bank_it.py
git diff --check
```

Expected: all JavaScript/TypeScript tests pass, all browser projects pass, all 10 Python tests pass, all three HTML entries build, and `git diff --check` prints nothing.

- [ ] **Step 6: Inspect final mobile and desktop screenshots**

Confirm setup, match, and results screens preserve the approved design; controls remain visible at 375×812; the desktop information layout does not obscure the action dock; an eight-seat scoreboard stays usable; and reduced-motion mode has no nonessential animation.

- [ ] **Step 7: Commit browser coverage and docs**

```bash
git add playwright.config.ts e2e README.md .gitignore
git commit -m "test: verify complete seeded game flow"
```

---

## Final Acceptance Checklist

- [ ] `/`, `/game/`, and `/learn/` all build and load.
- [ ] Setup permits one human plus one to three unique fictional opponents.
- [ ] The engine passes parameterized tests for two through eight generic seats.
- [ ] Ten-round rules match Python for safe seven, danger seven, doubles, banking, bust protection, and active-seat rotation.
- [ ] A banked player cannot roll or decide again until the next round.
- [ ] Every banking cycle freezes one snapshot and applies choices simultaneously.
- [ ] One `BK1` seed controls the first roller and every dice pair.
- [ ] AI turns animate automatically and restart cancels stale sequences.
- [ ] No opponent formula or recommendation appears during play.
- [ ] Results show rankings, seed copy, and brief selected-opponent reveals.
- [ ] Mobile, desktop, keyboard, screen-reader status, and reduced-motion checks pass.
- [ ] Existing Python tests and static pages remain intact.
