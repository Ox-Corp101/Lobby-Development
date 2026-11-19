# 0004. Share business logic and validation where useful; don't force shared UI

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner: "Share business logic and validation where appropriate, but do not force shared UI" (M0.4 platform strategy). It also follows the cross-platform direction that authentication and business rules are shared.

## Context
Web and mobile apps need identical rules, for example password limits, ride field limits and capacity messages. Screens, by contrast, differ naturally between a desktop browser and a phone.

## Decision
- Share code that is **the same everywhere**: validation schemas (Zod), data-access services that call Supabase, plain-language error messages, and time and distance formatting.
- Write that shared code **without browser- or phone-specific features**, so either kind of app can use it.
- **Don't force UI sharing.** Whether screens are shared is decided separately ([ADR 0003](0003-web-and-mobile-ui-architecture.md)).
- The database remains the real enforcement point. Shared app-side validation only gives riders quick feedback ([ADR 0006](0006-database-enforced-rules-and-atomic-capacity.md)).

## Alternatives considered
- **Share everything, including UI, from the start:** this prejudges ADR 0003.
- **Share nothing:** the rules would drift apart between platforms.

## Consequences and trade-offs
- Code must keep platform-neutral logic apart from UI. This costs a little discipline now and saves rework later.
- **Not decided here:** the repository layout. The cross-platform assessment recommended deferring a monorepo until mobile development starts (OD-27).

## Related
[ADR 0001](0001-shared-supabase-backend.md) · [ADR 0011](0011-build-features-end-to-end.md)
