# INSCO — NDT & Engineering Services

الموقع التفاعلي لشركة إنسكو الدولية للخدمات والمقاولات: الفحوصات غير التدميرية
(NDT)، المعالجة الحرارية بعد اللحام (PWHT)، منصة خدمة العملاء، وأكاديمية إنسكو
الهندسية (مقررات، مكتبة EDB، معامل محاكاة، تقييم عملي، مستشار ذكي).

Interactive site for INSCO International Company for Services & Contracting:
NDT, PWHT, customer-service portal, and the INSCO engineering academy.

---

## التشغيل

يتطلب Node 22 أو أحدث.

```bash
npm install      # تثبيت الحزم
npm run dev      # معاينة على http://localhost:3000
npm run verify   # فحص الأنواع + الاختبارات + المكتبة + الروابط + البناء +فحص النشر
```

## النشر

الموقع يُنشر على GitHub Pages عبر سير العمل `.github/workflows/deploy.yml`، ويُبنى
من المصدر في كل دفع إلى `main`:

**https://ndt-insco.github.io/INSCONDT/**

الخطوات الكاملة (تفعيل Pages مرة واحدة، المسار، المستشار الذكي، حل المشكلات) في
[`documentation/DEPLOY_GITHUB_PAGES_AR.md`](documentation/DEPLOY_GITHUB_PAGES_AR.md).

## المستشار الذكي

`server.ts` بوابة صغيرة تحمل مفتاح Gemini وتقدّم `/api/ai/*`؛ المتصفح لا يرى أي
مفتاح. الموقع الثابت على Pages يعمل كاملاً بدونه — وتقول الواجهة ذلك بصراحة.
التفاصيل في [`documentation/AI_STUDIO_AR.md`](documentation/AI_STUDIO_AR.md).

## التوثيق

| الملف | المحتوى |
| --- | --- |
| `documentation/DEPLOY_GITHUB_PAGES_AR.md` | النشر على GitHub Pages خطوة بخطوة |
| `documentation/STATUS_AR.md` | ما نُفِّذ وما بقي وأرقام المشروع |
| `documentation/AI_STUDIO_AR.md` | المستشار الذكي والتكلفة والنشر |
| `documentation/EDB_FORMAT_AR.md` | صيغة مكتبة EDB |
| `documentation/NDE_ED_REVIEW_AR.md` | إجراء مراجعة المحتوى |

## القواعد الثابتة

1. لا ادعاء اعتماد: مخرجات التعلم الذاتي ليست شهادات معتمدة.
2. لا مفاتيح في المتصفح ولا في المستودع.
3. الأرقام تُحسب من البيانات لا تُكتب يدوياً.
4. `npm run verify` هو بوابة الدمج.
