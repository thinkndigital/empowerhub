# EmpowerHub — ملخص التحديثات الكاملة

**المشروع:** EmpowerHub — منصة تمكين رقمي متعددة الأدوار  
**الرابط المباشر:** https://empowerhub.thinkndigital.com  
**مشروع Firebase:** `studio-4511819966-bc14f`  
**فرع التطوير:** `claude/laughing-hopper-vajfwr`  
**تاريخ آخر تحديث:** 2026-06-20

---

## 1. نظام الرسائل (Messaging System)

### ما تم إنجازه:

#### API Routes
| الملف | التغيير |
|-------|---------|
| `src/app/api/messages/route.ts` | إصلاح استعلام Firestore (إزالة `orderBy+where` المركّب)، فرز في الذاكرة، إضافة فحص الحظر |
| `src/app/api/messages/[convId]/route.ts` | GET يضع `read:true` ويصفّر عداد الرسائل غير المقروءة — DELETE يحذف رسالة واحدة أو كل المحادثة |
| `src/app/api/messages/contacts/route.ts` | جلب جهات الاتصال حسب الدور مع فلترة المحظورين |
| `src/app/api/messages/block/route.ts` *(جديد)* | GET/POST/DELETE لإدارة قائمة الحظر |

#### مكوّن الرسائل `src/components/messages-center.tsx`
- **RTL كامل:** `dir="rtl"` داخل كل `ScrollArea` (Radix UI يكسر CSS cascade)
- **محاذاة الرسائل:** رسائلك → `ml-auto` (يمين فعلي) — رسائل الطرف الآخر → `mr-auto` (يسار)
- **بدون وميض:** `isFirstMsgLoad` ref — skeleton يظهر مرة واحدة فقط عند فتح المحادثة
- **تحديث صامت:** مقارنة البيانات قبل `setState` — لا إعادة رسم إذا لم تتغير البيانات
- **التمرير التلقائي:** فقط عند وصول رسائل جديدة (عدد يزيد)
- **حذف رسالة:** أيقونة سلة عند hover — تأكيد AlertDialog — حذف فوري مع تحديث `lastMessage`
- **حذف محادثة:** خيار في القائمة المنسدلة — AlertDialog — يمسح كل الرسائل والمحادثة
- **حظر/رفع الحظر:** زر في القائمة المنسدلة — يحدّث `blockedUsers` في Firestore
- **حالة المحظور:** يستبدل حقل الإدخال بإشعار مع زر رفع الحظر
- **أيقونة رسائل في الـ Header:** `MessageBell` component مع badge للرسائل غير المقروءة

#### `src/components/message-bell.tsx` *(جديد)*
```
- يستطلع /api/messages كل 15 ثانية
- يجمع unreadCount من كل المحادثات
- Badge خارج Button wrapper (لتجنب القطع)
- يظهر "9+" إذا تجاوز العدد 9
```

#### إضافة MessageBell لجميع لوحات التحكم
- `/admin-dashboard/layout.tsx`
- `/organization-dashboard/layout.tsx`
- `/mentor-dashboard/layout.tsx`
- `/coach-dashboard/layout.tsx`
- `/beneficiary-dashboard/layout.tsx`
- `/dashboard/layout.tsx`

---

## 2. نظام الإشعارات (Notifications)

**الملف:** `src/app/api/notifications/route.ts`

- إزالة `orderBy+where` المركب (يحتاج composite index غير موجود)
- الفرز يتم في الذاكرة: `.sort().slice(0, 20)`
- إشعار تلقائي عند إرسال رسالة جديدة (يُرسَل للمستلم)

---

## 3. إعدادات المنظمة

### API `src/app/api/org/settings/route.ts`
- **GET:** جلب بيانات المنظمة من `organizations/{orgId}`
- **PUT:** استخدام `.set(clean, { merge: true })` بدل `.update()` — ينشئ الوثيقة إن لم تكن موجودة

### صفحة الإعدادات `src/app/organization-dashboard/settings/page.tsx`
- رفع الشعار عبر `/api/media` (بدل Firebase Client SDK مباشرة)
- حفظ الاسم واللون والشعار وأسعار الجلسات في Firestore

### Layout المنظمة `src/app/organization-dashboard/layout.tsx`
- **إصلاح Bug:** كان يقرأ `orgData.settings?.name` (دائماً `undefined`) — صار `orgData.org?.name`
- إضافة `orgLogo` state — شعار المنظمة يأخذ الأولوية في الـ sidebar
- `org-settings-change` event listener — الاسم والشعار يتحدثان فوراً بعد الحفظ

---

## 4. API رفع الوسائط (Media Upload)

**الملف:** `src/app/api/media/route.ts` *(جديد)*

```
POST /api/media
Authorization: Bearer {token}
Content-Type: multipart/form-data
Fields:
  - file: ملف الصورة (مطلوب)
  - folder: مجلد التخزين (اختياري، افتراضي: "uploads")
```

**الخصائص:**
- يتحقق من هوية المستخدم (Firebase Auth)
- الأنواع المقبولة: JPEG، PNG، GIF، WEBP، SVG
- الحد الأقصى للحجم: 5 MB
- يرفع عبر Firebase Storage REST API (بدل Admin SDK)
- يُعيد `{ url, path }`

**لماذا REST API وليس Admin SDK Storage؟**  
Admin SDK Storage يحتاج اسم bucket صحيح في GCS، بينما Firebase Storage REST API تعمل مباشرة مع الـ bucket المعرّف في `firebaseConfig.storageBucket`.

---

## 5. إزالة "منظمتي" من جميع الصفحات

| الملف | قبل | بعد |
|-------|-----|-----|
| `organization-dashboard/layout.tsx` | Default: "منظمتي" | Default: "" (يُملأ من API) |
| `organization-dashboard/beneficiaries/page.tsx` | "مستفيدو منظمتي" | "المستفيدون" |
| `organization-dashboard/coaches/page.tsx` | "مدربو منظمتي" | "المدربون" |
| `organization-dashboard/mentors/page.tsx` | "مرشدو منظمتي" | "المرشدون" |

---

## 6. إصلاحات Firestore

### مشكلة `orderBy + where` بدون Composite Index
Firestore يرفع استثناء عند استخدام `where` + `orderBy` معاً بدون فهرس مركّب.

**القاعدة (من CLAUDE.md):** لا تستخدم `orderBy` مع Firestore — افرز في الذاكرة.

**الملفات المصلحة:**
- `src/app/api/messages/route.ts` — إزالة `orderBy('lastUpdated', 'desc')`
- `src/app/api/notifications/route.ts` — إزالة `orderBy('createdAt', 'desc')`

### مشكلة `.update()` على وثيقة غير موجودة
Firestore يرمي `NOT_FOUND` عند استدعاء `.update()` على وثيقة غير موجودة.

**الحل:** استبدال `.update(body)` بـ `.set(clean, { merge: true })`

---

## 7. بنية الـ Firebase Admin

### `src/lib/firebase-admin.ts`
```typescript
// الحالة النهائية — نظيف وبدون Storage
export const adminApp   = getAdminApp();   // يستخدم ADC في الإنتاج
export const adminAuth  = getAuth(adminApp);
export const adminDb    = getFirestore(adminApp);
// adminStorage مُزال — Media route يستخدم REST API مباشرة
```

**ملاحظة:** في Firebase App Hosting، ADC (Application Default Credentials) تعمل تلقائياً — لا حاجة لـ Service Account Key.

---

## 8. الأدوار ومسارات لوحة التحكم

| الدور | مسار | صلاحية الرسائل |
|-------|------|----------------|
| `admin` | `/admin-dashboard` | يراسل الجميع |
| `organization` | `/organization-dashboard` | يراسل كل أعضاء المنظمة |
| `mentor` | `/mentor-dashboard` | يراسل المستفيدين + مدير المنظمة + مشرف |
| `coach` | `/coach-dashboard` | يراسل المستفيدين + مدير المنظمة + مشرف |
| `beneficiary` | `/dashboard` | يراسل المرشد + المدرب + مدير المنظمة |

---

## 9. هيكل Firestore

```
conversations/{convId}
  ├── participants: [uid1, uid2]  (مرتبة أبجدياً)
  ├── lastMessage: string
  ├── lastUpdated: Timestamp
  ├── unread_{uid1}: number
  ├── unread_{uid2}: number
  └── msgs/{msgId}
        ├── senderId: string
        ├── content: string
        ├── read: boolean
        └── createdAt: Timestamp

users/{uid}
  ├── blockedUsers: string[]   ← قائمة المحظورين

organizations/{orgId}
  ├── name: string
  ├── logoUrl: string          ← Firebase Storage URL
  ├── primaryColor: string
  ├── courseSessionPrice: number
  ├── mentorshipSessionPrice: number
  └── inviteCode: string
```

---

## 10. نقاط تقنية مهمة (للمطوّر)

### Radix UI ScrollArea و RTL
```tsx
// خطأ — dir="rtl" لا يتوارث داخل ScrollArea
<ScrollArea dir="rtl">...</ScrollArea>

// صحيح — أضف dir="rtl" داخل المحتوى مباشرة
<ScrollArea>
  <div dir="rtl">...</div>
</ScrollArea>
```

### Badge خارج Button
```tsx
// خطأ — Badge يُقطع داخل Button asChild
<Button asChild>
  <Link href="...">
    <Badge className="absolute ...">5</Badge>
  </Link>
</Button>

// صحيح — wrapper div كـ positioning context
<div className="relative">
  <Button asChild><Link href="..."><Icon /></Link></Button>
  <Badge className="absolute -top-1 -right-1 ...">5</Badge>
</div>
```

### محاذاة الرسائل في RTL
```tsx
// لا تستخدم justify-start/end — لا تعمل بشكل موثوق مع dir="rtl"
// استخدم margin فيزيائي
className={isOwn ? 'ml-auto ...' : 'mr-auto ...'}
```

### DropdownMenuContent لا يقبل dir prop
```tsx
// خطأ
<DropdownMenuContent dir="rtl">

// صحيح
<DropdownMenuContent>
  <div dir="rtl">...</div>
</DropdownMenuContent>
```

---

## 11. قائمة الملفات المُعدَّلة أو المُنشأة

### ملفات جديدة
- `src/components/message-bell.tsx`
- `src/app/api/messages/block/route.ts`
- `src/app/api/media/route.ts`

### ملفات مُعدَّلة
- `src/lib/firebase-admin.ts`
- `src/app/api/messages/route.ts`
- `src/app/api/messages/[convId]/route.ts`
- `src/app/api/messages/contacts/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/org/settings/route.ts`
- `src/components/messages-center.tsx`
- `src/app/organization-dashboard/layout.tsx`
- `src/app/organization-dashboard/settings/page.tsx`
- `src/app/organization-dashboard/beneficiaries/page.tsx`
- `src/app/organization-dashboard/coaches/page.tsx`
- `src/app/organization-dashboard/mentors/page.tsx`
- `src/app/admin-dashboard/layout.tsx`
- `src/app/mentor-dashboard/layout.tsx`
- `src/app/coach-dashboard/layout.tsx`
- `src/app/beneficiary-dashboard/layout.tsx`
- `src/app/dashboard/layout.tsx`

---

## 12. كيفية استخدام /api/media من أي مكون

```typescript
// Client Component (use client)
const { user } = useUser();

async function uploadImage(file: File, folder: string = 'uploads') {
  const token = await user!.getIdToken();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);

  const res = await fetch('/api/media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.url; // Firebase Storage download URL
}
```

**مجلدات التخزين الموصى بها:**
- `org-logos` — شعارات المنظمات
- `avatars` — صور المستخدمين
- `courses` — صور الدورات
- `products` — صور المنتجات
- `uploads` — تحميلات عامة

---

*تم إعداد هذا الملف تلقائياً بواسطة Claude Code — 2026-06-20*
