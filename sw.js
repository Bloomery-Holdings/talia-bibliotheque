/* Precache the shelf so the tablet works offline after first visit.
   2026-09-08 — TWO FAULTS FIXED, both of which showed up as "I push and she never sees it":
   1. install used caches.addAll(), which is ATOMIC. The shelf now includes a 17.8 MB chapter,
      and if any ONE file failed the whole install rejected, the new worker never activated,
      and the tablet went on serving the OLD cache for ever. Now each file is cached on its
      own and a failure costs that file, not the release.
   2. fetch was cache-first for EVERYTHING, so an updated page could not arrive while the old
      one sat in the cache. Pages (navigations) are now NETWORK-FIRST: newest when online,
      cached copy when offline. Everything else stays cache-first. */
const V = 'talia-v32';
const FILES = ['./index.html','./talia-journee.html','./talia-mots-magiques.html','./talia-vie-01.html',
  './talia-jour-01.html','./talia-defis.html','./talia-cartes.html',
  './talia-leo-ballon.html','./talia-leo-jus.html',
  './talia-leo-pluie.html','./talia-sonson-mer.html','./talia-jeux.html','./talia-atelier.html',
  './talia-science-01.html','./talia-detective.html',
  './talia-suisse-01.html',
  './pour-maman.html','./maman-preflights.html','./maman-images.html','./maman-montagne.html','./maman-choix.html'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(V)
    .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
    .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks =>
  Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';

  if (isPage) {
    // NETWORK FIRST: she gets the newest page whenever the tablet is online.
    e.respondWith(fetch(req).then(r => {
      const cp = r.clone();
      caches.open(V).then(c => c.put(req, cp));
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
    return;
  }

  // Everything else (art, audio, icons): cache first, it does not change under her.
  e.respondWith(caches.match(req).then(hit => hit ||
    fetch(req).then(r => { const cp = r.clone();
      caches.open(V).then(c => c.put(req, cp)); return r; }).catch(()=>caches.match('./index.html'))));
});
