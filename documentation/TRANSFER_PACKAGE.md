# حزمة النقل — Transfer Package

**المشروع**: NDT-INSCO / -Project-
**الفرع**: `arena/00989e2b-project`
**ال commit**: `e66fab7` (main HEAD)
**التاريخ**: 16 أكتوبر 2026

---

## 1. محتويات الحزمة

### أ. الكود (src/)
- `src/` — كامل (components, data, utils, firebase, context, types).
- `server.ts` — خادم Express.
- `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`.

### ب. التوثيق (docs/)
- `docs/HANDOVER_AR.md` — دليل التسليم.
- `docs/ACADEMY_REVIEW_AR.md` — مراجعة الأكاديمية وخطة الاستكمال.
- `docs/TRANSFER_PACKAGE.md` — هذا الملف.

### ج. الإعداد
- `.env.example` — قالب متغيرات البيئة.
- `firebase-applet-config.json`, `firebase-blueprint.json`.
- `.github/` — workflows.

### د. الأرشيف (اختياري)
- `release/transfer-package.tar.gz` — أرشيف كامل (بدون .git و node_modules).

## 2. ما تم تغييره في هذا الفرع (delta)

| ملف | التغيير |
|---|---|
| `src/components/academy/AcademyCompletionMap.tsx` | جديد — خريطة استكمال الأكاديمية (UI) |
| `src/components/EducationalAcademy.tsx` | إضافة تبويب `completion_map` + زر + render |
| `docs/ACADEMY_REVIEW_AR.md` | نسخ من فرع 77528e83 |
| `docs/HANDOVER_AR.md` | جديد — دليل التسليم |
| `docs/TRANSFER_PACKAGE.md` | جديد — حزمة النقل |

## 3. ما لم يتغير (للتجنب من تكرار الشغل)

- مناهج 8 مجالات + 6 معامل (بدون تغيير).
- محاكيات، بنك أسئلة، تتبع تقدم، شهادات، لوحة متصدرين، مؤقت تركيز، بحث دلالي، مكتبة أكواد، 12 تقنية، مستشار AI، توليد فيديو.
- قواعد Firestore، إعداد Firebase.

## 4. خطوات بدء العمل (للمطور الجديد)

1. `git clone` + `git checkout arena/00989e2b-project` (أو main).
2. `npm ci` (Node 24.12+ موصى).
3. `cp .env.example .env` + ضبط `GEMINI_API_KEY`.
4. `npm run dev` → http://localhost:3000.
5. اقرأ `docs/HANDOVER_AR.md` + `docs/ACADEMY_REVIEW_AR.md`.
6. افتح الأكاديمية → تبويب "خريطة الاستكمال" لرؤية ما/ناقص/ترتيب.
7. ابدأ P1 (دمج مكتبة المراجع + دروس من فرع 77528e83).

## 5. فروع مرجعية (لا تدمج blindly)

- `arena/77528e83-project` @ `daa4c17` — مكتبة مراجع + 23 درساً (cherry-pick موصى).
- `arena/848880db-project` @ `d714cde` — إصلاح نصوص.
- `arena/50417e18-project` @ `e8d6e04` — إصلاح بناء/نشر.

## 6. التحقق (Validation)

```bash
npm run lint
npm run build
npm run preview -- --host 0.0.0.0
```

## 7. النشر

- GitHub Pages: ملفات ثابتة فقط (AI/صوت لن تعمل).
- كامل: `npm run build` + `NODE_ENV=production npm start`.

## 8. ملاحظات أمنية

- لا ترفع `GEMINI_API_KEY` (لا `VITE_`).
- Firebase: أضف نطاق الموقع إلى Authorized domains.
- لا تنسخ أكواد مدفوعة/بنوك امتحانات.
