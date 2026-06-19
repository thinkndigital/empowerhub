# EmpowerHub — Full Project Context

> Share this file at the start of any new Claude Code session to continue working on this project seamlessly.

---

## 1. Repository & Deployment

| Item | Value |
|------|-------|
| **GitHub Repo** | `thinkndigital/empowerhub` |
| **Active Branch** | `claude/laughing-hopper-vajfwr` |
| **Live URL** | https://empowerhub.thinkndigital.com |
| **Firebase Project** | `studio-4511819966-bc14f` |
| **Hosting** | Firebase App Hosting (`output: standalone`) |
| **Admin Panel URL** | https://empowerhub.thinkndigital.com/admin |
| **Admin Password** | `empowerhub-admin-2026` |

---

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Firebase Firestore (Admin SDK on server, Client SDK on browser only)
- **Auth**: Firebase Authentication (JWT Bearer tokens for API routes)
- **Storage**: Firebase Storage (logo/image uploads)
- **UI**: shadcn/ui + Radix UI, Tailwind CSS
- **Language**: Arabic-first (`dir="rtl"` everywhere), font: Cairo (Google Fonts)
- **Dev server**: `npm run dev` → port 9002
- **Build**: `npm run build` (TypeScript errors surface here — no test suite)

---

## 3. Critical Architecture Rule: Firebase Client SDK Is Server-Broken

The Firebase Client SDK requires browser APIs (IndexedDB, localStorage) and **cannot run server-side**.

**Solution already in place:**
- `src/components/firebase-provider-dynamic.tsx` wraps provider with `next/dynamic` + `ssr: false`
- `src/app/layout.tsx` uses `FirebaseProviderDynamic` — never import Firebase client in server components
- `useFirestore()`, `useDoc()`, `useCollection()` hooks may silently return `null` — **never use client Firestore for critical data reads**

**Rule: All data must go through Next.js API routes using Admin SDK.**

---

## 4. Standard Data Fetching Patterns

### Server API Route
```ts
// src/app/api/*/route.ts
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await adminAuth.verifyIdToken(token);
  const uid = decoded.uid;
  // query adminDb ...
}
```

### Client Component
```ts
const { user } = useUser();
const token = await user!.getIdToken();
const res = await fetch('/api/endpoint', {
  headers: { authorization: `Bearer ${token}` }
});
```

### Admin Panel (Cookie Auth — no Firebase)
```ts
// Cookie: ap_session=empowerhub-admin-2026-secret
// All admin-panel API routes check this cookie:
function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}
```

### Firestore Timestamp Normalization
Admin SDK returns `{ _seconds, _nanoseconds }` — always normalize in API routes:
```ts
function normalizeDate(d: any): string | undefined {
  if (!d || typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  if (s != null) return new Date(s * 1000).toISOString();
}
```

---

## 5. User Roles & Dashboard Routes

| Role | Dashboard Path |
|------|---------------|
| `admin` | `/admin-dashboard` (legacy) |
| `organization` | `/organization-dashboard` |
| `mentor` | `/mentor-dashboard` |
| `coach` | `/coach-dashboard` |
| `beneficiary` | `/beneficiary-dashboard` (also `/dashboard`) |
| Super Admin Panel | `/admin/dashboard` (cookie-auth, no Firebase) |

**Default password for org-created users**: `EmpowerHub@2024`

---

## 6. useUser() Hook

```ts
const { user, userProfile, loading } = useUser(); // src/firebase/auth/use-user.tsx
// user: Firebase Auth User object (has getIdToken())
// userProfile: merged Firestore + claims data (name, role, organizationId, mentorId, coachId, ...)
// loading: may stay true if Firestore client fails — DO NOT use as full-page blocker
```

- `organizationId` is in custom claims AND in Firestore `users/{uid}` — always fall back to reading the doc if missing from token
- Never use `auth.currentUser` synchronously — null before Firebase Auth initializes

---

## 7. Firestore Collections

| Collection | Key Fields |
|-----------|-----------|
| `users` | `name, email, role, organizationId, status, mentorId, coachId, progress` |
| `organizations` | `name, adminId, inviteCode, plan, primaryColor, logoUrl, dashboardSections` |
| `courses` | `title, description, status, createdBy, organizationId` |
| `courses/{id}/enrollments` | `progress, enrolledAt` (subcollection, keyed by uid) |
| `sessions` | `title, date, status, hostId, attendees[], beneficiaryId, organizationId` |
| `messages` | conversation metadata |
| `notifications` | per-user notifications |
| `stores` | `name, beneficiaryId, organizationId` |
| `products` | `name, price, category, status, userId` |
| `config/platform` | `platformName, platformTagline, logoUrl, faviconUrl, dashboardSections` |
| `plans` | subscription plan definitions |
| `subscriptions` | org → plan mappings |

**Important Firestore quirks:**
- No `orderBy` + `where` without a composite index — sort in-memory instead
- Status fields are mixed Arabic/English (e.g., `status: 'published'` OR `status: 'منشورة'`)
- Sessions may reference beneficiary via `attendees[]` (array-contains) OR `beneficiaryId` — query both

---

## 8. Per-Organization Branding & Section Config

Each organization doc (`organizations/{id}`) stores:
```ts
{
  primaryColor: '#6366f1',  // hex color
  logoUrl: '',              // Firebase Storage URL
  dashboardSections: {
    organization: { beneficiaries: true, team: true, mentors: true, coaches: true, courses: true, stores: true, orders: true, reports: true, messages: true, settings: true },
    beneficiary:  { progress: true, courses: true, sessions: true, messages: true, store: true, orders: true, settings: true },
    mentor:       { my_beneficiaries: true, sessions: true, analytics: true, messages: true, invitations: true, settings: true },
    coach:        { courses: true, sessions: true, analytics: true, messages: true, invitations: true, settings: true },
  }
}
```

Dashboard layouts (mentor/coach) already read `dashboardSections` and `primaryColor` from the org doc and apply HSL theming.

Platform-wide defaults are stored at `config/platform` doc and served via `/api/public/platform-config`.

---

## 9. Complete API Route Map

### Public (No Auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/public/platform-config` | Platform name, logo, section toggles |
| GET | `/api/public/site-config` | Landing page site config |
| GET | `/api/public/mentors` | Public mentor listing |
| GET | `/api/public/stores` | Public marketplace stores |
| GET | `/api/public/orders` | Public order lookup |
| POST | `/api/public/orders/verify` | Verify payment |
| POST | `/api/public/payment/initiate` | Start payment flow |
| GET | `/api/public/payment-config` | Payment gateway config |

### Auth (Firebase Bearer Token)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/my-role` | Get user's role |
| GET/PUT | `/api/user/profile` | User profile CRUD |
| GET/POST/PUT | `/api/store` | Beneficiary store CRUD |
| GET/POST/PUT/DELETE | `/api/store/products` | Products CRUD |
| GET | `/api/beneficiary/store` | Store + products + orders for beneficiary |
| GET | `/api/beneficiary/enrollments` | Course enrollments |
| GET | `/api/beneficiary/sessions` | Sessions for beneficiary |
| GET | `/api/beneficiary/courses` | Courses list |
| GET | `/api/beneficiary/mentor` | Assigned mentor info |
| GET | `/api/beneficiary/orders` | Orders list |
| GET/PUT | `/api/beneficiary/store-settings` | Store settings |
| GET | `/api/beneficiary/course/[courseId]` | Course detail |
| GET | `/api/courses` | Courses list |
| GET/PUT/DELETE | `/api/courses/[courseId]` | Course CRUD |
| POST | `/api/courses/[courseId]/enroll` | Enroll in course |
| GET/POST | `/api/courses/[courseId]/progress` | Progress tracking |
| GET/POST | `/api/courses/[courseId]/lessons` | Lessons CRUD |
| GET/POST | `/api/sessions` | Sessions CRUD |
| GET/POST | `/api/messages` | Conversations |
| GET/POST | `/api/messages/[convId]` | Conversation messages |
| GET/POST/DELETE | `/api/notifications` | Notifications |
| GET/POST | `/api/org/users` | Org user management |
| GET/PUT | `/api/org/settings` | Org settings |
| GET/POST | `/api/org/team` | Team management |
| GET/POST | `/api/org/courses` | Org courses |
| POST | `/api/org/courses/assign` | Assign course to user |
| GET/POST | `/api/org/groups` | User groups |
| GET | `/api/org/stores` | Org stores overview |
| POST | `/api/org/action` | Bulk user actions |
| GET | `/api/org/reports` | Org analytics |
| GET/POST | `/api/org/invitations` | Invite users |
| GET/PUT | `/api/org/user-profile` | Specific user profile |
| GET | `/api/org/orders` | Org orders |
| GET | `/api/org/contacts` | Contact list |
| GET | `/api/org/stats` | Dashboard stats |
| POST | `/api/register` | New user registration |
| POST | `/api/create-user` | Admin creates user |
| POST | `/api/create-organization` | Create new org |
| POST | `/api/invite-beneficiary` | Invite beneficiary |
| POST | `/api/make-admin` | Grant admin role (secret) |

### Admin Panel (Cookie Auth: `ap_session=empowerhub-admin-2026-secret`)
| Method | Route | Description |
|--------|-------|-------------|
| POST/DELETE | `/api/admin-panel/auth` | Login/logout |
| GET | `/api/admin-panel/stats` | Dashboard stats (also used for auth check) |
| GET/POST | `/api/admin-panel/organizations` | List/create orgs |
| GET/PATCH/DELETE | `/api/admin-panel/organizations/[id]` | Org CRUD |
| GET | `/api/admin-panel/organizations/[id]/overview` | Org members overview |
| GET/POST | `/api/admin-panel/users` | All users |
| GET/PATCH/DELETE | `/api/admin-panel/users/[id]` | User CRUD |
| GET | `/api/admin-panel/mentors` | Mentors list |
| GET/POST | `/api/admin-panel/plans` | Subscription plans |
| GET/PUT/DELETE | `/api/admin-panel/plans/[id]` | Plan CRUD |
| GET/POST/DELETE | `/api/admin-panel/subscriptions` | Subscriptions |
| GET/DELETE | `/api/admin-panel/subscriptions/[orgId]` | Org subscription |
| GET | `/api/admin-panel/stores` | All stores |
| GET/PATCH/DELETE | `/api/admin-panel/stores/[id]` | Store CRUD |
| PATCH/DELETE | `/api/admin-panel/products/[id]` | Product moderation |
| GET/PATCH | `/api/admin-panel/site-config` | Site/landing config |
| GET/PATCH | `/api/admin-panel/platform-config` | Platform-wide section config |
| GET/PATCH | `/api/admin-panel/payment-config` | Payment gateway config |
| GET/POST/PUT/DELETE | `/api/admin-panel/landing` | Landing page content |

---

## 10. All Page Routes

### Public Pages
- `/` — Landing page (hero, features, mentors, marketplace, testimonials)
- `/login` — Firebase Auth login
- `/register` — New user registration
- `/market` — Public marketplace (stores)
- `/stores/[storeId]` — Individual store page
- `/payment/callback` — Payment return URL
- `/setup` — First-admin setup (POST `/api/make-admin`)
- `/redirect` — Role-based redirect after login

### Beneficiary Dashboard (`/beneficiary-dashboard/`)
- `page.tsx` — Overview/home
- `courses/` — Course catalog
- `courses/[courseId]/` — Course viewer
- `progress/` — Progress tracking
- `sessions/` — Booked sessions
- `messages/` — Chat
- `store/` — My store + products
- `orders/` — My orders
- `settings/` — Profile settings
- `debug/` — Debug page (shows full Firestore data)

### Also at `/dashboard/` (legacy beneficiary)
- `page.tsx`, `training/`, `mentorship/`, `messages/`, `my-store/`, `my-store/settings/`, `settings/`, `reports/`, `contact/`

### Mentor Dashboard (`/mentor-dashboard/`)
- `page.tsx` — Overview
- `my-beneficiaries/` — Assigned beneficiaries
- `sessions/` — Sessions management
- `analytics/` — Performance analytics
- `messages/` — Chat
- `invitations/` — Invite beneficiaries
- `settings/` — Profile settings

### Coach Dashboard (`/coach-dashboard/`)
- `page.tsx` — Overview
- `courses/` — My courses
- `courses/[courseId]/` — Course editor
- `sessions/` — Sessions
- `analytics/` — Analytics
- `messages/` — Chat
- `invitations/` — Invite users
- `settings/` — Settings

### Organization Dashboard (`/organization-dashboard/`)
- `page.tsx` — Overview stats
- `beneficiaries/` + `[id]/` — Member management
- `mentors/` + `[id]/` — Mentor management
- `coaches/` + `[id]/` — Coach management
- `courses/` — Courses
- `stores/` — Store overview
- `orders/` — All orders
- `team/` — Team management
- `reports/` — Analytics
- `messages/` — Chat
- `settings/` — Org settings

### Super Admin Panel (`/admin/`)
- `page.tsx` — Login (password: `empowerhub-admin-2026`)
- `dashboard/` — Main dashboard
- `dashboard/organizations/` — Org management (logo, colors, section toggles per org)
- `dashboard/users/` — User management
- `dashboard/mentors/` — Mentors list
- `dashboard/plans/` — Subscription plans
- `dashboard/subscriptions/` — Subscriptions
- `dashboard/stores/` — Store moderation
- `dashboard/site/` — Site config (landing page)
- `dashboard/platform/` — Platform-wide section toggles + branding
- `dashboard/payment/` — Payment gateway config
- `dashboard/settings/` — Admin settings

---

## 11. Key Source Files

```
src/
├── app/
│   ├── layout.tsx                          Root layout (RTL, Cairo font, Firebase)
│   ├── admin/dashboard/layout.tsx          Admin sidebar (cookie auth)
│   ├── beneficiary-dashboard/layout.tsx    Beneficiary sidebar
│   ├── mentor-dashboard/layout.tsx         Mentor sidebar (org branding + HSL theming)
│   ├── coach-dashboard/layout.tsx          Coach sidebar (org branding + HSL theming)
│   └── organization-dashboard/layout.tsx   Org sidebar
├── lib/
│   ├── firebase-admin.ts                   Admin SDK init (ADC in prod)
│   ├── admin-panel-auth.ts                 Cookie auth helper
│   ├── utils.ts                            cn() and helpers
│   └── notifications.ts                    Notification helpers
├── firebase/
│   ├── config.ts                           Client SDK config (public values, hardcoded)
│   ├── auth/use-user.tsx                   useUser() hook
│   ├── firestore/use-doc.tsx               useDoc() hook
│   └── firestore/use-collection.tsx        useCollection() hook
├── components/
│   ├── firebase-provider-dynamic.tsx       SSR-safe Firebase provider
│   ├── notification-bell.tsx               Notification dropdown
│   ├── chat-interface.tsx                  Messaging UI
│   └── ui/                                 shadcn/ui components
└── hooks/
    ├── use-toast.ts
    ├── use-org-groups.ts
    └── use-org-users.ts
```

---

## 12. UI Conventions

- All user-facing strings are **Arabic**
- `dir="rtl"` on all page containers and dialogs
- Icon margins: `ml-*` (not `mr-*`) in RTL context — e.g., `<Icon className="h-4 w-4 ml-2" />`
- Component library: shadcn/ui (`src/components/ui/`) + Radix UI
- **Dialog/Form pattern**: Radix `DialogContent` renders outside `<form>` DOM — use `form="form-id"` attribute on submit button

```tsx
<form id="my-form" onSubmit={...}>...</form>
<DialogFooter>
  <Button type="submit" form="my-form">إرسال</Button>
</DialogFooter>
```

---

## 13. Admin Panel Section Customization

The platform has two levels of section configuration:

### Level 1: Platform-wide (applies to all orgs)
- Managed at `/admin/dashboard/platform`
- Stored in `config/platform` Firestore doc as `dashboardSections`
- Served via `GET /api/public/platform-config`

### Level 2: Per-organization override
- Managed at `/admin/dashboard/organizations` → dropdown ⋮ → "تخصيص الأقسام"
- Stored in `organizations/{id}` Firestore doc as `dashboardSections`
- Same structure as platform-wide config
- Currently displayed to users via mentor/coach layouts that read org doc

```ts
// dashboardSections structure (same for both levels):
{
  organization: {
    beneficiaries: boolean, team: boolean, mentors: boolean, coaches: boolean,
    courses: boolean, stores: boolean, orders: boolean, reports: boolean,
    messages: boolean, settings: boolean
  },
  beneficiary: {
    progress: boolean, courses: boolean, sessions: boolean, messages: boolean,
    store: boolean, orders: boolean, settings: boolean
  },
  mentor: {
    my_beneficiaries: boolean, sessions: boolean, analytics: boolean,
    messages: boolean, invitations: boolean, settings: boolean
  },
  coach: {
    courses: boolean, sessions: boolean, analytics: boolean,
    messages: boolean, invitations: boolean, settings: boolean
  }
}
```

---

## 14. Recent Changes (Latest Session)

| File | Change |
|------|--------|
| `src/app/admin/dashboard/organizations/page.tsx` | Full rewrite: per-org logo upload, color picker, ⋮ dropdown menu (عرض/تعديل/الأقسام/حذف), `OrgSectionsModal` with Switch toggles per dashboard type, mobile overflow fixes |
| `src/app/api/admin-panel/organizations/route.ts` | POST now saves `logoUrl` |
| `src/app/admin/dashboard/layout.tsx` | Fixed mobile horizontal scroll (`overflow-y-auto overflow-x-hidden`) |
| `src/components/notification-bell.tsx` | Fixed `RangeError` from invalid `createdAt` timestamp |
| `src/app/beneficiary-dashboard/store/page.tsx` | Added NaN guard for product price display |
| `src/app/api/beneficiary/store/route.ts` | Firestore timestamp normalization for store/products/orders |
| `src/app/dashboard/my-store/page.tsx` | Fixed `format()` crash on Firestore timestamp in order date |

---

## 15. Known Patterns & Gotchas

1. **`formatDistanceToNow` / `format` from date-fns** — wrap in try/catch + `isNaN(d.getTime())` guard, Firestore timestamps cause `RangeError`
2. **Mobile RTL overflow** — use `overflow-x-hidden` on layouts, `overflow-hidden w-full` + `min-w-0` on flex children, `truncate` on text
3. **`function` inside try block** — TypeScript strict mode error; use `const fn = () => {}` instead
4. **`DropdownMenuContent` `dir` prop** — not supported; wrap parent container in `dir="rtl"` instead
5. **Firestore `orderBy` + `where`** — requires composite index; sort in-memory to avoid
6. **`loading` from `useUser()`** — may never resolve if Firestore client fails; don't use as full-page blocker
7. **Admin SDK in API routes** — `src/lib/firebase-admin.ts` uses ADC in production (Firebase App Hosting handles automatically); locally set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

---

## 16. First-Time Setup Commands

```bash
# Clone and install
git clone https://github.com/thinkndigital/empowerhub
cd empowerhub
npm install

# Dev server
npm run dev  # → http://localhost:9002

# Build check
npm run build

# First admin setup (if needed)
# POST /api/make-admin with body: { "email": "...", "secret": "empowerhub-setup-2024" }
# Or visit: /setup
```

---

## 17. Diagnostic Tools

- `/beneficiary-dashboard/debug` — Shows authenticated user's full Firestore data (sessions, enrollments, store, products)
- `/api/beneficiary/debug` — Raw JSON API endpoint
- `/debug-db` — Database connection debug page
- `/try-roles` — Quick role-switch UI for testing

---

*Generated: 2026-06-19 | Branch: `claude/laughing-hopper-vajfwr`*
