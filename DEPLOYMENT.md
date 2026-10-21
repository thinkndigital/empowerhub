# نشر EmpowerHub على empowerhub.tech (استضافة cPanel مشتركة)

هذا الدليل لنشر نفس مشروع EmpowerHub (نفس مشروع Firebase الخلفي `studio-4511819966-bc14f`
للبيانات والمصادقة) على سيرفر جديد — استضافة مشتركة بلوحة تحكم cPanel، على دومين
`empowerhub.tech`، باستخدام Node.js 20 عبر ميزة "Setup Node.js App" (Phusion Passenger).
لا يوجد VPS ولا Docker ولا SSH هنا — الاعتماد **فقط على File Manager و"Setup Node.js
App"** من واجهة cPanel.

**طريقة العمل**: ترفع المشروع **كامل** (الكود المصدري + أدوات البناء)، وضغطة واحدة على
زر **"Run NPM Install"** بواجهة cPanel تقوم بتثبيت الحزم **وبناء المشروع تلقائياً**
(عن طريق `postinstall` script مُعدّ مسبقاً لهذا الغرض بالضبط) — بدون أي حاجة لـ Terminal.
جُرّب هذا بالكامل محلياً بنفس الخطوات (تثبيت نظيف + بناء تلقائي + تشغيل السيرفر
الناتج) قبل ما يُرسل لك.

---

## 0) تجهيزات لمرة واحدة قبل النشر

### أ) أضف الدومين الجديد في Firebase (إلزامي، وإلا تسجيل الدخول ما يشتغل)
Firebase Console → مشروع `studio-4511819966-bc14f` → Authentication → Settings
→ Authorized domains → **Add domain** → `empowerhub.tech`
(أضف أيضاً `www.empowerhub.tech` إذا بتستخدمه).

### ب) ولّد مفتاح حساب خدمة Firebase (Service Account)
Firebase Console → Project settings (⚙️) → Service accounts → **Generate new private key**.
يتنزّل ملف JSON — هذا يحتاجه السيرفر الجديد لأنه (خلافاً لـ Firebase App Hosting) ما
عنده Application Default Credentials تلقائية. حوّل محتواه لسطر واحد (minify) وخزّنه
بأمان، بتحتاجه بالخطوة 3.

```bash
# أي جهاز عندك فيه node، لتحويل الملف لسطر واحد:
node -e "console.log(JSON.stringify(require('./service-account.json')))"
```

### ج) تأكد من DNS الدومين
وجّه A record (أو CNAME حسب ما تطلبه الاستضافة) لـ `empowerhub.tech` و `www` على IP
السيرفر المشترك، وفعّل SSL (عادة AutoSSL مجاني من cPanel بعد ما يصير الدومين نشط عليه).

---

## 1) إنشاء تطبيق Node.js في cPanel

1. سجّل دخول لـ cPanel → ابحث عن **"Setup Node.js App"**.
2. **Create Application**:
   - **Node.js version**: اختر `20.x` (أقرب نسخة متوفرة لـ 20).
   - **Application mode**: `Production`.
   - **Application root**: مثلاً `empowerhub` (مجلد داخل الحساب، مو بالضرورة `public_html`).
   - **Application URL**: اختر الدومين `empowerhub.tech` (أو الدومين الفرعي لو بتجرب أول مرة على subdomain).
   - **Application startup file**: اتركه مؤقتاً أي قيمة، بترجع تعدّله بالخطوة 4 (لأن الملف الفعلي ما يكون موجود إلا بعد البناء).
3. اضغط **Create**.

---

## 2) رفع المشروع كامل

1. افتح **File Manager** → روح لمجلد التطبيق اللي أنشأته (`empowerhub` مثلاً).
2. ارفع ملف المشروع المضغوط (المرسل لك) وفك الضغط (**Extract**) داخل نفس المجلد.
3. تأكد إن `package.json` و `src/` و `next.config.js` و `.npmrc` صاروا مباشرة داخل
   مجلد التطبيق (مو داخل مجلد فرعي زائد بعد فك الضغط).

> المرفق **لا يحتوي** `node_modules/` ولا مجلد بناء جاهز — هذا مقصود، لأن
> التثبيت والبناء بيصيرا على السيرفر نفسه بالخطوة التالية.

---

## 3) ضبط متغيرات البيئة (قبل الضغط على npm install، مهم!)

ارجع لصفحة **Setup Node.js App** → افتح تطبيقك → قسم **Environment Variables**
→ أضف كل متغير من `.env.production.example` (الموجود بجذر المشروع)، وأهمها:

| المتغير | القيمة |
|---|---|
| `NODE_ENV` | `production` |
| `CPANEL_AUTOBUILD` | `1` ⚠️ **ضروري** — هذا هو المفتاح اللي يخلي `npm install` يبني المشروع تلقائياً بدل ما يكتفي بتثبيت الحزم فقط |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | محتوى ملف الـ service account كسطر JSON واحد (من الخطوة 0-ب) |
| `FIREBASE_PROJECT_ID` | `studio-4511819966-bc14f` |
| `FIREBASE_STORAGE_BUCKET` | `studio-4511819966-bc14f.firebasestorage.app` |
| `CRON_SECRET` | قيمة سرية عشوائية من اختيارك |

**احفظ (Save) المتغيرات قبل الانتقال للخطوة التالية** — إذا ضغطت "Run NPM Install"
قبل حفظ `CPANEL_AUTOBUILD=1`، التثبيت بيصير بس بدون بناء، وبترجع تضغط الزر من
جديد بعد ما تضيفه.

---

## 4) التثبيت والبناء (ضغطة زر واحدة)

من نفس صفحة التطبيق بـ **Setup Node.js App** → اضغط **"Run NPM Install"**.

هاي الخطوة وحدها بتسوي كل شي تلقائياً بالترتيب:
1. `npm install` (يثبّت كل الحزم، بما فيها أدوات البناء مثل TypeScript — بفضل
   ملف `.npmrc` المرفق اللي يضمن تثبيتها حتى مع `NODE_ENV=production`).
2. بعد التثبيت مباشرة، `postinstall` script يشوف `CPANEL_AUTOBUILD=1` ويشغّل
   `next build` تلقائياً.
3. ثم ينسخ ملفات الـ static assets للمكان الصحيح داخل `next-build/standalone/`.

هذي الخطوة بتاخذ عدة دقائق (10-15 دقيقة تقريباً حسب سرعة السيرفر) — لا تقفل
الصفحة لحد ما يخلص وتشوف رسالة النجاح بالأسفل.

**بعد ما يخلص**: تأكد إن مجلد `next-build/standalone/` صار موجود جوا مجلد
التطبيق (من File Manager) — فيه `server.js` و `node_modules/` خاصة فيه.

---

## 5) ضبط ملف التشغيل والتشغيل الفعلي

ارجع لإعدادات التطبيق بـ **Setup Node.js App**:
1. عدّل **Application startup file** إلى:
   ```
   next-build/standalone/server.js
   ```
2. احفظ، ثم اضغط **Restart** (أو **Start**).
3. جرّب فتح `https://empowerhub.tech` — المفروض توصل للصفحة الرئيسية.

### لو ظهر خطأ 503 أو التطبيق ما يشتغل
من **Setup Node.js App** → فتح التطبيق فيه رابط لسجلات الأخطاء (Error Log) — افتحه
وشوف آخر سطور. الأسباب الشائعة:
- نسيت تضيف `CPANEL_AUTOBUILD=1` قبل الضغط على "Run NPM Install"، فما صار بناء
  أصلاً — رجّع أضف المتغير واضغط "Run NPM Install" من جديد.
- `FIREBASE_SERVICE_ACCOUNT_KEY` ناقصة أو JSON غير صحيح (تأكد إنه سطر واحد كامل
  بين علامتي اقتباس، بدون أسطر جديدة).
- الدومين الجديد مو مضاف في Firebase Authorized domains (تسجيل الدخول بيفشل
  بصمت أو برسالة `auth/unauthorized-domain`).
- رفعت محتوى المشروع داخل مجلد فرعي إضافي بدل جذر مجلد التطبيق مباشرة.

### لو عملت تعديل على الكود لاحقاً
ارفع الملفات المعدّلة، ثم اضغط **"Run NPM Install"** مرة ثانية (بما إن
`CPANEL_AUTOBUILD=1` محفوظة أصلاً، بيعيد البناء تلقائياً)، ثم **Restart** للتطبيق.

---

## 6) الفحص اليومي للاشتراكات (Cron)

المسار `/api/cron/check-subscriptions` يتطلب رأس `Authorization` يطابق `CRON_SECRET`.
بما إنه مجرد رابط HTTP عام، يشتغل من أي مصدر جدولة بغض النظر عن نوع الاستضافة:

cPanel → **Cron Jobs** → أضف مهمة يومية:
```bash
curl -s -X POST https://empowerhub.tech/api/cron/check-subscriptions \
  -H "Authorization: Bearer <نفس قيمة CRON_SECRET>"
```

---

## 7) ملاحظة عن GitHub Actions القديم

`.github/workflows/deploy.yml` الحالي ينشر تلقائياً إلى **Firebase App Hosting** عند
push لبعض الفروع — وهذا مسار النشر القديم. بما إنكم انتقلتوا لاستضافة cPanel، هذا
الـ workflow ما عاد يعكس مكان الاستضافة الفعلي. لم يُعدَّل تلقائياً هنا تجنباً
لتغيير سلوك CI دون طلب صريح — قرر وأخبرني إذا تبي أعدّله أو أعطّله.

---

## بديل: بناء محلي وشحن النتيجة الجاهزة فقط

إذا صار عندك لاحقاً وصول SSH أو بيئة بناء منفصلة (مثلاً هاي الجلسة)، فيه سكريبت
جاهز يبني محلياً ويطلع لك فقط النتيجة النهائية الجاهزة للتشغيل (`dist-cpanel.zip`،
أصغر حجماً وأسرع رفع لأنه بدون أدوات بناء):

```bash
./scripts/build-for-cpanel.sh
```

هذا بديل عن أسلوب "ارفع كامل وشغّل Run NPM Install" أعلاه، مو إضافة له — استخدم
واحد منهم بس.

---

## ملخص الملفات المضافة لهذا النشر

- `.npmrc` — يضمن تثبيت أدوات البناء (TypeScript) حتى مع `NODE_ENV=production`.
- `scripts/postinstall-gate.js` + `scripts/postbuild-cpanel.sh` — يشغّلان البناء
  تلقائياً بعد `npm install` فقط عند وجود `CPANEL_AUTOBUILD=1` (ما يأثر على التطوير
  المحلي ولا على GitHub Actions الحالي).
- `scripts/build-for-cpanel.sh` — البديل للبناء المحلي (راجع القسم أعلاه).
- `.env.production.example` — قائمة كل متغيرات البيئة المطلوبة وشرحها.
- `DEPLOYMENT.md` — هذا الملف.
