# 0009. No permanent home coordinates; no continuous location tracking by default

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision source:** Product owner. M0.4 maps and location direction: "No home address or permanent home coordinates should be required", "Device location should be used only when necessary and with permission", "No continuous location tracking by default", "Saved preferred locations should remain private". Home city as free text with no geocoding (Milestone 1 decisions 5 and A3). Background location later, only with explicit opt-in (M0.4 §L).

## Context
A motorcyclist's home location is sensitive: bikes are valuable and theft is a real risk. Location data is also the hardest area for privacy law and app-store review.

## Decision
- Lobby **never requires** a home address or home coordinates. The profile's home city is free text.
- **Device location** is requested only when a feature needs it (for example "rides near me"), with an explanation first. It's used for that action and **isn't kept as a permanent location history**.
- **No continuous or background tracking** by default. Any later tracking feature is explicit opt-in ([ADR 0012](0012-background-tracking-deferred.md)).
- **Saved preferred locations** (if built) are visible only to their owner.
- A ride's meeting point is visible only to people allowed to see that ride.

## Alternatives considered
Storing a precise home location for "near me" convenience. Rejected: high theft and privacy risk for little benefit, since a manually chosen location covers the need.

## Consequences and trade-offs
- "Near me" searches need either live location (with permission) or a manually entered location every time, or a saved preferred location.
- **Not decided here:** how preferred locations are stored (OD-17).

## Related
[ADR 0010](0010-postgis-only-when-needed.md) · [Product requirements §H](../requirements/product-requirements.md#h-maps-and-location)
