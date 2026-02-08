# Character Inventory System - Funktions-Erklärung

## Übersicht
Das Inventory System verwaltet alle gekauften Items des Spielers sowie die aktuell ausgerüstete Ausrüstung. Es unterscheidet zwischen Equipment (aktiv getragen) und Inventory (alle Items im Besitz). Das System berechnet Combat-Stats basierend auf ausgerüsteten Items.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/character/page_character_inventory.js` - Inventory UI
- `js/character/page_character_main.js` - Character-Integration
- `js/page_shop.js` - Shop-Käufe
- `js/database.js` - IndexedDB Zugriffe

## Wichtige Punkte

### Inventory Struktur
```javascript
character.inventory = [
  {
    id: "iron_sword_01",
    purchaseDate: "2026-02-08",
    equipped: false,
    rarity: "common",
    // ... item data from shop definition
  },
  // ... mehr Items
];
```

### Equipment Struktur
```javascript
character.equipment = {
  weapons: [],    // Array von Waffen (können mehrere sein)
  armor: null,    // Einzelne Rüstung oder null
  accessories: [] // Array von Accessories
};
```

### Item Objekt (vollständig)
```javascript
{
  id: "iron_sword_01",
  type: "weapon",           // weapon, armor, accessory
  nameKey: "shop_iron_sword",
  icon: "⚔️",
  rarity: "common",         // common, rare, epic, legendary
  stats: {
    attack: 5,
    protection: 0
  },
  purchaseDate: "2026-02-08",
  equipped: false,
  // Rarity-Bonus wird zur Laufzeit berechnet
  _computedStats: null       // Cache für berechnete Stats
}
```

### Rarity Multipliers
```javascript
RARITY_MULTIPLIERS = {
  common: 1.0,
  rare: 1.2,
  epic: 1.5,
  legendary: 2.0
};

function calculateItemStats(item) {
  const multiplier = RARITY_MULTIPLIERS[item.rarity];
  return {
    attack: Math.floor((item.stats.attack || 0) * multiplier),
    protection: Math.floor((item.stats.protection || 0) * multiplier),
    hpBonus: Math.floor((item.stats.hpBonus || 0) * multiplier)
  };
}
```

### Equipment Slots
```javascript
EQUIPMENT_SLOTS = {
  weapon: {
    maxItems: 5,    // Max Waffen gleichzeitig
    canUnequip: true
  },
  armor: {
    maxItems: 1,
    canUnequip: true
  },
  accessory: {
    maxItems: 3,
    canUnequip: true
  }
};
```

### Combat Stats Berechnung
```javascript
function calculateCombatStats() {
  let totalAttack = 0;
  let totalProtection = 0;
  let totalHpBonus = 0;

  // Waffen
  for (const weapon of character.equipment.weapons) {
    const stats = calculateItemStats(weapon);
    totalAttack += stats.attack;
  }

  // Rüstung
  if (character.equipment.armor) {
    const stats = calculateItemStats(character.equipment.armor);
    totalProtection = stats.protection;
    totalHpBonus = stats.hpBonus;
  }

  // Accessories
  for (const accessory of character.equipment.accessories) {
    const stats = calculateItemStats(accessory);
    totalAttack += stats.attack;
    totalHpBonus += stats.hpBonus;
  }

  return {
    attack: totalAttack,
    protection: Math.min(totalProtection, 80), // Max 80%
    hpMax: 100 + (character.level * 10) + totalHpBonus,
    hpCurrent: character.combat.hpCurrent
  };
}
```

## Design Richtung

### Architektur
- **Item Caching**: Shop-Definitions werden gecached für Item-Details
- **Computed Properties**: Rarity-Bonus wird bei Nutzung berechnet
- **Slot-Limitierung**: Waffen unlimited, Rüstung 1x, Accessories 3x

### UI-Rendering
- Grid-Layout für Inventory
- Tabs für Waffen/Rüstung/Accessories
- Tooltip mit Stats bei Hover

## IndexDB Speicherung

### Store: `character`
```javascript
{
  // ... andere Felder
  inventory: [],    // Array aller gekauften Items
  equipment: {
    weapons: [],
    armor: null,
    accessories: []
  }
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "character": {
    "inventory": [
      {
        "id": "iron_sword_01",
        "type": "weapon",
        "purchaseDate": "2026-02-08",
        "equipped": false,
        "rarity": "common"
      },
      {
        "id": "steel_sword_01",
        "type": "weapon",
        "purchaseDate": "2026-02-09",
        "equipped": true,
        "rarity": "rare"
      }
    ],
    "equipment": {
      "weapons": ["steel_sword_01"],
      "armor": null,
      "accessories": []
    }
  }
}
```

## Streak Verbindung

### Keine direkte Verbindung
- Inventory beeinflusst Streak nicht direkt
- **Indirekt**: Bessere Ausrüstung = bessere Dungeon-Performance

## Häufige Fehler

### 1. Multiple Armor Equip
**Fehler**: Spieler rüstet 2. Rüstung an obwohl 1x Slot
**Lösung**: Prüfe `EQUIPMENT_SLOTS[type].maxItems`

### 2. Item nicht in Inventory
**Fehler**: Equip von Item das nicht existiert
**Lösung**: Prüfe `inventory.find(i => i.id === itemId)`

### 3. Rarity-Bonus vergessen
**Fehler**: Stats ohne Rarity-Multiplikator
**Lösung**: `calculateItemStats()` bei jeder Nutzung

### 4. Equipment/Inventory Sync
**Fehler**: Item equipped aber nicht in equipment[]
**Lösung**: Helper-Funktion `syncEquipmentWithInventory()`

### 5. Cache Invalidation
**Fehler**: Item-Daten outdated nach Shop-Update
**Lösung**: Nutze immer aktuelle Shop-Definition, nicht gecachte

## Wichtige Funktionen

### page_character_inventory.js
```javascript
DQ_INVENTORY = {
  renderInventoryPage() { ... },      // Inventory Page
  renderEquipmentTab() { ... },       // Equipment anzeigen
  renderWeaponsTab() { ... },         // Waffen
  renderArmorTab() { ... },           // Rüstung
  renderAccessoriesTab() { ... },     // Accessories

  equipItem(itemId) { ... },           // Item ausrüsten
  unequipItem(itemId) { ... },        // Item ablegen

  getItemById(itemId) { ... },        // Item aus Inventory holen
  getEquippedItems() { ... },         // Alle ausgerüsteten Items

  calculateCombatStats() { ... },     // Combat-Stats berechnen
  refreshCombatStats() { ... },       // Update an Dungeon

  filterByType(type) { ... },         // Nach Typ filtern
  sortByRarity() { ... },             // Nach Rarität sortieren
  sortByDate() { ... }                // Nach Datum sortieren
};
```

### Shop Integration
```javascript
// In page_shop.js
async function buyItem(itemId) {
  const shopItem = SHOP_ITEMS.find(i => i.id === itemId);

  if (character.gold < shopItem.cost) {
    showError(t('shop_not_enough_gold'));
    return;
  }

  // Gold abziehen
  character.gold -= shopItem.cost;

  // Neues Item erstellen
  const newItem = {
    ...shopItem,
    id: generateItemId(),
    purchaseDate: new Date().toISOString().split('T')[0],
    equipped: false,
    rarity: shopItem.rarity
  };

  // Zum Inventory hinzufügen
  character.inventory.push(newItem);
  character.totalItemsPurchased += 1;

  // Speichern
  await DQ_DB.putSingle('character', character);

  // Shop Achievement Update
  updateShopAchievement();

  // UI Update
  renderInventory();
  showPurchaseNotification(newItem);
}
```

### Equipment Management
```javascript
function equipItem(itemId) {
  const item = character.inventory.find(i => i.id === itemId);
  if (!item) return;

  const slot = item.type;

  // Slot-Limit prüfen
  const currentEquipped = character.equipment[slot] || [];
  const maxItems = EQUIPMENT_SLOTS[slot]?.maxItems || 1;

  if (currentEquipped.length >= maxItems && !currentEquipped.includes(item)) {
    showError(t('inventory_slot_full'));
    return;
  }

  // Item als equipped markieren
  item.equipped = true;

  // Zu Equipment hinzufügen
  if (!currentEquipped.includes(item)) {
    if (Array.isArray(currentEquipped)) {
      currentEquipped.push(item);
    } else {
      character.equipment[slot] = item;
    }
  }

  // Sync
  syncInventoryEquipment();

  // Speichern
  await DQ_DB.putSingle('character', character);

  // Combat Stats aktualisieren
  DQ_DUNGEON_COMBAT.refreshCombatStats();

  showEquipNotification(item);
}

function unequipItem(itemId) {
  const item = character.inventory.find(i => i.id === itemId);
  if (!item) return;

  // Aus Equipment entfernen
  const slot = item.type;
  const equipped = character.equipment[slot];

  if (Array.isArray(equipped)) {
    const index = equipped.indexOf(item);
    if (index > -1) equipped.splice(index, 1);
  } else if (equipped?.id === itemId) {
    character.equipment[slot] = null;
  }

  // Als unequipped markieren
  item.equipped = false;

  // Sync
  syncInventoryEquipment();

  // Speichern
  await DQ_DB.putSingle('character', character);

  // Combat Stats aktualisieren
  DQ_DUNGEON_COMBAT.refreshCombatStats();

  showUnequipNotification(item);
}
```

## UI Components

### Inventory Page
```html
<div class="inventory-page">
  <div class="inventory-tabs">
    <button class="tab active" data-tab="all">${t('inventory_all')}</button>
    <button class="tab" data-tab="weapons">⚔️ ${t('inventory_weapons')}</button>
    <button class="tab" data-tab="armor">🛡️ ${t('inventory_armor')}</button>
    <button class="tab" data-tab="accessories">💍 ${t('inventory_accessories')}</button>
  </div>

  <div class="inventory-grid">
    ${inventoryItems.map(item => renderInventoryItem(item)).join('')}
  </div>

  <div class="equipment-summary">
    <h3>${t('equipment_current')}</h3>
    <div class="equipment-slots">
      ${renderEquipmentSlot('weapons', character.equipment.weapons)}
      ${renderEquipmentSlot('armor', character.equipment.armor)}
      ${renderEquipmentSlot('accessories', character.equipment.accessories)}
    </div>
    <div class="combat-stats-preview">
      <span>⚔️ ${totalAttack}</span>
      <span>🛡️ ${totalProtection}%</span>
      <span>❤️ ${hpMax}</span>
    </div>
  </div>
</div>
```

### Inventory Item Card
```html
<div class="inventory-item ${item.equipped ? 'equipped' : ''}"
     data-item-id="${item.id}"
     onclick="showItemDetails('${item.id}')">
  <div class="item-rarity-border rarity-${item.rarity}">
    <div class="item-icon">${item.icon}</div>
  </div>
  <div class="item-info">
    <div class="item-name">${t(item.nameKey)}</div>
    <div class="item-rarity rarity-${item.rarity}">${t(`rarity_${item.rarity}`)}</div>
  </div>
  <div class="item-stats-preview">
    ${item.stats.attack ? `<span>⚔️${item.stats.attack}</span>` : ''}
    ${item.stats.protection ? `<span>🛡️${item.stats.protection}</span>` : ''}
  </div>
  <div class="item-actions">
    ${item.equipped ?
      `<button class="unequip-btn" onclick="event.stopPropagation(); unequipItem('${item.id}')">
         ${t('inventory_unequip')}
       </button>` :
      `<button class="equip-btn" onclick="event.stopPropagation(); equipItem('${item.id}')">
         ${t('inventory_equip')}
       </button>`
    }
  </div>
</div>
```

### Equipment Summary
```html
<div class="equipment-summary">
  <h4>${t('equipment_worn')}</h4>

  <div class="equipment-slot" data-slot="weapons">
    <span class="slot-label">⚔️</span>
    <div class="slot-items">
      ${character.equipment.weapons.map(item => `
        <div class="equipped-item" onclick="showItemDetails('${item.id}')">
          ${item.icon}
        </div>
      `).join('') || `<span class="empty-slot">${t('equipment_empty')}</span>`}
    </div>
  </div>

  <div class="equipment-slot" data-slot="armor">
    <span class="slot-label">🛡️</span>
    <div class="slot-items">
      ${character.equipment.armor ?
        `<div class="equipped-item" onclick="showItemDetails('${character.equipment.armor.id}')">
           ${character.equipment.armor.icon}
         </div>` :
        `<span class="empty-slot">${t('equipment_empty')}</span>`
      }
    </div>
  </div>

  <div class="combat-stats">
    <div class="stat">
      <span class="stat-icon">⚔️</span>
      <span class="stat-value">${combatStats.attack}</span>
    </div>
    <div class="stat">
      <span class="stat-icon">🛡️</span>
      <span class="stat-value">${combatStats.protection}%</span>
    </div>
    <div class="stat">
      <span class="stat-icon">❤️</span>
      <span class="stat-value">${combatStats.hpMax}</span>
    </div>
  </div>
</div>
```

## Testing Checkliste

- [ ] Shop-Kauf fügt Item zum Inventory hinzu
- [ ] Item erscheint im Inventory Grid
- [ ] Equip-Button funktioniert
- [ ] Unequip-Button funktioniert
- [ ] Slot-Limits werden erzwungen (Armor 1x)
- [ ] Rarity-Bonus wird angewendet
- [ ] Combat-Stats werden berechnet
- [ ] Dungeon nutzt aktuelle Combat-Stats
- [ ] Equipment Summary zeigt aktuelle Ausrüstung
- [ ] Items können nach Typ gefiltert werden
- [ ] Inventory sortiert korrekt
- [ ] Export enthält Inventory
- [ ] Import stellt Inventory wieder her
