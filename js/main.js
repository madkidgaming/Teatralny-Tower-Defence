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
const newGameButton = document.getElementById('newGameButton'); // ZMIANA: Dodano odniesienie do przycisku
const pauseMenuScreen = document.getElementById('pauseMenu');

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

function updateUiStats() {
    if (!C.levelData[state.currentLevelIndex] && state.gameScreen !== 'menu') {
        return;
    }
    if (state.gameScreen !== 'menu') {
        uiCurrentAct.textContent = state.currentLevelIndex + 1;
        let waveDisplay;
        if (state.currentWaveNumber > 0) {
            waveDisplay = state.currentWaveNumber;
        } else {
            const progress = state.levelProgress[state.currentLevelIndex];
            if (progress === undefined || progress === -1) {
                waveDisplay = '-';
            } else {
                waveDisplay = '0'; // Pokazuje 0 jeśli postęp to 0 (przed pierwszą falą)
            }
        }
        uiCurrentWave.textContent = `${waveDisplay}/${C.WAVES_PER_LEVEL}`;
        uiAplauz.textContent = state.aplauz;
        uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;
    }

    // Aktualizacja kosztów na przyciskach zawsze, nawet w menu (np. po załadowaniu gry)
    if (C.towerDefinitions.bileter) {
        uiButtonBileter.querySelector('.cost').textContent = C.towerDefinitions.bileter.cost;
    }
    if (C.towerDefinitions.oswietleniowiec) {
        uiButtonOswietleniowiec.querySelector('.cost').textContent = C.towerDefinitions.oswietleniowiec.cost;
    }
    
    if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL && C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel]) {
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
    } else {
        if (uiMessages.textContent !== "") {
            uiMessages.style.opacity = '0';
            setTimeout(() => {
                if (uiMessages.style.opacity === '0') uiMessages.textContent = '';
            }, 300);
        }
    }
}

function updateTowerUpgradePanel() {
    if (state.selectedTowerForUpgrade && C.towerDefinitions[state.selectedTowerForUpgrade.type]) { // Dodatkowe sprawdzenie
        towerUpgradePanel.classList.remove('hidden');
        const tower = state.selectedTowerForUpgrade;
        const towerDef = C.towerDefinitions[tower.type];
        upgradePanelTowerName.textContent = tower.type === 'bileter' ? 'Bileter' : 'Oświetleniowiec';

        if (tower.damageLevel < C.MAX_UPGRADE_LEVEL && towerDef.upgrades.damage[tower.damageLevel]) {
            uiButtonUpgradeDamage.querySelector('.cost').textContent = towerDef.upgrades.damage[tower.damageLevel].cost;
            uiButtonUpgradeDamage.classList.remove('disabled');
        } else {
            uiButtonUpgradeDamage.querySelector('.cost').textContent = "MAX";
            uiButtonUpgradeDamage.classList.add('disabled');
        }
        if (tower.fireRateLevel < C.MAX_UPGRADE_LEVEL && towerDef.upgrades.fireRate[tower.fireRateLevel]) {
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

function updateSelectedTowerButtonUI() {
    uiButtonBileter.classList.remove('selected-for-build');
    uiButtonOswietleniowiec.classList.remove('selected-for-build');

    if (state.selectedTowerType === 'bileter') {
        uiButtonBileter.classList.add('selected-for-build');
    } else if (state.selectedTowerType === 'oswietleniowiec') {
        uiButtonOswietleniowiec.classList.add('selected-for-build');
    }
}

function showScreen(screenName) {
    mainMenuScreen.classList.add('hidden');
    mainMenuScreen.classList.remove('visible');
    gameLayout.classList.add('hidden');
    gameLayout.classList.remove('visible');
    pauseMenuScreen.classList.add('hidden');
    pauseMenuScreen.classList.remove('visible');

    if (screenName === 'menu') {
        mainMenuScreen.classList.remove('hidden');
        mainMenuScreen.classList.add('visible');
        pageTitle.textContent = "Teatr Tower Defense";
        renderLevelSelection();
        // ZMIANA: Uaktualnienie komunikatu o zapisie przy wyświetlaniu menu
        const saveStatusEl = document.getElementById('saveStatus');
        if (saveStatusEl) {
            // Tekst jest zarządzany głównie przez saveGameProgress i loadGameProgress,
            // ale tutaj możemy ustawić domyślny, jeśli nic innego go nie nadpisało.
            // Jeśli ostatni komunikat to był błąd lub info o nowej grze, nie nadpisujemy go od razu.
            if (!saveStatusEl.textContent.toLowerCase().includes("błąd") && 
                !saveStatusEl.textContent.toLowerCase().includes("nowa gra") &&
                !saveStatusEl.textContent.toLowerCase().includes("wyczyszczony")) {
                 saveStatusEl.textContent = "Postęp gry jest zapisywany automatycznie.";
            }
        }
    } else if (screenName === 'playing') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        if (C.levelData && C.levelData[state.currentLevelIndex]) { // Sprawdź, czy C.levelData istnieje
             pageTitle.textContent = `Teatr Tower Defense - Akt ${state.currentLevelIndex + 1}`;
        }
        returnToMenuButtonGame.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        updateUiStats();
        updateTowerUpgradePanel();
        updateSelectedTowerButtonUI();
    } else if (screenName === 'paused') {
        gameLayout.classList.remove('hidden');
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

function renderLevelSelection() {
    levelSelectionContainer.innerHTML = '';
    if (!C.levelData) { // Dodatkowe zabezpieczenie
        console.error("C.levelData is not defined in renderLevelSelection");
        return;
    }
    C.levelData.forEach((level, index) => {
        const button = document.createElement('button');
        button.classList.add('level-button');
        const isUnlocked = index < state.unlockedLevels;
        let progress = state.levelProgress[index] === undefined ? -1 : state.levelProgress[index];

        let progressText;
        if (progress >= C.WAVES_PER_LEVEL) {
            progressText = "(Ukończono ✔️)";
        } else if (progress >= 0) {
            progressText = `(Fale: ${progress}/${C.WAVES_PER_LEVEL})`;
        } else {
            progressText = "(Nierozpoczęty)";
        }

        button.innerHTML = `
            <span class="level-name">Akt ${index + 1}${level.name ? ': ' + level.name : ''}</span>
            <span class="level-progress">${isUnlocked ? progressText : '🔒 Zablokowany'}</span>
        `;

        if (isUnlocked) {
            button.addEventListener('click', () => {
                const startWave = (progress >= C.WAVES_PER_LEVEL || progress < 0) ? 0 : progress;
                startGameLevel(index, startWave);
            });
        } else {
            button.classList.add('locked');
        }
        levelSelectionContainer.appendChild(button);
    });
}

function startGameLevel(levelIndex, startFromWave = 0) {
    GameLogic.setupLevel(levelIndex, startFromWave);
    showScreen('playing');
    if (animationFrameId === null) {
        gameLoop();
    }
}

function preloadImagesAndStart() {
    Storage.loadGameProgress(state);
    setTotalImagesToLoad(Object.keys(C.imageSources).length);

    for (const key in C.imageSources) {
        images[key] = new Image();
        images[key].src = C.imageSources[key];
        images[key].onload = () => {
            incrementImagesLoadedCount();
            if (imagesLoadedCount === totalImagesToLoad) {
                initGame();
            }
        };
        images[key].onerror = (e) => {
            console.error(`Błąd ładowania obrazka: ${key} z ${C.imageSources[key]}`, e);
            images[key].error = true;
            incrementImagesLoadedCount();
            if (imagesLoadedCount === totalImagesToLoad) {
                initGame();
            }
        }
    }
}

function initGame() {
    canvas.width = C.COLS * C.TILE_SIZE;
    canvas.height = C.ROWS * C.TILE_SIZE;
    showScreen('menu');
}

let animationFrameId = null;

function gameLoop() {
    if (state.gameScreen === 'menu') {
        animationFrameId = null; return;
    }
    
    if (state.isPaused && state.gameScreen === 'paused') {
        Drawing.drawBackgroundAndPath(ctx); Drawing.drawTheaterBase(ctx); Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx); Drawing.drawTowers(ctx); Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx); Drawing.drawWaveIntro(ctx);
        showUiMessage(state.currentMessage || "Pauza");
        animationFrameId = requestAnimationFrame(gameLoop); return;
    }

    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        Drawing.drawBackgroundAndPath(ctx); Drawing.drawTheaterBase(ctx); Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx); Drawing.drawTowers(ctx); Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx);
        showUiMessage(state.currentMessage); updateUiStats();
        animationFrameId = requestAnimationFrame(gameLoop); return;
    }
    
    if (state.gameScreen === 'playing' && !state.isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Drawing.drawBackgroundAndPath(ctx); Drawing.drawTheaterBase(ctx); Drawing.drawTowerSpots(ctx);

        GameLogic.updateEnemies(); GameLogic.updateTowers(); GameLogic.updateProjectiles();

        if (!state.showingWaveIntro) { GameLogic.handleWaveSpawning(); } 
        else { if (state.waveIntroTimer <= 0 && !state.isPaused) GameLogic.startNextWaveActual(); }
        
        Drawing.drawEnemies(ctx); Drawing.drawTowers(ctx); Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx); Drawing.drawWaveIntro(ctx);

        updateUiStats(); updateTowerUpgradePanel();
        if (state.messageTimer > 0 && state.currentMessage) {
            showUiMessage(state.currentMessage);
            if (!state.isPaused && state.currentMessage !== "Pauza") state.messageTimer--;
        } else if (state.messageTimer <= 0 && uiMessages.textContent !== "") {
            if (!(state.currentMessage === "Pauza" && state.isPaused)) {
                showUiMessage(""); state.currentMessage = "";
            }
        }
    }

    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        showScreen(state.gameScreen);
    }
    
    if (state.gameScreen !== 'menu') animationFrameId = requestAnimationFrame(gameLoop);
    else animationFrameId = null;
}

uiButtonBileter.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) {
        state.selectedTowerType = 'bileter'; state.selectedTowerForUpgrade = null;
        updateTowerUpgradePanel(); updateSelectedTowerButtonUI();
    }
});
uiButtonOswietleniowiec.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) {
        state.selectedTowerType = 'oswietleniowiec'; state.selectedTowerForUpgrade = null;
        updateTowerUpgradePanel(); updateSelectedTowerButtonUI();
    }
});
uiButtonUpgradeSatisfaction.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
        GameLogic.upgradeZadowolenie(); updateUiStats();
    }
});
uiButtonStartWave.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) {
        GameLogic.prepareNextWave(); updateUiStats();
    }
});
uiButtonUpgradeDamage.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage');
        updateTowerUpgradePanel(); updateUiStats();
    }
});
uiButtonUpgradeFireRate.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate');
        updateTowerUpgradePanel(); updateUiStats();
    }
});
uiButtonSellTower.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.sellTower(state.selectedTowerForUpgrade);
        state.selectedTowerForUpgrade = null;
        updateTowerUpgradePanel(); updateUiStats();
    }
});

pauseButton.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.togglePauseGame(); showScreen('paused');
    }
});
resumeButton.addEventListener('click', () => {
    if (state.isPaused) {
        GameLogic.togglePauseGame(); showScreen('playing');
        if (!animationFrameId) gameLoop();
    }
});
function goToMainMenu() {
    state.isPaused = false; state.gameOver = false;
    state.selectedTowerType = null; state.selectedTowerForUpgrade = null;
    updateSelectedTowerButtonUI(); updateTowerUpgradePanel();
    showScreen('menu');
}
returnToMenuButtonGame.addEventListener('click', goToMainMenu);
menuFromPauseButton.addEventListener('click', goToMainMenu);

// ZMIANA: Dodano Event Listener dla przycisku Nowa Gra
newGameButton.addEventListener('click', () => {
    if (confirm("Czy na pewno chcesz rozpocząć nową grę? Cały dotychczasowy postęp zostanie utracony.")) {
        // Resetowanie stanu gry
        state.unlockedLevels = 1;
        state.levelProgress = {}; // Resetuje postęp dla wszystkich poziomów

        // Zapisanie zresetowanego stanu
        Storage.saveGameProgress(state); // Ta funkcja powinna też aktualizować saveStatusEl

        // Odświeżenie widoku wyboru poziomów, aby pokazać zresetowany stan
        renderLevelSelection();

        // Informacja dla gracza przez system komunikatów (jeśli chcemy na canvasie/globalnie)
        // Utils.showMessage(state, "Rozpoczęto nową grę. Wybierz Akt 1.", 180);
        // lub bezpośrednio w panelu HTML, jeśli jest widoczny
        // showUiMessage("Rozpoczęto nową grę. Wybierz Akt 1.");
        
        // Ustawienie komunikatu w menu głównym
        const saveStatusEl = document.getElementById('saveStatus');
        if (saveStatusEl) {
            saveStatusEl.textContent = "Nowa gra rozpoczęta. Postęp wyczyszczony.";
        }
        
        console.log("Nowa gra rozpoczęta. Stan zresetowany:", state.unlockedLevels, state.levelProgress);
    }
});

canvas.addEventListener('click', (event) => {
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;
    const gridX = Math.floor(clickX / C.TILE_SIZE); const gridY = Math.floor(clickY / C.TILE_SIZE);

    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >= 0) {
        const clickedTower = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (clickedTower) {
            state.selectedTowerForUpgrade = clickedTower; state.selectedTowerType = null;
            updateTowerUpgradePanel(); updateSelectedTowerButtonUI(); return;
        }
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) {
                if (spot.occupied) Utils.showMessage(state, "To miejsce jest już zajęte!", 120);
                else if (!GameLogic.buildTower(gridX, gridY, state.selectedTowerType)) { /* buildTower już pokazuje wiadomość */ }
            } else Utils.showMessage(state, "Tutaj nie można budować wieży.", 120);
            showUiMessage(state.currentMessage); return;
        }
        if (!clickedTower && !state.selectedTowerType) {
            state.selectedTowerForUpgrade = null; updateTowerUpgradePanel();
        }
    }
});
canvas.addEventListener('mousemove', (event) => {
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') {
        canvas.style.cursor = 'default'; return;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top;
    let onCanvasActionable = false;
    const gridX = Math.floor(mouseX / C.TILE_SIZE); const gridY = Math.floor(mouseY / C.TILE_SIZE);

    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >=0) {
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY && !s.occupied);
            if (spot) onCanvasActionable = true;
        }
        const towerOnSpot = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (towerOnSpot) onCanvasActionable = true;
    }
    canvas.style.cursor = onCanvasActionable ? 'pointer' : 'default';
});

preloadImagesAndStart();