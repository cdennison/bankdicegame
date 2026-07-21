# Bank It React Game Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-20

## Summary

Port the playable Bank It rules from `bank_it.py` into a modular, client-only React and TypeScript application. The first release supports one local human playing a ten-round match against one to three deterministic fictional opponents. The domain engine is designed from the start for two to eight seats and future shared-device pass-and-play with multiple humans.

The React interface presents the existing mobile-first visual direction. Game rules, strategies, randomness, and scoring remain in a framework-free TypeScript domain layer. React controls presentation timing but never decides game outcomes.

## Goals

- Deliver a complete ten-round playable match at `/game`.
- Preserve the rules and decision timing already tested in Python.
- Make every match reproducible from one visible, shareable seed.
- Keep game rules independently testable without React or browser APIs.
- Give deterministic opponents distinct fictional personalities while revealing their actual strategies only after the match.
- Support two to eight generic seats in the engine so multiple local humans can be added without redesigning rules or turn order.
- Keep the current landing and learning pages working while allowing their later migration into the React project.

## Non-goals for the first release

- Live model or network-backed AI opponents.
- Online multiplayer.
- More than one human in the released setup flow.
- Tournament, Monte Carlo, matrix, or policy-research interfaces.
- Mid-game strategy teaching, recommendations, or formula disclosure.
- Full roll-by-roll post-game analysis.
- Match persistence across page reloads.
- Final illustrated character portraits; v1 uses replaceable designed avatars.
- Migrating the landing or learning pages to React.

## Product decisions

- Stack: Vite, React, and TypeScript.
- Scope: `/game` becomes React first; `/` and `/learn` remain unchanged.
- Released table size: two to four seats with exactly one human.
- Domain table size: two to eight seats with any mixture of human and strategy controllers.
- Match length: ten rounds.
- Opponents: deterministic strategies with fictional names and personalities.
- AI pacing: automated turns with brief thinking and action-reveal animations.
- Teaching: no strategy guidance during play; results contain only short opponent reveals.
- Multiplayer direction: shared-device pass-and-play, not online multiplayer.

## Rules source of truth

The TypeScript engine must match `play_game` in `bank_it.py`.

1. A table has two to eight ordered seats.
2. The first roller is selected from the game seed. The starting seat rotates by one position each round, matching the Python implementation.
3. Only active players roll. Turn rotation skips players who have banked in the current round.
4. The first three rolls of a round are safe.
5. During a safe roll, a total of seven adds 70 to the shared pot; every other total adds its face value.
6. Nobody may bank before the third safe roll has resolved.
7. Starting with roll four, a total of seven immediately busts the round. Unbanked players receive no points from that round; previously banked points remain protected.
8. Starting with roll four, doubles double the entire pot. Other non-seven rolls add their face value.
9. After each completed, non-busting roll from roll three onward, every active player chooses Bank or Stay using the same frozen decision snapshot.
10. All submitted banking decisions apply together. A banking player adds the current pot to their score and exits the active set for the remainder of that round.
11. A banked player cannot roll, submit another decision, or be selected as the next roller during that round.
12. If every player banks, the round ends immediately. If active players remain, play rotates to the next active seat.
13. All players become active again at the beginning of the next round.
14. After ten rounds, the highest score wins. Tied winners are supported.

## Architecture

### Domain layer

The domain layer is pure TypeScript. It has no React imports, timers, DOM calls, storage access, or ambient random calls.

- `types`: game configuration, game state, players, controllers, phases, commands, events, and transition results.
- `rules`: dice resolution, safe-zone and danger-zone pot calculations, banking, busts, and round completion.
- `reducer`: validates a command against the current phase and returns the next immutable state plus domain events.
- `turns`: active-seat selection, clockwise rotation, round starters, and banked-seat skipping.
- `decisions`: freezes a decision snapshot, collects choices, and applies them simultaneously.
- `selectors`: legal actions, rankings, winners, current roller, active players, and presentation-ready derived values.
- `random`: the versioned seeded generator and seed-code parser/formatter.

The central contract is conceptually:

`GameState + Command + RandomSource -> TransitionResult`

A successful transition contains the next state and a list of domain events. A rejected transition contains the unchanged state and a typed rejection reason.

### Strategy layer

Each AI controller references a strategy identifier. A strategy receives only an immutable `StrategyContext`, equivalent to Python's `GameView`, and returns Bank or Stay.

The context contains the pot, roll number, danger-roll count, round, total rounds, own score, opponent scores, active and total opponent counts, and whether the last danger roll was a double. Strategies cannot access React state, timers, future dice, the seed generator, or another player's unsubmitted choice.

### Application layer

`useGameController` connects React to the pure engine. It:

- Dispatches commands and exposes state plus selectors.
- Converts domain events into presentation sequences.
- Adds AI thinking, dice, banking, bust, and round-transition delays.
- Automatically advances AI-controlled rollers.
- Collects the released version's single human choice.
- Allows future pass-and-play controllers to collect several private human choices.
- Cancels every pending timer or animation sequence on restart, navigation, or unmount.

Presentation timing cannot mutate scores, the pot, active seats, or turn order directly.

### React UI layer

The UI is organized by screen and composed from typed, controlled components.

- `SetupScreen`: human name, opponent selection, optional challenge code, and game start.
- `MatchScreen`: round status, current roller, pot and dice, scoreboard, narrator, opponent reactions, and decision dock.
- `ResultsScreen`: winner, final ranking, game-code copy action, brief opponent strategy reveals, Play Again, and New Game.
- Shared components: player avatar, player row, button, dialog, game code field, and status announcement.

React components do not calculate scores, ranks, legal moves, or AI decisions.

## Proposed feature-first source layout

```text
src/
  game/
    domain/
      types.ts
      rules.ts
      reducer.ts
      turns.ts
      decisions.ts
      selectors.ts
      random.ts
    strategies/
      types.ts
      personalities.ts
      reveals.ts
    application/
      useGameController.ts
      aiTurnRunner.ts
      timing.ts
    ui/
      screens/
        SetupScreen.tsx
        MatchScreen.tsx
        ResultsScreen.tsx
      components/
      styles/
    main.tsx
```

Focused test files live beside or directly under each module rather than in one monolithic test file.

## State model

### Game configuration

- Rules and PRNG version.
- Ten rounds.
- Two to eight ordered player definitions.
- One seed code.

### Player

- Stable ID.
- Display name.
- Seat index.
- Accumulated score.
- Controller: local human or deterministic strategy.
- Portrait/avatar metadata used only for presentation.

No domain behavior may identify the human by name, assume an ID such as `you`, or assume only one human exists.

### Round state

- Round number and starting seat.
- Current roller ID.
- Shared pot.
- Roll number and danger-roll count.
- Last dice pair and whether it was a danger double.
- Active player IDs.
- Frozen decision snapshot when choices are open.
- Pending player IDs and submitted decisions.

Banking removes a player from `activePlayerIds` for the current round only. Starting the next round restores every seat to the active set.

### Phases

- `awaiting-roll`: an active seat may roll; AI rollers are advanced by the controller.
- `resolving-roll`: the engine applies dice rules and emits roll outcomes.
- `awaiting-decisions`: eligible active players submit Bank or Stay against a frozen snapshot.
- `resolving-decisions`: strategies are evaluated and all choices apply together.
- `round-complete`: the controller presents the result before advancing.
- `game-complete`: scores are final and no gameplay command is legal.

Animation labels such as “thinking” or “rolling” belong to controller presentation state, not domain phases.

## Command and event flow

Primary commands are:

- Start Game.
- Roll Dice.
- Submit Decision for a player.
- Resolve Strategy Decisions.
- Commit Decisions.
- Advance Round.
- Restart.

A typical eligible roll follows this sequence:

1. The human taps Roll, or the controller advances an AI roller.
2. The engine consumes the next deterministic dice pair and resolves the pot.
3. A danger seven ends the round immediately. Otherwise, the engine freezes the decision snapshot.
4. Each active human controller submits Bank or Stay. V1 has one such controller.
5. Each active strategy controller evaluates the same snapshot.
6. The engine applies all bank choices together.
7. It either ends the round or selects the next active roller.

For future pass-and-play, human decisions are collected behind a privacy handoff and are not applied until every active controller has responded.

## Decision controls

The action dock reflects legal engine actions.

- Before safe roll three resolves: only rolling is available.
- When the human will be the next roller: `Roll On` or `Bank`.
- When an AI will be the next roller: `Stay In` or `Bank`.
- After the human banks: direct controls disappear, and the remaining AI play advances automatically.

## Deterministic game seeds

Every game has one seed and one versioned PRNG stream. The production adapter uses browser cryptography once to create a seed; the match never calls ambient randomness again.

The seed determines:

- The initial first roller.
- Every subsequent dice pair in consumption order.

The seed and current generator position are part of game state. A short visible code such as `BK1-7K3M-9Q2D` encodes the rules/PRNG version and seed. Setup accepts a valid code or generates a new one. Results allow copying the code.

The same code always reproduces the same starting seat and nth dice pair for the same version. Reproducing an entire played match also requires the player configuration and human decision log because decisions affect how many rolls a round consumes.

Old codes must retain their roll sequence. A future random algorithm or rules change requires a new version prefix rather than silently changing existing codes.

## Fictional opponents

### Mira

- Setup personality: quiet confidence; appears one move ahead.
- Hidden policy: State Delta.
- Result reveal: changes her target using score gap, rounds remaining, and table size.

### Knox

- Setup personality: treats every roll as a dare.
- Hidden policy: Double Hunter.
- Result reveal: chases a danger-zone double with a pot and roll-count safety cap.

### Vega

- Setup personality: unshakable and difficult to read.
- Hidden policy: Fixed Pot 200.
- Result reveal: uses the strongest simple baseline from the original experiments.

Setup and match screens do not expose formulas, target amounts, probability recommendations, or model names. Results reveal one short plain-language description for each selected opponent.

## Portrait direction

The portrait system must support replaceable image assets without changing players or strategies. The future art set is cartoonish science fiction, not photorealistic. Characters need distinct silhouettes, color identities, expressive faces, and a teen-oriented tone. Static v1 avatars may later expand to rolling, banking, bust, and victory variants through presentation metadata only.

## Results and replay actions

- Final rankings support a single winner or ties.
- Each selected opponent reveals its hidden strategy in plain language.
- Copy Game Code copies the versioned seed.
- Play Again keeps the lineup and generates a new seed.
- New Game returns to setup.
- Entering the prior code in setup recreates its deterministic roll stream.

## Error handling

- User-sequencing errors return typed command rejections and leave state unchanged.
- Double taps and commands from stale presentation sequences cannot advance state twice.
- Invalid seed codes show an inline setup error and cannot start a match.
- Programmer invariant failures are loud in development and tests.
- Restart, navigation, and unmount cancel pending AI and animation work before resetting state.
- An unexpected render failure displays a restartable game error boundary.
- There are no network-failure states in v1.

## Accessibility and responsive behavior

- All game actions are operable by keyboard and expose clear accessible names.
- Focus moves predictably when screens, dialogs, or pass-and-play handoffs change.
- Pot, bust, banking, round, and winner changes use restrained live announcements.
- Reduced-motion preferences remove nonessential dice, confetti, and thinking animation.
- Color never carries score, active-player, or outcome meaning alone.
- The scoreboard remains readable from two through eight rows without horizontal scrolling.
- Mobile retains the compact reference-game feel; larger screens place secondary information beside the main board.

## Testing strategy

### Python parity and pure rules

- Port the existing safe-seven, danger-seven, danger-double, reproducible-seed, and policy tests.
- Add golden scenarios in which fixed dice streams and decisions produce identical Python and TypeScript scores.
- Verify rotating round starters and skipping inactive banked seats.
- Verify banked scores survive later busts.
- Verify all players reactivate in the next round.
- Verify simultaneous decisions use one frozen snapshot.

### State and invariants

- Parameterize matches across two through eight seats.
- Cover one or several conceptual human controllers mixed with AI controllers even though v1 exposes one human.
- Reject illegal commands in every phase without changing state.
- Verify ties, all-banked completion, danger busts, and ten-round completion.
- Verify the same versioned seed produces the same starting seat and dice stream.
- Verify different seeds produce valid dice values and usable distributions.

### Strategies and controller

- Test each fictional opponent against explicit `StrategyContext` cases.
- Prove strategies cannot access future random values or another player's pending choice.
- Use controlled time in controller tests to verify AI pacing and reveal order.
- Verify restart and unmount cancel stale work.

### React and browser

- Test setup validation, opponent selection, seed entry, decision labels, score rendering, results, and game-code copy behavior.
- Test keyboard navigation, focus transitions, accessible names, and live status messages.
- Run one deterministic browser flow through a complete ten-round game.
- Check mobile and desktop layouts, including an eight-row scoreboard fixture.

## Migration and repository boundaries

The Vite project lives at the repository root and treats the game as the first React entry. The current `/game/index.html` becomes the Vite game entry and imports `src/game/main.tsx`. Existing root and learning HTML remain valid static entries during this phase. Python simulation and research files remain intact as the reference implementation and analysis tool.

The `.superpowers/` companion workspace is local-only and ignored by Git.

## Success criteria

- A user can configure one human and one to three opponents, optionally enter a game code, and complete a ten-round match.
- Every rule outcome agrees with the documented Python behavior.
- One seed deterministically controls the first roller and all dice.
- Banking immediately removes that player from rolls and decisions for the rest of the round, then reactivates them next round.
- AI turns advance automatically without allowing stale input or duplicate transitions.
- Results show accurate rankings, a copyable game code, and brief opponent reveals.
- Domain tests run without React or a browser.
- Engine tests demonstrate safe behavior from two through eight seats and do not assume a single human.
