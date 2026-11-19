# 0001. One shared Supabase backend for web and mobile

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. Supabase was approved for the web app in the Milestone 1 architecture approval. The cross-platform product direction then set "Backend: existing Supabase project" for web and mobile, with shared authentication and business rules and no separate user accounts.

## Context
Lobby will have a web app and native iOS and Android apps. Riders must have one account and see the same rides, clubs and profiles on every platform. The web app already uses Supabase for authentication; this is implemented and was verified against real Supabase.

## Decision
- All platforms use **one Supabase project per environment**: the same authentication, the same PostgreSQL database, the same storage and the same security rules.
- Business rules live in the database (see [ADR 0005](0005-row-level-security-default-deny.md) and [ADR 0006](0006-database-enforced-rules-and-atomic-capacity.md)), so every app gets the same behaviour without re-implementing it.
- Apps use only public credentials (the project URL and the publishable key). Secret and service-role keys never ship in any app.

## Alternatives considered
- **A separate backend per platform:** duplicated logic and separate accounts. Rejected by the product direction.
- **A custom API server in front of the database:** more control, but more code, hosting and cost. Not needed while Supabase's built-in API, security rules and database functions cover the requirements.

## Consequences and trade-offs
- Lobby depends on Supabase: its pricing, limits and availability.
- Released mobile apps can't be updated instantly, so database changes must stay **backward compatible** with older app versions (see [technical principles](../technical-principles.md)).
- Mobile email links need extra Supabase redirect settings and a real domain (see open decision OD-24).
- **Not yet done:** no mobile app exists, and no application tables exist yet. Only authentication is shared today.

## Related
[ADR 0002](0002-expo-react-native-for-mobile.md) · [ADR 0004](0004-share-logic-not-ui.md) · [README: Supabase setup](../../README.md#supabase-setup)
