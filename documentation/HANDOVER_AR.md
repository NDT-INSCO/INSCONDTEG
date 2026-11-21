# دليل التسليم — INSCO Academy / موقع INSCO

مرجع التسليم الأصلي: 16 أكتوبر 2026، `main` @ `e66fab7`. الأقسام التاريخية ليست حالة الإصدار الحالي.
لإعادة الهيكلة الحالية راجع [خريطة UX](ux/RESTRUCTURE_V2_AR.md) و[تقرير الاختبار والمعاينة](ux/QA_V2_AR.md).

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
npm run build          # Pages -> docs/ (base: /INSCONDTEG/)
npm run build:hosted   # Node/hosted -> dist/ (base: /)
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

### حساب إنسكو الموحد وحفظ بياناته

- [دليل الحساب الموحد والمراجعة الإدارية ونشر قواعد الخصوصية](UNIFIED_ACCOUNTS_AR.md). مفاتيح الدخول العامة في رأس صفحات كل البوابات؛ لوحة الإدارة المستقلة لا تستخدم هذه الجلسة.

- بوابة العملاء (`#client`) تستخدم Firebase Authentication، ولا تستخدم كلمة مرور لوحة الإدارة. افحص تفعيل **Email/Password** من [طرق تسجيل الدخول](https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/authentication/providers)، وإضافة نطاق الموقع المنشور إلى **Authentication → Settings → Authorized domains** عند الحاجة. لا تغيّر إعدادات Google أو الهاتف لتفعيل البريد.
- خيار «ابقني مسجّلاً على هذا الجهاز» يحفظ جلسة Firebase عبر إغلاق المتصفح. بدونه تبقى الجلسة في التبويب الحالي عند التحديث. عرض حفظ كلمة المرور وإدخالها تلقائياً من وظائف مدير كلمات مرور المتصفح، وليس من وظائف الموقع.
- نموذج تسجيل العميل القديم يحتفظ بمسودة مرتبطة بمالك الحساب في **ذاكرة التبويب** فقط إلى أن يؤكّد Firestore الحفظ بعد تفعيل البريد. لا تُخزن المسودة الجديدة على القرص؛ افتح رابط التفعيل في تبويب آخر وارجع لنفس التبويب. تستخدم نسخة الموقع قاعدة Firestore المحدّدة في `firestoreDatabaseId` داخل `firebase-applet-config.json`؛ تأكّد أن `firestore.rules` منشورة على **تلك القاعدة** عند تشخيص رفض حفظ حساب مفعّل. لا تعالج رفض الحفظ بتعطيل شرط التفعيل.
- عند إنشاء حساب، تظهر أخطاء الحقول أو خدمة تسجيل الدخول بجانب زر الإرسال. الحقول بعلامة `*` فقط مطلوبة، وموقع الشركة الاختياري يقبل العنوان مع `https://` أو بدونه. إذا كان البريد مسجّلاً، استخدم «ادخل بالبريد نفسه» بدلاً من تكرار الإنشاء.
- للتحقق بعد النشر على GitHub Pages، تأكّد أولاً أن آخر بناء للفرع `main` أعاد نشر مجلد `docs/`؛ تعديل الفرع التجريبي وحده لا يحدّث الرابط العام. افتح [صفحة إنشاء الحساب](https://ndt-insco.github.io/INSCONDTEG/#client/register)، سجّل بحساب اختبار، ثم افتح رابط التفعيل واختر «تحقق من التفعيل». انتظر رسالة الحفظ وافتح «التسجيل وربط الكود» بعد تحديث الصفحة للتأكد من البيانات. جرّب أيضاً «نسيت كلمة المرور؟» والدخول بالكلمة الجديدة. لا ترسل كلمة المرور أو رموز التحقق لأي شخص.

## 9. تدفق البيانات (Data flow)

- `ENGINEERING_DISCIPLINES` (data) → `DisciplineCurriculumView` (UI).
- تقدّم الوحدات والموضوعات: `curriculumProgress` ↔ `DisciplineCurriculumView`؛ التجربة محلية للضيف، والحساب الموثّق يستخدم `user_module_progress` مع شرط ملكية UID.
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

تتوفر `npm run test:academy` للاختبار المركّز، و`npm run verify` للتحقق المجمع.

## 11. النشر (Deployment)

- GitHub Pages: `main:/docs`؛ `SITE_BASE=/INSCONDTEG/ npm run build` ثم `npm run site:check` ومطابقة `docs/` قبل النشر. لا يعمل الخادم من Pages. [إعداد RFQ](RFQ_AR.md).
- لخادم Node: `npm run build:hosted` ثم `NODE_ENV=production npm start`، بتهيئة القنوات على الخادم. Vercel/Netlify يشغّلان وظائف الإدارة وRFQ؛ المستشار يحتاج خادم Node أو بوابة مستقلة ومصادر مراجَعة.
- [خريطة الإصدار الثاني](ux/RESTRUCTURE_V2_AR.md) و[حدود ملف التأهيل](ux/DOSSIER_PUBLIC_V2_AR.md).

## 12. حزمة النقل (Transfer package)

راجع `documentation/TRANSFER_PACKAGE.md`. الملفات الرئيسية للتسليم:
- `documentation/HANDOVER_AR.md` (هذا الملف)
- `documentation/ACADEMY_REVIEW_AR.md`
- `documentation/TRANSFER_PACKAGE.md`
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
