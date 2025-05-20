import * as C from './config.js';
import { gameState as state, images, incrementImagesLoadedCount, imagesLoadedCount, totalImagesToLoad, setTotalImagesToLoad } from './state.js';
import * as Storage from './storage.js';
import * as Utils from './utils.js';
import * as Drawing from './drawing.js';
import * as GameLogic from './gameLogic.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentActHeader = document.getElementById('currentActHeader');

// Elementy DOM dla ekranów i przycisków
const gameContainer = document.getElementById('gameContainer');
const mainMenuScreen = document.getElementById('mainMenu');
const levelSelectionContainer = document.getElementById('levelSelection');
const pauseMenuScreen = document.getElementById('pauseMenu');

const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const returnToMenuButtonGame = document.getElementById('returnToMenuButtonGame'); // Przycisk w grze
const menuFromPauseButton = document.getElementById('menuFromPauseButton'); // Przycisk w menu pauzy

GameLogic.setCurrentActHeaderRef(currentActHeader);

function initializeUiRegions() {
    state.uiRegions.towerButtonBileter = { x: C.UI_PADDING, y: canvas.height - C.UI_BUTTON_HEIGHT - C.UI_PADDING, width: C.UI_BUTTON_WIDTH, height: C.UI_BUTTON_HEIGHT, type: 'bileter', label: "Bileter", cost: C.towerDefinitions.bileter.cost };
    state.uiRegions.towerButtonOswietleniowiec = { x: C.UI_PADDING + C.UI_BUTTON_WIDTH + C.UI_PADDING, y: canvas.height - C.UI_BUTTON_HEIGHT - C.UI_PADDING, width: C.UI_BUTTON_WIDTH, height: C.UI_BUTTON_HEIGHT, type: 'oswietleniowiec', label: "Oświetleniowiec", cost: C.towerDefinitions.oswietleniowiec.cost };
    state.uiRegions.startWaveButton = { x: canvas.width - C.UI_BUTTON_WIDTH - C.UI_PADDING, y: canvas.height - C.UI_BUTTON_HEIGHT - C.UI_PADDING, width: C.UI_BUTTON_WIDTH, height: C.UI_BUTTON_HEIGHT, label: "Start Fali" };
    state.uiRegions.upgradeZadowolenieButton = {
        x: canvas.width - (C.UI_BUTTON_WIDTH * 2) - (C.UI_PADDING * 2),
        y: canvas.height - C.UI_BUTTON_HEIGHT - C.UI_PADDING,
        width: C.UI_BUTTON_WIDTH,
        height: C.UI_BUTTON_HEIGHT,
        label: "Zadowolenie+"
    };
}

function showScreen(screenName) {
    mainMenuScreen.classList.replace('visible', 'hidden');
    gameContainer.classList.replace('visible', 'hidden');
    pauseMenuScreen.classList.replace('visible', 'hidden');

    if (screenName === 'menu') {
        mainMenuScreen.classList.replace('hidden', 'visible');
        renderLevelSelection();
        state.gameScreen = 'menu';
    } else if (screenName === 'playing') {
        gameContainer.classList.replace('hidden', 'visible');
        returnToMenuButtonGame.classList.replace('visible', 'hidden'); // Ukryj przycisk powrotu do menu w grze
        returnToMenuButtonGame.classList.add('hidden');
        pauseButton.classList.replace('hidden', 'visible');
        state.gameScreen = 'playing';
    } else if (screenName === 'paused') {
        gameContainer.classList.replace('hidden', 'visible'); // Gra pozostaje widoczna
        pauseMenuScreen.classList.replace('hidden', 'visible');
        state.gameScreen = 'paused';
    } else if (screenName === 'levelComplete' || screenName === 'levelLost') {
        gameContainer.classList.replace('hidden', 'visible'); // Pokaż ostatni stan gry
        returnToMenuButtonGame.classList.replace('hidden', 'visible'); // Pokaż przycisk powrotu
        pauseButton.classList.replace('visible', 'hidden'); // Ukryj przycisk pauzy
        state.gameScreen = screenName; // Utrzymaj ten stan do momentu kliknięcia przycisku
    }
}

function renderLevelSelection() {
    levelSelectionContainer.innerHTML = '';
    C.levelData.forEach((level, index) => {
        const button = document.createElement('button');
        button.classList.add('level-button');
        const isUnlocked = index < state.unlockedLevels;
        let progress = state.levelProgress[index] === undefined ? -1 : state.levelProgress[index]; // -1 oznacza nierozpoczęty

        let progressText;
        if (progress >= C.WAVES_PER_LEVEL) {
            progressText = "(Ukończono ✔️)";
        } else if (progress >= 0) {
            progressText = `(Fale: ${progress > 0 ? progress : 0}/${C.WAVES_PER_LEVEL})`;
        } else {
            progressText = "(Nierozpoczęty)";
        }


        button.innerHTML = `
            <span class="level-name">Akt ${index + 1}${level.name ? ': ' + level.name : ''}</span>
            <span class="level-progress">${isUnlocked ? progressText : '🔒 Zablokowany'}</span>
        `;

        if (isUnlocked) {
            button.addEventListener('click', () => {
                // Jeśli ukończony, zacznij od 0, inaczej od ostatniej zapisanej fali (lub 0 jeśli nierozpoczęty)
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
    if (animationFrameId === null) { // Rozpocznij pętlę tylko jeśli nie jest już aktywna
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
    initializeUiRegions();
    showScreen('menu');
}

let animationFrameId = null;

function gameLoop() {
    if (state.gameScreen === 'menu') {
        animationFrameId = null; // Zapewnij, że pętla się zatrzyma
        return;
    }
    
    if (state.isPaused && state.gameScreen === 'paused') {
        // Rysuj statyczny obraz gry w tle, jeśli trzeba, ale nie aktualizuj logiki
        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTheaterBase(ctx);
        Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx);
        Drawing.drawWaveIntro(ctx); // Może być aktywne podczas pauzy (np. odliczanie)
        // Komunikaty też mogą być rysowane przez drawUI
        animationFrameId = requestAnimationFrame(gameLoop); // Kontynuuj pętlę dla rysowania i komunikatów
        return;
    }

    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        // Pokaż ostatni stan gry, ale nie aktualizuj logiki
        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTheaterBase(ctx);
        Drawing.drawTowerSpots(ctx);
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        Drawing.drawUI(ctx); // Pokaż finalny stan UI
        // Komunikaty o wygranej/przegranej będą w drawUI (state.currentMessage)
        animationFrameId = requestAnimationFrame(gameLoop); // Kontynuuj, aby komunikat był widoczny
        return;
    }
    
    // Tylko jeśli gramy aktywnie (nie w menu, nie pauza, nie koniec poziomu)
    if (state.gameScreen === 'playing' && !state.isPaused && !state.gameOver) {
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
            if (state.waveIntroTimer <= 0) {
                GameLogic.startNextWaveActual();
            }
        }
        
        Drawing.drawEnemies(ctx);
        Drawing.drawTowers(ctx);
        Drawing.drawProjectiles(ctx);
        
        Drawing.drawUI(ctx);
        Drawing.drawWaveIntro(ctx);
    }


    // Sprawdź, czy gra się zakończyła w tej klatce (np. przez completeLevel lub endGame)
    if (state.gameScreen === 'levelComplete' || state.gameScreen === 'levelLost') {
        showScreen(state.gameScreen); // Zaktualizuj UI przycisków
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Event Listeners
pauseButton.addEventListener('click', () => {
    if (state.gameScreen === 'playing' && !state.isPaused) {
        GameLogic.togglePauseGame(); // Ustawi state.isPaused = true
        showScreen('paused');
    }
});

resumeButton.addEventListener('click', () => {
    if (state.isPaused) {
        GameLogic.togglePauseGame(); // Ustawi state.isPaused = false
        showScreen('playing');
        // Pętla gameLoop powinna sama wznowić aktualizacje, bo state.isPaused jest false
        // Jeśli animationFrameId był null, trzeba go ponownie zainicjować (ale raczej nie powinien być)
        if (!animationFrameId) gameLoop();
    }
});

function goToMainMenu() {
    state.isPaused = false;
    state.gameOver = false; // Upewnij się, że stan końca gry jest zresetowany
    // Nie ma potrzeby bezpośredniego zatrzymywania animationFrameId,
    // bo warunek state.gameScreen === 'menu' na początku gameLoop to zrobi.
    showScreen('menu');
}

returnToMenuButtonGame.addEventListener('click', goToMainMenu);
menuFromPauseButton.addEventListener('click', goToMainMenu);

// Canvas event listeners (bez zmian w logice klikania na wieże itp., tylko usunięcie fullscreen)
canvas.addEventListener('click', (event) => {
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    let uiClicked = false;

    // ... (reszta logiki kliknięć na UI i wieże - BEZ ZMIAN, tylko upewnij się, że nie ma odwołań do fullscreenButton) ...
    if (state.selectedTowerForUpgrade) {
        if (state.upgradeDamageButtonRegion && 
            clickX >= state.upgradeDamageButtonRegion.x && clickX <= state.upgradeDamageButtonRegion.x + state.upgradeDamageButtonRegion.width &&
            clickY >= state.upgradeDamageButtonRegion.y && clickY <= state.upgradeDamageButtonRegion.y + state.upgradeDamageButtonRegion.height) {
            GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage');
            uiClicked = true;
        } else if (state.upgradeFireRateButtonRegion &&
            clickX >= state.upgradeFireRateButtonRegion.x && clickX <= state.upgradeFireRateButtonRegion.x + state.upgradeFireRateButtonRegion.width &&
            clickY >= state.upgradeFireRateButtonRegion.y && clickY <= state.upgradeFireRateButtonRegion.y + state.upgradeFireRateButtonRegion.height) {
            GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate');
            uiClicked = true;
        }
        const panelX = state.selectedTowerForUpgrade.x - C.UPGRADE_PANEL_WIDTH / 2;
        const panelY = Math.max(C.UI_PADDING + 45, state.selectedTowerForUpgrade.y - state.selectedTowerForUpgrade.definition.renderSize / 2 - C.UPGRADE_PANEL_HEIGHT - C.UI_PADDING);
        if (!(clickX >= panelX && clickX <= panelX + C.UPGRADE_PANEL_WIDTH &&
              clickY >= panelY && clickY <= panelY + C.UPGRADE_PANEL_HEIGHT)) {
            if(!uiClicked) state.selectedTowerForUpgrade = null; 
        }
    }
    if (uiClicked) return;

    for (const key in state.uiRegions) {
        const region = state.uiRegions[key];
        if (region && clickX >= region.x && clickX <= region.x + region.width &&
            clickY >= region.y && clickY <= region.y + region.height) {
            
            uiClicked = true; 
            if (key !== 'upgradeZadowolenieButton' && !(state.selectedTowerForUpgrade && key.startsWith("towerButton"))) { 
               state.selectedTowerForUpgrade = null; 
            }

            if (key.startsWith("towerButton")) {
                state.selectedTowerType = region.type;
            } else if (key === "startWaveButton") {
                if (!state.waveInProgress && !state.showingWaveIntro && !state.gameOver) { 
                   GameLogic.prepareNextWave(); 
                }
            } else if (key === "upgradeZadowolenieButton") {
                GameLogic.upgradeZadowolenie();
            }
            break; 
        }
    }

    if (uiClicked) return; 

    const gridX = Math.floor(clickX / C.TILE_SIZE);
    const gridY = Math.floor(clickY / C.TILE_SIZE);

    if (gridY <= C.MAX_GAME_ROW) {
        const clickedTower = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (clickedTower) {
            state.selectedTowerForUpgrade = clickedTower;
            state.selectedTowerType = null; 
            return;
        }
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) {
                if (spot.occupied) {
                    Utils.showMessage(state, "To miejsce jest już zajęte!");
                } else {
                    const towerCost = C.towerDefinitions[state.selectedTowerType].cost;
                    if (state.aplauz >= towerCost) {
                         if (GameLogic.buildTower(gridX, gridY, state.selectedTowerType)) {
                            state.selectedTowerType = null; 
                         }
                    } else {
                        Utils.showMessage(state, "Za mało Aplauzu na tę wieżę!");
                    }
                }
            }
             if (!clickedTower) state.selectedTowerForUpgrade = null; 
        }
    }
});

canvas.addEventListener('mousemove', (event) => {
    // ... (logika hover - BEZ ZMIAN, tylko upewnij się, że nie ma odwołań do fullscreenButton) ...
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') {
        canvas.style.cursor = 'default';
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let onButtonClickable = false;

    for (const key in state.uiRegions) {
        const region = state.uiRegions[key];
         if (region && (key.startsWith("towerButton") || key === "startWaveButton" || key === "upgradeZadowolenieButton")) { 
            if (mouseX >= region.x && mouseX <= region.x + region.width &&
                mouseY >= region.y && mouseY <= region.y + region.height) {
                if (key === "startWaveButton" && (state.waveInProgress || state.showingWaveIntro || state.gameOver)) { 
                   // no pointer
                } else if (key === "upgradeZadowolenieButton" && state.zadowolenieUpgradeLevel >= C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
                   // no pointer
                }
                else {
                    onButtonClickable = true;
                }
                break;
            }
        }
    }
    if (state.selectedTowerForUpgrade) {
         if (state.upgradeDamageButtonRegion && 
            mouseX >= state.upgradeDamageButtonRegion.x && mouseX <= state.upgradeDamageButtonRegion.x + state.upgradeDamageButtonRegion.width &&
            mouseY >= state.upgradeDamageButtonRegion.y && mouseY <= state.upgradeDamageButtonRegion.y + state.upgradeDamageButtonRegion.height) {
            onButtonClickable = true;
        } else if (state.upgradeFireRateButtonRegion &&
            mouseX >= state.upgradeFireRateButtonRegion.x && mouseX <= state.upgradeFireRateButtonRegion.x + state.upgradeFireRateButtonRegion.width &&
            mouseY >= state.upgradeFireRateButtonRegion.y && mouseY <= state.upgradeFireRateButtonRegion.y + state.upgradeFireRateButtonRegion.height) {
            onButtonClickable = true;
        }
    }
     if (state.selectedTowerType && mouseY <= C.MAX_GAME_ROW * C.TILE_SIZE + C.TILE_SIZE) { 
        const gridX = Math.floor(mouseX / C.TILE_SIZE);
        const gridY = Math.floor(mouseY / C.TILE_SIZE);
        if (gridY <= C.MAX_GAME_ROW) { 
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY && !s.occupied);
            if (spot) {
                onButtonClickable = true;
            }
        }
    }
    if (mouseY <= C.MAX_GAME_ROW * C.TILE_SIZE + C.TILE_SIZE) { 
        const gridX = Math.floor(mouseX / C.TILE_SIZE);
        const gridY = Math.floor(mouseY / C.TILE_SIZE);
        if (gridY <= C.MAX_GAME_ROW) {
            const towerOnSpot = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
            if (towerOnSpot) {
                onButtonClickable = true;
            }
        }
    }

    canvas.style.cursor = onButtonClickable ? 'pointer' : 'default';
});


// Start aplikacji
preloadImagesAndStart();