import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { auth, missingFirebaseKeys } from './firebase.js';
import { operationalPlan2026 } from './catalog.js';
import {
  addPlan, deleteRecord, importOperationalPlan, loadOlder, saveEvidence,
  saveProfile, saveReport, updatePlanProgress, watchProfile, watchRecords,
} from './services/data.js';
import { authView, escapeText, resetPassword, submitAuth } from './views/auth.js';
import { renderPage } from './views/pages.js';
import './style.css';

const host=document.querySelector('#app');
const groups=['plans','reports','evidence'];
const state={user:null,profile:{},page:'home',plans:[],reports:[],evidence:[],pages:{},stops:[],busy:false};
let reportAttachments=[];
function clearReportAttachments(){reportAttachments.forEach(({url})=>URL.revokeObjectURL(url));reportAttachments=[];}
const errorText=(error)=>({
  'auth/email-already-in-use':'هذا البريد مسجل من قبل.','auth/invalid-email':'تحقق من صيغة البريد الإلكتروني.',
  'auth/invalid-credential':'البريد أو كلمة المرور غير صحيحة.','auth/weak-password':'استخدم كلمة مرور من 6 أحرف على الأقل.',
  'auth/too-many-requests':'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.','permission-denied':'تعذر الوصول. تحقق من إعدادات Firebase وقواعد الأمان.',
  'auth/user-not-found':'لا يوجد حساب بهذا البريد.'
}[error?.code]||error?.message||'تعذر إتمام العملية. تحقق من الاتصال والإعدادات.');
function toast(message){const item=document.createElement('div');item.className='toast';item.textContent=message;document.body.append(item);setTimeout(()=>item.remove(),3200);}
function stopListeners(){state.stops.forEach((stop)=>stop());state.stops=[];}
function syncGroup(kind,latest,cursor,hasMore){
  const old=state[kind];const seen=new Set(latest.map((item)=>item.id));
  const older=old.filter((item)=>!seen.has(item.id));state[kind]=[...latest,...older];
  const page=state.pages[kind]||{};state.pages[kind]={cursor:cursor||page.cursor,hasMore:hasMore||page.hasMore,loading:false};
  if(state.user)render();
}
function observeUser(user){stopListeners();clearReportAttachments();state.user=user;
  state.profile={};state.plans=[];state.reports=[];state.evidence=[];state.pages={};state.profileReady=false;
  if(!user){state.page='home';render();return;}
  state.pages={};
  state.profileReady=false;
  state.stops.push(watchProfile(user.uid,(profile)=>{
    if(state.user?.uid!==user.uid)return;
    state.profile=profile||{};
    if(profile&&!state.profileReady){
      state.profileReady=true;
      for(const kind of groups){state.pages[kind]={loading:false,hasMore:false,cursor:null};state.stops.push(watchRecords(user.uid,kind,(items,cursor,hasMore)=>{if(state.user?.uid===user.uid)syncGroup(kind,items,cursor,hasMore);},(error)=>{if(state.user?.uid===user.uid)toast(errorText(error));}));}
    }
    render();
  },(error)=>toast(errorText(error))));
  render();
}
function render(){
  if(!missingFirebaseKeys.length&&state.user){
    const labels=[['home','⌂','لوحة المتابعة'],['plan','▤','الخطة'],['reports','＋','التقارير'],['evidence','▣','الشواهد'],['portfolio','▧','ملف الإنجاز'],['profile','♙','الملف الشخصي']];
    host.innerHTML=`<div class="app-shell"><header class="topbar"><div class="brand-lockup"><span class="brand-mark small">س</span><div><b>سفير الثقافة المؤسسية</b><small>منصة التوثيق والإنجاز</small></div></div><div class="account"><span class="avatar">${escapeText((state.profile.name||state.user.displayName||state.user.email||'س').slice(0,1))}</span><div><b>${escapeText(state.profile.name||state.user.displayName||'السفير/ة')}</b><small>${escapeText(state.profile.school||state.user.email||'')}</small></div><button class="button ghost" data-action="signout">خروج</button></div></header><nav class="nav">${labels.map(([id,icon,label])=>`<button class="${state.page===id?'active':''}" data-navigate="${id}"><span>${icon}</span>${label}</button>`).join('')}</nav><main class="content">${renderPage(state.page,state)}</main></div>`;
  } else {
    const missing=missingFirebaseKeys.length?`<div class="setup-note"><b>إعداد Firebase مطلوب</b><p>أنشئ ملف <code>.env.local</code> في جذر المشروع وأضف إعدادات تطبيق الويب، ثم أعد تشغيل التطبيق.</p><small>القيم الناقصة: ${missingFirebaseKeys.map(escapeText).join('، ')}</small></div>`:'';
    host.innerHTML=`${missing}<div id="auth-slot">${authView({mode:state.authMode||'signin',error:state.authError||'',busy:state.busy||missingFirebaseKeys.length>0})}</div>`;
  }
  const reportForm=host.querySelector('#report-form');if(reportForm)updateExecutionPreview(reportForm);
}
function appendOlder(kind,items,cursor,hasMore){const current=state[kind],ids=new Set(current.map((item)=>item.id));state[kind]=[...current,...items.filter((item)=>!ids.has(item.id))];state.pages[kind]={...state.pages[kind],cursor:cursor||state.pages[kind].cursor,hasMore,loading:false};render();}
function findRecord(kind,id){return state[kind].find((item)=>item.id===id);}
function reportActivities(program){
  const templates=operationalPlan2026.map((item,index)=>({...item,key:`template-${index}`})).filter((item)=>item.program===program);
  const seen=new Set(templates.map((item)=>item.title));
  const custom=state.plans.filter((item)=>item.program===program&&!seen.has(item.title)).map((item)=>({...item,key:`plan-${item.id}`}));
  return [...templates,...custom];
}
function updateReportActivityOptions(form,program){
  const picker=form.elements.activityTemplate;
  const options=reportActivities(program);
  picker.innerHTML=`<option value="">${options.length?'اختر النشاط لتعبئة بياناته':'لا توجد أنشطة مسجلة لهذا البرنامج'}</option>${options.map((item)=>`<option value="${escapeText(item.key)}">${escapeText(item.title)}</option>`).join('')}`;
}
function updateExecutionPreview(form){
  if(!form)return;
  const values=Object.fromEntries(new FormData(form));
  const preview={
    program:values.program||'—','program-copy':values.program||'—',semester:values.semester||'—',
    date:values.date||'—',title:values.title||'—',beneficiary:values.beneficiary||'—',
    goal:values.goal||'—',description:values.description||'—',method:values.method||'—',
    impact:values.impact||'يستكمل بعد التنفيذ.',beneficiariesCount:values.beneficiariesCount||'—',
    notes:values.notes||'—',evidence:(values.evidenceUrls||'').split(/\r?\n/).map((item)=>item.trim()).filter(Boolean).join('\n')||'لا توجد روابط مضافة.',
  };
  host.querySelectorAll('[data-report-preview]').forEach((element)=>{element.textContent=preview[element.dataset.reportPreview]||'—';});
  const attachments=host.querySelector('[data-report-attachments]');
  if(attachments)attachments.innerHTML=reportAttachments.map(({file,url},index)=>`<figure class="sheet-photo"><img src="${url}" alt="شاهد ${index+1}"><figcaption>${escapeText(file.name)}</figcaption></figure>`).join('');
}
function fillReportFromActivity(form,activity){
  if(!activity)return;
  form.elements.title.value=activity.title||'';
  form.elements.goal.value=`دعم هدف نشاط «${activity.title}» لدى ${activity.audience||'الفئة المستفيدة'} وفق الخطة التشغيلية للثقافة المؤسسية لعام 2026.`;
  form.elements.date.value=activity.date||'';
  form.elements.beneficiary.value=activity.audience||'';
  form.elements.description.value=`مسودة: تنفيذ نشاط «${activity.title}» ضمن برنامج ${activity.program}. أضف تفاصيل التنفيذ الفعلي بعد انتهاء النشاط.`;
  form.elements.method.value=activity.method||'';
  form.elements.impact.value='';
  form.elements.beneficiariesCount.value='';
  updateExecutionPreview(form);
}
host.addEventListener('input',(event)=>{
  const form=event.target.closest('#report-form');
  if(form)updateExecutionPreview(form);
});
host.addEventListener('click',async(event)=>{
  const navigate=event.target.closest('[data-navigate]');if(navigate){if(navigate.dataset.program)state.reportProgram=navigate.dataset.program;state.page=navigate.dataset.navigate;render();return;}
  const authMode=event.target.closest('[data-auth-mode]');if(authMode){state.authMode=authMode.dataset.authMode;state.authError='';render();return;}
  if(event.target.closest('[data-action="signout"]')){await signOut(auth);return;}
  if(event.target.closest('[data-action="print"]')){window.print();return;}
  if(event.target.closest('[data-action="print-execution"]')){
    updateExecutionPreview(host.querySelector('#report-form'));
    document.body.classList.add('printing-execution');
    const cleanup=()=>document.body.classList.remove('printing-execution');
    window.addEventListener('afterprint',cleanup,{once:true});
    window.print();setTimeout(cleanup,1500);return;
  }
  if(event.target.closest('[data-action="import-plan"]')){
    const button=event.target.closest('[data-action="import-plan"]');if(state.busy)return;
    state.busy=true;button.disabled=true;button.textContent='جارٍ تحميل الخطة…';
    try{const count=await importOperationalPlan(state.user.uid);toast(count?`تمت إضافة ${count} نشاطًا إلى خطتك.`:'أنشطة خطة 2026 موجودة بالفعل.');}
    catch(error){toast(errorText(error));}
    finally{state.busy=false;render();}
    return;
  }
  if(event.target.closest('[data-action="reset-password"]')){const email=host.querySelector('[name="email"]')?.value.trim();try{await resetPassword(email);toast('أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.');}catch(error){state.authError=errorText(error);render();}return;}
  const load=event.target.closest('[data-load-older]');if(load){const kind=load.dataset.loadOlder,page=state.pages[kind],uid=state.user.uid;if(!page?.cursor||page.loading)return;state.pages[kind].loading=true;render();try{const result=await loadOlder(uid,kind,page.cursor);if(state.user?.uid===uid)appendOlder(kind,result.items,result.cursor,result.hasMore);}catch(error){state.pages[kind].loading=false;toast(errorText(error));render();}return;}
  const deletion=event.target.closest('[data-delete-kind]');if(deletion){const kind=deletion.dataset.deleteKind,item=findRecord(kind,deletion.dataset.id);if(!item||!confirm('حذف هذا السجل؟'))return;try{await deleteRecord(state.user.uid,kind,item);toast('تم حذف السجل.');}catch(error){toast(errorText(error));}return;}
});
host.addEventListener('change',async(event)=>{
  const reportForm=event.target.closest('#report-form');
  if(reportForm&&event.target.name==='evidenceFiles'){
    const files=[...event.target.files];
    if(files.length>5||files.some((file)=>!file.type.startsWith('image/')||file.size>5*1024*1024)){
      event.target.value='';toast('اختر حتى 5 صور، لا يتجاوز حجم الصورة 5 ميغابايت.');return;
    }
    clearReportAttachments();reportAttachments=files.map((file)=>({file,url:URL.createObjectURL(file)}));
    updateExecutionPreview(reportForm);return;
  }
  if(reportForm&&event.target.name==='program'){
    const hadSelectedActivity=Boolean(reportForm.elements.activityTemplate.value);
    state.reportProgram=event.target.value;updateReportActivityOptions(reportForm,event.target.value);
    if(hadSelectedActivity)for(const name of ['title','goal','date','beneficiary','description','method','impact','beneficiariesCount','notes','evidenceUrls'])reportForm.elements[name].value='';
    updateExecutionPreview(reportForm);return;
  }
  if(reportForm&&event.target.name==='activityTemplate'){
    const key=event.target.value;
    const activity=key.startsWith('template-')?operationalPlan2026[Number(key.slice(9))]:state.plans.find((item)=>key===`plan-${item.id}`);
    fillReportFromActivity(reportForm,activity);return;
  }
  if(reportForm){updateExecutionPreview(reportForm);return;}
  const change=event.target.closest('[data-plan-status], [data-plan-close]');if(!change)return;
  const item=findRecord('plans',change.dataset.planStatus||change.dataset.planClose);if(!item)return;
  const status=change.matches('[data-plan-status]')?change.value:item.status;
  const closeDate=change.matches('[data-plan-close]')?change.value:(item.closeDate||'');
  try{await updatePlanProgress(state.user.uid,item.id,{status,closeDate});toast(change.matches('[data-plan-close]')?'تم حفظ تاريخ الإقفال.':'تم تحديث حالة النشاط.');}
  catch(error){toast(errorText(error));render();}
});
host.addEventListener('submit',async(event)=>{
  event.preventDefault();const form=event.target;if(state.busy)return;state.busy=true;const submitButton=form.querySelector('button[type=submit],button:not([type])');if(submitButton){submitButton.disabled=true;submitButton.dataset.originalText=submitButton.textContent;submitButton.textContent='جارٍ الحفظ…';}
  try{
    if(form.id==='auth-form'){state.authMode=form.dataset.mode;await submitAuth(form);state.authError='';}
    else if(form.id==='profile-form'){const values=Object.fromEntries(new FormData(form));values.name=values.name.trim();values.school=values.school.trim();await saveProfile(state.user.uid,values);if(values.name!==state.user.displayName)await updateProfile(state.user,{displayName:values.name});state.profile={...state.profile,...values};state.page='profile';toast('حُفظت بيانات الملف.');}
    else if(form.id==='plan-form'){await addPlan(state.user.uid,Object.fromEntries(new FormData(form)));form.reset();toast('أضيف النشاط إلى الخطة.');}
    else if(form.id==='report-form'){const values=Object.fromEntries(new FormData(form));values.beneficiariesCount=Number(values.beneficiariesCount||0);values.evidenceUrls=(values.evidenceUrls||'').split(/\r?\n/).map((item)=>item.trim()).filter(Boolean);delete values.activityTemplate;delete values.evidenceFiles;await saveReport(state.user.uid,values);clearReportAttachments();form.reset();toast('تم حفظ بيانات التقرير. اطبع ورقة التنفيذ قبل مغادرة الصفحة لحفظ الصور المرفقة.');}
    else if(form.id==='evidence-form'){const values=Object.fromEntries(new FormData(form));await saveEvidence(state.user.uid,values);form.reset();toast('تم حفظ التوثيق.');}
  }catch(error){if(form.id==='auth-form'){state.authError=errorText(error);state.authMode=form.dataset.mode;}else toast(errorText(error));}
  finally{state.busy=false;render();}
});
if(missingFirebaseKeys.length){state.authError='أكمل إعداد Firebase قبل تسجيل الدخول.';render();}
else onAuthStateChanged(auth,observeUser);
