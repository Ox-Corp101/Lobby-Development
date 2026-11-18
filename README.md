# Lobby

Lobby is a web-first, mobile-responsive app for the motorcycle riding community: plan group rides, find nearby rides and keep a personal ride calendar.

**Status:** Milestone 1 (Secure Authentication and Rider Profile Creation) is in progress. Steps 1–4 are done: project setup, visual shell, authentication screens, and Supabase authentication. Rider profiles are not built yet.

Planning documents live in [`docs/plan/`](docs/plan/).

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for development and builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) for authentication (and, in later steps, PostgreSQL)

## Prerequisites

- **Node.js 22 or later** (includes npm). Check with `node -v`.
  - On macOS, install it from [nodejs.org](https://nodejs.org/) or with Homebrew: `brew install node@22`.

## Getting started

```bash
npm install
```

Set up Supabase as described in [Supabase setup](#supabase-setup) before starting the app. Without it, the app shows a "Supabase isn't configured" screen.

```bash
npm run dev
```

Then open <http://localhost:5173>. The dev server always uses port 5173. If that port is busy, it stops with an error instead of moving to another port.

## Scripts

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Starts the development server with live reload on port 5173. |
| `npm run build`     | Type-checks, then builds the production site into `dist/`.   |
| `npm run preview`   | Serves the production build locally on port 4173.            |
| `npm run typecheck` | Runs the TypeScript compiler without producing output.       |
| `npm run lint`      | Checks code quality with ESLint.                             |
| `npm run format`    | Formats the code with Prettier.                              |

## Supabase setup

Lobby's frontend uses only two values from your Supabase project. Both are public by design:

| Variable                        | Where to find it                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase dashboard → Project Settings → API (Data API) → Project URL                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API Keys → publishable key (`sb_publishable_…`) |

1. Copy the template:

   ```bash
   cp .env.example .env.local
   ```

2. Paste the two values into `.env.local` after the `=` signs.
3. Check that Git ignores the file. This should print a `.gitignore` rule:

   ```bash
   git check-ignore -v .env.local
   ```

4. Restart `npm run dev`. Vite only reads `.env.local` when it starts.

The publishable key does not protect any data by itself. Data access is controlled by Row Level Security policies in the database, which are added in later steps.

### Required Supabase dashboard settings

- **Authentication → Sign In / Providers → Email:** email provider enabled, **Confirm email** on, **Secure password change** on, minimum password length 8, no required characters.
  - **Secure password change:** Supabase requires re-authentication before changing the password of a session created more than 24 hours ago. Recovery-link sessions are always new, so password resets are unaffected. Sessions younger than 24 hours can still change the password without re-authentication (Supabase's design).
- **Authentication → URL Configuration:** Site URL `http://localhost:5173`, Redirect URLs `http://localhost:5173/**`.
- **Email templates: leave them as Supabase's defaults.** New Free-plan projects can't customise authentication email templates without a custom SMTP provider.

### How email links work (PKCE)

Lobby uses Supabase's **PKCE** flow, which works with the default email templates:

1. When a rider signs up or asks for a password reset, the browser stores a secret **code verifier**.
2. The email link goes to Supabase first. Supabase checks the link (confirming the email, for sign-up) and redirects to Lobby with a short-lived, single-use `?code=`.
3. Lobby's `/auth/confirm` or `/reset-password` page exchanges that code for a session, **automatically and once**. The exchange only works in the browser holding the matching verifier.
4. After that single attempt, Lobby removes the code (and any auth values in the `#fragment`) from the address bar and replaces the current history entry, so Back/Forward never return to it.

**Each code gets exactly one exchange attempt.** supabase-js deletes the browser's verifier after any failed exchange (including network errors), so a code can't be retried. If the exchange fails, Lobby explains what to do next: for confirmation, sign in (the email is most likely already confirmed); for a reset, request a new link.

**Browser history:** browsers record the address in their History list as the page arrives, before any page script runs, so the redirect address with `?code=` still appears in the browser's History list. No website can prevent that. With PKCE this is low-risk: by then the code has been used, it expires within minutes, and it's useless without the verifier, which has been deleted.

Security notes:

- Access and refresh tokens are never put in the URL. If an old-style link arrives with tokens in the `#fragment`, Lobby ignores them (they are never read, stored or used to sign in) and wipes them from the address bar.
- The client never reads sessions from URLs by itself (`detectSessionInUrl: false`); only the two landing pages process codes.

**Same-browser requirement:**

- **Email confirmation:** opening the link in the browser where the rider signed up confirms the email **and** signs them in. Opening it in another browser still confirms the email, but the rider then signs in with their password.
- **Password reset:** the link **only works in the browser where the reset was requested.** In any other browser (including an email app's built-in browser on a phone), Lobby asks the rider to open it in the original browser or request a new link there.

**Password reset form:**

- The form asks only for the new password. Supabase rejects a new password that is the same as the current one, and Lobby shows "Your new password must be different from your current one."
- **The form appears only during a genuine recovery.** After a recovery link is processed, Lobby stores a small marker in this browser tab's `sessionStorage` (the user's ID and an expiry 60 minutes later; never a token, code or password). The form is shown only if the marker matches the signed-in user and hasn't expired, so it survives a reload of that tab. The marker is cleared on sign-in, sign-out and after the password is changed. A rider who is signed in normally sees "Change your password" instead, with an **Email me a reset link** button that sends a reset email to their own address (taken from the current session) and shows Supabase's answer. This is an app-level safeguard, not a complete security boundary; Supabase's **Secure password change** setting is the server-side control.
- **After a successful change, Lobby signs out every session of the account** (`scope: 'global'`, all devices including this one), so anyone using the old password loses access. If that fails (for example offline), this device is still signed out and the screen says other devices couldn't be confirmed. Supabase can't cancel access tokens already issued: other devices keep working until their current token expires (by default within about an hour), then can't renew.
- **Ordinary Sign out** signs out this device only.

**Reset requests:** success stays neutral ("If an account exists…"), because Supabase answers unknown addresses with success rather than an error. Rate limits and network problems get their own messages, and any other Supabase error shows "We couldn't send a reset link right now" instead of a false "we've sent a link".

**Sign-up errors:** an already-registered email always gets the same "Check your email" page as a new one, so the form can't reveal who has an account. Other problems get a clear message: an email address Supabase won't accept, sign-ups being unavailable, invalid input, or "We couldn't create your account right now".

**Custom templates later:** Lobby also supports a `token_hash` link format (verified only when the rider presses a button), for when custom SMTP and custom templates are configured.

### Development limitations

- **Email links point to `http://localhost:5173`**, so they only work on the same computer that is running `npm run dev`. Open them on that Mac, not on a phone or another computer. Cross-device testing needs a reachable staging or production address, which comes later.
- **Supabase's built-in email sender has a default limit of 2 emails per hour** and is meant for testing only. It is not suitable for production.
- **Default email templates (Free plan):** Supabase's own wording and sender are used, and the template can't be changed without custom SMTP.
- **Email security scanners** that pre-open links can use up a default-template link before the rider clicks it. For confirmation the account is still confirmed (the rider just signs in); for password reset the rider has to request a new link.
- **Only the newest email link works in each browser.** Without the token-hash templates, supabase-js keeps one active verifier per browser (for the most recent sign-up or reset request). If a rider requests two reset emails, only the newest link works, and opening an older link first means requesting a new one.
- **Leaked-password protection** is a Supabase Pro-plan feature and is not available on the Free plan.

### Launch requirement: custom SMTP and token-hash templates

Before launch, configure a **custom SMTP provider** and switch the confirmation and reset emails to **token-hash templates**:

- Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- Reset password: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

This removes the same-browser requirement (important for riders who open email on their phones), stops email scanners from using up links, and lifts the built-in sender's rate limit. Choosing the provider is a separate decision.

## Environment files and secrets

Local environment files (`.env`, `.env.local`, `.env.*.local` and similar) are ignored by Git and must never be committed. Only `.env.example`, which lists variable names without values, is committed.

Never put a Supabase secret key (`sb_secret_…`), the service-role key, or the database password in this project. As a safety net, the dev server and build refuse to run if a `VITE_` variable contains a secret or service-role key, and the app refuses to start if the publishable-key setting holds one.
