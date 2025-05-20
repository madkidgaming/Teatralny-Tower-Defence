export const TILE_SIZE = 40;
export const ROWS = 12;
export const COLS = 20;

export const UI_FONT_LARGE = "bold 18px Arial";
export const UI_FONT_MEDIUM = "bold 15px Arial";
export const UI_FONT_SMALL = "13px Arial";
export const UI_FONT_TINY = `bold 11px Arial`;

// Te stałe UI_BUTTON mogą już nie być tak istotne, skoro UI jest w HTML,
// ale zostawiam na razie, mogą się przydać do logiki lub jeśli coś wróci na canvas.
export const UI_BUTTON_HEIGHT = 55;
export const UI_BUTTON_WIDTH = 140;
export const UI_PADDING = 10;
export const UPGRADE_PANEL_WIDTH = 200; // Jeśli panel ulepszeń byłby na canvas
export const UPGRADE_PANEL_HEIGHT = 120;
export const UPGRADE_BUTTON_HEIGHT = 35;

export const UI_BOTTOM_PANEL_HEIGHT = UI_BUTTON_HEIGHT + UI_PADDING * 2; // Dla UI na canvasie
export const MAX_GAME_ROW = ROWS - Math.ceil(UI_BOTTOM_PANEL_HEIGHT / TILE_SIZE) -1; // Jeśli UI na canvasie zajmuje miejsce

export const WAVES_PER_LEVEL = 10;
export const MAX_ZADOWOLENIE_UPGRADE_LEVEL = 5;
export const MAX_UPGRADE_LEVEL = 5; // Max tower upgrade level

export const ENEMY_BASE_SIZE_MULTIPLIER = 1.4;
export const TOWER_RENDER_SIZE_MULTIPLIER = 1.6;
export const PROJECTILE_SIZE_MULTIPLIER = 1.2;
export const BASE_SIZE_MULTIPLIER = 2.2;

export const imageSources = {
    teatrBase: 'https://kaliskie.org/wp-content/uploads/2025/05/TEATR.png',
    laserProjectile: 'https://kaliskie.org/wp-content/uploads/2025/05/LASER-PROJECTILE.png',
    biletProjectile: 'https://kaliskie.org/wp-content/uploads/2025/05/BILET-PROJECTILE.png',
    bileterTowerIcon: 'https://kaliskie.org/wp-content/uploads/2025/05/BILETER.png',
    spoznionyWidz: 'https://kaliskie.org/wp-content/uploads/2025/05/SPOZNIONY-WIDZ.png',
    krytykTeatralny: 'https://kaliskie.org/wp-content/uploads/2025/05/KRYTYK-TEATRALNY.png',
    reflektorTowerIcon: 'https://kaliskie.org/wp-content/uploads/2025/05/reflektor.png'
};

export const baseEnemyStats = {
    krytyk: { baseHp: 100, speed: 1, aplauzReward: 10, imageKey: 'krytykTeatralny', width: TILE_SIZE * 0.7 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 0.9 * ENEMY_BASE_SIZE_MULTIPLIER },
    spozniony: { baseHp: 40, speed: 2.5, aplauzReward: 5, imageKey: 'spoznionyWidz', width: TILE_SIZE * 0.6 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 0.8 * ENEMY_BASE_SIZE_MULTIPLIER }
};

export const zadowolenieUpgrades = [
    { cost: 100, bonus: 25 }, { cost: 150, bonus: 30 }, { cost: 220, bonus: 35 },
    { cost: 300, bonus: 40 }, { cost: 400, bonus: 50 }
];

export const towerDefinitions = {
    bileter: {
        cost: 50, baseDamage: 20, baseFireRate: 70, range: TILE_SIZE * 2.8,
        projectileType: 'bilet', imageKey: 'bileterTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER,
        upgrades: {
            damage: [ { cost: 30, value: 5 }, { cost: 55, value: 7 }, { cost: 90, value: 10 }, { cost: 140, value: 12 }, { cost: 200, value: 15 } ],
            fireRate: [ { cost: 35, value: 5 }, { cost: 60, value: 7 }, { cost: 95, value: 8 }, { cost: 150, value: 9 }, { cost: 220, value: 10 } ]
        }
    },
    oswietleniowiec: {
        cost: 75, baseDamage: 35, baseFireRate: 100, range: TILE_SIZE * 3.8,
        projectileType: 'laser', imageKey: 'reflektorTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER,
        upgrades: {
            damage: [ { cost: 45, value: 8 }, { cost: 75, value: 12 }, { cost: 120, value: 15 }, { cost: 180, value: 20 }, { cost: 250, value: 25 } ],
            fireRate: [ { cost: 50, value: 7 }, { cost: 80, value: 10 }, { cost: 130, value: 12 }, { cost: 190, value: 15 }, { cost: 270, value: 18 } ]
        }
    }
};

export const projectileTypes = {
    bilet: { speed: 6, damage: 0, imageKey: 'biletProjectile', width: TILE_SIZE*0.4 * PROJECTILE_SIZE_MULTIPLIER, height: TILE_SIZE*0.2 * PROJECTILE_SIZE_MULTIPLIER },
    laser: { speed: 10, damage: 0, imageKey: 'laserProjectile', width: TILE_SIZE*0.5 * PROJECTILE_SIZE_MULTIPLIER, height: TILE_SIZE*0.15 * PROJECTILE_SIZE_MULTIPLIER }
};

export const levelData = [
    { name: "Premiera w Foyer", path: [ { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },{ x: 12, y: 5 },{ x: 12, y: 4 },{ x: 12, y: 3 },{ x: 13, y: 3 },{ x: 14, y: 3 },{ x: 15, y: 3 },{ x: 16, y: 3 },{ x: 17, y: 3 },{ x: 18, y: 3 },{ x: 19, y: 3 } ], towerSpots: [ { x: 2, y: 3 }, { x: 4, y: 1 }, { x: 5, y: 3 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 7 }, { x: 13, y: 2 }, { x: 15, y: 4 }  ], bgColor: '#c2b280', pathColor: '#a0522d'},
    { name: "Chaos w Kulisach", path: [ { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 }, { x: 16, y: 6 }, { x: 16, y: 5 }, { x: 16, y: 4 }, { x: 16, y: 3 }, { x: 16, y: 2 }, { x: 17, y: 2 }, { x: 18, y: 2 }, { x: 19, y: 2 } ], towerSpots: [ { x: 1, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 6 }, { x: 5, y: 6 }, { x: 8, y: 6 }, { x: 11, y:6 }, { x: 14, y: 6 }, { x: 15, y: 3 }, { x: 17, y: 1 } ], bgColor: '#9e8a78', pathColor: '#704214'},
    { name: "Szturm na Scenę", path: [ { x: 9, y: 0 }, { x: 9, y: 1 }, { x: 8, y: 1 }, { x: 7, y: 1 }, { x: 6, y: 1 }, { x: 5, y: 1 }, { x: 4, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 5 }, { x: 15, y: 4 }, { x: 16, y: 4 }, { x: 17, y: 4 }, { x: 18, y: 4 }, { x: 19, y: 4 } ], towerSpots: [ { x: 8, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 2 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 7, y: 5 }, { x: 10, y: 5 }, { x: 13, y: 5 }, { x: 16, y: 5 } ], bgColor: '#788991', pathColor: '#4a5459'},
    { name: "Oblężenie Garderoby", path: [ { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }, { x: 16, y: 1 }, { x: 17, y: 1 }, { x: 18, y: 1 }, { x: 19, y: 1 } ], towerSpots: [ { x: 2, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 3 }, { x: 7, y: 0 }, { x: 9, y: 2 }, { x: 12, y: 2 }, { x: 15, y: 2 }, { x: 18, y: 2 } ], bgColor: '#ecc1c1', pathColor: '#c79a9a'},
    { name: "Wielki Finał", path: [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 1, y: 5 }, { x: 1, y: 6 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 } ], towerSpots: [ { x: 3, y: 1 }, { x: 0, y: 3 }, { x: 0, y: 6 }, { x: 3, y: 6 }, { x: 6, y: 6 }, { x: 9, y: 6 }, { x: 12, y: 6 }, { x: 16, y: 7 }, { x: 17, y: 5 }, { x: 5, y:1} ], bgColor: '#670c0c', pathColor: '#400a0a' }
].map(level => ({ ...level, towerSpots: level.towerSpots.map(spot => ({...spot, occupied: false})) }));


export const waveDefinitionsBase = [
    { krytyk: {count: 2, level: 1}, spozniony: {count: 0, level: 1}, interval: 150 },
    { krytyk: {count: 3, level: 1}, spozniony: {count: 1, level: 1}, interval: 140 },
    { krytyk: {count: 4, level: 1}, spozniony: {count: 2, level: 1}, interval: 130 },
    { krytyk: {count: 2, level: 2}, spozniony: {count: 2, level: 1}, interval: 120 },
    { krytyk: {count: 3, level: 2}, spozniony: {count: 3, level: 2}, interval: 110, boss: {type: 'krytyk', level: 1, hpMultiplier: 1.8} },
    { krytyk: {count: 4, level: 2}, spozniony: {count: 4, level: 2}, interval: 100 },
    { krytyk: {count: 2, level: 3}, spozniony: {count: 5, level: 2}, interval: 95 },
    { krytyk: {count: 3, level: 3}, spozniony: {count: 6, level: 3}, interval: 90 },
    { krytyk: {count: 4, level: 3}, spozniony: {count: 5, level: 3}, interval: 85 },
    { krytyk: {count: 5, level: 3}, spozniony: {count: 5, level: 3}, interval: 80, boss: {type: 'spozniony', level: 2, hpMultiplier: 2.0} }
];