# Bankdicegame Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current static site from a public `cdennison/bankdicegame` GitHub repository and an exact-name `bankdicegame` Vercel project, with a working classic GitHub ribbon.

**Architecture:** Keep the site dependency-free. Add one semantic anchor to `index.html` and style it as a fixed diagonal corner ribbon in `styles.css`; use the existing responsive breakpoints to keep navigation usable. Use authenticated `gh` and `vercel` CLI commands for external publishing, then verify both APIs and the rendered production site.

**Tech Stack:** HTML5, CSS, Git, GitHub CLI, Vercel CLI, Python static HTTP server, Chromium browser QA

## Global Constraints

- The GitHub repository name is exactly `bankdicegame` and visibility is public.
- The Vercel project name is exactly `bankdicegame`.
- The ribbon copy is exactly `Fork me on GitHub` and links to `https://github.com/cdennison/bankdicegame`.
- Preserve the existing landing-page look and all existing `/game/` and `/learn/` behavior.
- Do not stage or push unrelated local untracked files.
- Do not delete the existing Vercel `bankit` project.

---

### Task 1: Add the classic GitHub ribbon

**Files:**
- Modify: `index.html:19`
- Modify: `styles.css:78-94, 678-755`

**Interfaces:**
- Consumes: the existing fixed `.site-header`, `.nav-shell`, focus treatment, and responsive breakpoints.
- Produces: an anchor `.github-ribbon` with a stable repository URL and responsive styling.

- [ ] **Step 1: Record the pre-change failing content check**

Run:

```bash
rg -n 'Fork me on GitHub|github.com/cdennison/bankdicegame' index.html
```

Expected: exit 1 with no matches.

- [ ] **Step 2: Add the semantic ribbon link**

Insert immediately after the skip link in `index.html`:

```html
<a class="github-ribbon" href="https://github.com/cdennison/bankdicegame" aria-label="Fork Bank It on GitHub">Fork me on GitHub</a>
```

- [ ] **Step 3: Add desktop and responsive ribbon styling**

Add a fixed, rotated black band with white mono text, a `z-index` above the header, a minimum 44px interaction height, and a subtle shadow. Add enough right padding to `.nav-shell` at desktop and mobile breakpoints so the ribbon never blocks the Play or menu controls. At `max-width: 560px`, reduce the band width and font size while retaining the exact copy.

- [ ] **Step 4: Verify the static markup and local routes**

Run:

```bash
rg -n 'class="github-ribbon"|href="https://github.com/cdennison/bankdicegame"|Fork me on GitHub' index.html
python3 -m http.server 4173
curl --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1:4173/game/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1:4173/learn/ >/dev/null
```

Expected: the markup command shows the anchor and all three requests exit 0.

- [ ] **Step 5: Run browser visual QA**

Load `http://127.0.0.1:4173/` at 1280x800, 768x900, and 375x812. Confirm the ribbon is visible in the upper-right corner, does not block primary navigation, has a visible keyboard focus ring, and resolves to the GitHub URL.

- [ ] **Step 6: Commit the ribbon and Vercel ignore rule**

```bash
git add index.html styles.css .gitignore
git diff --staged
git commit -m "feat: add GitHub corner ribbon"
```

Expected: only the ribbon and `.vercel` ignore rule are committed.

---

### Task 2: Create and push the public GitHub repository

**Files:**
- No new files.

**Interfaces:**
- Consumes: the clean committed `main` branch and authenticated `cdennison` GitHub CLI account.
- Produces: public repository `https://github.com/cdennison/bankdicegame` and local `origin` remote.

- [ ] **Step 1: Confirm the target is available and the intended changes are committed**

```bash
gh auth status
gh repo view cdennison/bankdicegame --json nameWithOwner 2>&1
git status --short
git log -2 --oneline
```

Expected: GitHub authentication succeeds, repository lookup reports not found, and only known unrelated untracked paths remain.

- [ ] **Step 2: Create and push the public repository**

```bash
gh repo create cdennison/bankdicegame --public --source=. --remote=origin --push --description "A playable push-your-luck dice game and strategy simulator"
```

Expected: GitHub returns the new repository URL and pushes `main`.

- [ ] **Step 3: Verify visibility, remote, and pushed HEAD**

```bash
gh repo view cdennison/bankdicegame --json nameWithOwner,visibility,url,defaultBranchRef
git remote -v
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
```

Expected: visibility is `PUBLIC`, URL is the target repository, and local and remote `main` SHAs match.

---

### Task 3: Deploy under the exact Vercel project name

**Files:**
- Modify locally ignored: `.vercel/project.json`

**Interfaces:**
- Consumes: authenticated Vercel scope `homescore` and committed site root.
- Produces: Vercel project `homescore/bankdicegame` with a ready production deployment.

- [ ] **Step 1: Confirm the exact project does not already exist**

```bash
vercel project inspect bankdicegame --scope homescore
```

Expected: project not found. If it exists and is unrelated, stop without modifying it.

- [ ] **Step 2: Create and link the exact-name project**

```bash
vercel project add bankdicegame --scope homescore
vercel link --yes --team homescore --project bankdicegame
```

Expected: `.vercel/project.json` contains `"projectName":"bankdicegame"`.

- [ ] **Step 3: Create the production deployment**

```bash
vercel deploy --prod --yes --scope homescore
```

Expected: exit 0 with a production URL and alias.

- [ ] **Step 4: Verify Vercel project state and public routes**

```bash
vercel project inspect bankdicegame --scope homescore
curl --fail --location --silent --show-error https://bankdicegame.vercel.app/ >/dev/null
curl --fail --location --silent --show-error https://bankdicegame.vercel.app/game/ >/dev/null
curl --fail --location --silent --show-error https://bankdicegame.vercel.app/learn/ >/dev/null
```

Expected: project inspection names `bankdicegame` and all routes return success.

- [ ] **Step 5: Run production browser QA**

Load the production URL at 1280x800, 768x900, and 375x812. Confirm the ribbon renders, navigation remains operable, and activating the ribbon reaches `https://github.com/cdennison/bankdicegame`.

- [ ] **Step 6: Reconcile final repository state**

```bash
git status --short
git log -2 --oneline
git ls-remote --heads origin main
```

Expected: no requested changes are uncommitted, unrelated local paths remain untouched, and the remote `main` SHA matches local HEAD.
