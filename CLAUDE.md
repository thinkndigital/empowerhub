# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 9002
npm run build      # Production build
npm run lint       # ESLint check
```

No test suite exists. Validate changes by building (`npm run build`) — TypeScript errors surface here.

## Project Overview

EmpowerHub is an Arabic-first, multi-role SaaS platform for digital empowerment. It combines training, mentoring, and e-commerce in a unified RTL interface.

- **Live URL**: https://empowerhub.tech
- **Backend**: Self-hosted MySQL (via Drizzle ORM) + JWT auth + local-disk file storage. No Firebase anywhere in this project.
- **Hosting**: Self-hosted Node.js 20 on shared cPanel hosting (Node.js Selector / Passenger), built with `output: standalone`. See `DEPLOYMENT.md` for the deploy process.
- **Active branch**: `claude/last-repo-worked-on-yq293j`

## Roles & Dashboard Routes

| Role | Dashboard Path |
|------|---------------|
| `admin` | `/admin-dashboard` |
| `organization` | `/organization-dashboard` |
| `mentor` | `/mentor-dashboard` |
| `coach` | `/coach-dashboard` |
| `beneficiary` | `/beneficiary-dashboard` (also `/dashboard`) |

Default password for org-created users: `EmpowerHub@2024`

## Data Fetching Pattern

Every API route follows this pattern:

```ts
// Server: src/app/api/*/route.ts
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await verifyAuthToken(token); // throws on invalid/expired — same shape as the old adminAuth.verifyIdToken
  const uid = decoded.uid;
  // db.select().from(...).where(...) ...
}
```

```ts
// Client: any component
const { user } = useUser(); // src/hooks/use-user.tsx
const token = await user!.getIdToken(); // returns the stored JWT
const res = await fetch('/api/endpoint', {
  headers: { authorization: `Bearer ${token}` }
});
```

`organizationId` is in the JWT payload (set at login/register from the `users` row) — but **not always present** (e.g. right after accepting an org invite, before a fresh token is issued). Always fall back to reading `users/{uid}` if `decoded.organizationId` is missing.

## Authentication: `useUser()` Hook

```ts
const { user, userProfile, loading } = useUser(); // src/hooks/use-user.tsx
// user: { uid, email, displayName, getIdToken() } — getIdToken() resolves the JWT from localStorage
// userProfile: the full `users` row (minus passwordHash) returned by GET /api/me
// loading: true until the stored token (if any) has been validated against /api/me
```

The JWT is stored in `localStorage` (via `useAuthActions().setToken()` after login/register) and restored on page load by `AuthProvider` (wraps the app in `src/app/layout.tsx`) calling `GET /api/me`. Sign out with `useAuthActions().logout()`.

**Do not use `loading` as a full-page blocker on pages that don't require auth** — gate only auth-dependent sections on it, and use `if (!user) return` for guards.

## Firestore Timestamp Normalization

**No longer applicable.** Drizzle/mysql2 return `timestamp` columns as native JS `Date` objects, which `NextResponse.json()` serializes to plain ISO strings automatically. No manual normalization needed.

## MySQL / Drizzle Notes

- **Schema source of truth**: `src/lib/schema.ts` (Drizzle table definitions). `schema.sql` (repo root) is the same schema as a plain `.sql` file for one-time import via phpMyAdmin on the production host (no CLI migration runner there). After changing `schema.ts`, regenerate it:
  ```bash
  rm -rf drizzle && npx drizzle-kit generate
  cp drizzle/0000_*.sql schema.sql
  grep -v "statement-breakpoint" schema.sql > schema.sql.tmp && mv schema.sql.tmp schema.sql
  ```
  (`--> statement-breakpoint` lines are not valid MySQL comments and break phpMyAdmin import — always strip them.)
- **Status/enum fields are English-only** (`'published'`, `'active'`, etc.) — never mixed Arabic/English. Translate to Arabic only at the UI display layer, never in a stored value or a comparison.
- **Fields with no dedicated column**: several tables have a catch-all `meta: json('meta')` column for fields that don't justify a real column (e.g. `courses.meta` holds `quiz`/`preAssessment`/`postAssessment`/`videoUrl`; `organizations.meta` holds `orgType`/`features`/`dashboardSections`). Routes that read/write these flatten `meta` onto the top-level object in responses and merge new values into existing `meta` on write — **never blindly spread a request body into `db.update(...).set(body)`**, since any key without a real column is silently dropped by Drizzle. See `src/app/api/courses/[courseId]/route.ts` and `src/app/api/admin-panel/organizations/[id]/route.ts` for the pattern.
- **Unified tables replacing old Firestore duplication**: `enrollments` (replaces the old `courses/{id}/enrollments` subcollection + separate `courseProgress` collection — one row per `(courseId, userId)`, with an `assigned` boolean distinguishing org-assigned from self/coach-enrolled), `session_attendees` (replaces the mentoring-session `attendees[]` array), `app_settings` (key/value JSON table replacing the old `config/{platform,site,payment,trial,landing}` singleton docs — see `src/lib/app-settings.ts`'s `getSetting`/`patchSetting`, which deep-merges nested objects on patch).
- **Sessions** (the mentoring `sessions` table, not `live_sessions`) may reference a beneficiary via the `session_attendees` join table OR the `beneficiaryId` column directly. Always query both and deduplicate (see `src/app/api/beneficiary/sessions/route.ts`).
- **No test suite** — validate schema changes by re-importing `schema.sql` into a real MySQL/MariaDB instance, not just by reading the generated SQL.

## Dialog / Form Pattern

Radix UI `DialogContent` renders via a portal **outside the form's DOM tree**. When a submit button is inside `DialogFooter` but outside `<form>`:

```tsx
<form id="my-form" onSubmit={...}>...</form>
<DialogFooter>
  <Button type="submit" form="my-form">Submit</Button> {/* form= attr required */}
</DialogFooter>
```

## Database Tables

| Table | Key Fields |
|-----------|-----------|
| `users` | `name, email, passwordHash, role, organizationId, status, mentorId, coachId, progress` |
| `organizations` | `name, adminId, inviteCode, planKey, meta` |
| `courses` | `title, description, status, createdBy, organizationId, meta` |
| `enrollments` | `courseId, userId, progress, completedLessons, assigned` |
| `sessions` (mentoring) | `title, date, status, hostId, beneficiaryId, organizationId` + `session_attendees` join table |
| `live_sessions` | `coachId, title, date, price, status` + `live_session_registrations` |
| `conversations` / `messages` | `conversation_participants` (per-user unreadCount) / `conversationId, senderId, content` |
| `notifications` | `userId, type, title, body, link, read` |
| `stores` | `name, slug, beneficiaryId, organizationId` |
| `products` | `name, price, category, status, userId, storeId` |
| `orders` | `type ('product'/'session'/'subscription'), userId, hostId, storeId, totalAmount, status, paymentStatus` |
| `app_settings` | `key, value (JSON)` — replaces the old Firestore `config/*` singleton docs |

## Auth & Storage Modules

- `src/lib/auth-server.ts` — `hashPassword`/`verifyPassword` (bcryptjs), `signAuthToken`/`verifyAuthToken` (JWT), `requireAuth(req)` (returns `null` instead of throwing), `stripPassword`/`stripPasswords` (**always use on any route returning a `users` row** — unlike the old Firestore docs, the row carries `passwordHash`).
- `src/lib/storage.ts` — `saveUploadedFile(file, folder)` writes to `UPLOADS_DIR` (env var, must point **outside** `next-build/` since that folder is replaced wholesale on every deploy) and returns a `/api/files/...` URL; served back by `src/app/api/files/[...path]/route.ts`.

## UI Conventions

- All user-facing strings are **Arabic**; `dir="rtl"` on all page containers
- Icon margins use `ml-*` (not `mr-*`) in RTL context — e.g., `<Icon className="h-4 w-4 ml-2" />`
- Font: Cairo (Google Fonts)
- Component library: shadcn/ui (`src/components/ui/`) + Radix UI primitives

## Debugging

A diagnostic page exists at `/beneficiary-dashboard/debug` (served by `src/app/api/beneficiary/debug/route.ts`) — shows the authenticated user's full data: sessions, enrollments, store, products. Use this to verify actual database state.

First-admin setup: POST `/api/make-admin` with `{ email, secret: "empowerhub-setup-2024" }`, or visit `/setup`.
