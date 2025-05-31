# تطبيق تحليل المستندات السحابي

تطبيق سحابي لتحليل المستندات وفرزها وتصنيفها وإجراء عمليات البحث عليها.

## نظرة عامة

تطبيق تحليل المستندات هو منصة سحابية تتيح للمستخدمين رفع وتنظيم وتحليل المستندات بتنسيقات PDF وWord. يوفر التطبيق وظائف متقدمة مثل:

- رفع المستندات وتخزينها في السحابة
- استخراج النص من المستندات للبحث والتحليل
- البحث النصي الكامل في محتوى المستندات
- تصنيف المستندات تلقائياً باستخدام خوارزميات تحليل النص
- عرض إحصائيات وتحليلات حول المستندات المخزنة

## التقنيات المستخدمة

- **الواجهة الأمامية**: Next.js, React, TypeScript, Tailwind CSS
- **الخدمات السحابية**: Supabase (قاعدة بيانات PostgreSQL، تخزين الملفات)
- **معالجة المستندات**: PDF.js, Mammoth.js
- **البحث**: PostgreSQL Full-Text Search
- **التصنيف**: خوارزمية تصنيف نصي مخصصة

## متطلبات التشغيل

- Node.js (الإصدار 18 أو أحدث)
- حساب Supabase (للتخزين وقاعدة البيانات)

## الإعداد والتثبيت

1. استنساخ المستودع:
   ```bash
   git clone https://github.com/Abdullah-Assar/document-analyzer.git
   
   cd document-analyzer
   ```
2. تثبيت التبعيات:
    ```bash
    npm install
    ```
3. إعداد متغيرات البيئة:
   قم بإنشاء ملف `.env.local` وأضف المتغيرات التالية:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://anskmlapveutjxkikzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc2ttbGFwdmV1dGp4a2lrenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ3MjUsImV4cCI6MjA2MjM3MDcyNX0.mQl3f_fmtCoCxZ4cPJpbpkZCNr0HfLCHpmBg4lBBmbg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc2ttbGFwdmV1dGp4a2lrenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc5NDcyNSwiZXhwIjoyMDYyMzcwNzI1fQ.1gOXj58Yqc1dT3cVeSNTeQj2YyZFGSYG1hg1GFQPEOM
```
4. إعداد قاعدة البيانات:
   قم بتشغيل النصوص البرمجية SQL الموجودة في مجلد `database` لإنشاء الجداول والوظائف اللازمة.

5. تشغيل التطبيق محلياً:
   ```bash
   npm run dev
   ```

## هيكل المشروع
 ```bash
document-analyzer/
├── app/                  # مكونات وصفحات Next.js
├── components/           # مكونات React المشتركة
├── lib/                  # مكتبات وخدمات
│   ├── document-service.ts  # خدمة معالجة المستندات
│   ├── supabase-client.ts   # عميل Supabase
│   └── types.ts             # أنواع TypeScript
├── public/               # الملفات الثابتة
└── database/             # نصوص SQL لإعداد قاعدة البيانات
 ```

## الخوارزميات المستخدمة

### خوارزمية البحث

تستخدم المنصة خوارزمية البحث النصي الكامل في PostgreSQL مع دعم اللغة العربية. تم تحسين البحث باستخدام فهرسة tsvector وتقنيات تسليط الضوء على النتائج.

### خوارزمية الفرز

تستخدم المنصة خوارزمية فرز مدمجة في PostgreSQL مع تحسينات للأداء عند التعامل مع المستندات الكبيرة.

### خوارزمية التصنيف

تستخدم المنصة خوارزمية تصنيف نصي تعتمد على تطابق الكلمات المفتاحية مع فئات محددة مسبقاً. تم تحسين الخوارزمية لدعم اللغة العربية.


   
   
