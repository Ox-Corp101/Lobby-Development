# 0013. Authentication: PKCE email links, stored sessions and sign-out scope

- **Status:** Accepted (implemented; partly verified on real Supabase, see the decision source below)
- **Date:** 2026-11-18 (recorded; decided and built during Milestone 1, Step 4 and its follow-ups)
- **Decision source:** Product owner approvals during Milestone 1 Step 4: PKCE with Supabase's default email templates; sessions kept in local storage; device-only sign-out; global sign-out after a password reset; a tab-specific recovery marker. The product owner verified on real Supabase: registration, PKCE confirmation, automatic sign-in, sign-out and sign-in, recovery email delivery, PKCE reset, and signing in with the new password. Covered by unit tests and by browser tests against a fake Supabase. **Not yet verified on real Supabase:** real cross-device sign-out after a reset, and the "Email me a reset link" button (both M0.5 manual checks).

## Context
Supabase's Free plan can't customise email templates without custom SMTP, so Lobby must work with the default confirmation and reset emails.

## Decision
- **PKCE email links.** Confirmation and reset links bring a one-time code that is exchanged once, automatically, and **only works in the browser that started the request**. Old-style `#access_token` links are never accepted. The address bar is cleaned afterwards.
- A **token-hash link path** is kept ready for later custom email templates (a launch requirement: custom SMTP).
- **Sessions** are stored in the browser's local storage, so riders stay signed in.
- **Ordinary sign-out** signs out this device only.
- **After a successful password reset**, Lobby requests a **global sign-out** from Supabase. If that request fails, it signs out this device and tells the rider that other devices couldn't be confirmed.
  - Global sign-out revokes the account's refresh sessions, so other devices can't renew their sign-in.
  - Access tokens already issued stay valid until they expire (by default up to about an hour). Supabase can't cancel them early.
  - Real cross-device invalidation hasn't been verified yet. It's an M0.5 manual check.
- The **new-password form** appears only during a genuine recovery: a reset link opened in this tab within the last 60 minutes. Supabase's "Secure password change" setting is the server-side control.
- Messages never reveal whether an email address has an account.

## Alternatives considered
- Implicit-flow (`#access_token`) links: tokens appear in the address bar and history. Rejected.
- Custom templates now: needs paid or self-managed SMTP. Deferred to launch readiness.

## Consequences and trade-offs
- Email links only work in the same browser until custom templates exist. Riders are told this.
- Mobile apps will need deep links (Universal Links and App Links) on a real domain, and secure session storage (OD-24, OD-25).
- After a reset, another device can keep working until its current access token expires, but it can't renew its session.
- Some manual checks remain open for M0.5: the reset button on real Supabase, and whether other devices are really signed out after a reset.

## Related
[README: How email links work](../../README.md#how-email-links-work-pkce) · [ADR 0001](0001-shared-supabase-backend.md)

## Verification update: M0.5 manual tests (19 November 2026)

This section is added after acceptance. It records real-Supabase test results and **doesn't change the decision above**. The earlier "not yet verified" statements in this record describe the position before these tests and are kept as history.

**Set-up**
- The product owner tested on Windows, against the real Lobby Supabase project.
- **Chrome and Microsoft Edge on the same physical computer.** Separate physical devices were not tested.
- Supabase settings were inspected and not changed:
  - email provider on; secure email change on; secure password change on
  - minimum password length 8, with no required character types
  - Site URL `http://localhost:5173`; Redirect URLs `http://localhost:5173/**`
  - access-token lifetime 3,600 seconds
  - session time-box and inactivity timeout both 0 (never)
  - detection and revocation of compromised refresh tokens on, with a 10-second reuse interval
- Audit-log times are recorded **exactly as displayed** in the Supabase logs. Their time zone wasn't independently established.

| Check | Result |
|---|---|
| Signed-in "Email me a reset link": one click; Lobby showed the confirmation; the real reset email arrived | **PASS** |
| PKCE recovery link opened in the same Chrome browser that requested it: "Choose a new password" appeared | **PASS** |
| Same password submitted during recovery: "Your new password must be different from your current one." The log showed HTTP 422 at 16:19:42 | **PASS** |
| 72-byte password (36 × é, precomposed, byte count checked): accepted by Supabase as the new password; sign-in with it succeeded | **PASS** |
| 74-byte password (37 × é): blocked by Lobby's client-side validation and never submitted | **PASS** |
| A different 70-byte password (35 × é): rejected at sign-in because it wasn't the active password. This isn't evidence of any length rule. | **PASS** |
| Global sign-out: password update `PUT /auth/v1/user`, HTTP 200, at 16:22:35, then `POST /auth/v1/logout?scope=global`, HTTP 204, at 16:22:36 (both 19 November 2026). Edge, signed in beforehand, **stayed signed in at first**; after the 60-minute access-token window, reloading Edge showed Lobby's sign-in page. | **PASS, qualified:** refresh sessions were revoked, but the existing access token stayed usable until it expired. Signing out is not instant. |
| Original password restored through a second genuine recovery email; signing in with it worked and `/profile` loaded | **PASS** |
| Rejected registration | **SKIPPED: not tested.** Avoided creating accounts and using email quota. To be checked with the launch email provider (OD-28). |

**Still unverified:** how Supabase handles passwords longer than 72 bytes, since Lobby never sends them, and cross-device behaviour on separate physical devices.
