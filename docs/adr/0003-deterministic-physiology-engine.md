# ADR-0003: Deterministic physiology engine owns all numbers
Status: Accepted (Phase 0 approval) · Date: 2026-11-18

**Context.** The product must never show invented physiological values; the LLM tutor must not generate numbers.
**Decision.** `packages/physiology` is a pure TS library. Constants are typed `RefValue { value, unit, ref, range? }`; derived values carry their formula ID. UI and tutor read engine output only. A test fails if any constant lacks a `ref` present in PHYSIOLOGY_MODEL.md. Scenarios without sourced values are not selectable.
**Consequences.** Every displayed number is traceable. Adding a scenario requires a citation first (e.g. walking — Q3).
