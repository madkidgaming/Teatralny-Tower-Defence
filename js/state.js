// js/state.js
export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
    zadowolenieUpgradeLevel: 0,
    currentWaveNumber: 0,
    gameOver: false, // Oznacza przegraną na danym poziomie, lub ukończenie całego aktu
    waveInProgress: false,
    showingWaveIntro: false,
    waveIntroTimer: 0,
    waveIntroEnemies: [],
    currentLevelIndex: 0,
    unlockedLevels: 1,
    levelProgress: {}, // np. { 0: 5 } oznacza, że poziom 0 jest ukończony do fali 5 włącznie
    
    isPaused: false,
    gameScreen: 'menu', // 'menu', 'playing', 'paused', 'levelComplete', 'levelLost'

    enemies: [],
    towers: [],
    projectiles: [],

    currentPath: [],
    currentTowerSpots: [],

    currentWaveSpawns: [],
    currentWaveSpawnsLeft: 0,
    spawnInterval: 0,
    spawnTimer: 0,

    selectedTowerType: null,
    selectedTowerForUpgrade: null,

    currentMessage: "", // Dla komunikatów wyświetlanych w panelu HTML
    messageTimer: 0,    // Timer dla tych komunikatów (jeśli chcemy auto-ukrywanie)

    // uiRegions na canvasie nie są już potrzebne, bo UI jest w HTML
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