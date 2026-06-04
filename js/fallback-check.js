/**
 * Watchdog-Skript fuer kritische Fehler.
 * Wartet nach App-Ladestart und prueft, ob main.js das appReady-Signal gesetzt hat.
 * Fehlt es, wird eine progressive Fehlermeldung mit zwei Stufen angezeigt.
 */
setTimeout(() => {
    if (window.appReady) {
        console.log("Watchdog: App-Readiness-Signal gefunden. Alles in Ordnung.");
        return;
    }

    const authScreen = document.getElementById('auth-screen');
    if (authScreen && !authScreen.classList.contains('hidden')) {
        console.log("Watchdog: App wartet auf Auth-Entscheidung. Kein Fehler.");
        return;
    }

    const fallback = document.getElementById('critical-error-fallback');
    const card = document.getElementById('fallback-message-card');
    if (!fallback || !card) return;

    console.warn("Watchdog: App-Readiness-Signal fehlt. Zeige Notfall-Nachricht.");

    // Zweites Auftreten? (sessionStorage bleibt innerhalb einer Session bestehen)
    const isRetry = sessionStorage.getItem('dq_fallback_shown') === '1';
    sessionStorage.setItem('dq_fallback_shown', '1');

    // Cloud-Account erkennen (ohne dass main.js vollstaendig initialisiert sein muss)
    let hasCloudAccount = false;
    try {
        if (typeof DQ_SUPABASE !== 'undefined' && DQ_SUPABASE.currentUser && !DQ_SUPABASE.currentUser.is_anonymous) {
            hasCloudAccount = true;
        }
    } catch (e) {}

    if (!isRetry) {
        // ---- STUFE 1: Freundliche Nachricht ----
        card.innerHTML =
            '<div class="fallback-icon"><span class="material-symbols-rounded">warning</span></div>' +
            '<h3>Kleiner Fehler</h3>' +
            '<p>DailyQuest konnte leider nicht richtig starten. Meist hilft es, die App einmal zu schliessen und neu zu oeffnen.</p>' +
            '<button class="fallback-btn-primary" onclick="location.reload()">Neu laden</button>' +
            (hasCloudAccount ? '<p class="fallback-hint">Deine Daten sind sicher in der Cloud gespeichert.</p>' : '');
    } else {
        // ---- STUFE 2: Ausfuehrliche Anleitung ----
        card.innerHTML =
            '<div class="fallback-icon"><span class="material-symbols-rounded">build</span></div>' +
            '<h3>Fehler besteht weiterhin</h3>' +
            '<p>Es scheint weiterhin ein Problem zu geben, das sich nicht von alleine loesen laesst.</p>' +
            (hasCloudAccount
                ? '<p class="fallback-hint">Deine Daten sind sicher in der Cloud gespeichert. Du kannst die App in einem anderen Browser oeffnen oder den Cache leeren.</p>'
                : '<p class="fallback-hint">Bitte warte auf das naechste Update. Sollte der Fehler nach einigen Minuten weiterhin bestehen, leere den Browser-Cache oder probiere einen anderen Browser.</p>') +
            '<div class="fallback-actions">' +
                '<strong>Technische Hinweise:</strong>' +
                '<ol>' +
                    '<li>Browser-Cache und Cookies fuer diese Seite loeschen.</li>' +
                    '<li>App in einem anderen Browser testen (Chrome, Firefox, Safari).</li>' +
                '</ol>' +
            '</div>' +
            '<button class="fallback-btn-primary" onclick="location.reload()">Nochmal versuchen</button>';
    }

    fallback.classList.add('visible');
}, 5000);
