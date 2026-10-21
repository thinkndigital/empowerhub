# نشر EmpowerHub على empowerhub.tech (استضافة cPanel مشتركة)

هذا الدليل لنشر مشروع EmpowerHub — **بباك إند MySQL ذاتي الاستضافة بالكامل (بدون
Firebase نهائياً)** — على استضافة مشتركة بلوحة تحكم cPanel، على دومين
`empowerhub.tech`، باستخدام Node.js 20 عبر ميزة "Setup Node.js App" (Phusion
Passenger / CloudLinux NodeJS Selector). لا يوجد VPS ولا Docker ولا SSH هنا —
الاعتماد **فقط على File Manager، phpMyAdmin، و"Setup Node.js App"** من واجهة cPanel.

> **ملاحظة مهمة**: المشروع لا يعتمد على Firebase بأي شكل — لا Firestore، لا
> Firebase Auth، لا Firebase Storage. قاعدة البيانات MySQL (مُدارة عبر Drizzle
> ORM)، تسجيل الدخول عبر JWT موقّع ذاتياً، والملفات المرفوعة تُخزَّن على قرص
> السيرفر نفسه وتُعرض من مسار `/api/files/...`.

الملف المرفق (`empowerhub-full.zip`) فيه **كل شي سوا**: الكود المصدري الكامل **+**
نسخة جاهزة ومبنية مسبقاً للتشغيل الفوري (`next-build/standalone/`).

---

## 0) تجهيزات لمرة واحدة قبل النشر

### أ) تأكد من وجود قاعدة بيانات MySQL
من cPanel → **MySQL Databases** (أو **MySQL Database Wizard**) أنشئ قاعدة بيانات
ومستخدم MySQL (إذا لم يكونا موجودين أصلاً) وامنح المستخدم كل الصلاحيات على
القاعدة. سجّل اسم القاعدة، اسم المستخدم، وكلمة المرور — تحتاجها بالخطوة 3.

### ب) تأكد من DNS الدومين
وجّه A record (أو CNAME حسب ما تطلبه الاستضافة) لـ `empowerhub.tech` و `www` على IP
السيرفر المشترك، وفعّل SSL (عادة AutoSSL مجاني من cPanel بعد ما يصير الدومين نشط عليه).

---

## 1) إنشاء تطبيق Node.js في cPanel

1. سجّل دخول لـ cPanel → ابحث عن **"Setup Node.js App"**.
2. **إذا عندك تطبيق قديم بنفس الاسم من محاولة سابقة فيه مشاكل (مثل خطأ node_modules
   أدناه)** — احذفه (Delete App) وابدأ تطبيق جديد نظيف، أسهل من محاولة إصلاحه.
3. **Create Application**:
   - **Node.js version**: `20.x` (أقرب نسخة متوفرة لـ 20).
   - **Application mode**: `Production`.
   - **Application root**: مثلاً `empowerhub_app` (مجلد داخل الحساب، مو بالضرورة `public_html`).
   - **Application URL**: `empowerhub.tech`.
   - **Application startup file**: `next-build/standalone/server.js`
     (⚠️ مو `dist/server.js` ولا `server.js` لوحده — المسار الصحيح بالضبط هو هذا).
4. اضغط **Create**.

---

## 2) رفع الملفات

1. افتح **File Manager** → روح لمجلد التطبيق اللي أنشأته (`empowerhub_app`).
2. ارفع `empowerhub-full.zip` → يمين الفأرة عليه → **Extract** داخل نفس المجلد.
3. تأكد إن `package.json` و `src/` و `next-build/` صاروا مباشرة داخل مجلد التطبيق
   (مو داخل مجلد فرعي زائد بعد فك الضغط).
4. **أنشئ مجلد رفع الملفات خارج `next-build/`** — مثلاً مجلد شقيق لمجلد التطبيق
   نفسه، مثل `/home/username/empowerhub-uploads` — لأن `next-build/` يُستبدل
   بالكامل عند كل نشر جديد، وأي ملفات مرفوعة بداخله ستُفقد. ستحتاج هذا المسار
   بالخطوة 3 (`UPLOADS_DIR`).

### ⚠️ عن خطأ "Cloudlinux NodeJS Selector demands to store node modules..."
هاي الرسالة تظهر لو صار فيه مجلد اسمه `node_modules` **مباشرة بجذر مجلد التطبيق**
(يعني `empowerhub_app/node_modules`) — لأن CloudLinux بده يحط symlink خاص فيه بنفس
الاسم بنفس المكان، وما بيقدر لو فيه مجلد حقيقي أصلاً هناك.

**الملف المرفق ما فيه هالمشكلة** — صممته خصيصاً بدون أي `node_modules` بجذر
المشروع؛ النسخة الجاهزة للتشغيل موجودة بمجلد فرعي (`next-build/standalone/node_modules`)
مو بالجذر، فما يصير تعارض. لو واجهت هالخطأ تحديداً، يعني فيه `node_modules` قديم
باقي بجذر مجلد التطبيق من محاولة سابقة — احذفه يدوياً من File Manager (مو
`next-build/standalone/node_modules`، هذاك خليه زي ما هو).

---

## 3) استيراد جداول قاعدة البيانات

1. افتح **phpMyAdmin** من cPanel → اختر قاعدة البيانات التي أنشأتها بالخطوة 0-أ.
2. تبويب **Import** → اختر ملف `schema.sql` (موجود بجذر المشروع المرفق) → **Go**.
3. تأكد من ظهور الجداول (36+ جدول) في قائمة الجداول على اليسار بدون أي رسالة خطأ.

هذه الخطوة **مرة واحدة فقط** عند أول نشر على قاعدة بيانات فارغة. لا تُعِد استيراد
`schema.sql` على قاعدة تحتوي بيانات حقيقية بالفعل — فقط عند الإعداد الأولي.

---

## 4) ضبط متغيرات البيئة

ارجع لصفحة **Setup Node.js App** → افتح تطبيقك → قسم **Environment Variables**.

أضف المتغيرات التالية (الموجودة أيضاً بملف `.env.production.example` المرفق):

| المتغير | القيمة |
|---|---|
| `NODE_ENV` | `production` |
| `DB_NAME` | اسم قاعدة بيانات MySQL (من الخطوة 0-أ) |
| `DB_USER` | اسم مستخدم MySQL |
| `DB_PASSWORD` | كلمة مرور مستخدم MySQL |
| `DB_SOCKET` | عادة `/var/lib/mysql/mysql.sock` (أو احذفه واستخدم `DB_HOST`/`DB_PORT` إذا لم يكن متوفراً) |
| `JWT_SECRET` | قيمة سرية عشوائية طويلة من اختيارك — لا تغيّرها بعد النشر |
| `UPLOADS_DIR` | المسار المطلق لمجلد رفع الملفات من الخطوة 2-4، مثلاً `/home/username/empowerhub-uploads` |
| `CRON_SECRET` | قيمة سرية عشوائية من اختيارك |

**لا تضغط "Run NPM Install"** — الملف المرفق جاهز ومبني مسبقاً، ما في داعي.

---

## 5) التشغيل

ارجع لصفحة **Setup Node.js App** → اضغط **Restart** (أو **Start**) على التطبيق.
بعدها جرّب فتح `https://empowerhub.tech` — المفروض توصل للصفحة الرئيسية، فارغة
وجاهزة لتعبئة بياناتك من جديد. أنشئ أول حساب مشرف عبر `/setup`.

### لو ظهر خطأ 503 أو التطبيق ما يشتغل
من **Setup Node.js App** → فتح التطبيق فيه رابط لسجلات الأخطاء (Error Log) — افتحه
وشوف آخر سطور. الأسباب الشائعة:
- **Application startup file** مو مضبوط بالضبط على `next-build/standalone/server.js`.
- متغيرات `DB_*` ناقصة أو غير صحيحة (تحقق من اسم القاعدة/المستخدم/كلمة المرور
  من phpMyAdmin).
- `schema.sql` لم يُستورد بعد (الصفحة تفتح لكن أي عملية تسجيل/دخول تفشل بخطأ
  قاعدة بيانات).
- `UPLOADS_DIR` غير محدد، أو يشير لمسار داخل `next-build/` (سيُفقد عند أي نشر لاحق).
- رفعت محتوى المشروع داخل مجلد فرعي إضافي بدل جذر مجلد التطبيق مباشرة.

---

## 6) لو عملت تعديل على الكود لاحقاً

الطريقة الأسهل: اطلب نسخة محدّثة من `empowerhub-full.zip` (نفس طريقة التجهيز)،
وكرّر الخطوة 2 (رفع واستخراج فوق الملفات القديمة) ثم **Restart**. لا حاجة لإعادة
استيراد `schema.sql` إلا إذا تغيّر هيكل الجداول فعلياً (راجع التغييرات أولاً).

بديل (لمن عنده استعداد يستخدم "Run NPM Install" لإعادة البناء مباشرة من السيرفر):
المشروع فيه `postinstall` script جاهز يبني تلقائياً لما تضيف متغير بيئة
`CPANEL_AUTOBUILD=1` وتضغط "Run NPM Install" — بس لازم تتأكد إنه ما فيه
`node_modules` حقيقي بجذر مجلد التطبيق قبل ما تضغط الزر (نفس تحذير القسم 2).

---

## 7) الفحص اليومي للاشتراكات (Cron)

المسار `/api/cron/check-subscriptions` يتطلب رأس `Authorization` يطابق `CRON_SECRET`.

cPanel → **Cron Jobs** → أضف مهمة يومية:
```bash
curl -s -X POST https://empowerhub.tech/api/cron/check-subscriptions \
  -H "Authorization: Bearer <نفس قيمة CRON_SECRET>"
```

---

## 8) ملاحظة عن GitHub Actions القديم

`.github/workflows/deploy.yml` إذا كان لا يزال ينشر تلقائياً إلى **Firebase App
Hosting** عند push لبعض الفروع، فهذا مسار نشر قديم لم يُعدَّل تلقائياً هنا تجنباً
لتغيير سلوك CI دون طلب صريح — قرر وأخبرني إذا تبي أعدّله أو أعطّله.

---

## ملخص الملفات

- `empowerhub-full.zip` (مرسل لك مباشرة) — السورس كود الكامل + النسخة الجاهزة
  للتشغيل الفوري سوا، بدون أي `node_modules` بجذر المشروع.
- `schema.sql` — جداول قاعدة البيانات الكاملة، للاستيراد عبر phpMyAdmin مرة واحدة
  (الخطوة 3).
- `.npmrc` — يضمن تثبيت أدوات البناء (TypeScript) حتى مع `NODE_ENV=production`،
  يُستخدم فقط لو رجعت تعيد البناء عبر "Run NPM Install" لاحقاً.
- `scripts/postinstall-gate.js` + `scripts/postbuild-cpanel.sh` — يشغّلان البناء
  تلقائياً بعد `npm install` فقط عند وجود `CPANEL_AUTOBUILD=1`.
- `scripts/build-for-cpanel.sh` — سكريبت بناء محلي بديل (لو احتجته من بيئة بناء
  منفصلة مستقبلاً).
- `.env.production.example` — قائمة كل متغيرات البيئة المطلوبة وشرحها.
- `DEPLOYMENT.md` — هذا الملف.
