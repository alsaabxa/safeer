# منصة سفير الثقافة المؤسسية

تطبيق ويب عربي RTL لتخطيط برامج الثقافة المؤسسية وتوثيق الأنشطة والإنجازات والشواهد. أُنشئ المشروع في مساحة العمل من البداية لأن مستودع `alsaabxa/safeer` الذي تمت مراجعته كان فارغًا.

## الوظائف

- حسابات مستقلة عبر Firebase Authentication بالبريد وكلمة المرور، مع إعادة تعيين كلمة المرور.
- لوحة متابعة وكتالوج برامج مؤسسية.
- بيانات السفير/ة والمدرسة.
- خطة تشغيلية بمستند مستقل لكل نشاط وتحديث حالته.
- تقارير بمستند مستقل لكل تقرير، مع رفع الملفات إلى Firebase Storage.
- سجل شواهد مستقل، حذف السجل وملفاته، وتنزيل الشواهد.
- ملف إنجاز يجمع البيانات والخطة والتقارير للطباعة أو الحفظ PDF.
- استعلام زمني مقسّم إلى صفحات من 40 مستندًا؛ استخدم «تحميل سجلات أقدم» لعرض السجلات السابقة.

## هيكل Firestore

```text
users/{uid}/profile/main
users/{uid}/plans/{planId}
users/{uid}/reports/{reportId}
users/{uid}/evidence/{evidenceId}
```

كل مستخدم له مجموعات فرعية خاصة، وكل سجل مستند منفصل. تخزن المرفقات في Storage ضمن `users/{uid}/{reports|evidence}/{recordId}/...`، ويحتفظ Firestore بالبيانات الوصفية فقط. الاستعلامات تستخدم `createdAt` المفهرس تلقائيًا ولا تحتاج فهارس مركبة.

## الإعداد المحلي

1. أنشئ مشروع Firebase واختر موقع Firestore وفق متطلباتك. التنفيذ يفترض Firestore Standard؛ لم يكن هناك مشروع Firebase متصل حتى يمكن فحص إصدار قاعدة موجودة أو موقعها.
2. أضف تطبيق Web إلى مشروعك، وفعّل Email/Password في Authentication، وأنشئ Firestore وStorage.
3. أضف `localhost` ونطاق الاستضافة لاحقًا إلى Authorized domains في Authentication.
4. انسخ `.env.example` إلى `.env.local` وأدخل قيم Firebase Web SDK.
5. ثبّت Node.js 20.19+ أو 22.12+، ثم شغّل:

```bash
npm install
npm run dev
```

إذا لم تُضف إعدادات Firebase، يعرض التطبيق صفحة تشرح أسماء المتغيرات الناقصة.

## نشر Firebase (لم يُنفّذ)

بعد مراجعة القواعد على Emulator وتجهيز المشروع:

```bash
npx firebase-tools login
npx firebase-tools use YOUR_FIREBASE_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
npm run build
npx firebase-tools deploy --only hosting
```

حدّث `.firebaserc` بمعرّف مشروعك الحقيقي. لا ترفع `.env.local` أو مفاتيح حساب الخدمة إلى Git. لم يتم إنشاء مشروع Firebase أو تشغيل أوامر نشر أو رفع إلى GitHub.

## حدود ومراجعة قبل الإطلاق

- التسجيل الذاتي مفعّل. إذا كانت الحسابات تتطلب موافقة مسؤول، أضف سير اعتماد موثوقًا عبر Cloud Functions وCustom Claims قبل الإطلاق.
- قواعد Firestore وStorage تقيد السجلات والملفات بمستخدمها، وتحدد الحقول والأطوال والحجم وأنواع الملفات. ينبغي تشغيل اختبارات Emulator ومراجعة قواعد الأمان قبل فتح الخدمة لمستخدمين فعليين.
- تعرض لوحة المتابعة عدد السجلات المحملة في الصفحة الحالية؛ السجل نفسه يدعم جلب الصفحات الأقدم.
