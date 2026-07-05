/**
 * Test 09: Service-Worker-Validierung.
 * Prueft Cache-Name, Precache-URLs, und strukturelle Integritaet.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function run() {
    const t = new TestRunner('Service Worker');

    const swPath = path.join(BASE, 'service-worker.js');
    t.ok(fs.existsSync(swPath), 'service-worker.js existiert');

    const sw = fs.readFileSync(swPath, 'utf8');

    // Cache-Name
    const cacheMatch = sw.match(/dailyquest-cache-v(\d+)/);
    t.ok(!!cacheMatch, `Cache-Name gefunden (v${cacheMatch ? cacheMatch[1] : '?'})`);
    t.ok(cacheMatch && Number(cacheMatch[1]) >= 33, 'Cache-Version fuer Release 2.15.0 erhoeht');

    const mainPath = path.join(BASE, 'main.js');
    const htmlPath = path.join(BASE, 'index.html');
    const translationsPath = path.join(BASE, 'data', 'translations.js');
    const databasePath = path.join(BASE, 'js', 'database.js');
    const mainCode = fs.readFileSync(mainPath, 'utf8');
    const htmlCode = fs.readFileSync(htmlPath, 'utf8');
    const translationsCode = fs.readFileSync(translationsPath, 'utf8');
    const databaseCode = fs.readFileSync(databasePath, 'utf8');
    const appVersionMatch = mainCode.match(/APP_VERSION\s*=\s*'([^']+)'/);
    t.equal(appVersionMatch && appVersionMatch[1], '2.15.0', 'APP_VERSION ist 2.15.0');
    t.ok(htmlCode.includes('v2.15.0'), 'Settings UI zeigt v2.15.0');
    t.ok(translationsCode.includes('update_point_8'), 'Update-Hinweis fuer grosses wger-Update vorhanden');
    t.ok(databaseCode.includes('dbVersion = 41'), 'IndexedDB-Version fuer Release 2.15.0 erhoeht');
    t.ok(!databaseCode.includes("deleteObjectStore('custom_user_exercises')"), 'Migration loescht keine alten eigenen Uebungen');

    // skipWaiting
    t.ok(sw.includes('skipWaiting'), 'skipWaiting() vorhanden');

    // clients.claim
    t.ok(sw.includes('clients.claim'), 'clients.claim() vorhanden');

    // activate-Event
    t.ok(sw.includes('activate'), 'activate-Event behandelt');

    // fetch-Event
    t.ok(sw.includes('fetch'), 'fetch-Event behandelt');

    // Cache-Loeschen alter Versionen
    t.ok(sw.includes('caches.keys') || sw.includes('caches.delete'),
        'Alte Caches werden geloescht');

    // Precache-URLs extrahieren und validieren
    const arrMatch = sw.match(/urlsToCache\s*=\s*\[([\s\S]*?)\];/);
    const precacheBlock = arrMatch ? arrMatch[1] : '';

    if (precacheBlock) {
        const urls = precacheBlock
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/[\s,]+/g, '')
            .match(/'([^']+)'/g)
            ?.map(u => u.slice(1, -1))
            .filter(u => u && u !== '/') || [];

        t.ok(urls.length >= 30, `Precache-URLs (${urls.length})`);

        let missingCount = 0;
        for (const url of urls) {
            if (!url) continue;
            if (url.startsWith('http')) continue;
            const localPath = url.startsWith('/') ? url.substring(1) : url;
            const fullPath = path.join(BASE, localPath);
            if (!fs.existsSync(fullPath)) {
                if (missingCount < 10) t.ok(false, `Precache-URL "${url}" → Datei fehlt`);
                missingCount++;
            }
        }
        if (missingCount === 0) t.ok(true, 'Alle Precache-URLs existieren');
        else t.ok(false, `${missingCount} Precache-URLs verweisen auf fehlende Dateien`);
    } else {
        t.ok(false, 'Konnte Precache-Array nicht finden');
    }

    // Manifest
    const manifestPath = path.join(BASE, 'manifest.json');
    t.ok(fs.existsSync(manifestPath), 'manifest.json existiert');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    t.equal(manifest.name, 'DailyQuest', 'Manifest name = DailyQuest');
    t.ok(manifest.icons && manifest.icons.length >= 2, `Icons (${manifest.icons ? manifest.icons.length : 0})`);
    t.ok(['standalone', 'minimal-ui'].includes(manifest.display),
        `Display-Mode: ${manifest.display}`);

    // Icon-Datei existiert
    const iconPath = path.join(BASE, 'icon.png');
    t.ok(fs.existsSync(iconPath), 'icon.png existiert');
    const iconSize = fs.statSync(iconPath).size;
    t.ok(iconSize > 1000, `icon.png ist > 1 KB (${iconSize} bytes)`);

    return t;
}

module.exports = { run, name: '09-service-worker' };
