# منصة سفير الثقافة المؤسسية

تطبيق ويب عربي RTL لتخطيط برامج الثقافة المؤسسية وتوثيق الأنشطة والإنجازات والشواهد. أُنشئ المشروع من البداية داخل مستودع `alsaabxa/safeer`، ويرتبط بمشروع Firebase ذي المعرّف `safeer-f0303` واسمه الظاهر `safeer`.

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

1. مشروع Firebase المرتبط هو `safeer-f0303` (اسم العرض `safeer`). تطبيق الويب `Safeer Web` أُنشئ فيه. Firestore API غير مفعّل في المشروع بعد، لذا لم يمكن التحقق من قاعدة موجودة؛ يلزم تفعيل API واختيار موقع قاعدة البيانات قبل نشر قواعد Firestore. اختر Firestore Standard عند الإنشاء.
2. أُعدّ `firebase.json` لتفعيل Email/Password عند نشر إعداد Authentication. أنشئ قاعدة Firestore وStorage إذا لم تكونا موجودتين.
3. أضف `localhost` ونطاق الاستضافة لاحقًا إلى Authorized domains في Authentication.
4. إعداد Firebase Web محفوظ محليًا في `.env.local`، وهو مستثنى من Git. لا ترفع هذا الملف.
5. ثبّت Node.js 20.19+ أو 22.12+، ثم شغّل:

```bash
npm install
npm run dev
```

إذا لم تُضف إعدادات Firebase، يعرض التطبيق صفحة تشرح أسماء المتغيرات الناقصة.

## نشر Firebase

بعد اختيار موقع Firestore وتفعيل Cloud Firestore API وإنشاء قاعدة البيانات وStorage، راجع القواعد على Emulator ثم انشر:

```bash
npx firebase-tools login
npx firebase-tools use YOUR_FIREBASE_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
npm run build
npx firebase-tools deploy --only hosting
```

ملف `.firebaserc` مضبوط على `safeer-f0303`. لا ترفع `.env.local` أو مفاتيح حساب الخدمة إلى Git. أُنشئ تطبيق Firebase Web؛ لم تُنشر القواعد أو الاستضافة بعد.

## حدود ومراجعة قبل الإطلاق

- التسجيل الذاتي مفعّل. إذا كانت الحسابات تتطلب موافقة مسؤول، أضف سير اعتماد موثوقًا عبر Cloud Functions وCustom Claims قبل الإطلاق.
- قواعد Firestore وStorage تقيد السجلات والملفات بمستخدمها، وتحدد الحقول والأطوال والحجم وأنواع الملفات. ينبغي تشغيل اختبارات Emulator ومراجعة قواعد الأمان قبل فتح الخدمة لمستخدمين فعليين.
- تعرض لوحة المتابعة عدد السجلات المحملة في الصفحة الحالية؛ السجل نفسه يدعم جلب الصفحات الأقدم.
