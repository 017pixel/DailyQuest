document.addEventListener('DOMContentLoaded', () => { 
    // --- Streak Feature ---
    function getStreakData() {
        const data = localStorage.getItem('streakData');
        if (!data) return { streak: 0, lastDate: null };
        try { return JSON.parse(data); } catch { return { streak: 0, lastDate: null }; }
    }
    function setStreakData(streak, lastDate) {
        localStorage.setItem('streakData', JSON.stringify({ streak, lastDate }));
    }
    function updateStreakDisplay() {
        const streakBox = document.getElementById('streak-value');
        if (!streakBox) return;
        const { streak } = getStreakData();
        streakBox.textContent = streak;
    }
    // Call once on load
    updateStreakDisplay();
    // --- DOM-Elemente ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    const headerTitle = document.getElementById('header-title');
    const questList = document.getElementById('quest-list');
    const exerciseList = document.getElementById('exercise-list');
    const freeExerciseFilters = document.getElementById('free-exercise-filters');
    const characterSheet = document.getElementById('character-sheet');
    const characterStats = document.getElementById('character-stats');
    const equipmentContainer = document.getElementById('equipment-container');
    const inventoryContainer = document.getElementById('inventory-container');
    const shopItems = document.getElementById('shop-items');
    const shopFilters = document.getElementById('shop-filters');
    const popupOverlay = document.getElementById('popup-overlay');
    const infoPopup = document.getElementById('info-popup');
    const infoPopupContent = document.getElementById('info-popup-content');
    const notificationPopup = document.getElementById('notification-popup');
    const notificationPopupContent = document.getElementById('notification-popup-content');
    const settingsPopup = document.getElementById('settings-popup');
    const allPopups = [infoPopup, notificationPopup, settingsPopup];
    const settingsButton = document.getElementById('settings-button');
    const languageSelect = document.getElementById('language-select');
    const themeToggle = document.getElementById('theme-toggle');
    const difficultySlider = document.getElementById('difficulty-slider');
    const difficultyValue = document.getElementById('difficulty-value');
    const goalSelect = document.getElementById('goal-select');
    const restdaysSelect = document.getElementById('restdays-select');
    const characterNameInput = document.getElementById('character-name-input');

    // --- Zustandsvariablen & Konfiguration ---
    let db;
    let currentShopFilter = 'all';
    let currentFreeExerciseFilter = 'all';
    let touchStartY = 0;
    let currentPopup = null;
    let userSettings = {};
    let dailyCheckInterval = null;

    const translations = {
        de: {
            exercises: "Übungen 🏋️‍♀️", character: "Charakter 👤", shop: "Shop 🛒",
            base_stats: "Basis-Stats 📊", equipment: "Ausrüstung 🛡️", inventory: "Inventar 🎒",
            settings: "Einstellungen", language: "Sprache", theme: "Theme",
            difficulty: "Schwierigkeit (Dailies)", training_goal: "Trainingsziel",
            goal_muscle: "Muskelaufbau", goal_endurance: "Ausdauer", goal_fatloss: "Abnehmen", goal_kraft_abnehmen: "Kraft + Abnehmen",
            rest_days: "Rest Days / Woche", 
            filter_all: "Alle", filter_weapon: "Waffen", filter_armor: "Rüstung", filter_mana: "Mana",
            filter_muscle: "Kraft", filter_endurance: "Ausdauer", filter_fatloss: "Fettverbrennung", filter_bodyweight: "Körpergewicht", filter_restday: "Erholung",
            daily_quests: "Daily Quests 🔥", free_training: "Freies Training", character_name: "Name",
            penalty_title: "STRAFE WIRD VOLLZOGEN",
            penalty_text: "Du hast deine täglichen Quests nicht erfüllt. Deine Nachlässigkeit hat Konsequenzen.",
            stat_increase_title: "STAT ERHÖHT!",
            stat_increase_text: "Dein Attribut '{statName}' wurde um 1 erhöht!",
            show_instructions: "Anleitung anzeigen",
            exercise_names: {
                bicep_curls: "Bizeps Curls 💪", dumbbell_rows: "Hantel-Rudern 💪", push_ups_narrow: "Liegestütze (eng) 💪",
                weighted_squats: "Kniebeugen mit Gewicht 🦵", barbell_rows: "Langhantel-Rudern", dumbbell_press: "Bankdrücken (Hantel)",
                shoulder_press: "Schulterdrücken (Hantel)", deadlifts: "Kreuzheben (Langhantel)", burpees: "Burpees 🥵",
                jumping_jacks: "Hampelmänner", high_knees: "Laufen am Platz (High Knees)", kettlebell_swings: "Kettlebell Swings",
                box_jumps: "Box Jumps 🤸‍♀️", mountain_climbers: "Mountain Climbers 🔥", jump_squats: "Jump Squats 🔥",
                interval_sprint: "Intervall-Sprint", walking_lunges: "Ausfallschritte im Gehen", rowing_machine: "Rudern (Maschine/Band)",
                walk_30min: "30 Min Spaziergang 🚶‍♂️", read_15pages: "15 Seiten lesen 📚", healthy_snack: "Gesunden Snack zubereiten 🥗",
                stretch_10min: "10 Min leichtes Dehnen 🧘‍♂️", learn_something: "Etwas Neues lernen", general_workout: "Allgemeines Workout ⚡️",
                plank: "Plank ⏱️", situps: "Situps 🔥", knee_push_ups: "Knieliegestütze 💪", tricep_dips_chair: "Trizep Dips (Stuhl) 💪",
                lunges: "Ausfallschritte 🦵", sumo_squats: "Sumo Squats 🦵", glute_bridges: "Brücke ",
                tricep_extensions: "Trizepsheben 💪", side_plank: "Seitliche Plank ⏱️", pinterest_workout: "Pinterest Video Workout 📹"
            }
        },
        en: {
            exercises: "Workouts 🏋️‍♀️", character: "Character 👤", shop: "Shop 🛒",
            base_stats: "Base-Stats 📊", equipment: "Equipment 🛡️", inventory: "Inventory 🎒",
            settings: "Settings", language: "Language", theme: "Theme",
            difficulty: "Difficulty (Dailies)", training_goal: "Training Goal",
            goal_muscle: "Muscle Building", goal_endurance: "Endurance", goal_fatloss: "Fat Loss", goal_kraft_abnehmen: "Strength + Fat Loss",
            rest_days: "Rest Days / Week", 
            filter_all: "All", filter_weapon: "Weapons", filter_armor: "Armor", filter_mana: "Mana",
            filter_muscle: "Strength", filter_endurance: "Endurance", filter_fatloss: "Fat Loss", filter_bodyweight: "Bodyweight", filter_restday: "Recovery",
            daily_quests: "Daily Quests 🔥", free_training: "Free Training", character_name: "Name",
            penalty_title: "PENALTY IS BEING ENFORCED",
            penalty_text: "You have failed to complete your daily quests. Your negligence has consequences.",
            stat_increase_title: "STAT INCREASED!",
            stat_increase_text: "Your '{statName}' attribute increased by 1!",
            show_instructions: "Show Instructions",
            exercise_names: {
                bicep_curls: "Bicep Curls 💪", dumbbell_rows: "Dumbbell Rows 💪", push_ups_narrow: "Push-ups (narrow) 💪",
                weighted_squats: "Weighted Squats 🦵", barbell_rows: "Barbell Rows", dumbbell_press: "Dumbbell Press",
                shoulder_press: "Shoulder Press", deadlifts: "Deadlifts", burpees: "Burpees 🥵",
                jumping_jacks: "Jumping Jacks", high_knees: "High Knees", kettlebell_swings: "Kettlebell Swings",
                box_jumps: "Box Jumps 🤸‍♀️", mountain_climbers: "Mountain Climbers 🔥", jump_squats: "Jump Squats 🔥",
                interval_sprint: "Interval Sprint", walking_lunges: "Walking Lunges", rowing_machine: "Rowing (Machine/Band)",
                walk_30min: "30 Min Walk 🚶‍♂️", read_15pages: "Read 15 Pages 📚", healthy_snack: "Prepare a healthy Snack 🥗",
                stretch_10min: "10 Min Light Stretching 🧘‍♂️", learn_something: "Learn something new", general_workout: "General Workout ⚡️",
                plank: "Plank ⏱️", situps: "Situps 🔥", knee_push_ups: "Knee Push-ups 💪", tricep_dips_chair: "Tricep Dips (Chair) 💪",
                lunges: "Lunges 🦵", sumo_squats: "Sumo Squats 🦵", glute_bridges: "Glute Bridges ",
                tricep_extensions: "Tricep Extensions 💪", side_plank: "Side Plank ⏱️", pinterest_workout: "Pinterest Video Workout 📹"
            }
        }
    };

    const exercisePool = {
        muscle: [
            { id: 101, nameKey: 'bicep_curls', type: 'reps', baseValue: 10, mana: 20, gold: 6 },
            { id: 102, nameKey: 'dumbbell_rows', type: 'reps', baseValue: 8, mana: 22, gold: 7 },
            { id: 103, nameKey: 'push_ups_narrow', type: 'reps', baseValue: 8, mana: 20, gold: 5 },
            { id: 104, nameKey: 'weighted_squats', type: 'reps', baseValue: 10, mana: 25, gold: 7 },
            { id: 105, nameKey: 'barbell_rows', type: 'reps', baseValue: 8, mana: 30, gold: 10 },
            { id: 106, nameKey: 'dumbbell_press', type: 'reps', baseValue: 8, mana: 30, gold: 10 },
            { id: 107, nameKey: 'shoulder_press', type: 'reps', baseValue: 8, mana: 25, gold: 8 },
            { id: 108, nameKey: 'deadlifts', type: 'reps', baseValue: 5, mana: 40, gold: 15 },
        ],
        endurance: [
            { id: 201, nameKey: 'burpees', type: 'reps', baseValue: 10, mana: 35, gold: 12 },
            { id: 202, nameKey: 'jumping_jacks', type: 'time', baseValue: 60, mana: 20, gold: 6 },
            { id: 203, nameKey: 'high_knees', type: 'time', baseValue: 45, mana: 20, gold: 7 },
            { id: 204, nameKey: 'kettlebell_swings', type: 'reps', baseValue: 15, mana: 30, gold: 10 },
            { id: 205, nameKey: 'box_jumps', type: 'reps', baseValue: 10, mana: 25, gold: 9 },
        ],
        fatloss: [
            { id: 301, nameKey: 'mountain_climbers', type: 'time', baseValue: 30, mana: 30, gold: 9 },
            { id: 302, nameKey: 'jump_squats', type: 'reps', baseValue: 15, mana: 25, gold: 8 },
            { id: 303, nameKey: 'interval_sprint', type: 'check', baseValue: 1, mana: 50, gold: 20 },
            { id: 304, nameKey: 'walking_lunges', type: 'reps', baseValue: 20, mana: 20, gold: 6 },
            { id: 305, nameKey: 'rowing_machine', type: 'time', baseValue: 120, mana: 30, gold: 10 },
        ],
        kraft_abnehmen: [
            { id: 501, nameKey: 'plank', type: 'time', baseValue: 30, mana: 25, gold: 8 },
            { id: 502, nameKey: 'situps', type: 'reps', baseValue: 15, mana: 20, gold: 6 },
            { id: 503, nameKey: 'knee_push_ups', type: 'reps', baseValue: 10, mana: 18, gold: 5 },
            { id: 504, nameKey: 'tricep_dips_chair', type: 'reps', baseValue: 10, mana: 22, gold: 7 },
            { id: 505, nameKey: 'lunges', type: 'reps', baseValue: 16, mana: 20, gold: 6 },
            { id: 506, nameKey: 'sumo_squats', type: 'reps', baseValue: 12, mana: 25, gold: 8 },
            { id: 507, nameKey: 'glute_bridges', type: 'reps', baseValue: 15, mana: 18, gold: 5 },
            { id: 508, nameKey: 'tricep_extensions', type: 'reps', baseValue: 12, mana: 20, gold: 7 },
            { id: 509, nameKey: 'side_plank', type: 'time', baseValue: 20, mana: 22, gold: 7 },
            { id: 510, nameKey: 'pinterest_workout', type: 'link', baseValue: 1, mana: 60, gold: 20, url: 'https://pin.it/4DkPZ9zHx' }
        ],
        restday: [
            { id: 401, nameKey: 'walk_30min', type: 'check', baseValue: 1, mana: 15, gold: 5 },
            { id: 402, nameKey: 'read_15pages', type: 'check', baseValue: 1, mana: 15, gold: 5 },
            { id: 403, nameKey: 'healthy_snack', type: 'check', baseValue: 1, mana: 10, gold: 10 },
            { id: 404, nameKey: 'stretch_10min', type: 'check', baseValue: 1, mana: 10, gold: 5 },
            { id: 405, nameKey: 'learn_something', type: 'check', baseValue: 1, mana: 20, gold: 8 },
        ]
    };

    const exerciseExplanations = {
        de: {
            bicep_curls: "Stehe aufrecht, Hanteln in beiden Händen. Beuge die Arme und hebe die Hanteln zur Brust, dann langsam wieder senken.",
            dumbbell_rows: "Beuge dich mit geradem Rücken nach vorne, eine Hantel in der Hand. Ziehe die Hantel zum Körper, Ellenbogen nah am Körper.",
            push_ups_narrow: "Liegestützposition, aber die Hände sind enger als schulterbreit. Dies beansprucht den Trizeps stärker.",
            weighted_squats: "Halte ein Gewicht (Hantel, Kettlebell) vor der Brust oder auf den Schultern. Mache eine tiefe Kniebeuge.",
            barbell_rows: "Beuge dich mit geradem Rücken vor und greife eine Langhantel. Ziehe die Stange kraftvoll in Richtung deines unteren Brustkorbs.",
            dumbbell_press: "Lege dich auf eine Bank, Hanteln auf Brusthöhe. Drücke die Hanteln nach oben, bis deine Arme fast gestreckt sind.",
            shoulder_press: "Sitze oder stehe aufrecht. Drücke die Hanteln von den Schultern aus direkt nach oben, bis die Arme gestreckt sind.",
            deadlifts: "Gehe mit geradem Rücken in die Hocke und greife die Langhantel. Hebe das Gewicht an, indem du Hüfte und Knie streckst.",
            burpees: "Kombination aus Kniebeuge, Liegestütz und Strecksprung. Eine anstrengende Ganzkörperübung.",
            jumping_jacks: "Der klassische Hampelmann. Springe in eine Grätsche und führe die Arme über dem Kopf zusammen.",
            high_knees: "Laufe auf der Stelle und ziehe dabei die Knie so hoch wie möglich in Richtung Brust.",
            kettlebell_swings: "Schwinge die Kettlebell mit der Hüfte nach vorne bis auf Brusthöhe. Der Rücken bleibt dabei gerade.",
            box_jumps: "Springe aus dem Stand beidbeinig auf eine stabile Erhöhung. Steige wieder herunter.",
            mountain_climbers: "Beginne in Liegestützposition. Ziehe abwechselnd die Knie schnell zur Brust, als würdest du einen Berg erklimmen.",
            jump_squats: "Mache eine normale Kniebeuge und springe am tiefsten Punkt explosiv nach oben.",
            interval_sprint: "Sprinte für eine kurze, intensive Phase (z.B. 30 Sekunden) und mache dann eine kurze Pause. Wiederhole dies mehrmals.",
            walking_lunges: "Mache einen großen Ausfallschritt nach vorne. Anstatt zurückzukehren, drücke dich ab und mache mit dem anderen Bein den nächsten Schritt.",
            rowing_machine: "Nutze ein Rudergerät oder ein Widerstandsband. Ziehe kraftvoll und kontrolliert, um den ganzen Körper zu trainieren.",
            walk_30min: "Ein zügiger 30-minütiger Spaziergang an der frischen Luft. Gut für Körper und Geist.",
            read_15pages: "Lies 15 Seiten in einem Buch deiner Wahl. Trainiert die Willenskraft.",
            healthy_snack: "Bereite einen gesunden Snack zu, z.B. Obst, Gemüse mit Dip oder eine Handvoll Nüsse.",
            stretch_10min: "Dehne sanft deine Hauptmuskelgruppen. Halte jede Dehnung für ca. 20-30 Sekunden.",
            learn_something: "Lerne etwas Neues, sei es eine Vokabel, ein Fakt oder eine kurze Fähigkeit online.",
            general_workout: "Ein komplettes Workout deiner Wahl. Gib dein Bestes und verfolge deine eigene Routine!",
            plank: "Stütze dich auf Unterarmen und Zehenspitzen ab. Halte den Körper in einer geraden Linie von Kopf bis Fuß. Bauch anspannen!",
            situps: "Lege dich auf den Rücken, Knie gebeugt. Hände hinter den Kopf. Hebe den Oberkörper in Richtung Knie und senke ihn kontrolliert ab.",
            knee_push_ups: "Beginne in einer Liegestützposition, aber auf den Knien. Senke die Brust zum Boden und drücke dich wieder hoch.",
            tricep_dips_chair: "Setze dich auf die Kante eines Stuhls, Hände neben der Hüfte. Rutsche vor, sodass dein Po in der Luft ist. Beuge die Arme und senke den Körper ab, dann wieder hochdrücken.",
            lunges: "Mache einen großen Schritt nach vorne. Senke die Hüfte, bis beide Knie etwa 90 Grad gebeugt sind. Drücke dich zurück und wechsle die Seite.",
            sumo_squats: "Stehe breitbeinig, Füße nach außen gedreht. Gehe tief in die Hocke, als ob du dich auf einen Stuhl setzt. Rücken gerade halten.",
            glute_bridges: "Lege dich auf den Rücken, Knie gebeugt. Hebe die Hüfte so hoch wie möglich, spanne den Po an. Kurz halten und langsam ablassen. Auch bekannt als Hüftheben.",
            tricep_extensions: "Kann mit Hantel oder Band gemacht werden. Arm über den Kopf strecken, dann den Unterarm hinter dem Kopf absenken und wieder strecken.",
            side_plank: "Lege dich auf die Seite, stütze dich auf einem Unterarm ab. Hebe die Hüfte, bis der Körper eine gerade Linie bildet. Halten, dann Seite wechseln.",
            pinterest_workout: "Klicke auf 'OK', um das Video-Workout auf Pinterest in einem neuen Tab zu öffnen. Schließe die Übung ab, um deine Belohnung zu erhalten!",
        },
        en: {
            bicep_curls: "Stand upright, dumbbells in both hands. Bend your arms and lift the dumbbells to your chest, then slowly lower them again.",
            dumbbell_rows: "Bend forward with a straight back, a dumbbell in your hand. Pull the dumbbell towards your body, keeping your elbow close.",
            push_ups_narrow: "Push-up position, but with hands closer than shoulder-width. This targets the triceps more.",
            weighted_squats: "Hold a weight (dumbbell, kettlebell) in front of your chest or on your shoulders. Perform a deep squat.",
            barbell_rows: "Bend over with a straight back and grab a barbell. Pull the bar powerfully towards your lower chest.",
            dumbbell_press: "Lie on a bench, dumbbells at chest height. Press the dumbbells upwards until your arms are almost fully extended.",
            shoulder_press: "Sit or stand upright. Press the dumbbells from your shoulders straight up until your arms are extended.",
            deadlifts: "Squat down with a straight back and grab the barbell. Lift the weight by extending your hips and knees.",
            burpees: "A combination of a squat, push-up, and vertical jump. A strenuous full-body exercise.",
            jumping_jacks: "The classic jumping jack. Jump to a straddle position while bringing your arms above your head.",
            high_knees: "Run in place, pulling your knees up towards your chest as high as possible.",
            kettlebell_swings: "Swing the kettlebell forward to chest height using your hips. Keep your back straight.",
            box_jumps: "From a standing position, jump with both feet onto a stable platform. Step back down.",
            mountain_climbers: "Start in a push-up position. Quickly bring your knees to your chest alternately, as if climbing a mountain.",
            jump_squats: "Perform a regular squat, and at the bottom, jump up explosively.",
            interval_sprint: "Sprint for a short, intense period (e.g., 30 seconds), then take a short break. Repeat several times.",
            walking_lunges: "Take a large step forward into a lunge. Instead of returning, push off and take the next step with the other leg.",
            rowing_machine: "Use a rowing machine or a resistance band. Pull powerfully and with control to work the entire body.",
            walk_30min: "A brisk 30-minute walk in the fresh air. Good for body and mind.",
            read_15pages: "Read 15 pages in a book of your choice. Trains willpower.",
            healthy_snack: "Prepare a healthy snack, e.g., fruit, vegetables with dip, or a handful of nuts.",
            stretch_10min: "Gently stretch your main muscle groups. Hold each stretch for about 20-30 seconds.",
            learn_something: "Learn something new, whether it's a vocabulary word, a fact, or a short skill online.",
            general_workout: "A complete workout of your choice. Give it your best and follow your own routine!",
            plank: "Support yourself on your forearms and toes. Keep your body in a straight line from head to toe. Tighten your abs!",
            situps: "Lie on your back, knees bent. Hands behind your head. Lift your upper body towards your knees and lower it back down with control.",
            knee_push_ups: "Start in a push-up position, but on your knees. Lower your chest to the floor and push back up.",
            tricep_dips_chair: "Sit on the edge of a chair, hands next to your hips. Slide forward so your bottom is in the air. Bend your arms and lower your body, then push back up.",
            lunges: "Take a big step forward. Lower your hips until both knees are bent at about a 90-degree angle. Push back to the start and switch sides.",
            sumo_squats: "Stand with your feet wide, toes pointing out. Squat down deep as if sitting in a chair. Keep your back straight.",
            glute_bridges: "Lie on your back, knees bent. Lift your hips as high as you can, squeezing your glutes. Hold briefly and lower slowly.",
            tricep_extensions: "Can be done with a dumbbell or band. Extend your arm over your head, then lower your forearm behind your head and extend it again.",
            side_plank: "Lie on your side, propped up on one forearm. Lift your hips until your body forms a straight line. Hold, then switch sides.",
            pinterest_workout: "Click 'OK' to open the video workout on Pinterest in a new tab. Complete the exercise to get your reward!",
        }
    };
    
    const dbName = 'VibeCodenDB', dbVersion = 8;
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (e) => console.error('DB error:', e.target.errorCode);
    request.onsuccess = (e) => {
        db = e.target.result;
        loadInitialData();
    };
    
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains('character')) db.createObjectStore('character', { keyPath: 'id' });
        
        if (db.objectStoreNames.contains('exercises')) db.deleteObjectStore('exercises');
        db.createObjectStore('exercises', { keyPath: 'id' });

        if (!db.objectStoreNames.contains('shop')) db.createObjectStore('shop', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        
        if (db.objectStoreNames.contains('daily_quests')) db.deleteObjectStore('daily_quests');
        const questStore = db.createObjectStore('daily_quests', { keyPath: 'questId', autoIncrement: true });
        questStore.createIndex('date', 'date', { unique: false });
    };

    function applyTranslations() {
        const lang = userSettings.language || 'de';
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        const activePageId = document.querySelector('.page.active').id;
        updateHeaderTitle(activePageId);
        renderQuests();
        renderFreeExercisesPage();
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', userSettings.theme || 'dark');
        themeToggle.checked = (userSettings.theme === 'light');
    }

    function updateHeaderTitle(pageId) {
        const lang = userSettings.language || 'de';
        let key = 'exercises';
        if (pageId === 'page-character') key = 'character';
        if (pageId === 'page-shop') key = 'shop';
        headerTitle.textContent = (translations[lang] && translations[lang][key]) || translations['de'][key];
    }

    function showPopup(popupElement) {
        currentPopup = popupElement;
        popupOverlay.classList.add('show');
        currentPopup.classList.add('show');
    }

    function hidePopups() {
        if (!currentPopup) return;
        popupOverlay.classList.remove('show');
        currentPopup.classList.remove('show');
        currentPopup = null;
    }

    function showCustomPopup(content, type = 'notification') {
        infoPopup.classList.remove('penalty');
        notificationPopup.classList.remove('penalty');

        if (type === 'info') {
            infoPopupContent.innerHTML = content;
            showPopup(infoPopup);
        } else {
            if (type === 'penalty') {
                notificationPopup.classList.add('penalty');
            }
            notificationPopupContent.innerHTML = content.replace(/\n/g, '<br>');
            showPopup(notificationPopup);

            if (type !== 'penalty') { 
                setTimeout(() => {
                    if (currentPopup === notificationPopup && notificationPopup.classList.contains('show')) hidePopups();
                }, 3000);
            }
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.nav-button.active').classList.remove('active');
            button.classList.add('active');
            const targetPageId = button.dataset.page;
            pages.forEach(page => page.classList.toggle('active', page.id === targetPageId));
            updateHeaderTitle(targetPageId);
        });
    });

    popupOverlay.addEventListener('click', hidePopups);
    allPopups.forEach(popup => {
        popup.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
        popup.addEventListener('touchmove', (e) => {
            if (!currentPopup) return;
            const deltaY = e.touches[0].clientY - touchStartY;
            if (deltaY > 0) {
                currentPopup.style.transition = 'none';
                currentPopup.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });
        popup.addEventListener('touchend', (e) => {
            if (!currentPopup) return;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            currentPopup.style.transition = '';
            currentPopup.style.transform = '';
            if (deltaY > 100) hidePopups();
        });
    });

    document.getElementById('page-exercises').addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const card = button.closest('.exercise-card');
        if (!card) return;

        const action = button.dataset.action;
        const isQuest = card.parentElement.id === 'quest-list';

        if (isQuest) {
            const questId = parseInt(card.dataset.questId, 10);
            if (action === 'info') {
                showQuestInfo(questId);
            } else if (action === 'complete') {
                const quest = await new Promise(resolve => {
                    db.transaction('daily_quests').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
                });
                const exerciseTemplate = Object.values(exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);

                if (exerciseTemplate && exerciseTemplate.type === 'link') {
                    window.open(exerciseTemplate.url, '_blank');
                }
                completeQuest(questId);
            }
        } else {
            const exerciseId = parseInt(card.dataset.exerciseId, 10);
            if (action === 'info') {
                showFreeExerciseInfo(exerciseId);
            } else if (action === 'complete') {
                const exercise = await new Promise(resolve => {
                    db.transaction('exercises').objectStore('exercises').get(exerciseId).onsuccess = e => resolve(e.target.result);
                });
                const exerciseTemplate = Object.values(exercisePool).flat().find(ex => ex.nameKey === exercise.nameKey);

                if (exerciseTemplate && exerciseTemplate.type === 'link') {
                    window.open(exerciseTemplate.url, '_blank');
                }
                completeFreeExercise(exerciseId);
            }
        }
    });

    shopFilters.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            shopFilters.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            currentShopFilter = target.dataset.filter;
            renderShopPage();
        }
    });

    freeExerciseFilters.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            freeExerciseFilters.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            currentFreeExerciseFilter = target.dataset.filter;
            renderFreeExercisesPage();
        }
    });

    shopItems.addEventListener('click', (event) => {
        if (event.target.classList.contains('card-button')) {
            const itemId = parseInt(event.target.dataset.itemId, 10);
            buyItem(itemId);
        }
    });

    inventoryContainer.addEventListener('click', (event) => {
        const button = event.target.closest('button.card-button');
        if (button) {
            const itemIndex = parseInt(button.dataset.inventoryIndex, 10);
            const action = button.dataset.action;
            if (action === 'use') useItem(itemIndex);
            else if (action === 'equip') equipItem(itemIndex);
        }
    });

    equipmentContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('card-button')) {
            const slot = event.target.dataset.equipSlot;
            const index = parseInt(event.target.dataset.equipIndex, 10);
            unequipItem(slot, index);
        }
    });

    settingsButton.addEventListener('click', () => showPopup(settingsPopup));
    languageSelect.addEventListener('change', (e) => saveSetting('language', e.target.value));
    themeToggle.addEventListener('change', (e) => saveSetting('theme', e.target.checked ? 'light' : 'dark'));
    characterNameInput.addEventListener('change', (e) => saveSetting('name', e.target.value));
    difficultySlider.addEventListener('input', (e) => {
        difficultyValue.textContent = e.target.value
    });
    difficultySlider.addEventListener('change', async (e) => {
        await saveSetting('difficulty', parseInt(e.target.value, 10));
        await generateDailyQuests(true); // force regeneration with new difficulty
        renderQuests();
        renderFreeExercisesPage(); // re-render free exercises with new targets
    });
    goalSelect.addEventListener('change', async (e) => {
        await saveSetting('goal', e.target.value);
        await generateDailyQuests(true);
        renderQuests();
    });
    restdaysSelect.addEventListener('change', async (e) => {
        await saveSetting('restDays', parseInt(e.target.value, 10));
        await generateDailyQuests(true);
        renderQuests();
    });
    
    async function loadInitialData() {
        await loadSettings();
        await initializeCharacter();
        await generateDailyQuests();
        renderQuests();
        initializeFreeExercises();
        initializeShop();
        startDailyCheckTimer();
    }

    function saveSetting(key, value) {
        return new Promise(resolve => {
            if (key === 'name') {
                const tx = db.transaction(['character'], 'readwrite');
                tx.objectStore('character').get(1).onsuccess = (e) => {
                    const char = e.target.result;
                    if (char) {
                        char.name = value || "Unknown Hunter";
                        tx.objectStore('character').put(char);
                    }
                };
                tx.oncomplete = () => {
                    renderCharacterPage();
                    resolve();
                }
            } else {
                userSettings[key] = value;
                const tx = db.transaction(['settings'], 'readwrite');
                tx.objectStore('settings').put(userSettings);
                tx.oncomplete = () => {
                    if (key === 'language') applyTranslations();
                    if (key === 'theme') applyTheme();
                    resolve();
                };
            }
        });
    }

    function loadSettings() {
        return new Promise(resolve => {
            const tx = db.transaction(['settings'], 'readwrite');
            tx.objectStore('settings').get(1).onsuccess = (e) => {
                if (e.target.result) {
                    userSettings = e.target.result;
                } else {
                    userSettings = { id: 1, language: 'de', theme: 'dark', difficulty: 3, goal: 'muscle', restDays: 2 };
                    tx.objectStore('settings').add(userSettings);
                }
                updateSettingsUI();
                applyTheme();
                applyTranslations();
                resolve();
            };
            tx.onerror = () => resolve();
        });
    }

    function updateSettingsUI() {
        languageSelect.value = userSettings.language || 'de';
        themeToggle.checked = (userSettings.theme === 'light');
        difficultySlider.value = userSettings.difficulty || 3;
        difficultyValue.textContent = userSettings.difficulty || 3;
        goalSelect.value = userSettings.goal || 'muscle';
        restdaysSelect.value = userSettings.restDays || 2;
        
        db.transaction('character', 'readonly').objectStore('character').get(1).onsuccess = e => {
            if(e.target.result) {
                characterNameInput.value = e.target.result.name;
            }
        };
    }

    function getTodayString() { return new Date().toISOString().split('T')[0]; }
    
    function getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    function generateDailyQuests(force = false) {
        return new Promise(resolve => {
            const today = getTodayString();
            const tx = db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            const index = store.index('date');
            
            index.getAll(today).onsuccess = e => {
                if (e.target.result.length > 0 && !force) {
                    resolve();
                    return;
                }
                
                const clearRequest = index.openCursor(IDBKeyRange.only(today));
                clearRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        const dayOfWeek = new Date().getDay(); // 0=Sonntag, 1=Montag, ..., 6=Samstag
                        const numRestDays = userSettings.restDays || 0;
                        let activeRestDays = [];

                        switch (numRestDays) {
                            case 1:
                                activeRestDays = [4]; // Donnerstag
                                break;
                            case 2:
                                activeRestDays = [2, 6]; // Dienstag, Samstag
                                break;
                            case 3:
                                activeRestDays = [0, 2, 4]; // Sonntag, Dienstag, Donnerstag
                                break;
                        }
                        
                        const isRestDay = activeRestDays.includes(dayOfWeek);
                        const goal = isRestDay ? 'restday' : (userSettings.goal || 'muscle');
                        const pool = [...(exercisePool[goal] || exercisePool['muscle'])];
                        
                        for (let i = pool.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [pool[i], pool[j]] = [pool[j], pool[i]];
                        }

                        const newQuests = pool.slice(0, 5).filter(Boolean);
                        if (newQuests.length === 0) {
                            resolve();
                            return;
                        }
                        
                        const difficulty = userSettings.difficulty || 3;
                        newQuests.forEach(questTemplate => {
                            let targetValue = questTemplate.baseValue;
                            if(questTemplate.type !== 'check' && questTemplate.type !== 'link') {
                                targetValue = Math.ceil(questTemplate.baseValue + (questTemplate.baseValue * 0.4 * (difficulty - 1)));
                            }

                            const quest = {
                                date: today,
                                nameKey: questTemplate.nameKey,
                                type: questTemplate.type,
                                target: targetValue,
                                manaReward: Math.ceil(questTemplate.mana * (1 + 0.2 * (difficulty - 1))),
                                goldReward: Math.ceil(questTemplate.gold * (1 + 0.15 * (difficulty - 1))),
                                completed: false,
                            };
                            store.add(quest);
                        });
                    }
                };
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }

    function renderQuests() {
        if (!db) return;
        const store = db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests');
        questList.innerHTML = '';
        const lang = userSettings.language || 'de';

        store.index('date').getAll(getTodayString()).onsuccess = e => {
            const questsToday = e.target.result;
            if (questsToday.length === 0) {
                questList.innerHTML = `<div class="card"><p>Keine Quests für heute. Genieße den Tag oder starte ein freies Training! 🌴</p></div>`;
                return;
            }
            questsToday.forEach(quest => {
                const card = document.createElement('div');
                card.className = `card exercise-card ${quest.completed ? 'completed' : ''}`;
                card.dataset.questId = quest.questId;

                let targetDisplay = '';
                if(quest.type === 'reps') targetDisplay = `${quest.target} Reps`;
                else if(quest.type === 'time') targetDisplay = `${quest.target} Sek.`;

                const translatedName = (translations[lang].exercise_names[quest.nameKey] || quest.nameKey);

                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small" data-action="complete" aria-label="Absolvieren" ${quest.completed ? 'disabled' : ''}>
                            ${quest.completed ? '✅' : 'OK'}
                        </button>
                    </div>
                `;
                questList.appendChild(card);
            });
        };
    }

    async function checkStatIncrease(char) {
        const STAT_INCREASE_THRESHOLD = 5;
        char.completedExercises = (char.completedExercises || 0) + 1;

        if (char.completedExercises >= STAT_INCREASE_THRESHOLD) {
            const statKeys = Object.keys(char.stats);
            const randomStatKey = statKeys[Math.floor(Math.random() * statKeys.length)];
            char.stats[randomStatKey]++;
            char.completedExercises -= STAT_INCREASE_THRESHOLD;

            const lang = userSettings.language || 'de';
            const title = translations[lang].stat_increase_title || "STAT INCREASED!";
            let text = translations[lang].stat_increase_text || "Your '{statName}' attribute increased by 1!";
            text = text.replace('{statName}', randomStatKey.charAt(0).toUpperCase() + randomStatKey.slice(1));

            setTimeout(() => {
                showCustomPopup(`<h3>${title}</h3><p>${text}</p>`);
            }, 800);
        }
        return char;
    }

    function completeQuest(questId) {
        const tx = db.transaction(['daily_quests', 'character'], 'readwrite');
        const questStore = tx.objectStore('daily_quests');
        const charStore = tx.objectStore('character');

        questStore.get(questId).onsuccess = e => {
            const quest = e.target.result;
            if (quest.completed) return;

            quest.completed = true;
            questStore.put(quest);

            charStore.get(1).onsuccess = async ce => {
                let char = ce.target.result;
                char.mana += quest.manaReward;
                char.gold += quest.goldReward;
                
                showCustomPopup(`Sehr gut! 💪\n+${quest.manaReward} Mana ✨ | +${quest.goldReward} Gold 💰`);
                
                char = await checkStatIncrease(char);

                let leveledUp = false;
                while (char.mana >= char.manaToNextLevel) {
                    leveledUp = true;
                    char.level++;
                    char.mana -= char.manaToNextLevel;
                    char.manaToNextLevel = Math.floor(char.manaToNextLevel * 1.5);
                }
                 if (leveledUp) {
                    setTimeout(() => showCustomPopup(`LEVEL UP! 🚀 Du bist jetzt Level ${char.level}!`), 600);
                }
                charStore.put(char);
            };
        };
        tx.oncomplete = () => {
            // --- Streak Update: Wenn alle Quests für heute erledigt, Streak erhöhen ---
            const today = new Date();
            const todayStr = today.toISOString().slice(0, 10);
            db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').index('date').getAll(todayStr).onsuccess = (e) => {
                const quests = e.target.result;
                if (quests.length > 0 && quests.every(q => q.completed)) {
                    let { streak, lastDate } = getStreakData();
                    if (lastDate === todayStr) {
                        // Bereits heute gezählt
                    } else if (lastDate && ((new Date(todayStr) - new Date(lastDate)) === 86400000)) {
                        streak += 1;
                        setStreakData(streak, todayStr);
                    } else {
                        streak = 1;
                        setStreakData(streak, todayStr);
                    }
                    updateStreakDisplay();
                }
            };
            renderQuests();
            renderCharacterPage();
        }
    }
    
    function showQuestInfo(questId) {
        db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').get(questId).onsuccess = (e) => {
            const quest = e.target.result;
            if (!quest) return;
            const lang = userSettings.language || 'de';
            const translatedName = (translations[lang].exercise_names[quest.nameKey] || quest.nameKey);
            const explanation = (exerciseExplanations[lang][quest.nameKey] || 'Keine Beschreibung verfügbar.');
            const showInstructionsText = translations[lang].show_instructions || "Show Instructions";
            
            const content = `
                <h3>${translatedName}</h3>
                <details>
                    <summary>${showInstructionsText}</summary>
                    <p>${explanation}</p>
                </details>
                <p><strong>Belohnung:</strong> ${quest.manaReward} Mana ✨, ${quest.goldReward} Gold 💰</p>
            `;
            showCustomPopup(content, 'info');
        };
    }

    function initializeFreeExercises() {
        const defaultExercises = [
            { id: 1, nameKey: 'push_ups_narrow', type: 'reps', baseValue: 12, manaReward: 20, goldReward: 5, category: 'muscle' },
            { id: 2, nameKey: 'weighted_squats', type: 'reps', baseValue: 15, manaReward: 15, goldReward: 3, category: 'muscle' },
            { id: 3, nameKey: 'dumbbell_rows', type: 'reps', baseValue: 10, manaReward: 22, goldReward: 7, category: 'muscle' },
            { id: 4, nameKey: 'bicep_curls', type: 'reps', baseValue: 10, manaReward: 18, goldReward: 5, category: 'muscle' },
            { id: 5, nameKey: 'jumping_jacks', type: 'time', baseValue: 60, manaReward: 25, goldReward: 7, category: 'endurance' },
            { id: 6, nameKey: 'general_workout', type: 'check', baseValue: 1, manaReward: 50, goldReward: 50, category: 'muscle' },
            { id: 7, nameKey: 'pinterest_workout', type: 'link', baseValue: 1, manaReward: 60, goldReward: 20, category: 'kraft_abnehmen' },
            { id: 8, nameKey: 'plank', type: 'time', baseValue: 30, manaReward: 18, goldReward: 5, category: 'kraft_abnehmen' },
            { id: 9, nameKey: 'situps', type: 'reps', baseValue: 20, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 10, nameKey: 'knee_push_ups', type: 'reps', baseValue: 15, manaReward: 12, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 11, nameKey: 'tricep_dips_chair', type: 'reps', baseValue: 12, manaReward: 14, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 12, nameKey: 'lunges', type: 'reps', baseValue: 16, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 13, nameKey: 'sumo_squats', type: 'reps', baseValue: 15, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 14, nameKey: 'glute_bridges', type: 'reps', baseValue: 18, manaReward: 12, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 15, nameKey: 'tricep_extensions', type: 'reps', baseValue: 12, manaReward: 13, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 16, nameKey: 'side_plank', type: 'time', baseValue: 20, manaReward: 13, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 17, nameKey: 'burpees', type: 'reps', baseValue: 10, manaReward: 18, goldReward: 5, category: 'endurance' },
            { id: 18, nameKey: 'mountain_climbers', type: 'time', baseValue: 30, manaReward: 15, goldReward: 4, category: 'fatloss' },
            { id: 19, nameKey: 'jump_squats', type: 'reps', baseValue: 12, manaReward: 15, goldReward: 4, category: 'fatloss' },
            { id: 20, nameKey: 'high_knees', type: 'time', baseValue: 40, manaReward: 12, goldReward: 3, category: 'endurance' },
            // NEU: Übungen für die Kategorie "Erholung" hinzugefügt
            { id: 21, nameKey: 'stretch_10min', type: 'check', baseValue: 1, manaReward: 10, goldReward: 5, category: 'restday' },
            { id: 22, nameKey: 'walk_30min', type: 'check', baseValue: 1, manaReward: 15, goldReward: 5, category: 'restday' }
        ];

        const transaction = db.transaction(['exercises'], 'readwrite');
        const store = transaction.objectStore('exercises');

        store.count().onsuccess = (e) => {
            if (e.target.result !== defaultExercises.length) {
                console.log('Aktualisiere Liste der freien Übungen...');
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                    defaultExercises.forEach(ex => store.add(ex));
                };
            }
        };

        transaction.oncomplete = () => {
            renderFreeExercisesPage();
        };
    }

    function renderFreeExercisesPage() {
        if (!db) return;
        const store = db.transaction(['exercises'], 'readonly').objectStore('exercises');
        const lang = userSettings.language || 'de';
        const difficulty = userSettings.difficulty || 3;
        store.getAll().onsuccess = (e) => {
            exerciseList.innerHTML = '';
            const allExercises = e.target.result;
            const filteredExercises = currentFreeExerciseFilter === 'all' 
                ? allExercises 
                : allExercises.filter(ex => ex.category === currentFreeExerciseFilter);

            if (filteredExercises.length === 0) {
                exerciseList.innerHTML = `<div class="card"><p>Keine Übungen in dieser Kategorie gefunden. 🤷‍♂️</p></div>`;
                return;
            }

            filteredExercises.forEach(exercise => {
                let targetValue = exercise.baseValue;
                if (exercise.type !== 'check' && exercise.type !== 'link') {
                    targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
                }
                let targetDisplay = '';
                if (exercise.type === 'reps') targetDisplay = `${targetValue} Reps`;
                else if (exercise.type === 'time') targetDisplay = `${targetValue} Sek.`;

                const translatedName = (translations[lang].exercise_names[exercise.nameKey] || exercise.nameKey);

                const card = document.createElement('div');
                card.className = 'card exercise-card';
                card.dataset.exerciseId = exercise.id;
                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small" data-action="complete" aria-label="Absolvieren">OK</button>
                    </div>
                `;
                exerciseList.appendChild(card);
            });
        };
    }
    
    async function completeFreeExercise(exerciseId) {
        const tx = db.transaction(['exercises', 'character'], 'readwrite');
        const exStore = tx.objectStore('exercises');
        const charStore = tx.objectStore('character');

        const exercise = await new Promise(res => exStore.get(exerciseId).onsuccess = e => res(e.target.result));
        
        const difficulty = userSettings.difficulty || 3;
        const scaledMana = Math.ceil(exercise.manaReward * (1 + 0.2 * (difficulty - 1)));
        const scaledGold = Math.ceil(exercise.goldReward * (1 + 0.15 * (difficulty - 1)));

        let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));
        char.mana += scaledMana;
        char.gold += scaledGold;

        showCustomPopup(`Sehr gut! 💪\n+${scaledMana} Mana ✨ | +${scaledGold} Gold 💰`);

        char = await checkStatIncrease(char);

        let leveledUp = false;
        while (char.mana >= char.manaToNextLevel) {
            leveledUp = true;
            char.level++;
            char.mana -= char.manaToNextLevel;
            char.manaToNextLevel = Math.floor(char.manaToNextLevel * 1.5);
        }
        if (leveledUp) {
            setTimeout(() => showCustomPopup(`LEVEL UP! 🚀 Du bist jetzt Level ${char.level}!`), 600);
        }
        await new Promise(res => charStore.put(char).onsuccess = res);

        tx.oncomplete = () => {
            renderCharacterPage();
        };
    }


    function showFreeExerciseInfo(exerciseId) {
        db.transaction(['exercises'], 'readonly').objectStore('exercises').get(exerciseId).onsuccess = (e) => {
            const ex = e.target.result;
            const lang = userSettings.language || 'de';
            const translatedName = (translations[lang].exercise_names[ex.nameKey] || ex.nameKey);
            const explanation = (exerciseExplanations[lang][ex.nameKey] || 'Keine Beschreibung verfügbar.');
            const showInstructionsText = translations[lang].show_instructions || "Show Instructions";
            const difficulty = userSettings.difficulty || 3;
            let targetValue = ex.baseValue;
            if (ex.type !== 'check' && ex.type !== 'link') {
                targetValue = Math.ceil(ex.baseValue + (ex.baseValue * 0.4 * (difficulty - 1)));
            }
            let targetDisplay = '';
            if (ex.type === 'reps') targetDisplay = `${targetValue} Reps`;
            else if (ex.type === 'time') targetDisplay = `${targetValue} Sek.`;

            const scaledMana = Math.ceil(ex.manaReward * (1 + 0.2 * (difficulty - 1)));
            const scaledGold = Math.ceil(ex.goldReward * (1 + 0.15 * (difficulty - 1)));

            const content = `
                <h3>${translatedName}</h3>
                <details>
                    <summary>${showInstructionsText}</summary>
                    <p>${explanation}</p>
                </details>
                ${targetDisplay ? `<p><strong>Ziel:</strong> ${targetDisplay}</p>` : ''}
                <p><strong>Belohnung (skaliert mit Schwierigkeit):</strong> ca. ${scaledMana} Mana ✨, ${scaledGold} Gold 💰</p>
            `;
            showCustomPopup(content, 'info');
        };
    }

    function initializeCharacter() {
        return new Promise(resolve => {
            const transaction = db.transaction(['character'], 'readwrite');
            const store = transaction.objectStore('character');
            store.get(1).onsuccess = (e) => {
                if (!e.target.result) {
                    store.add({ id: 1, name: 'Unknown Hunter', level: 1, mana: 0, manaToNextLevel: 100, gold: 200, stats: { kraft: 5, ausdauer: 5, beweglichkeit: 5, durchhaltevermoegen: 5, willenskraft: 5 }, equipment: { weapons: [], armor: null }, inventory: [], completedExercises: 0 });
                }
            };
            transaction.oncomplete = () => {
                renderCharacterPage();
                resolve();
            };
        });
    }

    function calculateEquipmentStats(character) {
        let angriff = 0;
        let schutz = 0;
        character.equipment.weapons.forEach(weapon => { angriff += weapon.bonus.angriff || 0; });
        if (character.equipment.armor) { schutz += character.equipment.armor.bonus.schutz || 0; }
        return { angriff, schutz };
    }

    function renderCharacterPage() {
        if (!db) return;
        const store = db.transaction(['character'], 'readonly').objectStore('character');
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char) return;
            const equipmentStats = calculateEquipmentStats(char);
            const manaPercentage = char.manaToNextLevel > 0 ? (char.mana / char.manaToNextLevel) * 100 : 0;
            characterSheet.innerHTML = `<div class="card"><h2>${char.name}</h2><div class="stat"><span class="stat-label">Level:</span><span class="stat-value">🌟 ${char.level}</span></div><div class="stat"><span class="stat-label">Mana:</span><span class="stat-value">✨ ${char.mana} / ${char.manaToNextLevel}</span></div><div class="mana-bar-container"><div class="mana-bar" style="width: ${manaPercentage}%;"></div></div></div><div class="card"><div class="stat"><span class="stat-label">Gold:</span><span class="stat-value">💰 ${char.gold}</span></div><div class="stat"><span class="stat-label">Angriff:</span><span class="stat-value">⚔️ ${equipmentStats.angriff}</span></div><div class="stat"><span class="stat-label">Schutz:</span><span class="stat-value">🛡️ ${equipmentStats.schutz}</span></div></div>`;
            characterStats.innerHTML = `<div class="card"><div class="stat"><span class="stat-label">Kraft 💪</span><span class="stat-value">${char.stats.kraft}</span></div><div class="stat"><span class="stat-label">Ausdauer 🏃‍♂️</span><span class="stat-value">${char.stats.ausdauer}</span></div><div class="stat"><span class="stat-label">Beweglichkeit 🤸‍♀️</span><span class="stat-value">${char.stats.beweglichkeit}</span></div><div class="stat"><span class="stat-label">Durchhaltevermögen 🔋</span><span class="stat-value">${char.stats.durchhaltevermoegen}</span></div><div class="stat"><span class="stat-label">Willenskraft 🧠</span><span class="stat-value">${char.stats.willenskraft}</span></div></div>`;
            equipmentContainer.innerHTML = '';
            let hasEquipment = false;
            char.equipment.weapons.forEach((item, index) => {
                hasEquipment = true;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<h3>${item.name}</h3><p>${item.description}</p><button class="card-button secondary-button" data-equip-slot="weapons" data-equip-index="${index}">Ablegen</button>`;
                equipmentContainer.appendChild(card);
            });
            if (char.equipment.armor) {
                hasEquipment = true;
                const item = char.equipment.armor;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<h3>${item.name}</h3><p>${item.description}</p><button class="card-button secondary-button" data-equip-slot="armor">Ablegen</button>`;
                equipmentContainer.appendChild(card);
            }
            if (!hasEquipment) equipmentContainer.innerHTML = '<div class="card"><p>Du trägst keine Ausrüstung. Gehe zum Shop! 🛒</p></div>';
            inventoryContainer.innerHTML = '';
            if (char.inventory.length > 0) {
                char.inventory.forEach((item, index) => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const buttonText = item.type === 'consumable' ? 'Benutzen ✨' : 'Ausrüsten 🚀';
                    const buttonAction = item.type === 'consumable' ? 'use' : 'equip';
                    card.innerHTML = `<h3>${item.name}</h3><p>${item.description}</p><button class="card-button secondary-button" data-inventory-index="${index}" data-action="${buttonAction}">${buttonText}</button>`;
                    inventoryContainer.appendChild(card);
                });
            } else {
                inventoryContainer.innerHTML = '<div class="card"><p>Dein Inventar ist leer. 🤷‍♂️</p></div>';
            }
            // --- Streak-Box aktualisieren ---
            updateStreakDisplay();
        };
    }

    function initializeShop() {
        const transaction = db.transaction(['shop'], 'readwrite');
        const store = transaction.objectStore('shop');
        store.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                const newShopItems = [ { id: 101, name: 'Trainings-Schwert 🗡️', description: '+5 Angriff ⚔️', cost: 100, type: 'weapon', bonus: { angriff: 5 } }, { id: 102, name: 'Stahl-Klinge 🔪', description: '+15 Angriff ⚔️', cost: 400, type: 'weapon', bonus: { angriff: 15 } }, { id: 103, name: 'Ninja-Sterne ✨', description: '+25 Angriff ⚔️', cost: 850, type: 'weapon', bonus: { angriff: 25 } }, { id: 104, name: 'Meister-Hantel 💪', description: 'Legendär. +40 Angriff ⚔️', cost: 1500, type: 'weapon', bonus: { angriff: 40 } }, { id: 105, name: 'Magier-Stab 🪄', description: 'Episch. +60 Angriff ⚔️', cost: 2500, type: 'weapon', bonus: { angriff: 60 } }, { id: 201, name: 'Leder-Bandagen 🩹', description: '+5 Schutz 🛡️', cost: 100, type: 'armor', bonus: { schutz: 5 } }, { id: 202, name: 'Kettenhemd ⛓️', description: '+15 Schutz 🛡️', cost: 400, type: 'armor', bonus: { schutz: 15 } }, { id: 203, name: 'Spiegel-Schild 💎', description: '+25 Schutz 🛡️', cost: 850, type: 'armor', bonus: { schutz: 25 } }, { id: 204, name: 'Titan-Panzer 🦾', description: 'Legendär. +40 Schutz 🛡️', cost: 1500, type: 'armor', bonus: { schutz: 40 } }, { id: 205, name: 'Drachenhaut-Robe 🐉', description: 'Episch. +60 Schutz 🛡️', cost: 2500, type: 'armor', bonus: { schutz: 60 } }, { id: 301, name: 'Kleiner Mana-Stein 🔹', description: 'Stellt 50 Mana wieder her.', cost: 80, type: 'consumable', effect: { mana: 50 } }, { id: 302, name: 'Mittlerer Mana-Stein 🔸', description: 'Stellt 250 Mana wieder her.', cost: 350, type: 'consumable', effect: { mana: 250 } }, { id: 303, name: 'Großer Mana-Stein 💠', description: 'Stellt 1000 Mana wieder her.', cost: 1200, type: 'consumable', effect: { mana: 1000 } }, { id: 304, nameKey: 'pinterest_workout', type: 'link', baseValue: 1, mana: 60, gold: 20, url: 'https://pin.it/4DkPZ9zHx' }
                ];
                newShopItems.forEach(item => store.add(item));
            }
        };
        transaction.oncomplete = () => {
            renderShopPage();
        }
    }

    function renderShopPage() {
        if (!db) return;
        const trans = db.transaction(['shop', 'character'], 'readonly');
        const shopStore = trans.objectStore('shop');
        const charStore = trans.objectStore('character');
        charStore.get(1).onsuccess = (e) => {
            const character = e.target.result;
            if (!character) return;
            shopStore.getAll().onsuccess = (ev) => {
                shopItems.innerHTML = '';
                const allItems = ev.target.result;
                const filteredItems = currentShopFilter === 'all' ? allItems : allItems.filter(item => item.type === currentShopFilter);
                if (filteredItems.length === 0) {
                    shopItems.innerHTML = '<div class="card"><p>Für diese Kategorie gibt es keine Artikel. 텅 빈</p></div>';
                    return;
                }
                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const canAfford = character.gold >= item.cost;
                    card.innerHTML = `<h2>${item.name}</h2><p>${item.description}</p><p>Kosten: 💰 ${item.cost}</p><button class="card-button" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>Kaufen</button>`;
                    shopItems.appendChild(card);
                });
            };
        };
    }

    function buyItem(itemId) {
        const trans = db.transaction(['character', 'shop'], 'readwrite');
        const charStore = trans.objectStore('character');
        const shopStore = trans.objectStore('shop');
        trans.oncomplete = () => {
            renderCharacterPage();
            renderShopPage();
        };
        Promise.all([new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result)), new Promise(res => shopStore.get(itemId).onsuccess = e => res(e.target.result))])
            .then(([char, item]) => {
                if (!char || !item) return;
                if (char.gold < item.cost) {
                    showCustomPopup("Nicht genug Gold! 😥");
                    return;
                }
                if (item.type === 'consumable') {
                    const consumableCount = char.inventory.filter(invItem => invItem.type === 'consumable').length;
                    if (consumableCount >= 5) {
                        showCustomPopup("Dein Mana-Beutel ist voll! (max. 5) 🎒");
                        return;
                    }
                }
                char.gold -= item.cost;
                char.inventory.push(item);
                showCustomPopup(`${item.name} gekauft! 🛍️`);
                charStore.put(char);
            });
    }

    function useItem(itemIndex) {
        const trans = db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => renderCharacterPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToUse = char.inventory[itemIndex];
            if (itemToUse.type !== 'consumable') return;
            char.mana += itemToUse.effect.mana;
            showCustomPopup(`${itemToUse.name} benutzt!\n+${itemToUse.effect.mana} Mana ✨`);
            char.inventory.splice(itemIndex, 1);
            let leveledUp = false;
            while (char.mana >= char.manaToNextLevel) {
                leveledUp = true;
                char.level++;
                char.mana -= char.manaToNextLevel;
                char.manaToNextLevel = Math.floor(char.manaToNextLevel * 1.5);
            }
            if (leveledUp) setTimeout(() => showCustomPopup(`LEVEL UP! 🚀 Du bist jetzt Level ${char.level}!`), 600);
            store.put(char);
        };
    }

    function equipItem(itemIndex) {
        const trans = db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => renderCharacterPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToEquip = char.inventory[itemIndex];
            const slot = itemToEquip.type;
            if (slot === 'weapon') {
                if (char.equipment.weapons.length >= 2) {
                    showCustomPopup("Du kannst nur 2 Waffen tragen! ⚔️⚔️");
                    return;
                }
                char.equipment.weapons.push(itemToEquip);
            } else if (slot === 'armor') {
                if (char.equipment.armor) {
                    showCustomPopup("Du trägst bereits eine Rüstung. Lege sie zuerst ab! 🛡️");
                    return;
                }
                char.equipment.armor = itemToEquip;
            } else { return; }
            char.inventory.splice(itemIndex, 1);
            store.put(char);
        };
    }

    function unequipItem(slot, index) {
        const trans = db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => renderCharacterPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            let itemToUnequip = null;
            if (slot === 'weapons') {
                itemToUnequip = char.equipment.weapons[index];
                if (itemToUnequip) char.equipment.weapons.splice(index, 1);
            } else if (slot === 'armor') {
                itemToUnequip = char.equipment.armor;
                if (itemToUnequip) char.equipment.armor = null;
            }
            if (itemToUnequip) {
                char.inventory.push(itemToUnequip);
                store.put(char);
            }
        };
    }

    function startDailyCheckTimer() {
        if (dailyCheckInterval) clearInterval(dailyCheckInterval);

        const checkForPenaltyAndReset = async () => {
            console.log("Tägliche Prüfung wird ausgeführt...");
            const yesterday = getYesterdayString();
            const tx = db.transaction(['daily_quests', 'character'], 'readwrite');
            const questStore = tx.objectStore('daily_quests');
            const charStore = tx.objectStore('character');
            const questIndex = questStore.index('date');

            const questsToCheck = await new Promise(res => questIndex.getAll(yesterday).onsuccess = e => res(e.target.result));
            
            if (questsToCheck.length > 0) {
                const incompleteQuests = questsToCheck.filter(q => !q.completed);
                // --- Streak Reset, wenn Dailies nicht erledigt ---
                if (incompleteQuests.length > 0) {
                    setStreakData(0, null);
                    updateStreakDisplay();
                    const char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));
                    if (char.level > 1) {
                        char.level -= 1;
                        char.stats.kraft = Math.max(1, char.stats.kraft - 1);
                        char.stats.ausdauer = Math.max(1, char.stats.ausdauer - 1);
                        char.stats.beweglichkeit = Math.max(1, char.stats.beweglichkeit - 1);
                        char.stats.durchhaltevermoegen = Math.max(1, char.stats.durchhaltevermoegen - 1);
                        char.stats.willenskraft = Math.max(1, char.stats.willenskraft - 1);
                        await new Promise(res => charStore.put(char).onsuccess = res);
                        
                        const lang = userSettings.language || 'de';
                        const title = translations[lang].penalty_title;
                        const text = translations[lang].penalty_text;
                        showCustomPopup(`<h3>${title}</h3><p>${text}</p>`, 'penalty');
                    }
                }
            }
            
            await generateDailyQuests(true);
            renderQuests();
            renderCharacterPage();
        };

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow - now + 1000;

        console.log(`Nächster Check in ${msUntilMidnight / 1000 / 60} Minuten.`);
        setTimeout(() => {
            checkForPenaltyAndReset();
            dailyCheckInterval = setInterval(checkForPenaltyAndReset, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }
});