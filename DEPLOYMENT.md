# نشر EmpowerHub على empowerhub.tech (استضافة cPanel مشتركة)

هذا الدليل لنشر نفس مشروع EmpowerHub — **بنفس الباك إند (Firestore + Firebase Auth من
مشروع `studio-4511819966-bc14f`)**، بدون أي تغيير عليه — على سيرفر جديد: استضافة
مشتركة بلوحة تحكم cPanel، على دومين `empowerhub.tech`، باستخدام Node.js 20 عبر ميزة
"Setup Node.js App" (Phusion Passenger / CloudLinux NodeJS Selector). لا يوجد VPS ولا
Docker ولا SSH هنا — الاعتماد **فقط على File Manager و"Setup Node.js App"** من واجهة
cPanel.

> **ملاحظة مهمة**: "نقل المشروع من Firebase" هنا يعني بس نقل **مكان استضافة التطبيق
> نفسه** (كان على Firebase App Hosting، هلأ عم ينتقل لـ cPanel). قاعدة البيانات
> (Firestore) ونظام تسجيل الدخول (Firebase Auth) **بيضلوا زي ما هم بالضبط** — هذا
> المشروع مبني بالكامل عليهم، وإزالتهم تعني إعادة كتابة الباك إند من الصفر، مو جزء
> من هالنشر.

الملف المرفق (`empowerhub-full.zip`) فيه **كل شي سوا**: الكود المصدري الكامل **+**
نسخة جاهزة ومبنية مسبقاً للتشغيل الفوري (`next-build/standalone/`) — جُربت فعلياً
(استخراج نظيف من نفس الملف المرفق، تشغيل `server.js`، واستجابة HTTP 200 على الصفحة
الرئيسية ولوحة التحكم) قبل ما يُرسل لك.

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
node -e "console.log(JSON.stringify(require('./service-account.json')))"
```

### ج) تأكد من DNS الدومين
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

## 3) ضبط متغيرات البيئة

ارجع لصفحة **Setup Node.js App** → افتح تطبيقك → قسم **Environment Variables**.

**احذف أي متغيرات قديمة مالها علاقة بهالمشروع** إذا موجودة من محاولة سابقة (مثل
`DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_SOCKET` الخاصة بـ MySQL، أو `APP_URL`
مكررة) — هذا المشروع يستخدم Firestore، مو MySQL.

أضف المتغيرات التالية (الموجودة أيضاً بملف `.env.production.example` المرفق):

| المتغير | القيمة |
|---|---|
| `NODE_ENV` | `production` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | محتوى ملف الـ service account كسطر JSON واحد (من الخطوة 0-ب) |
| `FIREBASE_PROJECT_ID` | `studio-4511819966-bc14f` |
| `FIREBASE_STORAGE_BUCKET` | `studio-4511819966-bc14f.firebasestorage.app` |
| `CRON_SECRET` | قيمة سرية عشوائية من اختيارك |

**لا تضغط "Run NPM Install"** — الملف المرفق جاهز ومبني مسبقاً، ما في داعي.

---

## 4) التشغيل

ارجع لصفحة **Setup Node.js App** → اضغط **Restart** (أو **Start**) على التطبيق.
بعدها جرّب فتح `https://empowerhub.tech` — المفروض توصل للصفحة الرئيسية، فارغة
وجاهزة لتعبئة بياناتك من جديد.

### لو ظهر خطأ 503 أو التطبيق ما يشتغل
من **Setup Node.js App** → فتح التطبيق فيه رابط لسجلات الأخطاء (Error Log) — افتحه
وشوف آخر سطور. الأسباب الشائعة:
- **Application startup file** مو مضبوط بالضبط على `next-build/standalone/server.js`.
- `FIREBASE_SERVICE_ACCOUNT_KEY` ناقصة أو JSON غير صحيح (تأكد إنه سطر واحد كامل
  بين علامتي اقتباس، بدون أسطر جديدة).
- الدومين الجديد مو مضاف في Firebase Authorized domains (تسجيل الدخول بيفشل
  بصمت أو برسالة `auth/unauthorized-domain`).
- رفعت محتوى المشروع داخل مجلد فرعي إضافي بدل جذر مجلد التطبيق مباشرة.

---

## 5) لو عملت تعديل على الكود لاحقاً

الطريقة الأسهل: اطلب نسخة محدّثة من `empowerhub-full.zip` (نفس طريقة التجهيز)،
وكرّر الخطوة 2 (رفع واستخراج فوق الملفات القديمة) ثم **Restart**.

بديل (لمن عنده استعداد يستخدم "Run NPM Install" لإعادة البناء مباشرة من السيرفر):
المشروع فيه `postinstall` script جاهز يبني تلقائياً لما تضيف متغير بيئة
`CPANEL_AUTOBUILD=1` وتضغط "Run NPM Install" — بس لازم تتأكد إنه ما فيه
`node_modules` حقيقي بجذر مجلد التطبيق قبل ما تضغط الزر (نفس تحذير القسم 2).

---

## 6) الفحص اليومي للاشتراكات (Cron)

المسار `/api/cron/check-subscriptions` يتطلب رأس `Authorization` يطابق `CRON_SECRET`.

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

## ملخص الملفات

- `empowerhub-full.zip` (مرسل لك مباشرة) — السورس كود الكامل + النسخة الجاهزة
  للتشغيل الفوري سوا، بدون أي `node_modules` بجذر المشروع.
- `.npmrc` — يضمن تثبيت أدوات البناء (TypeScript) حتى مع `NODE_ENV=production`،
  يُستخدم فقط لو رجعت تعيد البناء عبر "Run NPM Install" لاحقاً.
- `scripts/postinstall-gate.js` + `scripts/postbuild-cpanel.sh` — يشغّلان البناء
  تلقائياً بعد `npm install` فقط عند وجود `CPANEL_AUTOBUILD=1`.
- `scripts/build-for-cpanel.sh` — سكريبت بناء محلي بديل (لو احتجته من بيئة بناء
  منفصلة مستقبلاً).
- `.env.production.example` — قائمة كل متغيرات البيئة المطلوبة وشرحها.
- `DEPLOYMENT.md` — هذا الملف.
