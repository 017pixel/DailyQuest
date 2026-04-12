/**
 * Watchdog-Skript für kritische Fehler.
 * Dieses Skript wird als letztes geladen. Es wartet einen kurzen Moment und prüft dann,
 * ob die Hauptanwendung (main.js) ein globales "appReady"-Signal gesetzt hat.
 * Wenn dieses Signal fehlt, wird davon ausgegangen, dass ein kritischer Fehler
 * die Initialisierung verhindert hat, und eine Notfall-Nachricht wird angezeigt.
 */
setTimeout(() => {
    // Prüfen, ob das Erfolgs-Signal von main.js gesetzt wurde.
    if (!window.appReady) {
        console.warn("Watchdog: App-Readiness-Signal nicht gefunden. Zeige Notfall-Nachricht an.");
        const fallback = document.getElementById('critical-error-fallback');
        if (fallback) {
            // Mache die standardmäßig unsichtbare Nachricht sichtbar.
            fallback.classList.add('visible');
        }
    } else {
        console.log("Watchdog: App-Readiness-Signal gefunden. Alles in Ordnung.");
    }
}, 3000); // 3 Sekunden warten, um der App Zeit zum Laden zu geben.