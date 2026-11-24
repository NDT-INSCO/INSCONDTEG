# INSCO — NDT & Engineering Services

الموقع التفاعلي لشركة إنسكو الدولية للخدمات والمقاولات: الفحوصات غير التدميرية
(NDT)، المعالجة الحرارية بعد اللحام (PWHT)، منصة خدمة العملاء، وأكاديمية إنسكو
الهندسية (مقررات، مكتبة EDB، معامل محاكاة، تقييم عملي، مستشار ذكي).

Interactive site for INSCO International Company for Services & Contracting:
NDT, PWHT, customer-service portal, and the INSCO engineering academy.

---

## التشغيل

يتطلب Node 22.13 أو أحدث.

```bash
npm install      # تثبيت الحزم
npm run dev      # معاينة على http://localhost:3000
npm run verify   # فحص الأنواع + الاختبارات + المكتبة + الروابط + البناء +فحص النشر
```

## النشر

**المصدر الفعلي للموقع هو مجلد `docs/` في الفرع `main`** (إعداد Pages:
*Deploy from a branch → main / docs*). أي تغيير في `src/` أو `public/` يجب أن
يُرفق بإعادة بناء المجلد:

```bash
npm run build && npm run site:check
```

سير العمل `.github/workflows/deploy.yml` يبني ويتحقق من نفس الشيء، لكنه لا يغذّي
الموقع ما دام مصدر Pages هو الفرع؛ تحويله إلى **GitHub Actions** خطوة يدوية في
إعدادات المستودع. سير `verify` يفشل إن دُفع تغيير مصدر دون تحديث `docs/`.

**https://ndt-insco.github.io/INSCONDTEG/**

الخطوات الكاملة (تفعيل Pages مرة واحدة، المسار، المستشار الذكي، حل المشكلات) في
[`documentation/DEPLOY_GITHUB_PAGES_AR.md`](documentation/DEPLOY_GITHUB_PAGES_AR.md).

## طلبات عروض الأسعار (RFQ)

النموذج لا يعرض «تم الاستلام» إلا بعد ردّ خادم برقم مرجعي بعد تسليم الطلب فعليًا.
بدون قناة مهيّأة يقول ذلك صراحة ويعطي العميل بريدًا وواتساب بنفس بياناته.
الإعداد الكامل (Apps Script مجاني أو بوابة `server.ts`) في
[`documentation/RFQ_AR.md`](documentation/RFQ_AR.md).

## بوابة إدارة الموقع

أيقونة المفتاح الصغيرة في تذييل الموقع تفتح بوابة الإدارة (`#admin`). يمكن
الدخول بكلمة المرور، أو ببصمة الإصبع أو Face ID على جهاز سُجّل عليه مفتاح مرور
(WebAuthn). بعد الدخول تعرض البوابة الطلبات المستلمة، وتتيح تحديث حالتها ونشر
إعلان باللغتين في الصفحة الرئيسية.

اضبط `ADMIN_PASSWORD` على الخادم وحده؛ لا توجد كلمة مرور افتراضية. مفتاح الموقع الرسمي
على GitHub Pages يحتفظ بـ[رابط الإدارة الحالي](https://inscondteg.vercel.app/#admin)
إلى أن يتم تهيئة خادم Production. يدعم [وضع الإدارة داخل GitHub Pages](documentation/DEPLOY_PAGES_ADMIN_AR.md)
تسجيل الدخول واللوحة كاملةً على `#admin` دون تحويل، مع Netlify Functions وقاعدة الإدارة الحالية.
لتشغيل الإدارة بدون اشتراك مدفوع، يدعم المشروع **Netlify Free + Turso Free (libSQL)**
ضمن حدود الباقتين. ويمكن أيضًا استخدام خادم Node بقرص دائم أو Vercel بخطة مناسبة.
انظر [دليل إعداد البوابة والنشر بالعربي](documentation/ADMIN_AR.md) للروابط والمتغيرات
واختبار الدخول قبل ربط المفتاح بالموقع العام.

## المستشار الذكي

`server.ts` بوابة صغيرة تحمل مفتاح Gemini وتقدّم `/api/ai/*`؛ المتصفح لا يرى أي
مفتاح. الموقع الثابت على Pages يعمل كاملاً بدونه — وتقول الواجهة ذلك بصراحة.
التفاصيل في [`documentation/AI_STUDIO_AR.md`](documentation/AI_STUDIO_AR.md).

## التوثيق

| الملف | المحتوى |
| --- | --- |
| `documentation/DEPLOY_GITHUB_PAGES_AR.md` | النشر على GitHub Pages خطوة بخطوة |
| `documentation/RFQ_AR.md` | تشغيل نموذج طلب عرض السعر فعليًا |
| `documentation/ADMIN_AR.md` | تفعيل لوحة الإدارة وربطها بالموقع المنشور |
| `documentation/STATUS_AR.md` | ما نُفِّذ وما بقي وأرقام المشروع |
| `documentation/AI_STUDIO_AR.md` | المستشار الذكي والتكلفة والنشر |
| `documentation/EDB_FORMAT_AR.md` | صيغة مكتبة EDB |
| `documentation/NDE_ED_REVIEW_AR.md` | إجراء مراجعة المحتوى |

## القواعد الثابتة

1. لا ادعاء اعتماد: مخرجات التعلم الذاتي ليست شهادات معتمدة.
2. لا مفاتيح في المتصفح ولا في المستودع.
3. الأرقام تُحسب من البيانات لا تُكتب يدوياً.
4. `npm run verify` هو بوابة الدمج.
5. أي ملف في `public/` يُستدعى عبر `publicUrl()` من `src/utils/publicUrl.ts`، لا بمسار
   يبدأ بـ `/`: الموقع منشور تحت `/INSCONDTEG/`، والمسار الجذري المطلق يعطي 404 على
   الصور وملفات PDF.
