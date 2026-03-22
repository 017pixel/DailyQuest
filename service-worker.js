const CACHE_NAME = 'dailyquest-cache-v17';

const urlsToCache = [
  '/',
  '/index.html',
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
  '/tutorial/css/tutorial.css',
  '/data/translations.js',
  '/data/exercises.js',
  '/data/achievements.js',
  '/data/dungeons.js',
  '/data/training_plans.js',
  '/js/database.js',
  '/js/ui.js',
  '/js/character/page_character_stats.js',
  '/js/character/page_character_inventory.js',
  '/js/character/page_character_labels.js',
  '/js/character/page_character_main.js',
  '/js/page_exercises.js',
  '/js/page_exercises_training.js',
  '/js/page_shop.js',
  '/js/page_extra_quest.js',
  '/js/page_achievements.js',
  '/js/training_system.js',
  '/js/dungeons/dungeon_combat.js',
  '/js/dungeons/page_dungeon_main.js',
  '/js/vibe-fokus/vibe_state.js',
  '/js/vibe-fokus/page_fokus_timer.js',
  '/js/vibe-fokus/page_fokus_main.js',
  '/tutorial/js/tutorial_state.js',
  '/tutorial/js/tutorial_main.js',
  '/tutorial/js/tutorial_onboarding.js',
  '/tutorial/js/tutorial_progressive.js',
  '/tutorial/js/tutorial_triggers.js',
  '/main.js',
  '/js/fallback-check.js',
  '/icon.png',
  '/manifest.json',
  '/Bilder-Dungeon-Monster/Wolf-ohne-Bg.png',
  '/Bilder-Dungeon-Monster/Bär-ohne-Bg.png',
  '/Bilder-Dungeon-Monster/Zombie-ohne-Bg.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        urlsToCache.map(async url => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn('[SW] Precache skipped:', url, error);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('dailyquest-cache-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
