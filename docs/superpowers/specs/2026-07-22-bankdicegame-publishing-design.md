# Bankdicegame Publishing and GitHub Ribbon Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-22

## Summary

Publish the existing Bank It static website from a public GitHub repository named `bankdicegame` and a Vercel project with the same name. Add a classic black diagonal “Fork me on GitHub” ribbon to the upper-right corner of the landing page, linked to the new public repository.

## Goals

- Create a public GitHub repository named `bankdicegame` from the current tracked project.
- Keep unrelated local and untracked files out of the pushed repository.
- Use `bankdicegame` as the exact Vercel project name.
- Serve the existing root landing page plus `/game/` and `/learn/` from Vercel.
- Add an accessible, responsive, upper-right “Fork me on GitHub” link to the landing page.

## Ribbon design

The ribbon uses the recognizable classic treatment: a black diagonal band crossing the upper-right corner with white “Fork me on GitHub” text. It is rendered with local HTML and CSS rather than a hosted image, keeping it sharp at every pixel density and avoiding an additional network request.

The ribbon:

- Links to the public `bankdicegame` GitHub repository.
- Opens in the same tab, consistent with normal site navigation.
- Has an explicit accessible label describing the destination.
- Remains above the sticky site header without blocking its primary navigation.
- Scales down at narrow mobile widths while retaining a usable link target.
- Uses visible keyboard focus styling and honors the page’s existing accessibility conventions.

## Deployment flow

1. Add and verify the ribbon locally.
2. Commit only the ribbon, Vercel linkage ignore rule, and this approved design record.
3. Create the public GitHub repository `bankdicegame` and push the current `main` branch.
4. Create or rename the Vercel project to exactly `bankdicegame` and make a production deployment from the repository root.
5. Verify the production landing page, `/game/`, `/learn/`, and the ribbon destination.

## Error handling

- Stop before any push if GitHub authentication or repository ownership cannot be established safely.
- Do not overwrite an unrelated existing GitHub or Vercel project named `bankdicegame`.
- Preserve the already-created `bankit` Vercel project unless renaming it in place is explicitly supported and targets the same project.
- Treat any non-2xx production route or incorrect ribbon destination as a failed deployment.

## Verification

- Inspect the staged Git diff before committing and pushing.
- Confirm the GitHub repository is public and its default branch contains the site files.
- Confirm Vercel reports the production deployment as ready under project `bankdicegame`.
- Load the production landing page in a real browser at desktop and mobile widths.
- Activate the ribbon and confirm it resolves to the public GitHub repository.
- Request `/`, `/game/`, and `/learn/` and confirm successful responses.

## Non-goals

- Redesigning the existing landing page or header.
- Adding GitHub repository automation, branch protection, or continuous deployment.
- Deleting the earlier `bankit` Vercel deployment.
- Committing unrelated local design artifacts or agent configuration directories.
