# حالة الأكاديمية — بعد إضافة EDB ومقررات NDE-Ed والتقييم العملي

> آخر تحديث: 2026-10-23 · الفرع `arena/eecca733-project`
> هذا الملف يجيب على سؤال واحد: **ما المنفَّذ فعلاً، وما المتبقي، وكيف أتحقق؟**

---

## 1. تشغيل سريع

```bash
npm install        # يتطلب Node 22 أو أحدث (jsdom 30 ← undici 8 يحتاج zstd)
npm run dev        # معاينة على المنفذ 3000
npm run verify     # lint + الاختبارات + EDB + EPUB + الروابط + build + site:check
npm run epub:build # بناء نسخة EPUB (Kindle/Kobo/Apple Books)
```

`npm run verify` هو بوابة الدمج. لا تعتمد على `npm run build` وحده:
البناء الناجح لا يعني أن `docs/` المنشور سليم — لذلك `site:check` في نهاية السلسلة.

نشر الموقع: كل دفع إلى `main` يبني الموقع من المصدر وينشره على
`https://ndt-insco.github.io/INSCONDT/` عبر `.github/workflows/deploy.yml`.
العمل على فرع لا يظهر على الرابط حتى يُدمج. الخطوات الكاملة في
`DEPLOY_GITHUB_PAGES_AR.md`.

---

## 2. الوحدات الجديدة (بترتيب الظهور في الواجهة)

| التبويب | المكوّن | البيانات | التخزين المحلي |
| --- | --- | --- | --- |
| `courses` | `NdeEdCourseCatalog` | `src/data/ndeEd/*` | `insco_nde_ed_progress_v1` |
| `paths` | `LearningPathsView` | `src/data/learningPaths.ts` | لا يخزّن (يقرأ من الاثنين أدناه) |
| `edb` | `EdbLibraryView` + `EdbFlipbook` | `public/edb/*.edb` + `index.json` | `insco_edb_reading_v1` |
| `practical` | `PracticalAssessmentView` | `src/data/practicalAssessment.ts` | `insco_practical_assessment_v1` |
| `certificates` | `CurriculumCertificatesView` | يقرأ كل ما سبق | `insco_self_study_name_v1` |
| `certification_center` | `CertificationCenter` (قائم) | `certificationExamService` | `insco_exam_registrations_v1` |
| `ask_ai` | لوحة المستشار داخل `EducationalAcademy` | `src/ai/*` + بوابة `server.ts` | لا يخزّن |

**المستشار الذكي:** بحث محلي في 132 وثيقة، ثم إجابة مبثوثة من الخادم مع
استشهادات حقيقية. بلا مفتاح على الخادم يقول ذلك صراحةً ولا يطبع نصاً جاهزاً.
التفاصيل الكاملة في `documentation/AI_STUDIO_AR.md`.

**فصل المسؤوليات:** تقدم المنهج (`curriculumProgress`) منفصل تماماً عن تقدم
المقررات و EDB والتقييم العملي. لا يكتب أي منها في مفتاح الآخر.

---

## 3. ما أُنجز من الخطة

### P1 — دمج المكتبة وإعادة التسمية
- [x] الكتب الـ11 في مكتبة EDB وفهرس واحد (`book-*`).
- [x] «الشهادات» ⟶ **إفادة تعلم ذاتي غير معتمدة** مع بيان حدود ومصدر واسم محلي.
- [x] توحيد `src/types.ts` مع `src/types/index.ts` (كان السبب في 39 خطأ بناء).

### P2 — مقررات حقيقية
- [x] 7 مقررات / 35 درساً، كل درس بأهداف ومثال محلول وتمرين وسؤال فهم ومصادر.
- [x] كل درس مرتبط بوحدة منهج موجودة (تحقق آلي يمنع الروابط المكسورة).
- [x] مرحلة **Level 1** كاملة (5 وحدات طرق + قائمة مهارات عملية) ووحدة ET.
- [x] سجل مراجعة Level III (`src/data/ndeEd/review.ts`) + شارة حالة على كل مقرر،
      مع منع أي ادعاء مراجعة بلا اسم وتاريخ وبصمة.

### P3 — تقييم عملي، تصدير، مراقبة روابط
- [x] 8 مهام عملية موثقة في 6 طرق: معايير أداء، دليل مطلوب، خطوات حرجة، سلامة.
- [x] الخطوة الحرجة غير المطابقة تُفشل النتيجة مهما كان مجموع الدرجات.
- [x] تصدير JSON يحمل نصاً صريحاً بأنه ليس شهادة ولا دليلاً على الكفاءة.
- [x] فحص روابط بنيوي يدخل `verify`، وفحص وصول أسبوعي منفصل.
- [x] مسارات تعلم تربط الموجود دون تكرار محتوى.

### غير منفَّذ (يحتاج قراراً أو بيئة)
- [ ] **تعيين مراجعين Level III فعلياً** وتوقيع البصمات (يحتاج أسماء من المالك).
- [ ] **CMS** لتحرير المحتوى من الواجهة.
- [ ] **مزامنة آمنة** بين الأجهزة (تحتاج مصادقة وخادماً؛ الحالي محلي بالكامل).
- [ ] **Playwright** للتحقق في متصفح حقيقي (تنزيل المتصفح محجوب في هذه البيئة).
- [ ] **FMC/TFM، الموجات الموجهة، AE، التصوير الحراري، الميكروويف** كمقررات كاملة.
- [ ] ترجمة المحتوى القديم غير المترجم في بعض شاشات المنهج.

---

## 4. قواعد ثابتة يجب الحفاظ عليها

1. **لا ادعاء اعتماد.** لا كلمة «شهادة» أو «معتمد» على مخرجات التعلم الذاتي.
2. **لا أسماء مراجعين وهمية.** السجل يقبل `pending` فارغاً، لا اسماً مخترعاً.
3. **حدود كل طريقة مكتوبة** في المقرر والمهمة العملية، لا في حاشية.
4. **الأرقام تُحسب من البيانات** (`NDE_ED_COURSES.length`)، لا تُكتب يدوياً.
5. **حالة التقدم تُقرأ من التخزين** في كل عرض، لا تُخزَّن مرآة ثانية.
6. **إسناد nde-ed.org** يظهر في كل مستند مقرر وفي التبويب الرئيسي.

---

## 5. خريطة الملفات

```
src/
  edb/                    types, validate, convert, paragraphs   ← صيغة EDB
  data/ndeEd/             courses, sources, review, types, helpers
  data/learningPaths.ts   مسارات التعلم
  data/practicalAssessment.ts   بنك المهام العملية والسياسة
  utils/                  ndeEdProgress, edbLibrary, practicalAssessment, linkAudit
  components/academy/     NdeEdCourseCatalog, EdbFlipbook, EdbLibraryView,
                          PracticalAssessmentView, LearningPathsView,
                          CurriculumCertificatesView
src/ai/
  contract.ts             النماذج والحدود وأحداث SSE وأكواد الخطأ
  corpus.ts               بناء الوثائق الـ132 من بيانات الكتب والمقررات
  search.ts               تطبيع عربي + BM25 + مرادفات + عتبة 4.2
  client.ts               نداء البوابة من المتصفح (بلا مفتاح)
  transport.ts            Interactions API أولاً ثم الاحتياط القديم
  synonyms.ts             مرادفات NDT ثنائية اللغة
server.ts                 يستضيف SPA + بوابة /api/ai/*
scripts/
  build-edb.ts            بناء المكتبة + --check
  check-links.ts          فحص الروابط (بنية + وصول)
public/edb/               18 مستنداً مولّداً + index.json
documentation/
  AI_STUDIO_AR.md         المستشار الذكي: Interactions API والتكلفة والنشر
  EDB_FORMAT_AR.md        صيغة EDB بالتفصيل
  NDE_ED_REVIEW_AR.md     إجراء المراجعة والتوقيع
  STATUS_AR.md            هذا الملف
```

---

## 6. كيف أضيف شيئاً؟

**درساً جديداً:** أضفه في ملف المقرر، اربطه بوحدة موجودة في `curriculum`، ثم
`npm run edb:build && npm run verify`.

**طريقة جديدة (مثلاً AE):**
1. `src/data/ndeEd/ae.ts` بنفس الشكل + مصادر في `sources.ts`.
2. سجّلها في `NDE_ED_COURSES` و`ROLES` في `review.ts` (ستظهر `pending`).
3. أضف وحدة منهج في `src/data/academyCurriculum.ts`.
4. `npm run edb:build` ثم `verify` — الاختبارات ستكشف أي رابط ناقص.

**مهمة عملية:** أضفها في `PRACTICAL_TASKS` بمعايير لها `evidence` وخطوة `critical`
واحدة على الأقل، ثم `verify`.

---

## 7. أرقام مرجعية (تحقق منها بعد أي تغيير)

| العنصر | القيمة |
| --- | --- |
| المقررات | 7 |
| الدروس | 35 |
| مصادر القراءة | 77 (76 nde-ed.org + 1 asnt.org) |
| مستندات EDB | 18 (11 كتاباً + 7 مقررات) |
| وثائق البحث (المستشار) | 132 (90 صفحة + 7 نظرات عامة + 35 درساً) |
| صفحات EDB | 157 |
| كتب EPUB 3 | 18 (نفس المصدر، 552 KiB) |
| مهام عملية | 8 في 6 طرق |
| مسارات تعلم | 3 |
| مجموعات الاختبار | 15 |
| اختبارات | 128 |
