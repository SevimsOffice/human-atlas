# ADR-0004: Handling OpenStax A&P 2e being CC BY-NC-SA (not CC BY)
Status: Proposed — needs owner decision (Q1) · Date: 2026-11-18

**Context.** The spec assumes OpenStax A&P is CC BY. Verified: *A&P 2e* is CC BY-NC-SA 4.0 (repo LICENSE + collection metadata). Facts and numbers are not copyrightable; prose is.
**Options.**
A. Use A&P 2e text; isolate it in `content/nc-sa/`, mark the app non-commercial while it is included, license derived text BY-NC-SA.
B. Cite A&P 2e for facts/values only; write our own short explanations (human-reviewed), each with a citation to the section. No verbatim text.
C. Find a CC BY source (e.g. archived A&P 1st ed., 2013, CC BY 4.0 — to verify) and accept older content.
**Proposed.** B for UI text + numbers now (no licence contagion); A only inside the AI tutor's retrieval corpus if non-commercial use is acceptable.
**Consequences.** Physiology engine unaffected in all options.
