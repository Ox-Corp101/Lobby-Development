# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Revision 4. Third-review decisions and conflict resolutions are applied. Awaiting review. **Do not begin architecture implementation or development until this plan is explicitly approved.**
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked otherwise.

> Note: the base Lobby development plan is not in this repository yet. This document stands alone and should be merged into, or linked from, the base plan once that plan is added.

### How to read this document

| Label | Meaning |
|---|---|
| **[APPROVED]** | Decided by the product owner. Approved for the Core Ride Lobby milestone once this plan is signed off. |
| **[APPROVED — PROVISIONAL VALUE]** | The behavior is approved. The number is a proposed default that still needs final confirmation. |
| **[FUTURE]** | Approved direction, but not part of the core release. |
| **[ENHANCEMENT — REQUIRES APPROVAL]** | Separate work item. Needs explicit approval before any design or build work. |
| **[TECH DIRECTION]** | Approved architectural direction. Documented only; nothing is built, configured or selected. Final architecture approval is separate. |
| **[PROPOSED]** | Suggested by the plan author and **not yet approved** (see §12). |
| **[OPEN]** | An unresolved decision (see §12). |

---

## 1. Scope summary

| Area | Label |
|---|---|
| Personal Ride Calendar (section lists) | **[APPROVED]** |
| "Left" history entries in Past Rides | **[APPROVED]** |
| Month-grid calendar view | **[FUTURE]** |
| Nearby Ride Search (list view, future departures only) | **[APPROVED]** |
| Map-based discovery | **[FUTURE]** |
| Ride Creation (minimum capacity 2, time zone from the meeting point) | **[APPROVED]** |
| Capacity, full-ride and capacity-reduction rules | **[APPROVED]** |
| Organizer removal of confirmed participants (reason required) | **[APPROVED]** |
| Seat-available notifications (no seat reservation, no automatic promotion) | **[APPROVED]** |
| Automated waitlist | Out of scope for the initial release |
| Re-requesting after a decline | **[APPROVED]** |
| Private rides via secure invitation links | **[APPROVED]** |
| Invitation link defaults (50 joins, 30-day maximum expiry) | **[APPROVED — PROVISIONAL VALUE]** |
| Direct invitations | **[FUTURE]** |
| Invitation emails | **[FUTURE]** (not in the initial release) |
| Rejoining a ride | **[APPROVED]** |
| Ride and participant statuses | **[APPROVED]** |
| Rescheduling with reconfirmation tracking | **[APPROVED]** |
| Reconfirmation deadlines | **[FUTURE]** |
| Manual completion with "Awaiting Completion" display | **[APPROVED]** |
| Organizer reminders after departure | **[FUTURE]** |
| Manual weather management | **[APPROVED]** |
| In-app notifications | **[APPROVED]** |
| Push notifications | **[FUTURE]** |
| Email notifications (transactional only) | **[FUTURE]** |
| Supabase PostgreSQL as the database | **[TECH DIRECTION]** (proposed; final architecture approval is separate) |
| Concurrency-safe capacity enforcement | **[TECH DIRECTION]** |
| Hashed invitation tokens | **[TECH DIRECTION]** |
| Geocoding / mapping / time-zone provider | Separate research and recommendation deliverable. Not selected. |
| Push and email providers | Deferred |
| External weather API integration | **[ENHANCEMENT — REQUIRES APPROVAL]** |
| Automatic weather-based cancellation | **[ENHANCEMENT — REQUIRES APPROVAL]** |

---

## 2. Personal Ride Calendar

### 2.1 Requirements **[APPROVED]**
- R-CAL-1: Section-based lists: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-2: Include rides the user **organizes**, and rides where they are **Confirmed**, **Tentative** or **Pending Approval**.
- R-CAL-3: Pending Approval entries are labeled **"Awaiting Approval."**
- R-CAL-4: Each entry shows meeting location, destination, date, time, and participation status.
- R-CAL-5: The calendar updates automatically on join, leave, removal, RSVP change, approval or decline, reschedule, cancellation, and completion.
- R-CAL-6: The **ride's local time** is the primary time shown. If the rider's time zone differs, the rider's local time may be shown as secondary information.
- R-CAL-7: **Week boundaries are computed in the rider's local time zone**, with the first day of the week following the rider's locale. A ride's departure moment is placed against those boundaries.
- R-CAL-8: Past rides never appear in This Week or Upcoming Rides.
- R-CAL-9: **Rides the user left** are removed from This Week and Upcoming Rides. Once the departure time has passed, they appear in **Past Rides** as a historical record labeled **"Left."** The participation record is kept.
- R-CAL-10: **Declined join requests** disappear from the active calendar. The request record is kept on the backend for history and audit.
- R-CAL-11: **Canceled rides** stay visible, labeled "Canceled," with the cancellation reason.
- R-CAL-12: Rides past departure that haven't been completed appear in **Past Rides** labeled **"Awaiting Completion"** (§7.6).

### 2.2 Section placement **[APPROVED]**
- *This Week*: departure is in the future and within the current week, in the rider's time zone.
- *Upcoming Rides*: departure is in the future and after the current week.
- *Past Rides*: departure has passed, or the ride is `Completed`.

### 2.3 Items needing confirmation
- **[PROPOSED]** The secondary local time is shown **automatically** whenever the rider's time zone differs from the ride's. No user setting in the initial release. See §12, item P1.
- **[OPEN]** How a **removed** rider's ride appears on their calendar. For example: removed from active sections, then shown in Past Rides labeled "Removed," or not shown at all. See §12, item N2.
- **[OPEN]** Whether a rider who left a ride **before it was canceled** sees "Left" or "Canceled" in Past Rides. See §12, item N8.

### 2.4 Future
- **[FUTURE]** Month-grid view.

---

## 3. Nearby Ride Search

### 3.1 Requirements **[APPROVED]**
- R-DISC-1: Default the search center to the **selected city**, or to **device location** if the rider has granted permission. Location order: device location (with permission) → selected city → ask the rider to choose.
- R-DISC-2: Match rides by **meeting point**, not destination.
- R-DISC-3: Radius: **default 40 km, minimum 5 km, maximum 160 km**.
- R-DISC-4: Distances in **km or miles**. The initial unit comes from the locale. Limits are fixed in km and converted for display.
- R-DISC-5: Results show destination, meeting point, departure time, organizer, available slots, and conditions.
- R-DISC-6: Exclude `Canceled` and `Completed` rides.
- R-DISC-7: **Exclude rides whose departure time has passed**, even if their stored status is still `Scheduled` or `Weather Review`. (Resolves C1.)
- R-DISC-8: Private rides never appear in discovery.
- R-DISC-9: Full rides stay visible, labeled **"Full,"** with joining disabled and refused by the server.
- R-DISC-10: List view in the initial release.

### 3.2 Items needing confirmation
- **[PROPOSED]** Rides in `Weather Review` stay in results with a badge. See §12, item P2.
- **[PROPOSED]** Default sort: soonest departure first, with distance as the tie-breaker. See §12, item P3.

### 3.3 Future
- **[FUTURE]** Map-based discovery.

---

## 4. Participant Capacity & Membership

### 4.1 Seat rules **[APPROVED]**
| Participant | Consumes a seat? |
|---|---|
| Organizer | Yes (one seat) |
| Confirmed | Yes |
| Tentative | No |
| Pending Approval | No |
| Canceled (left, declined, removed) | No |

- **Occupied seats** = organizer + Confirmed participants.
- **Available slots** = capacity − occupied seats.
- **Full** means available slots = 0.
- Capacity defaults to 10, with a minimum of 2, both including the organizer.

### 4.2 Enforcement **[APPROVED]**
- The server enforces capacity.
- Concurrent actions must never push occupied seats above capacity.
- Every seat-taking action re-checks capacity at the moment it is committed:
  - joining as Confirmed
  - switching Tentative → Confirmed
  - organizer approval
  - rejoining

### 4.3 Full rides **[APPROVED]**
- **Nobody can join a full ride, including as Tentative**, and nobody can submit a new join request on one. The server enforces this.
- Existing Tentative and Pending Approval entries stay on record and are never silently deleted.
- **When a seat opens** (a rider leaves, is removed, downgrades, or declines a reschedule):
  - Eligible riders are notified: the ride's current Tentative and Pending Approval participants, plus the organizer when pending requests exist.
  - **The notification does not reserve a seat.**
  - Riders may update their RSVP or request. Organizer approval is required when approval is enabled.
  - Nobody is **ever promoted to Confirmed automatically**.
  - If another rider takes the seat first, the rider sees a clear **"Seat no longer available"** message. (Resolves C2.)
- No automated waitlist in the initial release.

### 4.4 Lowering capacity **[APPROVED]**
- Capacity can't be set below occupied seats, or below 2.
- To go lower, the organizer must first reduce the participant count (for example by removing participants, §4.5). Riders are never removed automatically.
- The server enforces this, with the same concurrency protection as §4.2.

### 4.5 Organizer removal of participants **[APPROVED]**
- Organizers may **remove Confirmed participants**.
- A **removal reason is required**.
- The **affected rider is notified**.
- The action is **recorded in the ride history** (actor, time, reason).
- The participation record is **not deleted**. Its status becomes `Canceled`, recorded as a removal.
- Removal frees the seat, which triggers the seat-available behavior in §4.3.
- **[OPEN]** Can a removed rider **rejoin** (through a link or by joining a public ride)? Under the current rejoin rules (§5.5), a removed rider could rejoin straight away. See §12, item N1 and contradiction X1.
- **[OPEN]** Is the removal reason **shown to the removed rider**, or only kept in the ride history? See §12, item N3.
- **[OPEN]** Can organizers also remove **Tentative** or **Pending Approval** participants with the same rules? (Declining already covers pending requests.) See §12, item N4.
- **[PROPOSED]** Removal isn't allowed after departure, or on Canceled or Completed rides. See §12, item P4.

### 4.6 Re-requesting after a decline **[APPROVED]**
- A rider whose join request was declined may submit another request if:
  - the ride hasn't departed
  - the ride isn't canceled
  - normal capacity and approval rules are met
- Each request and decline stays on record.
- On a private ride, the new request also needs an invitation link that is still valid (§5).
- **[OPEN]** Is there a limit or cooldown on repeat requests, to stop an organizer being sent the same request again and again? See §12, item N5.

---

## 5. Private Ride Access

### 5.1 Requirements
- **[APPROVED]** Intended functionality: invitation links **and** direct invitations.
- **[APPROVED]** Initial release: **secure invitation links**, shared by the organizer.
- **[FUTURE]** Direct invitations.
- **[FUTURE]** Invitation emails. (Resolves C5.)

### 5.2 Security rules **[APPROVED]**
- Private rides never appear in discovery.
- Only authorized riders can see a private ride's details or join it.
- Links use secure, unguessable tokens.
- All access restrictions are enforced on the server.

### 5.3 Link lifecycle **[APPROVED]**
- Links are never permanently valid by default.
- **Configured expiry:** 7 days after creation by default. The organizer can change it, up to a **maximum of 30 days** **[APPROVED — PROVISIONAL VALUE]**.
- **Effective expiry = whichever comes first: the configured expiry or the ride's departure time.** A link always stops working at departure. (Resolves C7.)
- **Maximum uses:** configurable by the organizer. The default is **50 successful joins** when the organizer sets none **[APPROVED — PROVISIONAL VALUE]**.
- **Definition of a use:** one **successful join**.
  - Opening a link doesn't count as a use.
  - An unsuccessful join attempt (full ride, departed, invalid link, and so on) doesn't count.
  - **Rejoining through the same link counts as another use.**
- Organizers can **revoke** links.
- **Expired, revoked and used-up links are rejected by the server.**
- **Revoking a link doesn't remove participants** who already joined.

### 5.4 Who keeps access **[APPROVED]**
- **Existing participants** keep access through their normal ride membership, whatever happens to the link they used.
- A person who **only opened** a link and never joined **loses all access** once the link expires, is revoked, or is used up.

### 5.5 Rejoining **[APPROVED]**
- A rider who left can rejoin through the same link if it is still valid. The rejoin uses up one use of the link.
- Normal rules apply:
  - capacity check
  - approval, if enabled
  - no duplicate active participation
  - joining blocked after departure
  - all checks enforced on the server
- Rejoining a public ride follows the same rules, without a link.

### 5.6 Link retrieval and replacement **[APPROVED]** (resolves C3)
- Only **token hashes** are stored. Raw tokens are never stored just so links can be retrieved later.
- The organizer can **copy the generated link when it is created**. Lobby can't show it again later.
- If a link is lost, the organizer **creates a replacement link**.

### 5.7 Items needing confirmation
- **[OPEN]** Definition of a "successful join" on a ride that **requires approval**: is the use counted when the request is **submitted**, or when it is **approved**? See §12, item N6 and edge case X3.
- **[OPEN]** If a ride is **rescheduled**, is the effective expiry recalculated from the new departure time? (A later departure could make an earlier-expired link valid again.) See §12, item N7 and edge case X4.
- **[OPEN]** **Pending requesters, and riders who left, on private rides:** what can they see once the link has expired? (Pending requesters are members waiting for a decision. Riders who left have a "Left" history entry.) See §12, item N9 and edge case X5.
- **[PROPOSED]** The rider must be signed in before a link grants access. See §12, item P5.
- **[PROPOSED]** A ride can have more than one active link at a time. (Replacement links are approved; having several at once is not yet.) See §12, item P6.

---

## 6. Ride Creation **[APPROVED]**

| Field | Notes |
|---|---|
| Title | Required |
| Description | Required |
| Meeting point | Geocoded. Discovery searches on it, and it sets the ride's time zone. |
| Destination | Location |
| Date | In the ride's local time zone |
| Meeting time | At or before the departure time |
| Departure time | Must be in the future when the ride is created |
| Participant capacity | Default **10**, minimum **2**, both including the organizer |
| Ride conditions | `Dry Only` or `Rain or Shine` |
| Visibility | `Public` or `Private` |
| Participant approval | Optional toggle |

- **[APPROVED]** The organizer is added automatically and takes one seat.
- **[APPROVED]** With approval on: joining creates a `Pending Approval` request, which takes no seat. Approval is subject to capacity.
- **[APPROVED]** With approval off: joining makes the rider `Confirmed` (if a seat is free) or `Tentative`. Neither is possible on a full ride.
- **[PROPOSED]** Participant approval is off by default. See §12, item P7.
- **[OPEN]** Is there a **maximum capacity**? This matters because the default link limit of 50 joins would be lower than the capacity of very large rides. See §12, item N10 and edge case X6.

---

## 7. Statuses, Rescheduling & Completion

### 7.1 Separation **[APPROVED]**
Ride status and participant status are stored and managed separately.

### 7.2 Ride status **[APPROVED]**
| Status | Meaning |
|---|---|
| `Scheduled` | Active. Stays `Scheduled` after departure until the organizer marks it completed. |
| `Weather Review` | Possible weather disruption flagged by the organizer. Active. |
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
| `Pending Approval` | Waiting for the organizer's decision | No |
| `Canceled` | Left, declined, or removed. The record and reason are kept. | No |

The ride history records **how** a participant ended up as `Canceled` (left / declined / removed / declined the new schedule), so the calendar labels and the audit trail stay accurate.

### 7.4 Joining window and cancellation **[APPROVED]**
- **Joining is blocked after departure.** The server enforces it.
- Canceling requires a reason. Afterwards the server rejects joins, re-requests and RSVP changes. The ride stays visible on calendars with its reason, and active participants are notified.
- Invitation links on canceled or departed rides are rejected (§5.3).

### 7.5 Rescheduling **[APPROVED]**
- The organizer can change the date and times. Active participants are notified and asked to reconfirm.
- **Existing Confirmed reservations stay in place** until each participant explicitly changes their RSVP. Riders are never removed automatically.
- **The organizer can see** each participant's reconfirmation status: **Reconfirmed**, **Awaiting reconfirmation**, or **Declined the new schedule**.
- **[PROPOSED]** Declining the new schedule changes the participant's status to `Canceled`, which frees the seat. See §12, item P8.
- **[PROPOSED]** Reconfirmation is tracked for Confirmed and Tentative participants. Pending requests are notified only. See §12, item P9.
- **[PROPOSED]** Each new reschedule resets everyone's reconfirmation status to "Awaiting." See §12, item P10.
- **[PROPOSED]** A new departure time must be in the future. Canceled and Completed rides can't be rescheduled. See §12, item P11.
- **[PROPOSED]** Rescheduling doesn't change a `Weather Review` status. See §12, item P12.
- **[FUTURE]** Reconfirmation deadlines.

### 7.6 Completion **[APPROVED]**
- Only the organizer can mark a ride `Completed`. Rides are never completed automatically.
- If departure has passed without completion:
  - the stored status **stays `Scheduled`** (or `Weather Review`)
  - the ride shows in **Past Rides** labeled **"Awaiting Completion"**
  - the ride is excluded from discovery (R-DISC-7)
  - the organizer can mark it Completed
- "Awaiting Completion" is a display label only, not a stored status.
- **[PROPOSED]** "Mark as completed" becomes available only after departure. See §12, item P13.
- **[FUTURE]** Organizer reminders after departure.

---

## 8. Notifications

### 8.1 Channels
1. **[APPROVED]** In-app notifications: the core release.
2. **[FUTURE]** Push notifications.
3. **[FUTURE]** Email, outside the initial release.

### 8.2 Architecture **[APPROVED / TECH DIRECTION]**
Events are generated once and sent through pluggable delivery channels, so new channels can be added without changing how events are produced.

### 8.3 Core in-app events **[APPROVED]**
| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer |
| Join request submitted (including re-requests) | Organizer |
| Join request approved / declined | Requesting rider |
| Participant removed (with reason, subject to item N3) | Removed rider |
| Seat became available (no reservation) | Tentative and Pending Approval participants, plus the organizer when pending requests exist |
| Ride enters `Weather Review` / weather disruption notice | All active participants |
| Ride rescheduled (with reconfirmation request) | All active participants |
| Participant reconfirms / declines the new schedule | Organizer |
| Ride canceled (with reason) | All active participants |

"Active participants" means the organizer and everyone in `Confirmed`, `Tentative` or `Pending Approval`.

### 8.4 Future email scope **[FUTURE]**
- Ride cancellation
- Ride rescheduling
- Join request approval or rejection
- Private ride invitations (only together with direct invitations)

Routine activity stays in-app.

---

## 9. Weather-Based Ride Management

### 9.1 Core milestone (manual) **[APPROVED]**
- The weather policy is shown on ride detail, discovery results and calendar entries.
- Organizers can send disruption notices, use `Weather Review`, and cancel (with a reason) or reschedule.
- Participants are notified.
- **No automatic weather-based cancellation.**

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

These are directions only. **No code, schema, migration, dependency, infrastructure or configuration has been created or is authorized.** Final architecture approval is a separate step.

### 10.1 Database
- **Supabase PostgreSQL** is the proposed database direction. (Resolves C6.)
- Final architecture approval is separate. No Supabase project, database plan or configuration is assumed to exist.

### 10.2 Geocoding, mapping and time-zone provider (separate deliverable)
- **Compare:** Google Maps Platform, Mapbox, and suitable OpenStreetMap-based options.
- **Criteria:**
  - **current** pricing at expected and scaled volume
  - geographic coverage of the launch regions
  - licensing, including the terms for storing and caching results
  - reliability and service levels
  - scalability and rate limits
  - **coordinates-to-time-zone lookup** (resolves C4)
- **Deliverable:** one preferred recommendation, with its cost implications, submitted for review.
- **No provider is selected or integrated** until it is reviewed.
- **Status:** research not yet started.

### 10.3 Concurrency-safe joining
- Enforce capacity, link usage limits and capacity reductions with PostgreSQL transactions or a purpose-built database function, so each check and its change happen as one indivisible operation.
- All validation is server-side.
- **Testing plan must include:**
  - concurrent joins competing for the last seat
  - concurrent approvals
  - a join racing a capacity reduction
  - a join racing a participant removal
  - several seat-available riders confirming at once
  - concurrent redemptions of a link close to its usage limit
  - duplicate rejoin attempts

### 10.4 Invitation tokens
- Generated from a cryptographically secure random source. **Only hashes are stored.**
- When a link is redeemed, the server enforces the effective expiry (configured expiry or departure, whichever is first), the usage limit, and revocation.
- The usage count goes up in the same transaction as the successful join.
- Private ride data is never returned without authorization.

### 10.5 Deferred providers
- Push, email and weather providers are not selected. The notification design stays extensible.

### 10.6 Data model sketch **[PROPOSED]**
For discussion only. This is not an approved schema.
- **Ride**: organizer, title, description, meeting point, destination, IANA time zone, meeting/departure time (UTC), capacity, conditions, visibility, requires_approval, status, cancel reason/time, completed_at.
- **RideParticipant**: ride, user, status, end reason (left / declined / removed / declined new schedule), removal reason, reconfirmation status, timestamps. **At most one active participation per rider per ride.** Records are never deleted.
- **RideStatusEvent / RideHistory**: status changes, reschedules, removals, approvals and declines, with actor, time and reason.
- **RideInvitationLink**: ride, token hash, created by, configured expiry (default 7 days, maximum 30), max uses (default 50), use count, revoked_at.
- **Notification**: recipient, event type, ride, payload, read_at, with delivery tracked per channel.
- **User preferences**: distance unit, locale.

---

## 11. Conflicts, contradictions and edge cases

### 11.1 Earlier concerns, resolved in Revision 4
| # | Resolution |
|---|---|
| C1 | Discovery excludes rides whose departure has passed (R-DISC-7). |
| C2 | Seat-available notifications don't reserve a seat. A "Seat no longer available" message is shown (§4.3). |
| C3 | Hashed tokens are kept. The link can be copied when it is created, and lost links are replaced (§5.6). |
| C4 | The time-zone lookup is included in the provider evaluation (§10.2). |
| C5 | Invitation emails are out of the initial release (§5.1). |
| C6 | Supabase PostgreSQL is the proposed direction. Final architecture approval is separate (§10.1). |
| C7 | Links stop at departure, with a 30-day maximum expiry (§5.3). |
| C8 | Week boundaries are computed in the rider's time zone, and the ride's local time stays primary (R-CAL-6, R-CAL-7). |

### 11.2 New contradictions and edge cases from Revision 4 decisions
| # | Issue | Why it matters | Suggested handling |
|---|---|---|---|
| X1 | **Removal vs rejoin.** A removed rider counts as "a rider who left," so the rejoin rules (§5.5) would let them rejoin straight away, through a still-valid link or on a public ride. | Makes removal ineffective | Decide whether removed riders are blocked from rejoining, or need organizer approval to rejoin (item N1). |
| X2 | **Removal and calendar labels.** Only "Left" is defined for Past Rides. | Removed riders could wrongly see "Left" | Define how a removed ride appears (item N2). |
| X3 | **Counting uses on approval-required rides.** "A successful join" is unclear when joining creates a pending request. | Counting on submission lets declined requests use up the link; counting on approval allows more open requests than the remaining uses | Decide when a use is counted (item N6). Suggested: count on approval. |
| X4 | **Reschedule vs effective expiry.** Effective expiry depends on departure. Moving departure later could revive an expired link. Moving it earlier cuts the link short. | Links unexpectedly working again, or stopping | Suggested: recalculate effective expiry from the current departure time, but never revive a link whose configured expiry has already passed (item N7). |
| X5 | **Private access after a link ends.** Opened-only visitors lose access (approved). It is not yet defined for pending requesters or for riders who left (who have a "Left" history entry). | A history entry could show private details to someone who is no longer a member | Suggested: pending requesters keep access while their request is open; riders who left see only the summary details in their history entry (item N9). |
| X6 | **Link limit vs capacity.** There is no maximum capacity, so the default of 50 joins could be lower than a large ride's capacity. Rejoins also use up the limit. | Organizers of large rides could run out of joins unexpectedly | Decide on a maximum capacity, or set the default link limit relative to capacity (item N10). |
| X7 | **Repeat requests after a decline.** There is no limit. | Organizers could be sent the same request again and again | Consider a cooldown or a per-ride limit (item N5). |
| X8 | **Seat-available races.** Seat-available notifications, re-requests and rejoins can all compete for the same seat. | The "Seat no longer available" path will be common | Covered by §4.3 and the §10.3 tests. No product change needed. |
| X9 | **Week boundary vs displayed time.** Weeks are computed in the rider's time zone, but times are shown in the ride's time zone. A ride can show a ride-local date that seems to belong to another week. | Occasional confusion | Accepted under C8. The secondary rider-local time (P1) reduces it. |

---

## 12. Remaining unresolved decisions

### 12.1 New product decisions (raised by Revision 4)
- **N1** Can a **removed** rider rejoin? Options: blocked entirely; allowed only with organizer approval; allowed under the normal rules.
- **N2** How a removed rider's ride appears on their calendar ("Removed" in Past Rides, or hidden).
- **N3** Is the removal reason **shown to the removed rider**, or only kept in the history?
- **N4** Can organizers remove **Tentative** or **Pending** participants with the same rules?
- **N5** Is there a limit or cooldown on repeat requests after a decline?
- **N6** On approval-required rides, is a link use counted on **submission** or on **approval**?
- **N7** Does a reschedule **recalculate** effective link expiry, and can that ever revive an expired link?
- **N8** For a rider who left a ride that was later canceled, does Past Rides show "Left" or "Canceled"?
- **N9** Access to a private ride's details for pending requesters and riders who left, after the link has ended.
- **N10** Maximum ride capacity, and how it relates to the default link limit of 50.
- **N11** Final confirmation of the provisional values: **50** default joins per link, and a **30-day** maximum link expiry.

### 12.2 Earlier [PROPOSED] items still awaiting a decision (not assumed approved)
- **P1** The secondary rider-local time is shown automatically, with no user setting (§2.3).
- **P2** Weather Review badge in discovery (§3.2).
- **P3** Discovery sort: soonest departure, then distance (§3.2).
- **P4** Removal not allowed after departure, or on Canceled or Completed rides (§4.5).
- **P5** Sign-in required before a link grants access (§5.7).
- **P6** More than one active link per ride at a time (§5.7).
- **P7** Participant approval off by default (§6).
- **P8** Declining the new schedule = `Canceled`, which frees the seat (§7.5).
- **P9** Reconfirmation tracked for Confirmed and Tentative participants only (§7.5).
- **P10** Reconfirmation status resets on each reschedule (§7.5).
- **P11** Reschedule constraints: future departure only; not allowed on Canceled or Completed rides (§7.5).
- **P12** Rescheduling doesn't change a Weather Review status (§7.5).
- **P13** "Mark as completed" available only after departure (§7.6).

### 12.3 Unresolved technical decisions
- The geocoding, mapping and time-zone provider research and recommendation (§10.2).
- Final architecture approval, including confirming the Supabase PostgreSQL direction (§10.1).
- Push and email providers, when those channels are scheduled.
- The weather provider and thresholds, only if §9.2 is approved.

### 12.4 Resolved decisions
- **Revision 2:**
  - Calendar: Pending display, week boundary, format, time display.
  - Discovery: radius and units, Full-ride visibility.
  - Seat rules, private access approach, preserving reservations on reschedule, organizer-controlled completion, channel priority, weather scope.
- **Revision 3:**
  - Calendar: left rides removed from active sections; declined requests hidden with the record kept.
  - Full rides: Tentative/Pending entries kept, no automatic promotion, nobody can join a full ride.
  - Capacity can't be lowered below occupied seats.
  - Link expiry (7-day default), maximum uses, revocation; rejoining through a valid link.
  - Reconfirmation visibility; "Awaiting Completion"; email scope.
  - Five proposed rules approved: canceled rides visible, joining blocked after departure, time zone from the meeting point, minimum capacity 2, revocation keeps riders who joined.
  - Technical direction.
- **Revision 4:**
  - "Left" label in Past Rides.
  - Organizer removal: reason required, rider notified, recorded in history, no deletion.
  - Invitation links: default of 50 successful joins (provisional), configurable; a use = a successful join, with rejoins counting.
  - Link stops at departure; 30-day maximum expiry (provisional).
  - Opened-only visitors lose access when the link ends; members keep access.
  - Re-requesting after a decline allowed.
  - C1–C8 resolved (§11.1).

---

## 13. Acceptance criteria (Core Ride Lobby milestone)

These cover **[APPROVED]** requirements only. Provisional values are shown in *italics*.

**Calendar**
- [ ] The calendar shows This Week / Upcoming Rides / Past Rides lists. Week boundaries are computed in the rider's time zone, with the first day following the rider's locale.
- [ ] Rides the rider organizes, or is Confirmed, Tentative or Pending on, appear. Pending rides are labeled "Awaiting Approval."
- [ ] Ride-local time is primary, with the rider's local time optionally shown as secondary.
- [ ] A ride whose departure has passed never appears in This Week or Upcoming.
- [ ] Rides the rider left leave the active sections and appear in Past Rides labeled "Left" after departure. The record is kept.
- [ ] Declined requests disappear from the active calendar, and the record is kept on the backend.
- [ ] Canceled rides stay visible with their reason.
- [ ] Rides past departure that haven't been completed appear in Past Rides labeled "Awaiting Completion," with the stored status unchanged.
- [ ] The calendar updates on every event in R-CAL-5 without a manual refresh.

**Discovery**
- [ ] Discovery centers on device location (with permission) or the selected city, and matches on meeting point.
- [ ] Radius defaults to 40 km, adjustable from 5 to 160 km. Users can choose km or miles, with the starting unit from their locale.
- [ ] Results show destination, meeting point, departure time, organizer, available slots and conditions.
- [ ] Canceled, Completed, private, and past-departure rides never appear, whatever their stored status.
- [ ] Full rides appear labeled "Full," with joining disabled and refused by the server.

**Capacity and membership**
- [ ] Available slots = capacity − (organizer + Confirmed). Capacity defaults to 10, with a minimum of 2.
- [ ] The server refuses every join and new request on a full ride, including Tentative. Existing Tentative and Pending entries are kept.
- [ ] When a seat opens, eligible riders get an in-app notification. No seat is reserved, and no one is promoted automatically. Approval applies when enabled. Losing a race shows "Seat no longer available."
- [ ] Capacity can't be lowered below occupied seats, and no rider is removed automatically.
- [ ] Organizers can remove Confirmed participants only with a reason. The rider is notified, the action is recorded in the ride history, and the record is kept, not deleted.
- [ ] A declined rider can request again if the ride hasn't departed or been canceled, and capacity and approval rules allow it.
- [ ] Concurrent joins, approvals, rejoins, removals, capacity changes and link redemptions never exceed capacity or usage limits (verified by the §10.3 tests).

**Private rides and invitation links**
- [ ] Private rides never appear in discovery. Only authorized riders can view or join them, enforced by the server.
- [ ] Tokens are cryptographically secure and only their hashes are stored. The link can be copied when created, and organizers can create replacement links.
- [ ] Configured expiry defaults to 7 days and is configurable up to *30 days*. Effective expiry is whichever comes first: the configured expiry or departure.
- [ ] Maximum uses is configurable, defaulting to *50* successful joins. Opening a link or a failed join attempt doesn't use it up. Rejoins do.
- [ ] The server refuses expired, revoked, used-up and post-departure links.
- [ ] Revoking a link doesn't remove riders who already joined. Opened-only visitors lose access when the link ends. Members keep access.
- [ ] A rider who left can rejoin through a valid link, subject to capacity, approval, the joining window and the no-duplicate rule.

**Ride creation**
- [ ] Every required field is enforced. The time zone comes from the meeting point. Capacity defaults to 10, with a minimum of 2. Visibility and optional approval are supported.

**Status, rescheduling and completion**
- [ ] Ride and participant statuses are independent and follow §7.2. The record of how a participant became Canceled (left, declined, removed) is kept.
- [ ] The server blocks joining after departure.
- [ ] Cancellation requires a reason, notifies active participants, and blocks further joins, re-requests and RSVP changes.
- [ ] Rescheduling notifies active participants and asks them to reconfirm. Confirmed reservations are kept until riders change them. Organizers can see who reconfirmed, who is awaiting and who declined.
- [ ] Only the organizer can mark a ride Completed. Nothing is completed automatically.

**Notifications**
- [ ] Every event in §8.3 creates an in-app notification for the correct recipients.
- [ ] Delivery uses a channel abstraction. No push or email is sent in the initial release.

**Weather**
- [ ] The weather policy is shown on ride detail, discovery results and calendar entries. Organizers can send disruption notices, use Weather Review, and cancel or reschedule.
- [ ] No weather provider integration and no automatic weather cancellation.

---

## Revision history
- **Revision 1:** Initial addendum.
- **Revision 2:** Applied first-review decisions. Added approval labels, capacity and private-access sections.
- **Revision 3:** Resolved the second-review product decisions. Added technical direction and the conflicts register.
- **Revision 4:**
  - Applied the third-review decisions: "Left" label, organizer removal, link usage and expiry rules, access when a link ends, re-requests after a decline.
  - Resolved C1–C8.
  - Recorded Supabase PostgreSQL as the proposed database direction.
  - Added the provisional-value label.
  - Logged new contradictions and edge cases (X1–X9) and new decisions (N1–N11).
  - Kept earlier proposed items unapproved (P1–P13).
