# صيغة EDB — كتب إنسكو القابلة للتقليب

> الحالة: v1.0 · مولّد `INSCO-EDB-Builder/1.0` · تاريخ التوثيق 2026-10-21
>
> هذه الوثيقة تشرح كيف تحوّلت الكتب المدرسية ذات الصفحات (التي تُقلَب) إلى صيغة
> `.EDB` المفتوحة، وكيف تُبنى وتُتحقق، وما لا تفعله.

---

## 1. لماذا `.EDB`؟

الكتب القديمة كانت مكوّنة من صفحات مقسّمة إلى نص عربي ونص إنجليزي في حقول
منفصلة (`titleAr`, `titleEn`, `pages[]`). هذا جعل:

- التقليب البصري ممكناً لكن البحث والقراءة المتجاوبة صعبة،
- ترتيب الفصول ضمنياً في الكود لا في البيانات،
- استيراد كتاب جديد يتطلب تعديل مكوّن React.

صيغة **EDB (Educational Document Book)** هي مستند JSON واحد مستقل، يحمل:

- ترتيب الفصول والصفحات صراحةً،
- كتل محتوى مُصنّفة (فقرة، عنوان، قائمة، معادلة، تنبيه، مصدر، تجربة، سؤال)،
- نصاً ثنائي اللغة داخل كل كتلة (`{ ar, en }`) بدل حقول متوازية،
- بيانات وصفية وحقوق ونطاق استخدام،
- سمة بصرية (accent/paper/ink) لتعريف هوية الكتاب.

الملف يُقرأ مباشرة في المتصفح عبر `EdbFlipbook` دون أي خادم أو قاعدة بيانات.

---

## 2. أين يعيش الملف؟

| المسار | الدور |
| --- | --- |
| `src/edb/types.ts` | تعريفات الأنواع والثوابت (`EDB_FORMAT`, `EDB_VERSION`, `EDB_GENERATOR`) |
| `src/edb/validate.ts` | `parseEdb`, `validateEdb`, `stableStringify` |
| `src/edb/convert.ts` | `textbookToEdb`, `courseToEdb` |
| `src/edb/paragraphs.ts` | `parseLanguageBlocks`, `mergeBilingualBlocks` |
| `scripts/build-edb.ts` | بناء المكتبة والتحقق منها |
| `public/edb/<id>.edb` | المستندات المولّدة (17 مستنداً) |
| `public/edb/index.json` | فهرس المكتبة + SHA-256 لكل مستند |
| `src/utils/edbLibrary.ts` | تحميل الفهرس والمستندات، التقدم، التنزيل |
| `src/components/academy/EdbFlipbook.tsx` | القارئ |
| `src/components/academy/EdbLibraryView.tsx` | كتالوج المكتبة + الاستيراد |

---

## 3. الهيكل الأدنى

```json
{
  "format": "EDB",
  "version": "1.0",
  "generator": "INSCO-EDB-Builder/1.0",
  "id": "book-ut",
  "metadata": {
    "title": { "ar": "المرجع الأكاديمي في فحص الموجات فوق الصوتية", "en": "Academic Textbook of Ultrasonic Testing" },
    "subtitle": { "ar": "…", "en": "…" },
    "author": { "ar": "…", "en": "…" },
    "languages": ["ar", "en"],
    "readingDirection": "auto",
    "edition": "…",
    "estimatedMinutes": 480,
    "relatedDiscipline": "UT",
    "keywords": [{ "ar": "…", "en": "…" }],
    "standards": ["ASME Sec V Art 4"],
    "rights": {
      "holder": "INSCO",
      "license": "Educational use — all rights reserved",
      "notice": { "ar": "…", "en": "…" }
    },
    "sourceNote": { "ar": "…", "en": "…" },
    "createdAt": "2026-10-21T00:00:00.000Z",
    "updatedAt": "2026-10-21T00:00:00.000Z"
  },
  "theme": { "accent": "#f59e0b", "accentSoft": "#1a2342", "ink": "#f4f7ff", "paper": "#0b1022" },
  "chapters": [{ "id": "book-ut-ch1", "title": { "ar": "…", "en": "…" }, "pageIds": ["book-ut-p2"] }],
  "pages": [
    {
      "id": "book-ut-p2",
      "number": 2,
      "chapterId": "book-ut-ch1",
      "kind": "content",
      "title": { "ar": "…", "en": "…" },
      "estimatedMinutes": 48,
      "blocks": [
        { "type": "paragraph", "text": { "ar": "…", "en": "…" } },
        { "type": "heading", "level": 2, "text": { "ar": "…", "en": "…" } }
      ]
    }
  ]
}
```

### أنواع الكتل المدعومة

| `type` | الحقول المطلوبة | الاستخدام |
| --- | --- | --- |
| `paragraph` | `text` | نص عادي |
| `heading` | `level` (1–4)، `text` | عنوان قسم |
| `list` | `ordered`، `items[]` | قوائم ثنائية اللغة |
| `quote` | `text`, `attribution?` | اقتباس قصير |
| `formula` | `expression`, `caption?` | معادلة (تُعرض كسطر رياضي) |
| `callout` | `tone` (`info`/`warning`/`danger`/`success`)، `title?`، `text` | تنبيه |
| `table` | `headers[]`، `rows[][]` | جدول مقارنات |
| `image` | `src`، `alt`، `caption?` | صورة توضيحية |
| `experiment` | `labId` | تجربة تفاعلية موجودة في `InteractiveBookExperiment` |
| `source` | `publisher`، `title`، `url` | إسناد مصدر |
| `quiz` | `quiz` (سؤال/خيارات/جواب/تفسير) | تحقق سريع |

> **قاعدة نصية:** كل كتلة يجب أن تحمل نصاً واحداً غير فارغ على الأقل.
> `isEdbText` يرفض الكتلة الفارغة تماماً. التوثيق الثنائي الكامل
> (`isFullyBilingual`) مطلوب للبيانات الوصفية والعنوان الفرعي والمؤلف.

---

## 4. كيف يُولّد النص ثنائي اللغة؟

ملفات المصدر تكتب العربية والإنجليزية في سلسلتين منفصلتين، لكن عدد الأسطر
قد يختلف. لذلك:

1. `parseLanguageBlocks(raw)` يحوّل نص لغة واحدة إلى كتل (فقرات وقوائم)،
   ويدعم القوائم المرقّمة بالأرقام العربية الهندية (٣.، ٤.).
2. `mergeBilingualBlocks(arRaw, enRaw)` يدمج اللغتين:
   - نفس النوع ⟵ كتلة واحدة بحقلين،
   - نوعان مختلفان ⟵ فقرة ثنائية اللغة،
   - موجود في لغة واحدة ⟵ يُحفظ مع حقل فارغ (لا يُحذف)،
   - كتلة فارغة تماماً ⟵ تُحذف.

هذا يحافظ على أقصى قدر من المحتوى بدل إفشال الكتاب عند اختلاف سطر واحد.

---

## 5. البناء والتحقق

```bash
npm run edb:build   # يكتب public/edb/*.edb + index.json
npm run edb:check   # يفشل إذا كان أي ملف قديماً/ناقصاً/زائداً أو غير صالح
```

`npm run verify` يشغّل: `lint` ← الاختبارات ← `edb:check` ← `build`.

### الثبات (determinism)

- ترتيب مفاتيح JSON ثابت عبر `stableStringify` في حساب البصمة.
- `metadata.createdAt` و`updatedAt` **مستثنيان** من بصمة المحتوى، وإلا لظهر كل
  بناء كتغيير. الملفات نفسها تحتفظ بالطوابع الزمنية للعرض.
- البصمة المحفوظة في `index.json` هي **SHA-256** (Node `crypto`).
- `edbChecksum` في `src/utils/edbLibrary.ts` هاش 32-بت للعرض فقط — لا تقارنه
  ببصمة البناء.

### حدود الحجم

| الحد | القيمة |
| --- | --- |
| حجم المستند | 8 MB |
| عدد الصفحات | 600 |
| عدد الكتل في الصفحة | 200 |
| طول المعرّف | 3–80 حرفاً آمناً في الروابط |

---

## 6. القراءة والتقدم

- `loadEdbIndex()` تحاول `BASE_URL + 'edb/index.json'` ثم المسار الجذري ثم
  المطلق، وتعود إلى التوليد وقت التشغيل إذا فشل التحميل.
- `loadEdbDocument(id)` تتحقق من البصمة قبل العرض.
- التقدم يُحفظ في `localStorage` تحت `insco_edb_reading_v1`:
  `{ [bookId]: { lastPage, readPages[], bookmarks[], updatedAt } }`.
- لا يُرسل أي شيء إلى خادم. مسح بيانات المتصفح يمسح التقدم.

---

## 7. إضافة كتاب جديد

1. أضف بيانات الكتاب إلى `src/data/ndeTextbooksData.ts` (أو مولّد مقرر في
   `src/data/ndeEd/`).
2. تأكد من وجود `id` و`titleAr/titleEn` و`pages[]` مع `contentAr/contentEn`.
3. `npm run edb:build` — سيظهر الخطأ إن كانت صفحة بلا نص.
4. `npm run edb:check` للتأكد من ثبات المكتبة.
5. أضف رابطاً في `EdbLibraryView` إن أردت تصنيفاً خاصاً؛ الكتالوج يقرأ الفهرس
   تلقائياً في بقية الحالات.

---

## 8. ما لا تفعله الصيغة

- ليست EPUB ولا PDF؛ لا CSS/خطوط مضمّنة ولا DRM.
- لا تحمل اختبارات رسمية أو شهادات؛ أسئلة الصفحات تحقق ذاتي فقط.
- لا تعتمد على خادم؛ لا مزامنة سحابية ولا تحقق هوية.
- لا تُستخدم كإجراء فحص أو قرار قبول؛ الكتب تعليمية والمرجع الملزم هو نسخة
  الكود المرخصة في العقد.

---

## 9. الإسناد

مقررات NDE-Ed مبنية على هيكل موضوعات صفحات
[nde-ed.org](https://www.nde-ed.org/) (Iowa State University, CNDE)، مع صياغة
وأمثلة وأسئلة أصلية لإنسكو. لم يُنسخ نص المحاضرات. يظهر الإسناد داخل كل مستند
مقرر وفي `NDE_ED_ATTRIBUTION`.
