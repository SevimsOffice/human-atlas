# ADR-0002: HuBMAP HRA as primary 3D source, pinned and mirrored
Status: Accepted (Phase 0 approval) · Date: 2026-11-18

**Context.** HRA reference organs are CC BY 4.0 GLBs with node names mapped to Uberon via the ASCT+B crosswalk. `cdn.humanatlas.io` is unreachable from the cloud dev environment; the publisher's GitHub repo `hubmapconsortium/ccf-releases` serves identical files.
**Decision.** Use HRA for every organ it covers. Download scripts pin release folder + SHA-256, try the CDN first and the GitHub mirror second. Originals stay in git-ignored `data/raw/`; only optimized GLBs are committed/shipped. Male (VH_M) models for M1; male/female switch in M4 if the female models cover the same structures (owner decision Q5).
**Consequences.** Reproducible builds; attribution fixed per file. Gaps (great vessels in a separate file, no skeleton/muscles) handled in later ADRs.
