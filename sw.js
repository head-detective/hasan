/* Service worker: يخزّن واجهة التطبيق للعمل بدون إنترنت ويستقبل إشعارات Firebase في الخلفية */
const CACHE = 'hd-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (e.request.method !== 'GET' || !u.startsWith(self.location.origin) || u.includes('googleapis') || u.includes('firebase')) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : clients.openWindow('./')));
});

/* إشعارات Firebase Cloud Messaging في الخلفية (تحتاج Cloud Function للإرسال — انظر functions/) */
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyC9mDYnkeBTzdNZOSs3vxqROX9HN93iTR0",
    authDomain: "hasan-head-detective.firebaseapp.com",
    projectId: "hasan-head-detective",
    storageBucket: "hasan-head-detective.firebasestorage.app",
    messagingSenderId: "14136508591",
    appId: "1:14136508591:web:51b34a45ae0122f8b7945a"
  });
  firebase.messaging().onBackgroundMessage(p => {
    const n = p.notification || {};
    self.registration.showNotification(n.title || 'تنبيه', { body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', dir: 'rtl', lang: 'ar' });
  });
} catch (e) {}
