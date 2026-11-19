# 0005. Row Level Security on every table, default deny, tested

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. "Use RLS as the actual security boundary" (Milestone 1 architecture approval); database security and RLS tests approved (decisions 9 and A2); "Enable RLS on every application table, apply least-privilege policies, test RLS policies" (agreed principles, M0.4).

## Context
Apps talk to Supabase directly with a public key. Anyone could call the database with that key, so the app's screens can't be the security boundary. Supabase's **Row Level Security (RLS)** rules decide which rows each signed-in rider may read or change.

## Decision
- **RLS is switched on for every application table, in the same migration that creates the table.**
- **Default deny:** with no rule, nobody can do anything. Rules are added one action at a time (read, create, update, delete), granting the least access needed.
- **Every rule has automated tests**, including tests that prove access is refused to signed-out visitors and to other riders.
- Secret and service-role keys never appear in app code or Git. Privileged operations run in reviewed database functions.

## Alternatives considered
- **Checking permissions only in app code:** bypassable with the public key. Rejected.
- **A custom API server enforcing permissions:** more infrastructure than needed (see [ADR 0001](0001-shared-supabase-backend.md)).

## Consequences and trade-offs
- RLS controls **rows, not columns**. A rider who may read a row can read every column in it. This is why [ADR 0008](0008-public-profiles-and-private-settings.md) proposes keeping private data in separate tables.
- Writing and testing rules takes extra time with every table. Automated RLS tests need a local Supabase (Docker), whose set-up is still open (OD-04).
- **Not yet done:** no application tables exist yet.

## Related
[ADR 0006](0006-database-enforced-rules-and-atomic-capacity.md) · [Technical principles](../technical-principles.md)
