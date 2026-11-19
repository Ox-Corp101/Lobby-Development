# 0011. Build features end-to-end before extracting shared systems

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. Approved roadmap (Phase 0 → 7), with features built one at a time end-to-end. Instruction: "Do not build a generalized notification, invitation, or media framework before a real feature needs it." Agreed principles (M0.4): simplicity first; avoid premature abstraction and overengineering; incremental development.

## Context
Building general systems (an invitation system, a notification framework, a media pipeline) before any feature uses them means guessing at requirements, which leads to rework and unused complexity.

## Decision
- Build each feature **end-to-end** (database, rules, tests, screens), one at a time, in the roadmap order.
- **Extract shared code the second time it's needed.** For example, ride invitation links are built first; when clubs need invitations, the working code is generalised.
- What's shared from day one is **conventions** (naming, security approach, time handling), not systems.
- Detailed data design happens **just before each feature**, not all up front. A one-page domain map comes first (M1.1).

## Alternatives considered
A "shared systems" phase before features (in an earlier draft of the roadmap). Rejected as premature.

## Consequences and trade-offs
- Some code will be refactored when a second feature needs it. That's accepted.
- Early features must still follow the conventions, so later extraction stays easy.

## Related
[Technical principles](../technical-principles.md) · [ADR 0004](0004-share-logic-not-ui.md)
