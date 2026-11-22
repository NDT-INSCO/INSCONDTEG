# النشر على Vercel — الوضع الحقيقي والخطوة الواحدة الناقصة

> سؤال هذا الملف: **`vercel.json` موجود في المستودع من زمن… فهل الموقع منشور على
> Vercel؟** الجواب الصادق: **لا.** لم يُنشأ مشروع Vercel لهذا المستودع قطّ.

## ما جُرِّب فعلاً (ولماذا توقّف)

محاولة إنشاء المشروع وربطه بالمستودع (`NDT-INSCO/INSCONDTEG`) رجعت من Vercel برسالة:

```text
To link a GitHub repository, you need to install the GitHub integration first.
```

أي أن **تطبيق Vercel على GitHub غير مركَّب على حساب/مستودع `NDT-INSCO`**. وهذه الخطوة
لا يمكن أن يقوم بها إلا مالك حساب GitHub (تفويض تطبيق خارجي على المستودع) — ولا تُنفَّذ
من طرف ثالث.

## الخطوة الواحدة المطلوبة

1. افتح: <https://github.com/apps/vercel/installations/new>
2. اختر الحساب `NDT-INSCO` ← **Only select repositories** ← `INSCONDTEG` ← **Install**.

بعد هذه الخطوة يصبح إنشاء المشروع والنشر ممكناً من أي جلسة عمل، بدون أي إعداد آخر،
لأن `vercel.json` في المستودع يضبط كل شيء مسبقاً:

| الإعداد في `vercel.json` | القيمة | لماذا |
| --- | --- | --- |
| `framework` | `vite` | المشروع Vite + React |
| `installCommand` | `npm ci` | نفس ما يستخدمه CI، بناء قابل للتكرار |
| `buildCommand` | `npm run build:vercel` | يضبط `SITE_BASE=/` و`INSCO_HOSTED_BUILD=1` لأن Vercel ينشر على الجذر لا على `/INSCONDTEG/` |
| `outputDirectory` | `dist` | مخرج Vite (وليس `docs/` الخاص بـPages) |
| `rewrites` | `/api/{rfq,site/announcement,admin/*}` → `/api/insco` | يجعل `api/insco.ts` دالة serverless واحدة بعدة مسارات |

و`.vercelignore` يستثني `docs/` و`dist/` و`.env*` وملفات الإدارة المحلية، فلا يُرفع أثر
بناء قديم ولا سرّ.

## ما الذي يضيفه Vercel على GitHub Pages؟

- **دوال serverless**: `api/insco.ts` (منصة عروض الأسعار والإعلانات) **لا تعمل على
  GitHub Pages** لأنه استضافة ثابتة. هذه هي الميزة الحقيقية، لا مجرد رابط أنظف.
- رابط منفصل عن `ndt-insco.github.io`، مع `X-Robots-Tag: noindex` (مضبوط في
  `vercel.json`) حتى لا تنافس النسخة التجريبية الموقع الرسمي في نتائج البحث.

## ما لا يعالجه Vercel إطلاقاً

**قواعد Firebase.** تغيير الاستضافة لا ينشر `firestore.rules` ولا `storage.rules`؛
هذه تخصّ مشروع Firebase نفسه — راجع [FIREBASE_RULES_DEPLOY_AR.md](FIREBASE_RULES_DEPLOY_AR.md).
موقع يعمل على Vercel ويرفض الخادم كل كتابة = نفس المشكلة ووجه جديد.

## بعد تركيب التطبيق

```bash
# من أي جهاز فيه Vercel CLI وصلاحية على الحساب
npx vercel link      # يربط المجلد بمشروع inscondteg
npx vercel --prod    # أول نشر إنتاجي
```

أو من لوحة Vercel: **Add New… → Project → Import** المستودع `NDT-INSCO/INSCONDTEG`؛
سيقرأ `vercel.json` وحده ويبني تلقائياً.
