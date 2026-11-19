# ADR-0006: Deploy to GitHub Pages from GitHub Actions via a gh-pages branch
Status: Accepted · Date: 2026-11-19

**Context.** The owner wants a browser URL for each milestone and reviews PRs before merge. The official `actions/deploy-pages` flow uses the `github-pages` environment, which by default only accepts deployments from the default branch, so a milestone branch could not be previewed before merge.
**Decision.** `.github/workflows/ci-pages.yml` runs typecheck, Vitest and Playwright on every push/PR. On pushes to `main` or `claude/**`, after the tests pass, it builds with `BASE_PATH=/<repo>/` and force-pushes the static build to the `gh-pages` branch. Pages serves that branch (Settings → Pages → Deploy from a branch → `gh-pages` / root, set once by the owner).
**Consequences.** One URL: https://sevimsoffice.github.io/human-atlas/. A milestone branch push shows the preview there; merging to `main` makes main the live version again. Hash routing (`#/credits`) avoids SPA 404 handling. Models are served from the same origin.
