# نشر قواعد Firebase — خطوة واحدة، بطريقتين

> سؤال هذا الملف: **الموقع شغّال على Pages، والقواعد (`firestore.rules` و`storage.rules`)
> مكتوبة في المستودع… فمَن ينشرها إلى مشروع Firebase؟**
>
> الحقيقة التي يجب أن تُقال: **لا شيء كان ينشرها.** سير عمل `deploy.yml` ينشر الموقع
> فقط. لذلك قد تكون الواجهة حيّة والخادم يرفض العملية — وهذا أسوأ من خطأ ظاهر.

المشروع: `ai-studio-applet-webapp-18922`
قاعدة Firestore: `ai-studio-inscointeractive-2ab74c2d-acdd-4fa3-a16b-53ea46221179`
حزمة التخزين: `ai-studio-applet-webapp-18922.firebasestorage.app`

---

## الطريقة 1 — من المتصفح، بلا برامج ولا مفاتيح (أسرع)

يصلح لمن يملك الدخول على حساب Firebase للمشروع فقط. لا يحتاج خدمة حساب ولا CLI.

1. افتح محرّر قواعد Firestore:
   `https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/firestore/databases/ai-studio-inscointeractive-2ab74c2d-acdd-4fa3-a16b-53ea46221179/rules`
2. افتح الملف الخام من المستودع:
   `https://github.com/NDT-INSCO/INSCONDTEG/raw/main/firestore.rules`
   (أو: الملف في المستودع ← زر **Raw** ← `Ctrl+A` ← `Ctrl+C`)
3. الصق المحتوى بالكامل **بدل** ما في المحرّر، ثم **Publish**.
4. افتح محرّر قواعد Storage:
   `https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/storage/ai-studio-applet-webapp-18922.firebasestorage.app/rules`
5. كرّر اللصق من:
   `https://github.com/NDT-INSCO/INSCONDTEG/raw/main/storage.rules`
   ثم **Publish**.

> الصق الملف **كاملاً**: استبدال جزء منه فقط يترك قواعد قديمة تحكم مسارات جديدة.

هذه الطريقة منفَّذة يدوياً كل مرة تتغيّر فيها القواعد — لذلك توجد الطريقة 2.

---

## الطريقة 2 — سير عمل تلقائي (مرة واحدة، ثم يعمل وحده)

الملف: `.github/workflows/firebase-rules.yml`

### الإعداد (مرة واحدة، ~٣ دقائق)

1. **اصنع مفتاح خدمة** يملك دور «Firebase Admin» على المشروع:
   `https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/settings/serviceaccounts/adminsdk`
   ← **Generate new private key** ← ينزل ملف `.json`.
2. **أضفه سرّاً في المستودع** (لا في الشات ولا في ملف داخل المستودع):
   `https://github.com/NDT-INSCO/INSCONDTEG/settings/secrets/actions`
   ← **New repository secret**
   - الاسم: `FIREBASE_SERVICE_ACCOUNT`
   - القيمة: محتوى ملف الـJSON كاملاً.
3. **شغّله أول مرة**:
   `https://github.com/NDT-INSCO/INSCONDTEG/actions/workflows/firebase-rules.yml`
   ← **Run workflow** ← `main`.

بديل للمفتاح: سرّ اسمه `FIREBASE_TOKEN` يحمل ناتج `npx firebase-tools login:ci`
من جهازك. السير يعمل بأيّ من السرّين.

### بعد ذلك

كل تغيير على `firestore.rules` أو `storage.rules` أو `firebase.json` يصل إلى `main`
يُنشر تلقائياً، ويظهر تعليق على التشغيل يقول ما أصبح حيّاً.

### الرفض المتعمّد

إن لم يوجد أيّ من السرّين، يفشل السير **صراحةً** برسالة تقول «لم يُنشر شيء» ورابط
إضافة السرّ. تشغيلٌ أخضر نشر صفراً هو الكذب بعينه؛ لذلك لن يحدث.

---

## الطريقة 3 — أمر واحد من جهازك (أسرع من الكونسول وأقل خطأً)

```bash
npm run rules:deploy
```

يفتح المتصفح لتسجيل الدخول بحسابك في Firebase مرة واحدة، ثم ينشر الملفّين. لا مفاتيح
ولا نسخ ولصق، ولا خطر لصق نصف ملف. يحتاج جهازاً فيه Node (لاب توب) — لا يعمل من الهاتف.

---

## كيف أتأكّد أن القواعد حيّة فعلاً؟

1. **من الكونسول:** صفحة القواعد تعرض تاريخ النشر (آخر نشر + من نشره).
2. **من الموقع:** افتح `#network/groups` وأنشئ جروباً. مع القواعد المنشورة يظهر الجروب
   في القائمة. بدونها تظهر رسالة عربية صريحة تقول إن `firestore.rules` لم يُنشر على
   المشروع — لا نص `permission-denied` الخام. وهذه الرسالة تعني «القواعد لم تُنشر بعد»،
   لا «الكود به عيب».
3. **من سطر أوامر (لمن يملك المفتاح):**

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npx --yes firebase-tools@15.37.0 deploy \
  --only firestore:rules,storage \
  --project ai-studio-applet-webapp-18922 --non-interactive
```

---

## الأمان

- مفتاح الخدمة يمنح صلاحية كاملة على المشروع: **GitHub Secrets فقط**، ولا يُلتقط في
  الشات أو في commit أو في `docs/`.
- عند تغيير المسؤول: احذف المفتاح القديم من صفحة Service accounts وأنشئ غيره، وحدّث السرّ.
