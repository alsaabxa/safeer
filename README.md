# منصة سفير الثقافة المؤسسية

تطبيق ويب عربي RTL لتخطيط برامج الثقافة المؤسسية وتوثيق الأنشطة والإنجازات والشواهد، مرتبط بمشروع Firebase `safeer-f0303`.

## الوظائف

- حسابات مستقلة عبر Firebase Authentication بالبريد وكلمة المرور واستعادة كلمة المرور.
- لوحة متابعة وكتالوج برامج مؤسسية وملف شخصي.
- خطة تشغيلية بمستند منفصل لكل نشاط مع تحديث الحالة.
- تقارير وشواهد بمستندات منفصلة وروابط HTTPS اختيارية للشواهد.
- ملف إنجاز للطباعة أو الحفظ بصيغة PDF.
- تحميل سجلات أقدم بصفحات من 40 مستندًا.

## هيكل البيانات

```text
users/{uid}/profile/main
users/{uid}/plans/{planId}
users/{uid}/reports/{reportId}
users/{uid}/evidence/{evidenceId}
```

كل مستخدم يقرأ ويكتب داخل مساره الخاص فقط. تحفظ روابط الشواهد في Firestore؛ تُرفع الملفات إلى مساحة خارجية مثل Google Drive ثم يضاف رابط المشاركة.

## الخطة المجانية Spark

- قاعدة `safeer-main` موجودة في منطقة الدمام `me-central2` بإصدار Firestore Enterprise Native. يوفر Firestore حصة مجانية على Spark؛ عند تجاوز حدود المشروع المجانية يلزم الترقية قبل مواصلة الاستخدام. راجع [حصة Firestore المجانية](https://firebase.google.com/docs/firestore/pricing).
- لا يستخدم التطبيق Cloud Storage لأن Firebase Storage يتطلب Blaze للمشاريع الجديدة. أضف رابط HTTPS للشاهد بدل رفعه مباشرة.
- الاستضافة وAuthentication وFirestore مهيأة للمشروع `safeer-f0303`.

## التشغيل المحلي

انسخ إعدادات تطبيق الويب إلى `.env.local` ثم شغّل:

```bash
npm install
npm run dev
```

## النشر

```bash
npm run build
npx firebase-tools deploy --only firestore,auth,hosting
```

يعتمد التطبيق على مستمعي `onSnapshot` للتحديث الفوري، مع ترقيم النتائج. ملف `.firebaserc` يحدد المشروع `safeer-f0303`. لا ترفع `.env.local` أو مفاتيح حساب الخدمة إلى Git.
