// Service worker: red primero (siempre ves la versión más nueva), caché como respaldo sin conexión.
const CACHE = 'cecytem-101-v10-demo';
const CORE = [
  './', './index.html', './dashboard.html', './personal.html', './jefe.html', './maestros.html', './horarios.html',
  './app.js', './datos.js', './escuela.js', './avisos.js', './agenda.html', './grupo.html', './documentos.html', './style.css', './panel.css', './supabase.js',
  './manifest.webmanifest', './cecytem_logo.png', './comite_logo.png', './icon-192.png', './icon-512.png', './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // Nunca interceptar Supabase/CDN ni peticiones que no sean GET.
  if (url.origin !== self.location.origin || req.method !== 'GET') return;
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./offline.html') : Response.error())))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(l => { for (const c of l) if ('focus' in c) return c.focus(); return clients.openWindow('./horarios.html'); }));
});
