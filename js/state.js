// js/state.js
export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
    initialMaxAudienceSatisfaction: 100,
    zadowolenieUpgradeLevel: 0,
    currentWaveNumber: 0, 
    gameOver: false, 
    waveInProgress: false,
    showingWaveIntro: false,
    waveIntroTimer: 0,
    waveIntroEnemies: [],
    currentLevelIndex: 0,
    unlockedLevels: 1,
    levelProgress: {}, 
    
    isPaused: false,
    gameScreen: 'menu', 
    showingLevelCompleteSummary: false,
    levelCompleteButtons: [], 

    enemies: [], // Obiekty wrogów mogą teraz mieć: .isSlowed, .slowTimer, .damageTakenMultiplier, .furyActive, .furyTimer, .currentDamageReduction
    towers: [],  // Obiekty wież mogą teraz mieć: .isSabotaged, .sabotageTimer, .sabotageEffectImage (dla rysowania), .special1Level, .special2Level, .special3Level
    projectiles: [],
    effects: [], 

    currentPath: [],
    currentTowerSpots: [],
    currentBackgroundTileMap: [], 

    currentWaveSpawns: [],
    currentWaveSpawnsLeft: 0,
    spawnInterval: 0,
    spawnTimer: 0,

    selectedTowerType: null,
    selectedTowerForUpgrade: null,

    autoStartNextWaveEnabled: true, 
    isDevModeActive: false,

    lastLevelStats: {
        completed: false,
        levelName: "",
        stars: 0,
        starStates: [
            { scale: 0, opacity: 0, isFilled: false, fillProgress: 0, character: '☆', color: '#777777' },
            { scale: 0, opacity: 0, isFilled: false, fillProgress: 0, character: '☆', color: '#777777' },
            { scale: 0, opacity: 0, isFilled: false, fillProgress: 0, character: '☆', color: '#777777' } 
        ],
        isStarAnimationComplete: false,
        finalSatisfaction: 0,
        initialMaxSatisfaction: 0,
        towersBuilt: { 
            bileter: 0, 
            oswietleniowiec: 0, 
            garderobiana: 0, 
            budkaInspicjenta: 0 
        },
        totalTowerValue: 0,
        remainingAplauz: 0,
        aplauzBonusForNextLevel: 0,
    },
    currentAplauzBonusForNextLevel: 0, 

    currentMessage: "", 
    messageTimer: 0,    
};

export const images = {};
export let imagesLoadedCount = 0;
export let totalImagesToLoad = 0;

export function incrementImagesLoadedCount() {
    imagesLoadedCount++;
}
export function setTotalImagesToLoad(count) {
    totalImagesToLoad = count;
}