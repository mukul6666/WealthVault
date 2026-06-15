// Wealth Vault Service Worker — offline caching
const CACHE = 'wealthvault-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  // Cache-first for CDN assets, network-first for app
  const url = new URL(e.request.url);
  if(url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(
      caches.match(e.request).then(cached=>
        cached || fetch(e.request).then(res=>{
          const clone = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
          return res;
        })
      )
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(()=>caches.match(e.request))
    );
  }
});
