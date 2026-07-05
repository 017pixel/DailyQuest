const CACHE_NAME = 'dailyquest-cache-v33';
const WGER_IMAGE_CACHE = 'dailyquest-wger-images-v1';
const WGER_IMAGE_LIMIT = 200;

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
  '/css/pages/timer.css',
  '/css/pages/dungeon.css',
  '/tutorial/css/tutorial.css',
  '/data/translations.js',
  '/data/exercises.js',
  '/data/wger-defaults.js',
  '/data/achievements.js',
  '/data/dungeons.js',
  '/data/training_plans.js',
  '/js/database.js',
  '/js/wger-import.js',
  '/js/analytics.js',
  '/js/ui.js',
  '/js/timer-popup.js',
  '/js/character/charts/chart_canvas_base.js',
  '/js/character/page_character_cards.js',
  '/js/character/page_character_stats.js',
  '/js/character/page_character_inventory.js',
  '/js/character/page_character_labels.js',
  '/js/character/page_character_swipe.js',
  '/js/character/page_character_main.js',
  '/js/page_exercises.js',
  '/js/page_exercises_training.js',
  '/js/page_shop.js',
  '/js/page_extra_quest.js',
  '/js/page_achievements.js',
  '/js/confetti.js',
  '/js/training_system.js',
  '/js/dungeons/dungeon_combat.js',
  '/js/dungeons/page_dungeon_main.js',
  '/js/vibe-fokus/vibe_state.js',
  '/js/vibe-fokus/page_fokus_timer.js',
  '/js/vibe-fokus/page_fokus_main.js',
  '/js/supabase-config.js',
  '/js/supabase-client.js',
  '/js/manual-plan-system.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
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

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map(key => cache.delete(key)));
}

async function handleWgerImage(request, requestUrl) {
  const cache = await caches.open(WGER_IMAGE_CACHE);
  const cached = await cache.match(request);
  const isThumb = requestUrl.pathname.includes('.200x200_') || requestUrl.pathname.includes('.400x400_');

  if (isThumb && cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
      trimCache(WGER_IMAGE_CACHE, WGER_IMAGE_LIMIT);
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const requestUrl = new URL(event.request.url);
      const isSameOrigin = requestUrl.origin === self.location.origin;
      const isWgerImage = requestUrl.hostname === 'wger.de' && requestUrl.pathname.includes('/media/exercise-images/');
      if (isWgerImage) {
        return handleWgerImage(event.request, requestUrl);
      }
      const isAppAsset = isSameOrigin && (
        requestUrl.pathname === '/' ||
        requestUrl.pathname.endsWith('.html') ||
        requestUrl.pathname.endsWith('.js') ||
        requestUrl.pathname.endsWith('.css') ||
        requestUrl.pathname.startsWith('/data/')
      );

      if (isAppAsset) {
        try {
          const freshResponse = await fetch(event.request);
          if (freshResponse && freshResponse.status === 200 && freshResponse.type === 'basic') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, freshResponse.clone());
          }
          return freshResponse;
        } catch (error) {
          const fallbackResponse = await caches.match(event.request);
          if (fallbackResponse) return fallbackResponse;
          if (event.request.mode === 'navigate') {
            const fallbackPage = await caches.match('/index.html');
            if (fallbackPage) return fallbackPage;
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      }

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
