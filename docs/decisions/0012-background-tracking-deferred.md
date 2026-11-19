# 0012. Background location and live tracking deferred to a later phase

- **Status:** Accepted (the decision is to defer)
- **Date:** 2026-11-18
- **Decision source:** Product owner. In the approved roadmap, background tracking and live location sharing are Phase 7 (advanced capabilities). M0.4 §L: background location "must remain a later-stage feature with explicit opt-in, privacy controls and battery considerations".

## Context
Background location needs special operating-system permissions ("Always" on iOS, background location plus a persistent notification on Android). It faces the strictest app-store review, uses battery, and carries the highest privacy risk. Browsers can't do it at all.

## Decision
- **Not in v1.** Background location, live ride tracking and live location sharing come only in Phase 7.
- When built, they must have: **explicit opt-in** for each use, clear privacy controls (for example privacy zones and retention limits), visible tracking status, and attention to battery use.
- The web app explains why the feature isn't available there ("What is this?") instead of hiding it silently.

## Alternatives considered
Building tracking early as a headline feature. Rejected: it's the most expensive and riskiest feature, and it depends on rides, participation and mobile apps existing first.

## Consequences and trade-offs
- v1 has no route recording or live group map.
- The draft tracking requirements (personal recording, live group map, shared routes, privacy zones) stay **proposals** until Phase 7 design.

## Related
[ADR 0009](0009-no-home-coordinates-or-continuous-tracking.md) · [Product requirements §L](../requirements/product-requirements.md#l-future-capabilities-not-v1)
