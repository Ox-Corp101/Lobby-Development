# Lobby — Product Requirements

**Status:** Draft for product-owner review (M0.4, 18 November 2026). Writing this document doesn't approve anything new: every requirement keeps the label below.
**Scope:** The whole product, at summary level. The detailed rules for rides, the calendar, capacity, private rides and weather stay in [Ride Discovery, Calendar & Weather Requirements, Revision 6](../plan/ride-discovery-calendar-weather.md) ("Revision 6"). This document **does not change Revision 6**. Where the newer direction differs from it, the difference is listed in [§13](#13-differences-from-revision-6) and kept open.

## 0. How to read this document

| Label | Meaning |
|---|---|
| **Implemented** | Built, and verified in the repository (and on real Supabase where stated). |
| **Approved** | An explicit product-owner decision. The source is given in brackets. |
| **Proposed** | A recommendation that is **not yet approved**. |
| **Open** | An unresolved decision, tracked in [open decisions](open-decisions.md) as **OD-nn**. |
| **Future** | Not a v1 commitment. |

**Sources referred to**
- *M1 decisions:* the product owner's Milestone 1 architecture approvals (stack; authentication; profile fields; profiles owner-only; decisions A1–A7).
- *Cross-platform direction:* the product owner's cross-platform brief (native mobile as the complete experience; web as core functionality; "What is this?" explanations; install prompts).
- *Roadmap:* the approved development sequence, Phase 0 → Phase 7.
- *M0.4 brief:* the product owner's M0.4 instructions of 18 November 2026. Items written there as firm requirements are labelled Approved. Items written there as "proposed" stay Proposed.
- *Revision 6:* the detailed ride requirements. Where this document labels a Revision 6 rule Approved, it's because Revision 6 itself marks that rule [APPROVED]. **Revision 6 as a whole has not been formally approved.** Its header still says it is awaiting review, and that stays open (OD-23).
- *Six-area draft:* requirement proposals for following, garage, clubs, photos, tracking and account deletion. They were drafted for review and **never approved**, so they appear here only as Proposed or Open.

**What "v1" means:** the first public release, covering roadmap Phases 1–6. Phase 7 items are Future.

**Spelling:** this document uses British spelling ("organiser", "cancelled"). Revision 6 uses American spelling ("organizer", "canceled"). They mean the same thing. Which spelling the app should use is OD-26.

---

## 1. Current state (what actually exists)

| Area | State |
|---|---|
| Web app shell (React, TypeScript, Vite, Tailwind), responsive layout | **Implemented** |
| Sign-up, email confirmation, sign-in, sign-out, password reset (Supabase, PKCE links) | **Implemented**, and verified on real Supabase by the product owner. Some checks remain for M0.5. |
| Automated checks: 63 unit tests, 57 browser tests, GitHub Actions CI | **Implemented** (M0.1–M0.3) |
| Rider profile | **Not built.** `/profile` is a placeholder page. There are no database tables yet. |
| Everything in sections C–L | **Not built** |
| Mobile apps | **Not started.** The Expo spike (Phase 2) hasn't been run. |

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Rider** | A person with a Lobby account. |
| **Organiser** | The individual rider who creates and is responsible for a ride. Every ride has exactly one organiser. Revision 6 spells it "organizer". |
| **Ride** | A planned group ride or meetup with a time, a meeting point and participants. "Ride" covers social meetups too. |
| **Meetup** | A ride whose main purpose is gathering. In the proposed model, it's one possible *ride format*, not a separate kind of object. |
| **Meeting point** | Where riders gather before departure. Drives "nearby" discovery and the ride's time zone (Revision 6). Also called the *meetup location*. |
| **Destination** | Where the ride goes. A separate location from the meeting point. Whether it's required is OD-14. |
| **Departure time** | When the group leaves the meeting point. Joining closes at departure (Revision 6). |
| **RSVP** | A rider's answer to a ride. Revision 6 uses Confirmed / Tentative; the proposed terms are Going / Maybe / Can't Go (see §F). |
| **Approval** | The organiser accepting a rider onto a ride that requires it. Separate from RSVP and from capacity. |
| **Capacity** | The maximum number of seats on a ride, including the organiser's. |
| **Seat** | A place counted against capacity. Only the organiser and approved Going (Confirmed) riders take seats. |
| **Ride status** | The state of the ride itself (for example cancelled). Separate from each rider's RSVP. |
| **Club** | A permanent community of riders, with membership. |
| **Club member** | A rider who has joined a club. Membership is separate from following and from joining a ride. |
| **Following** | A rider choosing to keep up with another rider. It creates no membership and gives no permissions. |
| **My Garage** | A rider's list of their motorcycles. |
| **Preferred location** | A place a rider chooses manually to search around, instead of their live device location. Private to the rider. |
| **Public-capable profile data** | Profile information that may be shown to other riders once public profiles exist. |
| **Private settings** | Account settings that are never shown to other riders (for example locale and time zone). |
| **"What is this?"** | A small in-app explanation of why a feature isn't available, or isn't working, on the current platform. |

---

## 3. v1 and future at a glance

| Area | v1 | Future (not v1) |
|---|---|---|
| Accounts and profiles | Yes (Phases 1 and 3) | Social sign-in (Google, Apple) |
| Public profiles, following, My Garage | Yes (Phase 4) | — |
| Clubs | Yes (Phase 4) | — |
| Rides, RSVP, capacity, calendar, discovery list | Yes (Phase 4) | Map-based discovery, month-grid calendar (Revision 6) |
| Maps, directions, manual weather management | Yes (Phase 4) | Automatic weather actions |
| Weather forecasts | Only if a provider is approved (OD-19) | — |
| Photos (profile, motorcycles, rides) | Yes, photos only | Video, advanced camera workflows |
| In-app notifications | Yes | Web push |
| Native push, transactional email | With the mobile and launch phases (5–6) | — |
| Mobile apps (iOS, Android) | Phase 5 release | — |
| Background location, live tracking, live sharing | No | Phase 7 |

---

## A. Platform strategy

| ID | Requirement | Label |
|---|---|---|
| A-1 | The **web app** provides Lobby's core functionality: authentication and profiles, rider discovery and following, My Garage, clubs, ride discovery, creation and joining, personal calendars, ride details, maps and weather information, and basic photo uploads. | **Approved** (cross-platform direction) |
| A-2 | The **iOS and Android apps** provide the complete mobile experience. Native push notifications, advanced camera and media capture, and (later) background location are prioritised there. | **Approved** (cross-platform direction) |
| A-3 | The existing web stack is **React + TypeScript + Vite** (with Tailwind, React Router, Zod, React Hook Form). | **Implemented** |
| A-4 | Mobile apps are built with **React Native + Expo**. | **Proposed** ([ADR 0002](../decisions/0002-expo-react-native-for-mobile.md)) |
| A-5 | **One shared Supabase backend** (per environment) for all platforms. One account works everywhere. | **Approved** ([ADR 0001](../decisions/0001-shared-supabase-backend.md)) |
| A-6 | Business logic and validation are shared where appropriate. UI sharing isn't forced. | **Approved** ([ADR 0004](../decisions/0004-share-logic-not-ui.md)) |
| A-7 | Whether the web UI stays separate or moves to Expo for all platforms is decided **after the Expo spike**. The spike isn't done. | **Open**, OD-01 ([ADR 0003](../decisions/0003-web-and-mobile-ui-architecture.md)) |
| A-8 | When a feature is unavailable on the rider's platform, the app **says so and explains why** rather than hiding it silently. Each explanation has a small **"What is this?"** control. | **Approved** (cross-platform direction) |
| A-9 | Explanations distinguish the reason, as in the table below. | **Approved** (M0.4 brief); wording **Proposed** |
| A-10 | **Install prompts are selective and contextual.** They appear when a rider meets a mobile-only feature, plus subtle download links elsewhere, and are never a blocking interruption. | **Approved** (cross-platform direction, M0.4 brief) |
| A-11 | **App Store and Google Play download links must not appear until genuine store listings exist.** The timing of the developer accounts and the exact placement of installation prompts remain open (OD-29). | **Approved** (product owner, M0.4 review, 19 November 2026) |

**Reasons a feature may not work (A-9)**

| Reason | Example | What the rider should be told (proposed) |
|---|---|---|
| **Platform limitation** | Background location on the web | It's available in the mobile app, with an install prompt. |
| **Browser limitation** | A browser that doesn't support a needed feature | Which browser or version works. |
| **Permission denied** | Location permission refused | How to change it in settings. No repeated nagging. |
| **Permission not requested yet** | First use of "near me" | What will be asked and why, *before* the system prompt. |
| **Temporary error** | Network failure, service unavailable | That it's temporary, and to try again. Never presented as unsupported. |

---

## B. Accounts and profiles

**Authentication**

| ID | Requirement | Label |
|---|---|---|
| B-1 | Email and password registration, with **email confirmation** before use. | **Implemented** |
| B-2 | Sign-in and sign-out. Ordinary sign-out affects this device only. | **Implemented** |
| B-3 | **Password recovery** by emailed link. The reset form appears only during a genuine recovery. After a successful reset, Lobby **requests a global sign-out** from Supabase. If that request fails, this device is still signed out and the rider is told that other devices couldn't be confirmed. Global sign-out **revokes the account's refresh sessions**, so other devices can't renew their sign-in. **Access tokens already issued stay valid until they expire** (by default up to about an hour). Real cross-device invalidation **has not been verified yet**: it's an M0.5 manual check. | **Implemented**: the reset flow and the global sign-out request (verified with automated tests against a fake Supabase). Real cross-device invalidation: **not yet verified** (M0.5). See [ADR 0013](../decisions/0013-authentication-email-links-and-sessions.md). |
| B-4 | Passwords: at least 8 characters (counted as characters, not bytes), no forced character mixes, at most 72 bytes. | **Implemented**. The 72-byte limit is provisional until the M0.5 manual check. |
| B-5 | Messages never reveal whether an email address has an account. | **Implemented** |
| B-6 | Email links work only in the browser that requested them, until custom email templates exist. **Custom SMTP plus token-hash templates are a launch requirement.** | **Implemented** (limitation); **Approved** (launch requirement); provider: OD-28 |
| B-7 | Social sign-in (Google, Apple). | **Future** (deferred, M1 decisions) |

**Profiles**

| ID | Requirement | Label |
|---|---|---|
| B-8 | Initial profile fields: **display name, home city, distance unit (km or mi), locale, time zone**. | **Approved** (M1 decisions). Exact length limits: **Proposed** (display name 2–40, home city 1–80), OD-06 |
| B-9 | Home city is **free text**: no suggestion list and no geocoding yet. | **Approved** (M1 decisions 5, A3) |
| B-10 | The profile is **created explicitly** after registration and confirmation, and the rider can **view and edit** their own profile. | **Approved** (M1 decisions 6, A1). Not built. |
| B-11 | Profiles are **private to their owner** until public profiles are introduced, with appropriate security rules. | **Approved** (M1 decision 7) |
| B-12 | Public-capable profile data is kept separate from private account settings. | **Proposed** ([ADR 0008](../decisions/0008-public-profiles-and-private-settings.md)), OD-05 |
| B-13 | Profile photo, bio, unique handles and a minimum age. | **Open**, OD-06. Photos and minimum age were deferred in M1. No other fields have been agreed. |

**Account deletion**

| ID | Requirement | Label |
|---|---|---|
| B-14 | Riders can **delete their account from inside the app** on every platform. Apple requires in-app deletion for apps that offer account creation. | **Proposed** (six-area draft) |
| B-15 | Deletion runs **on the server** in a secure function. The app never holds the privileged key. | **Proposed** |
| B-16 | Principle: data the rider **owns alone** (settings, garage, saved locations, follows) is deleted. Data **shared with others** (rides they organise, clubs they own, photos on others' rides) is resolved first, by cancelling, transferring or anonymising it, and only then is the account deleted. | **Proposed**, OD-08. Needed before the first migration. |
| B-17 | Re-authentication before deletion; a grace period or immediate deletion; what happens to each kind of shared content. | **Open**, OD-08 |

**Privacy and data access**

| ID | Requirement | Label |
|---|---|---|
| B-18 | Riders' email addresses are never shown to other riders. | **Proposed** (six-area draft) |
| B-19 | Access is enforced by database security rules, not only by the app's screens. | **Approved** ([ADR 0005](../decisions/0005-row-level-security-default-deny.md)) |
| B-20 | Public profile visibility options and defaults. | **Open**, OD-07 |

---

## C. Social features

| ID | Requirement | Label |
|---|---|---|
| C-1 | **Public rider profiles**, showing only fields the rider's visibility allows. Never email, never a precise location. | **Approved** as a direction (cross-platform direction: "rider discovery and following"). Fields and visibility: **Open**, OD-06 and OD-07 |
| C-2 | **Following** other riders. Following is **not** joining a club: it gives no membership, permissions or access to private content. | **Approved** as a feature (cross-platform direction). The distinction is **Approved** (M0.4 brief) |
| C-3 | One-way following (like Instagram) rather than mutual friend requests. | **Proposed**, OD-09 |
| C-4 | Blocking and reporting riders; moderation. | **Proposed** / **Open**, OD-09 |
| C-5 | **My Garage:** riders list their motorcycles, with information and photos. | **Approved** as a feature (cross-platform direction). Fields: **Open**, OD-10 |
| C-6 | Garage proposals: make and model as free text, year, optional nickname, engine size, colour and description; up to 5 photos per bike; one primary bike; **no licence plates or VINs** (theft and privacy risk). | **Proposed** (six-area draft), OD-10 |
| C-7 | No activity feed in v1. | **Proposed** |

---

## D. Clubs

| ID | Requirement | Label |
|---|---|---|
| D-1 | **Clubs are permanent rider communities** with members. | **Approved** as a feature (cross-platform direction) |
| D-2 | **Club membership** is separate from **following**: following a rider never makes anyone a member of anything. | **Approved** (M0.4 brief) |
| D-3 | **Joining a ride is not joining a club.** Taking part in a club's ride doesn't make a rider a member, and leaving a ride doesn't affect membership. | **Approved** (M0.4 brief) |
| D-4 | Club invitations and membership management: requests, invitations, removal and leaving. | **Approved** as a feature (M0.4 brief); rules **Open**, OD-11 |
| D-5 | Proposed roles: exactly one **owner**, **admins** and **members**. The owner can't leave without transferring ownership. Joining modes: open, approval required, or invitation only. Invitations reuse the ride invitation-link design. | **Proposed** (six-area draft), OD-11 |
| D-6 | Unresolved: who may create clubs; whether members may invite or create club rides; club ride visibility; club deletion and owner deletion; unique names; size limits; whether member lists and membership are public. | **Open**, OD-11 |

---

## E. Rides and meetups

| ID | Requirement | Label |
|---|---|---|
| E-1 | Riders can **discover nearby rides and meetups**. Revision 6 defines the discovery list: radius 40 km by default (5–160 km), km or miles, soonest departure first, private and past rides excluded. | **Approved** (Revision 6 §3) |
| E-2 | Discovery can centre on **live device location** (with permission) **or a manually entered preferred location**. | **Approved** (M0.4 brief). Revision 6 says "selected city"; see §13 and OD-17 |
| E-3 | Preferred locations may be relevant to both meeting points and destinations. | **Open**, OD-17. Revision 6 matches discovery on the meeting point only. |
| E-4 | Every ride has **one individual organiser** and may optionally be **associated with a club**. | **Proposed**, OD-16. Revision 6 has no clubs. |
| E-5 | **Meeting point and destination are separate** locations. | **Approved** (Revision 6 §6, M0.4 brief) |
| E-6 | The meeting point is **required**. | **Approved** (Revision 6 §6) |
| E-7 | Whether the destination is optional. | **Open**, OD-14. Revision 6 lists it as a creation field. |
| E-8 | **Organisers write their own ride title** and description, for example "Night Sprint", "Midnight Cruise" or "Sunday Coffee Run". The title is **not** a predefined category. | **Approved** (M0.4 brief; title and description are required in Revision 6 §6) |
| E-9 | Optional structured attributes for filtering, separate from the title: **ride format** (Social/Meetup, Coffee Run, Scenic Ride, Day Trip, Touring, Group Ride); **group pace** (Relaxed, Moderate, Experienced Group); **intended audience** (New Rider Friendly, Experienced Riders). | **Proposed** (M0.4 brief), OD-16 |
| E-10 | **No AI-based ride classification in v1.** | **Approved** (M0.4 brief) |
| E-11 | A creative title is **never treated as evidence** of actual speed or riding behaviour. Filters use only the organiser-chosen attributes. | **Approved** (M0.4 brief) |
| E-12 | Other ride creation rules (capacity default 10, minimum 2, including the organiser; public or private; approval off by default; the ride's time zone taken from the meeting point). | **Approved** (Revision 6 §6) |

---

## F. RSVP, approval and capacity

**Proposed RSVP terms** (M0.4 brief and architecture decision paper). This proposal **doesn't replace Revision 6** until it's approved (OD-12).

| Proposed answer | Corresponds to (Revision 6) | Takes a seat? | On the rider's calendar? |
|---|---|---|---|
| **Going**, ride without approval | Confirmed | Yes | Yes |
| **Going**, approval pending | Pending Approval | No | Yes, "Awaiting Approval" |
| **Going**, approved | Confirmed | Yes | Yes |
| **Maybe** | Tentative | No | Yes, as tentative |
| **Can't Go** | No equivalent. It declines an invitation and is not active participation. | No | No |

| ID | Requirement | Label |
|---|---|---|
| F-1 | **Approval and capacity are separate.** Approval asks whether this rider *may* join (the organiser decides); capacity asks whether there's *room* (the database decides). Both are checked together. | **Approved** (Revision 6 §5.4; M0.4 brief) |
| F-2 | **Only approved Going riders (and the organiser) occupy seats.** | **Approved** (Revision 6 §4.1: only the organiser and Confirmed riders take seats) |
| F-3 | **Maybe doesn't reserve capacity.** | **Approved** (Revision 6 §4.1, Tentative) |
| F-4 | **Capacity is enforced atomically in the database**, so concurrent joins never overbook. | **Approved** (Revision 6 §4.2; [ADR 0006](../decisions/0006-database-enforced-rules-and-atomic-capacity.md)) |
| F-5 | The Going / Maybe / Can't Go vocabulary, and how it's stored (an RSVP answer plus a separate approval state). | **Proposed**, OD-12 |
| F-6 | **Can't Go** means declining an invitation, not a public "not interested". | **Proposed** (decision-paper option (a)), OD-12. Revision 6 has no direct invitations in the initial release (only shared links; direct invitations are FUTURE), so it's unclear what a rider would reply "Can't Go" to in v1 (OD-13). |
| F-7 | Can a rider choose **Maybe** on a full ride? Revision 6 §4.3 says nobody can join a full ride, *including as Tentative*. | **Open**, OD-12. Revision 6 applies until it's decided. |
| F-8 | All other Revision 6 rules stay as written: leaving, removal and reinstatement, declines and the cooldown, seat allocation without priority, capacity reduction, and reconfirmation after a reschedule. | **Approved** only where Revision 6 marks a rule [APPROVED]; its [OPEN] and [PROVISIONAL] items keep those labels. Revision 6 as a whole is still pending review (OD-23). |

---

## G. Ride calendar

| ID | Requirement | Label |
|---|---|---|
| G-1 | Riders see their rides in a **personal calendar**: This Week, Upcoming Rides and Past Rides, with the ride's local time first and the rider's own time shown when it differs. | **Approved** (Revision 6 §2.1) |
| G-2 | The calendar reflects the rider's participation: rides they organise, are Going to (Confirmed), Maybe (Tentative), or are awaiting approval for. | **Approved** (Revision 6 §2.1) |
| G-3 | **Tentative and confirmed participation are visibly different.** | **Approved** (M0.4 brief; Revision 6 labels) |
| G-4 | **Ride status is separate from RSVP status.** | **Approved** (Revision 6 §7.2) |
| G-5 | Proposed ride statuses: **Upcoming, Postponed, Cancelled, Completed**. Revision 6's approved statuses are **Scheduled, Weather Review, Canceled, Completed**. | **Open**, OD-15. Revision 6 applies until it's decided. |
| G-6 | Month-grid calendar view. | **Future** (Revision 6) |
| G-7 | Unresolved calendar rules: how auto-closed requests appear (Revision 6 Q22); whether public-ride history shows the participant list (Q24); how a "Postponed" ride would appear, if adopted; whether "Can't Go" answers appear anywhere. | **Open**, OD-22 |

---

## H. Maps and location

| ID | Requirement | Label |
|---|---|---|
| H-1 | The meeting point is easy to **open in Google Maps** (or the device's maps app) and to **copy**. | **Approved** (M0.4 brief). How it opens on each platform is designed with rides. |
| H-2 | Search works with **live location** or a **manually entered preferred location**. | **Approved** (M0.4 brief) |
| H-3 | **No home address or permanent home coordinates are required.** | **Approved** ([ADR 0009](../decisions/0009-no-home-coordinates-or-continuous-tracking.md)) |
| H-4 | Device location is used **only when needed, with permission**, explained first. | **Approved** (ADR 0009) |
| H-5 | **No continuous location tracking by default.** | **Approved** (ADR 0009) |
| H-6 | **Saved preferred locations are private** to their owner. | **Approved** (ADR 0009). Data model: **Open**, OD-17 |
| H-7 | PostGIS is added only when real proximity queries need it. | **Approved** ([ADR 0010](../decisions/0010-postgis-only-when-needed.md)) |
| H-8 | The map and geocoding provider (and its cost). It must also work in React Native. | **Open**, OD-18. Research hasn't started (Revision 6 §10.2). |
| H-9 | Map-based discovery. | **Future** (Revision 6) |

---

## I. Weather

| ID | Requirement | Label |
|---|---|---|
| I-1 | Manual weather management: organisers send disruption notices, and can cancel (with a reason) or reschedule. The weather policy is shown on rides. | **Approved** (Revision 6 §9.1) |
| I-2 | **No automatic ride cancellation in v1.** The **organiser decides** whether to postpone or cancel. | **Approved** (Revision 6 §9.1; M0.4 brief) |
| I-3 | Proposed weather preferences: **Rain or Shine**, **Dry Conditions Preferred**, **Weather Dependent**. Revision 6's approved ride conditions are **Dry Only** and **Rain or Shine**. Whether these describe the ride, the rider or both is unclear. | **Open**, OD-19 |
| I-4 | Proposed forecast indicators: **Dry forecast**, **Rain possible**, **Wet conditions expected**, considering the meeting point and the destination where relevant. | **Proposed**. Needs an approved weather provider, threshold and cost (Revision 6 §9.2: an enhancement that requires approval), OD-19 |
| I-5 | A forecast is never treated as certain. | **Approved** (Revision 6 §9.2) |

---

## J. Media and photos

| ID | Requirement | Label |
|---|---|---|
| J-1 | **Profile photos, motorcycle photos and ride photos.** | **Approved** as features (cross-platform direction; M0.4 brief). Each arrives with its feature (Phase 4). |
| J-2 | **Basic photo upload works on the web**, and on phones the browser may offer the camera. Don't assume browsers can't use the camera. | **Approved** (cross-platform direction) |
| J-3 | Advanced camera and video workflows are mobile-first. | **Approved** (cross-platform direction); timing **Future** |
| J-4 | **EXIF location (GPS) metadata is removed before upload** where appropriate. Whether the server also checks is OD-21. | **Approved** (M0.4 brief) |
| J-5 | Photos only at first, resized and compressed on the device; proposed per-type limits; public versus private storage; moderation; retention. | **Proposed** / **Open**, OD-21 |

---

## K. Notifications

| ID | Requirement | Label |
|---|---|---|
| K-1 | **In-app notifications** for the core ride events listed in Revision 6 §8.2. | **Approved** (Revision 6 §8) |
| K-2 | **Native push notifications** in the mobile apps. | **Approved** as a direction (cross-platform direction). Timing: with the mobile release (Phase 5). Revision 6 marks push FUTURE for the core ride release. |
| K-3 | **Email notifications** where appropriate. Revision 6 limits them to transactional email (cancellation, reschedule, approval decisions, invitations). | **Approved** as a direction; Revision 6 marks it FUTURE. Provider: OD-28 |
| K-4 | **Web push is deferred.** | **Approved** (M0.4 brief) |
| K-5 | No general notification framework is built before a real feature needs one. | **Approved** ([ADR 0011](../decisions/0011-build-features-end-to-end.md)) |
| K-6 | Unresolved: which events go to push or email; rider preferences (per event or per channel); quiet hours; social and club notification types (new follower, club request). | **Open**, OD-20 |

---

## L. Future capabilities (not v1)

| Capability | Notes | Label |
|---|---|---|
| **Background location** | Explicit opt-in, privacy controls (for example privacy zones and retention limits), visible tracking status, battery care. Mobile only. | **Future** (Phase 7, [ADR 0012](../decisions/0012-background-tracking-deferred.md)) |
| **Live ride tracking** | Draft options (personal recording, shared route after the ride, live group map) are proposals only. | **Future** |
| **Live location sharing** | Only among a ride's participants, during the ride, if ever approved. | **Future** |
| **Automatic weather-related actions** | Needs an approved provider and rules (Revision 6 §9.2). | **Future** |
| **Advanced camera and video workflows** | Mobile-first. | **Future** |
| Map discovery; month-grid calendar; direct invitations; reconfirmation deadlines | From Revision 6. | **Future** |

---

## 13. Differences from Revision 6

Revision 6 is unchanged. Each difference below stays open until the product owner decides it.

| # | Topic | Revision 6 (current) | Newer direction | Open decision |
|---|---|---|---|---|
| 1 | Document status | Header says "Awaiting review. Do not begin implementation … until explicitly approved." Many items are individually marked [APPROVED]. | Used as the detailed source for rides. Its overall status stays pending review; its individually [APPROVED] sections keep their labels. | OD-23: formal approval remains open |
| 2 | Ride statuses | Scheduled · Weather Review · Canceled · Completed | Upcoming · Postponed · Cancelled · Completed | OD-15 |
| 3 | RSVP terms | Confirmed · Tentative · Pending Approval | Going · Maybe · Can't Go, with approval stored separately | OD-12 |
| 4 | "Can't Go" | No equivalent. Direct invitations are FUTURE. | Declining an invitation | OD-12, OD-13 |
| 5 | Maybe on a full ride | Not allowed (§4.3) | Not stated | OD-12 |
| 6 | Weather terms | Ride conditions: Dry Only · Rain or Shine | Rain or Shine · Dry Conditions Preferred · Weather Dependent | OD-19 |
| 7 | Forecasts | Requires approval; no provider (§9.2) | Forecast indicators for meeting point and destination | OD-19 |
| 8 | Search location | Device location → selected city → ask | Live location or manually entered preferred locations | OD-17 |
| 9 | What discovery matches | Meeting point only | Preferred locations "may be relevant" to meeting points and destinations | OD-17 |
| 10 | Destination | A ride creation field | Required or optional? | OD-14 |
| 11 | Club rides | Not covered | Individual organiser plus an optional club | OD-16 |
| 12 | Filter attributes | Not covered | Format, pace, audience | OD-16 |
| 13 | Push and email | FUTURE for the core release | Native push and email "where appropriate" | OD-20 (timing is consistent if they come with Phases 5–6) |
| 14 | Spelling | organizer, canceled | organiser, cancelled | OD-26 |

---

## 14. Related documents

- [Ride Discovery, Calendar & Weather Requirements, Revision 6](../plan/ride-discovery-calendar-weather.md): detailed ride rules
- [Open decisions](open-decisions.md)
- [Architecture decision records](../decisions/README.md)
- [Technical principles](../technical-principles.md)
- [README](../../README.md): setup, authentication behaviour and limitations

**Not in the repository:** the original Lobby base plan was never found. The six-area draft, the cross-platform assessment, the architecture decision paper and the Expo spike acceptance criteria were written in conversation only. The spike criteria are summarised under OD-02; the others are reflected in this document as Proposed or Open items.
