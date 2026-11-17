# نموذج طلب عرض السعر (RFQ) — كيف يُرسل فعليًا

> **القاعدة الواحدة:** لا تظهر رسالة «تم استلام طلبكم» إلا بعد أن يردّ خادم
> برقم مرجعي بعد تسليم الطلب إلى قناة حقيقية (بريد/جدول/ويب هوك). إن لم تكن
> القناة مهيّأة، يقول النموذج ذلك صراحة ويعطي العميل بريدًا وواتساب بنفس بياناته.

---

## 1. لماذا كان معطّلًا

النسخة السابقة كانت تولّد الرقم المرجعي داخل المتصفح:

```ts
const refCode = `INSCO-RFQ-${Date.now().toString().slice(-6)}`; // ❌
setSubmittedRef(refCode);
```

لم يكن هناك `fetch` ولا تخزين ولا بريد: العميل يرى «تم الاستلام» ولا يصل شيء.
الآن `src/rfq/submit.ts` لا يعتبر الطلب ناجحًا إلا بـ `2xx` يحمل `reference` من
الخادم، وأي شيء آخر يُعرض كفشل صريح مع إعادة المحاولة.

---

## 2. الخيار الأسرع: Google Apps Script + Google Sheet (بلا خادم وبلا تكلفة)

الجدول نفسه هو السجل، والسكربت يرسل إشعار بريد لكل طلب.

1. أنشئ جدول Google Sheets بأعمدة:
   `receivedAt | reference | companyName | contactName | phone | email | serviceType | projectLocation | description | pageUrl`
2. `Extensions → Apps Script` والصق:

```javascript
const INBOX = 'insco50@yahoo.com';      // بريد قسم التسعير
const SHEET_ID = 'PUT_SHEET_ID_HERE';   // من رابط الجدول
const SHEET_NAME = 'RFQ';

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);

    // حقل مصيدة للبوتات — لا يملؤه إنسان
    if (data.website) {
      return json({ ok: false, error: 'rejected' });
    }
    const required = ['companyName', 'phone', 'email'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return json({ ok: false, error: 'missing ' + field });
      }
    }

    const reference = 'INSCO-RFQ-' + Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd')
      + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const receivedAt = new Date().toISOString();

    SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME).appendRow([
      receivedAt, reference, data.companyName || '', data.contactName || '',
      data.phone || '', data.email || '', data.serviceType || '',
      data.projectLocation || '', data.description || '', data.pageUrl || ''
    ]);

    MailApp.sendEmail({
      to: INBOX,
      subject: 'RFQ ' + reference + ' — ' + data.companyName,
      replyTo: data.email,
      body: [
        'Reference: ' + reference,
        'Received: ' + receivedAt,
        'Company: ' + data.companyName,
        'Contact: ' + (data.contactName || '-'),
        'Phone: ' + data.phone,
        'Email: ' + data.email,
        'Service: ' + (data.serviceType || '-'),
        'Location: ' + (data.projectLocation || '-'),
        '', data.description || '(no scope)'
      ].join('\n')
    });

    return json({ ok: true, reference: reference });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. `Deploy → New deployment → Web app`، ثم:
   - **Execute as:** Me
   - **Who has access:** Anyone
   - انسخ رابط `/exec`.

4. اضبط متغيّر المستودع:
   `Settings → Secrets and variables → Actions → Variables → New`
   - الاسم: `VITE_RFQ_ENDPOINT`
   - القيمة: رابط `/exec` المنسوخ.

5. أعد تشغيل `deploy` (أو نفّذ `npm run build` وادفع `docs/`).

> **ملاحظة تقنية:** Apps Script لا يدعم طلب preflight، لذلك يرسل المتصفح
> الطلب بـ `Content-Type: text/plain` تلقائيًا عند كشف رابط `script.google.com`
> (انظر `src/rfq/submit.ts`). الرسالة نفسها JSON كما هي.

---

## 3. الخيار الاحترافي: بوابة `server.ts`

البوابة نفسها التي تخدم المستشار الذكي:

```bash
GEMINI_API_KEY=...                 # للمستشار
RFQ_WEBHOOK_URL=https://…          # قناة التسليم (Apps Script/Slack/Make)
# أو
RESEND_API_KEY=re_…                # بريد معاملاتي
RFQ_INBOX=tenders@insco-eg.com
RFQ_FROM=INSCO Website <rfq@insco-eg.com>
```

ثم في المتصفح: `VITE_RFQ_ENDPOINT=https://gateway.example.com` (يُضاف
`/api/rfq` تلقائيًا)، أو اتركه فارغًا إن كانت البوابة على نفس أصل الصفحة.

سلوك المسار `POST /api/rfq`:

| الحالة | الرد |
| --- | --- |
| بيانات ناقصة/غير صحيحة أو مصيدة بوت | `400` |
| أكثر من 6 محاولات/ساعة من نفس العنوان | `429` |
| لا توجد قناة تسليم مهيّأة | `503` (`rfq_delivery_not_configured`) |
| فشل التسليم عند المزوّد | `502` بلا رقم مرجعي |
| نجاح التسليم | `200 { ok: true, reference: "INSCO-RFQ-YYYYMMDD-XXXXXX" }` |

---

## 4. الاختبارات التي تحمي هذا السلوك

```bash
npm run test:rfq     # 16 اختبارًا: العميل + الخادم
npm run test:company # واجهة النموذج: لا نجاح بلا خادم، ولا رقم مُختلق
```

الحالات المغطّاة: `2xx` بلا `reference` = فشل · `404` (استضافة ثابتة) =
«غير مهيّأ» · مهلة الشبكة = فشل قابل لإعادة المحاولة · نجاح = رقم من الخادم
فقط · رسالة البريد/واتساب تحتوي كل الحقول.

---

## 5. ما يجب أن يعرفه من يعدّل الملفات

- `src/rfq/submit.ts` — جانب المتصفح (لا أسرار، لا أرقام محلية).
- `src/rfq/gateway.ts` — جانب الخادم (تحقق، حدّ معدّل، تسليم، مرجع).
- `src/components/company/CompanyContactSection.tsx` — الحالات:
  `sending` / `sent` / `failed` مع بدائل بريد وواتساب.
- **لا تُعد أبدًا** إلى `Date.now()` كرقم مرجعي، ولا إلى رسالة نجاح قبل
  استجابة الخادم.
