# النشر على Vercel — الوضع الحقيقي

> سؤال هذا الملف: **`vercel.json` كان موجوداً في المستودع من زمن… فهل الموقع منشور
> على Vercel؟** كان الجواب: **لا** — والآن: **نعم**، على <https://inscondteg.vercel.app>.

## ما حدث بالترتيب

1. محاولة إنشاء المشروع رجعت أولاً برسالة Vercel:

   ```text
   To link a GitHub repository, you need to install the GitHub integration first.
   ```

   أي أن تطبيق Vercel على GitHub لم يكن مركَّباً على حساب `NDT-INSCO` — وخطوة التفويض
   هذه يملكها مالك الحساب وحده: <https://github.com/apps/vercel/installations/new>.
2. بعد تركيب التطبيق أُنشئ المشروع ورُبط بالمستودع، ونُشر أول نشر إنتاجي.

| العنصر | القيمة |
| --- | --- |
| المشروع | `inscondteg` · `prj_EZ8Wuf2ypYHt4KKe2XetVo6pwW7w` |
| الفريق | `ndt-insco's projects` (`team_JooGvQDMhwDLLTIvOHsJMilR`) |
| المستودع | `NDT-INSCO/INSCONDTEG` · فرع الإنتاج `main` |
| أول نشر إنتاجي | `dpl_7fTNWnwiEvXVzsucgEW8rQcB6gQe` — **READY** ومُرقَّى (`PROMOTED`) |
| آخر نشر إنتاجي | `dpl_HHNH26pUAFumDehMgcDFPx11Rs75` من الالتزام `5762fbe` — **READY** ومُرقَّى، والنطاق مُسنَد |
| الرابط العام | <https://inscondteg.vercel.app> |

**مُتحقَّق منه فعلياً:** الصفحة الرئيسية تُقرأ من Vercel بلا تسجيل دخول، ودالة
`api/insco.ts` تعمل: `GET /api/site/announcement` يرجّع `{"message":null}` — وهذا هو
الشيء الذي لا تستطيعه GitHub Pages أصلاً.

## دالتان الآن، لا واحدة

| الدالة | المسارات | ماذا تخدم |
| --- | --- | --- |
| `api/insco.ts` | `/api/admin/*` · `/api/site/announcement` · `/api/rfq` | الإدارة والبيانات الوصفية وطلب العرض |
| `api/ai.ts` | `/api/ai/*` | المدرّس والمستشار ومدير الموقع ومساعدة المجتمع |

الدالة الثانية أُضيفت لأن الأولى كانت وحدها على Vercel، فكل نداء إلى `/api/ai/*`
كان يعيد 404، والواجهة تصفه خطأً بأن «`GEMINI_API_KEY` غير مضبوط». البوابتان
تستخدمان نفس الملف `server/ai/gateway.ts`، فلا توجد نسختان تتباعدان.

المفتاح المطلوب للثانية: `GEMINI_API_KEY` في **Environment Variables** (Production
وPreview) ثم **Redeploy** — المتغيّر لا يصل إلى نشر قائم.

## ملاحظتان يجب أن تُقالا بوضوح

1. **رابط كل نشر محمي، والنطاق الثابت عام.** إعداد الفريق الافتراضي هو
   «Vercel Authentication: كل النشرات عدا النطاقات المخصصة»، فرابط مثل
   `inscondteg-q34xqlu7p-ndt-insco.vercel.app` يطلب تسجيل دخول Vercel.
   النطاق الإنتاجي `inscondteg.vercel.app` **عام ويعمل** (تحقّقنا منه). إن أردت أن تكون
   نشرات المعاينة عامة أيضاً: Project → Settings → Deployment Protection.
2. **النشر التلقائي يعمل فعلاً — خلافاً لما ظنّيناه أول الأمر.** بعد دمج PR #40 ظهر
   نشر إنتاجي جديد من الالتزام `5762fbe` وأصبح **READY** ثم `PROMOTED`، وأُسنِد النطاق
   إليه تلقائياً؛ كما ظهر نشر معاينة لكل PR (`Vercel` check على PR #40). بيانات المشروع
   تحمل `gitProviderOptions.createDeployments: "disabled"` — وهي **مضلِّلة ولا تعبّر عن
   السلوك الفعلي**، والسلوك الفعلي هو المرجع: كل دفع إلى `main` ينشر إنتاجياً، وكل PR
   يحصل على معاينة. لا تحتاج إلى نشر الكود يدويًا، لكن حفظ متغيّرات **Production**
   لا يغيّر نسخة منشورة سابقًا؛ أعد النشر بعد اكتمال إعدادها.

**جاهزية الإدارة منفصلة عن حالة `READY`.** إذا ظهر «بوابة الإدارة غير مهيّأة»،
راجع [إعداد الإدارة على Vercel](ADMIN_AR.md). بعد ضبط متغيّرات الإنتاج وإعادة النشر،
شغّل `npm run admin:check -- https://inscondteg.vercel.app`، ثم اختبر الدخول والخروج
قبل ربط نطاق Vercel بالمفتاح في الموقع العام.

## إعدادات `vercel.json` التي بُني عليها فعلاً:

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

## النشر بعد تعديل الكود

```bash
npx vercel --prod        # من جهاز مربوط بالمشروع
```

أو من لوحة Vercel: **Deployments → Redeploy** على آخر التزام، أو تفعيل البناء التلقائي
من إعدادات Git كما في النقطة 2 أعلاه.

## ما زال مطلوباً خارج Vercel

**قواعد Firebase** (`firestore.rules` و`storage.rules`) لا ينشرها أي استضافة —
[FIREBASE_RULES_DEPLOY_AR.md](FIREBASE_RULES_DEPLOY_AR.md).
