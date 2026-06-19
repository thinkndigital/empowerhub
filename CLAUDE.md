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

- **Live URL**: https://empowerhub.thinkndigital.com
- **Firebase project**: `studio-4511819966-bc14f`
- **Hosting**: Firebase App Hosting (`output: standalone`)
- **Active branch**: `claude/laughing-hopper-vajfwr`

## Roles & Dashboard Routes

| Role | Dashboard Path |
|------|---------------|
| `admin` | `/admin-dashboard` |
| `organization` | `/organization-dashboard` |
| `mentor` | `/mentor-dashboard` |
| `coach` | `/coach-dashboard` |
| `beneficiary` | `/beneficiary-dashboard` (also `/dashboard`) |

Default password for org-created users: `EmpowerHub@2024`

## Critical Architecture Constraint: Firebase Client SDK Is Broken on Server

The Firebase Client SDK requires browser APIs (IndexedDB, localStorage) and **cannot run server-side**. This is solved by:

1. `src/components/firebase-provider-dynamic.tsx` wraps the provider with `next/dynamic` + `ssr: false`
2. `src/app/layout.tsx` uses `FirebaseProviderDynamic` — never import Firebase client directly in server components
3. As a result, `useFirestore()`, `useDoc()`, `useCollection()` hooks may silently return `null` or fail — **never use the client Firestore SDK for critical data reads**

**All data must go through Next.js API routes using Admin SDK.**

## Data Fetching Pattern

Every API route follows this pattern:

```ts
// Server: src/app/api/*/route.ts
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await adminAuth.verifyIdToken(token);
  const uid = decoded.uid;
  // query adminDb ...
}
```

```ts
// Client: any component
const { user } = useUser();
const token = await user!.getIdToken();
const res = await fetch('/api/endpoint', {
  headers: { authorization: `Bearer ${token}` }
});
```

`organizationId` is in custom claims and in the Firestore `users` doc — but **not always in the token on first login**. Always fall back to reading `users/{uid}` if `decoded.organizationId` is missing.

## Authentication: `useUser()` Hook

```ts
const { user, userProfile, loading } = useUser(); // src/firebase/auth/use-user.tsx
// user: Firebase Auth User object (has getIdToken())
// userProfile: merged Firestore + claims data (name, role, organizationId, mentorId, coachId, ...)
// loading: composed of authChecked + profileLoading — may stay true if Firestore client fails
```

**Do not use `loading` as a full-page blocker** — if the Firestore profile subscription fails, `loading` never resolves. Instead, gate only specific sections on loading state, and use `if (!user) return` for auth guards.

**Do not use `auth.currentUser` synchronously** — it's null before Firebase Auth initializes. Always use `useUser()` with the `user` in `useEffect` deps.

## Firestore Timestamp Normalization

Admin SDK returns timestamps as `{ _seconds, _nanoseconds }` objects, not ISO strings. Always normalize in API routes before returning to the client:

```ts
function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}
```

## Firestore Query Constraints

- **No `orderBy` + `where` without a composite index** — Firestore throws. Sort in-memory instead.
- **Status fields are mixed Arabic/English** — e.g., courses may have `status: 'published'` OR `status: 'منشورة'`. Always check both.
- **Sessions** may reference a beneficiary via `attendees` array (array-contains) OR `beneficiaryId` field. Always query both and deduplicate.

## Dialog / Form Pattern

Radix UI `DialogContent` renders via a portal **outside the form's DOM tree**. When a submit button is inside `DialogFooter` but outside `<form>`:

```tsx
<form id="my-form" onSubmit={...}>...</form>
<DialogFooter>
  <Button type="submit" form="my-form">Submit</Button> {/* form= attr required */}
</DialogFooter>
```

## Firestore Collections

| Collection | Key Fields |
|-----------|-----------|
| `users` | `name, email, role, organizationId, status, mentorId, coachId, progress` |
| `organizations` | `name, adminId, inviteCode, plan` |
| `courses` | `title, description, status, createdBy, organizationId` |
| `courses/{id}/enrollments` | `progress, enrolledAt` (subcollection, keyed by uid) |
| `sessions` | `title, date, status, hostId, attendees[], beneficiaryId, organizationId` |
| `messages` | conversation metadata |
| `notifications` | per-user notifications |
| `stores` | `name, beneficiaryId, organizationId` |
| `products` | `name, price, category, status, userId` |

## Firebase Admin SDK Setup

```ts
// src/lib/firebase-admin.ts
// Production: uses Application Default Credentials (Firebase App Hosting handles this automatically)
// Local dev: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

No `.env.local` is required for local dev except for the service account key. Firebase client config is hardcoded in `src/firebase/config.ts` (intentional — these are public values).

## UI Conventions

- All user-facing strings are **Arabic**; `dir="rtl"` on all page containers
- Icon margins use `ml-*` (not `mr-*`) in RTL context — e.g., `<Icon className="h-4 w-4 ml-2" />`
- Font: Cairo (Google Fonts)
- Component library: shadcn/ui (`src/components/ui/`) + Radix UI primitives

## Debugging

A diagnostic page exists at `/beneficiary-dashboard/debug` (served by `src/app/api/beneficiary/debug/route.ts`) — shows the authenticated user's full Firestore data: sessions, enrollments, store, products. Use this to verify actual Firestore state.

First-admin setup: POST `/api/make-admin` with `{ email, secret: "empowerhub-setup-2024" }`, or visit `/setup`.
