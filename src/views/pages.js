import { escapeText } from './auth.js';
import { operationalPlan2026, programs, semesters, statuses } from '../catalog.js';

const select = (name, items, selected = '') => `<select name="${name}">${items.map((value) => `<option ${selected === value ? 'selected' : ''}>${escapeText(value)}</option>`).join('')}</select>`;
const header = (eyebrow, title, description, action = '') => `<header class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>${action}</header>`;
const programSelect = () => select('program', programs.map((program) => program.name));
const blank = (message) => `<div class="empty-state"><span>✳</span><p>${message}</p></div>`;
function reportActivities(program, state) {
  const templates = operationalPlan2026.map((item, index) => ({ ...item, key: `template-${index}` }))
    .filter((item) => item.program === program);
  const seen = new Set(templates.map((item) => item.title));
  const custom = state.plans.filter((item) => item.program === program && !seen.has(item.title))
    .map((item) => ({ ...item, key: `plan-${item.id}` }));
  return [...templates, ...custom];
}
function activityOptions(program, state) {
  const activities = reportActivities(program, state);
  return `<option value="">${activities.length ? 'اختر النشاط لتعبئة بياناته' : 'لا توجد أنشطة مسجلة لهذا البرنامج'}</option>${activities.map((item) => `<option value="${escapeText(item.key)}">${escapeText(item.title)}</option>`).join('')}`;
}

export function renderPage(page, state) {
  switch (page) {
    case 'profile': return profilePage(state);
    case 'plan': return planPage(state);
    case 'reports': return reportsPage(state);
    case 'report-library': return reportLibraryPage();
    case 'evidence': return evidencePage(state);
    case 'portfolio': return portfolioPage(state);
    case 'portfolio-summary': return portfolioSummaryPage(state);
    default: return homePage(state);
  }
}
function reportLibraryPage() {
  const url = 'https://alsaabxa.github.io/safeer-re/';
  return `${header('نماذج التوثيق','تقارير الخطة التشغيلية 2026','أنشئ تقارير الأنشطة وأرفق الشواهد واطبع ورقة التنفيذ.', `<a class="button subtle" href="${url}" target="_blank" rel="noopener noreferrer">فتح في نافذة مستقلة ↗</a>`)}
    <section class="panel report-library-panel">
      <div class="report-library-note"><span>ⓘ</span><p>تُحفظ بيانات هذا النموذج في متصفحك على هذا الجهاز. لا تُحفظ في سجلات Firebase ولا تظهر تلقائيًا لمستخدمين آخرين. استخدم التصدير والاستيراد لنقل نسختك بين الأجهزة.</p></div>
      <iframe class="report-library-frame" src="${url}" title="تقارير سفيرة الثقافة المؤسسية" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"></iframe>
    </section>`;
}
function homePage(state) {
  const complete = state.plans.filter((item) => item.status === 'مكتمل').length;
  const linked = [...state.reports, ...state.evidence].filter((item) => item.evidenceUrl).length;
  const action = '<button class="button primary" data-navigate="reports">＋ إنشاء تقرير</button>';
  return `${header('مساحة السفير/ة', 'لوحة التحكم', 'تابع المبادرات والخطة والتقارير من مكان واحد.', action)}
    ${!state.profile.name ? '<div class="alert">ابدأ بإكمال بياناتك حتى تظهر في التقارير. <button class="link-button" data-navigate="profile">إكمال البيانات</button></div>' : ''}
    <section class="stats"><article><b>${programs.length}</b><span>البرامج</span></article><article><b>${state.plans.length}</b><span>أنشطة ظاهرة</span></article><article><b>${state.reports.length}</b><span>تقارير محفوظة</span></article><article><b>${complete} · ${linked}</b><span>مكتمل · روابط شواهد</span></article></section>
    <section class="section-head"><div><h2>البرامج المؤسسية</h2><p>اربط كل نشاط بأحد البرامج عند إنشاء سجل جديد.</p></div></section>
    <section class="program-grid">${programs.map((program,index)=>`<article class="program-card"><span class="program-number">${String(index+1).padStart(2,'0')}</span><h3>${escapeText(program.name)}</h3><p>${escapeText(program.audience)}</p><button class="link-button" data-navigate="reports" data-program="${escapeText(program.name)}">تقرير جديد ←</button></article>`).join('')}</section>
    <section class="section-head"><div><h2>أحدث التقارير</h2><p>آخر التقارير التي أضفتها.</p></div><button class="button subtle" data-navigate="reports">فتح السجل</button></section>${reportTable(state.reports.slice(0,5),false)}`;
}
function profilePage(state) {
  const profile=state.profile;
  return `${header('الملف الشخصي','بيانات السفير/ة','تظهر هذه المعلومات في ملف الإنجاز والتقارير المطبوعة.')}<section class="panel"><form id="profile-form" class="form-grid">
    <label>اسم السفير/ة<input name="name" value="${escapeText(profile.name||state.user?.displayName||'')}" maxlength="100" required></label>
    <label>اسم المدرسة<input name="school" value="${escapeText(profile.school||'')}" maxlength="140" required></label>
    <label>اسم المدير/ة<input name="manager" value="${escapeText(profile.manager||'')}" maxlength="100"></label>
    <label>البريد الإلكتروني الرسمي<input name="schoolEmail" type="email" value="${escapeText(profile.schoolEmail||state.user?.email||'')}" maxlength="254"></label>
    <label>العام الدراسي<input name="schoolYear" value="${escapeText(profile.schoolYear||'')}" maxlength="30" placeholder="مثال: 1448هـ"></label>
    <div class="form-actions"><button class="button primary">حفظ البيانات</button></div>
  </form></section>`;
}
function planPage(state) {
  const complete = state.plans.filter((item) => item.status === 'مكتمل').length;
  const inProgress = state.plans.filter((item) => item.status === 'قيد التنفيذ').length;
  const seeded = state.plans.filter((item) => item.id?.startsWith('operational-2026-')).length;
  const importAction = `<button class="button primary" data-action="import-plan" ${seeded === operationalPlan2026.length ? 'disabled' : ''}>${seeded ? `استكمال خطة 2026 (${operationalPlan2026.length - seeded} متبقٍ)` : '＋ تحميل خطة 2026'}</button>`;
  return `${header('التخطيط','الخطة التشغيلية','خطة 2026 وفق دليل سفير الثقافة وخطة سفراء الثقافة بالمدارس.', importAction)}
  <section class="stats"><article><b>${state.plans.length}</b><span>إجمالي الأنشطة</span></article><article><b>${complete}</b><span>مكتمل</span></article><article><b>${inProgress}</b><span>قيد التنفيذ</span></article><article><b>${seeded} / ${operationalPlan2026.length}</b><span>أنشطة خطة 2026</span></article></section>
  <div class="alert">يُنشئ التحميل أنشطة الخطة الـ${operationalPlan2026.length} كمستندات مستقلة في حسابك، ويمكن استكمال الأنشطة الناقصة لاحقًا دون تكرار السجلات أو تغيير حالاتها.</div>
  <section class="panel"><h2>إضافة نشاط إلى الخطة</h2><form id="plan-form" class="form-grid">
    <label>البرنامج${programSelect()}</label><label>النشاط<input name="title" maxlength="180" required></label>
    <label>الفئة المستفيدة<input name="audience" maxlength="120"></label><label>التوقيت<input name="date" type="date"></label>
    <label class="full">ملاحظات<textarea name="notes" maxlength="2000"></textarea></label>
    <div class="form-actions"><button class="button primary">إضافة إلى الخطة</button></div></form></section>
    <section class="panel"><div class="section-head"><div><h2>أنشطة الخطة (${state.plans.length})</h2><p>حدّث حالة التنفيذ وتاريخ الإقفال، وافتح تفاصيل النشاط لمراجعة طريقة التنفيذ والشواهد المطلوبة.</p></div></div>${planTable(state.plans,state.pages.plans?.hasMore)}${moreButton('plans',state.pages.plans)}</section>`;
}
function reportsPage(state) {
  const selectedProgram = state.reportProgram || programs[0].name;
  const templateLink = '<a class="button subtle" href="https://github.com/alsaabxa/safeer/blob/main/templates/activity-report-template.md" target="_blank" rel="noopener noreferrer">📄 قالب ورقة التنفيذ</a>';
  return `${header('التوثيق','تقارير الإنجاز','اختر البرنامج والنشاط لتعبئة بيانات الخطة تلقائيًا، ثم أكمل ما تحقق فعليًا.', templateLink)}
  <section class="panel report-entry-panel"><div class="section-head"><div><h2>نموذج تنفيذ نشاط</h2><p>تُملأ بيانات النشاط المخططة من الدليل. أضف تاريخ التنفيذ الفعلي والنتائج بعد إتمامه.</p></div><button class="button subtle no-print" type="button" data-action="print-execution">⎙ معاينة وطباعة ورقة التنفيذ</button></div><form id="report-form" class="form-grid">
    <label>البرنامج${select('program', programs.map((program) => program.name), selectedProgram)}</label>
    <label>النشاط${`<select name="activityTemplate">${activityOptions(selectedProgram, state)}</select>`}</label>
    <label>عنوان التقرير<input name="title" maxlength="180" required></label><label>العام/الفصل الدراسي${select('semester',semesters)}</label>
    <label>تاريخ التنفيذ الفعلي<input name="date" type="date"><small>قد يُعبأ بالموعد الوارد في الخطة؛ تحقق من تاريخ التنفيذ الفعلي.</small></label><label>الفئة المستفيدة<input name="beneficiary" maxlength="140"></label>
    <label class="full">الهدف<input name="goal" maxlength="1000" placeholder="يُعبأ من النشاط المختار"></label>
    <label class="full">وصف النشاط/العمل<textarea name="description" maxlength="3000"></textarea></label>
    <label class="full">آلية التطبيق<textarea name="method" maxlength="3000"></textarea></label>
    <label>عدد المستفيدين الفعلي<input name="beneficiariesCount" type="number" min="0" max="1000000"></label>
    <label class="full">الأثر والنتائج الفعلية<textarea name="impact" maxlength="3000" placeholder="أدخل النتائج بعد التنفيذ؛ لا تُملأ تلقائيًا حتى لا تُفترض نتائج غير موثقة."></textarea></label>
    <label class="full">ملاحظات المتابعة<textarea name="notes" maxlength="2000"></textarea></label>
    <label class="full">روابط ملفات الشواهد (رابط HTTPS في كل سطر)<textarea name="evidenceUrls" maxlength="10000" placeholder="https://..."></textarea><small>ارفع الملفات إلى مساحة المدرسة أو Google Drive/OneDrive، واضبط صلاحية الرابط حسب سياسة المدرسة. يدعم النموذج حتى 5 روابط؛ خطة Spark لا ترفع الملفات مباشرة إلى Firebase.</small></label>
    <label class="full">صور الشواهد من جهازك<input name="evidenceFiles" type="file" accept="image/*" multiple><small>أرفق حتى 5 صور، بحد 5 ميغابايت للصورة. تظهر الصور في ورقة الطباعة خلال هذه الجلسة، ولا تُرفع أو تُشارك مع مستخدمين آخرين. لحفظها ضمن تقريرك، اطبع الورقة إلى PDF ثم احفظه في مساحتك الخاصة.</small></label>
    <div class="form-actions"><button class="button primary">حفظ التقرير</button></div>
  </form></section>
  <section id="execution-sheet" class="execution-sheet" aria-live="polite">
    <div class="sheet-heading"><img class="ministry-logo" src="/ministry-logo.svg" alt="وزارة التعليم"><div><small>سفير الثقافة المؤسسية · نموذج التوثيق</small><h2>ورقة تنفيذ نشاط</h2><p data-report-preview="program">${escapeText(selectedProgram)}</p></div><span class="sheet-label">2026</span></div>
    <div class="sheet-grid"><div><small>اسم المدرسة</small><b>${escapeText(state.profile.school||'—')}</b></div><div><small>السفير/ة</small><b>${escapeText(state.profile.name||state.user?.displayName||'—')}</b></div><div><small>الفصل الدراسي</small><b data-report-preview="semester">الفصل الدراسي الأول</b></div><div><small>تاريخ التنفيذ</small><b data-report-preview="date">—</b></div></div>
    <div class="sheet-section"><h3>بيانات النشاط</h3><div class="sheet-grid"><div><small>البرنامج</small><b data-report-preview="program-copy">${escapeText(selectedProgram)}</b></div><div><small>عنوان النشاط</small><b data-report-preview="title">—</b></div><div class="wide"><small>الفئة المستفيدة</small><b data-report-preview="beneficiary">—</b></div><div class="wide"><small>الهدف</small><p data-report-preview="goal">—</p></div></div></div>
    <div class="sheet-section"><h3>التنفيذ والأثر</h3><div class="sheet-grid"><div class="wide"><small>وصف النشاط</small><p data-report-preview="description">—</p></div><div class="wide"><small>آلية التطبيق</small><p data-report-preview="method">—</p></div><div class="wide"><small>الأثر والنتائج</small><p data-report-preview="impact">يستكمل بعد التنفيذ.</p></div><div><small>عدد المستفيدين</small><b data-report-preview="beneficiariesCount">—</b></div><div><small>ملاحظات</small><p data-report-preview="notes">—</p></div></div></div>
    <div class="sheet-section"><h3>الشواهد والمرفقات</h3><div data-report-preview="evidence">لا توجد روابط مضافة.</div><div class="sheet-photo-grid" data-report-attachments></div></div>
    <div class="sheet-signatures"><div>إعداد السفير/ة</div><div>اعتماد قائد/ة المدرسة</div><div>التاريخ والتوقيع</div></div>
  </section>
  <section class="panel"><div class="section-head"><h2>سجل التقارير</h2><span class="pill">${state.reports.length} سجل ظاهر</span></div>${reportTable(state.reports,true)}${moreButton('reports',state.pages.reports)}</section>`;
}
function evidencePage(state) {
  return `${header('الشواهد','توثيق الأعمال','احتفظ بالشواهد الرقمية في مساحة حسابك الخاصة.', '<button class="button subtle" data-action="print">⎙ طباعة</button>')}
  <section class="panel"><h2>إضافة توثيق</h2><form id="evidence-form" class="form-grid">
    <label>البرنامج${programSelect()}</label><label>عنوان العمل<input name="title" maxlength="180" required></label>
    <label>تاريخ التنفيذ<input name="date" type="date"></label><label class="full">وصف العمل<textarea name="description" maxlength="2000"></textarea></label>
    <label class="full">رابط الشاهد الإلكتروني (اختياري)<input name="evidenceUrl" type="url" maxlength="2000" placeholder="https://..."><small>ارفع المستند إلى مساحة مدرستك أو Google Drive، ثم أضف رابط مشاركة يبدأ بـ https://.</small></label>
    <div class="form-actions"><button class="button primary">حفظ التوثيق</button></div>
  </form></section>
  <section class="panel"><div class="section-head"><h2>سجل الشواهد</h2><span class="pill">${state.evidence.length} سجل ظاهر</span></div>${evidenceList(state.evidence)}${moreButton('evidence',state.pages.evidence)}</section>`;
}
function portfolioPage(state) {
  const externalPortfolio = 'https://alsaabxa.github.io/safeer-re/portfolio.html';
  const actions = `<div style="display:flex;flex-wrap:wrap;gap:8px"><a class="button subtle" href="${externalPortfolio}" target="_blank" rel="noopener noreferrer">فتح ملف الإنجاز الخارجي مع QR ↗</a><button class="button subtle" data-navigate="portfolio-summary">ملخص تقاريري في المنصة</button></div>`;
  return `${header('ملف الإنجاز','ملف إنجاز الثقافة المؤسسية','أضف بياناتك وشواهدك، ثم جهّز الملف للطباعة أو التنزيل بصيغة PDF.', actions)}
    <section class="panel portfolio-library-panel">
      <div class="portfolio-library-note"><span>ⓘ</span><p>تُحفظ بيانات هذا الملف وصوره في مساحة منفصلة لهذا الحساب على هذا الجهاز. لا تُرفع الصور إلى Firebase ولا يراها مستخدمو الحسابات الأخرى.</p></div>
      <iframe id="portfolio-frame" class="portfolio-library-frame" src="/portfolio.html" title="ملف إنجاز سفير/ة الثقافة المؤسسية" loading="eager" referrerpolicy="same-origin"></iframe>
    </section>`;
}
function portfolioSummaryPage(state) {
  const p=state.profile;
  return `${header('ملخص الإنجاز','ملف الإنجاز','نسخة منظمة للطباعة أو الحفظ بصيغة PDF.','<button class="button primary" data-action="print">⎙ طباعة / حفظ PDF</button>')}
    <section class="portfolio-cover"><span class="brand-mark">س</span><div><small>ملف سفير/ة الثقافة المؤسسية · ${escapeText(p.schoolYear||'')}</small><h2>${escapeText(p.school||'اسم المدرسة')}</h2><p>${escapeText(p.name||state.user?.displayName||'')} · ${escapeText(p.manager||'')}</p></div></section>
    <section class="stats"><article><b>${state.plans.length}</b><span>أنشطة الخطة</span></article><article><b>${state.reports.length}</b><span>تقارير الإنجاز</span></article><article><b>${[...state.evidence,...state.reports].filter((item)=>item.evidenceUrl).length}</b><span>روابط الشواهد</span></article><article><b>${new Set([...state.plans,...state.reports,...state.evidence].map((item)=>item.program)).size}</b><span>برامج موثقة</span></article></section>
    <section class="panel"><h2>بيانات السفير/ة</h2><div class="summary-grid"><div><small>الاسم</small><b>${escapeText(p.name||'—')}</b></div><div><small>المدرسة</small><b>${escapeText(p.school||'—')}</b></div><div><small>المدير/ة</small><b>${escapeText(p.manager||'—')}</b></div><div><small>البريد</small><b>${escapeText(p.schoolEmail||'—')}</b></div></div></section>
    <section class="panel"><h2>الخطة التشغيلية</h2>${planTable(state.plans,false)}</section><section class="panel"><h2>التقارير والإنجازات</h2>${reportTable(state.reports,false)}</section><section class="panel"><h2>الشواهد المسجلة</h2>${evidenceList(state.evidence,false)}</section>`;
}
function planTable(items,hasMore) {
  if(!items.length)return blank('لم تضف نشاطًا إلى الخطة بعد.');
  return `<div class="table-wrap"><table><thead><tr><th>البرنامج</th><th>النشاط وطريقة التنفيذ</th><th>الفئة</th><th>التوقيت</th><th>الحالة</th><th>تاريخ الإقفال</th><th class="no-print">إجراء</th></tr></thead><tbody>${items.map((item)=>`<tr><td>${escapeText(item.program||'—')}</td><td><b>${escapeText(item.title)}</b>${item.notes?`<small>${escapeText(item.notes)}</small>`:''}<details class="plan-details"><summary>التنفيذ والشواهد</summary><div><b>طريقة التنفيذ</b><p>${escapeText(item.method||item.notes||'أضف وصف التنفيذ في الملاحظات.')}</p><b>الشواهد المقترحة</b><p>${escapeText(item.evidence||'تقرير مختصر، صور التنفيذ، وروابط المواد المستخدمة.')}</p></div></details></td><td>${escapeText(item.audience||'—')}</td><td>${escapeText(item.schedule||item.date||'—')}</td><td><select aria-label="حالة النشاط" data-plan-status="${item.id}">${statuses.map((value)=>`<option ${value===(item.status||statuses[0])?'selected':''}>${escapeText(value)}</option>`).join('')}</select></td><td><input aria-label="تاريخ إقفال النشاط" type="date" data-plan-close="${item.id}" value="${escapeText(item.closeDate||'')}" ${item.status!=='مكتمل'?'disabled':''}></td><td class="no-print"><button class="danger" data-delete-kind="plans" data-id="${item.id}">حذف</button></td></tr>`).join('')}</tbody></table></div>`;
}
function reportTable(items,allowDelete) {
  if(!items.length)return blank('لا توجد تقارير حتى الآن.');
  return `<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>البرنامج والنشاط</th><th>المستفيدون</th><th>العمل والأثر</th><th>الشواهد</th>${allowDelete?'<th class="no-print">إجراء</th>':''}</tr></thead><tbody>${items.map((item)=>`<tr><td>${escapeText(item.date||'—')}<small>${escapeText(item.semester||'')}</small></td><td><b>${escapeText(item.title)}</b><small>${escapeText(item.program)}</small></td><td>${escapeText(item.beneficiary||'—')}<small>${item.beneficiariesCount?`${escapeText(item.beneficiariesCount)} مستفيد`:''}</small></td><td>${escapeText(item.description||'—')}<small>${escapeText(item.impact||item.goal||'')}</small></td><td>${reportEvidenceLinks(item)}</td>${allowDelete?`<td class="no-print"><button class="danger" data-delete-kind="reports" data-id="${item.id}">حذف</button></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function reportEvidenceLinks(item) {
  const links = item.evidenceUrls?.length ? item.evidenceUrls : (item.evidenceUrl ? [item.evidenceUrl] : []);
  return links.length ? links.map((url, index) => `<div>${evidenceLink(url, `شاهد ${index + 1}`)}</div>`).join('') : '—';
}
function evidenceList(items,allowDelete=true) {
  if(!items.length)return blank('لا توجد شواهد حتى الآن.');
  return `<div class="evidence-list">${items.map((item)=>`<article class="evidence-row"><div class="evidence-description"><span class="pill">${escapeText(item.program)}</span><h3>${escapeText(item.title)}</h3><p>${escapeText(item.description||'')}</p><small>${escapeText(item.date||'')}</small></div><div class="file-list">${evidenceLink(item.evidenceUrl)}</div>${allowDelete?`<button class="danger no-print" data-delete-kind="evidence" data-id="${item.id}">حذف</button>`:''}</article>`).join('')}</div>`;
}
function evidenceLink(url='',label='فتح الشاهد ↗') { return url?.startsWith('https://')?`<a class="link-button" href="${escapeText(url)}" target="_blank" rel="noopener noreferrer">${escapeText(label)}</a>`:'—'; }
function moreButton(kind,page) { return page?.hasMore?`<div class="load-more no-print"><button class="button subtle" data-load-older="${kind}" ${page.loading?'disabled':''}>${page.loading?'جارٍ التحميل…':'تحميل سجلات أقدم'}</button></div>`:''; }
