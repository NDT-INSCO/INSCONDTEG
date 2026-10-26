# نقطة البداية للمطور الجديد — INSCO Academy

> ابدأ هنا. هذا الملف هو المدخل (5 دقائق) قبل الغوص في `HANDOVER_AR.md`.

## 1. ما هو المشروع؟
موقع INSCO (React/Vite + Express) مع **أكاديمية NDT/PWHT** (8 مجالات، 23 درساً تأسيسياً، 6 معامل، لوحة متصدرين، شهادات).

## 2. تشغيل (3 أوامر)
```bash
npm ci
cp .env.example .env   # ضع GEMINI_API_KEY (خادم فقط)
npm run dev            # http://localhost:3000
```
التحقق: `npm run verify` (lint + test + build).

## 3. أين ماذا؟
| ماذا | أين |
|---|---|
| حاوية الأكاديمية + التبويبات | `src/components/EducationalAcademy.tsx` |
| مكتبة الدروس (نقطة الدخول) | `src/components/academy/AcademyKnowledgeLibrary.tsx` |
| خريطة الاستكمال | `src/components/academy/AcademyDevelopmentRoadmap.tsx` |
| 23 درساً تأسيسياً | `src/data/academyKnowledge.ts` |
| 8 مجالات + 6 معامل | `src/data/academyCurriculum.ts` + `curriculum/disciplines/*.ts` |
| تتبع التقدم | `src/utils/curriculumProgress.ts` |
| الاختبارات | `tests/academy.test.tsx` (13 اختبار) |

## 4. قواعد ذهبية (لا تكسرها)
1. **لا تنسخ أكواد مدفوعة** أو بنوك امتحانات رسمية.
2. **الشهادات ≠ اعتماد** — أعد تسميتها "إفادة تعلم ذاتي".
3. **المحاكاة ≠ قرار تشغيل** (PWHT/عمر متبقي).
4. **الأكواد**: حدد إصدار العقد («أحدث» ليس بالضرورة المطلوب).
5. **التقدم محلي** (localStorage) — لا تخلط مع تقدم المنهج.
6. **AI/Video** لا تعمل على GitHub Pages (تحتاج Node/WebSocket).
7. **Node 24.12+** موصى (بيئة العمل 22 يعمل مع تحذير).
8. دعم **RTL/LTR** (isAr) + تصميم كحلي/ذهبي.

## 5. ترتيب الشغل (P1→P4)
- **P1**: دمج مكتبة المراجع + دروس من فرع 77528e83 (cherry-pick) + إعادة تسمية الشهادات.
- **P2**: تحويل VT/PT/MT/UT إلى مقررات فعلية (VT أولاً كنموذج).
- **P3**: تقييم عملي موثق + CMS + مزامنة.
- **P4**: ترجمات + وسائط + اختبارات متصفح + استضافة Node.

## 6. نموذج VT (ابدأ هنا)
- أضف دروس VT (مبدأ، تطبيق، حدود، مثال، سؤال) في `academyKnowledge.ts`.
- أضف وحدات VT في `curriculum/disciplines/conventionalNdt.ts`.
- حدّث `ACADEMY_REVIEW_AR.md` و `AcademyDevelopmentRoadmap` عند الإكمال.
- حافظ على فصل تقدم التعلم عن ادعاء الاعتماد.

## 7. التحقق قبل كل دفع
```bash
npm run verify
```
ويشغّل: `tsc --noEmit` ← كل الاختبارات (7 مجموعات) ← `edb:check` ← `vite build`.

## 7.1 ما أُضيف بعد آخر تحديث

- **مقررات NDE-Ed**: 7 مقررات / 35 درساً في `src/data/ndeEd/` مع مصادر
  `nde-ed.org` (77 رابطاً) — تبويب `courses`.
- **مكتبة EDB**: 18 مستنداً (11 كتاباً + 7 مقررات) في `public/edb/` — تبويب `edb`.
  التوثيق: `documentation/EDB_FORMAT_AR.md`.
- **منهج Level 1**: خمس وحدات طرق في `src/data/curriculum/levels/conventionalLevel1.ts`،
  ووحدة ET في `src/data/academyCurriculum.ts`.
- **إفادة التعلم الذاتي**: `CurriculumCertificatesView` — ليست شهادة ولا اعتماداً.
- **خطة المراجعة**: `documentation/NDE_ED_REVIEW_AR.md` (تعيين Level III معلّق).
- **CI**: `.github/workflows/verify.yml` يشغّل lint + tests + edb:check + links:check + build.
- **مسارات التعلم**: `src/data/learningPaths.ts` + تبويب `paths`.
- **التقييم العملي**: `PracticalAssessmentView` + `src/data/practicalAssessment.ts` (8 مهام، 6 طرق).
- **مراقبة الروابط**: `scripts/check-links.ts` + `.github/workflows/link-monitor.yml` (أسبوعي).
- **سجل المراجعة**: `src/data/ndeEd/review.ts` — كل المقررات `pending` حتى التوقيع.
- **ملف الحالة الكامل**: `documentation/STATUS_AR.md` (ما تم، ما بقي، وكيف تتحقق).
- **المستشار الذكي**: `documentation/AI_STUDIO_AR.md` — كيفية عمل Gemini خلف
  gateway خادمي، وما يجب ألا يُلمس (المفتاح، النص الجاهز، عتبة البحث).

## 8. قراءة إضافية
- `docs/HANDOVER_AR.md` — دليل التسليم (14 قسم).
- `docs/ACADEMY_REVIEW_AR.md` — مراجعة + خطة استكمال.
- `docs/TRANSFER_PACKAGE.md` — حزمة النقل.

---
*آخر تحديث: 16 أكتوبر 2026.*
