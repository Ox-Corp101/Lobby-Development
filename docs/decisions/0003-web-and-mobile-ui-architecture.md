# 0003. Separate web and mobile UIs, or Expo for all platforms

- **Status:** Deferred (until the Expo spike has been run and evaluated)
- **Date:** 2026-11-18
- **Decision source:** Product owner: "run an Expo spike before choosing between separate web/mobile UI codebases or Expo across all platforms". The spike's expanded scope is approved: sign-in, rider profile, ride discovery, map display and photo upload, tested on iOS, Android and Expo Web.

## Context
There are two realistic ways to build Lobby's screens:

| | **Option A:** keep the React web app + a separate Expo mobile app | **Option B:** Expo for web, iOS and Android |
|---|---|---|
| UI work per feature | About twice | About once, plus platform tweaks |
| Web quality (accessibility, page structure, load size) | Best: plain web HTML | Not yet measured |
| Existing web screens | Kept | Rewritten (the logic is reused) |
| Main risk | Ongoing double work; platforms drift apart | Unknown Expo Web limitations |

## Decision
**Not decided.** Phase 2 runs an isolated Expo spike. It must not be merged into the production app automatically. Its report decides between A and B, using this evidence:
1. Web quality compared with today's app: keyboard use, screen readers, contrast, page structure, bundle size and load time.
2. How much code was shared, and how many screens needed platform-specific changes.
3. Map display and photo upload working on all three platforms.
4. Developer effort per screen, and how understandable the code is.
5. Build and release friction for iOS and Android.

## Alternatives considered
Deciding now without evidence. Rejected: either option is expensive to reverse once features are built.

## Consequences and trade-offs
- Phase 3 (profile UI) and later screens must wait for this decision, so they aren't built in the wrong stack.
- Database work (Phase 1) doesn't depend on it and can go ahead.
- Spike set-up decisions (a branch or a separate repository, which Supabase project, map tiles) are still open: OD-02.

## Related
[ADR 0002](0002-expo-react-native-for-mobile.md) · [ADR 0004](0004-share-logic-not-ui.md) · [Open decisions OD-01, OD-02](../requirements/open-decisions.md)
