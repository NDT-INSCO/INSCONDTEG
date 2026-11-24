# التكاملات — Drive و Vercel

## نظرة عامة

الموقع يدعم تكاملين اختياريين:

| التكامل | للاستخدام | الحالة |
| --- | --- | --- |
| **Google Drive** | نسخ احتياطي لتفضيلات المستخدم (اللغة، الثيم) | اختياري — يحتاج موافقة المستخدم |
| **Vercel** | نشر بديل لـ GitHub Pages مع معاينات فورية | تلقائي عند الدفع لـ `main` |

---

## Google Drive

### ما يُنسخ؟

فقط 4 مفاتيح من `localStorage`:

```json
{
  "language": "ar",
  "robotLang": "fr",
  "theme": "dark",
  "portalChoice": "academy",
  "updatedAt": "2026-11-24T03:30:00.000Z"
}
```

- لا تُرسل محتوى الصفحات أو بيانات حساسة.
- الملف يُحفظ باسم `insco-preferences.json` في Drive الخاص بالمستخدم.
- يُنشأ فقط بعد أن يضغط المستخدم **تفعيل النسخ إلى Drive** في الإعدادات.

### الكود

```ts
import { collectPreferences, generateDriveFileContent } from './src/utils/driveSync';

// جمع التفضيلات
const prefs = collectPreferences();

// إنشاء ملف للرفع إلى Drive (يتطلب upload_file من Arena)
const content = generateDriveFileContent();
```

### التفعيل

1. من لوحة الإدارة → الإعدادات → **النسخ إلى Drive**
2. المستخدم يسجل دخول Google ويوافق على صلاحية `drive.file` فقط (ملفات ينشئها التطبيق).
3. عند كل تغيير لغة/ثيم يُحدّث الملف تلقائياً إذا كان `insco_drive_sync_enabled=true`.

---

## Vercel

### النشر الحالي

- **الإنتاج:** GitHub Pages من `main` / `docs` — `https://ndt-insco.github.io/INSCONDTEG/`
- **المعاينة:** Vercel من نفس المستودع — `https://inscondteg.vercel.app/` (إن تم ربطه)

### كيف يعمل؟

```ts
import { isVercelEnvironment, triggerRedeploy } from './src/utils/vercelDeploy';

if (isVercelEnvironment()) {
  console.log('Running on Vercel preview');
}

// إعادة نشر يدوي عبر Deploy Hook (يُضبط في Vercel Dashboard)
await triggerRedeploy('https://api.vercel.com/v1/integrations/deploy/...');
```

### متغيرات البيئة

| المتغير | مطلوب | الوصف |
| --- | --- | --- |
| `VITE_ADMIN_PORTAL_URL` | اختياري | رابط لوحة الإدارة على Vercel |
| `VITE_PAGES_ADMIN_API_URL` | اختياري | API للبيانات إن كانت على Vercel Functions |
| `VERCEL_TOKEN` | للفحص اليدوي فقط | يُحفظ في `server.ts` لا في المتصفح |

### فحص الحالة

`server.ts` يمكنه استدعاء `getDeploymentStatus(deploymentId, token)` لعرض حالة آخر نشر في لوحة الإدارة.

---

## الأمان

- لا مفاتيح في المتصفح — كل استدعاء لـ Drive/Vercel API المحتاج توكن يمر عبر `server.ts`.
- Drive: نطاق `drive.file` فقط — لا يمكنه قراءة ملفات المستخدم الأخرى.
- Vercel: التوكن يُحفظ في متغير بيئة الخادم فقط.

## الاختبار

```bash
npm run verify # يتأكد أن الاستيرادات الجديدة لا تكسر البناء
```
