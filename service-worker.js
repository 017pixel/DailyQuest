const CACHE_NAME = 'dailyquest-cache-v4'; // --- NEU: Cache-Version erhöht ---
const urlsToCache = [
  '/',
  '/index.html',
  
  // Alle CSS-Dateien explizit hinzufügen
  '/css/main.css',
  '/css/components/buttons.css',
  '/css/components/cards.css',
  '/css/components/popups.css',
  '/css/pages/exercises.css',
  '/css/pages/character.css',
  '/css/pages/shop.css',
  '/css/pages/extra-quest.css',
  '/css/pages/achievements.css',

  // Alle JS-Dateien explizit hinzufügen
  '/data/translations.js',
  '/data/exercises.js',
  '/data/achievements.js',
  '/js/database.js',
  '/js/ui.js',
  '/js/page_character.js',
  '/js/page_exercises.js',
  '/js/page_shop.js',
  '/js/page_extra_quest.js',
  '/js/page_achievements.js',
  '/main.js',

  // Wichtige Assets
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching all app assets.');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- NEU: Alte Caches löschen für saubere Updates ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('dailyquest-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache-First-Strategie: Schnell aus dem Cache laden, wenn verfügbar
        return response || fetch(event.request);
      }
    )
  );
});