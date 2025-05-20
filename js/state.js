export const gameState = {
    aplauz: 250,
    zadowolenieWidowni: 100,
    maxZadowolenieWidowni: 100,
    zadowolenieUpgradeLevel: 0, // Rozważmy, czy to ma być globalne czy resetowane per poziom
    currentWaveNumber: 0,
    gameOver: false,
    waveInProgress: false,
    showingWaveIntro: false,
    waveIntroTimer: 0,
    waveIntroEnemies: [],
    currentLevelIndex: 0,
    unlockedLevels: 1,    // Ile poziomów jest odblokowanych
    levelProgress: {},    // Obiekt do przechowywania postępu fal dla każdego poziomu, np. { 0: 5, 1: 2 }
    
    isPaused: false,
    gameScreen: 'menu', // 'menu', 'playing', 'paused', 'levelComplete'

    enemies: [],
    towers: [],
    projectiles: [],

    currentPath: [],
    currentTowerSpots: [],

    currentWaveSpawns: [],
    currentWaveSpawnsLeft: 0,
    spawnInterval: 0,
    spawnTimer: 0,

    currentMessage: "",
    messageTimer: 0,

    uiRegions: {
        towerButtonBileter: null,
        towerButtonOswietleniowiec: null,
        startWaveButton: null,
        upgradeZadowolenieButton: null,
    },
    upgradeDamageButtonRegion: null,
    upgradeFireRateButtonRegion: null
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