# دليل التسليم — INSCO Academy / موقع INSCO

تاريخ التحديث: 16 أكتوبر 2026.
الفرع: `arena/00989e2b-project` (من `main` @ `e66fab7`).

---

## 1. نظرة عامة على المشروع

- **الاسم**: INSCO — موقع إلكتروني + أكاديمية NDT/PWHT.
- **النوع**: واجهة React (Vite) + خادم Express (TypeScript) لخدمات AI/الصوت.
- **اللغات**: TypeScript/React، Tailwind CSS v4، Firebase (Auth/Firestore).
- **النشر**: GitHub Pages (ملفات ثابتة فقط) + استضافة Node.js كاملة (AI/صوت).
- **الهدف**: منصة تعليمية/تسويقية لخدمات الفحص غير الإتلافي (NDT)، اللحام، PWHT، API، الجودة، سلامة الأصول.

## 2. تشغيل المشروع

### المتطلبات
- Node.js ≥ 24.12.0 (المشروع يوصي؛ بيئة العمل الحالية Node 22 — يعمل مع تحذير).
- npm (استخدم `npm ci`).

### الأوامر
```bash
npm ci
cp .env.example .env   # ضع GEMINI_API_KEY على الخادم فقط (لا VITE_)
npm run dev            # خادم Vite+Express على المنفذ 3000
npm run lint           # tsc --noEmit
npm run build          # vite build -> dist/
npm run preview -- --host 0.0.0.0
```

### متغيرات البيئة
- `GEMINI_API_KEY` — مفتاح Gemini (خادم فقط، لا ترفعه).
- Firebase: `firebase-applet-config.json` / `firebase-blueprint.json`.

## 3. هيكل المستودع (مختصر)

```
src/
  App.tsx
  components/
    EducationalAcademy.tsx          # حاوية الأكاديمية + التبويبات
    academy/
      DisciplineCurriculumView.tsx
      CurriculumQuizEngine.tsx
      CurriculumCertificatesView.tsx
      CurriculumLevelProgressTracker.tsx
      FocusStudyStation.tsx / FocusTimerFloatingPill.tsx
      GlobalLeaderboard.tsx
      InteractiveWorkshops.tsx
      KnowledgeCheckModal.tsx
      SemanticSearchBar.tsx
      AcademyCompletionMap.tsx       # خريطة الاستكمال (جديد)
  data/
    academyCurriculum.ts            # 8 مجالات + 6 معامل
    academySemanticGlossary.ts
    curriculum/
      types.ts
      disciplines/*.ts              # 8 ملفات بيانات
      curriculumQuizBank.ts
  utils/
    curriculumProgress.ts
    quizLeaderboardService.ts
    focusTimerService.ts
    knowledgeCheckService.ts
    academySemanticSearch.ts
  firebase/, context/, types/
server.ts                            # Express + AI/صوت
docs/
  ACADEMY_REVIEW_AR.md
  HANDOVER_AR.md
  TRANSFER_PACKAGE.md
```

## 4. قسم الأكاديمية — البنية

### التبويبات (EducationalAcademy)
1. **المناهج والمسارات** (`curriculum`) — DisciplineCurriculumView.
2. **الشهادات والأوسمة** (`certificates`) — CurriculumCertificatesView.
3. **معامل الورش** (`workshops`) — InteractiveWorkshops.
4. **محاكيات** (`defects`/`pwht_curve`) — محاكي عيوب اللحام + PWHT.
5. **الأكواد والمستشار** (`standards`/`methods`/`quiz`/`ask_ai`/`video_gen`/`leaderboard`/`completion_map`).
6. **خريطة الاستكمال** (`completion_map`) — AcademyCompletionMap (جديد).

### البيانات
- `ENGINEERING_DISCIPLINES`: 8 مجالات، كل منها 3 مستويات (أكاديمي، Level 1/2/3، ...).
- `WORKSHOP_LABS`: 6 معامل.
- كل مستوى: modules, keyFormulas, practicalSkillsChecklist, referenceTextbooks, academicFoundations.

### التقدم
- `curriculumProgress.ts` — localStorage (مفاتيح مستقلة).
- `quizLeaderboardService.ts` — localStorage + (اختياري) Firebase.

### الخدمات (تعتمد على الخادم)
- `/api/ai/educational-tutor` — مستشار AI.
- `/live` — WebSocket صوت.

## 5. ما الموجود فعلاً (Current state)

راجع `docs/ACADEMY_REVIEW_AR.md` (نسخة من فرع 77528e83) + خريطة الاستكمال في UI.

- 8 مجالات، 24 مستوى، ~N وحدة، 6 معامل.
- محاكيات (عيوب لحام، PWHT)، بنك أسئلة، تتبع تقدم، شهادات، لوحة متصدرين، مؤقت تركيز، بحث دلالي، مكتبة أكواد، 12 تقنية، مستشار AI، توليد فيديو.
- **لا يوجد**: مكتبة مراجع (Reference Library) + 23 درساً تأسيسياً (كانت في فرع 77528e83، لم تُدمج).
- **لا يوجد**: CMS، مزامنة آمنة، اختبارات متصفح.

## 6. الفجوات (Gaps)

1. القوائم ليست دروساً (لا شرح/تمارين/تصحيح).
2. لا مكتبة مراجع (Reference Library).
3. لا دروس تأسيسية.
4. لا نظام تحرير/مراجعة علمية/إدارة مدربين.
5. التقدم محلي (localStorage) وليس سجلاً موثقاً.
6. الشهادات/الساعات قد تُفهم كاعتماد — إعادة تسمية.
7. المحاكاة قد تعطي ثقة زائدة — حدود.
8. لا اختبارات متصفح (Playwright).
9. لا CMS/مزامنة/نسخ احتياطي/مراقبة روابط.
10. AI/Video لا تعمل على GitHub Pages.

## 7. ترتيب الشغل الجاي (Next work order)

### P1 (فوري)
- دمج مكتبة المراجع + 23 درساً تأسيسياً من فرع 77528e83 (cherry-pick) مع الحفاظ على ميزات 00989e2b.
- إعادة تسمية "الشهادات" → "إفادة تعلم ذاتي غير معتمدة" + تنبيه حدود.

### P2
- تحويل مخطط المنهج إلى مقررات فعلية (VT/PT/MT/UT أولاً).
- تعيين مراجع Level III + متخصصين لكل مسار.

### P3
- تعلم/تقييم عملي موثق (مدربين، قوائم تقييم، سجل خبرة).
- CMS + مزامنة تقدم آمنة + نسخ احتياطي/تصدير + مراقبة روابط.

### P4
- ترجمات كاملة + وسائط + اختبارات متصفح.
- استضافة Node/WebSocket للخدمات الذكية.

## 8. اصطلاحات وتنبيهات (Conventions & Pitfalls)

- **لا تنسخ أكواد مدفوعة** أو بنوك امتحانات رسمية.
- **الشهادات**: أعد تسميتها (ليست اعتماداً).
- **المحاكاة**: ليست قرار تشغيل (PWHT/عمر متبقي).
- **الأكواد**: حدد إصدار العقد («أحدث إصدار» ليس بالضرورة المطلوب).
- **التقدم**: localStorage (مفاتيح مستقلة) — لا تخلط مع تقدم المنهج.
- **الخدمات الذكية**: تحتاج Node/WebSocket — لا تعمل على Pages.
- **Firebase**: أضف نطاق الموقع إلى Authorized domains.
- **Node**: يوصى 24.12+ (بيئة العمل 22 يعمل مع تحذير).
- **RTL/LTR**: دعم العربية (isAr).

## 9. تدفق البيانات (Data flow)

- `ENGINEERING_DISCIPLINES` (data) → `DisciplineCurriculumView` (UI).
- التقدم: `curriculumProgress` (localStorage) ↔ `DisciplineCurriculumView`.
- الاختبار: `CurriculumQuizEngine` + `curriculumQuizBank`.
- لوحة المتصدرين: `quizLeaderboardService` (localStorage + Firebase).
- بحث: `SemanticSearchBar` + `academySemanticSearch` + `academySemanticGlossary`.

## 10. التحقق (Validation)

```bash
npm ci
npm run lint        # tsc --noEmit
npm run build       # vite build
npm run preview -- --host 0.0.0.0
```

(اختبارات `test:academy` غير موجودة في package.json الحالي — كانت في فرع 77528e83.)

## 11. النشر (Deployment)

- GitHub Pages: ملفات ثابتة فقط. `/api/ai/*` و `/live` لن تعمل.
- لتشغيل كامل: `npm run build` + `NODE_ENV=production npm start`.
- Vite `base: './'` — روابط نسبية.

## 12. حزمة النقل (Transfer package)

راجع `docs/TRANSFER_PACKAGE.md`. الملفات الرئيسية للتسليم:
- `docs/HANDOVER_AR.md` (هذا الملف)
- `docs/ACADEMY_REVIEW_AR.md`
- `docs/TRANSFER_PACKAGE.md`
- `src/components/academy/AcademyCompletionMap.tsx`
- أرشيف `release/transfer-package.tar.gz` (إن وُجد).

## 13. فروع ذات صلة

- `main` @ `e66fab7` — الحالة الحالية (leaderboard + certificates).
- `arena/77528e83-project` @ `daa4c17` — مكتبة مراجع + 23 درساً (PR #3 merged، لكن غير مدمج في main).
- `arena/848880db-project` @ `d714cde` — إصلاح نصوص.
- `arena/50417e18-project` @ `e8d6e04` — إصلاح بناء/نشر.

> ملاحظة: فرع 77528e83 يحتوي ميزات (مكتبة مراجع، دروس) غير موجودة في main. دمجها (cherry-pick) هو P1.

## 14. التحديث (Knowledge Library + Roadmap)

- تبويب جديد `knowledge` (مكتبة الدروس) في `EducationalAcademy` — نقطة دخول للأكاديمية (مكمل للمناهج).
- `AcademyKnowledgeLibrary` — 23 درساً تأسيسياً، بحث/تصفية، سجل قراءة محلي، مكتبة مصادر.
- `AcademyDevelopmentRoadmap` — خريطة استكمال (متاح/مراجعة/مخطط) مع عدادات حية.
- `academyRoadmap.ts`, `academySubjects.ts`, `academyCases.ts` — بيانات.
- اختبارات: `tests/academy.test.tsx` (13 اختبار) — `npm run test:academy`.
- التحقق: `npm run verify` (lint + test + build).
