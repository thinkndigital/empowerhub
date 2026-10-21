# نشر EmpowerHub على empowerhub.tech (استضافة cPanel مشتركة)

هذا الدليل لنشر نفس مشروع EmpowerHub (نفس مشروع Firebase الخلفي `studio-4511819966-bc14f`
للبيانات والمصادقة) على سيرفر جديد — استضافة مشتركة بلوحة تحكم cPanel، على دومين
`empowerhub.tech`، باستخدام Node.js 20 عبر ميزة "Setup Node.js App" (Phusion Passenger).
لا يوجد VPS ولا Docker هنا — الاعتماد على ملف "dist" جاهز يُرفع مباشرة.

## 0) تجهيزات لمرة واحدة قبل النشر

### أ) أضف الدومين الجديد في Firebase (إلزامي، وإلا تسجيل الدخول ما يشتغل)
Firebase Console → مشروع `studio-4511819966-bc14f` → Authentication → Settings
→ Authorized domains → **Add domain** → `empowerhub.tech`
(أضف أيضاً `www.empowerhub.tech` إذا بتستخدمه).

### ب) ولّد مفتاح حساب خدمة Firebase (Service Account)
Firebase Console → Project settings (⚙️) → Service accounts → **Generate new private key**.
يتنزّل ملف JSON — هذا يحتاجه السيرفر الجديد لأنه (خلافاً لـ Firebase App Hosting) ما
عنده Application Default Credentials تلقائية. حوّل محتواه لسطر واحد (minify) وخزّنه
بأمان، بتحتاجه بالخطوة 4.

```bash
# أي جهاز عندك فيه node، لتحويل الملف لسطر واحد:
node -e "console.log(JSON.stringify(require('./service-account.json')))"
```

### ج) تأكد من DNS الدومين
وجّه A record (أو CNAME حسب ما تطلبه الاستضافة) لـ `empowerhub.tech` و `www` على IP
السيرفر المشترك، وفعّل SSL (عادة AutoSSL مجاني من cPanel بعد ما يصير الدومين نشط عليه).

---

## 1) بناء حزمة النشر محلياً (أو من أي بيئة بناء)

```bash
npm ci
npm run build          # next build — output: standalone مفعّل بـ next.config.js
```

أو ببساطة شغّل السكريبت الجاهز اللي بيسوي كل هالخطوات + يجمّع كل شي بمجلد واحد:

```bash
./scripts/build-for-cpanel.sh
```

بينتج:
- `dist-cpanel/` — المجلد الجاهز اللي لازم يترفع كامل.
- `dist-cpanel.zip` — نفس المجلد مضغوط، أسهل للرفع عبر File Manager.

**ليش فيه تجميع يدوي؟** وضع `output: standalone` في Next.js ينتج سيرفر Node خفيف
(`server.js`) مع `node_modules` مُختصرة تلقائياً داخل `.next/standalone`، لكنه **لا
ينسخ** `.next/static` ولا `public/` بنفسه — لازم تُنسخ يدوياً جنبه، وهذا بالضبط اللي
يسويه السكريبت.

---

## 2) إنشاء تطبيق Node.js في cPanel

1. سجّل دخول لـ cPanel → ابحث عن **"Setup Node.js App"**.
2. **Create Application**:
   - **Node.js version**: اختر `20.x` (أقرب نسخة متوفرة لـ 20).
   - **Application mode**: `Production`.
   - **Application root**: مثلاً `empowerhub` (مجلد داخل الحساب، مو بالضرورة `public_html`).
   - **Application URL**: اختر الدومين `empowerhub.tech` (أو الدومين الفرعي لو بتجرب أول مرة على subdomain).
   - **Application startup file**: `server.js`
3. اضغط **Create**. cPanel بينشئ المجلد ويعطيك أمر مثل:
   ```
   source /home/USERNAME/nodevenv/empowerhub/20/bin/activate && cd /home/USERNAME/empowerhub
   ```
   (احتفظ فيه، بتحتاجه إذا رديت تشغّل أوامر npm يدوياً من SSH).

---

## 3) رفع الملفات

### الطريقة أ — File Manager (الأسهل، بدون SSH)
1. افتح **File Manager** → روح لمجلد التطبيق اللي أنشأته (`empowerhub` مثلاً).
2. ارفع `dist-cpanel.zip`.
3. يمين الفأرة عليه → **Extract** داخل نفس المجلد.
4. تأكد إن `server.js` و `.next/` و `package.json` صاروا مباشرة داخل مجلد التطبيق
   (مو داخل مجلد فرعي زائد بعد فك الضغط). المشروع حالياً ما فيه مجلد `public/`
   (الأيقونة المفضّلة favicon.ico معرّفة داخل `src/app/` مباشرة حسب تعريف
   Next.js App Router) — إذا أضفتوا لاحقاً ملفات ثابتة بمجلد `public/` بجذر
   المشروع، السكريبت بينسخها تلقائياً.

### الطريقة ب — SFTP/SSH (لو حسابك فيه وصول SSH)
```bash
scp -r dist-cpanel/. USERNAME@empowerhub.tech:~/empowerhub/
```

---

## 4) ضبط متغيرات البيئة

ارجع لصفحة **Setup Node.js App** → افتح تطبيقك → قسم **Environment Variables**
→ أضف كل متغير من `.env.production.example` (الموجود بجذر المشروع) واحد واحد، أهمها:

| المتغير | القيمة |
|---|---|
| `NODE_ENV` | `production` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | محتوى ملف الـ service account كسطر JSON واحد (من الخطوة 0-ب) |
| `FIREBASE_PROJECT_ID` | `studio-4511819966-bc14f` |
| `FIREBASE_STORAGE_BUCKET` | `studio-4511819966-bc14f.firebasestorage.app` |
| `CRON_SECRET` | قيمة سرية عشوائية من اختيارك |

> بديل: بدل إدخالها بالواجهة، تقدر ترفع ملف `.env` فعلي داخل مجلد التطبيق (نفس
> مستوى `server.js`) — Node بيقرأه لو عندك `dotenv` محمّل، لكن الأسلم استخدام
> حقل Environment Variables اللي توفره الواجهة لأنه مضمون أكيد يوصل للعملية.

لا تلمس **Application startup file** ولا تضغط **"Run NPM Install"** — الحزمة
جاهزة ومبنية مسبقاً (`node_modules` مُضمّنة ضمن `.next/standalone`)، وتشغيل
npm install من جديد على استضافة مشتركة غالباً أبطأ وقد يفشل بسبب حدود الذاكرة.

---

## 5) التشغيل

ارجع لصفحة **Setup Node.js App** → اضغط **Restart** (أو **Start**) على التطبيق.
بعدها جرّب فتح `https://empowerhub.tech` — المفروض توصل للصفحة الرئيسية.

### لو ظهر خطأ 503 أو التطبيق ما يشتغل
- من **Setup Node.js App** → فتح التطبيق فيه رابط لسجلات الأخطاء (Error Log) — افتحه
  وشوف آخر سطور.
- الأسباب الشائعة:
  - `FIREBASE_SERVICE_ACCOUNT_KEY` ناقصة أو JSON غير صحيح (تأكد إنه سطر واحد كامل
    بين علامتي اقتباس، بدون أسطر جديدة).
  - الدومين الجديد مو مضاف في Firebase Authorized domains (تسجيل الدخول بيفشل
    بصمت أو برسالة `auth/unauthorized-domain`).
  - رفعت محتوى `dist-cpanel/` داخل مجلد فرعي إضافي بدل جذر مجلد التطبيق مباشرة.

---

## 6) الفحص اليومي للاشتراكات (Cron)

المسار `/api/cron/check-subscriptions` يتطلب رأس `Authorization` يطابق `CRON_SECRET`.
بما إنه مجرد رابط HTTP عام، يشتغل من أي مصدر جدولة بغض النظر عن نوع الاستضافة:

**خيار 1 — Cron Jobs من نفس cPanel** (الأبسط الآن إنك على cPanel):
cPanel → **Cron Jobs** → أضف مهمة يومية:
```bash
curl -s -X POST https://empowerhub.tech/api/cron/check-subscriptions \
  -H "Authorization: Bearer <نفس قيمة CRON_SECRET>"
```

**خيار 2 — GitHub Action** (إذا موجودة مسبقاً بالمشروع، راجع `.github/workflows/`):
نفس الفكرة، فقط حدّث الـ secret والرابط للدومين الجديد.

---

## 7) ملاحظة عن GitHub Actions القديم

`.github/workflows/deploy.yml` الحالي ينشر تلقائياً إلى **Firebase App Hosting** عند
push لبعض الفروع — وهذا مسار النشر القديم. بما إنكم انتقلتوا لاستضافة cPanel، هذا
الـ workflow ما عاد يعكس مكان الاستضافة الفعلي، ويفضل تعطيله أو تحويله لمجرد بناء
وتوليد `dist-cpanel.zip` كـ artifact بدل النشر لـ Firebase App Hosting. لم يُعدَّل
تلقائياً هنا تجنباً لتغيير سلوك CI دون طلب صريح — قرر وأخبرني إذا تبي أعدّله.

---

## ملخص الملفات المضافة لهذا النشر

- `scripts/build-for-cpanel.sh` — يبني ويجمّع `dist-cpanel/` و `dist-cpanel.zip`.
- `.env.production.example` — قائمة كل متغيرات البيئة المطلوبة وشرحها.
- `DEPLOYMENT.md` — هذا الملف.
