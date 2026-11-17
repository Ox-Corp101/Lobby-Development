# Lobby

Lobby is a web-first, mobile-responsive app for the motorcycle riding community: plan group rides, find nearby rides and keep a personal ride calendar.

**Status:** Milestone 1 (Secure Authentication and Rider Profile Creation) is in progress. Steps 1–3 (project setup, visual shell, authentication screens) are done. The screens are not yet connected to Supabase, so sign-up and sign-in are not available yet.

Planning documents live in [`docs/plan/`](docs/plan/).

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for development and builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) for authentication and PostgreSQL (connected in a later step)

## Prerequisites

- **Node.js 22 or later** (includes npm). Check with `node -v`.
  - On macOS, install it from [nodejs.org](https://nodejs.org/) or with Homebrew: `brew install node@22`.

## Getting started

```bash
npm install
```

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

## Environment files and secrets

Local environment files (`.env`, `.env.local`, `.env.*.local` and similar) are ignored by Git and must never be committed. Only `.env.example`, which lists variable names without values, is committed. It will be added when Supabase is connected.

Never put a Supabase secret or service-role key, or a database password, in this project.
