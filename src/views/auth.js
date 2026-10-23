import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase.js';
import { saveProfile } from '../services/data.js';

export function authView({ mode = 'signin', error = '', busy = false } = {}) {
  const signup = mode === 'signup';
  return `<main class="auth-shell"><section class="auth-card"><div class="brand-mark">س</div><span class="eyebrow">بوابة سفير الثقافة المؤسسية</span><h1>${signup ? 'إنشاء حساب سفير' : 'مرحبًا بعودتك'}</h1><p class="muted">${signup ? 'أنشئ مساحة خاصة بمدرستك لتوثيق الخطة والأعمال.' : 'سجّل الدخول للوصول إلى خطتك وتقاريرك وشواهدك.'}</p>
    <div class="auth-tabs"><button data-auth-mode="signin" class="${!signup ? 'selected' : ''}">تسجيل الدخول</button><button data-auth-mode="signup" class="${signup ? 'selected' : ''}">حساب جديد</button></div>
    ${error ? `<div class="alert" role="alert">${escapeText(error)}</div>` : ''}
    <form id="auth-form" data-mode="${mode}">${signup ? `<label>الاسم الكامل<input name="name" required maxlength="100" autocomplete="name"></label><label>اسم المدرسة<input name="school" required maxlength="140"></label>` : ''}
      <label>البريد الإلكتروني<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="name@school.edu.sa"></label>
      <label>كلمة المرور<input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}"></label>
      <button class="button primary wide" ${busy ? 'disabled' : ''}>${busy ? 'جارٍ التنفيذ…' : signup ? 'إنشاء الحساب' : 'دخول آمن'}</button>${!signup ? `<button type="button" class="link-button" data-action="reset-password" ${busy ? 'disabled' : ''}>نسيت كلمة المرور؟</button>` : ''}
    </form><p class="fine-print">تُحفظ بيانات كل حساب في مساحة مستقلة ومحميّة.</p></section></main>`;
}
export async function submitAuth(form) {
  const values = Object.fromEntries(new FormData(form));
  if (form.dataset.mode === 'signup') {
    const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    await updateProfile(credential.user, { displayName: values.name.trim() });
    await saveProfile(credential.user.uid, { name: values.name.trim(), school: values.school.trim(), schoolEmail: values.email.trim() });
  } else {
    await signInWithEmailAndPassword(auth, values.email.trim(), values.password);
  }
}
export async function resetPassword(email) {
  if (!email) throw new Error('اكتب بريدك الإلكتروني في الحقل أولًا.');
  await sendPasswordResetEmail(auth, email);
}
export function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
}
