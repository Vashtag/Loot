const TILE = 32;
const COLS = 25;
const ROWS = 18;
const GAME_W = TILE * COLS; // 800
const GAME_H = TILE * ROWS; // 576

const GAME_DURATION = 300; // 5 minutes in seconds

// Rarity tiers
const RARITY = {
  COMMON:    { name: 'Common',    color: 0xaaaaaa, score: 10,  chance: 0.50 },
  UNCOMMON:  { name: 'Uncommon',  color: 0x44cc44, score: 25,  chance: 0.28 },
  RARE:      { name: 'Rare',      color: 0x4488ff, score: 75,  chance: 0.14 },
  EPIC:      { name: 'Epic',      color: 0xaa44ff, score: 200, chance: 0.06 },
  LEGENDARY: { name: 'Legendary', color: 0xffaa00, score: 500, chance: 0.02 },
};

const LOOT_ITEMS = [
  // Common
  { name: 'Rusty Coin',      rarity: 'COMMON',    emoji: '🪙' },
  { name: 'Old Boot',        rarity: 'COMMON',    emoji: '👢' },
  { name: 'Cracked Mug',     rarity: 'COMMON',    emoji: '☕' },
  { name: 'Torn Map',        rarity: 'COMMON',    emoji: '🗺️' },
  // Uncommon
  { name: 'Silver Ring',     rarity: 'UNCOMMON',  emoji: '💍' },
  { name: 'Jade Figurine',   rarity: 'UNCOMMON',  emoji: '🗿' },
  { name: 'Strange Potion',  rarity: 'UNCOMMON',  emoji: '🧪' },
  { name: 'Ancient Key',     rarity: 'UNCOMMON',  emoji: '🗝️' },
  // Rare
  { name: 'Crystal Orb',     rarity: 'RARE',      emoji: '🔮' },
  { name: 'Golden Compass',  rarity: 'RARE',      emoji: '🧭' },
  { name: 'Enchanted Tome',  rarity: 'RARE',      emoji: '📖' },
  // Epic
  { name: 'Dragon Scale',    rarity: 'EPIC',      emoji: '🐉' },
  { name: 'Void Shard',      rarity: 'EPIC',      emoji: '💎' },
  { name: 'Star Fragment',   rarity: 'EPIC',      emoji: '⭐' },
  // Legendary
  { name: 'Crown of Ages',   rarity: 'LEGENDARY', emoji: '👑' },
  { name: 'The Lost Relic',  rarity: 'LEGENDARY', emoji: '🏺' },
];

// Tile types
const TILE_TYPE = {
  FLOOR:  0,
  WALL:   1,
  CHEST:  2,
  HAZARD: 3,
  EXIT:   4,
};

// Palette (Stardew-ish)
const PAL = {
  FLOOR_LIGHT: 0x7ec850,
  FLOOR_DARK:  0x6ab340,
  WALL:        0x8b6914,
  WALL_TOP:    0xa0845a,
  CHEST_WOOD:  0xc8893a,
  CHEST_BAND:  0xd4a017,
  BG:          0x1a1a2e,
  UI_BG:       0x2d2d44,
  UI_BORDER:   0x7ec850,
};
