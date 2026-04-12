# Shop System - Funktions-Erklärung

## Übersicht
Das Shop System ermöglicht Spielern Ausrüstung und Items zu kaufen, um ihre Stats zu verbessern. Der Shop enthält Waffen, Rüstungen und spezielle Items. Jeder Kauf aktualisiert den `achievements.shop` Progress und das `inventory` Array.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/page_shop.js` - Hauptmodul für Shop-UI
- `js/database.js` - IndexedDB Zugriffe
- `js/character/page_character_inventory.js` - Inventar-Integration

### Daten-Dateien
- `data/shop.js` - Shop-Item Definitionen (existiert als Array in page_shop.js)
- `data/translations.js` - Übersetzungen

## Wichtige Punkte

### Shop Item Struktur
```javascript
{
  id: "iron_sword_01",
  nameKey: "shop_iron_sword",
  type: "weapon",           // weapon, armor, accessory, special
  category: "combat",
  cost: 100,
  stats: {
    attack: 5,
    protection: 0
  },
  rarity: "common",         // common, rare, epic, legendary
  icon: "️",
  description: "Eine solide Eisenwaffe für Anfänger."
}
```

### Item-Typen
| Typ | Beschreibung | Max Anzahl |
|-----|--------------|-----------|
| `weapon` | Waffen-Item | unlimited |
| `armor` | Rüstungs-Item | 1 (pro Slot) |
| `accessory` | Accessoire | unlimited |
| `special` | Spezial-Item | 1 (einmalig) |

### Item-Raritäten
| Rarität | Farb-Code | Stat-Bonus |
|---------|-----------|------------|
| `common` | Grau (#9ca3af) | Basis |
| `rare` | Blau (#3b82f6) | +20% |
| `epic` | Lila (#8b5cf6) | +50% |
| `legendary` | Gold (#eab308) | +100% |

### Währungen
| Währung | Key | Quelle |
|---------|-----|--------|
| Gold | `gold` | Quest-Belohnungen, Achievements |
| Mana | `mana` | Quest-Belohnungen |

## Design Richtung

### Architektur
- **Statische Daten**: Shop-Items sind in `data/shop.js` definiert (nicht in DB)
- **Käufliche Items**: Im `character.inventory` Array gespeichert
- **Ausrüstung**: Im `character.equipment` Objekt (weapon, armor)

### UI-Layout
- Grid-Layout für Item-Karten
- Filter-Tabs nach Kategorie/Typ
- Tooltip mit Item-Details bei Hover

## IndexDB Speicherung

### Character Store Erweiterung
```javascript
{
  // ... andere Character-Felder
  equipment: {
    weapons: [],    // Array von Waffen
    armor: null,    // Einzelne Rüstung oder null
    accessories: [] // Array von Accessories
  },
  inventory: [],    // Alle gekauften Items (auch nicht ausgerüstet)
  totalItemsPurchased: 0  // Achievement-Tracking
}
```

### Shop Store (Falls vorhanden)
```javascript
{
  storeName: 'shop',
  keyPath: 'id',
  value: shopItemDefinitions  // Optional: Preise können sich ändern
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "character": {
    "equipment": {
      "weapons": [...],
      "armor": {...}
    },
    "inventory": [...],
    "totalItemsPurchased": 123
  }
}
```

### Import Logik
```javascript
// Inventory wird 1:1 importiert
await DQ_DB.putSingle('character', importedCharacter);
```

## Streak Verbindung

### Keine direkte Streak-Verbindung
- Shop-Käufe beeinflussen den Streak nicht direkt
- **Indirekt**: Bessere Ausrüstung = bessere Dungeon-Performance = mehr Mana = mehr Level-Ups

### Achievement Tracking
```javascript
character.achievements.shop = {
  tier: Math.floor(character.totalItemsPurchased / 10),
  claimable: character.totalItemsPurchased >= (tier + 1) * 10
};
```

## Häufige Fehler

### 1. Gold-Dubletten
**Fehler**: Spieler kauft Item obwohl nicht genug Gold
**Lösung**: `checkAffordable()` vor Kauf ausführen

### 2. Mehrfach-Ausrüstung
**Fehler**: Spieler rüstet mehr als eine Rüstung aus
**Lösung**: `unequipCurrentArmor()` vor `equip()` aufrufen

### 3. Item nicht im Inventory
**Fehler**: `unequipItem()` findet Item nicht
**Lösung**: Prüfe ob Item in `inventory` existiert

### 4. Rarity-Stat-Bonus vergessen
**Fehler**: Item-Stats werden ohne Rarity-Bonus berechnet
**Lösung**: `calculateItemStats(item)` mit Rarity-Multiplikator

### 5. Inventory Size Limit
**Fehler**: Unbegrenztes Inventory verlangsamt UI
**Lösung**: Pagination oder virtuelle Liste implementieren

## Wichtige Funktionen

### page_shop.js
```javascript
DQ_SHOP = {
  init(elements) { ... },              // Initialisierung
  renderShopPage() { ... },            // Shop anzeigen
  renderInventoryPage() { ... },       // Inventory anzeigen
  renderEquipmentPage() { ... },       // Equipment anzeigen

  buyItem(itemId) { ... },             // Item kaufen
  canAfford(item) { ... },             // Prüfen ob bezahlbar

  equipItem(item) { ... },             // Item ausrüsten
  unequipItem(item, slot) { ... },     // Item ablegen

  sellItem(item) { ... },              // Item verkaufen (optional)
  upgradeItem(item) { ... }            // Item upgraden (optional)
}
```

### Combat Stat Berechnung
```javascript
function calculateCombatStats() {
  let totalAttack = 0;
  let totalProtection = 0;

  // Waffen
  for (const weapon of character.equipment.weapons) {
    totalAttack += weapon.stats.attack * getRarityMultiplier(weapon.rarity);
  }

  // Rüstung
  if (character.equipment.armor) {
    totalProtection = character.equipment.armor.stats.protection *
                      getRarityMultiplier(character.equipment.armor.rarity);
  }

  return {
    attack: totalAttack,
    protection: totalProtection,
    hpMax: 100 + character.level * 10
  };
}
```

## Shop Items Daten

### Waffen-Typen
```javascript
WEAPONS = {
  // Nahkampf
  iron_sword: { baseAttack: 5, cost: 100 },
  steel_sword: { baseAttack: 10, cost: 250 },
  legendary_blade: { baseAttack: 25, cost: 1000 },

  // Bögen
  wooden_bow: { baseAttack: 4, cost: 80 },
  composite_bow: { baseAttack: 8, cost: 200 },

  // Stäbe
  wooden_staff: { baseAttack: 3, cost: 60 },
  magic_staff: { baseAttack: 7, cost: 180 }
};
```

### Rüstungs-Typen
```javascript
ARMOR = {
  leather_armor: { baseProtection: 5, cost: 120 },
  chain_mail: { baseProtection: 10, cost: 300 },
  plate_armor: { baseProtection: 20, cost: 800 },
  legendary_plate: { baseProtection: 40, cost: 2000 }
};
```

### Accessoires
```javascript
ACCESSORIES = {
  ring_of_power: { baseAttack: 2, cost: 150 },
  amulet_of_health: { baseHpMax: 20, cost: 200 },
  belt_of_strength: { baseKraft: 2, cost: 250 }
};
```

## UI Components

### Shop Item Card
```html
<div class="shop-item" data-item-id="${item.id}">
  <div class="item-icon">${item.icon}</div>
  <div class="item-info">
    <div class="item-name">${t(item.nameKey)}</div>
    <div class="item-rarity rarity-${item.rarity}">${t(item.rarity)}</div>
    <div class="item-stats">
      ${renderStats(item.stats)}
    </div>
    <div class="item-cost">
      <span class="gold-icon"></span>
      ${item.cost}
    </div>
  </div>
  <button class="buy-btn"
          ${!canAfford(item) ? 'disabled' : ''}>
    ${t('shop_buy')}
  </button>
</div>
```

### Inventory Item
```html
<div class="inventory-item"
     data-item-id="${item.id}"
     onclick="showItemDetails('${item.id}')">
  <div class="item-icon">${item.icon}</div>
  <div class="item-info">
    <div class="item-name">${t(item.nameKey)}</div>
    <div class="item-equip-status">
      ${isEquipped(item) ? ' Ausgerüstet' : ''}
    </div>
  </div>
  ${isEquipped(item) ?
    `<button class="unequip-btn" onclick="unequipItem('${item.id}')">
       ${t('shop_unequip')}
     </button>` :
    `<button class="equip-btn" onclick="equipItem('${item.id}')">
       ${t('shop_equip')}
     </button>`
  }
</div>
```

## Achievement Integration

### Shop Achievement Tiers
| Tier | Items Required | Reward |
|------|----------------|--------|
| 1 | 10 | 100 Gold, 100 Mana |
| 2 | 25 | 200 Gold, 200 Mana |
| 3 | 50 | 300 Gold, 300 Mana |
| ... | ... | ... |
| 15 | 1000 | 1500 Gold, 1500 Mana |

### Progress Update
```javascript
function updateShopAchievement() {
  const tier = Math.floor(character.totalItemsPurchased / 10);
  const threshold = (tier + 1) * 10;

  if (character.totalItemsPurchased >= threshold) {
    character.achievements.shop.tier = tier;
    character.achievements.shop.claimable = true;
    showAchievementNotification('shop');
  }
}
```

## Testing Checkliste

- [ ] Shop zeigt alle Items aus Definition
- [ ] Kauf nur mit genug Gold möglich
- [ ] Gold wird nach Kauf abgezogen
- [ ] Item erscheint im Inventory
- [ ] Item kann ausgerüstet werden
- [ ] Equipment-Stats werden in Combat verwendet
- [ ] Achievement-Progress wird aktualisiert
- [ ] Multiple Waffen können ausgerüstet werden
- [ ] Rüstung kann nur 1x ausgerüstet werden
- [ ] Unequip funktioniert korrekt
- [ ] Export enthält Inventory und Equipment
- [ ] Import stellt Inventory korrekt wieder her
