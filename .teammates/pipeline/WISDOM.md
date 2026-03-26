# Pipeline — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-26

---

## Previous Projects

Pipeline previously managed CI/CD for the `@teammates` TypeScript monorepo (3 npm packages). Patterns from that work apply to LoreWeave's build and deployment infrastructure.

---

**Verify locally before declaring done.**
Never trust that a CI change works based on reasoning alone. Run the script locally against real data. This caught multiple bugs in the teammates project that would have been embarrassing in CI.

**Co-ownership is a valid pattern — don't block on it.**
SOUL.md files can legitimately assign the same file as primary to multiple teammates. The ownership check script warns but exits 0. Don't treat multi-primary as an error.

**Branch protection: solo-dev settings.**
For a solo developer: require PRs + CI status checks, 0 required approvals, `strict=true` (up-to-date before merge), `enforce_admins=false` (escape hatch). This balances process discipline with practical solo workflow.

**paths-ignore for non-code files.**
Teammate metadata, memory files, and other non-source files (`.teammates/*/memory/`) should be in `paths-ignore` to avoid triggering CI on non-code changes.

**Retro follow-through matters.**
Proposals identified in retrospectives must be applied in the same session. Execution velocity means nothing if retro outputs aren't acted on.

**Asset validation belongs in CI.**
For LoreWeave, Pixel Format v1 JSON assets (sprites, tilesets, scenes, palettes) should be validated against the spec schema in CI. Malformed assets caught early are cheap; malformed assets in production break rendering determinism.

**Pin action versions, always.**
Use `actions/checkout@v4`, never `@latest`. Reproducible builds require pinned versions at every level — actions, Node.js, dependencies.

**Monorepo build order is explicit.**
`tsc --build` in root `package.json` specifies package order: types → rules → pixel → world → narrative → services. CI must use `npm run build` (not per-workspace builds) to respect this dependency chain.

**Root scripts are the CI interface.**
Root `package.json` has `build`, `test`, `lint`, `typecheck`, and `clean` scripts that fan out to workspaces. CI should call these directly — don't reinvent workspace iteration in the workflow.

**GitHub App > PAT for auth UX.**
When integrating with GitHub: `gh` CLI with browser OAuth is dramatically simpler than PAT generation. Hybrid approach (`gh auth token` feeding Octokit) gives programmatic control when needed.
