// js/config.js

export const TILE_SIZE = 40;
export const ROWS = 12;
export const COLS = 20;

export const UI_FONT_LARGE = "bold 16px Arial";
export const UI_FONT_MEDIUM = "bold 13px Arial";
export const UI_FONT_SMALL = "12px Arial";
export const UI_FONT_TINY = `bold 10px Arial`;

export const WAVES_PER_LEVEL = 5; // Zmieniono z 10 na 5 fal na poziom
export const MAX_ZADOWOLENIE_UPGRADE_LEVEL = 5;
export const MAX_UPGRADE_LEVEL = 3;

export const ENEMY_BASE_SIZE_MULTIPLIER = 1.4;
export const TOWER_RENDER_SIZE_MULTIPLIER = 1.6;
export const PROJECTILE_SIZE_MULTIPLIER = 1.2;
export const BASE_SIZE_MULTIPLIER = 2.2;
export const EFFECT_SIZE_MULTIPLIER = 1.0;

export const imageSources = {
    teatrBase: 'https://kaliskie.org/wp-content/uploads/2025/05/TEATR.png',
    laserProjectile: 'https://kaliskie.org/wp-content/uploads/2025/05/LASER-PROJECTILE.png',
    biletProjectile: 'https://kaliskie.org/wp-content/uploads/2025/05/BILET-PROJECTILE.png',
    bileterTowerIcon: 'https://kaliskie.org/wp-content/uploads/2025/05/BILETER.png',
    spoznionyWidz: 'https://kaliskie.org/wp-content/uploads/2025/05/SPOZNIONY-WIDZ.png',
    krytykTeatralny: 'https://kaliskie.org/wp-content/uploads/2025/05/KRYTYK_TEATRALNY.png',
    reflektorTowerIcon: 'https://kaliskie.org/wp-content/uploads/2025/05/reflektor.png',
    tileset: 'assets/images/TILESET TOWER DEFENCE.png',

    garderobianaTowerIcon: 'assets/images/GARDEROBIANA.png',
    garderobianaProjectileEffect: 'assets/images/GARDEROBIANA_PROJECTILE.png',
    budkaInspicjentaTowerIcon: 'assets/images/BUDKA_INSPICJENTA.png',
    budkaInspicjentaProjectile: 'assets/images/BUDKA_INSPICJENTA_PROJECTILE.png',
    divaEnemy: 'assets/images/DIVA.png',
    technicznyEnemy: 'assets/images/TECHNICZNY.png',
    sabotageEffectIcon: 'assets/images/ZEPSUTA.png'
};

export const baseEnemyStats = {
    krytyk: {
        name: "Krytyk Teatralny", baseHp: 100, speed: 1, aplauzReward: 12, // Zmieniono z 10
        imageKey: 'krytykTeatralny',
        width: TILE_SIZE * 0.7 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 0.9 * ENEMY_BASE_SIZE_MULTIPLIER
    },
    spozniony: {
        name: "Spóźniony Widz", baseHp: 40, speed: 2.5, aplauzReward: 6, // Zmieniono z 5
        imageKey: 'spoznionyWidz',
        width: TILE_SIZE * 0.6 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 0.8 * ENEMY_BASE_SIZE_MULTIPLIER
    },
    diva: {
        name: "Primadonna", baseHp: 280, speed: 0.8, aplauzReward: 30, // Zmieniono z 25, HP z 300
        imageKey: 'divaEnemy',
        width: TILE_SIZE * 0.8 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 1.1 * ENEMY_BASE_SIZE_MULTIPLIER,
        damageReduction: 0.20, // Zmieniono z 0.25
        furyThreshold: 0.5, furySpeedMultiplier: 1.8, furyDamageReduction: 0.35, furyDuration: 300 // Zmieniono furyDamageReduction
    },
    techniczny: {
        name: "Techniczny Sabotażysta", baseHp: 80, speed: 2.0, aplauzReward: 15, // Zmieniono z 12
        imageKey: 'technicznyEnemy',
        width: TILE_SIZE * 0.65 * ENEMY_BASE_SIZE_MULTIPLIER, height: TILE_SIZE * 0.95 * ENEMY_BASE_SIZE_MULTIPLIER,
        sabotageChance: 0.25, // Zmieniono z 0.3
        sabotageDuration: 180, // 3 sekundy
        sabotageCooldown: 420 // Zmieniono z 300 (7 sekund)
    }
};

export const zadowolenieUpgrades = [
    { cost: 100, bonus: 25 }, { cost: 150, bonus: 30 }, { cost: 220, bonus: 35 },
    { cost: 300, bonus: 40 }, { cost: 400, bonus: 50 }
];

export const towerDefinitions = {
    bileter: {
        name: "Bileter", cost: 50, baseDamage: 22, baseFireRate: 65, range: TILE_SIZE * 2.8, // Zwiększono bazowe obrażenia i szybkostrzelność
        projectileType: 'bilet', imageKey: 'bileterTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER,
        upgrades: {
            damage: [ { cost: 25, value: 6 }, { cost: 50, value: 8 }, { cost: 85, value: 10 } ], // Dostosowano koszty/wartości ulepszeń
            fireRate: [ { cost: 30, value: -5 }, { cost: 55, value: -7 }, { cost: 90, value: -8 } ]
        },
        upgradeLevelNames: ['damage', 'fireRate']
    },
    oswietleniowiec: {
        name: "Oświetleniowiec", cost: 70, baseDamage: 35, baseFireRate: 100, range: TILE_SIZE * 3.8, // Zmieniono koszt z 75
        projectileType: 'laser', imageKey: 'reflektorTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER,
        upgrades: {
            damage: [ { cost: 40, value: 10 }, { cost: 70, value: 15 }, { cost: 110, value: 20 } ],
            fireRate: [ { cost: 45, value: -8 }, { cost: 75, value: -10 }, { cost: 120, value: -12 } ]
        },
        upgradeLevelNames: ['damage', 'fireRate']
    },
    garderobiana: {
        name: "Garderobiana", cost: 65, baseFireRate: 210, range: TILE_SIZE * 2.2,
        projectileType: 'puderDebuff', imageKey: 'garderobianaTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER,
        debuffStats: { slowFactor: 0.70, damageTakenMultiplier: 1.15, duration: 180 }, // Zmieniono slowFactor i damageTakenMultiplier
        upgrades: {
            range: [ { cost: 40, value: TILE_SIZE * 0.3 }, { cost: 60, value: TILE_SIZE * 0.4 }, { cost: 80, value: TILE_SIZE * 0.5 } ],
            effectStrength: [ { cost: 50, slowFactorReduction: 0.05, damageTakenIncrease: 0.05 }, { cost: 75, slowFactorReduction: 0.05, damageTakenIncrease: 0.05 }, { cost: 100, slowFactorReduction: 0.05, damageTakenIncrease: 0.05 } ],
            effectDuration: [ { cost: 45, value: 60 }, { cost: 70, value: 60 }, { cost: 95, value: 60 } ]
        },
        upgradeLevelNames: ['range', 'effectStrength', 'effectDuration']
    },
    budkaInspicjenta: {
        name: "Budka Inspicjenta", cost: 100, baseDamage: 60, baseFireRate: 170, range: TILE_SIZE * 5.0, // Zmniejszono koszt i obrażenia, zwiększono szybkostrzelność
        projectileType: 'recenzja', imageKey: 'budkaInspicjentaTowerIcon', renderSize: TILE_SIZE * TOWER_RENDER_SIZE_MULTIPLIER * 0.9,
        critChance: 0.15, critMultiplier: 1.75,
        targetPriority: 'strongest',
        upgrades: {
            damage: [ { cost: 65, value: 25 }, { cost: 100, value: 35 }, { cost: 150, value: 45 } ],
            fireRate: [ { cost: 70, value: -25 }, { cost: 120, value: -30 }, { cost: 180, value: -30 } ],
            critChance: [ { cost: 80, value: 0.05 }, { cost: 130, value: 0.05 }, { cost: 190, value: 0.05 } ]
        },
        upgradeLevelNames: ['damage', 'fireRate', 'critChance']
    }
};

export const projectileTypes = {
    bilet: { speed: 6, imageKey: 'biletProjectile', width: TILE_SIZE*0.4 * PROJECTILE_SIZE_MULTIPLIER, height: TILE_SIZE*0.2 * PROJECTILE_SIZE_MULTIPLIER },
    laser: { speed: 10, imageKey: 'laserProjectile', width: TILE_SIZE*0.5 * PROJECTILE_SIZE_MULTIPLIER, height: TILE_SIZE*0.15 * PROJECTILE_SIZE_MULTIPLIER },
    puderDebuff: {
        imageKey: 'garderobianaProjectileEffect',
        width: TILE_SIZE * 2.0 * EFFECT_SIZE_MULTIPLIER,
        height: TILE_SIZE * 2.0 * EFFECT_SIZE_MULTIPLIER,
        duration: 90
    },
    recenzja: {
        speed: 9, imageKey: 'budkaInspicjentaProjectile',
        width: TILE_SIZE*0.3 * PROJECTILE_SIZE_MULTIPLIER, height: TILE_SIZE*0.3 * PROJECTILE_SIZE_MULTIPLIER
    }
};

export const levelData = [
    { name: "Premiera w Foyer", path: [ { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },{ x: 12, y: 5 },{ x: 12, y: 4 },{ x: 12, y: 3 },{ x: 13, y: 3 },{ x: 14, y: 3 },{ x: 15, y: 3 },{ x: 16, y: 3 },{ x: 17, y: 3 },{ x: 18, y: 3 },{ x: 19, y: 3 } ], towerSpots: [ { x: 2, y: 3 }, { x: 4, y: 1 }, { x: 5, y: 3 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 7 }, { x: 13, y: 2 }, { x: 15, y: 4 }  ]},
    { name: "Chaos w Kulisach", path: [ { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 }, { x: 16, y: 6 }, { x: 16, y: 5 }, { x: 16, y: 4 }, { x: 16, y: 3 }, { x: 16, y: 2 }, { x: 17, y: 2 }, { x: 18, y: 2 }, { x: 19, y: 2 } ], towerSpots: [ { x: 1, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 6 }, { x: 5, y: 6 }, { x: 8, y: 6 }, { x: 11, y:6 }, { x: 14, y: 6 }, { x: 15, y: 3 }, { x: 17, y: 1 } ]},
    { name: "Szturm na Scenę", path: [ { x: 9, y: 0 }, { x: 9, y: 1 }, { x: 8, y: 1 }, { x: 7, y: 1 }, { x: 6, y: 1 }, { x: 5, y: 1 }, { x: 4, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 5 }, { x: 15, y: 4 }, { x: 16, y: 4 }, { x: 17, y: 4 }, { x: 18, y: 4 }, { x: 19, y: 4 } ], towerSpots: [ { x: 8, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 2 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 7, y: 5 }, { x: 10, y: 5 }, { x: 13, y: 5 }, { x: 16, y: 5 } ]},
    { name: "Oblężenie Garderoby", path: [ { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }, { x: 16, y: 1 }, { x: 17, y: 1 }, { x: 18, y: 1 }, { x: 19, y: 1 } ], towerSpots: [ { x: 2, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 3 }, { x: 7, y: 0 }, { x: 9, y: 2 }, { x: 12, y: 2 }, { x: 15, y: 2 }, { x: 18, y: 2 } ]},
    { name: "Wielki Finał", path: [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 1, y: 5 }, { x: 1, y: 6 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 } ], towerSpots: [ { x: 3, y: 1 }, { x: 0, y: 3 }, { x: 0, y: 6 }, { x: 3, y: 6 }, { x: 6, y: 6 }, { x: 9, y: 6 }, { x: 12, y: 6 }, { x: 16, y: 7 }, { x: 17, y: 5 }, { x: 5, y:1} ]}
].map(level => ({ ...level, towerSpots: level.towerSpots.map(spot => ({...spot, occupied: false})) }));


export const waveDefinitionsBase = [
    // Fala 1: Wprowadzenie Spóźnionego Widza i Krytyka
    { spozniony: {count: 10, level: 1}, krytyk: {count: 4, level: 1}, interval: 95 },
    // Fala 2: Więcej podstawowych, niektórzy Lvl 2
    { spozniony: {count: 12, level: 1}, krytyk: {count: 6, level: 2}, interval: 90 },
    // Fala 3: Wprowadzenie Technicznego Sabotażysty, więcej Krytyków Lvl 2
    { spozniony: {count: 10, level: 2}, krytyk: {count: 8, level: 2}, techniczny: {count: 1, level: 1}, interval: 85 },
    // Fala 4: Wprowadzenie Primadonny, więcej Technicznych
    { spozniony: {count: 12, level: 2}, krytyk: {count: 5, level: 2}, techniczny: {count: 2, level: 1}, diva: {count: 1, level: 1}, interval: 80 },
    // Fala 5 (BOSS): Więcej wrogów poziomu 2/3, Boss: Primadonna
    { spozniony: {count: 10, level: 3}, krytyk: {count: 8, level: 3}, techniczny: {count: 2, level: 2}, diva: {count: 1, level: 2}, interval: 75, boss: {type: 'diva', level: 2, hpMultiplier: 2.8} } // Zwiększono mnożnik HP Bossa
];

export const TILESET_TILE_SIZE_PX = 16;
export const tileTypes = {
    GRASS_BASIC:        { sx: 0 * TILESET_TILE_SIZE_PX, sy: 0 * TILESET_TILE_SIZE_PX },
    GRASS_FLOWER_YELLOW:{ sx: 1 * TILESET_TILE_SIZE_PX, sy: 0 * TILESET_TILE_SIZE_PX },
    GRASS_FLOWER_WHITE: { sx: 2 * TILESET_TILE_SIZE_PX, sy: 0 * TILESET_TILE_SIZE_PX },
    GRASS_BLADES_1:     { sx: 3 * TILESET_TILE_SIZE_PX, sy: 0 * TILESET_TILE_SIZE_PX },
    GRASS_BLADES_2:     { sx: 4 * TILESET_TILE_SIZE_PX, sy: 0 * TILESET_TILE_SIZE_PX },
    PATH_1:             { sx: 0 * TILESET_TILE_SIZE_PX, sy: 1 * TILESET_TILE_SIZE_PX },
    PATH_2:             { sx: 1 * TILESET_TILE_SIZE_PX, sy: 1 * TILESET_TILE_SIZE_PX },
    PATH_3:             { sx: 2 * TILESET_TILE_SIZE_PX, sy: 1 * TILESET_TILE_SIZE_PX },
    PATH_4:             { sx: 3 * TILESET_TILE_SIZE_PX, sy: 1 * TILESET_TILE_SIZE_PX },
    PATH_5:             { sx: 4 * TILESET_TILE_SIZE_PX, sy: 1 * TILESET_TILE_SIZE_PX },
};
export const grassVariants = [
    tileTypes.GRASS_BASIC,
    tileTypes.GRASS_FLOWER_YELLOW,
    tileTypes.GRASS_FLOWER_WHITE,
    tileTypes.GRASS_BLADES_1,
    tileTypes.GRASS_BLADES_2,
];
export const pathVariants = [
    tileTypes.PATH_1,
    tileTypes.PATH_2,
    tileTypes.PATH_3,
    tileTypes.PATH_4,
    tileTypes.PATH_5,
];
