# Bank It Rules Page Implementation Plan

> **For Codex:** Execute this plan in order with test-first checks, responsive visual QA, and production verification.

**Goal:** Publish a complete, lightly copyedited Bank It rules article at `/rules/`, link it from the landing page, and deploy the result to the existing public `bankdicegame` GitHub and Vercel projects.

**Architecture:** Keep the site dependency-free and static. Add `rules/index.html` plus `rules/rules.css`, reuse the root design tokens and typography, and add focused Python tests that parse the generated HTML as a user-visible contract.

**Tech stack:** Semantic HTML, CSS, Python `unittest`, GitHub CLI/Git, Vercel CLI.

---

### Task 1: Lock the rules-page contract with failing tests

**Files:**
- Create: `test_site.py`
- Reference: `docs/superpowers/specs/2026-07-22-bank-it-rules-page-design.md`

1. Add tests asserting that `rules/index.html` exists, has the seven approved section headings in order, includes the supplied mechanics, links ThunderHive Games, and exposes Home and Play navigation.
2. Add tests asserting that the landing header and footer each link to `/rules/`.
3. Run `python3 -m unittest -v test_site.py` and confirm it fails because the route and navigation do not exist yet.

### Task 2: Implement the responsive static rules page

**Files:**
- Modify: `DESIGN.md`
- Create: `rules/index.html`
- Create: `rules/rules.css`
- Modify: `index.html`

1. Document the rules article, contents rail, callouts, responsive behavior, and accessibility states in `DESIGN.md` before using them.
2. Build a semantic `/rules/` article with a skip link, compact header, source credit, contents navigation, seven anchored sections, rule callouts, and source footer.
3. Lightly copyedit the supplied rules while preserving every mechanic and the `BANK` terminology.
4. Add `Rules` links to the landing-page primary and footer navigation.
5. Run `python3 -m unittest -v test_site.py`, then the complete `python3 -m unittest -v` suite; confirm both pass.

### Task 3: Verify, publish, and check production

**Files:**
- Verify only: all changed files

1. Serve the site locally and confirm `/`, `/rules/`, `/game/`, and `/learn/` return HTTP 200.
2. Capture `/rules/` at 375, 768, and 1280 pixels in a real browser; inspect every capture for overflow, hierarchy, contrast, focus, and responsive behavior. Exercise contents anchors plus Home, Play, and source links.
3. Run HTML/content checks, the full test suite, staged diff checks, and the repository secret scan. Keep unrelated untracked paths unstaged.
4. Commit the implementation atomically, push `main` to `origin`, and deploy production with `vercel deploy --prod --yes` to the existing `bankdicegame` project.
5. Verify the live `/rules/` route, source attribution, navigation, and production rendering. Record the commit and deployment URLs.
