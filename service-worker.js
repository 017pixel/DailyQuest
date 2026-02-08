const CACHE_NAME = 'dailyquest-cache-v8';
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
  '/css/pages/fokus.css',
  '/css/pages/dungeon.css',

  // --- NEU: Alle JS-Dateien explizit und korrekt hinzugefügt ---
  '/data/translations.js',
  '/data/exercises.js',
  '/data/achievements.js',
  '/data/dungeons.js',
  '/js/database.js',
  '/js/ui.js',
  '/js/character/page_character_stats.js',
  '/js/character/page_character_inventory.js',
  '/js/character/page_character_labels.js',
  '/js/character/page_character_main.js',
  '/js/page_exercises.js',
  '/js/page_shop.js',
  '/js/page_extra_quest.js',
  '/js/page_achievements.js',
  '/js/dungeons/dungeon_combat.js',
  '/js/dungeons/page_dungeon_main.js',
  '/js/vibe-fokus/vibe_state.js',
  '/js/vibe-fokus/page_fokus_timer.js',
  '/js/vibe-fokus/page_fokus_main.js',
  '/main.js',
  '/js/fallback-check.js',

  // Wichtige Assets
  '/icon.png',
  '/manifest.json',
  
  // Dungeon Monster Bilder
  '/Bilder-Dungeon-Monster/Wolf-ohne-Bg.png',
  '/Bilder-Dungeon-Monster/Bär-ohne-Bg.png',
  '/Bilder-Dungeon-Monster/Zombie-ohne-Bg.png'
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
