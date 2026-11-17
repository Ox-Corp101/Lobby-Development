# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Revision 5. Fourth-review decisions are applied (N1–N11, P1–P13). Awaiting review. **Do not begin architecture implementation or development until this plan is explicitly approved.**
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked otherwise.
**Approval tracks:** (1) product requirements approval, (2) provider research and recommendation, and (3) final architecture approval are **separate**. Approving this document approves product requirements only.

> Note: the base Lobby development plan is not in this repository yet. This document stands alone and should be merged into, or linked from, the base plan once that plan is added.

### How to read this document

| Label | Meaning |
|---|---|
| **[APPROVED]** | Decided by the product owner. Approved for the Core Ride Lobby milestone once this plan is signed off. |
| **[PROVISIONAL]** | The behavior is approved, but the stated value or enforcement detail still needs final confirmation. |
| **[FUTURE]** | Approved direction, but not part of the core release. |
| **[ENHANCEMENT — REQUIRES APPROVAL]** | Separate work item. Needs explicit approval before any design or build work. |
| **[TECH DIRECTION]** | Approved architectural direction. Documented only. Final architecture approval is separate. |
| **[PROPOSED]** | Suggested by the plan author and **not yet approved** (see §12). |
| **[OPEN]** | An unresolved decision (see §12). |

---

## 1. Scope summary

| Area | Label |
|---|---|
| Personal Ride Calendar (section lists, automatic secondary local time) | **[APPROVED]** |
| Past Rides history labels: "Left," "Removed," "Canceled," "Awaiting Completion" | **[APPROVED]** |
| Month-grid calendar view | **[FUTURE]** |
| Nearby Ride Search (list, future departures, Weather Review badge, sort order) | **[APPROVED]** |
| Map-based discovery | **[FUTURE]** |
| Ride Creation (approval off by default, minimum capacity 2) | **[APPROVED]** |
| Configurable maximum ride capacity | **[OPEN]** (need approved; no number set, §4.7) |
| Capacity, full-ride, capacity-reduction rules | **[APPROVED]** |
| Organizer removal (Confirmed / Tentative / Pending; reason shown; not after departure) | **[APPROVED]** |
| Removed riders can't rejoin without the organizer | **[APPROVED]** |
| Re-requesting after a decline | **[APPROVED]** |
| 24-hour cooldown between requests | **[PROVISIONAL]** |
| Seat-available notifications (no reservation, no automatic promotion) | **[APPROVED]** |
| Automated waitlist | Out of scope for the initial release |
| Private rides via **one active** secure invitation link, sign-in required | **[APPROVED]** |
| Link defaults: 50 successful uses, 30-day maximum expiry | **[PROVISIONAL]** |
| Direct invitations, invitation emails | **[FUTURE]** |
| Rescheduling (reconfirmation tracking, decline = withdraw) | **[APPROVED]** |
| Reconfirmation deadlines | **[FUTURE]** |
| Manual completion, only after departure | **[APPROVED]** |
| Organizer reminders after departure | **[FUTURE]** |
| Manual weather management | **[APPROVED]** |
| In-app notifications | **[APPROVED]** |
| Push notifications, email notifications | **[FUTURE]** |
| Supabase PostgreSQL | **[TECH DIRECTION]** (proposed; final architecture approval is separate) |
| Concurrency-safe enforcement, hashed tokens | **[TECH DIRECTION]** |
| Geocoding / mapping / time-zone provider | Separate research deliverable. **Not started. Not selected.** |
| Push, email and weather providers | Deferred |
| External weather API, automatic weather cancellation | **[ENHANCEMENT — REQUIRES APPROVAL]** |

---

## 2. Personal Ride Calendar

### 2.1 Requirements **[APPROVED]**
- R-CAL-1: Section-based lists: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-2: Include rides the rider **organizes**, and rides where they are **Confirmed**, **Tentative** or **Pending Approval**.
- R-CAL-3: Pending Approval entries are labeled **"Awaiting Approval."**
- R-CAL-4: Entries for **active participation** show meeting location, destination, date, time, and participation status. History entries for rides the rider no longer belongs to follow §2.3.
- R-CAL-5: The calendar updates automatically on join, leave, removal, RSVP change, approval or decline, reschedule, cancellation, and completion.
- R-CAL-6: The **ride's local time** is primary. When the rider's time zone differs, the rider's local time is **shown automatically** as secondary information. (P1)
- R-CAL-7: Week boundaries are computed in the **rider's local time zone**, with the first day of the week following the rider's locale.
- R-CAL-8: Past rides never appear in This Week or Upcoming Rides.
- R-CAL-9: **Left:** the ride is removed from This Week and Upcoming. After departure, it appears in Past Rides labeled **"Left."**
- R-CAL-10: **Removed by the organizer:** the ride is removed from This Week and Upcoming. After departure, it appears in Past Rides labeled **"Removed."** (N2)
- R-CAL-11: **Declined requests** disappear from the active calendar. The record is kept on the backend.
- R-CAL-12: **Canceled rides** stay visible, labeled "Canceled," with the cancellation reason.
- R-CAL-13: **Left, then the ride was canceled:** the displayed outcome is **"Canceled."** "Left" stays in the rider's participation history. Neither event is erased. (N8)
- R-CAL-14: Rides past departure that haven't been completed appear in Past Rides labeled **"Awaiting Completion."**

### 2.2 Section placement **[APPROVED]**
- *This Week*: departure is in the future and within the current week (rider's time zone).
- *Upcoming Rides*: departure is in the future and after the current week.
- *Past Rides*: departure has passed, or the ride is `Completed`.

### 2.3 History entries for former participants **[APPROVED in principle]**
- On **private rides**, former participants (riders who left, were removed, or withdrew) keep **only the minimum historical information** needed for their own participation record. They don't keep access to the ride's details. (N9)
- **[OPEN]** The exact minimum field set. Suggested: ride title, date, the rider's own outcome label, and the removal reason when they were removed (N3). Not included: meeting point, destination, participant list, description. See §11, X18, and §12, item Q8.
- **[PROPOSED]** For **public** rides, history entries keep the normal fields (R-CAL-4), because the details are public anyway.
- **[PROPOSED]** **Removed, then the ride was canceled:** shown the same way as R-CAL-13. The outcome is "Canceled," and "Removed" stays in the history. See §12, item Q12.
- **[PROPOSED]** **Withdrew after a reschedule** (P8): shown as "Left" in Past Rides, with the history recording that they declined the new schedule. See §12, item Q13.

---

## 3. Nearby Ride Search **[APPROVED]**
- R-DISC-1: Default the search center to the **selected city**, or to **device location** if permitted. Order: device location → selected city → ask the rider to choose.
- R-DISC-2: Match rides by **meeting point**, not destination.
- R-DISC-3: Radius: **default 40 km, minimum 5 km, maximum 160 km**.
- R-DISC-4: **km or miles**, with the initial unit from the locale. Limits are fixed in km.
- R-DISC-5: Results show destination, meeting point, departure time, organizer, available slots, and conditions.
- R-DISC-6: Exclude `Canceled`, `Completed`, **private** rides, and rides **whose departure has passed**, whatever their stored status.
- R-DISC-7: Full rides stay visible, labeled **"Full,"** with joining disabled and refused by the server.
- R-DISC-8: Rides in `Weather Review` stay visible with a **Weather Review badge**. (P2)
- R-DISC-9: Default sort: **soonest departure first, then distance**. (P3)
- R-DISC-10: List view in the initial release. **[FUTURE]** Map view.

---

## 4. Participant Capacity & Membership

### 4.1 Seat rules **[APPROVED]**
| Participant | Consumes a seat? |
|---|---|
| Organizer | Yes (one seat) |
| Confirmed | Yes |
| Tentative | No |
| Pending Approval | No |
| Canceled (left, declined, removed, withdrew) | No |

- Occupied seats = organizer + Confirmed.
- Available slots = capacity − occupied seats.
- Full = available slots of 0.
- Capacity defaults to 10, with a minimum of 2, both including the organizer.

### 4.2 Enforcement **[APPROVED]**
- The server enforces capacity.
- Every seat-taking action re-checks capacity at the moment it is committed:
  - joining as Confirmed
  - Tentative → Confirmed
  - approval
  - rejoining
- Concurrent actions never exceed capacity.

### 4.3 Full rides **[APPROVED]**
- Nobody can join a full ride, including as Tentative, and nobody can submit a new request on one. The server enforces this.
- Existing Tentative and Pending entries are kept.
- **When a seat opens:**
  - Eligible riders (the ride's Tentative and Pending participants, plus the organizer when pending requests exist) are notified.
  - **The notification doesn't reserve a seat.**
  - No one is promoted automatically. Approval applies when enabled.
  - Losing the race shows **"Seat no longer available."**
- No automated waitlist.
- See X8 (§11) for the open confirmation on seat-race fairness.

### 4.4 Lowering capacity **[APPROVED]**
- Capacity can't be set below occupied seats, or below 2.
- The organizer must reduce the participant count first (§4.5).
- No rider is removed automatically.

### 4.5 Organizer removal **[APPROVED]** (N3, N4, P4)
- Organizers may remove **Confirmed, Tentative and Pending Approval** participants.
- A **reason is required**.
- The affected rider is **notified**, and the **reason is shown to them**.
- The removal event and reason are **kept in the ride history**.
- The participation record is **kept**, never deleted. Its status becomes `Canceled`, recorded as a removal.
- **Removal isn't allowed after departure.**
- Removing a Confirmed participant frees a seat and triggers §4.3.
- **[PROPOSED]** Removal isn't allowed on Canceled or Completed rides. (Already covered by P4 for any ride whose departure has passed. This only adds rides canceled before departure.) See §12, item Q14.

### 4.6 Rejoining and re-requesting

**Removed riders [APPROVED] (N1):**
- A removed rider **can't rejoin on their own**, either through a public ride or through an existing invitation link.
- Rejoining needs **explicit organizer approval**, or a **new invitation issued by the organizer**.
- The server enforces this.
- **[OPEN]** How "a new invitation issued by the organizer" works in the initial release. Links are shared and there's only one per ride, so a new link doesn't identify a particular rider. See X10 and §12, item Q1.
- **[PROPOSED]** How "explicit organizer approval" works, including on rides where approval is off: the removed rider's join attempt becomes a **Pending Approval request**, whatever the ride's approval setting. See X11 and §12, item Q2.

**Riders who left or withdrew [APPROVED]:**
- They may rejoin under the normal rules:
  - capacity
  - approval, if enabled
  - no duplicate active participation
  - joining blocked after departure
  - a valid link on private rides
- **Rejoining through a link counts as a use** (§5.3).

**Declined riders [APPROVED] (N5):**
- They may submit another request if the ride hasn't departed or been canceled, and capacity and approval rules allow it.
- **[PROVISIONAL]** **24-hour cooldown** between requests. Proposed enforcement, pending confirmation:
  - Measured from the time of the **most recent decline**.
  - The server rejects early requests with a message saying when the rider can request again.
  - No cooldown applies to the rider's first request.
- See X21 and §12, items Q9 and Q10.

### 4.7 Maximum ride capacity **[OPEN]** (N10)
No maximum number is set. The need for a **configurable maximum** is recorded, with these implications to resolve before a value is chosen:
- **Product:**
  - How easy it is for organizers to manage large groups.
  - Group-riding safety expectations.
  - How long participant lists and reconfirmation views get.
  - The risk of misuse (for example, mass events).
- **Database:**
  - How the seat count is stored and its limits.
  - **Lock contention** on a single ride while many riders compete for seats (§10.3).
  - How big the participant and history tables grow.
- **Performance:**
  - How many notifications go out at once on reschedule or cancellation, and on seat-available events with many Tentative riders.
  - Calendar and participant-list query cost.
  - Real-time update volume.
- **Link interaction:** the invitation link's use limit **must not silently impose a lower capacity**. See X20.

---

## 5. Private Ride Access

### 5.1 Requirements
- **[APPROVED]** Initial release: secure invitation links, shared by the organizer.
- **[FUTURE]** Direct invitations and invitation emails.

### 5.2 Security rules **[APPROVED]**
- Private rides never appear in discovery.
- **Sign-in is required** before a link reveals any ride details or allows joining. (P5)
- Only authorized riders can see details or join.
- Everything is enforced on the server.

### 5.3 Link lifecycle **[APPROVED]**
- **Only one active link per ride** in the initial release. Organizers can revoke it and create a replacement. (P6)
- Links are never permanently valid by default.
- Configured expiry: **7 days** by default, and configurable. Maximum configurable expiry: **30 days** **[PROVISIONAL]**.
- **Effective expiry = whichever comes first: the configured expiry or the ride's departure time.**
- Maximum uses is configurable. The default is **50 successful uses** **[PROVISIONAL]**.
- **What counts as a use:** a successful join.
  - Opening a link, or an unsuccessful attempt, isn't a use.
  - Rejoining is a use.
  - **On approval-based rides, a use is counted only when the organizer approves the request** and the rider becomes a participant. A declined request uses nothing. (N6)
- Revoking a link doesn't remove participants who already joined.
- The server rejects expired, revoked and used-up links.

### 5.4 Pending requests and link expiry **[APPROVED]** (N6)
- A request submitted while the link was valid **may stay pending for organizer review**, even if the link expires afterwards.
- Expiry **prevents new requests**. It doesn't silently invalidate requests already submitted.
- **[OPEN]** Whether the same applies when a link is **revoked**, or **replaced** (replacing revokes the old link under P6). See X14 and §12, item Q4.
- **[OPEN]** Whether a pending request can be approved once the link has reached its **use limit**. See X13 and §12, item Q3.
- **[OPEN]** What happens to requests still pending at **departure**, given that joining is blocked after departure. See X15 and §12, item Q5.

### 5.5 Rescheduling and link expiry **[APPROVED]** (N7)
- An expired link **never becomes valid again**.
- If departure moves **earlier**, the effective expiry is shortened as needed.
- If departure moves **later**, the existing link's **configured** expiry isn't extended automatically. The organizer can create a replacement link.
- **[OPEN — clarification]** If departure moves later and the link **hasn't expired yet**, can its effective expiry move later, up to its unchanged configured expiry? Or is the effective expiry frozen at the earlier departure time? See X16 and §12, item Q6.

### 5.6 Access after membership or link ends **[APPROVED]** (N9)
- **Active participants** keep access through their membership.
- People who only opened a link, **pending requesters**, and **former participants** don't keep access to private ride details once their access ends. Former participants keep only the minimum history (§2.3).
- **[OPEN]** When a **pending requester's** access "ends," given that their request can outlive the link (§5.4). See X12 and §12, item Q7.

### 5.7 Link retrieval **[APPROVED]**
- Only token hashes are stored.
- The organizer can copy the link when it is created. Lobby can't show it again.
- A lost link is replaced, and the replacement revokes the old one under P6.

---

## 6. Ride Creation **[APPROVED]**

| Field | Notes |
|---|---|
| Title, Description | Required |
| Meeting point | Geocoded. Discovery searches on it, and it sets the ride's time zone. |
| Destination | Location |
| Date | Ride's local time zone |
| Meeting time | At or before the departure time |
| Departure time | Must be in the future when created |
| Participant capacity | Default 10, minimum 2, both including the organizer. Maximum: **[OPEN]** (§4.7) |
| Ride conditions | `Dry Only` / `Rain or Shine` |
| Visibility | `Public` / `Private` |
| Participant approval | Optional, **off by default** (P7) |

- The organizer is added automatically and takes one seat.
- With approval on, joining creates a `Pending Approval` request.
- With approval off, joining makes the rider `Confirmed` (if a seat is free) or `Tentative`. Neither is possible on a full ride.
- Removed riders always go through approval (§4.6, proposed mechanism).

---

## 7. Statuses, Rescheduling & Completion

### 7.1 Ride status **[APPROVED]**
| Status | Meaning |
|---|---|
| `Scheduled` | Active. Stays `Scheduled` after departure until the organizer marks it completed. |
| `Weather Review` | Possible weather disruption flagged by the organizer. Active. |
| `Canceled` | A reason is required. Final. |
| `Completed` | Set by the organizer, only after departure. Final. |

```
Scheduled       → Weather Review | Canceled | Completed (after departure only)
Weather Review  → Scheduled | Canceled | Completed (after departure only)
Canceled        → (final)
Completed       → (final)
```

### 7.2 Participant status **[APPROVED]**
| Status | Meaning | Takes a seat |
|---|---|---|
| `Confirmed` | Attending | Yes |
| `Tentative` | Might attend | No |
| `Pending Approval` | Awaiting the organizer's decision | No |
| `Canceled` | Ended. The end reason is recorded: left / declined / removed / withdrew after reschedule | No |

Ride status and participant status are stored separately. The end reason and every related event (with actor, time and reason) are kept in the ride history.

### 7.3 Joining window and cancellation **[APPROVED]**
- The server blocks joining, requesting and rejoining after departure.
- Cancellation requires a reason. Afterwards the server rejects joins, requests and RSVP changes, and links are rejected.
- The ride stays visible on calendars with its reason. Active participants are notified.

### 7.4 Rescheduling **[APPROVED]**
- Allowed **only to a future departure time**, and **never** for Canceled or Completed rides. (P11)
- Rescheduling **doesn't change Weather Review status** automatically. (P12)
- All active participants are notified and asked to reconfirm.
- **Reconfirmation is tracked for Confirmed and Tentative participants**. Pending requests are notified only. (P9)
- **Reconfirmation resets** to "Awaiting reconfirmation" on every reschedule. (P10)
- The organizer sees each tracked participant as **Reconfirmed**, **Awaiting reconfirmation**, or **Declined the new schedule**.
- Confirmed reservations stay in place until the participant explicitly changes their RSVP. Riders are never removed automatically.
- **A rider who declines the new schedule withdraws from the ride.** Their status becomes `Canceled` (withdrew), and a Confirmed rider's seat is freed, which triggers §4.3. (P8)
- Invitation link expiry follows §5.5.
- **[OPEN]** Can a ride be rescheduled **after its original departure has passed** (an "Awaiting Completion" ride) to a new future time? P11 allows any future time and doesn't rule this out. See X17 and §12, item Q11.
- **[FUTURE]** Reconfirmation deadlines.

### 7.5 Completion **[APPROVED]**
- Only the organizer can mark a ride `Completed`, and **only after its departure time**. (P13)
- Nothing is completed automatically.
- Rides past departure that haven't been completed keep their stored status, show as "Awaiting Completion" in Past Rides, and are excluded from discovery.
- **[FUTURE]** Organizer reminders after departure.

---

## 8. Notifications

### 8.1 Channels
1. **[APPROVED]** In-app: the core release.
2. **[FUTURE]** Push.
3. **[FUTURE]** Email: transactional only (cancellation, reschedule, approval decisions, private invitations together with direct invitations).

The design is extensible: events are produced once and sent through pluggable channels.

### 8.2 Core in-app events **[APPROVED]**
| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer |
| Join request submitted (including re-requests and requests from removed riders) | Organizer |
| Request approved / declined | Requesting rider |
| Participant removed (**with reason**) | Removed rider |
| Seat available (no reservation) | Tentative and Pending participants, plus the organizer when requests are pending |
| Weather Review / weather disruption notice | Active participants |
| Ride rescheduled (reconfirmation request) | Active participants |
| Reconfirmed / declined new schedule (withdrew) | Organizer |
| Ride canceled (with reason) | Active participants |

Active participants = the organizer, plus everyone who is Confirmed, Tentative or Pending. Former participants aren't notified of later events on the ride.

---

## 9. Weather-Based Ride Management

### 9.1 Core milestone **[APPROVED]**
- The weather policy is shown on ride detail, discovery results and calendar entries.
- Organizers can send disruption notices, use Weather Review (with a badge in discovery), and cancel (with a reason) or reschedule.
- Participants are notified.
- **No automatic weather cancellation.**

### 9.2 Weather integration **[ENHANCEMENT — REQUIRES APPROVAL]**
- No provider is selected.
- Before any work, the following must be approved:
  - data source
  - rain threshold
  - coverage
  - check timing
  - notification behavior
- Rides are never canceled based only on an uncertain forecast.

---

## 10. Technical direction **[TECH DIRECTION]**

Separate from product approval. **No code, schema, migration, dependency, infrastructure or configuration exists or is authorized.** Provider research hasn't started.

### 10.1 Database
- **Supabase PostgreSQL** is the proposed direction. Final architecture approval is separate.
- No project or configuration is assumed to exist.

### 10.2 Geocoding, mapping and time-zone provider (separate deliverable, not started)
- **Compare:** Google Maps, Mapbox, and suitable OpenStreetMap-based options.
- **Criteria:** current pricing, coverage, licensing (storage and caching terms), reliability, scalability, and coordinates-to-time-zone lookup.
- **Deliverable:** one recommendation with cost implications, for review. No selection until it is reviewed.

### 10.3 Concurrency-safe enforcement
- PostgreSQL transactions or database functions make each check and its change one indivisible operation. This covers:
  - capacity
  - link use counts (incremented on a successful join, or on approval)
  - the capacity-reduction check
  - removals
  - blocks on removed riders rejoining
  - the request cooldown
- **Required test scenarios:**
  - concurrent joins for the last seat
  - concurrent approvals
  - a join racing a capacity reduction
  - a join racing a removal
  - several seat-available riders confirming at once
  - approvals racing toward the link's use limit
  - duplicate rejoin attempts
  - a removed rider attempting to rejoin
  - requests at the edge of the cooldown

### 10.4 Invitation tokens
- Tokens are cryptographically secure. Only hashes are stored.
- The server enforces effective expiry (never revived), the use limit, revocation, sign-in, and the single-active-link rule.

### 10.5 Data model sketch **[PROPOSED]** (discussion only, not an approved schema)
- **Ride**: as in Revision 4, plus an optional per-ride maximum capacity, pending §4.7.
- **RideParticipant**: status, **end reason** (left / declined / removed / withdrew), removal reason, a flag requiring approval for a rejoin (for removed riders), reconfirmation status, last decline time (for the cooldown). At most one active participation per rider per ride. Never deleted.
- **RideHistory**: every status, membership, removal, decision and reschedule event.
- **RideInvitationLink**: token hash, configured expiry, an **expired-at marker** (so a link can never be revived), max uses, use count, revoked_at. At most one active link per ride.
- **Notification**, **User preferences**: as in Revision 4.

---

## 11. Contradictions and edge cases

### 11.1 Revision 4 items: exact text and current status

**X2 (Revision 4, verbatim):**
> **Removal and calendar labels.** Only "Left" is defined for Past Rides. — *Why it matters:* Removed riders could wrongly see "Left". — *Suggested handling:* Define how a removed ride appears (item N2).

*Implications:* without a distinct label, a rider removed by the organizer would see "Left," which suggests they withdrew themselves. That misrepresents what happened, affects trust and dispute handling, and makes the rider's history inaccurate.
*Status:* **Resolved** by N2 (the "Removed" label) and N3 (the reason is shown). One related sub-case remains open: removed, then the ride was canceled (Q12).

**X8 (Revision 4, verbatim):**
> **Seat-available races.** Seat-available notifications, re-requests and rejoins can all compete for the same seat. — *Why it matters:* The "Seat no longer available" path will be common. — *Suggested handling:* Covered by §4.3 and the §10.3 tests. No product change needed.

*Implications:*
1. **Fairness:** riders who have been Tentative or Pending longest get no priority over new riders from discovery, riders rejoining, or declined riders whose cooldown has ended. Whoever acts first gets the seat.
2. **User experience:** several riders are notified for a single seat, so most of them will see "Seat no longer available." That repeated disappointment can lead to notification fatigue.
3. **Approval rides:** on rides with approval on, the organizer decides who gets the seat, so the race only affects non-approval rides and the organizer's own approvals.
4. **Engineering:** correctness depends on the concurrency tests in §10.3.

*Status:* **Not resolved.** The behavior is consistent with the approved C2 (first-come, no reservation), but you haven't explicitly confirmed that **no priority** is given to existing Tentative or Pending riders. See §12, item Q15.

**Other Revision 4 items:**

| # | Status |
|---|---|
| X1 (removal vs rejoin) | **Resolved** by N1. Creates X10 and X11. |
| X3 (counting uses on approval rides) | **Resolved** by N6. Creates X13, X14 and X15. |
| X4 (reschedule vs expiry) | **Resolved** by N7. Clarification X16 remains. |
| X5 (private access after a link ends) | **Resolved in principle** by N9. Creates X12 and X18. |
| X6 (link limit vs capacity) | **Partly resolved** by N10 (a link must not silently cap capacity). Mechanism open: X20. |
| X7 (repeat requests) | **Resolved provisionally** by N5 (24-hour cooldown). Enforcement detail: X21. |
| X9 (week boundary vs displayed time) | **Resolved**: accepted under C8, and automatic secondary time approved (P1). |

### 11.2 New contradictions and edge cases from Revision 5 decisions

| # | Issue | Suggested handling | Decision |
|---|---|---|---|
| X10 | **"New invitation" for removed riders vs shared, single links (P6).** Links aren't personal, so a new link can't tell a removed rider from anyone else. Replacing the link (for example after losing it) would accidentally let removed riders back in, or would need a per-rider exception. Direct invitations, which would be personal, are a future feature. | In the initial release, the **only** route back for a removed rider is **organizer approval**. The "new invitation" route waits for direct invitations. | Q1 |
| X11 | **Organizer approval for removed riders on rides with approval off.** No approval step exists on those rides. | The removed rider's join attempt becomes a Pending request for that rider only. | Q2 |
| X12 | **A pending request outlives the link (N6), but pending requesters lose access when their access ends (N9).** It isn't defined when that happens, or what they can see while waiting. | The pending requester sees only their request status and the minimum fields until a decision. Full details only after approval. | Q7 |
| X13 | **Counting a use at approval vs the use limit.** Pending requests submitted while the link was valid may outnumber the remaining uses. Approving them would go over the limit. | Option A: approvals are refused once the limit is reached. Option B: requests submitted in time are honored even past the limit. | Q3 |
| X14 | **Revocation vs pending requests.** N6 covers expiry only. Under P6, replacing a link revokes the old one, so a routine replacement could wipe out pending requests if revocation cancels them. | Treat revocation like expiry for pending requests. The organizer can still decline them individually. | Q4 |
| X15 | **Requests still pending at departure.** Joining is blocked after departure, so they can never be approved. | They close automatically at departure as "Not approved before departure." The record is kept, and they're not shown as declined. | Q5 |
| X16 | **N7 is ambiguous when departure moves later.** The configured expiry isn't extended, but the effective expiry (whichever is first: configured expiry or departure) could still move later, up to the configured expiry. | Allow this only for links that haven't expired yet. A link that has expired stays expired. | Q6 |
| X17 | **Rescheduling after departure.** P11 allows any future time, so an "Awaiting Completion" ride could be rescheduled back into Upcoming, which reopens joining. Its links stay expired (N7). | Allow it, and treat it as a normal reschedule. Or forbid rescheduling once departure has passed. | Q11 |
| X18 | **Minimum history vs R-CAL-4.** R-CAL-4 lists meeting location and destination for every entry. N9 limits former participants on private rides to minimum information. | R-CAL-4 is now limited to active participation (done in this revision). The minimum field set still needs approval. | Q8 |
| X19 | **Removing vs declining a pending request.** Both end a pending request. A decline allows a re-request after the cooldown. A removal requires organizer approval to come back. | Document that the organizer chooses: decline (can request again) or remove (blocked from coming back on their own). | Q16 |
| X20 | **Link use limit vs capacity (N10).** A default of 50 uses, plus rejoins counting, could cap joins below a large ride's capacity. | The default use limit is never lower than capacity, and organizers are warned if they set a limit below the remaining seats. | Q17 |
| X21 | **Cooldown scope and measurement.** The cooldown could be measured from the decline or from the request. It's unclear whether it applies to removed riders' requests, or to rejoins after withdrawing. | Measure from the most recent decline. Apply it to declined requests only. Removed riders are always routed through approval. | Q9, Q10 |
| X22 | **Withdrawal after a reschedule (P8) on the calendar.** No label is defined. | Show "Left" in Past Rides. The history records "declined new schedule." The rider may rejoin under normal rules. | Q13 |
| X23 | **Removed, then the ride was canceled.** N8 covers only "Left." | Same as N8: the outcome is "Canceled," and "Removed" stays in the history. | Q12 |

---

## 12. Remaining decisions

### 12.1 Product decisions needing input
- **Q1** Removed riders: is organizer approval the only route back in the initial release, with "new invitation" deferred to direct invitations? (X10)
- **Q2** On rides with approval off, does a removed rider's join attempt become a Pending request? (X11)
- **Q3** Can a pending request be approved once the link has reached its use limit? (X13)
- **Q4** Do pending requests survive link **revocation** and **replacement**, as they survive expiry? (X14)
- **Q5** How are requests still pending at departure handled? (X15)
- **Q6** Can a non-expired link's effective expiry move later after a reschedule, up to its configured expiry? (X16)
- **Q7** What can a pending requester see on a private ride while waiting, especially after the link has expired? (X12)
- **Q8** The minimum history field set for former participants on private rides. (X18)
- **Q9** Confirm the cooldown enforcement: measured from the most recent decline, server rejects early requests with a retry time, none before the first request. (X21)
- **Q10** Does the cooldown apply to removed riders' requests, or to rejoins after withdrawing? (X21)
- **Q11** Can a ride be rescheduled after its original departure has passed? (X17)
- **Q12** Removed, then canceled: is the outcome "Canceled," with "Removed" kept in history? (X23)
- **Q13** Withdrawal after a reschedule: shown as "Left," and may the rider rejoin? (X22)
- **Q14** Is removal blocked on rides canceled before departure? (§4.5)
- **Q15** Seat races: confirm there's **no priority** for existing Tentative and Pending riders. (X8)
- **Q16** Confirm that organizers choose between decline (can request again) and remove (blocked from coming back on their own) for pending requests. (X19)
- **Q17** How the link use limit relates to capacity: the default is never lower than capacity, plus a warning. (X20)
- **Q18** A numerical maximum ride capacity (§4.7).
- **Q19** Public-ride history entries keep their normal fields. (§2.3)

### 12.2 Provisional values (not finally approved)
- **24-hour** cooldown between requests (N5).
- **50** default successful uses per link (N11).
- **30-day** maximum configured link expiry (N11).

### 12.3 Unresolved technical decisions (separate tracks)
- The provider research and recommendation (geocoding, mapping, time zone). Not started.
- Final architecture approval, including Supabase PostgreSQL.
- Push and email providers, when those channels are scheduled.
- The weather provider, only if §9.2 is approved.

### 12.4 Resolved decisions
- **Revisions 2 to 4:** see the earlier revisions (calendar basics, discovery basics, seat rules, private links, rescheduling and completion, C1–C8, "Left" label, organizer removal, link use and expiry basics).
- **Revision 5:**
  - **N1** Removed riders can't rejoin without the organizer.
  - **N2** "Removed" label.
  - **N3** The reason is shown to the removed rider and kept in history.
  - **N4** Confirmed, Tentative and Pending participants can be removed, with a reason, not after departure.
  - **N5** Re-requests are allowed, with a provisional 24-hour cooldown.
  - **N6** On approval rides, a use is counted on approval. Pending requests survive link expiry.
  - **N7** An expired link is never revived. Effective expiry is shortened when departure moves earlier. Configured expiry isn't extended when departure moves later.
  - **N8** Left, then canceled: the outcome is "Canceled," and "Left" is kept.
  - **N9** Pending requesters and former participants lose private details. Only minimum history is kept.
  - **N10** No numerical maximum yet. The need and its implications are documented. The link limit must not cap capacity.
  - **N11** The 50-use and 30-day values stay provisional.
  - **P1–P13** all decided (§2–§7).
  - Contradictions **X1, X2, X3, X4, X9** resolved. **X5** resolved in principle. **X6** and **X7** partly or provisionally resolved.

---

## 13. Acceptance criteria (Core Ride Lobby milestone)

Values in *italics* are provisional. Criteria marked † depend on an open decision in §12.1.

**Calendar**
- [ ] The calendar shows This Week / Upcoming Rides / Past Rides lists. Weeks are computed in the rider's time zone, with the first day from the locale.
- [ ] Rides the rider organizes, or is Confirmed, Tentative or Pending on, appear. Pending rides are labeled "Awaiting Approval."
- [ ] Ride-local time is primary. The rider's local time is shown automatically when it differs.
- [ ] A ride whose departure has passed never appears in This Week or Upcoming.
- [ ] Left rides appear in Past Rides as "Left" after departure. Removed rides appear as "Removed." Declined requests disappear from the active calendar. All records are kept.
- [ ] Canceled rides stay visible with their reason. Left, then canceled, shows "Canceled," with "Left" kept in history.
- [ ] Rides past departure that haven't been completed appear as "Awaiting Completion."
- [ ] †Former participants of private rides see only the approved minimum history fields (Q8).
- [ ] The calendar updates on every R-CAL-5 event without a manual refresh.

**Discovery**
- [ ] Discovery centers on device location (with permission) or the selected city, and matches on meeting point.
- [ ] Radius is 40 km by default, from 5 to 160 km, in km or miles (starting unit from the locale).
- [ ] Results show destination, meeting point, departure, organizer, available slots and conditions.
- [ ] Results are sorted by soonest departure, then distance.
- [ ] Canceled, Completed, private and past-departure rides never appear.
- [ ] Full rides show "Full," with joining disabled and refused by the server. Weather Review rides show a badge.

**Capacity and membership**
- [ ] Available slots = capacity − (organizer + Confirmed). Default capacity is 10, minimum 2.
- [ ] The server refuses every join and new request on a full ride. Existing Tentative and Pending entries are kept.
- [ ] Seat-available notifications reserve nothing and promote no one. Losing a race shows "Seat no longer available."
- [ ] Capacity can't be lowered below occupied seats. No automatic removal.
- [ ] Organizers can remove Confirmed, Tentative or Pending participants before departure only. A reason is required and shown to the rider, who is notified. The event is kept in history and no record is deleted.
- [ ] The server stops a removed rider from rejoining through a public ride or an existing link without explicit organizer approval (†the route back depends on Q1/Q2).
- [ ] A declined rider can request again before departure on a ride that isn't canceled, subject to a *24-hour* cooldown (†enforcement details Q9/Q10).
- [ ] Concurrency tests (§10.3) show no overbooking, no use-limit overrun, and no bypass of the block on removed riders.

**Private rides and invitation links**
- [ ] Private rides never appear in discovery. Sign-in is required before a link shows details or allows joining. The server enforces this.
- [ ] Each ride has at most one active link. Organizers can revoke it and create a replacement. Tokens are stored only as hashes, and the link can be copied when created.
- [ ] Configured expiry is 7 days by default, up to *30 days*. Effective expiry is whichever comes first: configured expiry or departure. An expired link is never accepted again, even after a reschedule.
- [ ] Rescheduling to an earlier departure shortens the effective expiry. Rescheduling later never extends the configured expiry (†effective-expiry behavior depends on Q6).
- [ ] Default maximum uses is *50*. A use is a successful join (on approval rides, an approval). Opening a link, failed attempts and declined requests use nothing. Rejoins count.
- [ ] Requests submitted while the link was valid stay pending after it expires. New requests through an expired link are refused (†revocation and replacement Q4, use limit Q3, departure Q5).
- [ ] Active participants keep access. People who only opened the link, and former participants, lose access to private details (†pending requester view Q7).
- [ ] †The link use limit never silently caps joins below capacity (Q17).

**Ride creation**
- [ ] Every required field is enforced. The time zone comes from the meeting point. Capacity defaults to 10, minimum 2. Approval is off by default. Visibility is supported.

**Status, rescheduling and completion**
- [ ] Ride and participant statuses are independent. End reasons (left, declined, removed, withdrew) and all events are kept in the history.
- [ ] The server blocks joining, requesting and rejoining after departure, and after cancellation.
- [ ] Cancellation requires a reason, notifies active participants, and stays visible on calendars.
- [ ] Rescheduling is allowed only to a future time, never for Canceled or Completed rides (†after original departure Q11), and doesn't change Weather Review status.
- [ ] Rescheduling notifies active participants and resets reconfirmation for Confirmed and Tentative participants. The organizer sees reconfirmed, awaiting and declined. Seats are kept until riders respond.
- [ ] A rider who declines the new schedule is withdrawn (Canceled), and a Confirmed rider's seat is freed.
- [ ] Only the organizer can mark a ride Completed, and only after departure. Nothing is completed automatically.

**Notifications**
- [ ] Every event in §8.2 creates an in-app notification for the correct recipients, including the removal reason. No push or email in the initial release.

**Weather**
- [ ] The weather policy is shown on ride detail, discovery results and calendar entries. Organizers can send disruption notices, use Weather Review, and cancel or reschedule.
- [ ] No weather provider and no automatic cancellation.

---

## Revision history
- **Revision 1:** Initial addendum.
- **Revision 2:** First-review decisions. Approval labels.
- **Revision 3:** Second-review decisions. Technical direction and conflicts register.
- **Revision 4:** Third-review decisions. C1–C8 resolved. X1–X9 and N1–N11 logged.
- **Revision 5:**
  - Applied N1–N11 and P1–P13.
  - Showed X2 and X8 verbatim, with their implications. X8 stays open.
  - Added removal, rejoin-block, cooldown, approval-based link-use, pending-request-survival, no-revival and one-active-link rules.
  - Documented maximum-capacity implications.
  - Logged new contradictions X10–X23 and decisions Q1–Q19.
  - Kept provisional values and the separate approval tracks.
