# EmpowerHub — توثيق المنصة الكامل

## نظرة عامة

منصة EmpowerHub هي SaaS عربية متعددة الأدوار للتمكين الرقمي، تجمع التدريب والإرشاد والتجارة الإلكترونية في واجهة RTL موحدة.

- **الرابط الحي**: https://empowerhub.thinkndigital.com
- **الإطار**: Next.js 14 (App Router) — `output: standalone`
- **الاستضافة**: Firebase App Hosting
- **مشروع Firebase**: `studio-4511819966-bc14f`
- **قاعدة البيانات**: Firebase Firestore (مجموعات مستوية)
- **المصادقة**: Firebase Auth — Email/Password + Google Sign-In
- **واجهة المستخدم**: shadcn/ui + Tailwind CSS + RTL عربي (خط Cairo)
- **الفرع النشط**: `claude/affectionate-ramanujan-rbvqv1`
- **المستودع**: `thinkndigital/empowerhub`

---

## الأدوار والصلاحيات

| الدور | المسار | الوصف |
|-------|--------|-------|
| `admin` | `/admin-dashboard` | مشرف المنصة — يدير كل شيء |
| `organization` | `/organization-dashboard` | مدير المنظمة — يدير الفريق والمستفيدين والدورات |
| `mentor` | `/mentor-dashboard` | مرشد — يتابع المستفيدين والجلسات |
| `coach` | `/coach-dashboard` | مدرب — يدير دوراته التدريبية |
| `beneficiary` | `/dashboard` | مستفيد — يتدرب ويتسوق ويتواصل |

**كلمة المرور الافتراضية للمستخدمين المُنشئين من لوحة التحكم**: `EmpowerHub@2024`

---

## Firebase — الإعداد والتهيئة

### بيانات الإعداد (`src/firebase/config.ts`)

```ts
export const firebaseConfig = {
  projectId: 'studio-4511819966-bc14f',
  appId: '1:822244663005:web:2bbd7b3b2a819f1e2c0534',
  apiKey: 'AIzaSyCufQtfjRhee0FHei0PIVSPJ0eTQISlKgk',
  authDomain: 'studio-4511819966-bc14f.firebaseapp.com',
  storageBucket: 'studio-4511819966-bc14f.appspot.com',
  messagingSenderId: '822244663005',
};
```

### بنية ملفات Firebase

```
src/firebase/
├── config.ts                  # بيانات الإعداد
├── client-provider.tsx        # تهيئة Firebase على العميل فقط
├── provider.tsx               # React Context + hooks
├── error-emitter.ts           # إرسال أخطاء Firestore
├── errors.ts                  # أنواع الأخطاء
├── auth/
│   └── use-user.tsx           # hook لحالة المستخدم والملف الشخصي
└── firestore/
    ├── use-doc.tsx            # hook لقراءة مستند واحد
    └── use-collection.tsx     # hook لقراءة مجموعة
```

### كيف تعمل التهيئة

**السبب الجوهري للمشاكل السابقة**: Firebase Client SDK يحتاج APIs المتصفح (IndexedDB, localStorage) ولا يعمل على السيرفر.

**الحل المُطبَّق**:
1. `src/components/firebase-provider-dynamic.tsx` يغلف المزود بـ `next/dynamic` مع `ssr: false`
2. `src/app/layout.tsx` يستخدم `FirebaseProviderDynamic` بدلاً من استيراد Firebase مباشرة
3. `src/firebase/client-provider.tsx` له static imports من Firebase SDK — آمن لأن الملف لا يُحمَّل إطلاقاً على السيرفر بفضل `ssr: false`

```tsx
// src/app/layout.tsx
import { FirebaseProviderDynamic } from '@/components/firebase-provider-dynamic';
// ...
<FirebaseProviderDynamic>{children}</FirebaseProviderDynamic>
```

### قواعد Firestore الحالية

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## مجموعات Firestore

| المجموعة | الوصف | الحقول الأساسية |
|---------|-------|----------------|
| `users` | جميع المستخدمين | `name, email, role, organizationId, status, avatarUrl, mentorId, coachId, expertise, progress, category` |
| `organizations` | المنظمات | `name, email, phone, address, adminId, plan` |
| `courses` | الدورات التدريبية | `title, description, organizationId, coachId, status, modules` |
| `sessions` | جلسات الإرشاد | `mentorId, beneficiaryId, date, status, notes` |
| `products` | منتجات المتجر | `storeId, name, price, stock, category` |
| `stores` | متاجر المستفيدين | `ownerId, name, description, status` |
| `orders` | الطلبات | `buyerId, storeId, items, total, status` |
| `conversations` | المحادثات | `participants[], lastMessage, updatedAt` |
| `notifications` | الإشعارات | `userId, title, body, read, createdAt` |
| `evaluations` | التقييمات | `targetId, evaluatorId, score, notes` |

---

## API Routes (Server-Side — Firebase Admin SDK)

### `POST /api/create-user`
ينشئ مستخدم Firebase Auth + وثيقة Firestore.

**Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string (default: EmpowerHub@2024)",
  "role": "beneficiary | coach | mentor | organization",
  "organizationId": "string (اختياري)",
  "category": "string (اختياري)",
  "expertise": "string (اختياري)"
}
```

### `POST /api/create-organization`
ينشئ منظمة جديدة في Firestore.

**Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (اختياري)",
  "address": "string (اختياري)"
}
```

### `POST /api/make-admin`
يرفع مستخدم لدور admin عبر سر.

**Body**:
```json
{
  "email": "string",
  "secret": "empowerhub-setup-2024"
}
```

---

## الصفحات والمسارات

### عام

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | الصفحة الرئيسية | Landing page |
| `/login` | تسجيل الدخول | Email/Password + Google Sign-In |
| `/register` | إنشاء حساب | اختيار الدور عند التسجيل |
| `/market` | السوق | عرض المتاجر والمنتجات |
| `/stores/[storeId]` | صفحة المتجر | عرض منتجات متجر معين |
| `/try-roles` | تجربة الأدوار | دخول تجريبي بدون حساب |
| `/setup` | إعداد المشرف | صفحة رفع أول مستخدم لـ admin |

### لوحة تحكم المشرف (`/admin-dashboard`)

| المسار | الوصف |
|--------|-------|
| `/admin-dashboard` | الرئيسية — إحصاءات حقيقية من Firestore |
| `/admin-dashboard/organizations` | إدارة المنظمات + إنشاء جديدة |
| `/admin-dashboard/users` | عرض وإدارة جميع المستخدمين |
| `/admin-dashboard/mentors` | إدارة المرشدين |
| `/admin-dashboard/courses` | إدارة الدورات |
| `/admin-dashboard/analytics` | تحليلات المنصة |
| `/admin-dashboard/messages` | الرسائل |
| `/admin-dashboard/settings` | إعدادات النظام |

### لوحة تحكم المنظمة (`/organization-dashboard`)

| المسار | الوصف |
|--------|-------|
| `/organization-dashboard` | الرئيسية |
| `/organization-dashboard/team` | إضافة أعضاء الفريق (مرشدين/مدربين) عبر API |
| `/organization-dashboard/beneficiaries` | إدارة المستفيدين |
| `/organization-dashboard/mentors` | إدارة المرشدين |
| `/organization-dashboard/coaches` | إدارة المدربين |
| `/organization-dashboard/courses` | الدورات + تعيين للمستفيدين |
| `/organization-dashboard/stores` | إدارة المتاجر |
| `/organization-dashboard/reports` | التقارير |
| `/organization-dashboard/messages` | الرسائل |
| `/organization-dashboard/settings` | الإعدادات |

### لوحة تحكم المرشد (`/mentor-dashboard`)

| المسار | الوصف |
|--------|-------|
| `/mentor-dashboard` | الرئيسية |
| `/mentor-dashboard/my-beneficiaries` | المستفيدون التابعون |
| `/mentor-dashboard/sessions` | جدول الجلسات |
| `/mentor-dashboard/analytics` | التحليلات |
| `/mentor-dashboard/messages` | الرسائل |
| `/mentor-dashboard/settings` | الإعدادات |

### لوحة تحكم المدرب (`/coach-dashboard`)

| المسار | الوصف |
|--------|-------|
| `/coach-dashboard` | الرئيسية |
| `/coach-dashboard/courses` | دوراتي |
| `/coach-dashboard/courses/[courseId]` | تفاصيل الدورة |
| `/coach-dashboard/analytics` | التحليلات |
| `/coach-dashboard/messages` | الرسائل |
| `/coach-dashboard/settings` | الإعدادات |

### لوحة تحكم المستفيد (`/dashboard`)

| المسار | الوصف |
|--------|-------|
| `/dashboard` | الرئيسية |
| `/dashboard/training` | الدورات التدريبية |
| `/dashboard/training/[courseId]` | محتوى الدورة |
| `/dashboard/mentorship` | الإرشاد والمرشد |
| `/dashboard/my-store` | متجري |
| `/dashboard/my-store/settings` | إعدادات المتجر |
| `/dashboard/reports` | تقاريري |
| `/dashboard/messages` | الرسائل |
| `/dashboard/contact` | التواصل مع المنظمة |
| `/dashboard/settings` | الإعدادات |

---

## Hooks الأساسية

### `useUser()` — `src/firebase/auth/use-user.tsx`
```ts
const { user, userProfile, loading } = useUser();
// user: Firebase Auth User | null
// userProfile: بيانات المستخدم من Firestore | null
// loading: true أثناء التحقق من المصادقة أو تحميل الملف الشخصي
```

### Hooks Firebase من `src/firebase/provider.tsx`
```ts
const auth = useAuth();           // Auth | null
const firestore = useFirestore(); // Firestore | null
const storage = useStorage();     // FirebaseStorage | null
const app = useFirebaseApp();     // FirebaseApp | null
const state = useFirebaseState(); // كامل حالة Firebase بما فيها isUserLoading
```

---

## إنشاء أول حساب مشرف

بعد النشر الأول، رفع أول مستخدم لدور `admin`:

**الطريقة 1**: عبر `/setup` في المتصفح

**الطريقة 2**: عبر API مباشرة
```bash
curl -X POST https://empowerhub.thinkndigital.com/api/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "secret": "empowerhub-setup-2024"}'
```

**الطريقة 3**: يدوياً في Firestore Console
- افتح: Firebase Console → Firestore → `users` → وثيقة المستخدم
- غير حقل `role` من `beneficiary` إلى `admin`

---

## المتغيرات البيئية

### لـ Firebase Admin SDK (API Routes)
```env
# يتم تلقائياً في Firebase App Hosting عبر Application Default Credentials
# للتطوير المحلي:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### لا يوجد `.env.local` مطلوب للـ Client SDK
بيانات Firebase Client موجودة في `src/firebase/config.ts` (مقصود — هي بيانات عامة).

---

## مشاكل شائعة وحلولها

### "Service firestore is not available"
**السبب**: Firebase يُشغَّل على السيرفر (SSR).  
**الحل**: تأكد أن `layout.tsx` يستخدم `FirebaseProviderDynamic` وليس `FirebaseClientProvider` مباشرة.

### الشعار يدور للأبد
**السبب**: `loading` لا يتوقف — عادة لأن `auth` يبقى `null` ولا يُعلَم بتغييره.  
**الحل**: التحقق من `isUserLoading` في `FirebaseProvider` وضمان وجود `authChecked` في `useUser`.

### تسجيل الدخول بـ Google يفشل
**السبب**: الدومين غير مُضاف في Firebase Auth.  
**الحل**: Firebase Console → Authentication → Settings → Authorized domains → أضف `empowerhub.thinkndigital.com`.

### المستخدم يدخل لكن لا يجد بياناته
**السبب**: لا توجد وثيقة في `users` collection له.  
**الحل**: يتم إنشاؤها تلقائياً عند أول دخول عبر `handleUserProfile` في صفحة Login.

---

## البنية التقنية الكاملة

```
empowerhub/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout — Firebase + Toaster
│   │   ├── page.tsx                 # Landing page
│   │   ├── login/page.tsx           # تسجيل الدخول
│   │   ├── register/page.tsx        # إنشاء حساب
│   │   ├── admin-dashboard/         # لوحة المشرف
│   │   ├── organization-dashboard/  # لوحة المنظمة
│   │   ├── mentor-dashboard/        # لوحة المرشد
│   │   ├── coach-dashboard/         # لوحة المدرب
│   │   ├── dashboard/               # لوحة المستفيد
│   │   ├── market/                  # السوق
│   │   ├── stores/[storeId]/        # صفحة المتجر
│   │   ├── setup/                   # إعداد المشرف
│   │   └── api/                     # Server API Routes
│   │       ├── create-user/         # إنشاء مستخدم
│   │       ├── create-organization/ # إنشاء منظمة
│   │       └── make-admin/          # ترقية لمشرف
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── firebase-provider-dynamic.tsx  # Firebase ssr:false wrapper
│   │   ├── FirebaseErrorListener.tsx      # مستمع أخطاء Firestore
│   │   ├── logo.tsx                 # شعار المنصة
│   │   └── notification-bell.tsx   # جرس الإشعارات
│   ├── firebase/
│   │   ├── config.ts               # إعداد Firebase
│   │   ├── client-provider.tsx     # تهيئة Client SDK
│   │   ├── provider.tsx            # React Context + Hooks
│   │   ├── auth/use-user.tsx       # hook المستخدم
│   │   └── firestore/              # Firestore hooks
│   └── lib/
│       └── utils.ts                # cn() + مساعدات
├── next.config.js                  # إعداد Next.js
├── tailwind.config.ts              # إعداد Tailwind
└── package.json
```

---

## التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Next.js | 14.2.35 | إطار العمل الرئيسي |
| React | 18.3.1 | واجهة المستخدم |
| Firebase | 10.12.2 | Auth + Firestore + Storage |
| Firebase Admin | ^14.0.0 | API Routes (Server) |
| shadcn/ui | — | مكونات UI |
| Tailwind CSS | — | التصميم |
| React Hook Form | 7.52.0 | إدارة النماذج |
| Zod | — | التحقق من البيانات |
| Lucide React | — | الأيقونات |

---

## سير عمل التطوير

```bash
# تشغيل محلي
npm run dev        # يعمل على المنفذ 9002

# بناء
npm run build

# النشر
# يتم تلقائياً عند push إلى GitHub → Firebase App Hosting
```

---

*آخر تحديث: 2026-06-16*
