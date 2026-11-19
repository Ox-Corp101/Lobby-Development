# 0002. React Native + Expo for the iOS and Android apps

- **Status:** Proposed
- **Date:** 2026-11-18
- **Decision source:** The product owner named React Native + Expo as the *proposed* mobile approach, "subject to evaluation". The cross-platform assessment recommended it. It hasn't been confirmed, and the Expo spike hasn't been run.

## Context
Lobby needs native iOS and Android apps for the full mobile experience: native push notifications, advanced camera workflows and, later, background location. The web app is React + TypeScript, and the team is one developer working with Claude Code.

## Decision (proposed)
Build the iOS and Android apps with **React Native using Expo**, in TypeScript, talking to the shared Supabase backend ([ADR 0001](0001-shared-supabase-backend.md)).

## Alternatives considered
- **Fully native apps (Swift and Kotlin):** best platform fit, but two more languages and codebases. Too costly for this team.
- **Flutter:** capable, but uses Dart, so none of the existing TypeScript logic could be reused.
- **A web app wrapped in a native shell (for example Capacitor):** reuses the web UI, but background location, push and camera workflows are weaker, and the result feels less native.
- **Web only (installable web app):** can't do background location, and iPhone web push works only for web apps added to the home screen.

## Consequences and trade-offs
- TypeScript validation and business logic can be shared with the web app ([ADR 0004](0004-share-logic-not-ui.md)).
- React Native screens aren't web HTML, so the existing web screens can't be reused as they are. Whether Expo should also produce the web UI is [ADR 0003](0003-web-and-mobile-ui-architecture.md).
- Needs Apple Developer and Google Play accounts (owned by the product owner) before store release, and device testing.
- Expo's build service has free and paid tiers. Any paid use needs approval.

## What would confirm it
The Expo spike (Phase 2) succeeding on iOS and Android against its acceptance criteria.

## Related
[ADR 0003](0003-web-and-mobile-ui-architecture.md) · [Open decisions OD-01, OD-02](../requirements/open-decisions.md)
