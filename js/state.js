// js/state.js
export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
    initialMaxAudienceSatisfaction: 100, // ZMIANA: Do śledzenia początkowego max zadowolenia na poziomie
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
    gameScreen: 'menu', // Możliwe stany: 'menu', 'levelSelection', 'credits', 'playing', 'paused', 'levelCompleteScreen', 'levelLost'

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

    // ZMIANA: Dane dla ekranu podsumowania aktu
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
    currentAplauzBonusForNextLevel: 0, // Bonus przekazywany do następnego poziomu

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