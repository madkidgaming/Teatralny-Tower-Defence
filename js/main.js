// js/main.js
import * as C from './config.js';
import { gameState as state, images, incrementImagesLoadedCount, imagesLoadedCount, totalImagesToLoad, setTotalImagesToLoad } from './state.js';
import * as Storage from './storage.js';
import * as Utils from './utils.js';
import * as Drawing from './drawing.js';
import * as GameLogic from './gameLogic.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const pageTitle = document.getElementById('pageTitle');
const gameLayout = document.getElementById('gameLayout');
const mainMenuScreen = document.getElementById('mainMenu');
const levelSelectionContainer = document.getElementById('levelSelection');
const pauseMenuScreen = document.getElementById('pauseMenu');
// const gameCanvasContainer = document.getElementById('gameCanvasContainer'); // nieużywane bezpośrednio

const uiCurrentAct = document.getElementById('uiCurrentAct');
const uiCurrentWave = document.getElementById('uiCurrentWave');
const uiAplauz = document.getElementById('uiAplauz');
const uiAudienceSatisfaction = document.getElementById('uiAudienceSatisfaction');
const uiButtonBileter = document.getElementById('uiButtonBileter');
const uiButtonOswietleniowiec = document.getElementById('uiButtonOswietleniowiec');
const uiButtonUpgradeSatisfaction = document.getElementById('uiButtonUpgradeSatisfaction');
const uiButtonStartWave = document.getElementById('uiButtonStartWave');
const towerUpgradePanel = document.getElementById('towerUpgradePanel');
const upgradePanelTowerName = document.getElementById('upgradePanelTowerName');
const uiButtonUpgradeDamage = document.getElementById('uiButtonUpgradeDamage');
const uiButtonUpgradeFireRate = document.getElementById('uiButtonUpgradeFireRate');
const uiButtonSellTower = document.getElementById('uiButtonSellTower');
const uiMessages = document.getElementById('uiMessages');

const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const returnToMenuButtonGame = document.getElementById('returnToMenuButtonGame');
const menuFromPauseButton = document.getElementById('menuFromPauseButton');

// GameLogic.setCurrentActHeaderRef(...); // Już niepotrzebne

function updateUiStats() {
    if (!C.levelData[state.currentLevelIndex]) return; // Zabezpieczenie jeśli dane poziomu nie są załadowane
    uiCurrentAct.textContent = state.currentLevelIndex + 1;
    uiCurrentWave.textContent = `${state.currentWaveNumber > 0 ? state.currentWaveNumber : (state.levelProgress[state.currentLevelIndex] === -1 || state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === 0 ? '-' : '0')}/${C.WAVES_PER_LEVEL}`;
    uiAplauz.textContent = state.aplauz;
    uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;

    uiButtonBileter.querySelector('.cost').textContent = C.towerDefinitions.bileter.cost;
    uiButtonOswietleniowiec.querySelector('.cost').textContent = C.towerDefinitions.oswietleniowiec.cost;
    
    if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
        uiButtonUpgradeSatisfaction.querySelector('.cost').textContent = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel].cost;
        uiButtonUpgradeSatisfaction.classList.remove('disabled');
    } else {
        uiButtonUpgradeSatisfaction.querySelector('.cost').textContent = "MAX";
        uiButtonUpgradeSatisfaction.classList.add('disabled');
    }

    const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL;
    if (isStartWaveDisabled) uiButtonStartWave.classList.add('disabled');
    else uiButtonStartWave.classList.remove('disabled');
}

function showUiMessage(message) {
    if(message && message.trim() !== "") {
        uiMessages.textContent = message;
        uiMessages.style.opacity = '1';
        // Jeśli chcemy auto-ukrywanie, można dodać setTimeout
        // if (state.messageTimer > 0) {
        //     setTimeout(() => {
        //         if (uiMessages.textContent === message) { // Ukryj tylko jeśli to ta sama wiadomość
        //            uiMessages.style.opacity = '0';
        //            setTimeout(() => { if(uiMessages.style.opacity === '0') uiMessages.textContent = ""; }, 300);
        //         }
        //     }, state.messageTimer * (1000/60)); // Konwersja klatek na ms
        // }
    } else {
        uiMessages.textContent = "";
        uiMessages.style.opacity = '0';
    }
}


function updateTowerUpgradePanel() {
    if (state.selectedTowerForUpgrade) {
        towerUpgradePanel.classList.remove('hidden');
        const tower = state.selectedTowerForUpgrade;
        const towerDef = C.towerDefinitions[tower.type];
        upgradePanelTowerName.textContent = tower.type === 'bileter' ? 'Bileter' : 'Oświetleniowiec';

        if (tower.damageLevel < C.MAX_UPGRADE_LEVEL) {
            uiButtonUpgradeDamage.querySelector('.cost').textContent = towerDef.upgrades.damage[tower.damageLevel].cost;
            uiButtonUpgradeDamage.classList.remove('disabled');
        } else {
            uiButtonUpgradeDamage.querySelector('.cost').textContent = "MAX";
            uiButtonUpgradeDamage.classList.add('disabled');
        }
        if (tower.fireRateLevel < C.MAX_UPGRADE_LEVEL) {
            uiButtonUpgradeFireRate.querySelector('.cost').textContent = towerDef.upgrades.fireRate[tower.fireRateLevel].cost;
            uiButtonUpgradeFireRate.classList.remove('disabled');
        } else {
            uiButtonUpgradeFireRate.querySelector('.cost').textContent = "MAX";
            uiButtonUpgradeFireRate.classList.add('disabled');
        }
        let sellValue = Math.floor(towerDef.cost * 0.75);
        for(let i=0; i < tower.damageLevel; i++) sellValue += Math.floor(towerDef.upgrades.damage[i].cost * 0.5);
        for(let i=0; i < tower.fireRateLevel; i++) sellValue += Math.floor(towerDef.upgrades.fireRate[i].cost * 0.5);
        uiButtonSellTower.querySelector('.value').textContent = sellValue;
    } else {
        towerUpgradePanel.classList.add('hidden');
    }
}

function showScreen(screenName) {
    mainMenuScreen.classList.add('hidden');
    gameLayout.classList.add('hidden');
    pauseMenuScreen.classList.add('hidden');
    mainMenuScreen.classList.remove('visible'); // Upewnij się, że visible jest usuwane
    gameLayout.classList.remove('visible');
    pauseMenuScreen.classList.remove('visible');


    if (screenName === 'menu') {
        mainMenuScreen.classList.remove('hidden');
        mainMenuScreen.classList.add('visible');
        pageTitle.textContent = "Teatr Tower Defense";
        renderLevelSelection();
    } else if (screenName === 'playing') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        if (C.levelData[state.currentLevelIndex]) { // Zabezpieczenie
             pageTitle.textContent = `Teatr Tower Defense - Akt ${state.currentLevelIndex + 1}`;
        }
        returnToMenuButtonGame.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        updateUiStats();
        updateTowerUpgradePanel();
    } else if (screenName === 'paused') {
        gameLayout.classList.remove('hidden'); // Gra widoczna
        gameLayout.classList.add('visible');
        pauseMenuScreen.classList.remove('hidden');
        pauseMenuScreen.classList.add('visible');
    } else if (screenName === 'levelComplete' || screenName === 'levelLost') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        returnToMenuButtonGame.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        updateUiStats();
    }
    state.gameScreen = screenName;
}

function renderLevelSelection() { /* ... bez zmian ... */ }

function startGameLevel(levelIndex, startFromWave = 0) {
    GameLogic.setupLevel(levelIndex, startFromWave);
    showScreen('playing');
    if (animationFrameId === null) {
        gameLoop();
    }
}

function preloadImagesAndStart() { /* ... bez zmian ... */ }
function initGame() {
    canvas.width = C.COLS * C.TILE_SIZE;
    canvas.height = C.ROWS * C.TILE_SIZE;
    showScreen('menu');
}

let animationFrameId = null;

function gameLoop() {
    if (state.gameScreen === 'menu') {
        animationFrameId = null;
        return;
    }
    
    if (state.isPaused && state.gameScreen === 'paused') {
        Drawing.drawBackgroundAndPath(ctx); // Rysuj statyczne tło
        Drawing.drawTheaterBase(ctx);
        Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx); // dla np. zasięgu
        Drawing.drawWaveIntro(ctx);
        showUiMessage(state.currentMessage || "Pauza");
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTheaterBase(ctx);
        Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx);
        showUiMessage(state.currentMessage);
        updateUiStats();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    if (state.gameScreen === 'playing' && !state.isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTheaterBase(ctx);
        Drawing.drawTowerSpots(ctx);

        GameLogic.updateEnemies();
        GameLogic.updateTowers();
        GameLogic.updateProjectiles();

        if (!state.showingWaveIntro) {
            GameLogic.handleWaveSpawning();
        } else {
            if (state.waveIntroTimer <= 0 && !state.isPaused) {
                GameLogic.startNextWaveActual();
            }
        }
        
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx);
        Drawing.drawWaveIntro(ctx);

        updateUiStats();
        updateTowerUpgradePanel();
        if (state.messageTimer > 0 && state.currentMessage) {
            showUiMessage(state.currentMessage);
            // Utils.showMessage aktualizuje timer, więc nie musimy tu
        } else if (!state.currentMessage || state.messageTimer <= 0) {
            showUiMessage(""); // Wyczyść, jeśli nie ma aktywnej wiadomości
        }
    }

    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        showScreen(state.gameScreen); // To zaktualizuje przyciski np. "Menu Główne"
    }
    
    if (state.gameScreen !== 'menu') {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        animationFrameId = null;
    }
}

// Event Listeners
uiButtonBileter.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) state.selectedTowerType = 'bileter';
});
uiButtonOswietleniowiec.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) state.selectedTowerType = 'oswietleniowiec';
});
uiButtonUpgradeSatisfaction.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
        GameLogic.upgradeZadowolenie();
        updateUiStats();
    }
});
uiButtonStartWave.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) {
        GameLogic.prepareNextWave();
        updateUiStats();
    }
});
uiButtonUpgradeDamage.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage');
        updateTowerUpgradePanel();
        updateUiStats();
    }
});
uiButtonUpgradeFireRate.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate');
        updateTowerUpgradePanel();
        updateUiStats();
    }
});
uiButtonSellTower.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.sellTower(state.selectedTowerForUpgrade);
        state.selectedTowerForUpgrade = null;
        updateTowerUpgradePanel();
        updateUiStats();
    }
});

pauseButton.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.togglePauseGame();
        showScreen('paused');
    }
});
resumeButton.addEventListener('click', () => {
    if (state.isPaused) {
        GameLogic.togglePauseGame();
        showScreen('playing');
        if (!animationFrameId) gameLoop();
    }
});
function goToMainMenu() {
    state.isPaused = false;
    state.gameOver = false;
    showScreen('menu');
}
returnToMenuButtonGame.addEventListener('click', goToMainMenu);
menuFromPauseButton.addEventListener('click', goToMainMenu);

canvas.addEventListener('click', (event) => { /* ... bez zmian z poprzedniej wersji main.js ... */ });
canvas.addEventListener('mousemove', (event) => { /* ... bez zmian z poprzedniej wersji main.js ... */ });

preloadImagesAndStart();