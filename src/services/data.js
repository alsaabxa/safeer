import {
  addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, startAfter, updateDoc, getDocs,
} from 'firebase/firestore';
import { firestore } from '../firebase.js';

const PAGE_SIZE = 40;
const root = (uid, kind) => collection(firestore, 'users', uid, kind);
const record = (uid, kind, id) => doc(firestore, 'users', uid, kind, id);

export function watchProfile(uid, onData, onError) {
  return onSnapshot(doc(firestore, 'users', uid, 'profile', 'main'), (snap) => onData(snap.exists() ? snap.data() : null), onError);
}
export function watchRecords(uid, kind, onData, onError) {
  const request = query(root(uid, kind), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
  return onSnapshot(request, (snap) => onData(snap.docs.map((item) => ({ id: item.id, ...item.data() })), snap.docs.at(-1) || null, snap.size === PAGE_SIZE), onError);
}
export async function loadOlder(uid, kind, cursor) {
  const request = query(root(uid, kind), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
  const snap = await getDocs(request);
  return { items: snap.docs.map((item) => ({ id: item.id, ...item.data() })), cursor: snap.docs.at(-1) || null, hasMore: snap.size === PAGE_SIZE };
}
export async function saveProfile(uid, profile) {
  const path = doc(firestore, 'users', uid, 'profile', 'main');
  const old = await getDoc(path);
  await setDoc(path, { ...profile, ...(old.exists() ? {} : { createdAt: serverTimestamp() }), updatedAt: serverTimestamp() }, { merge: true });
}
export async function addPlan(uid, values) {
  return addDoc(root(uid, 'plans'), { ...values, status: 'لم يبدأ', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function setPlanStatus(uid, id, status) {
  return updateDoc(record(uid, 'plans', id), { status, updatedAt: serverTimestamp() });
}
export async function saveReport(uid, values) {
  return saveRecord(uid, 'reports', values);
}
export async function saveEvidence(uid, values) {
  return saveRecord(uid, 'evidence', values);
}
async function saveRecord(uid, kind, values) {
  const target = doc(root(uid, kind));
  const evidenceUrl = (values.evidenceUrl || '').trim();
  if (evidenceUrl && (!evidenceUrl.startsWith('https://') || evidenceUrl.length > 2000)) {
    throw new Error('أدخل رابطًا آمنًا يبدأ بـ https:// ولا يتجاوز 2000 حرف.');
  }
  await setDoc(target, { ...values, evidenceUrl, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return target.id;
}
export async function deleteRecord(uid, kind, item) {
  await deleteDoc(record(uid, kind, item.id));
}
