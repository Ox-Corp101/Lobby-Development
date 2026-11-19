# 0008. Public-capable profile data separate from private settings

- **Status:** Proposed. A "Group 1" decision needed before the first migration (M1.3). Not yet approved.
- **Date:** 2026-11-18
- **Decision source:** Recommended in the architecture decision paper. Already approved and consistent with it: profiles are private to their owner in Milestone 1, and public profile information comes later with appropriate RLS (Milestone 1 decision 7).

## Context
Rider profiles will become partly public later (public rider profiles, following). Supabase security rules (RLS) decide **which rows** someone can read, not **which columns**. If other riders can later read a profile row, they can read **every** column in it, including settings that should stay private.

## Decision (proposed)
Split profile data into two tables from the start:
- **`profiles`:** information that **may** become public later, such as display name and home city label (and later perhaps a photo and bio, once approved).
- **`profile_settings`:** always private, such as distance unit, locale and time zone.

Both are **owner-only** at first. Making some profile information public later then means adding a read rule to `profiles` only.

## Alternatives considered
- **One table, plus a carefully written "view" that hides private columns:** it works, but is easy to get wrong when columns are added later.
- **One table, and never make it public:** this doesn't support public profiles.

## Consequences and trade-offs
- Two small tables instead of one. Creating a profile writes to both.
- **Not decided here:** which fields are public, profile visibility options, handles, bio and photo (OD-06, OD-07). The split itself is OD-05.

## Related
[ADR 0005](0005-row-level-security-default-deny.md) · [Product requirements §B](../requirements/product-requirements.md#b-accounts-and-profiles)
