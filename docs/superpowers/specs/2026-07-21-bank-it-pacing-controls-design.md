# Bank It Pacing Controls Design

**Status:** Approved  
**Date:** 2026-07-21

## Summary

Improve match pacing without changing game outcomes. The most recently committed dice remain visible until the next round begins. Rounds 1–9 stop at `round-complete` until the player explicitly starts the next round. An off-by-default Speed Mode removes presentation delays and nonessential animation while preserving the manual between-round pause.

## Approved behavior

- After a roll resolves, its dice remain visible for the rest of that round.
- Starting the next round clears the prior round's dice.
- After rounds 1–9 complete, automatic play stops.
- The bottom action reads `Start Round #X`, where `X` is the upcoming round number.
- Clicking the action dispatches the existing `ADVANCE_ROUND` domain command.
- Round 10 proceeds directly to Results; it never shows a start-round action.
- Speed Mode is a match-header toggle and defaults off.
- Speed Mode sets all presentation delays to zero and disables nonessential CSS animation and transition effects.
- Speed Mode never skips the between-round pause and never mutates rules, scores, dice, decisions, active seats, or turn order.
- The preference persists through rounds and Play Again, then resets when New Game returns to setup.

## Architecture

### Persistent dice

`RoundState` gains an optional immutable `lastDice` pair. `COMMIT_ROLL` copies the staged dice into `lastDice`. `ADVANCE_ROUND` constructs a fresh round without `lastDice`. Match presentation reads `pendingRoll?.dice ?? round.lastDice`, so animation state is no longer the source of lasting dice data.

### Manual round gate

The automatic runner continues to present bust, banking, and round-complete events, but does not delay and dispatch `ADVANCE_ROUND`. `selectLegalActions` exposes `canAdvanceRound` only during `round-complete`. `GameController.advanceRound()` dispatches the existing command. `DecisionDock` renders the single `Start Round #X` button from this legal action.

### Speed Mode

`GameApp` owns `speedMode` because it is a presentation preference. It passes zero timing to `useGameController` when enabled and passes the flag to `MatchScreen`. The match root receives a speed-mode class that suppresses nonessential animation and transitions. New Game turns the preference off before resetting the controller; rematches leave it unchanged.

## Accessibility

- The toggle is a semantic button with `aria-pressed` and visible On/Off text.
- `Start Round #X` is a standard keyboard-operable button with an exact accessible name.
- Persisted dice retain their existing accessible dice label.
- Speed Mode does not remove live result, pot, banking, bust, round, or winner announcements.

## Verification

- Reducer tests prove committed dice persist and clear only on `ADVANCE_ROUND`.
- Runner tests prove `round-complete` does not auto-advance.
- Selector/controller/UI tests prove the exact manual action and one dispatch.
- Speed tests prove default-off timing, zero-delay behavior, animation suppression class, rematch persistence, and New Game reset.
- The seeded Playwright journey uses `Start Round #X` for rounds 2–10 and still produces `458 / 780 / 360`.

