// Cloud Function (اختياري): يرسل إشعار Push للرئيس عند كل إدخال من السكرتارية أو طلب تعديل
// يتطلب خطة Blaze. النشر: npm i -g firebase-tools && firebase login && firebase deploy --only functions
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
admin.initializeApp();

async function pushToHeads(title, body) {
  const snap = await admin.firestore().collection('users').where('role', '==', 'head').get();
  const tokens = [];
  snap.forEach(d => (d.data().fcmTokens || []).forEach(t => tokens.push(t)));
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: { notification: { icon: 'icon-192.png', dir: 'rtl', lang: 'ar' }, fcmOptions: { link: '/hasan/' } }
  });
  // حذف التوكنات التالفة
  const bad = [];
  res.responses.forEach((r, i) => { if (!r.success && /not-registered|invalid-argument/.test(r.error?.code || '')) bad.push(tokens[i]); });
  if (bad.length) for (const d of snap.docs) { const keep = (d.data().fcmTokens || []).filter(t => !bad.includes(t)); if (keep.length !== (d.data().fcmTokens || []).length) await d.ref.update({ fcmTokens: keep }); }
}

exports.onActivity = onDocumentCreated({ document: 'activity/{id}', region: 'europe-west1' }, async e => {
  const a = e.data.data();
  if (!a || a.role === 'head') return;
  await pushToHeads(a.byName || 'السكرتارية', a.summary || 'إدخال جديد');
});
