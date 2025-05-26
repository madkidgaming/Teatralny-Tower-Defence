// js/state.js
export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
    initialMaxAudienceSatisfaction: 100,
    zadowolenieUpgradeLevel: 0,
    currentWaveNumber: 0, // Oznacza, która fala jest *następna* do rozegrania lub *aktualnie* trwa (0 dla pierwszej fali, która będzie falą 1 dla gracza)
    gameOver: false, 
    waveInProgress: false,
    showingWaveIntro: false,
    waveIntroTimer: 0,
    waveIntroEnemies: [],
    currentLevelIndex: 0,
    unlockedLevels: 1,
    levelProgress: {}, // Klucz to index poziomu, wartość to numer *ostatniej ukończonej* fali (0-9) lub -1 (nierozpoczęty) lub C.WAVES_PER_LEVEL (ukończony)
    
    isPaused: false,
    gameScreen: 'menu', // Możliwe stany: 'menu', 'levelSelection', 'credits', 'playing', 'paused', 'levelCompleteCanvas', 'levelLost', 'levelCompleteScreen' (HTML)
    showingLevelCompleteSummary: false,
    levelCompleteButtons: [], // Przechowuje definicje przycisków dla ekranu podsumowania na canvasie

    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],

    currentPath: [],
    currentTowerSpots: [],

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
        finalSatisfaction: 0,
        initialMaxSatisfaction: 0,
        towersBuilt: { bileter: 0, oswietleniowiec: 0 },
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