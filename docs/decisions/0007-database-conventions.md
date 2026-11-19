# 0007. Database conventions: UUIDs, UTC timestamps, IANA time zones, snake_case, CHECK constraints

- **Status:** Proposed. Part of the "Group 1" decisions needed before the first migration (M1.3). Not yet approved. One part is already agreed: migrations are the source of truth for schema changes (approved: the product owner runs reviewed migrations, decision A4; agreed principle, M0.4).
- **Date:** 2026-11-18
- **Decision source:** Recommended in the architecture decision paper. Awaiting product-owner approval.

## Context
The first table (profiles) sets the pattern for every later table. Changing conventions after many tables exist is expensive.

## Decision (proposed)
| Topic | Convention | Why |
|---|---|---|
| Primary keys | **UUIDs** | Supabase users already have UUIDs, so a profile can share its rider's ID. UUIDs don't reveal how many records exist, and phones could create them offline later. |
| Moments in time | **`timestamptz`** (stored as UTC) | Unambiguous everywhere. Never "local time" without a zone. |
| Ride time zone | The ride's **IANA time zone** (for example `Europe/London`), stored separately | Shows the ride's local time correctly, including summer-time changes. Revision 6 requires the ride's local time to be primary. |
| Naming | **lowercase snake_case**; plural table names (`rides`); foreign keys `<thing>_id`; `created_at` and `updated_at` on every table | Consistent and easy to read. |
| Fixed lists (statuses, units) | **Text plus a CHECK constraint**, not PostgreSQL enum types | Enum types are awkward to change. A CHECK constraint is easy to update in a migration. |
| Schema changes | **Supabase CLI migration files in Git**: small, forward-only, reviewed, tested locally first | Every environment stays identical. Dashboard edits are never used. |
| TypeScript types | **Generated** from the database after each migration and committed | Code always matches the real columns. |

## Alternatives considered
- Number IDs (1, 2, 3…): smaller, but they reveal record counts and don't match Supabase user IDs.
- PostgreSQL enum types: stricter, but harder to change.
- Editing the schema in the dashboard: quick, but environments drift and changes aren't reviewed.

## Consequences and trade-offs
- UUIDs are slightly larger, which doesn't matter at Lobby's scale.
- Forward-only migrations mean a mistake is fixed with a new migration, never by editing an old one.

## Related
[Open decision OD-03](../requirements/open-decisions.md) · [Technical principles](../technical-principles.md)
