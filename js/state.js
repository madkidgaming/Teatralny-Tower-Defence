// js/state.js
export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
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

    enemies: [],
    towers: [],
    projectiles: [],
    effects: [], // Dodano tablicę na efekty

    currentPath: [],
    currentTowerSpots: [],

    currentWaveSpawns: [],
    currentWaveSpawnsLeft: 0,
    spawnInterval: 0,
    spawnTimer: 0,

    selectedTowerType: null,
    selectedTowerForUpgrade: null,

    autoStartNextWaveEnabled: true, // ZMIANA: Nowa flaga dla automatycznego startu fali

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