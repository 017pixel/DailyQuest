const DQ_WGER = {
    STORE_NAME: 'wger_exercises',
    META_KEY: 'wger_sync_meta',
    API_URL: 'https://wger.de/api/v2/exerciseinfo/',
    IMPORT_CHUNKS: [
        { limit: 300, offset: 0 },
        { limit: 300, offset: 300 },
        { limit: 300, offset: 600 }
    ],
    WEEK_MS: 7 * 24 * 60 * 60 * 1000,
    importPromise: null,
    searchTerm: '',
    equipmentFilter: 'all',
    muscleFilter: 'all',

    defaults() {
        return DQ_DATA.wgerDefaults || {};
    },

    getLang() {
        return DQ_CONFIG?.userSettings?.language || 'de';
    },

    isSportCategory(category) {
        return (this.defaults().WGER_CATEGORIES || []).includes(category);
    },

    isWgerId(id) {
        return String(id || '').startsWith('wger:');
    },

    isWgerNameKey(nameKey) {
        return String(nameKey || '').startsWith('wger_');
    },

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    },

    sanitizeHtml(html) {
        const raw = String(html || '').trim();
        if (!raw) return '';
        return raw
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '')
            .replace(/\sjavascript:/gi, '');
    },

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = this.sanitizeHtml(html);
        return (div.textContent || div.innerText || '').trim();
    },

    getTranslation(raw, languageId) {
        return (raw.translations || []).find(t => Number(t.language) === languageId) || null;
    },

    normalizeExercise(raw) {
        const defaults = this.defaults();
        const category = raw.category?.name || 'General';
        const categoryDefaults = defaults.CATEGORY_DEFAULTS?.[category] || defaults.CATEGORY_DEFAULTS?.Chest || {
            type: 'reps',
            baseValue: 10,
            mana: 20,
            gold: 6,
            statPoints: { kraft: 1 }
        };
        const de = this.getTranslation(raw, 1);
        const en = this.getTranslation(raw, 2);
        const fallbackTranslation = en || de || (raw.translations || [])[0] || {};
        const nameDe = (de?.name || '').trim();
        const nameEn = (en?.name || '').trim();
        const fallbackName = nameDe || nameEn || fallbackTranslation.name || `unknown_${raw.id}`;
        const displayNameDe = nameDe || nameEn || fallbackTranslation.name || `unknown_${raw.id}`;
        const displayNameEn = nameEn || nameDe || fallbackTranslation.name || `unknown_${raw.id}`;
        const overrideType = defaults.TYPE_OVERRIDES?.[displayNameEn.trim()] || defaults.TYPE_OVERRIDES?.[displayNameDe.trim()];
        const mainImage = (raw.images || []).find(img => img.is_main) || (raw.images || [])[0] || null;
        const equipment = (raw.equipment || []).map(item => Number(item.id)).filter(Number.isFinite);
        const muscles = (raw.muscles || []).map(item => Number(item.id)).filter(Number.isFinite);
        const musclesSecondary = (raw.muscles_secondary || []).map(item => Number(item.id)).filter(Number.isFinite);
        const bodyweightId = defaults.BODYWEIGHT_EQUIPMENT_ID || 7;
        const hasVideos = Array.isArray(raw.videos) && raw.videos.length > 0;
        const videos = hasVideos ? raw.videos.map(v => ({
            url: v.url || v.video || '',
            embed: v.embed_url || '',
            isMain: v.is_main || false
        })) : [];
        const hasImage = !!mainImage;

        const rawDe = this.sanitizeHtml(de?.description || '');
        const rawEn = this.sanitizeHtml(en?.description || '');

        const isUsefulContent = (html) => {
            if (!html) return false;
            const text = this.stripHtml(html).trim();
            if (!text || text.length < 5) return false;
            if (text === 'Keine' || text === 'None' || text === 'N/A' || text === '—') return false;
            if (/^\s*<p>\s*<\/p>\s*$/.test(html)) return false;
            return true;
        };

        const descriptionDe = isUsefulContent(rawDe) ? rawDe : '';
        const descriptionEn = isUsefulContent(rawEn) ? rawEn : '';

        return {
            id: `wger:${raw.id}`,
            source: 'wger',
            wgerId: raw.id,
            uuid: raw.uuid || '',
            nameKey: `wger_${raw.id}`,
            category,
            categoryId: raw.category?.id || null,
            muscles,
            musclesSecondary,
            equipment,
            needsEquipment: equipment.length > 0 && !equipment.includes(bodyweightId),
            hasImage,
            hasVideos,
            imageUrl: mainImage?.image || '',
            imageThumbSm: mainImage?.thumbnails?.small || mainImage?.image || '',
            imageThumbMd: mainImage?.thumbnails?.medium || mainImage?.image || '',
            nameDe: displayNameDe.trim(),
            nameEn: displayNameEn.trim(),
            descriptionDe,
            descriptionEn,
            hasMedia: hasImage || hasVideos,
            videos,
            hasUsefulDescription: !!descriptionDe || !!descriptionEn,
            type: overrideType || categoryDefaults.type,
            baseValue: categoryDefaults.baseValue,
            mana: categoryDefaults.mana,
            gold: categoryDefaults.gold,
            manaReward: categoryDefaults.mana,
            goldReward: categoryDefaults.gold,
            statPoints: { ...(categoryDefaults.statPoints || {}) },
            importedAt: new Date().toISOString(),
            lastUpdated: raw.last_update_global || raw.last_update || '',
            deprecated: false,
            license: raw.license?.short_name || 'CC-BY-SA 4',
            licenseUrl: raw.license?.url || 'https://creativecommons.org/licenses/by-sa/4.0/',
            licenseAuthor: raw.license_author || ''
        };
    },

    async storeCount() {
        if (!DQ_DB.db?.objectStoreNames.contains(this.STORE_NAME)) return 0;
        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const req = tx.objectStore(this.STORE_NAME).count();
            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => resolve(0);
        });
    },

    async getMeta() {
        if (!DQ_DB.db?.objectStoreNames.contains('settings')) return null;
        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['settings'], 'readonly');
            const req = tx.objectStore('settings').get(this.META_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    },

    async saveMeta(meta) {
        if (!DQ_DB.db?.objectStoreNames.contains('settings')) return;
        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['settings'], 'readwrite');
            tx.objectStore('settings').put({ id: this.META_KEY, ...meta });
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    },

    async fetchChunk(limit, offset) {
        const url = `${this.API_URL}?limit=${limit}&offset=${offset}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`wger ${response.status}`);
        return response.json();
    },

    async fetchAllExercises() {
        const pages = await Promise.all(this.IMPORT_CHUNKS.map(chunk => this.fetchChunk(chunk.limit, chunk.offset)));
        const records = pages.flatMap(page => page.results || []);
        const unique = new Map();
        records.forEach(item => unique.set(item.id, item));
        return {
            count: pages[0]?.count || unique.size,
            results: Array.from(unique.values())
        };
    },

    async writeExercises(exercises) {
        if (!DQ_DB.db?.objectStoreNames.contains(this.STORE_NAME)) return;
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            exercises.forEach(ex => store.put(ex));
            tx.oncomplete = () => resolve();
            tx.onerror = event => reject(event.target.error);
        });
    },

    async importAll({ silent = true } = {}) {
        if (this.importPromise) return this.importPromise;

        this.importPromise = (async () => {
            let toastTimer = null;
            try {
                if (!silent) {
                    toastTimer = setTimeout(() => {
                        DQ_UI?.showCustomPopup?.('Uebungsdatenbank wird aktualisiert...', 'info');
                    }, 3000);
                }

                const payload = await this.fetchAllExercises();
                const normalized = payload.results.map(raw => this.normalizeExercise(raw));
                await this.writeExercises(normalized);
                await this.saveMeta({
                    lastSyncAt: Date.now(),
                    count: normalized.length,
                    sourceCount: payload.count,
                    status: 'ok'
                });
                this.markLegacyPlansPreserved();
                localStorage.removeItem('wgerImportOffset');
                return normalized.length;
            } catch (error) {
                await this.saveMeta({
                    lastSyncAt: Date.now(),
                    status: 'error',
                    error: String(error?.message || error)
                });
                if ((await this.storeCount()) === 0 && !silent) {
                    DQ_UI?.showCustomPopup?.('Uebungsdatenbank konnte nicht geladen werden. Die App nutzt vorerst Basis-Uebungen.', 'penalty');
                }
                throw error;
            } finally {
                if (toastTimer) clearTimeout(toastTimer);
                this.importPromise = null;
            }
        })();

        return this.importPromise;
    },

    async startBackgroundSync() {
        const count = await this.storeCount();
        const meta = await this.getMeta();
        const isStale = !meta?.lastSyncAt || Date.now() - Number(meta.lastSyncAt) > this.WEEK_MS;
        const shouldImport = count === 0 || isStale;
        if (!shouldImport) {
            this.markLegacyPlansPreserved();
            return;
        }

        setTimeout(() => {
            this.importAll({ silent: count > 0 }).then(() => {
                if (typeof DQ_EXERCISES !== 'undefined') DQ_EXERCISES.renderFreeExercisesPage();
            }).catch(error => {
                console.warn('wger background sync failed:', error);
            });
        }, 2000);
    },

    markLegacyPlansPreserved() {
        localStorage.setItem('dq_wger_custom_plans_preserved', '1');
    },

    async migrateLegacyCustomPlans() {
        console.log('Bestehende Custom-Trainingsplaene bleiben lokal erhalten und werden nicht automatisch auf wger umgeschrieben.');
        this.markLegacyPlansPreserved();
        return 0;
    },

    async getAllStoredExercises() {
        const count = await this.storeCount();
        if (count === 0) {
            return (this.defaults().FALLBACK_EXERCISES || []).map(ex => ({ ...ex, source: 'wger', nameKey: ex.nameKey || `wger_fallback_${Math.abs(ex.wgerId)}` }));
        }
        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const req = tx.objectStore(this.STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    },

    getLocalExercises() {
        const categories = this.defaults().LOCAL_EXERCISE_CATEGORIES || ['restday', 'learning', 'sick', 'senior', 'general_workout'];
        return categories.flatMap(category => (DQ_DATA.exercisePool?.[category] || []).map(ex => ({
            ...ex,
            source: 'local',
            category,
            manaReward: ex.mana,
            goldReward: ex.gold
        })));
    },

    async getById(id) {
        if (!this.isWgerId(id)) {
            const numeric = Number(id);
            return this.getLocalExercises().find(ex => Number(ex.id) === numeric) || null;
        }

        const fallbackRaw = (this.defaults().FALLBACK_EXERCISES || []).find(ex => ex.id === id);
        const fallback = fallbackRaw ? { ...fallbackRaw, source: 'wger', nameKey: fallbackRaw.nameKey || `wger_fallback_${Math.abs(fallbackRaw.wgerId)}` } : null;
        if (!DQ_DB.db?.objectStoreNames.contains(this.STORE_NAME)) return fallback || null;

        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const req = tx.objectStore(this.STORE_NAME).get(id);
            req.onsuccess = () => resolve(req.result || fallback || null);
            req.onerror = () => resolve(fallback || null);
        });
    },

    async getByNameKey(nameKey) {
        const local = this.getLocalExercises().find(ex => ex.nameKey === nameKey);
        if (local) return local;
        const all = await this.getAllStoredExercises();
        return all.find(ex => ex.nameKey === nameKey) || null;
    },

    getDisplayName(exercise, lang = this.getLang()) {
        if (!exercise) return 'Training';
        if (exercise.customDisplayName) return exercise.customDisplayName;
        if (exercise.displayName) return exercise.displayName;
        if (exercise.nameDe && exercise.nameEn) {
            return (lang === 'en' ? exercise.nameEn : exercise.nameDe) || exercise.nameEn;
        }
        if (exercise.source === 'wger' || this.isWgerId(exercise.id) || this.isWgerNameKey(exercise.nameKey)) {
            if (exercise.nameDe || exercise.nameEn) {
                return (lang === 'en' ? exercise.nameEn : exercise.nameDe) || exercise.nameEn || exercise.nameDe;
            }
            const fallbackId = String(exercise.wgerId || exercise.id || '');
            if (fallbackId.startsWith('wger:')) {
                return `Training ${fallbackId.split(':')[1]}`;
            }
        }
        const names = DQ_DATA.translations?.[lang]?.exercise_names || {};
        return names[exercise.nameKey] || exercise.nameKey;
    },

    getDescription(exercise, lang = this.getLang()) {
        if (!exercise) return '';
        if (exercise.source === 'wger' || this.isWgerId(exercise.id) || this.isWgerNameKey(exercise.nameKey)) {
            const de = exercise.descriptionDe || '';
            const en = exercise.descriptionEn || '';
            if (lang === 'en') return en || de;
            return de || en || '';
        }
        return exercise.description || DQ_DATA.exerciseExplanations?.[lang]?.[exercise.nameKey] || '';
    },

    getMuscleName(id, lang = this.getLang()) {
        const labels = this.defaults().MUSCLE_NAMES || {};
        return labels[id]?.[lang] || labels[id]?.en || String(id);
    },

    getEquipmentName(id) {
        return this.defaults().EQUIPMENT_NAMES?.[id] || String(id);
    },

    async queryExercises(filters = {}) {
        const lang = this.getLang();
        const category = filters.category || 'all';
        const search = String(filters.search ?? this.searchTerm ?? '').trim().toLowerCase();
        const equipment = String(filters.equipment ?? this.equipmentFilter ?? 'all');
        const muscle = String(filters.muscle ?? this.muscleFilter ?? 'all');
        const hasEquipment = filters.hasEquipment !== false;
        const offset = Math.max(0, Number(filters.offset) || 0);
        const limit = Math.max(1, Number(filters.limit) || 30);

        let list = [];
        if (category === 'all' || category === 'focus' || this.isSportCategory(category)) {
            list = list.concat(await this.getAllStoredExercises());
        }
        if (category === 'all' || category === 'focus' || !this.isSportCategory(category)) {
            list = list.concat(this.getLocalExercises());
        }

        list = list.filter(ex => {
            if (category === 'focus' && ex.type !== 'focus') return false;
            if (category !== 'all' && category !== 'focus' && ex.category !== category) return false;
            if (!hasEquipment && ex.needsEquipment) return false;
            if (equipment !== 'all' && !(ex.equipment || []).includes(Number(equipment))) return false;
            if (muscle !== 'all') {
                const id = Number(muscle);
                const muscles = (ex.muscles || []).concat(ex.musclesSecondary || []);
                if (!muscles.includes(id)) return false;
            }
            if (search) {
                const haystack = [
                    this.getDisplayName(ex, lang),
                    ex.nameEn,
                    ex.nameDe,
                    ex.nameKey,
                    ex.category
                ].join(' ').toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return ex.deprecated !== true;
        });

        list.sort((a, b) => {
            const aMedia = a.hasMedia ? 0 : 1;
            const bMedia = b.hasMedia ? 0 : 1;
            if (aMedia !== bMedia) return aMedia - bMedia;
            const aDesc = a.hasUsefulDescription ? 0 : 1;
            const bDesc = b.hasUsefulDescription ? 0 : 1;
            if (aDesc !== bDesc) return aDesc - bDesc;
            return this.getDisplayName(a, lang).localeCompare(this.getDisplayName(b, lang), lang);
        });
        return {
            total: list.length,
            items: list.slice(offset, offset + limit),
            hasMore: offset + limit < list.length
        };
    },

    async getTrainingPool(goal, slotKey, hasEquipment) {
        const defaults = this.defaults();
        const normalized = DQ_TRAINING_SYSTEM?.normalizeGoal ? DQ_TRAINING_SYSTEM.normalizeGoal(goal) : goal;
        const baseCategories = defaults.PHASE_CATEGORY_MAPPING?.[normalized] || defaults.PHASE_CATEGORY_MAPPING?.muscle || [];
        const slotCategories = defaults.SLOT_CATEGORY_MAPPING?.[slotKey] || baseCategories;
        const allowedCategories = slotCategories.filter(cat => baseCategories.includes(cat));
        const categories = allowedCategories.length ? allowedCategories : baseCategories;
        const all = await this.getAllStoredExercises();
        const bodyweightId = defaults.BODYWEIGHT_EQUIPMENT_ID || 7;

        return all.filter(ex => {
            if (!categories.includes(ex.category)) return false;
            if (ex.deprecated) return false;
            if (hasEquipment === false && ex.needsEquipment) return false;
            if (normalized === 'calisthenics' && !(ex.equipment || []).includes(bodyweightId)) return false;
            return true;
        });
    },

    async prefetchThumbnails() {
        if (!('requestIdleCallback' in window) || !navigator.onLine) return;
        if (navigator.connection && navigator.connection.saveData) return;
        if (navigator.connection && !/wifi|ethernet/i.test(navigator.connection.effectiveType || '') && navigator.connection.downlink < 5) return;

        requestIdleCallback(async () => {
            const all = (await this.getAllStoredExercises()).filter(ex => ex.imageThumbSm).slice(0, 100);
            for (const ex of all) {
                try {
                    await fetch(ex.imageThumbSm, { cache: 'force-cache', mode: 'no-cors' });
                } catch {
                    break;
                }
            }
        }, { timeout: 5000 });
    }
};

if (typeof window !== 'undefined') {
    window.DQ_WGER = DQ_WGER;
}
