# LOBBY — Ride Discovery, Calendar & Weather Requirements

**Status:** Draft for review. Do not begin implementation until this plan is reviewed and approved.
**Type:** Addendum to the Lobby development plan.
**Milestone:** Core Ride Lobby, except where marked **Enhancement (requires approval)**.

> Note: the base Lobby development plan was not found in this repository when this addendum was written.
> This document is written to stand alone and should be merged into, or linked from, the base plan once that plan is in the repo.

---

## 1. Scope summary

| Area | Milestone |
|---|---|
| Personal Ride Calendar | Core Ride Lobby |
| Nearby Ride Search (list view) | Core Ride Lobby |
| Ride Creation | Core Ride Lobby |
| Ride & participant statuses | Core Ride Lobby |
| Manual weather management (policy display, organizer notices, cancel/reschedule) | Core Ride Lobby |
| Map-based discovery | Later; evaluate after the list view ships |
| External weather API integration | **Enhancement (requires approval)** |
| Automatic weather-based cancellation | **Enhancement (requires approval)** |

---

## 2. Personal Ride Calendar

### Requirements
- R-CAL-1: Calendar views for the user's scheduled rides.
- R-CAL-2: Sections: **This Week**, **Upcoming Rides**, **Past Rides**.
- R-CAL-3: Include rides the user **created**, is **confirmed** for, or has marked **tentative**.
- R-CAL-4: Each entry shows meeting location, destination, date, time, and the user's participation status.
- R-CAL-5: The calendar updates automatically when a rider joins, leaves, or changes RSVP status.
- R-CAL-6: Times are shown in the **ride's local time zone**.
- R-CAL-7: Past rides never appear as upcoming.

### Rules
- **Section placement** uses the ride's departure time, evaluated in the ride's time zone:
  - *This Week*: departure is between now and the end of the current week.
  - *Upcoming Rides*: departure is after the current week.
  - *Past Rides*: departure has already happened, or the ride status is `Completed`.
- A ride whose departure time has passed moves to *Past Rides* even if its status has not yet changed to `Completed`.
- **Canceled rides** stay visible, clearly labeled as canceled with the cancellation reason. They can never be joined (see §6).
- **Inclusion by participant status:**
  - Organizer: always included.
  - `Confirmed` and `Tentative`: included.
  - `Pending Approval`: *open question* (see §9). Proposed: show it, labeled "Awaiting approval."
  - `Canceled` (the user left the ride): removed from This Week and Upcoming. *Open question* whether it should appear in Past.

### Open decisions for review
- Week boundary: Monday–Sunday or Sunday–Saturday? Should it follow the user's locale?
- Calendar presentation: section lists only, or also a month grid?
- When the user's device time zone differs from the ride's, should the ride time also be shown in the user's own time zone?

---

## 3. Nearby Ride Search

### Requirements
- R-DISC-1: Default the search center to the rider's **selected city**, or their **device location** if they have granted permission.
- R-DISC-2: Match rides by their **meeting point**, not their destination.
- R-DISC-3: The user can adjust the **search radius**.
- R-DISC-4: Each result shows destination, meeting point, departure time, organizer, available slots, and ride conditions.
- R-DISC-5: Exclude `Canceled` and `Completed` rides from default results.
- R-DISC-6: **List view** first. Evaluate a map view later.

### Rules
- **Location fallback order:** device location (when permitted) → selected city → prompt the user to choose a city. No location is ever requested without user consent.
- Default results include only **public** rides with a future departure time.
- Private rides never appear in discovery.
- **Available slots** = capacity − confirmed participants (the organizer counts as one). *Open question:* should tentative and pending participants count against capacity?
- Rides in `Weather Review` still appear, with a clear weather-review badge.
- Proposed default sort: soonest departure first, with distance as the tie-breaker.

### Open decisions for review
- Default radius, minimum and maximum (proposed: default 25 mi / 40 km, range 5–100 mi), and the units shown (locale-based?).
- Whether full rides appear (marked "Full") or are hidden.
- Geocoding and places provider for meeting points and cities.

---

## 4. Ride Creation

### Required fields

| Field | Notes |
|---|---|
| Title | Required |
| Description | Required |
| Meeting point | Geocoded location. This is what discovery searches on. |
| Destination | Location |
| Date | In the ride's local time zone |
| Meeting time | Must be before or equal to the departure time |
| Departure time | Must be in the future when the ride is created |
| Participant capacity | Default **10, including the organizer**. Minimum 2. |
| Ride conditions | `Dry Only` or `Rain or Shine` |
| Visibility | `Public` or `Private` |
| Participant approval | Optional toggle, off by default |

### Rules
- The ride's **time zone** comes from the meeting point's location, not from the organizer's device.
- The organizer is automatically added as a `Confirmed` participant.
- With approval **on**, joining puts the rider in `Pending Approval` until the organizer approves or declines.
- With approval **off**, joining makes the rider `Confirmed` (or `Tentative`, if they choose that) right away.
- Private rides can be joined only through an invite or link. The exact mechanism is still to be decided (§9).

---

## 5. Weather-Based Ride Management

### Core milestone (manual)
- R-WX-1: Show the organizer's chosen weather policy (`Dry Only` / `Rain or Shine`) on ride detail, discovery results, and calendar entries.
- R-WX-2: The organizer can notify participants about a possible weather disruption. This can move the ride to `Weather Review`.
- R-WX-3: The organizer can **cancel** or **reschedule** a ride.
- R-WX-4: Cancellation requires a **reason**. The reason is stored and shown to affected participants.
- R-WX-5: All affected participants are notified on cancel, on reschedule, and on entering `Weather Review`.
- R-WX-6: **No ride is ever canceled automatically based only on an uncertain forecast.**

### Reschedule behavior (proposed, for review)
- Rescheduling changes the date and/or times. The ride keeps its identity and its participant list.
- Participants are notified and asked to reconfirm. *Open question:* should confirmed riders drop to `Tentative` until they reconfirm?

### Enhancement (requires approval): automated weather checks and auto-cancellation
This is a separate work item and is **not** part of the core milestone. The following must be defined and approved before any implementation:

1. **Weather data source**: provider, cost, licensing, rate limits.
2. **Rain threshold**: for example, precipitation probability and/or amount at the meeting point during the ride window.
3. **Geographic coverage**: which regions the provider supports reliably.
4. **Check timing**: when and how often forecasts are checked before departure (for example, 24 h, 12 h, 2 h).
5. **Notification behavior**: who is notified, through which channels, and when.

Even after approval, automation should first **suggest** `Weather Review` to the organizer rather than cancel rides itself, unless the approved design explicitly says otherwise.

---

## 6. Ride Statuses vs Participant Statuses

The two are stored and managed **separately**.

### Ride status
| Status | Meaning |
|---|---|
| `Scheduled` | Default after creation. Ride is active and joinable (if capacity remains). |
| `Weather Review` | Organizer has flagged a possible weather disruption. The ride is still active. |
| `Canceled` | Organizer canceled the ride. A reason is required. This is a final state. |
| `Completed` | The ride took place. This is a final state. |

Allowed transitions:
```
Scheduled       → Weather Review | Canceled | Completed
Weather Review  → Scheduled | Canceled | Completed
Canceled        → (final)
Completed       → (final)
```
*Open question:* is `Completed` set automatically once departure (or an expected end time) has passed, or marked by the organizer? Proposed: automatic, some time after departure.

### Participant (RSVP) status
| Status | Meaning |
|---|---|
| `Confirmed` | Attending |
| `Tentative` | Might attend |
| `Pending Approval` | Waiting for the organizer's approval (approval-required rides only) |
| `Canceled` | The participant withdrew, or was declined or removed |

### Cancellation invariants
- When a ride is `Canceled`:
  - No new joins and no RSVP changes are accepted. This is enforced on the server, not just hidden in the UI.
  - Every participant's calendar shows the ride as canceled, with its reason.
  - Every participant who was not already `Canceled` is notified.
- Participant statuses are **not** overwritten when a ride is canceled. Each participant's own RSVP history is kept, and the ride-level `Canceled` status takes precedence in the UI.

---

## 7. Notifications (core milestone)

| Event | Recipients |
|---|---|
| Rider joins / leaves / changes RSVP | Organizer (and the rider's own calendar updates) |
| Join request (approval on) | Organizer |
| Request approved / declined | The requesting rider |
| Ride enters `Weather Review` | All active participants |
| Ride rescheduled | All active participants |
| Ride canceled (with reason) | All active participants |

The delivery channels (in-app, push, email) still need to be confirmed against the base plan.

---

## 8. Proposed data model (for review)

The final schema will follow the base plan's stack.

- **Ride**: id, organizer_id, title, description, meeting_point (lat/lng, label), destination (lat/lng, label), time_zone, ride_date, meeting_time, departure_time, capacity (default 10), conditions (`dry_only` | `rain_or_shine`), visibility (`public` | `private`), requires_approval (bool), status (`scheduled` | `weather_review` | `canceled` | `completed`), canceled_reason, canceled_at, created_at, updated_at.
- **RideParticipant**: ride_id, user_id, status (`confirmed` | `tentative` | `pending_approval` | `canceled`), is_organizer, joined_at, updated_at.
- **RideStatusEvent** (audit log): ride_id, from_status, to_status, reason, actor_id, created_at. This keeps the history of cancellations and weather reviews.

Times are stored in UTC together with the ride's IANA time zone, and shown in that time zone. The meeting point needs a geospatial index so radius search is fast.

---

## 9. Open questions summary

1. Do `Pending Approval` and `Canceled` participant entries appear on the user's calendar, and in which section?
2. Week boundary for "This Week".
3. Default, minimum and maximum search radius, and the units shown.
4. Do tentative and pending riders count against capacity?
5. Do full rides appear in discovery?
6. How private rides are joined (invite link, direct invite, both).
7. Does rescheduling reset confirmed riders to tentative?
8. Is `Completed` set automatically or manually?
9. Notification channels.
10. Geocoding and places provider.

---

## 10. Acceptance criteria (core milestone)

- [ ] The calendar shows This Week / Upcoming / Past sections, with correct placement in the ride's time zone. A past ride never appears in Upcoming.
- [ ] The calendar updates on join, leave, RSVP change, cancel, and reschedule without a manual refresh.
- [ ] Discovery defaults to device location (with permission) or the selected city, searches by meeting point within an adjustable radius, and excludes canceled and completed rides.
- [ ] Discovery results show destination, meeting point, departure time, organizer, available slots, and conditions.
- [ ] Ride creation enforces every required field, defaults capacity to 10 including the organizer, and supports visibility and the optional approval setting.
- [ ] Ride status and participant status are stored and changed independently, following the transitions in §6.
- [ ] A canceled ride requires a reason, notifies participants, shows as canceled on calendars, and rejects joins on the server.
- [ ] No automated weather cancellation exists in the core milestone.
