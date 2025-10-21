const DQ_ACHIEVEMENTS = {

    init(elements) {
        elements.achievementsPopup.addEventListener('click', (event) => this.handlePopupClick(event));
    },

    handlePopupClick(event) {
        const button = event.target.closest('button.action-button');
        if (!button) return;

        const card = button.closest('.achievement-card');
        const achievementKey = card.dataset.key;
        const action = button.dataset.action;

        if (action === 'info') {
            this.showAchievementInfo(achievementKey);
        } else if (action === 'claim') {
            this.claimReward(achievementKey);
        }
    },

    async renderAchievementsList() {
        const listContainer = document.getElementById('achievements-list');
        listContainer.innerHTML = '';
        const lang = DQ_CONFIG.userSettings.language || 'de';
        
        let char = await DQ_CONFIG.getCharacter();
        if (!char) {
            listContainer.innerHTML = `<div class="card"><p>Erfolge konnten nicht geladen werden. Bitte versuche es später erneut.</p></div>`;
            return;
        }

        let charWasModified = false;
        if (!char.achievements) char.achievements = {};
        for (const key in DQ_DATA.achievements) {
            if (!char.achievements[key]) {
                char.achievements[key] = { tier: 0, claimable: false };
                charWasModified = true; 
            }
        }

        if (charWasModified) {
            console.log("Fehlende Achievements im Charakterobjekt gefunden und hinzugefügt. Speichere...");
            const tx = DQ_DB.db.transaction('character', 'readwrite');
            const store = tx.objectStore('character');
            await new Promise((resolve, reject) => {
                const request = store.put(char);
                request.onsuccess = resolve;
                request.onerror = reject;
            });
        }

        const achievements = Object.values(DQ_DATA.achievements).map(ach => {
            const progress = char.achievements[ach.key];
            const isCompleted = progress.tier >= ach.tiers.length;
            const status = progress.claimable ? 'claimable' : (isCompleted ? 'completed' : 'in-progress');
            
            return { ...ach, progress, status };
        });

        achievements.sort((a, b) => {
            if (a.status === 'claimable' && b.status !== 'claimable') return -1;
            if (a.status !== 'claimable' && b.status === 'claimable') return 1;
            if (a.status === 'in-progress' && b.status === 'completed') return -1;
            if (a.status === 'completed' && b.status === 'in-progress') return 1;
            return 0;
        });

        achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = `card achievement-card ${ach.status}`;
            card.dataset.key = ach.key;

            const name = DQ_DATA.translations[lang][ach.nameKey] || ach.nameKey;
            const claimText = DQ_DATA.translations[lang].ach_claim_button || 'Claim';
            
            card.innerHTML = `
                <div class="achievement-info">
                    <span class="icon">${ach.icon}</span>
                    <h2>${name}</h2>
                </div>
                <div class="achievement-card-actions">
                    <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                    <button class="action-button claim-button-small" data-action="claim" aria-label="Abholen" ${!ach.progress.claimable ? 'disabled' : ''}>
                        ${claimText}
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    },

    async showAchievementInfo(achievementKey) {
        const infoContainer = document.getElementById('achievement-info-content');
        infoContainer.innerHTML = '';
        const lang = DQ_CONFIG.userSettings.language || 'de';

        const char = await DQ_CONFIG.getCharacter();
        if (!char) return;

        const achData = DQ_DATA.achievements[achievementKey];
        const achProgress = char.achievements[achievementKey];
        const currentTierIndex = achProgress.tier;

            if (currentTierIndex >= achData.tiers.length) {
            infoContainer.innerHTML = `<p>Du hast alle Stufen dieses Erfolgs gemeistert!</p>`;
            DQ_UI.showPopup(document.getElementById('achievement-info-popup'));
            return;
        }

        const currentGoal = achData.tiers[currentTierIndex];
        const currentLevel = currentTierIndex + 1;
        const rewardGold = 100 * currentLevel;
        const rewardMana = 100 * currentLevel;

        let currentProgressValue = 0;
        switch(achievementKey) {
            case 'level': currentProgressValue = char.level; break;
            case 'quests': currentProgressValue = char.totalQuestsCompleted || 0; break;
            case 'gold': currentProgressValue = char.totalGoldEarned || 0; break;
            case 'shop': currentProgressValue = char.totalItemsPurchased || 0; break;
            case 'strength': currentProgressValue = char.stats.kraft; break;
            case 'streak': currentProgressValue = DQ_CONFIG.getStreakData().streak; break;
            case 'focus_time': // NEU
                currentProgressValue = DQ_VIBE_STATE.state.sessions.reduce((sum, s) => sum + s.duration, 0);
                break;
        }

        const progressPercentage = Math.min((currentProgressValue / currentGoal) * 100, 100);
        
        const name = DQ_DATA.translations[lang][achData.nameKey] || achData.nameKey;
        const description = DQ_DATA.translations[lang][achData.descriptionKey] || '';
        
        infoContainer.innerHTML = `
            <h3><span class="icon">${achData.icon}</span> ${name}</h3>
            <p class="description">${description}</p>
            <div class="achievement-details-box">
                <div class="detail-item">
                    <span class="label" data-lang-key="ach_info_level">${DQ_DATA.translations[lang].ach_info_level || 'Level'}</span>
                    <span class="value">${currentLevel} / ${achData.tiers.length}</span>
                </div>
                <div class="detail-item">
                    <span class="label" data-lang-key="ach_info_reward">${DQ_DATA.translations[lang].ach_info_reward || 'Reward'}</span>
                    <span class="value"><span class="material-symbols-rounded icon-gold" style="vertical-align: middle;">paid</span> ${rewardGold} &nbsp; <span class="material-symbols-rounded icon-mana" style="vertical-align: middle;">auto_awesome</span> ${rewardMana}</span>
                </div>
            </div>
            <div class="progress-text">${currentProgressValue} / ${currentGoal}</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
            </div>
        `;
        DQ_UI.showPopup(document.getElementById('achievement-info-popup'));
    },

    async claimReward(achievementKey) {
        const tx = DQ_DB.db.transaction('character', 'readwrite');
        const store = tx.objectStore('character');
        let char = await new Promise(res => store.get(1).onsuccess = e => res(e.target.result));

        if (!char || !char.achievements || !char.achievements[achievementKey]) return;
        
        const achProgress = char.achievements[achievementKey];
        if (!achProgress.claimable) return;

        const currentTierIndex = achProgress.tier;
        const currentLevel = currentTierIndex + 1;
        
        const rewardGold = 100 * currentLevel;
        const rewardMana = 100 * currentLevel;

        char.gold += rewardGold;
        char.mana += rewardMana;
        
        achProgress.tier++;
        achProgress.claimable = false;

        store.put(char);
        
        await new Promise(resolve => {
            tx.oncomplete = resolve;
            tx.onerror = e => console.error("Fehler beim Speichern der Belohnung:", e);
        });

        const lang = DQ_CONFIG.userSettings.language || 'de';
        const achName = DQ_DATA.translations[lang][DQ_DATA.achievements[achievementKey].nameKey] || achievementKey;
        const popupTitle = `ERFOLG ABGESCHLOSSEN!`;
            const popupContent = `
            <p style=\"text-align: center; margin-bottom: 16px;\">
                <strong>${char.name}</strong> hat die Stufe ${currentLevel} des Erfolgs <br>
                <em>\"${achName}\"</em> abgeschlossen!
            </p>
            <hr class=\"stat-separator\">
            <p style=\"text-align: center; font-size: 1.2em; margin-top: 16px;\">
                <strong>Belohnung:</strong> <span class=\"material-symbols-rounded icon-gold\">paid</span> ${rewardGold} Gold & <span class=\"material-symbols-rounded icon-mana\">auto_awesome</span> ${rewardMana} Mana
            </p>
        `;
        DQ_UI.showRewardPopup(popupTitle, popupContent);

        this.renderAchievementsList();
        DQ_CHARACTER_MAIN.renderPage();
        
        const freshChar = await DQ_CONFIG.getCharacter();
        if (freshChar) {
            this.checkAchievement(freshChar, achievementKey);
        }
    },

    async checkAllAchievements(char) {
        for (const key in DQ_DATA.achievements) {
            await this.checkAchievement(char, key);
        }
    },

    async checkAchievement(char, key) {
        const achData = DQ_DATA.achievements[key];
        if (!char.achievements || !char.achievements[key]) return;
        const achProgress = char.achievements[key];

        if (achProgress.claimable || achProgress.tier >= achData.tiers.length) {
            return;
        }

        const currentGoal = achData.tiers[achProgress.tier];
        let currentProgressValue = 0;
        switch(key) {
            case 'level': currentProgressValue = char.level; break;
            case 'quests': currentProgressValue = char.totalQuestsCompleted || 0; break;
            case 'gold': currentProgressValue = char.totalGoldEarned || 0; break;
            case 'shop': currentProgressValue = char.totalItemsPurchased || 0; break;
            case 'strength': currentProgressValue = char.stats.kraft; break;
            case 'streak': currentProgressValue = DQ_CONFIG.getStreakData().streak; break;
            case 'focus_time': // NEU
                currentProgressValue = DQ_VIBE_STATE.state.sessions.reduce((sum, s) => sum + s.duration, 0);
                break;
        }

        if (currentProgressValue >= currentGoal) {
            achProgress.claimable = true;
            const tx = DQ_DB.db.transaction('character', 'readwrite');
            const store = tx.objectStore('character');
            await new Promise(resolve => {
                store.put(char).onsuccess = resolve;
            });
            
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const name = DQ_DATA.translations[lang][achData.nameKey] || achData.nameKey;
            DQ_UI.showCustomPopup(`Erfolg freigeschaltet: ${name}!<br>Hol dir deine Belohnung ab!`);

            if (document.getElementById('achievements-popup').classList.contains('show')) {
                this.renderAchievementsList();
            }
        }
    }
};