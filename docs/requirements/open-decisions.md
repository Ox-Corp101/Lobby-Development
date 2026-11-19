# Lobby — Open Decisions Register

**Status:** Living document (M0.4, 18 November 2026). Each entry is a question that is **not yet decided**. Recommendations are recommendations only. Nothing here is approved until the product owner says so, and then the decision moves into the [product requirements](product-requirements.md) or an [ADR](../decisions/README.md).

**Milestone names** follow the approved roadmap:
- Phase 1, database foundation (M1.1 domain map; M1.2 local Supabase; M1.3 profiles migration; M1.4 apply to development; M1.5 profile data service)
- Phase 2, the Expo spike
- Phase 3, profile UI
- Phase 4, features in order: public profiles and following → garage → clubs → rides → RSVP and joining → calendar → maps, directions and manual weather → ride photos
- Phase 5, mobile release work
- Phase 6, launch readiness
- Phase 7, advanced capabilities

Every entry needs **product-owner approval** unless it says otherwise.

## Summary

| OD | Decision | Needed by |
|---|---|---|
| [01](#od-01-final-web-and-mobile-ui-architecture) | Final web/mobile UI architecture | Phase 3 (after the spike) |
| [02](#od-02-expo-spike-set-up) | Expo spike set-up | Start of Phase 2 |
| [03](#od-03-database-conventions) | Database conventions (ADR 0007) | M1.3 |
| [04](#od-04-local-supabase-and-environments) | Local Supabase (Docker) and environments | M1.2 |
| [05](#od-05-profile-table-split) | Split profiles / profile settings (ADR 0008) | M1.3 |
| [06](#od-06-exact-profile-fields) | Exact profile fields and limits | M1.3 (initial fields); before public profiles (the rest) |
| [07](#od-07-privacy-rules-for-public-profiles-and-ride-visibility) | Public profile and ride visibility rules | Before public profiles / rides |
| [08](#od-08-account-deletion) | Account deletion | Principle: M1.3; details: each feature |
| [09](#od-09-following-blocking-and-moderation) | Following, blocking, moderation | Before public profiles |
| [10](#od-10-my-garage-details) | My Garage details | Before the garage |
| [11](#od-11-club-roles-permissions-and-governance) | Club roles, permissions and governance | Before clubs |
| [12](#od-12-final-rsvp-and-capacity-rules) | Final RSVP and capacity rules | Before rides |
| [13](#od-13-ride-invitation-and-approval-rules) | Ride invitation and approval rules | Before rides |
| [14](#od-14-is-the-destination-optional) | Is the destination optional? | Before the rides migration |
| [15](#od-15-ride-status-names) | Ride status names | Before rides |
| [16](#od-16-ride-ownership-and-filter-attributes) | Ride ownership and filter attributes | Before rides |
| [17](#od-17-preferred-location-data-model) | Preferred-location data model | Before rides (discovery) |
| [18](#od-18-maps-and-geocoding-provider) | Maps and geocoding provider | Before rides |
| [19](#od-19-weather-terms-provider-and-cost) | Weather terms, provider and cost | Before rides (terms); before any forecast work (provider) |
| [20](#od-20-notification-preferences-and-delivery-rules) | Notification preferences and delivery | Before the first notification; push and email before Phases 5–6 |
| [21](#od-21-media-storage-limits-and-retention) | Media storage, limits and retention | Before the garage (first photos) |
| [22](#od-22-remaining-calendar-rules) | Remaining calendar rules | Before the calendar |
| [23](#od-23-revision-6-status-and-its-open-questions) | Revision 6 status and its open questions | Before rides |
| [24](#od-24-production-domain-and-deep-links) | Production domain and deep links | Phase 5 |
| [25](#od-25-secure-mobile-session-storage) | Secure mobile session storage | Phase 2 (tested) / Phase 5 (final) |
| [26](#od-26-spelling-convention) | Spelling convention (UK or US English) | Before more UI text (Phase 3) |
| [27](#od-27-repository-structure-and-monorepo-timing) | Repository structure and monorepo timing | When mobile code leaves the spike |
| [28](#od-28-email-provider-custom-smtp) | Email provider (custom SMTP) | Phase 6 |
| [29](#od-29-store-accounts-download-links-and-install-prompts) | Store accounts, download links and install prompts | Phase 5 |
| [30](#od-30-mobile-backward-compatibility-policy) | Mobile backward-compatibility policy | Phase 5 |

---

## Platform

### OD-01. Final web and mobile UI architecture
- **Question:** Keep the React web app with a separate Expo mobile app (Option A), or use Expo for web, iOS and Android (Option B)?
- **Why it matters:** It decides how every screen after Phase 2 is built, and roughly doubles or halves ongoing UI work. It's expensive to reverse.
- **Needed by:** Phase 3 (profile UI), decided from the Phase 2 spike report.
- **Recommendation so far:** None until the spike evidence is in. See [ADR 0003](../decisions/0003-web-and-mobile-ui-architecture.md) for the evidence required.
- **Approval required:** Yes.

### OD-02. Expo spike set-up
- **Question:**
  - a new branch (which this session can't create without permission) or a separate repository?
  - the real Supabase project with test accounts, or a separate free project?
  - local sample data, or temporary spike tables?
  - upload photos to a spike-only bucket, or stop before upload?
  - which map tile source?
- **Why it matters:** The spike must be isolated from production and never merged automatically. Every option has a different risk and set-up cost.
- **Needed by:** The start of Phase 2.
- **Recommendation so far:**
  - a separate branch or repository, never merged
  - sample data, for isolation
  - email-and-password sign-in only (email links would need Supabase redirect changes)
  - package installs only inside the spike, after approval
- **Approved already:** the spike's scope: sign-in and session persistence, rider profile, ride discovery, map display, basic photo selection and upload, navigation and responsive behaviour, and platform limitations, tested on iOS, Android and Expo Web.
- **Draft acceptance criteria (proposed, not yet approved):**
  - E1: the session survives an app restart, and is stored securely on phones.
  - E2: the profile reuses the web app's validation rules unchanged.
  - E3: the discovery list stays smooth with 200 rides.
  - E4: map markers and one-time location permission work, including handling a refusal.
  - E5: photos are picked or taken, location data is stripped (verified), and upload progress is shown.
  - E6: layouts work from 320 to 1280 px, with keyboard and screen-reader support.
  - E7: one capabilities list drives the "What is this?" message.
  - The report also measures code sharing, effort, Expo Web quality compared with the current app, and build friction.
- **Approval required:** Yes, including the acceptance criteria.

## Database foundation (before the first migration)

### OD-03. Database conventions
- **Question:** Approve the conventions in [ADR 0007](../decisions/0007-database-conventions.md):
  - UUID keys
  - `timestamptz` plus a separate IANA time zone
  - snake_case naming
  - text plus CHECK constraints instead of enum types
  - forward-only migration files
  - generated TypeScript types
- **Why it matters:** The first table sets the pattern for every later one.
- **Needed by:** M1.3.
- **Recommendation so far:** Approve as written. The "migrations are the source of truth" part is already agreed.
- **Approval required:** Yes.

### OD-04. Local Supabase and environments
- **Question:**
  - Install Docker Desktop on your Windows development computer for a local Supabase (needed for automated security-rule tests)? Docker Desktop on Windows usually runs through WSL 2 (Windows Subsystem for Linux).
  - Confirm the environment plan: local for building, the current hosted project as "development", a separate production project only at launch.
- **Why it matters:** Automated RLS tests were approved (decision A2) and need a local database. Docker uses about 2–4 GB of memory while running, and its licence terms should be checked for your situation.
- **Needed by:** M1.2.
- **Recommendation so far:** Yes to both. Production at Phase 6, likely on Supabase Pro (about $25/month, which needs approval then).
- **Approval required:** Yes. The Docker install is your choice on your computer.

### OD-05. Profile table split
- **Question:** Store public-capable profile data (`profiles`) separately from private settings (`profile_settings`)?
- **Why it matters:** Security rules control rows, not columns. Mixing private settings into a table that later becomes readable would expose them.
- **Needed by:** M1.3.
- **Recommendation so far:** Yes ([ADR 0008](../decisions/0008-public-profiles-and-private-settings.md)).
- **Approval required:** Yes.

### OD-06. Exact profile fields
- **Question:**
  - Confirm the limits: display name 2–40 characters; home city 1–80 characters. (The fields themselves are approved: display name, home city, distance unit, locale, time zone.)
  - Later: profile photo, bio, unique handles (@name) and a minimum age.
- **Why it matters:** Limits become database constraints. Handles affect profile links and uniqueness rules. A minimum age matters once profiles are public.
- **Needed by:** Limits by M1.3. The rest before public profiles.
- **Recommendation so far:** Limits as above. Decide on handles before public profiles (adding the column before launch costs little).
- **Approval required:** Yes. No other fields are assumed.

### OD-07. Privacy rules for public profiles and ride visibility
- **Question:**
  - Profile visibility options (public, followers-only, private?) and the default for new riders.
  - Which profile fields are visible to whom.
  - Whether one visibility model is reused across profiles, garages, clubs and rides.
  - Club-members-only rides.
- **Why it matters:** These become security rules. Getting them wrong exposes riders' data.
- **Needed by:** Profiles part before public profiles; rides part before rides.
- **Recommendation so far:** City-level location only; never show email; enforce everything in security rules.
- **Approval required:** Yes.

### OD-08. Account deletion
- **Question:**
  - Approve the principle: data a rider owns alone is deleted; shared data is resolved first by a server function.
  - Then per feature: future rides they organise (cancel or transfer?); clubs they own (block deletion or transfer?); past participation (remove or anonymise as "Deleted rider"?); their photos on others' rides; immediate deletion or a 30-day grace period; a minimal audit record.
- **Why it matters:** The principle decides what each table does when a profile is deleted, so it shapes the first migration. Apple requires in-app account deletion.
- **Needed by:** The principle by M1.3. The details with each feature.
- **Recommendation so far:** The principle as stated. Deletion runs server-side, after re-authentication.
- **Approval required:** Yes.

## Social and clubs

### OD-09. Following, blocking and moderation
- **Question:** One-way following or mutual friend requests? Does following affect anything beyond follower lists? Block and report behaviour; who moderates reports, and is moderation needed at launch? A daily follow limit?
- **Why it matters:** It defines the social model and the safety tools.
- **Needed by:** Public profiles and following (Phase 4).
- **Recommendation so far:** One-way following; no activity feed in v1; blocking hides both profiles from each other and removes follows in both directions.
- **Approval required:** Yes.

### OD-10. My Garage details
- **Question:**
  - make and model as free text, or a catalogue (which has a cost)?
  - one visibility setting for the whole garage, or per bike?
  - pick "which bike" when joining a ride?
  - limits (20 bikes, 5 photos each)?
  - exclude licence plates and VINs?
- **Why it matters:** Fields become constraints. Plates and VINs carry theft risk.
- **Needed by:** The garage (Phase 4).
- **Recommendation so far:** Free text; no plates or VINs; the proposed limits.
- **Approval required:** Yes.

### OD-11. Club roles, permissions and governance
- **Question:**
  - Who can create clubs, and is there a limit?
  - Roles (owner, admin, member) and what each may do.
  - Joining modes (open, approval, invitation).
  - Can members invite others or create club rides?
  - What happens to club rides when a club, or its owner's account, is deleted?
  - Unique names? A maximum size?
  - Are member lists public? Does membership show on profiles?
- **Why it matters:** These become security rules and database functions. Governance problems (for example a departed owner) are hard to fix later.
- **Needed by:** Clubs (Phase 4).
- **Recommendation so far:** Exactly one owner, who must transfer ownership before leaving; removed members need reinstatement (mirroring the ride rules); invitations reuse the ride-link design.
- **Approval required:** Yes.

## Rides

### OD-12. Final RSVP and capacity rules
- **Question:**
  - Adopt Going / Maybe / Can't Go in place of Revision 6's Confirmed / Tentative, with approval stored separately?
  - What exactly does "Can't Go" mean? (Recommended: declining an invitation.)
  - Can a rider choose Maybe on a full ride? (Revision 6 says no.)
  - Confirm that the organiser takes one seat.
- **Why it matters:** These determine the participant data model and the atomic seat functions. See [product requirements §F](product-requirements.md#f-rsvp-approval-and-capacity).
- **Needed by:** Rides (Phase 4), before the rides migration.
- **Recommendation so far:** The mapping in §F (Going = Confirmed, Maybe = Tentative, Going with approval pending = Pending Approval); Can't Go option (a).
- **Approval required:** Yes. Until then, Revision 6 applies.

### OD-13. Ride invitation and approval rules
- **Question:**
  - Revision 6 offers only shared invitation links in the initial release (direct invitations are FUTURE). If "Can't Go" is a reply to an invitation, do direct invitations move into v1?
  - Club-member invitations to club rides.
  - Revision 6's open approval questions (OD-23).
- **Why it matters:** "Can't Go" has nothing to reply to without direct invitations.
- **Needed by:** Rides and RSVP (Phase 4).
- **Recommendation so far:** None yet.
- **Approval required:** Yes.

### OD-14. Is the destination optional?
- **Question:** Must every ride have a destination, or is it optional (for example for a pure meetup)?
- **Why it matters:** Required or optional is a database constraint, and affects forecasts and display.
- **Needed by:** The rides migration.
- **Recommendation so far:** Undecided. Revision 6 lists it as a creation field; the M0.4 direction leaves it open.
- **Approval required:** Yes.

### OD-15. Ride status names
- **Question:** Revision 6 approved **Scheduled, Weather Review, Canceled, Completed**. The newer proposal is **Upcoming, Postponed, Cancelled, Completed**.
  - Is "Weather Review" kept?
  - What does "Postponed" mean, given that Revision 6 handles rescheduling without a separate status?
  - A Revision 6 ride stays "Scheduled" after departure until completed. "Upcoming" would be misleading then.
- **Why it matters:** Statuses become CHECK constraints and drive discovery, the calendar and notifications.
- **Needed by:** Rides (Phase 4).
- **Recommendation so far:** None. A possible approach to discuss: keep stored statuses as in Revision 6 and use "Upcoming" only as a display label for future rides.
- **Approval required:** Yes.

### OD-16. Ride ownership and filter attributes
- **Question:**
  - Every ride has an individual organiser plus an optional club?
  - Adopt the proposed attributes (format, pace, audience)? Optional or required? Single or multiple choice? Can the lists be changed later?
- **Why it matters:** Ownership decides accountability and permissions. Attributes become filter columns.
- **Needed by:** Rides (Phase 4).
- **Recommendation so far:** An individual organiser plus an optional club. The attributes as listed, kept separate from the organiser-written title, with no AI classification (approved).
- **Approval required:** Yes.

### OD-17. Preferred-location data model
- **Question:**
  - How many preferred locations may a rider save, and with what labels?
  - How precise (city centre or exact point)?
  - Does discovery match preferred locations against meeting points only (as in Revision 6), or destinations too?
  - Does "selected city" (Revision 6) become "preferred location"?
- **Why it matters:** It's private location data, which needs its own always-private table, and it affects the discovery queries.
- **Needed by:** Rides discovery (Phase 4).
- **Recommendation so far:** A separate, owner-only table. Never a home address ([ADR 0009](../decisions/0009-no-home-coordinates-or-continuous-tracking.md)).
- **Approval required:** Yes.

### OD-18. Maps and geocoding provider
- **Question:** Google Maps, Mapbox or OpenStreetMap-based options?
- **Why it matters:** Cost, licensing and coverage, and whether it works in React Native and on the web.
- **Needed by:** Rides (Phase 4). The spike needs a tile source earlier (OD-02).
- **Recommendation so far:** Research hasn't started (Revision 6 §10.2). The deliverable is one recommendation with costs, reviewed before any selection.
- **Approval required:** Yes, including any cost.

### OD-19. Weather terms, provider and cost
- **Question:**
  - Ride conditions as in Revision 6 (Dry Only / Rain or Shine), or the newer preferences (Rain or Shine / Dry Conditions Preferred / Weather Dependent)?
  - Do they describe the ride, the rider, or both?
  - For forecast indicators (Dry forecast / Rain possible / Wet conditions expected): the provider, cost, rain thresholds, coverage, and when forecasts are checked, for the meeting point and destination.
- **Why it matters:** Ride conditions are a database field. Forecasts need a paid or rate-limited service (Revision 6 §9.2 requires approval).
- **Needed by:** The terms before rides. The provider before any forecast work.
- **Recommendation so far:** No automatic cancellation in v1 (approved).
- **Approval required:** Yes.

### OD-20. Notification preferences and delivery rules
- **Question:**
  - Which events reach push or email (Revision 6 §8.2 lists the in-app events)?
  - Rider preferences per event or per channel?
  - Quiet hours?
  - Social and club events (new follower, club request)?
  - When does email start (it needs custom SMTP, OD-28)?
- **Why it matters:** Too many notifications drive riders away. Push and email have delivery costs.
- **Needed by:** The first notification-producing feature (in-app only). Push and email before Phases 5–6.
- **Recommendation so far:** In-app first; native push on mobile; transactional email only; web push deferred (approved).
- **Approval required:** Yes.

### OD-21. Media storage, limits and retention
- **Question:**
  - Public storage, or private storage with time-limited links, for each image type?
  - Photos only at first?
  - Limits (for example 1 profile photo, 5 per bike, 10 per rider per ride)?
  - A server-side location-data check as well as the on-device stripping?
  - Moderation and reporting?
  - How long ride photos are kept?
- **Why it matters:** Photos are the largest variable cost, and a privacy risk.
- **Needed by:** The garage (the first photos, Phase 4).
- **Recommendation so far:** Photos only; resize and strip location data on the device; private storage for ride and club photos.
- **Approval required:** Yes.

### OD-22. Remaining calendar rules
- **Question:**
  - How are requests closed automatically at departure shown (Revision 6 Q22)?
  - Does public-ride history show the participant list (Q24)?
  - How would a "Postponed" ride appear, if adopted?
  - Do "Can't Go" answers appear anywhere?
- **Why it matters:** The calendar is driven by these states.
- **Needed by:** The calendar (Phase 4).
- **Recommendation so far:** None.
- **Approval required:** Yes.

### OD-23. Revision 6 status and its open questions
- **Question:**
  - Confirm that Revision 6 is approved as the detailed ride requirements. Its header still says "Awaiting review"; many sections are individually marked [APPROVED].
  - Resolve its open questions (§12.2): Q6 link expiry after a later reschedule; Q9a the cooldown message; Q13 whether withdrawn riders can rejoin; Q17 link limit versus open seats; Q18 maximum capacity; Q20 what reinstatement does; Q21 pending requests on cancellation; Q22 closed-request label; Q23 "original departure time" wording; Q24 participant list in history; Q25 bulk-decline after revoking a link.
  - Confirm its provisional values (24-hour cooldown, 50 link uses, 30-day maximum expiry).
- **Why it matters:** Ride implementation needs a final rule set.
- **Needed by:** Rides (Phase 4).
- **Recommendation so far:** See Revision 6 §12.
- **Approval required:** Yes.

## Mobile release and launch

### OD-24. Production domain and deep links
- **Question:** Which domain, and when? Hosting for the web app?
- **Why it matters:** Mobile email links (confirmation, reset) need Universal Links (iOS) and App Links (Android) on a real HTTPS domain, plus Supabase redirect settings.
- **Needed by:** Phase 5.
- **Recommendation so far:** Prefer Universal Links and App Links over custom URL schemes (harder to hijack). PKCE already makes a stolen code useless on its own.
- **Approval required:** Yes, including any cost.

### OD-25. Secure mobile session storage
- **Question:** How are sign-in sessions stored on phones?
- **Why it matters:** A session is a key to the account. Plain storage on a phone is weaker than the platform's secure storage (iOS Keychain, Android Keystore).
- **Needed by:** Tested in the Phase 2 spike (E1); final in Phase 5.
- **Recommendation so far:** Use platform secure storage. The spike should check that Supabase's session size works with the chosen storage method.
- **Approval required:** Yes, at the spike review.

### OD-26. Spelling convention
- **Question:** British English ("organiser", "cancelled", "colour") or American English ("organizer", "canceled") in the app and documents?
- **Why it matters:** The interface should be consistent. The documents currently differ (Revision 6 is American; the M0.4 documents are British).
- **Needed by:** Before more interface text is written (Phase 3).
- **Recommendation so far:** None. It's your choice, probably matching your main audience.
- **Approval required:** Yes.

### OD-27. Repository structure and monorepo timing
- **Question:** When, and how, should web and mobile code share a repository?
- **Why it matters:** Shared logic ([ADR 0004](../decisions/0004-share-logic-not-ui.md)) needs a home. Tooling too early adds complexity.
- **Needed by:** When mobile code moves beyond the spike.
- **Recommendation so far:** No monorepo yet. Later, npm workspaces only.
- **Approval required:** Yes.

### OD-28. Email provider (custom SMTP)
- **Question:** Which email provider sends confirmation, reset and (later) notification emails?
- **Why it matters:** It's a launch requirement. Supabase's built-in email is rate-limited and can't use custom templates; custom templates enable the token-hash links (cross-browser) already supported in code.
- **Needed by:** Phase 6.
- **Recommendation so far:** Present the options, costs and a recommendation before choosing (M1 decision 10).
- **Also to verify then:** Lobby's rejected-registration messages against real Supabase. This was skipped in M0.5 (19 November 2026) to avoid creating accounts or using email quota.
- **Approval required:** Yes.

### OD-29. Store accounts, download links and install prompts
- **Question:** When to create the Apple Developer and Google Play accounts (owned by you)? Exactly where do contextual installation prompts and download links appear?
- **Why it matters:** Accounts have yearly or one-off fees and are needed for device testing and release.
- **Needed by:** Phase 5 (some device testing may need them earlier).
- **Already approved:** App Store and Google Play download links must not appear until genuine store listings exist ([product requirements A-11](product-requirements.md#a-platform-strategy)).
- **Recommendation so far:** Prompts appear only where a rider meets a mobile-only feature.
- **Approval required:** Yes.

### OD-30. Mobile backward-compatibility policy
- **Question:** How long are older app versions supported? Is a "please update" mechanism needed?
- **Why it matters:** Released apps can't be updated instantly, so database changes must not break versions still in use.
- **Needed by:** Phase 5.
- **Recommendation so far:** Add database changes before removing anything; remove only once old versions are unsupported.
- **Approval required:** Yes.
