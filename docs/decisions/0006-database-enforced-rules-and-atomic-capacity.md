# 0006. Business rules enforced in the database; capacity changes are atomic

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. Ride requirements Revision 6 §4.2 marks capacity enforcement and atomic checks **[APPROVED]**: "Each check is atomic with its change. Concurrent actions never overbook." Agreed principles (M0.4): "Use database constraints for data integrity", "Use database functions or transactions for sensitive concurrent operations", "Validate on the server/database, not only in the UI".

## Context
Several riders may try to take the last seat at the same moment. If each app checks "is there a free seat?" and then joins, two riders can both see one seat free and both join: **overbooking**. The same race affects approvals, invitation-link use counts, capacity reductions and removals.

## Decision
- Data rules (required fields, lengths, allowed values) are **database constraints**, not only form checks.
- Each sensitive multi-step action (join, approve, rejoin, reinstate, lower capacity, use an invitation link) runs as **one database function or transaction**. The check and the change happen together, so concurrent requests can't both succeed.
- Apps still validate, but only to give quick feedback.
- Concurrency tests are required, for example two riders racing for the last seat. Revision 6 §10.3 lists the scenarios.

## Alternatives considered
- **Checking in the app, then writing:** suffers the race described above. Rejected.
- **A queue or background worker:** more moving parts than needed at Lobby's scale.

## Consequences and trade-offs
- Some logic lives in SQL functions, which are harder for a beginner to read. Each function gets plain-language comments and tests.
- The exact mechanism (database functions, row locks or constraints) is designed with the rides feature, together with the final RSVP and capacity rules (OD-12).

## Related
[ADR 0005](0005-row-level-security-default-deny.md) · [Ride requirements Revision 6](../plan/ride-discovery-calendar-weather.md) · [Product requirements §F](../requirements/product-requirements.md#f-rsvp-approval-and-capacity)
