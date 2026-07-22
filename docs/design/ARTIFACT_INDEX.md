# Bank It Design Artifact Index

**Captured:** 2026-07-21

This index preserves the design work that existed before the next landing-page redesign. “Archived” means retained for provenance, not approved for reuse.

## Landing-page documents

| Artifact | Status | Purpose |
|---|---|---|
| `LANDING_PAGE_DESIGN_SPEC.md` | Current baseline | Consolidated historical design, current product drift, and redesign constraints |
| `docs/design/landing/archive/landing-page-first-draft.md` | Archived | Verbatim original file from `/Users/c/Downloads/bank-it-landing-page-spec.md` |
| `landing-page-spec-v2.md` | Superseded | First real-game/live-AI revision |
| `landing-page-spec-v3.md` | Implemented design source | Teen math-engagement and Strategy Arcade direction |
| `index.html` | As built | Landing structure and final shipped copy |
| `styles.css` | As built | Tokens, responsive system, and visual treatment |
| `script.js` | As built | Menu, Strategy Lens, quick-decision reveal, and scroll-reveal behavior |
| `favicon.svg` | As built | Custom die favicon |

## Landing-page screenshot archive

Tracked copies live in `docs/design/artifacts/landing-qa/`.

### Primary reference views

- `desktop-top.png` — desktop hero and above-the-fold composition.
- `mobile-top.png` — mobile hero hierarchy.
- `mobile-menu-fixed2.png` — final full-screen mobile navigation.
- `decision-reveal.png` and `mobile-decision.png` — interactive choice and reveal.
- `how-final.png` and `mobile-board.png` — rules path.
- `ai-final.png` and `mobile-ai.png` — opponent comparison.
- `crack-final.png` and `mobile-crack.png` — learning-path cards.
- `proof-ref.png` and `mobile-proof.png` — simulation evidence.
- `fork-ref.png` and `mobile-fork.png` — final `/game` and `/learn` choice.

### Iteration and QA views

- `ai-models.png`, `ai-ref.png`
- `crack-section.png`, `crack-ref.png`
- `fork-section.png`
- `how-to-play.png`, `how-ref.png`
- `proof-section.png`
- `mobile-menu.png`, `mobile-menu-final.png`, `mobile-menu-fixed.png`

These show intermediate states and are useful for understanding adjustments, not as current targets.

### Full-page capture caveat

`desktop-full.png` and `desktop-full-revealed.png` are preserved as QA artifacts. The revealed capture contains large blank bands caused by viewport-based reveal behavior during full-page screenshot capture, so it is not a faithful visual target. Use the section and viewport screenshots above instead.

## Static game-design artifacts

The design-only `/game` prototype is preserved in commit `b41d538` and represented by screenshots in `docs/design/artifacts/game-prototype-qa/`:

- Setup: `game-setup-mobile.png`
- Initial play state: `game-play-mobile-fixed.png`
- Decision state: `game-decision-mobile.png`
- Consolidated mobile match: `game-design-mobile.png`
- Desktop match: `game-design-desktop.png`
- Results: `game-results-mobile.png`

`game-play-mobile.png` is an earlier view that exposed a fixed-dock positioning bug and is retained only for comparison.

## Game architecture companion artifacts

The Superpowers visual companion fragments are tracked in `docs/design/artifacts/game-brainstorm/`:

- `architecture.html` — pure engine, controller, and UI relationship.
- `components.html` — module and component ownership.
- `turn-flow.html` — roll and banking decision flow.
- `multiplayer-boundary.html` — generic two-to-eight-seat controller model.
- `opponents.html` — Mira, Knox, and Vega personality/reveal concept.

Transient waiting screens and server state were intentionally not promoted.

## Completed React-game QA artifacts

The completed implementation currently lives on branch `feat/react-game`. Its final task-11 screen captures are preserved in `docs/design/artifacts/game-react-qa/`:

- `desktop-setup.png`
- `desktop-match.png`
- `desktop-results.png`
- `mobile-setup.png`
- `mobile-match.png`
- `mobile-results.png`

These are the strongest current visual references when deciding how closely the redesigned landing page should match the actual game.

## Related game documents

- `docs/superpowers/specs/2026-07-20-bank-it-react-game-design.md` — approved modular game design.
- `docs/superpowers/plans/2026-07-20-bank-it-react-game.md` — implementation plan.
- `README.md`, `PROGRESS.md`, `solutions/`, and `bank_it.py` — research basis and tested strategy evidence.

## Excluded local artifacts

The following remain intentionally untracked or unpromoted:

- `.superpowers/**/state/` server details and waiting screens.
- `.worktrees/react-game/node_modules/`, build metadata, traces, and reports.
- `.serena/` local agent state.
- Python caches and generated test output.

## Reuse rule

Before reusing an archived artifact, classify it as one of:

- **Brand invariant:** mission, audience, voice, or honesty rule.
- **Product truth:** must match the current game implementation.
- **Design hypothesis:** may be replaced during redesign.
- **Superseded claim:** retained only for historical context.

Do not copy old “live AI” or playable-GPT language into a new design without an explicit product decision restoring that capability.
