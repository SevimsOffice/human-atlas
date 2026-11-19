# ADR-0001: Browser-only TypeScript monorepo
Status: Accepted (Phase 0 approval) · Date: 2026-11-18

**Context.** V1 needs no accounts or server state; all data is static and openly licensed.
**Decision.** npm workspaces monorepo: `apps/web` (React, Vite, Tailwind, Zustand, React Three Fiber, drei, i18next), `packages/physiology`, `packages/anatomy-manifest`, `scripts/`. Static build, no backend.
**Consequences.** Cheap hosting, offline-capable. AI tutor (M6) will need either a small backend or a user-provided key — decided then.
