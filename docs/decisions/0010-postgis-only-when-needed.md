# 0010. Add PostGIS only when proximity queries need it

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. M0.4 direction: "PostGIS should be considered when actual proximity queries require it, not introduced prematurely". The architecture decision paper agreed: PostGIS when rides need it; profiles don't.

## Context
PostGIS is PostgreSQL's geography extension. It's free and available in Supabase. It makes "rides within 40 km of this point" a single, fast, indexed query. Without it, Lobby would have to write and maintain distance calculations itself.

## Decision
- **Don't enable PostGIS now.** Profiles store the home city as text and need no geography.
- **Decide when the rides feature is designed** (Phase 4), when "nearby rides" needs real distance queries. The decision paper's recommendation for that point is to use PostGIS rather than hand-written distance maths.

## Alternatives considered
- **Enable it now:** adds complexity before any feature needs it.
- **Never use it:** means hand-written distance maths and slower searches as rides grow.

## Consequences and trade-offs
- Location columns for rides are designed later, together with the map and geocoding provider decision (OD-18).
- Spatial searches will probably run through small database functions rather than simple queries.

## Related
[ADR 0009](0009-no-home-coordinates-or-continuous-tracking.md) · [ADR 0011](0011-build-features-end-to-end.md)
