# ADR-0004: Handling OpenStax A&P 2e being CC BY-NC-SA (not CC BY)
Status: Accepted — option B (owner decision 2026-11-19; commercial use is a future goal) · Date: 2026-11-18

**Context.** The spec assumes OpenStax A&P is CC BY. Verified: *A&P 2e* is CC BY-NC-SA 4.0 (repo LICENSE + collection metadata). Facts and numbers are not copyrightable; prose is.
**Options.**
A. Use A&P 2e text; isolate it in `content/nc-sa/`, mark the app non-commercial while it is included, license derived text BY-NC-SA.
B. Cite A&P 2e for facts/values only; write our own short explanations (human-reviewed), each with a citation to the section. No verbatim text.
C. Find a CC BY source (e.g. archived A&P 1st ed., 2013, CC BY 4.0 — to verify) and accept older content.
**Decision.** B everywhere. OpenStax is cited for facts and numbers only. We write our own short texts (`content/texts/`), each marked `unreviewed`/`reviewed`. The AI tutor (M6) will be grounded in our own texts, citing OpenStax for facts. No OpenStax prose is stored in the repo.
**Consequences.** Physiology engine unaffected in all options.
