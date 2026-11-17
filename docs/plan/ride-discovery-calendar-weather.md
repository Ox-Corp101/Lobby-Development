# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Revision 2. Product decisions from the first review are applied. Awaiting final review. **Do not begin implementation until this plan is approved.**
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked otherwise.

> Note: the base Lobby development plan is not in this repository yet. This document stands alone and should be merged into, or linked from, the base plan once that plan is added.

### How to read this document

Every requirement and rule carries one of these labels:

| Label | Meaning |
|---|---|
| **[APPROVED]** | Decided by the product owner. Approved for the Core Ride Lobby milestone once this plan is signed off. |
| **[FUTURE]** | Approved direction, but not part of the core release. Evaluate or build later. |
| **[ENHANCEMENT — REQUIRES APPROVAL]** | Separate work item. Needs explicit approval before any design or build work. |
| **[PROPOSED]** | Suggested by the plan author and **not yet approved**. Needs confirmation (listed in §11). |
| **[OPEN]** | An unresolved decision (listed in §11). |

---

## 1. Scope summary

| Area | Milestone / label |
|---|---|
| Personal Ride Calendar (section lists) | Core: **[APPROVED]** |
| Month-grid calendar view | **[FUTURE]** |
| Nearby Ride Search (list view) | Core: **[APPROVED]** |
| Map-based discovery | **[FUTURE]** |
| Ride Creation | Core: **[APPROVED]** |
| Participant capacity and seat rules | Core: **[APPROVED]** |
| Private rides via secure invitation links | Core: **[APPROVED]** |
| Private rides via direct invitations | **[FUTURE]** (intended functionality, after invitation links) |
| Ride and participant statuses | Core: **[APPROVED]** |
| Rescheduling with reconfirmation request | Core: **[APPROVED]** |
| Reconfirmation deadlines | **[FUTURE]** |
| Manual ride completion by the organizer | Core: **[APPROVED]** |
| Post-departure "mark as completed" reminders | **[FUTURE]** |
| Manual weather management | Core: **[APPROVED]** |
| In-app notifications | Core: **[APPROVED]** |
| Push notifications | **[FUTURE]** (next enhancement after core) |
| Email notifications for important transactional events | **[FUTURE]** (subject to cost and provider evaluation) |
| Geocoding / places provider selection | **[OPEN]**: evaluation required, see §3.3 |
| External weather API integration | **[ENHANCEMENT — REQUIRES APPROVAL]** |
| Automatic weather-based cancellation | **[ENHANCEMENT — REQUIRES APPROVAL]** |

---

## 2. Personal Ride Calendar

### 2.1 Requirements **[APPROVED]**
- R-CAL-1: The initial release uses **section-based lists**: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-2: Include rides the user **organizes**, and rides where they are **Confirmed**, **Tentative** or **Pending Approval**.
- R-CAL-3: Pending Approval rides appear on the rider's calendar labeled **"Awaiting Approval."**
- R-CAL-4: Each entry shows meeting location, destination, date, time, and the user's participation status.
- R-CAL-5: The calendar updates automatically when a rider joins, leaves, changes RSVP status, is approved or declined, or when the ride is rescheduled or canceled.
- R-CAL-6: The **ride's local time** is the primary time shown. If the user's time zone differs, the user's local time may be shown as secondary information.
- R-CAL-7: The "This Week" boundary (which day the week starts on) **follows the user's locale**.
- R-CAL-8: Past rides never appear in This Week or Upcoming Rides.
- R-CAL-9: Riders who leave a ride are **removed from This Week and Upcoming Rides**. Their participation record is kept (not deleted), with status `Canceled`, so the history is preserved.

### 2.2 Section placement rules **[APPROVED]**
- Placement depends on the ride's **departure time**, evaluated against the current time:
  - *This Week*: departure is in the future and falls within the current week as defined by the user's locale.
  - *Upcoming Rides*: departure is in the future and falls after the current week.
  - *Past Rides*: departure has passed, or the ride is `Completed`.
- Because completion is manual (§7), a ride whose departure has passed moves to *Past Rides* even when the organizer has not yet marked it `Completed`.

### 2.3 Items needing confirmation
- **[PROPOSED]** Canceled rides stay visible to participants who had not left, labeled "Canceled," with the cancellation reason. They appear in the section matching their original departure time until that time passes, then in Past Rides.
- **[PROPOSED]** The secondary local time is shown automatically whenever the user's device time zone differs from the ride's. No user setting is needed in the initial release.
- **[OPEN]** Whether a ride the user left appears in their *Past Rides* section, or is kept only in the history record. See §11, item 1.
- **[OPEN]** Whether a declined join request appears anywhere on the rider's calendar. See §11, item 2.

### 2.4 Future
- **[FUTURE]** Month-grid calendar view.

---

## 3. Nearby Ride Search

### 3.1 Requirements **[APPROVED]**
- R-DISC-1: Default the search center to the rider's **selected city**, or to their **device location** if they have granted permission.
- R-DISC-2: Match rides by **meeting point**, not destination.
- R-DISC-3: Search radius: **default 40 km, minimum 5 km, maximum 160 km**. The user can adjust it within that range.
- R-DISC-4: Users can show distances in **kilometers or miles**. The initial unit comes from the user's locale and can be changed. The radius limits above are fixed in kilometers and converted for display.
- R-DISC-5: Each result shows destination, meeting point, departure time, organizer, available slots, and ride conditions.
- R-DISC-6: Exclude `Canceled` and `Completed` rides from default results.
- R-DISC-7: **Private rides never appear in discovery** (see §5).
- R-DISC-8: **Full rides stay visible** with a **"Full"** label, and **joining them is disabled**. The block is enforced on the server (see §4).
- R-DISC-9: List view in the initial release.

### 3.2 Rules
- **[APPROVED]** Location order: device location (only with permission) → selected city → ask the user to choose a city. Location is never collected without consent.
- **[PROPOSED]** Default results include only rides whose departure time is still in the future, even if the organizer has not marked a past ride `Completed`.
- **[PROPOSED]** Rides in `Weather Review` stay in results with a "Weather Review" badge.
- **[PROPOSED]** Default sort: soonest departure first, with distance as the tie-breaker.

### 3.3 Geocoding / places provider **[OPEN]**
No provider has been chosen. Before recommending one, evaluate the candidates on:
- Pricing, at expected volume and at scale
- Geographic coverage of the launch regions
- Licensing, including the terms for storing and caching geocoded results
- Reliability and service levels
- Scalability and rate limits

The result should be a short recommendation, submitted for approval.

### 3.4 Future
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

- **Available slots = capacity − (organizer + confirmed participants).**
- The default capacity is 10, including the organizer (§6).
- A ride is **Full** when available slots = 0.

### 4.2 Enforcement
- The backend enforces capacity. Clients are not trusted to do so.
- **Concurrent join requests** are handled safely: no sequence of simultaneous joins, confirmations, or approvals can push confirmed participants plus the organizer above capacity.
- Every action that takes a seat checks capacity at the moment it is committed. That covers joining as Confirmed, switching Tentative → Confirmed, and an organizer approving a pending rider.
- Leaving a ride, or switching Confirmed → Tentative or Canceled, frees the seat right away.
- When a ride is Full, new joins are rejected on the server (R-DISC-8).

### 4.3 Items needing confirmation
- **[OPEN]** On a **Full** ride, can existing Tentative riders, or riders already in Pending Approval, stay in that state? And what message do they see when they try to confirm, or when the organizer tries to approve them? (Under §4.2 the action is refused while the ride is full.) See §11, item 3.
- **[OPEN]** Can a rider join a Full ride as **Tentative**, given that tentative riders don't take a seat? The current reading of R-DISC-8 is **no**: joining is disabled in every form. See §11, item 4.
- **[OPEN]** Can an organizer **lower capacity** below the number of seats already taken? See §11, item 5.
- **[OPEN]** Implementation technique for safe concurrent seat allocation, such as a transactional row lock or a conditional atomic update. This is a technical design decision for the implementation phase, and does not change product behavior.

---

## 5. Private Ride Access

### 5.1 Requirements
- **[APPROVED]** The intended functionality supports both **invitation links** and **direct invitations**.
- **[APPROVED]** The initial implementation delivers **secure invitation links**.
- **[FUTURE]** Direct invitations (inviting specific users inside the app) follow later.

### 5.2 Security rules **[APPROVED]**
- Private rides **never appear in public discovery**.
- **Only authorized invited riders** can see a private ride's details or join it.
- Invitation links use **secure, unguessable tokens**: generated with a cryptographically secure random source and long enough that guessing them is not practical.
- Organizers can **revoke** invitation links. A revoked link stops granting access straight away.
- **All access restrictions are enforced on the server.** Hiding things in the app is not treated as access control.

### 5.3 Items needing confirmation
- **[PROPOSED]** A rider must be signed in before an invitation link grants access. Opening a valid link then makes that user an authorized invitee.
- **[PROPOSED]** Revoking a link does **not** remove riders who already joined through it. It only stops new access.
- **[PROPOSED]** An organizer can create a replacement link after revoking one.
- **[OPEN]** Whether links expire (and when) and whether they have a maximum number of uses. See §11, item 6.
- **[OPEN]** Whether an invited rider who later leaves can rejoin using the same link. See §11, item 7.
- **[OPEN]** Token storage approach (for example, storing only a hash of the token). This is a technical design decision for the implementation phase.

---

## 6. Ride Creation **[APPROVED]**

### 6.1 Required fields
| Field | Notes |
|---|---|
| Title | Required |
| Description | Required |
| Meeting point | Geocoded location. Discovery searches on this. |
| Destination | Location |
| Date | In the ride's local time zone |
| Meeting time | At or before the departure time |
| Departure time | Must be in the future when the ride is created |
| Participant capacity | Default **10, including the organizer** |
| Ride conditions | `Dry Only` or `Rain or Shine` |
| Visibility | `Public` or `Private` |
| Participant approval | Optional toggle |

### 6.2 Rules
- **[APPROVED]** The organizer is added automatically and takes one seat.
- **[APPROVED]** With approval **on**, joining puts the rider in `Pending Approval`, which takes no seat. Approval is subject to capacity (§4.2).
- **[APPROVED]** With approval **off**, joining makes the rider `Confirmed` (if a seat is free) or `Tentative`.
- **[APPROVED]** Private rides are reachable only through invitation (§5).
- **[PROPOSED]** The ride's time zone comes from the meeting point's location, not from the organizer's device.
- **[PROPOSED]** Minimum capacity is 2 (the organizer plus one rider).
- **[PROPOSED]** Participant approval is off by default.

---

## 7. Ride Status, Participant Status, Rescheduling & Completion

### 7.1 Separation **[APPROVED]**
Ride status and participant (RSVP) status are stored and managed **separately**.

### 7.2 Ride status **[APPROVED]**
| Status | Meaning |
|---|---|
| `Scheduled` | Default after creation. Active. Joinable if seats are free and departure hasn't passed. |
| `Weather Review` | The organizer has flagged a possible weather disruption. The ride is still active. |
| `Canceled` | The organizer canceled the ride. A reason is required. Final. |
| `Completed` | The organizer marked the ride as completed. Final. |

Allowed transitions:
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
| `Canceled` | Left, or was declined or removed. The record is kept. | No |

### 7.4 Cancellation **[APPROVED]**
- Canceling requires a **reason**. The reason is stored and shown to affected participants.
- Once a ride is `Canceled`, the server rejects every new join and every RSVP change.
- Every participant's calendar shows the change (see §2.3 for how it is displayed).
- Every active participant is notified (§8).
- Participant statuses are **not** overwritten on cancellation. The ride-level status takes precedence in the UI.

### 7.5 Rescheduling **[APPROVED]**
- The organizer can change the ride's date, meeting time and/or departure time. The ride keeps its identity and its participant list.
- **Every active participant is notified** and **asked to review and reconfirm** their attendance.
- **Existing Confirmed statuses and seat reservations stay in place** until each participant changes their response.
- Confirmed riders are **never removed automatically**, and their seats are never released, just because the schedule changed.
- Tentative and Pending Approval statuses are likewise kept.
- **[PROPOSED]** A new departure time must be in the future. A `Canceled` or `Completed` ride can't be rescheduled.
- **[PROPOSED]** Rescheduling a ride in `Weather Review` does not change its status on its own. The organizer moves it back to `Scheduled` explicitly.
- **[OPEN]** Whether "reconfirmed" is recorded as a separate flag (so the organizer can see who has responded) or whether the reconfirmation request is only a prompt. See §11, item 8.
- **[FUTURE]** Reconfirmation deadlines.

### 7.6 Completion **[APPROVED]**
- **The organizer controls completion.** Only the organizer can mark a ride `Completed`.
- A ride is **not** marked `Completed` automatically because its departure time has passed.
- **[PROPOSED]** "Mark as completed" becomes available only after the departure time.
- **[PROPOSED]** New joins and RSVP changes are blocked once the departure time has passed, whether or not the ride has been marked completed.
- **[OPEN]** What happens to rides the organizer never marks completed, for example an organizer-only "unresolved past rides" list. See §11, item 9.
- **[FUTURE]** Optional reminders to the organizer after the scheduled departure time.

---

## 8. Notifications

### 8.1 Delivery channels, in priority order
1. **[APPROVED]** **In-app notifications**: the core release.
2. **[FUTURE]** **Push notifications**: the next enhancement.
3. **[FUTURE]** **Email**: for important transactional events, subject to cost and provider evaluation.

### 8.2 Architecture **[APPROVED]**
- The notification system must be **extensible**. Notifications are generated once per event and sent through pluggable delivery channels, so push, email or other channels can be added later without changing how the events themselves are produced.

### 8.3 Core events (in-app) **[APPROVED]**
| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer |
| Join request submitted (approval on) | Organizer |
| Join request approved / declined | The requesting rider |
| Ride enters `Weather Review` | All active participants |
| Weather disruption notice from the organizer | All active participants |
| Ride rescheduled (with a reconfirmation request) | All active participants |
| Ride canceled (with the reason) | All active participants |

"Active participants" means the organizer and every participant in `Confirmed`, `Tentative` or `Pending Approval`.

### 8.4 Items needing confirmation
- **[OPEN]** Which events count as "important transactional events" for email once email is evaluated. A suggested starting set is cancellation, rescheduling and approval decisions. See §11, item 10.
- **[OPEN]** Push and email provider selection, when those enhancements are scheduled.

---

## 9. Weather-Based Ride Management

### 9.1 Core milestone (manual) **[APPROVED]**
- R-WX-1: Show the organizer's weather policy (`Dry Only` / `Rain or Shine`) on ride detail, discovery results and calendar entries.
- R-WX-2: Organizers can notify participants about a possible weather disruption.
- R-WX-3: Organizers can put rides into `Weather Review`.
- R-WX-4: Organizers can cancel or reschedule rides (§7.4, §7.5).
- R-WX-5: Cancellation requires a reason, which is stored and shown to participants.
- R-WX-6: Affected participants are notified (§8).
- R-WX-7: **No ride is canceled automatically based on a forecast** in the core milestone.

### 9.2 External weather integration and automatic cancellation **[ENHANCEMENT — REQUIRES APPROVAL]**
This is a separate work item that needs **explicit approval**. Before any implementation, the following must be defined and approved:
1. Weather data source: provider, cost, licensing, rate limits
2. Rain threshold: probability and/or amount, at the meeting point, during the ride window
3. Geographic coverage
4. Check timing: when and how often forecasts are checked before departure
5. Notification behavior: who is notified, through which channels, and when

Even then, the system must never cancel a ride based only on an uncertain forecast.

---

## 10. Data model sketch **[PROPOSED]**

This sketch is for discussion only. It is not an approved schema, and no schema or migration work is authorized by this document.

- **Ride**: id, organizer_id, title, description, meeting_point (lat/lng, label), destination (lat/lng, label), time_zone (IANA), meeting_time, departure_time (stored in UTC), capacity (default 10), conditions, visibility, requires_approval, status, canceled_reason, canceled_at, completed_at, created_at, updated_at.
- **RideParticipant**: ride_id, user_id, status, is_organizer, joined_at, updated_at, plus an optional reconfirmation field (depends on §11, item 8). Records are kept when a rider leaves.
- **RideStatusEvent** (audit log): ride_id, from_status, to_status, reason, actor_id, created_at. It also records reschedules (old and new times).
- **RideInvitationLink**: ride_id, token (or a hash of it), created_by, created_at, revoked_at, plus optional expiry and usage limit (depends on §11, item 6).
- **Notification**: recipient_id, event_type, ride_id, payload, created_at, read_at. Delivery is tracked per channel, so channels can be added later.
- **User preferences**: distance unit (km / mi, defaulting from locale), plus the locale used for the week boundary.

---

## 11. Remaining decisions

### 11.1 Product decisions needing your input
1. **Leaving a ride:** should a ride the user left appear in their *Past Rides* section, or be kept only in the history record?
2. **Declined requests:** should a declined join request appear on the rider's calendar (for example, briefly labeled "Declined"), or disappear?
3. **Full rides and existing riders:** if a ride is Full, do existing Tentative and Pending Approval riders stay in place and wait for a seat to open? Should they be notified when one opens?
4. **Tentative on Full rides:** confirm that new riders can't join a Full ride even as Tentative.
5. **Lowering capacity:** can an organizer reduce capacity below the seats already taken? If so, what happens to the confirmed riders over the limit?
6. **Invitation links:** should links expire and/or have a maximum number of uses? If so, what are the defaults?
7. **Rejoining via link:** can an invited rider who left rejoin using the same link?
8. **Reconfirmation tracking:** should the plan track who has reconfirmed after a reschedule (visible to the organizer), or just prompt riders?
9. **Unmarked past rides:** how should rides the organizer never marks completed be handled?
10. **Email events:** which events count as "important transactional" for email, once email is evaluated?
11. **Confirm the [PROPOSED] items** in §2.3, §3.2, §5.3, §6.2, §7.5 and §7.6, or adjust them.

### 11.2 Technical decisions (implementation phase or evaluation)
- **Geocoding / places provider:** evaluation and recommendation required (§3.3).
- **Concurrent seat allocation technique** (§4.3).
- **Invitation token generation and storage** (§5.3).
- **Push and email providers**, when those enhancements are scheduled (§8.4).
- **Weather data provider and thresholds**, only if the weather enhancement is approved (§9.2).

### 11.3 Resolved in revision 2
- Calendar inclusion of Pending Approval riders, removal of riders who leave, week boundary, calendar format, time-zone display (§2).
- Search radius, distance units, Full-ride visibility, approach to choosing a provider (§3).
- Capacity and seat rules (§4).
- How private rides are accessed (§5).
- Reschedule behavior (§7.5).
- Completion control (§7.6).
- Notification channels and their priority (§8).
- Scope of weather management (§9).

---

## 12. Acceptance criteria (Core Ride Lobby milestone)

These cover **[APPROVED]** requirements only. Criteria for [PROPOSED] items will be added once those items are approved.

**Calendar**
- [ ] The calendar shows This Week / Upcoming Rides / Past Rides as section lists, with the week boundary following the user's locale.
- [ ] Rides the user organizes, or is Confirmed, Tentative or Pending Approval on, appear. Pending rides are labeled "Awaiting Approval."
- [ ] Ride times show in the ride's local time. When the user's time zone differs, the user's local time can be shown as secondary information.
- [ ] A ride whose departure has passed never appears in This Week or Upcoming Rides.
- [ ] A rider who leaves a ride no longer sees it in This Week or Upcoming Rides, and their participation record is kept.
- [ ] The calendar updates on join, leave, RSVP change, approval or decline, reschedule and cancellation, without a manual refresh.

**Discovery**
- [ ] Discovery centers on device location (with permission) or the selected city, and matches on meeting point.
- [ ] The radius defaults to 40 km and can be adjusted between 5 and 160 km. Users can switch between km and miles, with the initial unit taken from their locale.
- [ ] Results show destination, meeting point, departure time, organizer, available slots and conditions.
- [ ] Canceled, Completed and private rides never appear in default results.
- [ ] Full rides appear labeled "Full," the join action is disabled, and join attempts on them are rejected by the server.

**Capacity**
- [ ] Available slots = capacity − (organizer + Confirmed). Tentative, Pending Approval and Canceled riders take no seat.
- [ ] Capacity is enforced on the server, and concurrent join, confirm and approve requests can never exceed it (verified by a concurrency test).

**Private rides**
- [ ] The initial release supports secure invitation links built on unguessable tokens.
- [ ] Only authorized invitees can view or join a private ride, enforced on the server.
- [ ] Organizers can revoke a link, and a revoked link stops granting access straight away.

**Ride creation**
- [ ] Every required field is enforced. Capacity defaults to 10, including the organizer. Visibility and the optional approval setting are supported.

**Status, rescheduling and completion**
- [ ] Ride status and participant status are stored and changed independently, following the allowed transitions in §7.2.
- [ ] Cancellation requires a reason, notifies active participants, shows on calendars, and the server rejects joins and RSVP changes afterwards.
- [ ] Rescheduling notifies active participants and asks them to reconfirm. Confirmed statuses and seats are kept until each participant changes their response.
- [ ] Only the organizer can mark a ride Completed. No ride becomes Completed automatically.

**Notifications**
- [ ] Every event in §8.3 creates an in-app notification for the right recipients.
- [ ] Notifications are delivered through a channel abstraction, so push or email can be added without changing how events are produced.

**Weather**
- [ ] The weather policy is shown on ride detail, discovery results and calendar entries.
- [ ] Organizers can send weather disruption notices, put rides into Weather Review, and cancel or reschedule.
- [ ] No automated weather checks or automated cancellations exist in the core milestone.

---

## Revision history
- **Revision 1:** Initial addendum drafted from the requirements brief.
- **Revision 2:** Applied review decisions on the calendar, discovery, capacity, private access, rescheduling, completion, notifications and weather. Added approval labels, capacity and private-access sections, and updated the open questions and acceptance criteria.
