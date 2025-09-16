const DQ_EXTRA = {
    countdownInterval: null,

    init(elements) {
        elements.startExtraQuestButton.addEventListener('click', () => this.startExtraQuest());
        elements.completeExtraQuestButton.addEventListener('click', () => this.completeExtraQuest());
    },

    renderExtraQuestPage() {
        const db = DQ_DB.db;
        if (!db) return;
        const tx = db.transaction(['extra_quest'], 'readonly');
        tx.objectStore('extra_quest').get(1).onsuccess = e => {
            const activeQuest = e.target.result;
            if (activeQuest && !activeQuest.completed) {
                DQ_UI.elements.extraQuestInactiveView.style.display = 'none';
                DQ_UI.elements.extraQuestActiveView.style.display = 'flex';
                DQ_UI.elements.completeExtraQuestButton.disabled = false; // Button zurücksetzen

                const lang = DQ_CONFIG.userSettings.language || 'de';
                DQ_UI.elements.extraQuestTask.textContent = (DQ_DATA.translations[lang].extra_quest_names && DQ_DATA.translations[lang].extra_quest_names[activeQuest.nameKey]) || activeQuest.nameKey;
                
                this.updateCountdown(activeQuest);
            } else {
                DQ_UI.elements.extraQuestInactiveView.style.display = 'block';
                DQ_UI.elements.extraQuestActiveView.style.display = 'none';
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            }
        };
    },

    updateCountdown(quest) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        
        const deadlineDate = new Date(quest.deadline);
        const startDate = new Date(quest.startTime);
        const totalDuration = deadlineDate - startDate;

        const update = () => {
            const now = new Date();
            const remainingTime = deadlineDate - now;

            if (remainingTime <= 0) {
                DQ_UI.elements.extraQuestCountdown.textContent = "00:00:00";
                DQ_UI.elements.countdownProgressBar.style.width = '0%';
                DQ_UI.elements.completeExtraQuestButton.disabled = true; // Button deaktivieren
                clearInterval(this.countdownInterval);
                return;
            }

            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            DQ_UI.elements.extraQuestCountdown.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const progressPercentage = (remainingTime / totalDuration) * 100;
            DQ_UI.elements.countdownProgressBar.style.width = `${progressPercentage}%`;
            
            if (progressPercentage < 20) {
                DQ_UI.elements.countdownProgressBar.classList.add('warning');
            } else {
                DQ_UI.elements.countdownProgressBar.classList.remove('warning');
            }
        };
        
        update();
        this.countdownInterval = setInterval(update, 1000);
    },

    startExtraQuest() {
        const tx = DQ_DB.db.transaction(['extra_quest'], 'readwrite');
        const store = tx.objectStore('extra_quest');

        const randomQuest = DQ_DATA.extraQuestPool[Math.floor(Math.random() * DQ_DATA.extraQuestPool.length)];
        
        const now = new Date();
        const deadline = new Date(now);
        deadline.setHours(23, 59, 59, 999);

        const questData = {
            id: 1,
            nameKey: randomQuest.nameKey,
            manaReward: randomQuest.mana,
            goldReward: randomQuest.gold,
            startTime: now.toISOString(),
            deadline: deadline.toISOString(),
            completed: false
        };

        store.put(questData);
        tx.oncomplete = () => this.renderExtraQuestPage();
    },

    async completeExtraQuest() {
        const tx = DQ_DB.db.transaction(['extra_quest', 'character'], 'readwrite');
        const questStore = tx.objectStore('extra_quest');
        const charStore = tx.objectStore('character');

        const quest = await new Promise(res => questStore.get(1).onsuccess = e => res(e.target.result));
        if (!quest || quest.completed) return;

        if (new Date() > new Date(quest.deadline)) {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            DQ_UI.showCustomPopup(`<h3>${DQ_DATA.translations[lang].extra_penalty_title}</h3><p>Die Zeit für diese Quest ist bereits abgelaufen. Sie gilt als gescheitert.</p>`, 'penalty');
            
            questStore.delete(1).onsuccess = () => {
                this.renderExtraQuestPage();
            };
            return;
        }

        quest.completed = true;
        await new Promise(res => questStore.put(quest).onsuccess = res);

        let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));
        char.mana += quest.manaReward;
        char.gold += quest.goldReward;
        DQ_UI.showCustomPopup(`EXTRA-QUEST ERFÜLLT! 📜\n+${quest.manaReward} Mana ✨ | +${quest.goldReward} Gold 💰`);

        
        const questTemplate = DQ_DATA.extraQuestPool.find(q => q.nameKey === quest.nameKey);
        char = await DQ_CONFIG.processStatGains(char, questTemplate);
        char = DQ_CONFIG.levelUpCheck(char);
        await new Promise(res => charStore.put(char).onsuccess = res);

        tx.oncomplete = () => {
            this.renderExtraQuestPage();
            // --- BUGFIX: Korrekter Aufruf ---
            DQ_CHARACTER_MAIN.renderPage();
        };
    }
};