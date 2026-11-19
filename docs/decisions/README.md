# Architecture Decision Records (ADRs)

An ADR is a short record of one important technical decision: what was decided, why, what else was considered, and what it costs us. ADRs keep decisions out of chat history and make it clear which decisions are settled and which aren't.

## Status values

| Status | Meaning |
|---|---|
| **Accepted** | The product owner has explicitly decided this. The **Decision source** line says where. |
| **Proposed** | Recommended, but **not yet approved**. Don't build on it until it's accepted. |
| **Deferred** | Deliberately not decided yet. The record says what evidence or milestone the decision waits for. |
| **Superseded** | Replaced by a later ADR (none yet). |

Rules:
- A decision isn't marked Accepted just because it was discussed.
- Accepted ADRs are not rewritten. To change a decision, add a new ADR that supersedes the old one.
- Numbers are never reused.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-shared-supabase-backend.md) | One shared Supabase backend for web and mobile | Accepted |
| [0002](0002-expo-react-native-for-mobile.md) | React Native + Expo for the iOS and Android apps | Proposed |
| [0003](0003-web-and-mobile-ui-architecture.md) | Separate web and mobile UIs, or Expo for all platforms | Deferred (until the Expo spike) |
| [0004](0004-share-logic-not-ui.md) | Share business logic and validation where useful; don't force shared UI | Accepted |
| [0005](0005-row-level-security-default-deny.md) | Row Level Security on every table, default deny, tested | Accepted |
| [0006](0006-database-enforced-rules-and-atomic-capacity.md) | Business rules enforced in the database; capacity changes are atomic | Accepted |
| [0007](0007-database-conventions.md) | Database conventions: UUIDs, UTC timestamps, IANA time zones, snake_case, CHECK constraints | Proposed |
| [0008](0008-public-profiles-and-private-settings.md) | Public-capable profile data separate from private settings | Proposed |
| [0009](0009-no-home-coordinates-or-continuous-tracking.md) | No permanent home coordinates; no continuous location tracking by default | Accepted |
| [0010](0010-postgis-only-when-needed.md) | Add PostGIS only when proximity queries need it | Accepted |
| [0011](0011-build-features-end-to-end.md) | Build features end-to-end before extracting shared systems | Accepted |
| [0012](0012-background-tracking-deferred.md) | Background location and live tracking deferred to a later phase | Accepted |
| [0013](0013-authentication-email-links-and-sessions.md) | Authentication: PKCE email links, stored sessions and sign-out scope | Accepted (implemented) |

## Template

```markdown
# NNNN. Title

- **Status:** Accepted | Proposed | Deferred
- **Date:** YYYY-MM-DD
- **Decision source:** who decided, and where

## Context
## Decision
## Alternatives considered
## Consequences and trade-offs
## Related
```

Related documents: [product requirements](../requirements/product-requirements.md) · [open decisions](../requirements/open-decisions.md) · [technical principles](../technical-principles.md)
