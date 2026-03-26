---
name: project_build_ordering
description: Root build uses tsc --build for correct workspace dependency ordering, not npm run build --workspaces
type: project
---

Root `build` script uses `tsc --build` with explicit workspace order instead of `npm run build --workspaces`.

**Why:** npm workspaces run builds in parallel/arbitrary order, so packages that depend on other packages (e.g., pixel depends on types) fail when their dependency's `dist/` doesn't exist yet. `tsc --build` respects project references and builds in dependency order.

**How to apply:** When adding new packages/services, update the root `build` script to include the new tsconfig path in the correct position (dependencies before dependents). After cleaning dist, use `--force` on first build to clear stale tsbuildinfo files.
