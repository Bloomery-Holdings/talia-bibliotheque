/* Precache the whole shelf so the tablet works offline after first visit. */
const V = 'talia-v12';
const FILES = ['./index.html','./talia-journee.html','./talia-mots-magiques.html','./talia-vie-01.html',
  './talia-leo-ballon.html','./talia-leo-jus.html',
  './talia-leo-pluie.html','./talia-sonson-mer.html','./talia-jeux.html','./talia-atelier.html',
  './talia-science-01.html','./talia-detective.html'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks =>
  Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(hit => hit ||
    fetch(e.request).then(r => { const cp = r.clone();
      caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(()=>caches.match('./index.html'))));
});
