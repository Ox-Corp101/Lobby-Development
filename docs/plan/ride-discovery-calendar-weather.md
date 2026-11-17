# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Revision 3. All product decisions from the second review are applied. Awaiting explicit approval. **Do not begin architecture implementation or development until this plan is approved.**
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked otherwise.

> Note: the base Lobby development plan is not in this repository yet. This document stands alone and should be merged into, or linked from, the base plan once that plan is added.

### How to read this document

| Label | Meaning |
|---|---|
| **[APPROVED]** | Decided by the product owner. Approved for the Core Ride Lobby milestone once this plan is signed off. |
| **[FUTURE]** | Approved direction, but not part of the core release. |
| **[ENHANCEMENT — REQUIRES APPROVAL]** | Separate work item. Needs explicit approval before any design or build work. |
| **[TECH DIRECTION]** | Approved architectural recommendation. Documented only; nothing is built or selected until development is approved. |
| **[PROPOSED]** | Suggested by the plan author and **not yet approved** (see §12). |
| **[OPEN]** | An unresolved decision (see §12). |

---

## 1. Scope summary

| Area | Label |
|---|---|
| Personal Ride Calendar (section lists) | **[APPROVED]** |
| Month-grid calendar view | **[FUTURE]** |
| Nearby Ride Search (list view) | **[APPROVED]** |
| Map-based discovery | **[FUTURE]** |
| Ride Creation (minimum capacity 2, time zone from the meeting point) | **[APPROVED]** |
| Capacity and seat rules, including full-ride and capacity-reduction rules | **[APPROVED]** |
| Seat-available notifications to Tentative / Pending riders (no automatic promotion) | **[APPROVED]** |
| Automated waitlist | Out of scope for the initial release |
| Private rides via secure invitation links (expiry, usage limits, revocation) | **[APPROVED]** |
| Private rides via direct invitations | **[FUTURE]** |
| Rejoining a ride | **[APPROVED]** |
| Ride and participant statuses | **[APPROVED]** |
| Rescheduling with reconfirmation tracking visible to the organizer | **[APPROVED]** |
| Reconfirmation deadlines | **[FUTURE]** |
| Manual completion, with "Awaiting Completion" display | **[APPROVED]** |
| Organizer reminders after departure | **[FUTURE]** |
| Manual weather management | **[APPROVED]** |
| In-app notifications | **[APPROVED]** |
| Push notifications | **[FUTURE]** |
| Email notifications (transactional events only) | **[FUTURE]** |
| Geocoding / places provider | **[TECH DIRECTION]**: evaluation and recommendation required, no commitment yet |
| Concurrency-safe capacity enforcement (PostgreSQL) | **[TECH DIRECTION]** |
| Hashed invitation tokens | **[TECH DIRECTION]** |
| Push and email providers | Deferred until those channels are scheduled |
| External weather API integration | **[ENHANCEMENT — REQUIRES APPROVAL]** |
| Automatic weather-based cancellation | **[ENHANCEMENT — REQUIRES APPROVAL]** |

---

## 2. Personal Ride Calendar

### 2.1 Requirements **[APPROVED]**
- R-CAL-1: The initial release uses section-based lists: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-2: Include rides the user **organizes**, and rides where they are **Confirmed**, **Tentative** or **Pending Approval**.
- R-CAL-3: Pending Approval entries are labeled **"Awaiting Approval."**
- R-CAL-4: Each entry shows meeting location, destination, date, time, and the user's participation status.
- R-CAL-5: The calendar updates automatically on join, leave, RSVP change, approval or decline, reschedule, cancellation, and completion.
- R-CAL-6: The **ride's local time** is the primary time shown. If the user's time zone differs, the user's local time may be shown as secondary information.
- R-CAL-7: The week boundary **follows the user's locale**.
- R-CAL-8: Past rides never appear in This Week or Upcoming Rides.
- R-CAL-9: **Rides the user left**:
  - Removed from This Week and Upcoming Rides.
  - The participation record is kept.
  - The ride may appear in **Past Rides** as a historical record, where appropriate.
- R-CAL-10: **Declined join requests** disappear from the rider's active calendar. The request record is kept on the backend for history and audit.
- R-CAL-11: **Canceled rides** remain visible on calendars, labeled "Canceled," with the cancellation reason.
- R-CAL-12: If a ride's departure has passed but the organizer hasn't marked it Completed, it appears under **Past Rides** with the secondary label **"Awaiting Completion"** (see §7.6).

### 2.2 Section placement **[APPROVED]**
- *This Week*: departure is in the future and falls within the current week, as defined by the user's locale.
- *Upcoming Rides*: departure is in the future and falls after the current week.
- *Past Rides*: departure has passed, or the ride is `Completed`.

### 2.3 Items needing confirmation
- **[PROPOSED]** Meaning of "where appropriate" in R-CAL-9: once its departure time has passed, a ride the user left appears in Past Rides labeled **"Left."** A ride the user left that was later canceled also appears, labeled "Canceled." See §12, item 1.
- **[PROPOSED]** The secondary local time is shown automatically whenever the user's device time zone differs from the ride's. No user setting is needed in the initial release.
- **[PROPOSED]** Week boundaries are computed in the **user's** time zone, and each ride's departure moment is compared against them. (A ride can fall in a different week for the user than in the ride's own time zone.)

### 2.4 Future
- **[FUTURE]** Month-grid view.

---

## 3. Nearby Ride Search

### 3.1 Requirements **[APPROVED]**
- R-DISC-1: Default the search center to the rider's **selected city**, or their **device location** if they have granted permission.
- R-DISC-2: Match rides by **meeting point**, not destination.
- R-DISC-3: Radius: **default 40 km, minimum 5 km, maximum 160 km**.
- R-DISC-4: Users can show distances in **km or miles**. The initial unit comes from the user's locale. The limits are fixed in km and converted for display.
- R-DISC-5: Results show destination, meeting point, departure time, organizer, available slots, and ride conditions.
- R-DISC-6: Exclude `Canceled` and `Completed` rides from default results.
- R-DISC-7: Private rides never appear in discovery.
- R-DISC-8: Full rides stay visible, labeled **"Full,"** with joining disabled and refused by the server (§4.3).
- R-DISC-9: List view in the initial release.
- R-DISC-10: Location order: device location (only with permission) → selected city → ask the user to choose a city.

### 3.2 Items needing confirmation
- **[PROPOSED — recommended for approval]** Default results show only rides whose **departure time is still in the future**. This follows from the approved rule that joining is blocked after departure, and from manual completion: without it, rides whose departure has passed but that are still `Scheduled` would show in discovery even though nobody can join them. See §11, concern C1.
- **[PROPOSED]** Rides in `Weather Review` stay in results with a badge.
- **[PROPOSED]** Default sort: soonest departure first, with distance as the tie-breaker.

### 3.3 Future
- **[FUTURE]** Map-based discovery.

---

## 4. Participant Capacity **[APPROVED]**

### 4.1 Seat rules
| Participant | Consumes a seat? |
|---|---|
| Organizer | Yes (one seat) |
| Confirmed | Yes |
| Tentative | No |
| Pending Approval | No |
| Canceled | No |

- **Occupied seats** = organizer + Confirmed participants.
- **Available slots** = capacity − occupied seats.
- A ride is **Full** when available slots = 0.
- Capacity defaults to 10, including the organizer. The minimum is **2** (the organizer plus one rider).

### 4.2 Enforcement
- The server enforces capacity.
- Concurrent joins, confirmations and approvals must never push occupied seats above capacity.
- Every seat-taking action re-checks capacity at the moment it is committed:
  - joining as Confirmed
  - switching Tentative → Confirmed
  - an organizer approving a request

### 4.3 Full rides
- **Nobody can join a full ride, in any status, including Tentative.** This includes submitting a new join request on a ride that requires approval. The server enforces it.
- When a ride becomes full, **existing Tentative and Pending Approval entries stay on record**. They are never silently deleted.
- **When a seat opens:**
  - Interested riders (current Tentative and Pending Approval participants) are notified.
  - They may update their RSVP or request:
    - A Tentative rider can switch to Confirmed (if approval is off), or request confirmation (if approval is on).
    - A pending request stays with the organizer, who can then approve it.
  - When approval is enabled, organizer approval is required.
  - Riders are **never promoted to Confirmed automatically**.
  - Seats go to whoever successfully confirms, or is approved, first. The server's capacity check (§4.2) settles races. There is no queue or reserved order.
- **No automated waitlist** in the initial release.

### 4.4 Lowering capacity
- Organizers **cannot set capacity below the number of occupied seats**. For example, with 8 occupied seats the minimum allowed capacity is 8. The minimum of 2 also always applies.
- To go lower, the organizer must first reduce the participant count.
- Confirmed riders are **never removed automatically** to satisfy a capacity change.
- The server enforces this check, which shares the concurrency protection in §4.2.

### 4.5 Items needing confirmation
- **[OPEN]** How an organizer "resolves the participant count": can they remove a confirmed rider directly, or must they ask riders to leave? If they can remove riders, is a reason required and is the rider notified? See §12, item 2.

---

## 5. Private Ride Access

### 5.1 Requirements
- **[APPROVED]** Intended functionality: invitation links **and** direct invitations.
- **[APPROVED]** Initial release: **secure invitation links**.
- **[FUTURE]** Direct invitations.

### 5.2 Security rules **[APPROVED]**
- Private rides never appear in public discovery.
- Only authorized invited riders can see a private ride's details or join it.
- Invitation links use secure, unguessable tokens.
- All access restrictions are enforced on the server.

### 5.3 Invitation link lifecycle **[APPROVED]**
- Links are **never permanently valid by default**.
- **Default expiration: 7 days** after the link is created.
- Organizers can **configure the expiration**.
- Organizers can **configure a maximum number of uses**.
- Organizers can **revoke** links.
- **Expired, revoked and used-up links are rejected by the server.**
- **Revoking a link does not remove riders who already joined** through it.

### 5.4 Rejoining **[APPROVED]**
- A rider who left may rejoin through the **same invitation link**, as long as it is still valid (not revoked, expired or used up).
- All normal joining rules apply again:
  - capacity check (§4)
  - organizer approval, if enabled
  - no duplicate active participation
  - joining blocked after departure
  - all checks enforced on the server
- Rejoining a **public** ride follows the same rules, without needing a link.

### 5.5 Items needing confirmation
- **[OPEN]** Default for **maximum uses** when the organizer sets none. Suggested: no limit, within the expiry window. See §12, item 3.
- **[OPEN]** What counts as a **use**. Suggested: one successful join. Opening the link without joining, or a failed join (for example because the ride is full), doesn't count. Does a rider's **rejoin** count as another use? See §12, item 4.
- **[OPEN]** Expiry bounds: should a link stop working at departure even if its configured expiry is later? Is there a maximum configurable expiry? See §12, item 5.
- **[OPEN]** If a rider opened a valid link but didn't join, do they keep **view access** to the ride after the link expires or is revoked? See §12, item 6.
- **[PROPOSED]** The rider must be signed in before a link grants access.
- **[PROPOSED]** The organizer can create a replacement link at any time, and can have more than one active link per ride.
- See §11, concern C3, for how storing token hashes limits redisplaying links.

---

## 6. Ride Creation **[APPROVED]**

| Field | Notes |
|---|---|
| Title | Required |
| Description | Required |
| Meeting point | Geocoded location. Discovery searches on it, and it sets the ride's time zone. |
| Destination | Location |
| Date | In the ride's local time zone |
| Meeting time | At or before the departure time |
| Departure time | Must be in the future when the ride is created |
| Participant capacity | Default **10**, minimum **2**, both including the organizer |
| Ride conditions | `Dry Only` or `Rain or Shine` |
| Visibility | `Public` or `Private` |
| Participant approval | Optional toggle |

- **[APPROVED]** The ride's time zone comes from the meeting point's location.
- **[APPROVED]** The organizer is added automatically and takes one seat.
- **[APPROVED]** With approval **on**: joining creates a `Pending Approval` request, which takes no seat. Approval is subject to capacity.
- **[APPROVED]** With approval **off**: joining makes the rider `Confirmed` (if a seat is free) or `Tentative` (not allowed on a full ride, §4.3).
- **[PROPOSED]** Participant approval is off by default.

---

## 7. Statuses, Rescheduling & Completion

### 7.1 Separation **[APPROVED]**
Ride status and participant status are stored and managed separately.

### 7.2 Ride status **[APPROVED]**
| Status | Meaning |
|---|---|
| `Scheduled` | Active. Stays `Scheduled` after departure until the organizer marks it completed. |
| `Weather Review` | The organizer flagged a possible weather disruption. Active. |
| `Canceled` | Canceled by the organizer. A reason is required. Final. |
| `Completed` | Marked completed by the organizer. Final. |

```
Scheduled       → Weather Review | Canceled | Completed
Weather Review  → Scheduled | Canceled | Completed
Canceled        → (final)
Completed       → (final)
```

### 7.3 Participant status **[APPROVED]**
| Status | Meaning | Takes a seat |
|---|---|---|
| `Confirmed` | Attending | Yes |
| `Tentative` | Might attend | No |
| `Pending Approval` | Waiting for the organizer's approval | No |
| `Canceled` | Left, declined, or removed. The record is kept for history and audit. | No |

### 7.4 Joining window and cancellation **[APPROVED]**
- **Joining is blocked after the ride's departure time.** The server enforces it.
- Canceling requires a **reason**, which is stored and shown to participants.
- Once a ride is canceled, the server rejects every new join and every RSVP change.
- A canceled ride stays visible on calendars with its reason.
- Active participants are notified.
- Participant statuses are not overwritten when a ride is canceled.

### 7.5 Rescheduling **[APPROVED]**
- The organizer can change the date, meeting time and/or departure time.
- Every active participant is notified and asked to review and reconfirm.
- **Existing Confirmed reservations stay in place** until each participant explicitly changes their RSVP. Riders are never removed automatically, and seats are never released automatically.
- **The organizer can see reconfirmation status** for each participant:
  - **Reconfirmed**
  - **Awaiting reconfirmation** (still holds the seat if Confirmed)
  - **Declined the new schedule**
- **[PROPOSED]** "Declined the new schedule" changes the participant's status to `Canceled`, which frees the seat.
- **[PROPOSED]** Reconfirmation is tracked for Confirmed and Tentative participants. Pending requests are notified but not tracked.
- **[PROPOSED]** Each new reschedule resets everyone's reconfirmation status to "Awaiting reconfirmation."
- **[PROPOSED]** A new departure time must be in the future. Canceled and Completed rides can't be rescheduled.
- **[PROPOSED]** Rescheduling doesn't change a `Weather Review` status. The organizer sets the ride back to `Scheduled` explicitly.
- **[FUTURE]** Reconfirmation deadlines.

### 7.6 Completion **[APPROVED]**
- Only the **organizer** can mark a ride `Completed`. Rides are **never marked Completed automatically**.
- If a ride's departure has passed without completion:
  - its stored status stays **`Scheduled`** (or `Weather Review`)
  - it shows under **Past Rides** with the secondary label **"Awaiting Completion"**
  - the organizer can mark it Completed manually
- "Awaiting Completion" is a **display label only**, not a stored ride status.
- **[PROPOSED]** "Mark as completed" becomes available only after the departure time.
- **[FUTURE]** Optional organizer reminders after departure.

---

## 8. Notifications

### 8.1 Channels
1. **[APPROVED]** In-app notifications: the core release.
2. **[FUTURE]** Push notifications.
3. **[FUTURE]** Email, **outside the initial release**.

### 8.2 Architecture **[APPROVED / TECH DIRECTION]**
- Notifications are generated once per event and sent through pluggable delivery channels. Push, email or other channels can be added later without changing how events are produced.

### 8.3 Core in-app events **[APPROVED]**
| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer |
| Join request submitted | Organizer |
| Join request approved / declined | Requesting rider |
| Seat became available on a full ride | Tentative and Pending Approval participants, plus the organizer when pending requests exist |
| Ride enters `Weather Review` / weather disruption notice | All active participants |
| Ride rescheduled (with reconfirmation request) | All active participants |
| Participant reconfirms or declines the new schedule | Organizer |
| Ride canceled (with reason) | All active participants |

"Active participants" means the organizer and everyone in `Confirmed`, `Tentative` or `Pending Approval`.

### 8.4 Future email scope **[FUTURE]**
When email is implemented, it covers only important transactional events:
- Ride cancellation
- Ride rescheduling
- Join request approval or rejection
- Private ride invitations

Routine RSVP changes and other minor activity stay in-app unless future requirements justify email. See §11, concern C5, about invitation emails.

---

## 9. Weather-Based Ride Management

### 9.1 Core milestone (manual) **[APPROVED]**
- The weather policy (`Dry Only` / `Rain or Shine`) is shown on ride detail, discovery results, and calendar entries.
- Organizers can notify participants about possible weather disruptions.
- Organizers can put rides into `Weather Review`.
- Organizers can cancel (a reason is required) or reschedule rides.
- Affected participants are notified.
- **No automatic weather-based cancellation** in the core milestone.

### 9.2 External weather integration and automatic cancellation **[ENHANCEMENT — REQUIRES APPROVAL]**
- No weather provider is selected or integrated.
- Before any work, the following must be defined and approved:
  - data source
  - rain threshold
  - geographic coverage
  - check timing
  - notification behavior
- Rides are never canceled based only on an uncertain forecast.

---

## 10. Technical direction **[TECH DIRECTION]**

These are approved architectural recommendations. **Nothing here is built, configured or bought until development is approved.**

### 10.1 Geocoding and places provider
- **Candidates:** Google Maps Platform, Mapbox, and OpenStreetMap-based options (for example, hosted Nominatim/Photon-compatible services, or commercial OSM-based providers).
- **Criteria:** pricing at expected and scaled volume, geographic coverage of launch regions, licensing (including the terms for storing and caching results), reliability and service levels, scalability and rate limits.
- **Deliverable:** a comparison with **one preferred recommendation and its cost implications**, submitted for review. **No provider is committed to until it is reviewed.**
- **Status:** evaluation not yet carried out. Pricing must come from current vendor sources at evaluation time.
- **Related need:** the provider (or a separate method) must also look up the **IANA time zone** from the meeting point's coordinates (§6). See concern C4.

### 10.2 Concurrency-safe joining
- Enforce capacity with **PostgreSQL transactions** or a purpose-built **database function**, so the capacity check and the seat change happen as one indivisible operation.
- All capacity validation is server-side. Race conditions and overbooking must be impossible.
- This protection covers: join as Confirmed, Tentative → Confirmed, organizer approval, rejoin, and capacity reduction (§4.4).
- **Testing plan must include:**
  - concurrent joins competing for the last seat
  - concurrent approvals
  - a join racing a capacity reduction
  - several notified riders confirming after a seat opens
  - duplicate rejoin attempts
- **Assumption:** PostgreSQL is the base plan's database (see concern C6).

### 10.3 Invitation tokens
- Tokens are generated from a cryptographically secure random source.
- **Only token hashes are stored**, never raw tokens.
- Expiry, usage limits and revocation are enforced on the server when a link is redeemed. The usage count goes up as part of the same transaction as the join, so concurrent redemptions can't exceed the limit.
- Private ride details are never returned without authorization.

### 10.4 Push and email providers
- Selection is deferred until those channels are scheduled. The notification design stays extensible (§8.2).

### 10.5 Weather provider
- Not selected or integrated. It stays part of the enhancement in §9.2.

### 10.6 Data model sketch **[PROPOSED]**
For discussion only. This is not an approved schema, and **no schema or migration work is authorized**.

- **Ride**: organizer, title, description, meeting point, destination, IANA time zone, meeting/departure time (UTC), capacity, conditions, visibility, requires_approval, status, cancel reason/time, completed_at.
- **RideParticipant**: ride, user, status, is_organizer, joined/updated times, reconfirmation status. Records are kept on leave or decline, with **at most one active participation per rider per ride**.
- **RideStatusEvent** (audit): status changes, reasons, reschedules (old and new times), actor.
- **RideInvitationLink**: ride, token hash, created by, expires_at (default 7 days), max_uses, use_count, revoked_at.
- **Notification**: recipient, event type, ride, payload, read_at, with delivery tracked per channel.
- **User preferences**: distance unit, locale.

---

## 11. Conflicts and technical concerns

| # | Concern | Impact | Suggested resolution |
|---|---|---|---|
| C1 | Manual completion keeps past rides `Scheduled`, and R-DISC-6 excludes only Canceled and Completed rides. Past rides that haven't been completed would show up in discovery even though nobody can join them. | Confusing results | Approve the §3.2 rule: discovery shows only future departures. |
| C2 | When a seat opens, several riders are notified at once and only one can take it. | Riders who lose the race are disappointed. Possible support load. | Approved as first-come; the server settles races (§4.3). Show a clear "seat no longer available" message. A queue would be the future waitlist feature. |
| C3 | Storing only token **hashes** means a link can't be shown again after it is created. | Organizers who lose a link can't copy it again. | Show the full link once at creation and let organizers create replacement links (§5.5). Other options, such as reversible encryption, weaken the "hashes only" rule and would need approval. |
| C4 | Taking the time zone from the meeting point needs a coordinates-to-time-zone lookup. | Extra dependency | Cover it in the geocoding evaluation (§10.1), or use an offline time-zone boundary dataset. Decide during evaluation. |
| C5 | Future "private ride invitation" emails only make sense for **direct** invitations (where the system knows who the recipient is). Organizers share invitation links themselves. | Email scope depends on another future feature | Tie invitation emails to direct invitations when both are scheduled. |
| C6 | The PostgreSQL direction assumes the base plan uses PostgreSQL. The base plan isn't in the repository. | Possible mismatch | Confirm the database when the base plan is merged. |
| C7 | A 7-day default link expiry and departure time are independent of each other. A link can outlive the ride, or expire long before it. | Links that still work after a ride is over, or organizers having to make new links | Decide whether links also expire at departure (§12, item 5). Joining is already blocked after departure in any case. |
| C8 | Users and rides can be in different time zones, which affects "This Week" and the "Left" / "Awaiting Completion" labels. | Edge-case display differences | Approve the §2.3 rule: weeks are computed in the user's time zone. |

---

## 12. Remaining decisions

### 12.1 Product decisions needing your input
1. **Past Rides for rides the user left:** confirm the §2.3 definition of "where appropriate."
2. **Reducing participants:** can organizers remove confirmed riders directly? If so, is a reason required and is the rider notified?
3. **Default max uses** when the organizer sets none.
4. **Counting uses:** does a use mean a successful join, and does a rejoin count as another use?
5. **Link expiry bounds:** should links also stop working at departure? Is there a maximum configurable expiry?
6. **View access** for riders who opened a link but didn't join, once the link expires or is revoked.
7. **Can a declined rider request again**, on rides that require approval?
8. **Confirm or adjust the remaining [PROPOSED] items:**
   - §2.3: "Left" label, automatic secondary time, week computed in the user's time zone
   - §3.2: future-only discovery, Weather Review badge, sort order
   - §5.5: sign-in required, multiple and replacement links
   - §6: approval off by default
   - §7.5: declining the new schedule = Canceled, which participants are tracked, reset on each reschedule, reschedule constraints, Weather Review left unchanged by a reschedule
   - §7.6: "mark completed" only after departure

### 12.2 Unresolved technical decisions
- The geocoding/places provider evaluation and recommendation (§10.1), including the time-zone lookup (C4).
- Confirming PostgreSQL as the base database (C6).
- Push and email providers, when those channels are scheduled.
- The weather provider and thresholds, only if §9.2 is approved.

### 12.3 Resolved decisions
**Revision 2:**
- Calendar: Pending Approval display, week boundary, list format, time-zone display.
- Discovery: radius, units, Full-ride visibility.
- Seat rules.
- Private access approach.
- Preserving reservations on reschedule.
- Organizer-controlled completion.
- Channel priority.
- Weather scope.

**Revision 3:**
1. Left rides: removed from active sections, history kept, may appear in Past Rides.
2. Declined requests: removed from the active calendar, record kept for audit.
3. Full rides: Tentative/Pending entries are kept, riders are notified when a seat opens, no automatic promotion, no automated waitlist.
4. Nobody can join a full ride, including as Tentative. Enforced by the server. No silent deletion.
5. Capacity can't be lowered below occupied seats. Riders are never removed automatically.
6. Invitation links: 7-day default expiry, configurable expiry and maximum uses, revocation, rejected by the server when invalid. Never permanent by default.
7. Rejoining through a still-valid link, with all normal join rules applied.
8. Organizers can see reconfirmation status (reconfirmed / awaiting / declined).
9. Past rides that haven't been completed stay `Scheduled` and show under Past Rides as "Awaiting Completion." Never completed automatically.
10. Email scope, once email is built: cancellation, rescheduling, approval decisions, private invitations.
11. Approved: canceled rides stay visible with their reason; joining blocked after departure; time zone from the meeting point; minimum capacity 2; revoking a link doesn't remove riders who joined.
12. Technical direction: provider evaluation, PostgreSQL concurrency, hashed tokens, deferred push/email providers, no weather provider.

---

## 13. Acceptance criteria (Core Ride Lobby milestone)

These cover **[APPROVED]** requirements only.

**Calendar**
- [ ] The calendar shows This Week / Upcoming Rides / Past Rides lists, with the week boundary following the user's locale.
- [ ] Rides the user organizes, or is Confirmed, Tentative or Pending Approval on, appear. Pending rides are labeled "Awaiting Approval."
- [ ] Ride times show in the ride's local time, with the user's local time optionally shown when it differs.
- [ ] A ride whose departure has passed never appears in This Week or Upcoming Rides.
- [ ] Rides the user left are removed from This Week and Upcoming, the participation history is kept, and they can appear in Past Rides.
- [ ] Declined requests disappear from the active calendar, and the request record is kept on the backend.
- [ ] Canceled rides stay visible, with their cancellation reason.
- [ ] Rides past departure that haven't been completed appear in Past Rides labeled "Awaiting Completion," with the stored status unchanged.
- [ ] The calendar updates on every event in R-CAL-5 without a manual refresh.

**Discovery**
- [ ] Discovery centers on device location (with permission) or the selected city, and matches on meeting point.
- [ ] Radius defaults to 40 km, adjustable from 5 to 160 km. Users can choose km or miles, with the starting unit from their locale.
- [ ] Results show destination, meeting point, departure time, organizer, available slots and conditions.
- [ ] Canceled, Completed and private rides never appear.
- [ ] Full rides appear labeled "Full," with joining disabled and refused by the server.

**Capacity**
- [ ] Available slots = capacity − (organizer + Confirmed).
- [ ] Capacity defaults to 10 and can't be set below 2.
- [ ] The server refuses every join on a full ride, including Tentative joins and new approval requests.
- [ ] Existing Tentative and Pending entries are kept when a ride becomes full.
- [ ] When a seat opens, Tentative and Pending riders (and the organizer, where relevant) get an in-app notification. No rider is promoted automatically. Approval is still required when enabled.
- [ ] Capacity can't be lowered below occupied seats, and no Confirmed rider is removed automatically.
- [ ] Concurrent joins, confirmations, approvals, rejoins and capacity changes never exceed capacity (verified by the concurrency tests in §10.2).

**Private rides and invitation links**
- [ ] Private rides never appear in discovery. Only authorized invitees can view or join them, enforced by the server.
- [ ] Links use cryptographically secure tokens, and only their hashes are stored.
- [ ] Links expire 7 days after creation by default. Organizers can set the expiry and maximum uses, and can revoke links.
- [ ] Expired, revoked and used-up links are refused by the server. Concurrent redemptions never exceed the usage limit.
- [ ] Revoking a link doesn't remove riders who already joined.
- [ ] A rider who left can rejoin through a valid link, subject to capacity, approval, the joining window and the no-duplicate rule.

**Ride creation**
- [ ] Every required field is enforced. The time zone comes from the meeting point. Capacity defaults to 10, with a minimum of 2. Visibility and optional approval are supported.

**Status, rescheduling and completion**
- [ ] Ride and participant statuses are independent and follow the transitions in §7.2.
- [ ] The server blocks joining after departure.
- [ ] Cancellation requires a reason, notifies active participants, and blocks further joins and RSVP changes.
- [ ] Rescheduling notifies active participants and asks them to reconfirm. Confirmed reservations are kept until riders change them.
- [ ] Organizers can see which participants have reconfirmed, are awaiting reconfirmation, or declined.
- [ ] Only the organizer can mark a ride Completed. Nothing is completed automatically.

**Notifications**
- [ ] Every event in §8.3 creates an in-app notification for the correct recipients.
- [ ] Delivery uses a channel abstraction. No push or email is sent in the initial release.

**Weather**
- [ ] The weather policy is shown on ride detail, discovery results and calendar entries.
- [ ] Organizers can send weather disruption notices, use Weather Review, and cancel or reschedule.
- [ ] No weather provider integration and no automatic weather cancellation.

---

## Revision history
- **Revision 1:** Initial addendum.
- **Revision 2:** Applied first-review decisions. Added approval labels, capacity and private-access sections.
- **Revision 3:** Resolved all remaining product decisions from the second review. Added full-ride, capacity-reduction, invitation lifecycle, rejoin, reconfirmation-visibility and "Awaiting Completion" rules. Added the technical direction section (§10) and the conflicts/concerns register (§11). Updated scope labels, resolved decisions and acceptance criteria.
