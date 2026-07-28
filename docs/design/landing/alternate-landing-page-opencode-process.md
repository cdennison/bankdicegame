# How the Alternate Landing Page Was Made (OpenCode workflow)

**Date:** 2026-07-28 · **Scope:** design-only work; no application source files touched.

A short recap of the tooling and process behind the Match Point design direction, for reuse on future design tasks.

## Setup

| Piece | What was used |
|---|---|
| Harness | OpenCode (interactive agent CLI) |
| Primary model | `kimi-k3` (`opencode-go/kimi-k3`) — orchestration, research, proposal writing, QA |
| Plugin / mode | oh-my-opencode **ultrawork mode** — enforced plan-first execution, delegation rules, durable notepad, and evidence-before-claims verification |
| Subagent | `task(category="visual-engineering")` → "Sisyphus-Junior", routed to `glm-5.2` — built the static HTML mockups |
| Skills | `ui-ux-pro-max` (required design workflow; its bundled `search.py` design-system database), `frontend-design` + `design` (injected into the mockup subagent) |
| Verification | Headless Chrome (`--headless=new --screenshot`) for full-page captures; `grep` for truthfulness checks |

## Process

1. **Prompt** — one detailed brief: audience (teens 13–18), mission ("Crack the Strategy"), truthfulness constraints (deterministic Mira/Knox/Vega, no live-GPT claims), creative challenge (shorter, sharper than the 10-section page), 9 deliverables, exact save paths, and explicit don'ts.
2. **Research** — read `LANDING_PAGE_DESIGN_SPEC.md`, `ARTIFACT_INDEX.md`, and the React-game design spec; visually reviewed the landing-qa and game-react-qa screenshot archives to extract the current identity and the shipped game's DNA.
3. **Design-system search (required)** — ran `ui-ux-pro-max`'s `search.py --design-system` twice plus landing/style/typography/ux/web domain searches; adopted two patterns, recorded five intentional deviations (e.g., rejected Fredoka/Nunito as too childish, rejected 3D & Hyperrealism on the database's own accessibility/performance flags).
4. **Concept + proposal** — authored the "Match Point" sports-broadcast direction and wrote `alternate-landing-page-design.md` (copy, page architecture, visual system, responsive/a11y specs, comparison with the current page).
5. **Delegated mockups** — the visual-engineering subagent (with the proposal as its spec) produced self-contained, no-JS `mockup-desktop.html` (1440px), `mockup-mobile.html` (390px, primary), and `mockup-states.html`.
6. **Verify like a user** — captured each file to PNG with headless Chrome and *inspected the images*, which caught two real defects: telestrator circles rendering as black blobs (CSS selector matched `circle` but markup used `ellipse`) and a clipped mobile-menu frame (absolute sheet inside a row-flex container). Both fixed and re-captured.
7. **Truthfulness pass** — grepped all copy: "live AI" only negated or labeled future direction; GPT names only as qualified stat-sheet policies; no casino/classroom language.
8. **Review server** — `python3 -m http.server 8321` from the artifact folder for easy browser review.

## Takeaways

- The brief's explicit truthfulness constraints and deliverables list made the work auditable end-to-end.
- Design-subagent quality was high, but **screenshot-and-look verification caught defects that file inspection alone would have missed** — keep that step.
- Skills-as-context (distilled search results + the proposal doc) worked better than asking the subagent to re-run the research.

## Artifacts

- Proposal: `docs/design/landing/alternate-landing-page-design.md`
- Mockups + captures: `docs/design/artifacts/landing-alternate/`
- This recap: `docs/design/landing/alternate-landing-page-opencode-process.md`
