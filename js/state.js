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
    selectedTowerType: null,
    selectedTowerForUpgrade: null,
    currentMessage: "",
    messageTimer: 0,

    enemies: [],
    towers: [],
    projectiles: [],

    currentPath: [],
    currentTowerSpots: [], // Miejsca na wieże dla bieżącego poziomu

    currentWaveSpawns: [], // Kolejka przeciwników do zespawnowania w bieżącej fali
    currentWaveSpawnsLeft: 0,
    spawnInterval: 0,
    spawnTimer: 0,

    // Te regiony zostaną zaktualizowane w main.js po ustawieniu wymiarów canvasa
    uiRegions: {
        towerButtonBileter: null,
        towerButtonOswietleniowiec: null,
        startWaveButton: null,
        upgradeZadowolenieButton: null,
        fullscreenButton: null
    },
    upgradeDamageButtonRegion: null,
    upgradeFireRateButtonRegion: null
};

export const images = {}; // Obiekt na załadowane obrazki
export let imagesLoadedCount = 0;
export let totalImagesToLoad = 0;

// Funkcje do modyfikacji stanu, jeśli preferujesz taki sposób zamiast gameState.nazwa = ...
export function incrementImagesLoadedCount() {
    imagesLoadedCount++;
}
export function setTotalImagesToLoad(count) {
    totalImagesToLoad = count;
}