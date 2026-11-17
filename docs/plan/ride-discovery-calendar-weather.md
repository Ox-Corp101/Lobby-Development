# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Revision 6. Fifth-review decisions (items 1–30) are applied. Awaiting review. **Do not begin implementation or architecture work until this plan is explicitly approved.**
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked otherwise.
**Approval tracks:** (1) product requirements approval, (2) provider research and recommendation, and (3) final architecture approval are **separate**. Approving this document approves product requirements only.

> Note: the base Lobby development plan is not in this repository yet. This document stands alone and should be merged into, or linked from, the base plan once that plan is added.

### How to read this document

| Label | Meaning |
|---|---|
| **[APPROVED]** | Decided by the product owner. Approved for the Core Ride Lobby milestone once this plan is signed off. |
| **[PROVISIONAL]** | The behavior is approved, but the stated value still needs final confirmation. |
| **[FUTURE]** | Approved direction, but not part of the core release. |
| **[ENHANCEMENT — REQUIRES APPROVAL]** | Separate work item. Needs explicit approval first. |
| **[TECH DIRECTION]** | Architectural direction. Documented only. Final architecture approval is separate. |
| **[PROPOSED]** | Suggested by the plan author and **not yet approved**. |
| **[OPEN]** | An unresolved decision (see §12). |

**Provisional values in this revision:** 24-hour request cooldown · 50 default successful link uses · 30-day maximum configured link expiry.
**Unresolved value:** numerical maximum ride capacity.

---

## 1. Scope summary

| Area | Label |
|---|---|
| Personal Ride Calendar (section lists, automatic secondary local time) | **[APPROVED]** |
| Distinct participation outcomes: Declined, Withdrawn, Left, Removed | **[APPROVED]** |
| Past Rides labels: "Left," "Withdrawn," "Removed," "Canceled," "Awaiting Completion" | **[APPROVED]** |
| Minimal history for former participants of private rides | **[APPROVED]** |
| Month-grid calendar | **[FUTURE]** |
| Nearby Ride Search (list, future departures only, Weather Review badge, soonest-then-distance sort) | **[APPROVED]** |
| Map discovery | **[FUTURE]** |
| Ride Creation (approval off by default, minimum capacity 2) | **[APPROVED]** |
| Numerical maximum ride capacity | **[OPEN]** (§4.8) |
| Capacity, full-ride, capacity-reduction rules | **[APPROVED]** |
| Seat allocation: no priority; first valid server-confirmed join, or organizer choice on approval rides | **[APPROVED]** |
| Organizer removal (before departure, active rides only, reason shown) | **[APPROVED]** |
| Organizer **reinstatement** of removed riders | **[APPROVED]** (how it works: **[OPEN]**, §4.6) |
| Re-request after a decline | **[APPROVED]** |
| 24-hour cooldown after a decline | **[PROVISIONAL]** |
| Pending request status screen (limited details) | **[APPROVED]** |
| Pending requests closing automatically at departure | **[APPROVED]** |
| Private rides via one active secure link, sign-in required | **[APPROVED]** |
| Link-use limit separate from capacity | **[APPROVED]** |
| 50 default link uses; 30-day maximum expiry | **[PROVISIONAL]** |
| Direct invitations, invitation emails | **[FUTURE]** |
| Rescheduling (future time only; not after departure has passed; reconfirmation tracking) | **[APPROVED]** |
| Reconfirmation deadlines | **[FUTURE]** |
| Manual completion, only after departure | **[APPROVED]** |
| Organizer completion reminders | **[FUTURE]** |
| Manual weather management | **[APPROVED]** |
| In-app notifications | **[APPROVED]** |
| Push and email notifications | **[FUTURE]** |
| Supabase PostgreSQL; atomic enforcement; hashed tokens | **[TECH DIRECTION]** |
| Geocoding / mapping / time-zone provider | Separate research deliverable. **Not started. Not selected.** |
| Push, email and weather providers | Deferred |
| Weather API, automatic weather cancellation | **[ENHANCEMENT — REQUIRES APPROVAL]** |

---

## 2. Personal Ride Calendar

### 2.1 Requirements **[APPROVED]**
- R-CAL-1: Section lists: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-2: Include rides the rider **organizes**, and rides where they are **Confirmed**, **Tentative** or **Pending Approval**.
- R-CAL-3: Pending entries are labeled **"Awaiting Approval."** On private rides, a pending entry shows only what the request-status screen shows (§5.6).
- R-CAL-4: Entries for **active participation** show meeting location, destination, date, time and status. History entries follow §2.3.
- R-CAL-5: The calendar updates automatically on join, leave, withdrawal, removal, reinstatement, RSVP change, approval or decline, a pending request closing automatically, reschedule, cancellation and completion.
- R-CAL-6: The ride's local time is primary. The rider's local time is shown automatically when it differs.
- R-CAL-7: Week boundaries are computed in the rider's time zone, with the first day of the week from the rider's locale.
- R-CAL-8: Past rides never appear in This Week or Upcoming Rides.
- R-CAL-9: **Canceled rides** stay visible, labeled "Canceled," with the reason.
- R-CAL-10: Rides past departure that haven't been completed appear in Past Rides as **"Awaiting Completion."**

### 2.2 Participation outcomes **[APPROVED]**
These four outcomes are **distinct** and each is recorded separately.

| Outcome | How it happens | This Week / Upcoming | Past Rides | Coming back |
|---|---|---|---|---|
| **Declined** | The organizer declines a join request | Removed | Not shown (§2.4) | May request again after the **[PROVISIONAL]** 24-hour cooldown |
| **Withdrawn** | The rider declines a rescheduled time | Removed | **"Withdrawn"** after departure | **[OPEN]** Q13 |
| **Left** | The rider leaves the ride | Removed | **"Left"** after departure | Normal join rules (§4.6) |
| **Removed** | The organizer removes the rider | Removed | **"Removed"** after departure | **Only** through explicit organizer reinstatement |

- **If the ride is later canceled**, the displayed outcome is **"Canceled."** The rider's own outcome (Left, Withdrawn or Removed) stays in their participation history. Neither event is erased.
- Records are never deleted. Every outcome and action is kept in the ride history, with actor, time and reason.

### 2.3 History entries for former participants **[APPROVED]**
- **Private rides.** Former participants keep **only minimal personal history**:
  - ride title
  - date
  - their participation outcome
  - the relevant history of their own participation actions (including the removal reason, if removed)

  **Hidden:** meeting point, destination, description and participant list.
- **Public rides.** History may keep the normal historical ride details, subject to privacy and access controls.
  - **[OPEN]** Whether "normal details" includes the **participant list** for former participants. See Q24.

### 2.4 Declined requests and closed requests
- **[APPROVED]** Declined requests disappear from the active calendar. The record is kept on the backend.
- **[APPROVED]** Requests still pending at departure **close automatically**, and the requester is notified (§5.5).
- **[OPEN]** How a closed request is recorded and shown to the rider: its label, and whether it appears in history. See Q22.

---

## 3. Nearby Ride Search **[APPROVED]**
- R-DISC-1: Search centers on the selected city, or on device location if permitted. Order: device location → selected city → ask the rider.
- R-DISC-2: Matches on meeting point.
- R-DISC-3: Radius: default 40 km, minimum 5 km, maximum 160 km.
- R-DISC-4: km or miles, with the starting unit from the locale.
- R-DISC-5: Results show destination, meeting point, departure time, organizer, available slots and conditions.
- R-DISC-6: Excludes Canceled, Completed, private, and past-departure rides, whatever their stored status.
- R-DISC-7: Full rides are labeled "Full," with joining disabled and refused by the server.
- R-DISC-8: Weather Review badge.
- R-DISC-9: Sort: soonest departure, then distance.
- R-DISC-10: List view. **[FUTURE]** Map.

---

## 4. Participant Capacity & Membership

### 4.1 Seat rules **[APPROVED]**
| Participant | Consumes a seat? |
|---|---|
| Organizer | Yes (one) |
| Confirmed | Yes |
| Tentative | No |
| Pending Approval | No |
| Declined / Withdrawn / Left / Removed | No |

- Available slots = capacity − (organizer + Confirmed).
- Full = 0 available slots.
- Capacity defaults to 10, minimum 2, both including the organizer.

### 4.2 Enforcement **[APPROVED]**
- The server enforces capacity on every seat-taking action:
  - joining as Confirmed
  - Tentative → Confirmed
  - approval
  - rejoining
  - reinstatement
- Each check is atomic with its change. Concurrent actions never overbook.

### 4.3 Full rides and seat allocation **[APPROVED]**
- Nobody can join a full ride, including as Tentative, and nobody can submit a new request on one. The server enforces this.
- Existing Tentative and Pending entries are kept.
- When a seat opens, eligible riders are notified. **Notifications don't reserve seats.**
- **No priority** is given to existing Tentative or Pending participants in the initial release.
- **Rides without approval:** the **first valid, server-confirmed join** gets the seat. Others see **"Seat no longer available."**
- **Rides with approval:** the **organizer chooses** which eligible request to approve, subject to capacity and invitation-link limits (§5.4).
- No one is promoted automatically. No automated waitlist.

### 4.4 Lowering capacity **[APPROVED]**
- Capacity can't be set below occupied seats, or below 2.
- The organizer must reduce the participant count first.
- No rider is removed automatically.

### 4.5 Organizer removal **[APPROVED]**
- Organizers may remove **Confirmed, Tentative and Pending Approval** participants.
- Removal is allowed **only before departure** and **only while the ride is active** (`Scheduled` or `Weather Review`). **No removal after cancellation**, and none after departure.
- A reason is required. The rider is notified and **shown the reason**. The event is kept in the ride history.
- The record is kept, with the outcome **Removed**.
- Removing a Confirmed participant frees a seat (§4.3).

### 4.6 Coming back after an outcome

**Removed riders [APPROVED]:**
- A removed rider **can't rejoin through a shared invitation link alone**, can't rejoin a public ride on their own, and **can't submit a join request**. This applies **whether participant approval is on or off**.
- Coming back requires an **explicit organizer reinstatement action**. The server enforces this.
- **No general approval process** is introduced on rides where approval is off just to handle removed riders.
- **[OPEN]** What reinstatement does. See Q20 and X24:
  - (a) It **lifts the block**, so the rider can then join under the normal rules (through a valid link on private rides).
  - (b) It **restores the rider directly** as a participant (Confirmed if a seat is free, or Tentative).
  - Either way: whether reinstatement is allowed only before departure and on active rides (suggested: yes, the same as removal); whether it uses a link use; and that the capacity check applies.

**Riders who left [APPROVED]:**
- They may rejoin under the normal rules:
  - capacity
  - approval, if enabled
  - no duplicate active participation
  - not after departure or cancellation
  - a valid link on private rides, where a successful rejoin uses one link use

**Withdrawn riders:**
- **[OPEN]** Can they rejoin, and under which rules? See Q13.

**Declined riders [APPROVED]:**
- They may submit another request if:
  - the ride hasn't departed or been canceled
  - capacity and approval rules allow it
  - on private rides, a valid link is used
- **[PROVISIONAL]** **24-hour cooldown**, measured **from the time the organizer declined the request**.
- The cooldown applies **only** to repeated requests after a decline. It doesn't apply to riders who left or were removed. (Removed riders need reinstatement in any case.)
- **[PROPOSED]** The server rejects early requests with a message stating when the rider can request again. See Q9.

### 4.7 Link-use limit vs capacity **[APPROVED]**
- Invitation-link use limits and ride capacity are **separate settings**. A link-use limit never becomes the ride's maximum capacity.
- Organizers can set the link-use limit **independently** of capacity.
- **[OPEN]** How the organizer is made aware when a link's remaining uses are fewer than the ride's open seats, so the limit doesn't **silently** restrict joining. Suggested: show remaining link uses next to open seats on the organizer's ride management view. See Q17.

### 4.8 Maximum ride capacity **[OPEN]**
- No numerical maximum is set until product and technical review.
- Implications to resolve:
  - **Product:** managing large groups, safety expectations, list sizes, misuse risk.
  - **Database:** seat-count limits, lock contention on a single ride, growth of the participant and history tables.
  - **Performance:** notification volume at once, query cost, real-time update volume.
- The link-use limit is not a substitute for a capacity maximum (§4.7).

---

## 5. Private Ride Access

### 5.1 Requirements
- **[APPROVED]** Initial release: secure invitation links, shared by the organizer. **One active link per ride.** Organizers can revoke it and create a replacement.
- **[FUTURE]** Direct invitations and invitation emails.

### 5.2 Security rules **[APPROVED]**
- Private rides never appear in discovery.
- **Sign-in is required** before a link reveals anything or allows joining.
- Only authorized riders see private details.
- Everything is enforced on the server.
- Only token hashes are stored. The link can be copied when created. Lost links are replaced.

### 5.3 Link lifecycle **[APPROVED]**
- Configured expiry: 7 days by default, configurable up to a maximum of **30 days [PROVISIONAL]**.
- **Effective expiry = whichever comes first: the configured expiry or the ride's departure time.**
- An expired link **never becomes valid again**.
- **Rescheduling:**
  - Moving departure earlier shortens the effective expiry as needed.
  - A later reschedule **never extends the original configured expiry**. The organizer can create a replacement link.
  - **[OPEN — carried forward]** If a link hasn't expired yet when departure moves later, may its effective expiry move later, up to the unchanged configured expiry? Or does it stay at the earlier departure time? See Q6.
- Maximum uses: configurable, independent of capacity. Default **50 successful uses [PROVISIONAL]**.
- **What counts as a use:** a successful join (a rejoin counts as another).
  - Opening a link, failed attempts, **pending requests**, declined requests and requests that closed automatically **don't** count.
- Revocation and expiry **block new requests and new joins**. Neither removes existing participants.

### 5.4 Pending requests and approval **[APPROVED]**
- **Pending requests don't use up the link.**
- Revoking or expiring a link **doesn't automatically cancel** requests submitted while it was valid. They stay pending for organizer review.
- **When the organizer approves a request**, the server rechecks **atomically**:
  - the **remaining use allowance** of the link the request came through
  - **ride capacity**
  - that the ride hasn't departed and isn't canceled

  If **either limit has been reached**, or the ride is no longer joinable, **the request isn't approved**. It stays pending, and the organizer sees why.
- A successful approval uses one link use and, if the rider is Confirmed, one seat.

### 5.5 Pending requests at departure **[APPROVED]**
- Requests still unresolved at departure **close automatically**.
- The requester is **notified**.
- Closed requests **can't be approved** after departure.
- They don't use a link use. The record is kept.
- **[OPEN]** The label and history display for closed requests (Q22). What happens to pending requests when a ride is **canceled** before departure (Q21).

### 5.6 Pending requester view **[APPROVED]**
- Pending requesters on private rides see a **limited request-status screen**: **ride title, date and time, and request status** only.
- They don't see the meeting point, destination, description or participant list until approved.
- This view stays available while the request is pending, including after the link expires or is revoked, because the request itself remains valid.

### 5.7 Access after membership ends **[APPROVED]**
- Active participants keep full access through their membership.
- Former participants keep only the minimal history in §2.3.
- People who only opened a link have no access once the link ends.

---

## 6. Ride Creation **[APPROVED]**

| Field | Notes |
|---|---|
| Title, Description | Required |
| Meeting point | Geocoded. Used for discovery and to set the ride's time zone. |
| Destination | Location |
| Date | Ride's local time zone |
| Meeting time | At or before the departure time |
| Departure time | Must be in the future when created |
| Capacity | Default 10, minimum 2, both including the organizer. Maximum **[OPEN]** |
| Conditions | `Dry Only` / `Rain or Shine` |
| Visibility | `Public` / `Private` |
| Participant approval | Optional, **off by default** |

- The organizer is added automatically and takes one seat.
- With approval on, joining creates a Pending request.
- With approval off, joining makes the rider Confirmed (if a seat is free) or Tentative. Neither is possible on a full ride.

---

## 7. Statuses, Rescheduling & Completion

### 7.1 Ride status **[APPROVED]**
| Status | Meaning |
|---|---|
| `Scheduled` | Active. Stays `Scheduled` after departure until the organizer marks it completed. |
| `Weather Review` | Active. Possible weather disruption. |
| `Canceled` | A reason is required. Final. |
| `Completed` | Set by the organizer, only after departure. Final. |

```
Scheduled       → Weather Review | Canceled | Completed (after departure)
Weather Review  → Scheduled | Canceled | Completed (after departure)
Canceled        → (final)
Completed       → (final)
```

### 7.2 Participant status **[APPROVED]**
| Status | Takes a seat | Notes |
|---|---|---|
| `Confirmed` | Yes | |
| `Tentative` | No | |
| `Pending Approval` | No | Closes automatically at departure |
| `Canceled` | No | Outcome recorded as **Declined**, **Withdrawn**, **Left** or **Removed** (§2.2) |

### 7.3 Joining window and cancellation **[APPROVED]**
- After departure or cancellation, the server blocks joining, requesting, rejoining, approving, reinstating and RSVP changes.
- Cancellation requires a reason. The ride stays visible on calendars. Active participants are notified.

### 7.4 Rescheduling **[APPROVED]**
- Allowed only to a **future** departure time. Never for Canceled or Completed rides.
- **A ride whose departure has passed can't be rescheduled back into Upcoming.**
  - **[OPEN — clarification]** The instruction says "original departure time." This revision applies it to the ride's **currently scheduled** departure. Under a literal reading, a ride already rescheduled once couldn't be rescheduled again once its first date had passed, even if its current date is still in the future. See Q23 and X27.
- Rescheduling doesn't change Weather Review status.
- Active participants are notified. Reconfirmation is tracked for Confirmed and Tentative participants and **resets on every reschedule**. The organizer sees reconfirmed, awaiting and declined.
- Seats are kept until riders respond.
- Declining the new time → **Withdrawn** (§2.2). A Confirmed rider's seat is freed.
- Link expiry follows §5.3.
- **[FUTURE]** Reconfirmation deadlines.

### 7.5 Completion **[APPROVED]**
- Only the organizer can mark a ride Completed, and only **after departure**. Nothing is completed automatically.
- Rides past departure that haven't been completed keep their stored status, show as "Awaiting Completion," and are excluded from discovery.
- **[FUTURE]** Organizer reminders.

---

## 8. Notifications

### 8.1 Channels
- **[APPROVED]** In-app, for the core release.
- **[FUTURE]** Push.
- **[FUTURE]** Email: transactional only (cancellation, reschedule, approval decisions, private invitations together with direct invitations).
- The design is extensible, with pluggable channels.

### 8.2 Core in-app events **[APPROVED]**
| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer |
| Join request submitted | Organizer |
| Request approved / declined | Requester |
| Pending request closed automatically at departure | Requester |
| Participant removed (with reason) | Removed rider |
| Rider reinstated | Reinstated rider (details depend on Q20) |
| Seat available (no reservation) | Tentative and Pending participants, plus the organizer when requests are pending |
| Weather Review / weather disruption notice | Active participants |
| Ride rescheduled (reconfirmation request) | Active participants |
| Reconfirmed / withdrew | Organizer |
| Ride canceled (with reason) | Active participants |

Active participants = the organizer, plus everyone Confirmed, Tentative or Pending. Former participants aren't notified of later events.

---

## 9. Weather-Based Ride Management

### 9.1 Core milestone **[APPROVED]**
- The weather policy is shown on ride detail, discovery results and calendar entries.
- Organizers can send disruption notices, use Weather Review (with a discovery badge), and cancel (with a reason) or reschedule.
- Participants are notified.
- **No automatic weather cancellation.**

### 9.2 Weather integration **[ENHANCEMENT — REQUIRES APPROVAL]**
- No provider is selected.
- Data source, rain threshold, coverage, check timing and notification behavior must all be approved first.
- Rides are never canceled based only on an uncertain forecast.

---

## 10. Technical direction **[TECH DIRECTION]**

Separate from product approval. **No code, schema, migration, dependency, infrastructure or configuration exists or is authorized.** Provider research hasn't started.

- **10.1 Database:** Supabase PostgreSQL is the proposed direction. Final architecture approval is separate. Nothing is assumed to exist.
- **10.2 Provider research (separate deliverable, not started):**
  - Compare Google Maps, Mapbox and OpenStreetMap-based options.
  - Criteria: current pricing, coverage, licensing, reliability, scalability and time-zone lookup.
  - Deliverable: one recommendation with cost implications. No selection until it is reviewed.
- **10.3 Atomic enforcement:** transactions or database functions make each check and its change one indivisible operation. This covers:
  - capacity
  - link use counts
  - **approval rechecks of both link allowance and capacity together**
  - capacity reduction
  - removal and reinstatement
  - the block on removed riders
  - the cooldown
  - automatically closing pending requests at departure
- **Required test scenarios:**
  - concurrent joins for the last seat
  - concurrent approvals competing for the last seat or the last link use
  - a join racing a capacity reduction
  - a join racing a removal
  - approval racing departure
  - a removed rider trying to rejoin through a valid link (approval on and off)
  - requests at the edge of the cooldown
  - duplicate rejoins
- **10.4 Tokens:**
  - Cryptographically secure, stored only as hashes.
  - The server enforces sign-in, the single active link, effective expiry (never revived), the use limit, and revocation.
  - Pending requests keep a reference to the link they came through, so approval can check its allowance.
- **10.5 Data model sketch [PROPOSED]** (discussion only):
  - **RideParticipant:** status, **outcome** (declined / withdrawn / left / removed), removal reason, removed-block and reinstatement markers, decline time (for the cooldown), **source link** for pending requests, request closure marker, reconfirmation status. Never deleted.
  - **RideInvitationLink:** token hash, configured expiry, expired marker (no revival), max uses, use count, revoked_at. One active link per ride.
  - **RideHistory**, **Notification** and **User preferences:** as in Revision 5.

---

## 11. Contradiction register

### 11.1 Resolved in Revision 6
| # | Topic | Resolved by |
|---|---|---|
| X8 | Seat races: fairness and priority | No priority. First valid join (no approval) or organizer choice (approval). Items 18–19. |
| X10 | "New invitation" vs shared links for removed riders | A shared link alone never readmits. Explicit reinstatement is required. Item 1. |
| X11 | Approval for removed riders on rides with approval off | Reinstatement instead. No general approval step. Items 1–2. |
| X12 | Pending request outlives the link vs private access | Limited request-status screen. Item 3. |
| X13 | Counting uses on approval vs the use limit | Atomic recheck. Not approved if either limit is reached. Items 4, 23. |
| X14 | Revocation vs pending requests | Revocation and expiry don't cancel submitted requests. Item 5. |
| X15 | Requests pending at departure | Close automatically, requester notified, no approval after departure. Item 6. |
| X17 | Rescheduling after departure | Not allowed. Item 8 (see X27 for wording). |
| X18 | Minimal history vs R-CAL-4 | Minimal personal history defined. Item 9. |
| X19 | Removing vs declining a pending request | Distinct outcomes with distinct ways back. Items 10–12. |
| X20 | Link limit vs capacity | Separate, independently configurable settings. Items 20, 22. (The awareness mechanism is Q17.) |
| X21 | Cooldown scope and measurement | Measured from the decline. Applies only to declined requests. Item 17. |
| X22 | Withdrawal after a reschedule on the calendar | "Withdrawn" label. Item 13. (Rejoin is Q13.) |
| X23 | Removed, then the ride was canceled | Outcome "Canceled," "Removed" kept in history. Item 14. |

### 11.2 Still open
| # | Issue | Decision |
|---|---|---|
| X16 | When departure moves later, can a non-expired link's effective expiry also move later (up to its unchanged configured expiry)? Item 7 confirms only that the configured expiry isn't extended. | Q6 |
| X24 | **What reinstatement does.** Lifting the block vs restoring the rider directly changes the capacity check, link-use counting, private access (the rider lost access when removed) and the timing limits. | Q20 |
| X25 | **Pending requests when a ride is canceled.** Item 6 covers departure only. Cancellation blocks approvals, so pending requests on a canceled ride are stuck with no defined outcome. | Q21 |
| X26 | **Closed-request outcome.** Requests closed automatically at departure aren't one of the four outcomes (Declined / Withdrawn / Left / Removed). Their label and history display are undefined. | Q22 |
| X27 | **"Original departure time" wording** in item 8 could block a second reschedule of a ride whose first date has passed. | Q23 |
| X28 | **Revoking a leaked link keeps strangers' pending requests.** This follows from item 5. The organizer must decline them one by one. It's an accepted consequence, but may warrant a bulk-decline action. | Q25 |
| X29 | **Public-ride history and the participant list.** "Normal historical ride details" could include other riders' names after the viewer has left. | Q24 |

### 11.3 Consistency check (items 1–30)
I checked invitation revocation, expiry, pending requests, approval, reinstatement, capacity and departure against each other. They're consistent apart from X16 and X24–X29:
- Pending requests survive revocation and expiry, but approval always rechecks the source link's allowance, capacity and the joining window together.
- Removed riders are blocked from links and requests, whatever the approval setting.
- No approval, reinstatement or removal happens after departure or cancellation.
- Link limits never stand in for capacity.

---

## 12. Remaining decisions

### 12.1 Resolution of Q1–Q19
| Q | Topic | Status |
|---|---|---|
| Q1 | Route back for removed riders | **Resolved**: explicit organizer reinstatement only (items 1, 12) |
| Q2 | Approval for removed riders on rides with approval off | **Resolved**: no general approval step, reinstatement instead (item 2) |
| Q3 | Approving at the use limit | **Resolved**: atomic recheck, not approved if reached (items 4, 23) |
| Q4 | Pending requests vs revocation and replacement | **Resolved**: not canceled automatically (item 5) |
| Q5 | Pending requests at departure | **Resolved**: close automatically, notify, no approval (item 6) |
| Q6 | Effective expiry after a later reschedule | **Open**: only configured-expiry extension was ruled out (item 7) |
| Q7 | Pending requester view | **Resolved**: title, date/time and status only (item 3) |
| Q8 | Minimal history fields | **Resolved** (item 9) |
| Q9 | Cooldown enforcement | **Resolved, provisional**: measured from the decline (item 17). The early-rejection message is still **[PROPOSED]** |
| Q10 | Cooldown scope | **Resolved**: declined requests only (item 17) |
| Q11 | Reschedule after departure | **Resolved**: not allowed (item 8). Wording: Q23 |
| Q12 | Removed, then canceled | **Resolved** (item 14) |
| Q13 | Withdrawn label and rejoin | **Partly resolved**: "Withdrawn" label (item 13). **Rejoin still open** |
| Q14 | Removal on canceled rides | **Resolved**: not permitted (item 15) |
| Q15 | Seat priority | **Resolved**: no priority (item 18) |
| Q16 | Decline vs remove | **Resolved**: distinct outcomes (items 10–12) |
| Q17 | Link limit vs capacity | **Partly resolved**: separate settings (items 20, 22). **How the organizer is made aware is still open** |
| Q18 | Numerical maximum capacity | **Open** (item 21) |
| Q19 | Public-ride history | **Resolved**: normal details, subject to privacy and access controls (item 16). Participant list: Q24 |

### 12.2 Open questions needing a decision
- **Q6** Can a non-expired link's effective expiry move later after a reschedule, up to its unchanged configured expiry? (X16)
- **Q13** Can a **Withdrawn** rider rejoin? If so, under the normal rules?
- **Q17** How is the organizer made aware when a link's remaining uses are fewer than the open seats?
- **Q18** Numerical maximum ride capacity.
- **Q20** What reinstatement does: lift the block, or restore directly? Is it only allowed before departure and on active rides? Does it use a link use? (X24)
- **Q21** What happens to pending requests when a ride is **canceled**: close automatically and notify, as at departure? (X25)
- **Q22** The label and history display for requests closed automatically. Is it a fifth outcome, such as "Request Closed"? (X26)
- **Q23** Does "original departure time" in item 8 mean the **current scheduled** departure? (X27)
- **Q24** Does public-ride history include the participant list for former participants? (X29)
- **Q25** Should organizers get a bulk-decline action for pending requests from a revoked link? (X28)
- **Q9a** Confirm the early-request rejection message showing when the rider can request again (currently **[PROPOSED]**).

### 12.3 Provisional values
- 24-hour cooldown.
- 50 default successful link uses.
- 30-day maximum configured expiry.

### 12.4 Separate tracks (not part of product approval)
- Provider research and recommendation (not started).
- Final architecture approval, including Supabase PostgreSQL.
- Push and email providers.
- The weather provider (only if §9.2 is approved).

---

## 13. Acceptance criteria (Core Ride Lobby milestone)

Values in *italics* are provisional. **†** = depends on an open question in §12.2.

**Calendar and history**
- [ ] The calendar shows This Week / Upcoming / Past lists, with weeks computed in the rider's time zone and locale. Ride-local time is primary, and the rider's local time is shown automatically when it differs.
- [ ] Organized, Confirmed, Tentative and Pending rides appear. Pending rides are labeled "Awaiting Approval" and show only the request-status fields on private rides.
- [ ] Past-departure rides never appear in This Week or Upcoming.
- [ ] Declined, Withdrawn, Left and Removed are recorded as distinct outcomes. Each is removed from This Week and Upcoming.
- [ ] After departure, Past Rides shows "Withdrawn," "Left" or "Removed." Declined requests don't appear. No record is deleted.
- [ ] If the ride is later canceled, the outcome shows "Canceled," and the rider's own outcome stays in their history.
- [ ] Former participants of private rides see only the ride title, date, their outcome and their own action history. The meeting point, destination, description and participant list are hidden.
- [ ] Public-ride history keeps normal details, subject to access controls (†participant list, Q24).
- [ ] Canceled rides stay visible with their reason. Rides past departure that haven't been completed show "Awaiting Completion."
- [ ] †Requests closed automatically are recorded and shown as decided in Q22.
- [ ] The calendar updates on every R-CAL-5 event without a manual refresh.

**Discovery**
- [ ] Discovery centers on device location (with permission) or the selected city, and matches on meeting point. The radius is 40 km by default, from 5 to 160 km, in km or miles.
- [ ] Results show the required fields, sorted by soonest departure then distance.
- [ ] Canceled, Completed, private and past-departure rides are excluded.
- [ ] Full rides are labeled and can't be joined, enforced by the server. Weather Review rides show a badge.

**Capacity, seats and membership**
- [ ] Available slots = capacity − (organizer + Confirmed). Default capacity is 10, minimum 2. †No maximum until Q18.
- [ ] The server refuses all joins and new requests on full rides. Existing Tentative and Pending entries are kept.
- [ ] On rides without approval, the first valid server-confirmed join gets an opened seat. Others see "Seat no longer available." Notifications reserve nothing. There's no priority and no automatic promotion.
- [ ] On rides with approval, the organizer chooses which eligible request to approve, subject to capacity and link limits.
- [ ] Capacity can't be lowered below occupied seats. No automatic removal.
- [ ] Organizers can remove Confirmed, Tentative or Pending participants only before departure and while the ride is Scheduled or in Weather Review. A reason is required, shown to the rider, who is notified. The event is kept in history.
- [ ] The server stops a removed rider from rejoining or requesting through any link or public ride, with approval on or off, until the organizer reinstates them. †What reinstatement does: Q20.
- [ ] Riders who left may rejoin under the normal rules. †Withdrawn riders: Q13.
- [ ] A declined rider may request again only after a *24-hour* cooldown, measured from the decline, before departure on a ride that isn't canceled. The cooldown doesn't apply to riders who left or were removed.
- [ ] The concurrency tests in §10.3 pass.

**Private rides and invitation links**
- [ ] Private rides are excluded from discovery. Sign-in is required. Only authorized riders see details. The server enforces this.
- [ ] Each ride has at most one active link. Organizers can revoke and replace it. Tokens are stored only as hashes, and the link can be copied when created.
- [ ] Configured expiry is 7 days by default, up to *30 days*. Effective expiry is whichever comes first: configured expiry or departure. An expired link is never accepted again. A later reschedule never extends the configured expiry (†effective expiry, Q6).
- [ ] The link-use limit is configurable independently of capacity, with a default of *50*, and never acts as the ride's capacity (†organizer awareness, Q17).
- [ ] Uses are counted only for successful joins and approvals. Opening a link, pending, declined, closed and failed requests use nothing.
- [ ] Revocation and expiry block new requests and joins, but don't cancel pending requests submitted while the link was valid.
- [ ] Approving a request atomically rechecks the source link's remaining allowance, ride capacity and the joining window. If any check fails, the request isn't approved.
- [ ] Pending requesters see only the ride title, date and time, and request status until approved.
- [ ] Unresolved requests close automatically at departure, the requester is notified, and they can't be approved afterwards (†cancellation case, Q21).

**Ride creation**
- [ ] Every required field is enforced. The time zone comes from the meeting point. Capacity defaults to 10, minimum 2. Approval is off by default.

**Status, rescheduling and completion**
- [ ] Ride and participant statuses are independent. All outcomes and events are kept in history.
- [ ] After departure or cancellation, the server blocks joining, requesting, approving, reinstating, removing and RSVP changes.
- [ ] Cancellation requires a reason, notifies active participants, and stays visible on calendars.
- [ ] Rescheduling is allowed only to a future time, never for Canceled or Completed rides, and never once departure has passed (†wording, Q23). It doesn't change Weather Review status.
- [ ] Rescheduling notifies active participants and resets reconfirmation for Confirmed and Tentative participants. The organizer sees reconfirmed, awaiting and declined. Declining the new time records Withdrawn and frees a Confirmed rider's seat.
- [ ] Only the organizer can complete a ride, and only after departure.

**Notifications**
- [ ] Every event in §8.2 creates an in-app notification for the correct recipients, including the removal reason and automatic request closure. No push or email.

**Weather**
- [ ] The weather policy is displayed. Manual notices, Weather Review, cancel and reschedule work.
- [ ] No weather provider and no automatic cancellation.

---

## Revision history
- **Revision 1:** Initial addendum.
- **Revision 2:** First-review decisions. Approval labels.
- **Revision 3:** Second-review decisions. Technical direction and conflicts register.
- **Revision 4:** Third-review decisions. C1–C8 resolved.
- **Revision 5:** N1–N11 and P1–P13 applied. X10–X23 logged.
- **Revision 6:**
  - Applied fifth-review items 1–30.
  - Added reinstatement-only return for removed riders, the pending-request status screen, pending requests surviving revocation and expiry, atomic approval rechecks, automatic closing at departure, and no rescheduling after departure.
  - Added the four distinct participation outcomes and minimal private history.
  - Seat allocation now has no priority.
  - Link limits are separate from capacity.
  - Removal is restricted to active rides before departure.
  - Q1–Q19 resolved where covered. X8 and 14 other contradictions resolved. New open items X24–X29 and Q20–Q25.
