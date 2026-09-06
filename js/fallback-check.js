/**
 * Watchdog-Skript fuer kritische Fehler.
 * Wartet nach App-Ladestart und prueft, ob main.js das appReady-Signal gesetzt hat.
 * Fehlt es, wird eine progressive Fehlermeldung mit zwei Stufen angezeigt.
 * Alle Daten liegen lokal in IndexedDB. Es gibt keinen Cloud-Sync.
 */
setTimeout(() => {
    if (window.appReady) {
        console.log("Watchdog: App-Readiness-Signal gefunden. Alles in Ordnung.");
        return;
    }

    const fallback = document.getElementById('critical-error-fallback');
    const card = document.getElementById('fallback-message-card');
    if (!fallback || !card) return;

    console.warn("Watchdog: App-Readiness-Signal fehlt. Zeige Notfall-Nachricht.");

    // Zweites Auftreten? (sessionStorage bleibt innerhalb einer Session bestehen)
    const isRetry = sessionStorage.getItem('dq_fallback_shown') === '1';
    sessionStorage.setItem('dq_fallback_shown', '1');

    if (!isRetry) {
        // ---- STUFE 1: Freundliche Nachricht ----
        card.innerHTML =
            '<div class="fallback-icon"><span class="material-symbols-rounded">warning</span></div>' +
            '<h3>Kleiner Fehler</h3>' +
            '<p>DailyQuest konnte leider nicht richtig starten. Meist hilft es, die App einmal zu schliessen und neu zu oeffnen.</p>' +
            '<button class="fallback-btn-primary" onclick="location.reload()">Neu laden</button>';
    } else {
        // ---- STUFE 2: Ausfuehrliche Anleitung ----
        card.innerHTML =
            '<div class="fallback-icon"><span class="material-symbols-rounded">build</span></div>' +
            '<h3>Fehler besteht weiterhin</h3>' +
            '<p>Es scheint weiterhin ein Problem zu geben, das sich nicht von alleine loesen laesst.</p>' +
            '<p class="fallback-hint">Deine Daten liegen nur lokal in diesem Browser. Loesche den Cache nur, wenn du vorher ein Backup per Exportieren gesichert hast.</p>' +
            '<div class="fallback-actions">' +
                '<strong>Technische Hinweise:</strong>' +
                '<ol>' +
                    '<li>App neu laden und erneut versuchen.</li>' +
                    '<li>App in einem anderen Browser testen (Chrome, Firefox, Safari).</li>' +
                '</ol>' +
            '</div>' +
            '<button class="fallback-btn-primary" onclick="location.reload()">Nochmal versuchen</button>';
    }

    fallback.classList.add('visible');
}, 5000);
