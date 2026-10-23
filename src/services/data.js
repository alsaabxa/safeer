import {
  addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, startAfter, updateDoc, getDocs,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firestore, storage } from '../firebase.js';

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
export async function saveReport(uid, values, files) {
  return saveRecordWithFiles(uid, 'reports', values, files);
}
export async function saveEvidence(uid, values, files) {
  return saveRecordWithFiles(uid, 'evidence', values, files);
}
async function saveRecordWithFiles(uid, kind, values, files) {
  if (files.length > 10) throw new Error('يمكن إرفاق 10 ملفات كحد أقصى.');
  const target = doc(root(uid, kind));
  const uploaded = [];
  try {
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) throw new Error(`الملف «${file.name}» أكبر من 15 ميغابايت.`);
      const safeName = file.name.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120);
      const path = `users/${uid}/${kind}/${target.id}/${crypto.randomUUID()}-${safeName}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });
      uploaded.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, path });
    }
    await setDoc(target, { ...values, files: uploaded, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return target.id;
  } catch (error) {
    await Promise.allSettled(uploaded.map((file) => deleteObject(ref(storage, file.path))));
    throw error;
  }
}
export async function deleteRecord(uid, kind, item) {
  await Promise.all((item.files || []).map(async (file) => {
    try { await deleteObject(ref(storage, file.path)); }
    catch (error) { if (error.code !== 'storage/object-not-found') throw error; }
  }));
  await deleteDoc(record(uid, kind, item.id));
}
export async function downloadFile(path) {
  return getDownloadURL(ref(storage, path));
}
