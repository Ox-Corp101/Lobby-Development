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

- **Authentication → Sign In / Providers → Email:** email provider enabled, **Confirm email** on, minimum password length 8, no required characters.
- **Authentication → URL Configuration:** Site URL `http://localhost:5173`, Redirect URLs `http://localhost:5173/**`.
- **Authentication → Email Templates:**
  - **Confirm signup:** the link must be `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
  - **Reset password:** the link must be `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

Lobby only uses an email link after the rider presses a button on the page. This stops email security scanners, which often pre-open links, from using up the one-time link.

**Reloading a link page:** when the confirmation or reset page opens, Lobby removes the one-time code from the address bar so it doesn't stay in browser history. If the page is reloaded **before** the rider presses **Confirm my email** or **Continue**, the page says the link is incomplete. The code has not been used, so the rider just reopens the original email link. Lobby deliberately does not use the code automatically on page load.

**Password reset form:** the recovery form asks only for the new password. Supabase rejects a new password that is the same as the current one, and Lobby shows "Your new password must be different from your current one."

### Development limitations

- **Email links point to `http://localhost:5173`**, so they only work on the same computer that is running `npm run dev`. Open them on that Mac, not on a phone or another computer. Cross-device testing needs a reachable staging or production address, which comes later.
- **Supabase's built-in email sender has a default limit of 2 emails per hour** and is meant for testing only. It is not suitable for production. A custom email (SMTP) provider is a separate launch decision.
- **Leaked-password protection** is a Supabase Pro-plan feature and is not available on the Free plan.

## Environment files and secrets

Local environment files (`.env`, `.env.local`, `.env.*.local` and similar) are ignored by Git and must never be committed. Only `.env.example`, which lists variable names without values, is committed.

Never put a Supabase secret key (`sb_secret_…`), the service-role key, or the database password in this project. As a safety net, the dev server and build refuse to run if a `VITE_` variable contains a secret or service-role key, and the app refuses to start if the publishable-key setting holds one.
