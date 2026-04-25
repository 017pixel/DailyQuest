/**
 * @file supabase-client.js
 * @description Supabase Integration fuer DailyQuest.
 * Zweck: Cloud-Sync, Auth, Account-Management.
 * Wichtig: Laeuft komplett im Browser via CDN fuer GitHub Pages Kompatibilitaet.
 */

// --- Security Helper ---
const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const DQ_SUPABASE = {
    client: null,
    currentUser: null,
    syncTimeout: null,
    isSyncing: false,
    lastSyncAt: 0,
    _authDecisionResolver: null,
    _authScreenMode: 'intro', // 'intro' oder 'migration'

    // ==========================================
    // INITIALISIERUNG
    // ==========================================
    isConfigValid() {
        return (
            DQ_SUPABASE_CONFIG.URL &&
            DQ_SUPABASE_CONFIG.URL.startsWith('https://') &&
            DQ_SUPABASE_CONFIG.KEY &&
            DQ_SUPABASE_CONFIG.KEY.length > 20 &&
            !DQ_SUPABASE_CONFIG.URL.includes('YOUR_PROJECT')
        );
    },

    init() {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase CDN nicht geladen. window.supabase ist undefined.');
            return false;
        }

        if (!this.isConfigValid()) {
            console.warn('Supabase Config nicht valide (Platzhalter?). Supabase-Integration ist deaktiviert.');
            return false;
        }

        try {
            this.client = window.supabase.createClient(
                DQ_SUPABASE_CONFIG.URL,
                DQ_SUPABASE_CONFIG.KEY
            );
            console.log('Supabase Client initialisiert.');
            return true;
        } catch (err) {
            console.error('Supabase Client Initialisierung fehlgeschlagen:', err);
            return false;
        }
    },

    async initAuth() {
        if (!this.client) {
            console.warn('Supabase Client nicht verfuegbar. Ueberspringe Auth-Init.');
            this.hideAuthScreen();
            return;
        }

        try {
            const { data: { session } } = await this.client.auth.getSession();

            if (session) {
                // User hat bereits eine Session (z.B. nach E-Mail-Bestaetigung oder Reload)
                this.currentUser = session.user;
                const isAnon = this.currentUser.is_anonymous;
                console.log('Supabase Session gefunden fuer:', isAnon ? 'Anonym' : (this.currentUser.email || 'User'));
                await this.handleSignedIn();
            } else {
                // Keine Session vorhanden
                const decisionMade = localStorage.getItem('dq_auth_decision_made');
                if (decisionMade === 'true') {
                    // User hat sich in einer vorherigen Session schon entschieden
                    // -> Automatisch anonym anmelden
                    console.log('Keine Session, aber Auth-Entscheidung vorhanden. Melde anonym an...');
                    await this.autoSignInAnonymous();
                } else {
                    // Noch keine Entscheidung getroffen
                    // Auth-Screen wird spaeter angezeigt (durch main.js oder Tutorial)
                    console.log('Keine Session und keine Auth-Entscheidung. Warte auf User-Entscheidung...');
                    this.hideAuthScreen();
                }
            }

            // Auf Auth-Aenderungen hoeren
            this.client.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth State Change:', event);
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    this._resolveAuthDecision();
                    await this.handleSignedIn();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.showAuthScreen();
                    this.updateAccountUI();
                } else if (event === 'USER_UPDATED' && session) {
                    this.currentUser = session.user;
                    this.updateAccountUI();
                    this._resolveAuthDecision(); // Stelle sicher, dass Auth-Entscheidung als getroffen gilt
                    // Pruefe ob Anonymous -> E-Mail Migration stattgefunden hat
                    const anonUserId = localStorage.getItem('dq_migrated_from_anon');
                    if (anonUserId && !this.currentUser.is_anonymous) {
                        console.log('Anonymous -> E-Mail Migration erkannt (USER_UPDATED). Speichere in DB...');
                        try {
                            await this.client.from('user_data')
                                .update({ migrated_from_anon: anonUserId })
                                .eq('user_id', this.currentUser.id);
                            localStorage.removeItem('dq_migrated_from_anon');
                            try { DQ_UI.showCustomPopup('<h3>Account verknuepft</h3><p>Deine anonymen Daten wurden erfolgreich mit deinem neuen Account verbunden. Bitte bestaetige deine E-Mail.</p>', 'info'); } catch (popupErr) { console.warn('Popup nicht anzeigbar:', popupErr.message); }
                        } catch (e) {
                            console.warn('Fehler beim Speichern der Migration:', e);
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('Supabase Auth-Init fehlgeschlagen (Netzwerkfehler?):', err.message);
            this.hideAuthScreen();
        }
    },

    // ==========================================
    // AUTH FLOW HANDLING
    // ==========================================
    async handleSignedIn() {
        this.hideAuthScreen();
        this.updateAccountUI();
        // Stelle sicher, dass Auth-Entscheidung als getroffen markiert wird
        this._resolveAuthDecision();

        const isAnonymous = this.currentUser && this.currentUser.is_anonymous;
        const migratedKey = `dq_supabase_migrated_${this.currentUser.id}`;
        const hasMigrated = localStorage.getItem(migratedKey);

        if (!hasMigrated) {
            // Erster Login mit diesem Account -> Lade lokale Daten hoch
            console.log('Erster Login fuer diesen User. Migriere lokale Daten zu Supabase...');
            await this.syncToSupabase();
            localStorage.setItem(migratedKey, 'true');
            if (!isAnonymous) {
                // Pruefe ob von Anonymous migriert wurde
                const anonUserId = localStorage.getItem('dq_migrated_from_anon');
                if (anonUserId) {
                    // Update DB mit migrated_from_anon
                    try {
                        await this.client.from('user_data')
                            .update({ migrated_from_anon: anonUserId })
                            .eq('user_id', this.currentUser.id);
                        localStorage.removeItem('dq_migrated_from_anon');
                    } catch (e) {
                        console.warn('Fehler beim Speichern der Migration:', e);
                    }
                    try { DQ_UI.showCustomPopup('<h3>Account verknuepft</h3><p>Deine anonymen Daten wurden erfolgreich mit deinem neuen Account verbunden.</p>', 'info'); } catch (e) { console.warn('Popup nicht anzeigbar:', e.message); }
                } else {
                    try { DQ_UI.showCustomPopup('<h3>Cloud-Sync aktiviert</h3><p>Deine lokalen Daten wurden erfolgreich in die Cloud hochgeladen.</p>', 'info'); } catch (e) { console.warn('Popup nicht anzeigbar:', e.message); }
                }
            }
        } else {
            // Wiederkehrender User
            if (isAnonymous) {
                console.log('Anonymous User. Lade NICHT aus Cloud (Tracking-Modus).');
                await this.syncToSupabase();
            } else {
                console.log('Wiederkehrender User. Lade Daten aus Supabase...');
                await this.loadFromSupabase();
            }
        }

        // Starte regelmaessigen Background-Sync
        this.startPeriodicSync();
    },

    async autoSignInAnonymous() {
        if (!this.client) return;
        try {
            const { data, error } = await this.client.auth.signInAnonymously();
            if (error) {
                console.warn('Automatische anonyme Anmeldung fehlgeschlagen:', error.message);
                this.hideAuthScreen();
            } else if (data.session) {
                this.currentUser = data.session.user;
                console.log('Automatisch als Anonymous angemeldet fuer Tracking.');
                await this.handleSignedIn();
            }
        } catch (err) {
            console.warn('Fehler bei automatischer Anonymous-Anmeldung:', err);
            this.hideAuthScreen();
        }
    },

    // ==========================================
    // UI: AUTH SCREEN
    // ==========================================
    showAuthScreen(mode) {
        this._authScreenMode = mode || 'intro';
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.classList.remove('hidden');
            // Update UI basierend auf Mode
            const infoText = authScreen.querySelector('.auth-info p');
            if (infoText) {
                if (this._authScreenMode === 'migration') {
                    infoText.textContent = 'Melde dich an, um deine bestehenden lokalen Daten in die Cloud zu sichern und auf allen Geraeten zu synchronisieren.';
                } else {
                    infoText.innerHTML = '<strong>Erstelle deinen Account</strong>, um deinen Fortschritt zu sichern. Du kannst auch <em>Anonym fortfahren</em> oder dich spaeter in den Einstellungen registrieren.';
                }
            }
        }
        // App-Inhalt ausblenden waehrend Auth
        const appContainer = document.getElementById('app-container');
        const appHeader = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        if (appContainer) appContainer.style.display = 'none';
        if (appHeader) appHeader.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
    },

    hideAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.classList.add('hidden');
        const appContainer = document.getElementById('app-container');
        const appHeader = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        if (appContainer) appContainer.style.display = '';
        if (appHeader) appHeader.style.display = '';
        if (bottomNav) bottomNav.style.display = '';
    },

    waitForAuthDecision() {
        return new Promise((resolve) => {
            // Wenn bereits ein User existiert, sofort aufloesen
            if (this.currentUser) {
                resolve();
                return;
            }
            this._authDecisionResolver = resolve;
        });
    },

    _resolveAuthDecision() {
        localStorage.setItem('dq_auth_decision_made', 'true');
        if (this._authDecisionResolver) {
            this._authDecisionResolver();
            this._authDecisionResolver = null;
        }
    },

    // ==========================================
    // AUTH ACTIONS
    // ==========================================
    async signUp(email, password) {
        if (!this.client) return { error: new Error('Supabase nicht verfuegbar') };
        try {
            // HINWEIS: Wenn Email-Confirmations im Supabase Dashboard aktiviert sind,
            // muss der User seine E-Mail bestaetigen bevor er sich anmelden kann.
            // Deaktiviere sie unter: Authentication -> Providers -> Email -> Confirm email = OFF
            // fuer sofortige Registrierung ohne Bestaetigung.
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });
            if (error) throw error;

            // Nach erfolgreicher Registrierung automatisch anmelden
            // (funktioniert nur wenn Email-Confirmations im Dashboard deaktiviert sind)
            if (data.user && !data.session) {
                console.log('Registrierung erfolgreich. Versuche automatische Anmeldung...');
                const { data: signInData, error: signInError } = await this.client.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) {
                    console.warn('Automatische Anmeldung fehlgeschlagen:', signInError.message);
                } else if (signInData.session) {
                    console.log('Automatisch nach Registrierung angemeldet.');
                    return { data: signInData, error: null };
                }
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async signIn(email, password) {
        if (!this.client) return { error: new Error('Supabase nicht verfuegbar') };
        try {
            const { data, error } = await this.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async signInAnonymously() {
        if (!this.client) return { error: new Error('Supabase nicht verfuegbar') };
        try {
            const { data, error } = await this.client.auth.signInAnonymously();
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async signOut() {
        if (!this.client) return;
        this.stopPeriodicSync();
        await this.client.auth.signOut();
        this.currentUser = null;
        // Auth-Entscheidung zuruecksetzen damit beim naechsten Start
        // der Auth-Screen wieder angezeigt wird
        localStorage.removeItem('dq_auth_decision_made');
    },

    async linkAnonymousToEmail(email, password) {
        if (!this.client || !this.currentUser) {
            return { error: new Error('Nicht angemeldet') };
        }
        if (!this.currentUser.is_anonymous) {
            return { error: new Error('Nur fuer Anonymous-User verfuegbar') };
        }

        try {
            // Speichere Anonymous-User-ID fuer Migration-Tracking
            const anonUserId = this.currentUser.id;
            localStorage.setItem('dq_migrated_from_anon', anonUserId);

            // Fuege E-Mail/Passwort zum Anonymous-Account hinzu
            const { data, error } = await this.client.auth.updateUser({
                email,
                password
            });

            if (error) throw error;

            return { data, error: null };
        } catch (err) {
            localStorage.removeItem('dq_migrated_from_anon');
            return { data: null, error: err };
        }
    },

    async deleteAccount() {
        if (!this.client || !this.currentUser) return { error: new Error('Nicht angemeldet') };

        try {
            // 1. Soft-Delete in DB (Daten bleiben fuer Analytics erhalten)
            const { error: updateError } = await this.client.from('user_data')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id);

            if (updateError) {
                console.warn('Fehler beim Soft-Delete in DB:', updateError.message);
            }

            // 2. Ausloggen
            await this.signOut();

            // 3. Lokale Daten loeschen
            localStorage.clear();

            // 4. IndexedDB loeschen
            if (DQ_DB && DQ_DB.db) {
                const stores = Array.from(DQ_DB.db.objectStoreNames);
                for (const storeName of stores) {
                    try {
                        const tx = DQ_DB.db.transaction(storeName, 'readwrite');
                        tx.objectStore(storeName).clear();
                        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
                    } catch (e) { /* ignore */ }
                }
            }

            return { error: null };
        } catch (err) {
            return { error: err };
        }
    },

    // ==========================================
    // GAME RESET (Neuanfang)
    // ==========================================
    async resetGameData() {
        if (!this.client || !this.currentUser) {
            console.warn('Kein Supabase-User. Lokaler Reset ohne Cloud-Update.');
            return this.performLocalResetOnly();
        }

        try {
            // 1. Aktuelle Daten sichern (vorheriger Snapshot)
            const appData = await this.exportIndexedDB();
            const streakData = DQ_CONFIG.getStreakData();
            const extraLocal = {};
            ['dq_seen_app_version', 'lastPenaltyCheck'].forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) extraLocal[key] = val;
            });

            // 2. Aktuelle Cloud-Daten laden um reset_count und previous_data zu erhalten
            const { data: existingData, error: fetchError } = await this.client
                .from('user_data')
                .select('reset_count, previous_data')
                .eq('user_id', this.currentUser.id)
                .maybeSingle();

            if (fetchError) {
                console.warn('Fehler beim Laden von reset_count:', fetchError.message);
            }

            const newResetCount = (existingData?.reset_count || 0) + 1;

            // Bisherige previous_data als Array behalten
            let previousDataArray = [];
            if (existingData?.previous_data) {
                if (Array.isArray(existingData.previous_data)) {
                    previousDataArray = existingData.previous_data;
                } else if (typeof existingData.previous_data === 'object') {
                    // Legacy: Einzelnes Objekt zu Array konvertieren
                    previousDataArray = [existingData.previous_data];
                }
            }

            // Neuen Reset-Eintrag hinzufuegen
            previousDataArray.push({
                reset_number: newResetCount,
                reset_at: new Date().toISOString(),
                app_data: appData,
                streak_data: { ...streakData, ...extraLocal }
            });

            // Maximal 10 Reset-Historie behalten (Speicherplatz sparen)
            if (previousDataArray.length > 10) {
                previousDataArray = previousDataArray.slice(previousDataArray.length - 10);
            }

            // 3. Reset in Cloud speichern (Soft-Reset)
            const { error: updateError } = await this.client
                .from('user_data')
                .upsert({
                    user_id: this.currentUser.id,
                    app_data: {}, // Leere Daten fuer neuen Start
                    streak_data: {},
                    reset_count: newResetCount,
                    last_reset_at: new Date().toISOString(),
                    previous_data: previousDataArray,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (updateError) {
                console.error('Fehler beim Speichern des Resets in Cloud:', updateError.message);
            } else {
                console.log(`Reset #${newResetCount} in Cloud gespeichert. Historie: ${previousDataArray.length} Eintraege.`);
            }
        } catch (err) {
            console.error('Fehler beim Cloud-Reset:', err);
        }

        // 4. Lokale Daten loeschen (Auth-Session bleibt erhalten!)
        return this.performLocalResetOnly();
    },

    async performLocalResetOnly() {
        // Nur App-relevante localStorage Keys loeschen (NICHT Supabase-Auth-Keys!)
        const keysToRemove = [
            'streakData', 'dq_seen_app_version', 'lastPenaltyCheck', 'dq_last_local_update',
            'dq_has_equipment', 'dq_training_goal', 'dq_character_age', 'tutorial_reset_pending'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Migrated-Flags fuer alle User-IDs loeschen
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('dq_supabase_migrated_')) {
                localStorage.removeItem(key);
            }
        }

        // Alle IndexedDB Object Stores leeren
        if (DQ_DB && DQ_DB.db) {
            const stores = [
                'character', 'exercises', 'shop', 'daily_quests', 'extra_quest',
                'weight_entries', 'vibe_state', 'dungeon_progress', 'tutorial_state',
                'tutorial_dynamic_state', 'training_plan_state', 'training_activity_log',
                'settings', 'focus_labels'
            ];

            for (const storeName of stores) {
                try {
                    if (DQ_DB.db.objectStoreNames.contains(storeName)) {
                        const tx = DQ_DB.db.transaction(storeName, 'readwrite');
                        tx.objectStore(storeName).clear();
                        await new Promise((resolve, reject) => {
                            tx.oncomplete = resolve;
                            tx.onerror = reject;
                        });
                        console.log(`Store ${storeName} geleert.`);
                    }
                } catch (e) {
                    console.warn(`Fehler beim Leeren von ${storeName}:`, e);
                }
            }
        }

        console.log('Lokaler Reset abgeschlossen. Auth-Session bleibt erhalten.');
    },

    // ==========================================
    // DATA SYNC: LOCAL -> SUPABASE
    // ==========================================
    async syncToSupabase() {
        if (!this.client || !this.currentUser) return;
        if (this.isSyncing) return;

        if (!navigator.onLine) {
            console.log('Offline. Sync wird uebersprungen.');
            return;
        }

        this.isSyncing = true;
        console.log('Starte Sync zu Supabase...');

        try {
            const appData = await this.exportIndexedDB();
            const streakData = DQ_CONFIG.getStreakData();

            const extraLocal = {};
            ['dq_seen_app_version', 'lastPenaltyCheck'].forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) extraLocal[key] = val;
            });

            const payload = {
                user_id: this.currentUser.id,
                app_data: appData,
                streak_data: { ...streakData, ...extraLocal },
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('user_data')
                .upsert(payload, { onConflict: 'user_id' });

            if (error) {
                console.error('Supabase Sync Fehler:', error.message);
            } else {
                this.lastSyncAt = Date.now();
                console.log('Sync zu Supabase erfolgreich.');
            }
        } catch (err) {
            console.error('Unerwarteter Sync-Fehler:', err);
        } finally {
            this.isSyncing = false;
        }
    },

    // ==========================================
    // AUDIT: EXPORT / IMPORT TRACKING
    // ==========================================
    async markActivity(type) {
        if (!this.client || !this.currentUser) return;
        try {
            const payload = {};
            if (type === 'export') payload.last_exported_at = new Date().toISOString();
            if (type === 'import') payload.last_imported_at = new Date().toISOString();

            const { error } = await this.client
                .from('user_data')
                .update(payload)
                .eq('user_id', this.currentUser.id);

            if (error) {
                console.warn('Audit-Tracking Fehler:', error.message);
            } else {
                console.log(`Audit-Tracking: ${type} markiert.`);
            }
        } catch (err) {
            console.warn('Audit-Tracking Fehler:', err);
        }
    },

    // ==========================================
    // DATA SYNC: SUPABASE -> LOCAL
    // ==========================================
    async loadFromSupabase() {
        if (!this.client || !this.currentUser) return;
        if (!navigator.onLine) {
            console.log('Offline. Lade von Supabase uebersprungen.');
            return;
        }

        // Anonymous Users: KEIN Laden aus Cloud (nur Tracking)
        if (this.currentUser.is_anonymous) {
            console.log('Anonymous User: Lade keine Daten aus Cloud (Tracking-Modus).');
            return;
        }

        console.log('Lade Daten aus Supabase...');

        try {
            const { data, error } = await this.client
                .from('user_data')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .maybeSingle();

            if (error) {
                console.error('Laden aus Supabase fehlgeschlagen:', error.message);
                return;
            }

            if (!data || !data.app_data || Object.keys(data.app_data).length === 0) {
                console.log('Keine Cloud-Daten gefunden. Lokale Daten behalten.');
                return;
            }

            // Pruefe ob lokale Daten existieren
            const localChar = await DQ_CONFIG.getCharacter();
            const hasLocalData = !!localChar;

            if (!hasLocalData) {
                console.log('Keine lokalen Daten. Uebernehme Cloud-Daten...');
                await this.importIndexedDB(data.app_data);
                if (data.streak_data) {
                    const { streak, lastDate } = data.streak_data;
                    if (typeof streak === 'number') {
                        DQ_CONFIG.setStreakData(streak, lastDate || null);
                    }
                    ['dq_seen_app_version', 'lastPenaltyCheck'].forEach(key => {
                        if (data.streak_data[key] !== undefined) {
                            localStorage.setItem(key, data.streak_data[key]);
                        }
                    });
                }
                window.location.reload();
            } else {
                const cloudDate = new Date(data.updated_at).getTime();
                const localDate = parseInt(localStorage.getItem('dq_last_local_update') || '0', 10);

                if (cloudDate > localDate) {
                    console.log('Cloud-Daten sind neuer als lokale Daten.');

                    // Pruefe ob DQ_UI bereits initialisiert ist (Popup kann sonst nicht angezeigt werden)
                    const uiReady = (typeof DQ_UI !== 'undefined' && DQ_UI.elements && DQ_UI.elements.popupOverlay);
                    if (!uiReady) {
                        console.log('UI noch nicht initialisiert. Ueberspringe Cloud-Daten-Dialog, lade lokale Daten hoch.');
                        await this.syncToSupabase();
                        return;
                    }

                    const content = `
                        <h3>Cloud-Daten gefunden</h3>
                        <p>Es wurden neuere Daten in der Cloud gefunden. Moechtest du sie laden? Dadurch werden deine aktuellen lokalen Daten ueberschrieben.</p>
                        <div class="popup-actions">
                            <button id="cloud-load-cancel" class="card-button secondary-button">Lokal behalten</button>
                            <button id="cloud-load-confirm" class="card-button">Cloud laden</button>
                        </div>
                    `;
                    try {
                        DQ_UI.showCustomPopup(content, 'info');
                    } catch (popupErr) {
                        console.warn('Konnte Cloud-Daten-Dialog nicht anzeigen:', popupErr.message);
                        await this.syncToSupabase();
                        return;
                    }

                    const confirmBtn = document.getElementById('cloud-load-confirm');
                    const cancelBtn = document.getElementById('cloud-load-cancel');

                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', async () => {
                            DQ_UI.hideAllPopups();
                            await this.importIndexedDB(data.app_data);
                            if (data.streak_data) {
                                const { streak, lastDate } = data.streak_data;
                                if (typeof streak === 'number') {
                                    DQ_CONFIG.setStreakData(streak, lastDate || null);
                                }
                                ['dq_seen_app_version', 'lastPenaltyCheck'].forEach(key => {
                                    if (data.streak_data[key] !== undefined) {
                                        localStorage.setItem(key, data.streak_data[key]);
                                    }
                                });
                            }
                            window.location.reload();
                        }, { once: true });
                    }
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            DQ_UI.hideAllPopups();
                            this.syncToSupabase();
                        }, { once: true });
                    }
                } else {
                    console.log('Lokale Daten sind aktueller. Lade hoch...');
                    await this.syncToSupabase();
                }
            }
        } catch (err) {
            console.error('Fehler beim Laden aus Supabase:', err);
        }
    },

    // ==========================================
    // INDEXEDDB EXPORT / IMPORT
    // ==========================================
    async exportIndexedDB() {
        if (!DQ_DB.db) return {};

        const data = {};
        const storeNames = Array.from(DQ_DB.db.objectStoreNames);

        const tx = DQ_DB.db.transaction(storeNames, 'readonly');
        const promises = storeNames.map(storeName => {
            return new Promise((resolve, reject) => {
                const request = tx.objectStore(storeName).getAll();
                request.onsuccess = () => resolve({ name: storeName, data: request.result });
                request.onerror = (event) => reject(new Error(`Error exporting ${storeName}: ${event.target.error}`));
            });
        });

        const results = await Promise.all(promises);
        results.forEach(result => {
            data[result.name] = result.data;
        });

        return data;
    },

    async importIndexedDB(data) {
        if (!DQ_DB.db || !data) return;

        const storeNames = Array.from(DQ_DB.db.objectStoreNames);

        for (const storeName of storeNames) {
            if (!data[storeName] || !Array.isArray(data[storeName])) continue;
            try {
                await new Promise((resolve, reject) => {
                    const tx = DQ_DB.db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);

                    const clearReq = store.clear();
                    clearReq.onsuccess = () => {
                        for (const item of data[storeName]) {
                            store.put(item);
                        }
                    };
                    clearReq.onerror = () => reject(clearReq.error);

                    tx.oncomplete = () => {
                        console.log(`Store '${storeName}' aus Supabase importiert.`);
                        resolve();
                    };
                    tx.onerror = (event) => reject(event.target.error);
                });
            } catch (e) {
                console.warn(`Fehler beim Importieren von Store '${storeName}':`, e);
            }
        }
    },

    // ==========================================
    // SYNC TRIGGER
    // ==========================================
    triggerSync() {
        if (!this.client || !this.currentUser) return;
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.syncToSupabase();
        }, 5000);
    },

    startPeriodicSync() {
        if (this._periodicSyncInterval) clearInterval(this._periodicSyncInterval);
        this._periodicSyncInterval = setInterval(() => {
            if (document.hasFocus()) {
                this.syncToSupabase();
            }
        }, 120000);

        this._beforeUnloadHandler = () => {
            if (this.client && this.currentUser) {
                this.syncToSupabase();
            }
        };
        window.addEventListener('beforeunload', this._beforeUnloadHandler);

        this._visibilityHandler = () => {
            if (document.visibilityState === 'hidden' && this.client && this.currentUser) {
                this.syncToSupabase();
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);
    },

    stopPeriodicSync() {
        if (this._periodicSyncInterval) {
            clearInterval(this._periodicSyncInterval);
            this._periodicSyncInterval = null;
        }
        if (this._beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this._beforeUnloadHandler);
            this._beforeUnloadHandler = null;
        }
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = null;
        }
    },

    // ==========================================
    // ACCOUNT UI UPDATE
    // ==========================================
    updateAccountUI() {
        const accountEmail = document.getElementById('accountEmail');
        const accountType = document.getElementById('accountType');
        const loginNowBtn = document.getElementById('loginNowBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const syncNowBtn = document.getElementById('syncNowBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        const accountAvatar = document.querySelector('.account-avatar .material-symbols-rounded');

        if (this.currentUser) {
            const isAnonymous = this.currentUser.is_anonymous;
            if (accountEmail) accountEmail.textContent = isAnonymous ? 'Anonym' : (this.currentUser.email || 'User');
            if (accountType) accountType.textContent = isAnonymous ? 'Tracking aktiv (kein Cross-Device Sync)' : 'Cloud-Speicher aktiv';
            if (loginNowBtn) loginNowBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'flex';
            if (syncNowBtn) syncNowBtn.style.display = 'flex';
            if (deleteAccountBtn) deleteAccountBtn.style.display = 'flex';
            if (accountAvatar) accountAvatar.textContent = isAnonymous ? 'shield' : 'cloud_done';
        } else {
            if (accountEmail) accountEmail.textContent = 'Nicht angemeldet';
            if (accountType) accountType.textContent = 'Nur lokal (nicht synchronisiert)';
            if (loginNowBtn) loginNowBtn.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (syncNowBtn) syncNowBtn.style.display = 'none';
            if (deleteAccountBtn) deleteAccountBtn.style.display = 'none';
            if (accountAvatar) accountAvatar.textContent = 'account_circle';
        }
    },

    // ==========================================
    // SETTINGS EVENT LISTENERS
    // ==========================================
    setupSettingsListeners() {
        const loginNowBtn = document.getElementById('loginNowBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const syncNowBtn = document.getElementById('syncNowBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');

        if (loginNowBtn) {
            loginNowBtn.addEventListener('click', () => {
                this.showAuthScreen('migration');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const isAnon = this.currentUser && this.currentUser.is_anonymous;
                if (isAnon) {
                    if (!confirm('WARNUNG: Als Anonymous-User ausloggen bedeutet, dass deine Cloud-Daten nicht mehr zugaenglich sind. Beim naechsten Start wird ein neuer Anonymous-Account erstellt. Moechtest du trotzdem fortfahren?')) return;
                } else {
                    if (!confirm('Moechtest du dich wirklich abmelden? Deine Daten bleiben lokal gespeichert, aber werden nicht mehr synchronisiert.')) return;
                }
                await this.signOut();
                this.showAuthScreen();
                if (isAnon) {
                    DQ_UI.showCustomPopup('<h3>Abgemeldet</h3><p>Du wurdest als Anonymous-User abgemeldet. Beim naechsten Start kannst du dich neu anmelden.</p>', 'info');
                } else {
                    DQ_UI.showCustomPopup('<h3>Abgemeldet</h3><p>Du wurdest erfolgreich abgemeldet. Neue Daten werden nicht mehr in die Cloud gesichert.</p>', 'info');
                }
            });
        }

        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                DQ_UI.showCustomPopup('<h3>Sync...</h3><p>Daten werden synchronisiert...</p>', 'info');
                await this.syncToSupabase();
                DQ_UI.hideAllPopups();
                DQ_UI.showCustomPopup('<h3>Sync abgeschlossen</h3><p>Deine Daten wurden erfolgreich in der Cloud gespeichert.</p>', 'info');
            });
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                if (!confirm('WARNUNG: Dein Account wird als geloescht markiert. Deine Daten bleiben fuer Analytics-Zwecke gespeichert, sind aber nicht mehr zugaenglich. Bist du sicher?')) return;
                if (!confirm('LETZTE WARNUNG: Dies kann NICHT rueckgaengig gemacht werden. Fortfahren?')) return;

                DQ_UI.showCustomPopup('<h3>Loesche Account...</h3><p>Bitte warten...</p>', 'info');
                const { error } = await this.deleteAccount();
                DQ_UI.hideAllPopups();
                if (error) {
                    DQ_UI.showCustomPopup(`<h3>Fehler</h3><p>${escapeHtml(error.message)}</p>`, 'penalty');
                } else {
                    DQ_UI.showCustomPopup('<h3>Account geloescht</h3><p>Dein Account wurde geloescht. Die Seite wird neu geladen.</p>', 'info');
                    setTimeout(() => window.location.reload(), 2000);
                }
            });
        }
    }
};

// --- AUTH SCREEN EVENT LISTENERS (nach DOM Ready) ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth Mode Toggle
    const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
    const authModeBadge = document.getElementById('authModeBadge');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authForm = document.getElementById('emailAuthForm');
    const anonymousBtn = document.getElementById('anonymousSignInBtn');
    const authError = document.getElementById('authError');

    let authMode = 'register';

    function setAuthLoading(loading) {
        if (authSubmitBtn) {
            authSubmitBtn.disabled = loading;
            authSubmitBtn.textContent = loading
                ? (authMode === 'register' ? 'Registriere...' : 'Melde an...')
                : (authMode === 'register' ? 'Kostenlos registrieren' : 'Mit E-Mail anmelden');
        }
        if (anonymousBtn) anonymousBtn.disabled = loading;
    }

    function showAuthError(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.style.display = 'block';
        }
    }

    function hideAuthError() {
        if (authError) authError.style.display = 'none';
    }

    function showRegistrationSuccess() {
        const successEl = document.getElementById('authRegistrationSuccess');
        if (successEl) successEl.style.display = 'block';
        if (authForm) authForm.style.display = 'none';
    }

    function updateAuthUI() {
        if (!authModeBadge || !authSubmitBtn) return;
        if (authMode === 'register') {
            authModeBadge.textContent = 'Neues Konto erstellen';
            authModeBadge.style.background = '#5f8575';
            authSubmitBtn.textContent = 'Kostenlos registrieren';
            authSubmitBtn.style.background = '#5f8575';
            if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = 'Bereits registriert? Anmelden';
        } else {
            authModeBadge.textContent = 'Anmelden';
            authModeBadge.style.background = '#5f8575';
            authSubmitBtn.textContent = 'Mit E-Mail anmelden';
            authSubmitBtn.style.background = '#5f8575';
            if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = 'Noch kein Konto? Registrieren';
        }
    }

    if (toggleAuthModeBtn) {
        toggleAuthModeBtn.addEventListener('click', () => {
            authMode = authMode === 'login' ? 'register' : 'login';
            hideAuthError();
            updateAuthUI();
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthError();

            const emailInput = document.getElementById('authEmail');
            const passwordInput = document.getElementById('authPassword');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!email || !password) {
                showAuthError('Bitte E-Mail und Passwort eingeben.');
                return;
            }

            setAuthLoading(true);

            if (authMode === 'register') {
                // Pruefe ob aktuell Anonymous-User -> dann linken statt neu registrieren
                if (DQ_SUPABASE.currentUser && DQ_SUPABASE.currentUser.is_anonymous) {
                    const { error } = await DQ_SUPABASE.linkAnonymousToEmail(email, password);
                    if (error) {
                        showAuthError(error.message);
                        setAuthLoading(false);
                    } else {
                        showRegistrationSuccess();
                        setAuthLoading(false);
                        // E-Mail muss bestaetigt werden
                        // Der onAuthStateChange feuert erst nach Bestaetigung
                    }
                } else {
                    const { data, error } = await DQ_SUPABASE.signUp(email, password);
                    if (error) {
                        showAuthError(error.message);
                        setAuthLoading(false);
                    } else if (data && data.session) {
                        // Automatische Anmeldung nach Registrierung erfolgreich
                        // onAuthStateChange wird 'SIGNED_IN' feuern
                        setAuthLoading(false);
                    } else {
                        showRegistrationSuccess();
                        setAuthLoading(false);
                        // NICHT _resolveAuthDecision aufrufen, wenn E-Mail-Bestaetigung aussteht.
                        // Der User ist noch nicht wirklich eingeloggt.
                    }
                }
            } else {
                const { error } = await DQ_SUPABASE.signIn(email, password);
                if (error) {
                    showAuthError(error.message);
                    setAuthLoading(false);
                }
                // Bei Erfolg wird onAuthStateChange 'SIGNED_IN' feuern
            }
        });
    }

    if (anonymousBtn) {
        anonymousBtn.addEventListener('click', async () => {
            hideAuthError();
            setAuthLoading(true);
            const { error } = await DQ_SUPABASE.signInAnonymously();
            if (error) {
                showAuthError(error.message);
                setAuthLoading(false);
            }
            // Bei Erfolg wird onAuthStateChange 'SIGNED_IN' feuern -> _resolveAuthDecision
        });
    }

    // Initial UI state
    updateAuthUI();
});
