# How to Migration: Von lokaler PWA zu Supabase-connected PWA

Dieses Dokument ist eine Schritt-für-Schritt-Anleitung, um eine Progressive Web App (die lokal mit localStorage oder IndexedDB arbeitet) zu einer Cloud-connected App mit Supabase zu erweitern.

---

## Übersicht

Eine lokale PWA speichert alle Daten im Browser des Users:
- localStorage: Text-Daten (Strings, JSON)
- IndexedDB: Binärdaten, größere Datenmengen
- Service Worker: Offline-Fähigkeit

Eine Supabase-connected PWA ergänzt:
- Cloud-Synchronisation über alle Geräte
- Benutzer-Authentifizierung (Email, OAuth, Anonymous)
- Datensicherung in der Cloud
- Cross-Device Sync
- Benutzer-Account-Verwaltung

---

## Warum Supabase?

| Feature | Lokal | Supabase |
|---------|------|----------|
| Daten auf allen Geräten | Nein | Ja |
| Datensicherung | Nur local | Cloud-Backup |
| Benutzer-Accounts | Nein | Ja |
| Teilen/Teamarbeit | Nein | Ja (zukünftig) |
| Offline funktioniert | Ja | Ja (mit Sync) |

---

## Architektur

### Daten-Flow (Neue User ohne Account)
```
User öffnet App → localStorage laden → Daten in UI anzeigen
```

### Daten-Flow (Neue User mit Anmeldung)
```
User meldet sich an → localStorage laden → Supabase-Daten laden → Merge → In Supabase speichern → UI
```

### Daten-Flow (Bestehender User)
```
User öffnet App → Session prüfen → Supabase-Daten laden → UI anzeigen
```

### Daten-Flow (Daten ändern)
```
User ändert Daten → localStorage speichern → (debounced) → Supabase synchronisieren
```

---

## Phasen der Migration

### Phase 1: Supabase Projekt einrichten

1. **Supabase Projekt erstellen**
   - https://supabase.com/dashboard
   - Neues Project anlegen
   - Region wählen ( Frankfurt für Europa)
   - Passwort erstellen und sicher speichern

2. **Auth konfigurieren**
   - Authentication → Providers
   - Email/Password: Aktivieren
   - Anonymous Sign-Ins: Aktivieren (wichtig!)
   - Google OAuth: Optional (Client ID + Secret nötig)

3. **Redirect URLs konfigurieren**
   - Authentication → URL Configuration
   - Site URL: Deine Produktions-URL
   - Redirect URLs: Alle möglichen URLs eintragen

### Phase 2: Datenbank-Schema erstellen

**Grundtabelle für alle App-Daten:**

```sql
-- Eine Tabelle für alle Daten (einfacher)
CREATE TABLE user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    homework JSONB DEFAULT '[]'::jsonb,
    tests JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    grades JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS aktivieren
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policies für User-eigene Daten
CREATE POLICY "Users can view own data" ON user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON user_data
    FOR DELETE USING (auth.uid() = user_id);
```

**Wichtig:**
- `user_id` referenziert `auth.users(id)`
- `ON DELETE CASCADE` löscht Daten automatisch
- `JSONB` für flexible Datenstrukturen

### Phase 3: Frontend Integration

#### 3.1 Supabase Client einbinden

**Option A: CDN (einfach, für GitHub Pages)**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

**Option B: npm**
```bash
npm install @supabase/supabase-js
```

#### 3.2 Supabase Client initialisieren
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_PUBLISHABLE_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

**WICHTIG:** 
- NIEMALS den Service Role Key verwenden
- Nur Publishable Key für Frontend

#### 3.3 Auth State Management

```javascript
let currentUser = null;

const initAuth = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            // Daten laden
            loadDataFromSupabase();
            hideAuthScreen();
            updateAccountUI();
        } else {
            showAuthScreen();
        }
        
        // Auf Auth-Änderungen hören
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                loadDataFromSupabase();
                hideAuthScreen();
                updateAccountUI();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showAuthScreen();
                updateAccountUI();
            }
        });
    } catch (err) {
        // Offline oder Supabase nicht erreichbar
        hideAuthScreen();
    }
};
```

### Phase 4: Login-Screen erstellen

#### 4.1 UI-Struktur

Der Login-Screen sollte diese Elemente enthalten:
- Logo/App-Name
- Email/Password Formular
- "Anmelden" und "Registrieren" Modus (Toggle)
- Modus-Indikator ( Badge)
-Google OAuth Button (optional)
- "Ohne Anmeldung fortfahren" Button
- Hinweis, was die Anmeldung bringt

#### 4.2 Auth-Flow

```javascript
let authMode = 'login'; // 'login' oder 'register'
let authToken = null;

const updateAuthUI = () => {
    const badge = document.getElementById('authModeBadge');
    const submitBtn = document.getElementById('authSubmitBtn');
    
    if (authMode === 'register') {
        badge.textContent = 'Neues Konto erstellen';
        submitBtn.textContent = 'Kostenlos registrieren';
    } else {
        badge.textContent = 'Anmelden';
        submitBtn.textContent = 'Mit E-Mail anmelden';
    }
};

// Email/Password Anmeldung
document.getElementById('emailAuthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    setAuthLoading(true);
    
    try {
        if (authMode === 'register') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // WICHTIG: Redirect nach E-Mail Bestätigung
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });
            if (error) throw error;
            
            // Success-UI anzeigen
            showRegistrationSuccess();
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
        }
    } catch (err) {
        showAuthError(err.message);
    } finally {
        setAuthLoading(false);
    }
});

// Anonymous Sign-In
document.getElementById('anonymousSignInBtn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
        // Fallback: Nur lokal
        hideAuthScreen();
    }
});

// Modus wechseln
document.getElementById('toggleAuthMode').addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthUI();
});
```

#### 4.3 E-Mail Bestätigung

Nach Registration sendet Supabase eine E-Mail mit Bestätigungs-Link. Der User klickt darauf und wird zurück zur App geleitet.

**Wichtig:**
- `emailRedirectTo` muss auf deine App-URL gesetzt sein
- Die App muss die Session im URL-Parameter verarbeiten können

### Phase 5: Daten-Sync implementieren

#### 5.1 Lokal zu Supabase migrieren

```javascript
const migrateLocalDataToSupabase = async () => {
    if (!currentUser) return;
    
    const data = {
        user_id: currentUser.id,
        homework: state.homework,
        tests: state.tests,
        notes: state.notes,
        grades: state.grades,
        settings: state.settings,
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('user_data')
        .upsert(data, { onConflict: 'user_id' });
    
    if (error) console.error('Migration error:', error.message);
};
```

#### 5.2 Daten von Supabase laden

```javascript
const loadDataFromSupabase = async () => {
    if (!currentUser) return;
    
    // .maybeSingle() statt .single() um 406-Fehler zu vermeiden
    const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
    
    if (error) {
        console.error('Load error:', error.message);
        return;
    }
    
    if (data) {
        // Supabase-Daten haben Vorrang wenn keine lokalen Daten existieren
        const localHasData = /* Prüfe localStorage */;
        
        if (!localHasData) {
            state.homework = data.homework || [];
            state.tests = data.tests || [];
            state.notes = data.notes || [];
            state.grades = data.grades || [];
            saveState();
            location.reload();
        } else {
            // Merge (eigene Logik)
            mergeData(data);
        }
    } else {
        // Keine Supabase-Daten → local hochladen
        await migrateLocalDataToSupabase();
    }
};
```

#### 5.3 Automatischer Sync bei Änderungen

```javascript
let syncTimeout = null;

const saveState = () => {
    // Lokal speichern
    localStorage.setItem('hs_homework', JSON.stringify(state.homework));
    // ... andere Daten
    
    // Debounced Supabase Sync
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(syncToSupabase, 2000);
};

const syncToSupabase = async () => {
    if (!currentUser) return;
    
    const data = {
        user_id: currentUser.id,
        homework: state.homework,
        tests: state.tests,
        notes: state.notes,
        grades: state.grades,
        settings: state.settings,
        updated_at: new Date().toISOString()
    };
    
    await supabase
        .from('user_data')
        .upsert(data, { onConflict: 'user_id' });
};
```

### Phase 6: Account Management in Settings

In den Einstellungen hinzufügen:

```html
<div class="settings-section">
    <h3>Account</h3>
    <div class="account-info">
        <div class="account-avatar">
            <span class="material-icons">account_circle</span>
        </div>
        <div class="account-details">
            <p class="account-email" id="accountEmail">Nicht angemeldet</p>
            <p class="account-type" id="accountType">Lokaler Speicher</p>
        </div>
    </div>
    <div class="settings-actions">
        <button id="loginNowBtn" class="primary-btn" style="display:none;">
            Jetzt anmelden / registrieren
        </button>
        <button id="syncNowBtn" class="secondary-btn" style="display:none;">
            Jetzt synchronisieren
        </button>
        <button id="logoutBtn" class="secondary-btn" style="display:none;">Abmelden</button>
        <button id="deleteAccountBtn" class="error-btn" style="display:none;">Account löschen</button>
    </div>
</div>
```

**JavaScript:**
```javascript
const updateAccountUI = () => {
    const loginNowBtn = document.getElementById('loginNowBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    // ...
    
    if (currentUser) {
        // Angemeldet
        document.getElementById('accountEmail').textContent = currentUser.email || 'Anonym';
        document.getElementById('accountType').textContent = 'Cloud-Speicher';
        logoutBtn.style.display = 'flex';
        if (loginNowBtn) loginNowBtn.style.display = 'none';
    } else {
        // Nicht angemeldet
        document.getElementById('accountEmail').textContent = 'Nicht angemeldet';
        document.getElementById('accountType').textContent = 'Lokaler Speicher';
        logoutBtn.style.display = 'none';
        if (loginNowBtn) loginNowBtn.style.display = 'flex';
    }
};

// Login-Button
if (loginNowBtn) {
    loginNowBtn.addEventListener('click', () => {
        showAuthScreen();
    });
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// Account löschen
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    if (!confirm('Alle Daten löschen?')) return;
    
    await supabase.from('user_data').delete().eq('user_id', currentUser.id);
    await supabase.auth.signOut();
    localStorage.clear();
    location.reload();
});
```

---

## To-Do-Liste: Schritt für Schritt

### Backend (Supabase Dashboard)

- [ ] Supabase Projekt erstellen
- [ ] Datenbank-Tabelle `user_data` erstellen
- [ ] RLS Policies erstellen
- [ ] Email/Password Provider aktivieren
- [ ] Anonymous Sign-Ins aktivieren
- [ ] Redirect URLs konfigurieren
- [ ] Google OAuth konfigurieren (optional)

### Frontend (Code)

- [ ] Supabase Client via CDN einbinden
- [ ] `supabase` Objekt initialisieren
- [ ] `currentUser` Variable erstellen
- [ ] Auth State Management (`initAuth`, `onAuthStateChange`)
- [ ] Login-Screen UI erstellen (Glassmorphism)
- [ ] Email Formular mit Toggle (Login/Register)
- [ ] Anonymous Sign-In Button
- [ ] Modus-Indikator (Badge) hinzufügen
- [ ] Success-UI nach Registration
- [ ] `escapeHtml()` Security Helper
- [ ] `migrateLocalDataToSupabase()` Funktion
- [ ] `loadDataFromSupabase()` Funktion
- [ ] `syncToSupabase()` Funktion
- [ ] `saveState()` mit debounced Sync
- [ ] `updateAccountUI()` für Settings
- [ ] Account Section in Settings
- [ ] Service Worker mit Offline-Support

### Testing

- [ ] Lokal testen (npm serve oder Live Server)
- [ ] Anonymous Sign-In testen
- [ ] Email Registration testen
- [ ] Email Bestätigung + Login testen
- [ ] Daten-Migration testen (mit bestehenden localStorage-Daten)
- [ ] Cross-Device Sync testen (zweiter Browser)
- [ ] Logout + Re-Login testen
- [ ] Account löschen testen
- [ ] Auf GitHub Pages deployen
- [ ] Produktions-URL testen

---

## Häufige Fehler und wie man sie vermeidet

### 1. "window.supabase is undefined"

**Ursache:** Supabase Script wurde nicht geladen

**Fix:** CDN-Link zu jsDelivr ändern:
```html
<!-- Funktioniert nicht -->
<script src="https://unpkg.com/@supabase/supabase-js@x/dist/umd/supabase.min.js"></script>

<!-- Funktioniert -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@x/dist/umd/supabase.min.js"></script>
```

### 2. Doppelte HTML-IDs

**Problem:** Mehrere Elemente mit derselben ID

**Fix:** Eindeutige IDs verwenden:
```html
<!-- Falsch -->
<select id="gradePeriod">...</select>
<select id="gradePeriod">...</select>

<!-- Richtig -->
<select id="gradePeriod">...</select>
<select id="subjectGradePeriod">...</select>
```

### 3. XSS-Sicherheitslücken

**Problem:** User-Input wird ohne Escaping eingefügt

**Fix:** Immer escapen:
```javascript
const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Verwendung
element.innerHTML = `<div>${escapeHtml(userInput)}</div>`;
```

### 4. Endlos-Reload bei Daten-Merge

**Problem:** Nach dem Reload wird wieder gemergt → endlose Schleife

**Fix:** Kein `location.reload()` nach Merge:
```javascript
// Falsch
saveState();
await migrateLocalDataToSupabase();
location.reload();

// Richtig
saveState();
await migrateLocalDataToSupabase();
renderDashboard(); // UI neu rendern statt reload
```

### 5. HTTP 406 Fehler

**Problem:** `.single()` wirft Fehler wenn keine Daten gefunden

**Fix:** `.maybeSingle()` verwenden:
```javascript
// Wirft 406 wenn keine Daten
const { data } = await supabase.from('table').select('*').eq('user_id', id).single();

// Gibt null zurück wenn keine Daten
const { data } = await supabase.from('table').select('*').eq('user_id', id).maybeSingle();
```

### 6. Element ist null

**Problem:** Event Listener für nicht existierendes Element

**Fix:** Null-Check:
```javascript
const btn = document.getElementById('optionalButton');
if (btn) {
    btn.addEventListener('click', handler);
}
```

### 7. Service Worker cached fehlerhafte Responses

**Problem:** 404/500 Responses werden gecached

**Fix:** Status prüfen:
```javascript
fetch(request).then(response => {
    if (response && response.status === 200) {
        cache.put(request, response.clone());
    }
});
```

---

## Best Practices

1. **Immer RLS aktivieren** - Daten sind nur für den Owner sichtbar

2. **Publishable Key verwenden** - NIEMALS Service Role Key im Frontend

3. **Anonymous Sign-In ermöglichen** - User können die App erst testen

4. **Debounced Sync** - Nicht bei jeder Änderung sofort syncronisieren

5. **Graceful Degradation** - Wenn Supabase nicht erreichbar, lokal weitermachen

6. **XSS-Schutz** - Immer User-Input escapen

7. **Migration intelligent machen** - Bestehende Daten nicht überschreiben ohne zu fragen

8. **Offline zuerst** - App muss ohne Internet funktionieren

9. **Service Worker updaten** - Bei jedem Release neuen Cache-Namen

---

## Supabase MCP Server (Optional)

Für einfachere Datenbank-Operationen kann der Supabase MCP Server eingerichtet werden:

1. **.mcp.json erstellen:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

2. Token in Supabase Dashboard erstellen:
   - Settings → API → Personal Access Token

3. Token zu .mcp.json hinzufügen

4. **WICHTIG:** .mcp.json in .gitignore hinzufügen!

---

## Ressourcen

- Supabase Docs: https://supabase.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Security: https://supabase.com/docs/guides/security/product-security.md
- Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous

---

## Zusammenfassung

Die Migration von lokal zu Supabase besteht aus:

1. **Supabase einrichten** (Projekt, Auth, Schema)
2. **Client integrieren** (CDN, Initialisierung)
3. **Auth implementieren** (Login-Screen, Formulare, Anonymous)
4. **Sync implementieren** (Laden, Speichern, Migrieren)
5. **Account Management** (Settings, Buttons, Funktionen)
6. **Testen** (Alle Flows durchgehen)

Mit dieser Anleitung kann ein andere KI-Agent oder Developer die gleiche Migration in einem anderen Projekt durchführen.