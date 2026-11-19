# Lobby — Technical Principles

**Status:** Agreed by the product owner (listed as the agreed engineering principles in the M0.4 brief, 18 November 2026). The detailed decisions behind them are in [`docs/decisions/`](decisions/README.md).

These principles apply to every milestone. When a task seems to require breaking one, stop and ask first.

## 1. How we build

| Principle | What it means in practice |
|---|---|
| **Simplicity first** | Choose the simplest solution that meets the approved requirement. |
| **No premature abstraction or overengineering** | No generalised frameworks (notifications, invitations, media) until a real feature needs them. Extract shared code the second time it's needed. See [ADR 0011](decisions/0011-build-features-end-to-end.md). |
| **Incremental development** | Small milestones, each with one objective, its own tests and a stop for review. Unrelated changes are never bundled together. |
| **Inspect before modifying** | Check the real repository, configuration and current behaviour before changing anything. Never assume earlier recommendations were implemented. |
| **Cost-conscious** | Prefer free tiers and built-in features. **No paid service is introduced without explicit approval**, with its cost shown first. |

## 2. Security by default

| Principle | What it means in practice |
|---|---|
| **Secure by default** | New data is private unless a requirement says otherwise. |
| **No secret keys in apps** | Apps use only the Supabase project URL and the publishable key. Service-role and secret keys never appear in frontend code, mobile code, Git or chat. The web build already refuses secret-looking keys. |
| **RLS on every application table** | Row Level Security is enabled in the same migration that creates the table. With no rule, nothing is allowed. See [ADR 0005](decisions/0005-row-level-security-default-deny.md). |
| **Least privilege** | Each rule grants only the access a specific action needs: one rule per action (read, create, update, delete). |
| **Test RLS policies** | Every rule has automated tests, including tests proving that access is refused. |

## 3. Data integrity

| Principle | What it means in practice |
|---|---|
| **Database constraints** | Required fields, lengths and allowed values are enforced by the database, not only by forms. |
| **Atomic operations for concurrency** | Sensitive multi-step actions (taking a seat, approving, using an invitation link) run as one database function or transaction. See [ADR 0006](decisions/0006-database-enforced-rules-and-atomic-capacity.md). |
| **Validate on the server, not only in the UI** | App-side validation gives riders quick feedback. The database is the real protection. |
| **Migrations are the source of truth** | Every schema change is a reviewed migration file in Git, tested locally first. The product owner runs migrations against hosted projects. Dashboard schema edits aren't used. |

## 4. Multiple platforms

| Principle | What it means in practice |
|---|---|
| **Backward compatibility once mobile apps are released** | Riders don't all update their apps at once. Database and API changes must keep working for the previous app versions still in use: add before removing, and remove only once old versions are no longer supported. The minimum supported version policy is open (OD-30). |
| **Share logic, not necessarily UI** | See [ADR 0004](decisions/0004-share-logic-not-ui.md). |

## 5. Process

- Never commit or push without the product owner's approval.
- Never claim a test passed, or that something was verified on real Supabase or on GitHub, unless it actually was.
- Keep recommendations and confirmed requirements clearly apart.
- Don't change Supabase settings, schemas, migrations or security rules without approval.

Related: [product requirements](requirements/product-requirements.md) · [open decisions](requirements/open-decisions.md)
