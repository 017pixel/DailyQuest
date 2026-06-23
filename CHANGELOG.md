# Changelog - DailyQuest

Hinweis: Dieser Changelog dokumentiert die wichtigsten technischen und inhaltlichen Updates der Anwendung.

---

## Version 2.14.0 - Manuelles Trainingsplan-System

### Erstellt
- Manuelles Trainingsplan-System (DQ_MANUAL_PLAN) als Ersatz fuer KI-Generierung
- Slide-up Panel zur Konfiguration eines eigenen Plans mit bis zu 30 Uebungen
- Custom-Exercise-Erstellung: Eigene Uebungen mit Name, Beschreibung, Typ, Basiswert anlegen
- "Selbst erstellte Uebungen"-Bereich im Freien Training
- 4 Presets: Kraft, Ausdauer, Abnehmen, Calisthenics
- Variety-Logik: Randomizer vermeidet Wiederholungen an aufeinanderfolgenden Tagen
- Neue IndexedDB-Store "custom_user_exercises" fuer eigene Uebungen
- Migration: User mit alten KI-Plaenen werden auf Standard-Preset zurueckgesetzt
- Tutorial-Onboarding ohne KI: Presets und Custom-Plan-Auswahl direkt im Tutorial

### Veraendert
- App-Version auf 2.14.0 erhoeht
- Service-Worker-Cache auf v31 erhoeht
- IndexedDB-Version auf 39 erhoeht
- Rest-Day-Logik vereinfacht: planType !== 'custom' Check entfernt, alle Pläne nutzen dieselbe Restday-Erkennung
- Rest-Day-Patterns auf 0-6 Restdays erweitert (vorher nur 0-3)
- Settings-UI: Trainingsziel-Popup zeigt Presets und Custom-Option statt KI-Generator
- Training-System: Custom-Plan-Zweige nutzen DQ_MANUAL_PLAN statt DQ_CUSTOM_PLAN

### Geloescht
- KI-Trainingsplan-System komplett entfernt (Mistral AI Integration)
- js/mistral-client.js geloescht (505 Zeilen)
- js/custom-plan-system.js geloescht (606 Zeilen)
- supabase/functions/mistral-proxy/ Edge Function geloescht (628+ Zeilen)
- dq_ai_generations Supabase-Tabelle aus schema.sql entfernt
- tests/11-custom-plan.test.js und tests/12-ai-plan-flow.test.js geloescht
- KI-bezogene Uebersetzungsschluessel entfernt
- Plan-Dokumente (plans/ai-training-plan*.md) geloescht

---

## Version 2.13.3 - Daily-Quest-Reparatur fuer Heute

### Erstellt
- Button "Daily Quests fuer heute neu generieren" in den Training-Einstellungen ergänzt
- Manueller Reparaturpfad erstellt, der heutige Daily Quests bewusst neu erzeugt
- Start-Reparatur ergänzt, die Trainingstage auch nach bereits erledigten Quests auf 6 abschliessbare Daily Quests auffuellt

### Veraendert
- App-Version auf 2.13.3 erhöht
- Service-Worker-Cache auf v30 erhöht
- IndexedDB-Version auf 38 erhöht
- Restday-Erkennung beim Top-up nutzt vorhandene Trainingsquests als Vorrang, damit echte Trainingstage nicht faelschlich blockiert werden

### Geloescht
- Blockade, bei der Custom-Restday-Logik das Auffuellen von bereits gespeicherten Trainingstagen verhindern konnte

---

## Version 2.13.2 - Streak-Filler Hotfix

### Erstellt
- Freie-Uebung-Platzhalter fuer Trainingstage mit weniger als 6 Daily Quests ergänzt
- Schutz gegen unsichtbare, unmachbare Equipment-Quests ergänzt, damit sie die Streak nicht blockieren
- Tests fuer Streak-Filler, direkte Abhakbarkeit und Restday-Ausnahme ergänzt

### Veraendert
- App-Version auf 2.13.2 erhöht
- Service-Worker-Cache auf v29 erhöht
- IndexedDB-Version auf 37 erhöht, damit der Hotfix bei bestehenden Installationen sichtbar ankommt
- Settings-Version auf v2.13.2 aktualisiert

### Geloescht
- Streak-blockierende Altlast durch zu wenige sichtbare Tagesquests wird beim App-Start ersetzt

---

## Version 2.13.1 - KI-Plan Backend Fix

### Erstellt
- Neuer echter KI-Plan-Flow-Test mit Supabase-Backend ergänzt
- Neue Backend-Prüfung für Supabase-Auth und Mistral-Antworten ergänzt
- Neue Absicherung für unvollständige KI-Trainingspläne ergänzt
- Neue Plan-Normalisierung für fehlerhafte KI-Tags ergänzt
- Neue Tests für sichtbare Fehler und stabile Plan-Aktivierung ergänzt

### Veraendert
- KI-Plan-Backend startet jetzt zuverlässig über die aktuelle Supabase-Runtime
- Mistral-Antworten werden robuster verarbeitet und vollständig validiert
- Fehlgeschlagene KI-Generierungen lassen den aktiven Plan unverändert
- Ladeanzeige, Buttontexte und Hilfetexte wurden verständlicher gemacht
- App-Version, Update-Hinweis und Offline-Cache wurden aktualisiert

### Geloescht
- Alte hängende Supabase-Function-Startlogik entfernt
- Stiller Standardplan-Fallback bei KI-Fehlern entfernt
- Abbrechen-Buttons aus Trainingsplan-Popups entfernt
- Ungültige KI-Tags vor der Planspeicherung entfernt
- Temporäre Backend-Debug-Function wieder entfernt

---

## Version 2.13.0 - KI-Trainingsplan Quality Pass

### Erstellt
- Neues kompaktes Trainingsziel-Setup in den Einstellungen ergänzt
- Neue mobile Plan-Popups für aktuellen Plan und Neugenerierung erstellt
- Neue Sicherheitslogik für KI-Pläne ohne Equipment ergänzt
- Neue Stabilitätsprüfungen für Difficulty, Phasen und Rest Days ergänzt
- Neue Release-Tests für Version, Cache und Update-Hinweis erstellt

### Veraendert
- KI-Plan-Erstellung validiert jetzt genau 30 Übungen und 4 Phasen strenger
- Tutorial-Auswahl für Trainingspläne läuft robuster und verständlicher weiter
- Eigene Zielbeschreibung ist einfacher zu bedienen und klarer gestaltet
- Supabase- und Mistral-Flow nutzt Timeout, Retry und saubere Fehlerfälle
- Update-Hinweis informiert bestehende User über die wichtigsten Verbesserungen

### Geloescht
- Zu breiter Einrichten-Button in der Training-Zeile entfernt
- Extra-Box um das eigene Plan-Eingabefeld entfernt
- Unklare Fehlerwirkung im Tutorial-Fallback entfernt
- Equipment-Pflichtquests bei deaktiviertem Equipment entfernt
- Veraltete Update-Hinweise zur ersten KI-Plan-Version ersetzt

---

## Version 2.12.0 - KI-Trainingsplan

### Erstellt
- KI-gestützter Trainingsplan-Generator mit Mistral AI (Supabase Edge Function)
- Supabase Edge Function `mistral-proxy` als sichere Middleware für Mistral API-Aufrufe
- Drei Preset-Pläne (Kraft, Ausdauer, Abnehmen) und benutzerdefinierter Freitext-Modus
- Intelligenter Balancing-Algorithmus: 30 Übungen werden tag-basiert auf 6 Quests/Tag verteilt (push/pull/legs/core/cardio/rest)
- Rest-Day-Filter: Erholungstage zeigen nur Rest-Übungen an

### Veraendert
- Trainingsziel-Dropdown durch "Trainingsplan einrichten" Button + Popup ersetzt
- Tutorial hat neue Trainingsplan-Auswahl (3 Presets + Custom-Text) statt altem Ziel-Dropdown
- Datenbank Version 36 mit neuem `custom_plans` Object Store für KI-Pläne
- Service Worker Cache v26 mit neuen Modul-Dateien (mistral-client.js, custom-plan-system.js)
- Übersetzungen (DE/EN) um alle neuen UI-Texte erweitert

### Geloescht
- Altes Trainingsziel-Dropdown (`#goal-select`) aus HTML entfernt (dynamisch per JS verwaltet)

---

## Version 2.11.0 - Konfetti-Effekt & Quest-Regenerierung

### Erstellt
- Konfetti-Effekt bei Streak-Erhöhung: Bunte Partikel explosion von links und rechts mit realistischer Physik (Schwerkraft, Luftwiderstand, Rotation)
- Adaptive Performance-Tiers (low/mid/high) je nach Geraet – funktioniert auf Low-End-Handys ohne Ruckeln
- Konfetti-Einstellung in Einstellungen → Allgemein deaktivierbar (Default: an)
- Einheitliche Funktion `applyTrainingSettingChange` fuer Training-Settings-Aenderungen

### Veraendert
- Schwierigkeit/Phase aendern skaliert nur die Parameter offener Quests (Wdh/Dauer/Mana/Gold), tauscht aber nicht die Übungen aus – neue Übungen kommen erst am naechsten Tag
- Trainingsziel/Rest Days aenderungen wirken erst am naechsten Tag, heutige Quests bleiben unangetastet
- Equipment-Off ersetzt nur unbrauchbare Hantel-Quests (wenn alle offen) durch Koerpergewicht-Alternativen
- Erledigte Quests werden bei Settings-Aenderungen nie mehr angefasst (Kern-Regel)
- Bug behoben: Nach Aenderung von Schwierigkeit mit bereits erledigten Quests wurden 12 statt 6 Quests angezeigt
- 7 fehlende DE-Uebersetzungs-Keys ergaenzt (Profil-Typ, Zeitmuster, Ausdauer-Entwicklung etc.)

### Geloescht
- Warn-Hinweis in Training-Einstellungen entfernt ("Aenderungen generieren Quests neu")

---

## Version 2.10.1 - Popup Click-to-Close Fix

### Veraendert
- Popups koennen wieder per Klick auf den Hintergrund geschlossen werden
- Klick auf Padding-Flaeche des Popups schliesst es ebenfalls
- Swipe-Down-Mechanik bleibt weiterhin erhalten

---

## Version 2.10.0 - Einstellungen Redesign & Bugfixes

### Erstellt
- Einstellungen komplett ueberarbeitet (luftiger Header, einheitliches Popup-Design, Glow-Effekt)
- Test-Suite mit 10 Modultests (Syntax, Daten, Uebersetzungen, Logik, CSS, PWA)
- Update-Popup modernisiert (einzeilige Uebersicht statt mehrseitigem Carousel)
- Notfall-Bildschirm mit zwei Stufen (freundlicher Hinweis oder technische Details)
- Theme-aware Spin-Buttons fuer Zahlenfelder in allen drei Themes

### Veraendert
- Einstellungen schliessen nicht mehr versehentlich (Event-Listener-Leak behoben)
- Trainingsphase und Daily Quests bleiben nach App-Update erhalten
- Popup-Overlay liegt jetzt ueber dem Einstellungs-Menue (Buttons sichtbar)
- Swipe-Geste zum Schliessen nur noch am oberen Handle aktiv
- Kopieren-Button unter QR-Code ist jetzt zentriert

### Geloescht
- Gruener Einstellungs-Banner durch cleanen Header mit Icon-Box ersetzt
- Ungenutzte Lerndateien geloescht
- Veraltete Supabase-Migrationsanleitung entfernt

---

## Version 2.9.1 - Fokus-Stats Bugfix

### Erstellt
- Reload-Methode fuer Fokus-Sessions die Daten frisch aus der Datenbank laedt
- Neuer Skill fuer Datenbank-Analyse mit Supabase CLI

### Verändert
- Durchschnittliche Fokuszeit auf der Charakter-Seite wird jetzt bei jedem Seitenaufruf aktualisiert
- Fokus-Statistiken zeigen immer die aktuellen Werte nach App-Neustart oder Seitenwechsel

### Geloescht
- -

---

## Version 2.9.0 - Supabase Sync Refinement & Audit

### Erstellt
- Audit-Tracking fuer Export- und Import-Vorgaenge in der Cloud-Datenbank
- Automatische Wiederherstellung von App-Version und Straf-Status beim Backup-Import
- E-Mail-Weiterleitung nach Registrierung fuer spaetere Bestaetigungs-Aktivierung

### Verändert
- Registrierungs-Flow repariert fuer korrekte Verarbeitung bei ausstehender E-Mail-Bestaetigung
- Abmeldung zeigt sofort den Anmelde-Bildschirm an
- Export- und Import-Funktion speichert nun vollstaendige lokale Einstellungen
- Backup-Import verwendet jetzt interne Popup-Benachrichtigungen statt Browser-Dialogen
- Streak-Daten-Validierung repariert fuer konsistentes Format bei korrupten Daten

### Gelöscht
- Veraltete Query-Parameter aus Script-Laden entfernt
- Unnoetiger Sofort-Sync-Aufruf bei fehlgeschlagenem Datenexport entfernt

---

## Version 2.8.0 - Supabase Cloud Sync

### Erstellt
- Vollstaendige Supabase-Integration fuer Cloud-Synchronisation
- Auth-Screen mit Login / Register / Anonymous Sign-In
- Automatischer Anonymous Login beim App-Start fuer Tracking
- Account-Tab in den Einstellungen mit Sync-Status
- `js/supabase-config.js` - Zentrale Supabase-Konfiguration
- `js/supabase-client.js` - Supabase Client mit Auth, Sync, Import/Export
- `supabase/schema.sql` - Datenbank-Schema mit RLS (Row Level Security)
- Debounced Sync (5s) + periodischer Sync (2min) + Sync bei Tab-Verlassen
- Intelligente Daten-Migration fuer bestehende User (lokale Daten werden beim ersten Login hochgeladen)
- Cross-Device Sync fuer eingeloggte User (E-Mail / Password)
- Anonymous Tracking: Daten werden gespeichert, aber kein Cross-Device Sync
- Cloud-Daten werden beim Account-Reset ebenfalls geloescht
- Service Worker Cache auf v20 aktualisiert (neue Supabase-Dateien gecacht)

### Verändert
- App ist jetzt "Online First" mit automatischer Cloud-Sicherung
- IndexedDB bleibt als lokale Performance-Schicht erhalten
- Alle DB-Schreiboperationen triggern automatischen Supabase-Sync
- README und technische Dokumentation aktualisiert
- Tutorial wird nicht gestartet wenn Auth-Screen aktiv ist
- Import-Funktion: Robuste IndexedDB-Transaktionen (kein await in Schleifen)
- `resetAllGameData` loescht auch Cloud-Daten und migrated-Flags
- App-Version auf 2.8.0 erhoeht

---

## Version 2.7.0 - Timer Feature & Buttons

### Erstellt
- Neues Timer-Popup für zeitbasierte Übungen (Plank, Side Plank, Hollow Body Hold, etc.)
- 5-Sekunden Countdown mit "GO!" Anzeige vor dem Start
- Web Worker für präzise Zeitmessung (läuft im Hintergrund weiter)
- Warnung beim Schließen des Popups während Timer läuft
- Grüne Kauf-Buttons im Shop für bessere Sichtbarkeit
- Grüne Ausrüsten-Buttons im Inventar

### Verändert
- Timer-Popup zeigt 65% der Bildschirmgröße
- Progress-Bar zeigt den Timer-Fortschritt
- Start/Pause/Fortsetzen/Geschafft-Buttons implementiert
- Senior-Modus Bug behoben (zeigt wieder 6 statt 3 Aufgaben)
- Mana und Gold Werte mehrerer Übungen angepasst
- Muskelaufbau-Pool bereinigt (Plank-Varianten entfernt)
- App-Version auf 2.7.0 erhöht

### Gelöscht
- Alte Plank-Varianten aus dem Muskelaufbau-Training (Core-Slot)

---

## Version 2.6.0 - Rentnermodus Modernisierung

### Erstellt
- 11 neue einfache Senior-Übungen hinzugefügt (arm_circles, leg_raises_seated, neck_stretch, wrist_circles, calf_stretch, shoulder_shrugs, deep_breathing, finger_spreads, knee_lifts, side_stretch)
- Tiefes Atmen als neue Übung für Entspannung
- Deutsche und englische Übersetzungen für alle neuen Übungen

### Verändert
- Rentnermodus komplett vereinfacht: keine Phasen mehr, nur noch eine tägliche Phase
- Spaziergänge zeigen keine Sätze/Wdh mehr, nur noch einmal abhaken
- Phase-Banner im Rentnermodus deaktiviert (weniger verwirrend)
- Phase-Badges im Info-Popup für Senior ausgeblendet
- Alle Senior-Übungen auf einfaches Abhaken umgestellt
- Training Plan auf tap-Modul umgestellt (direkt abhaken statt Sätze zählen)
- App-Version auf 2.6.0 erhöht
- Datenbank-Version auf 34 erhöht

### Gelöscht
- Alte Phasen im Rentnermodus (Sanfter Einstieg, Stabiler Aufbau, etc.)
- Phasen-Fortschritts-Balken im Rentnermodus

---

## Version 2.5.4 - Settings Redesign & Many Improvements

### Erstellt
- Einstellungen komplett überarbeitet mit 5 Tabs (Main, Gewicht, Training, Extras, Teilen)
- Neues Teilen-Feature mit QR-Code zum Teilen der App
- Set-Animationen beim Training (Zahlen animieren beim Klicken)
- Phasenfortschritt zeigt jetzt wie viel der Phase abgeschlossen ist
- Unendlich-Symbol für die finale Phase

### Verändert
- Tab-Wechsel mit fließender Höhen-Animation
- Pop-up-Animationen von unten (wie andere Pop-ups)
- Einstellungen öffnen und schließen mit Slide-Effekt
- Hampelmänner aus Muscle-Trainingsplan entfernt
- Ausdauer-Eintrag ohne Power-Feld
- Notizen nur noch bei Lauf-Übungen (Joggen, Walken)
- Tutorial-Neuanfang funktioniert wieder zuverlässig

### Gelöscht
- Veraltetes Power-Feld im Ausdauer-Eintrag
- Externe QR-Code-Bibliothek (jetzt lokal eingebunden)
- Scrollbereich in den Settings-Tabs

---

## Version 2.5.3 - Tutorial Reset Fix

### Dungeon-Feature Erweiterung
- **Zufällige Dungeons**: Implementierung einer 5% Wahrscheinlichkeit beim App-Start für ein Dungeon-Erscheinen.
- **Kampfsystem**: Gegner werden durch physische Übungen (Liegestütze, Squats, Sit-Ups) besiegt.
- **Skalierung**: Einführung dynamischer Monster-Stats, die mit dem Spieler-Level wachsen.
- **Belohnungen**: Mana-Steine und Mana (XP) als Belohnung für erfolgreiche Kämpfe.
- **Persistente HP**: Lebenspunkte werden zwischen Kämpfen gespeichert, was strategisches Vorgehen erfordert.
- **Monster-Typen**: Einführung von Schattenwolf, Höhlenbär und Morast-Zombie mit individuellen Eigenschaften.

### Design und UX
- **Material Symbols**: Vollständige Umstellung aller Icons auf Material Symbols Rounded für ein professionelles Design.
- **Animationen**: Neue Kampf-Animationen und visuelles Treffer-Feedback.
- **Screen Damage**: Visueller Effekt bei erlittenem Schaden zur Steigerung der Immersion.

### Technische Updates
- **Datenbank Version 27**: Neue Tabelle 'dungeon_progress' für die Speicherung des Fortschritts.
- **Service Worker v9**: Optimierter Cache für alle neuen Dungeon-Grafiken und Assets.
- **Spawn-Logik**: Fix der Zufallsberechnung für Dungeon-Erscheinungen.

---

## Version 2.2 - Dungeon Update

### Streak-Freeze Feature
- **Shop-Kategorisierung**: Streak Freezes wurden in die neue Kategorie 'Weiteres' verschoben.
- **Item-Überarbeitung**: Umbenennung von Items für bessere Konsistenz (z.B. Drachenrobe, Götter-Aura).
- **Inventar-Limit**: Begrenzung auf maximal 2 Streak Freezes gleichzeitig.
- **Automatischer Verbrauch**: Schutz der Streak bei verpassten Tagen durch automatische Nutzung.

### Balancing
- **Durchhaltevermögen**: Anpassung der Stat-Gewinne für besseres Langzeit-Balancing.
- **Zeit-Anzeige**: Umstellung von Sekunden auf Minuten in der Benutzeroberfläche für bessere Lesbarkeit.
- **Mobile Fixes**: Korrektur von Darstellungsfehlern in den Einstellungen auf Mobilgeräten.

---

## Version 2.1 - Home-Gym Revolution & Enhanced Experience

### Übungs-Bibliothek
- **Home-Gym Optimierung**: Komplette Überarbeitung der Übungen für die Nutzung mit Hanteln oder Eigengewicht.
- **Geräteunabhängigkeit**: Fokus auf Übungen, die keine komplexen Studiogeräte erfordern.

### Player-Label System
- **Adaptive Labels**: Einführung von 20 individuellen Titeln basierend auf den Spieler-Stärken.
- **Analyse-Logik**: Intelligente Vergabe von Labels wie 'Marathoner' oder 'Kraftprotz'.
- **Interaktive UI**: Tooltips zur Erklärung der verschiedenen Labels.

---

## Version 2.0 - Player Labels & Enhanced Training

- Erstmalige Einführung des Player-Label Systems.
- Erweiterung der Übungsbibliothek um über 10 neue Bewegungsformen.
- Optimierung der Restday-Erkennung und Anzeige.
- Performance-Verbesserungen bei der initialen Datenbank-Migration.

---

## Version 1.0 - Foundation

- Implementierung des Kern-Quest-Systems.
- Charakter-Stats und Ausrüstungs-Management.
- Fokus-Modul mit Pomodoro-Timer und Stoppuhr.
- Lokale Datenspeicherung mittels IndexedDB.
- Export- und Import-Funktion zur Datensicherung.
