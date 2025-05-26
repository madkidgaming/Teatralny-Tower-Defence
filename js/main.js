// js/main.js
import * as C from './config.js';
import { gameState as state, images, incrementImagesLoadedCount, imagesLoadedCount, totalImagesToLoad, setTotalImagesToLoad } from './state.js';
import * as Storage from './storage.js';
import * as Utils from './utils.js';
import * as Drawing from './drawing.js';
import * as GameLogic from './gameLogic.js';
// ZMIANA: Import UIManager
import * as UIManager from './uiManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const pageTitle = document.getElementById('pageTitle');
const gameLayout = document.getElementById('gameLayout');

const mainMenuScreen = document.getElementById('mainMenu');
const levelSelectionScreen = document.getElementById('levelSelectionScreen');
const creditsScreen = document.getElementById('creditsScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const levelSelectionContainer = document.getElementById('levelSelectionContainer');

const continueGameButton = document.getElementById('continueGameButton');
const newGameButtonFromMenu = document.getElementById('newGameButtonFromMenu');
const levelSelectButton = document.getElementById('levelSelectButton');
const creditsButton = document.getElementById('creditsButton');
const backToMainMenuFromLevelSelection = document.getElementById('backToMainMenuFromLevelSelection');
const backToMainMenuFromCredits = document.getElementById('backToMainMenuFromCredits');
const nextLevelButton = document.getElementById('nextLevelButton');
const backToMenuFromSummary = document.getElementById('backToMenuFromSummary');

const saveStatusMainMenu = document.getElementById('saveStatusMainMenu');
const saveStatusLevelSelection = document.getElementById('saveStatusLevelSelection');

const pauseMenuScreen = document.getElementById('pauseMenu');

const customConfirmOverlay = document.getElementById('customConfirmOverlay');
const customConfirmTitle = document.getElementById('customConfirmTitle');
const customConfirmMessage = document.getElementById('customConfirmMessage');
const customConfirmOkButton = document.getElementById('customConfirmOkButton');
const customConfirmCancelButton = document.getElementById('customConfirmCancelButton');

if (!customConfirmOverlay || !customConfirmTitle || !customConfirmMessage || !customConfirmOkButton || !customConfirmCancelButton) {
    console.error("CRITICAL: One or more custom confirm dialog DOM elements are missing! Check IDs in index.html and main.js.");
}
console.log("Initial check: customConfirmOverlay element:", customConfirmOverlay);

let confirmResolve = null;

// ZMIANA: Elementy UI, które były tu cachowane tylko dla funkcji przeniesionych do UIManager,
// zostały usunięte stąd. UIManager będzie je cachował wewnętrznie.
// Pozostają te, które są używane bezpośrednio w main.js (np. do event listenerów lub showScreen).
const uiButtonBileter = document.getElementById('uiButtonBileter');
const uiButtonOswietleniowiec = document.getElementById('uiButtonOswietleniowiec');
const uiButtonUpgradeSatisfaction = document.getElementById('uiButtonUpgradeSatisfaction');
const uiButtonStartWave = document.getElementById('uiButtonStartWave');
// const towerUpgradePanel = document.getElementById('towerUpgradePanel'); // Przeniesione
const uiButtonUpgradeDamage = document.getElementById('uiButtonUpgradeDamage');
const uiButtonUpgradeFireRate = document.getElementById('uiButtonUpgradeFireRate');
const uiButtonSellTower = document.getElementById('uiButtonSellTower');
// const uiMessages = document.getElementById('uiMessages'); // Przeniesione

const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const returnToMenuButtonGame = document.getElementById('returnToMenuButtonGame');
const menuFromPauseButton = document.getElementById('menuFromPauseButton');


function showCustomConfirm(title = "Potwierdzenie", message = "Czy na pewno?") {
    console.log("[showCustomConfirm] Function called. Overlay element:", customConfirmOverlay);
    return new Promise((resolve) => {
        confirmResolve = resolve;

        if (!customConfirmTitle || !customConfirmMessage || !customConfirmOverlay) {
            console.error("[showCustomConfirm] Dialog elements (title, message, or overlay) are null. Aborting dialog.");
            resolve(false);
            return;
        }

        customConfirmTitle.textContent = title;
        customConfirmMessage.textContent = message;

        customConfirmOverlay.classList.remove('hidden');
        customConfirmOverlay.classList.add('visible');
        console.log("[showCustomConfirm] Overlay classes set. Should be visible now.");
    });
}

function hideCustomConfirm() {
    console.log("[hideCustomConfirm] Function called.");
    if (customConfirmOverlay) {
        customConfirmOverlay.classList.remove('visible');
        setTimeout(() => {
            customConfirmOverlay.classList.add('hidden');
            console.log("[hideCustomConfirm] Overlay classes set to hidden after timeout.");
        }, 300);
    }
    confirmResolve = null;
}

customConfirmOkButton.addEventListener('click', () => {
    console.log("[customConfirmOkButton] OK Clicked.");
    if (confirmResolve) {
        console.log("[customConfirmOkButton] Resolving promise with true.");
        confirmResolve(true);
    }
    hideCustomConfirm();
});

customConfirmCancelButton.addEventListener('click', () => {
    console.log("[customConfirmCancelButton] Cancel Clicked.");
    if (confirmResolve) {
        console.log("[customConfirmCancelButton] Resolving promise with false.");
        confirmResolve(false);
    }
    hideCustomConfirm();
});

customConfirmOverlay.addEventListener('click', (event) => {
    if (event.target === customConfirmOverlay) {
        console.log("[customConfirmOverlay] Clicked outside modal box.");
        if (confirmResolve) {
            console.log("[customConfirmOverlay] Resolving promise with false (clicked outside).");
            confirmResolve(false);
        }
        hideCustomConfirm();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && customConfirmOverlay && customConfirmOverlay.classList.contains('visible')) {
        console.log("[customConfirmOverlay] Escape key pressed.");
        if (confirmResolve) {
            console.log("[customConfirmOverlay] Resolving promise with false (Escape key).");
            confirmResolve(false);
        }
        hideCustomConfirm();
    }
});

// ZMIANA: Funkcje updateUiStats, showUiMessage, updateTowerUpgradePanel, updateSelectedTowerButtonUI
// zostały przeniesione do UIManager.js i są teraz wywoływane przez UIManager.<nazwaFunkcji>()


function showScreen(screenName) {
    // Ukryj wszystkie główne kontenery ekranów na początku
    mainMenuScreen.classList.remove('visible');
    mainMenuScreen.classList.add('hidden');

    levelSelectionScreen.classList.remove('visible');
    levelSelectionScreen.classList.add('hidden');

    creditsScreen.classList.remove('visible');
    creditsScreen.classList.add('hidden');

    levelCompleteScreen.classList.remove('visible');
    levelCompleteScreen.classList.add('hidden');

    gameLayout.classList.remove('visible');
    gameLayout.classList.add('hidden');

    pauseMenuScreen.classList.remove('visible');
    pauseMenuScreen.classList.add('hidden');

    console.log(`[showScreen] Attempting to switch to screen: ${screenName}`);

    if (['menu', 'levelSelection', 'credits', 'levelCompleteScreen'].includes(screenName)) {
        pageTitle.textContent = "Teatr Tower Defense";
        const currentSaveStatusEl = screenName === 'menu' ? saveStatusMainMenu :
                                 screenName === 'levelSelection' ? saveStatusLevelSelection :
                                 null;

        if (currentSaveStatusEl) {
            if (!currentSaveStatusEl.textContent.toLowerCase().includes("błąd") &&
                !currentSaveStatusEl.textContent.toLowerCase().includes("nowa gra") &&
                !currentSaveStatusEl.textContent.toLowerCase().includes("wyczyszczony")) {
                currentSaveStatusEl.textContent = "Postęp gry jest zapisywany automatycznie.";
            }
        }
    }

    // Pokaż wybrany ekran
    if (screenName === 'menu') {
        mainMenuScreen.classList.remove('hidden');
        mainMenuScreen.classList.add('visible');
        updateContinueButtonState();
    } else if (screenName === 'levelSelection') {
        levelSelectionScreen.classList.remove('hidden');
        levelSelectionScreen.classList.add('visible');
        renderLevelSelection();
    } else if (screenName === 'credits') {
        creditsScreen.classList.remove('hidden');
        creditsScreen.classList.add('visible');
    } else if (screenName === 'levelCompleteScreen') {
        console.log("[showScreen] Processing 'levelCompleteScreen'. Element:", levelCompleteScreen);
        if (levelCompleteScreen) {
            levelCompleteScreen.classList.remove('hidden');
            levelCompleteScreen.classList.add('visible');
            renderLevelCompleteSummary();
            console.log("[showScreen] levelCompleteScreen should now be visible.");
        } else {
            console.error("[showScreen] CRITICAL: levelCompleteScreen element is null!");
        }
    } else if (screenName === 'playing') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        if (C.levelData && C.levelData[state.currentLevelIndex]) {
             pageTitle.textContent = `Teatr Tower Defense - Akt ${state.currentLevelIndex + 1}`;
        }
        returnToMenuButtonGame.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        UIManager.updateUiStats(); // ZMIANA
        UIManager.updateTowerUpgradePanel(); // ZMIANA
        UIManager.updateSelectedTowerButtonUI(); // ZMIANA
    } else if (screenName === 'paused') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        pauseMenuScreen.classList.remove('hidden');
        pauseMenuScreen.classList.add('visible');
    } else if (screenName === 'levelLost') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        returnToMenuButtonGame.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        UIManager.showUiMessage(state.currentMessage); // ZMIANA
        UIManager.updateUiStats(); // ZMIANA
    }
    state.gameScreen = screenName;
}


function renderLevelCompleteSummary() {
    const stats = state.lastLevelStats;
    document.getElementById('levelCompleteTitle').textContent = `${stats.levelName || 'Akt ' + (state.currentLevelIndex +1)} Ukończony!`;

    const starContainer = document.getElementById('starRatingContainer');
    starContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const starSpan = document.createElement('span');
        starSpan.classList.add('star');
        if (i < stats.stars) {
            starSpan.classList.add('filled');
        }
        starContainer.appendChild(starSpan);
    }

    document.getElementById('summaryLevelName').textContent = stats.levelName || `Akt ${state.currentLevelIndex + 1}`;
    document.getElementById('summarySatisfaction').textContent = `${stats.finalSatisfaction} / ${stats.initialMaxSatisfaction}`;
    document.getElementById('summaryBileterTowers').textContent = stats.towersBuilt.bileter;
    document.getElementById('summaryOswietleniowiecTowers').textContent = stats.towersBuilt.oswietleniowiec;
    document.getElementById('summaryRemainingAplauz').textContent = stats.remainingAplauz;
    document.getElementById('summaryTowerValue').textContent = stats.totalTowerValue;
    document.getElementById('summaryAplauzBonus').textContent = stats.aplauzBonusForNextLevel;

    if (state.currentLevelIndex < C.levelData.length - 1 && C.levelData.length > 1) {
        nextLevelButton.classList.remove('hidden');
    } else {
        nextLevelButton.classList.add('hidden');
    }
}


function renderLevelSelection() {
    levelSelectionContainer.innerHTML = '';
    if (!C.levelData) {
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
    console.log(`[startGameLevel] Called with levelIndex: ${levelIndex}, startFromWave: ${startFromWave}`);
    clearTimeout(autoStartTimerId);
    state.autoStartNextWaveEnabled = true;
    GameLogic.setupLevel(levelIndex, startFromWave);
    showScreen('playing');

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log("[startGameLevel] Warning: animationFrameId was not null. Cancelled existing frame.");
    }
    animationFrameId = null;
    console.log("[startGameLevel] Starting new gameLoop.");
    gameLoop();
}

function updateContinueButtonState() {
    const hasProgress = state.unlockedLevels > 1 || Object.keys(state.levelProgress).length > 0;
    if (hasProgress) {
        continueGameButton.classList.remove('disabled');
        continueGameButton.disabled = false;
    } else {
        continueGameButton.classList.add('disabled');
        continueGameButton.disabled = true;
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
let autoStartTimerId = null;
let autoStartCountdown = 0;

function gameLoop() {
    console.log(`[gameLoop ENTRY] Timestamp: ${performance.now()}, Screen: ${state.gameScreen}, Paused: ${state.isPaused}, AnimID before RAF: ${animationFrameId}`);

    if (state.gameScreen === 'levelCompleteScreen') {
        console.log("[gameLoop START] Detected gameScreen is 'levelCompleteScreen'. Stopping loop and showing screen.");
        animationFrameId = null;
        showScreen('levelCompleteScreen');
        return;
    }
    if (state.gameScreen === 'levelLost') {
        console.log("[gameLoop START] Detected gameScreen is 'levelLost'. Stopping loop and showing screen.");
        animationFrameId = null;
        showScreen('levelLost');
        return;
    }

    if (state.gameScreen === 'menu' ||
        state.gameScreen === 'levelSelection' ||
        state.gameScreen === 'credits') {
        animationFrameId = null;
        return;
    }

    const renderGameObjectsSorted = () => {
        const gameObjectsToRender = [];
        state.towers.forEach(t => gameObjectsToRender.push({ ...t, entityType: 'tower', renderY: t.y + C.TILE_SIZE / 2 }));
        state.enemies.forEach(e => {
            const enemyFeetY = e.y + (e.height * (e.currentScale !== undefined ? e.currentScale : 1)) / 2;
            gameObjectsToRender.push({ ...e, entityType: 'enemy', renderY: enemyFeetY });
        });
        const baseNode = state.currentPath[state.currentPath.length -1];
        if (baseNode) {
            const baseImg = images.teatrBase;
            let baseRenderHeight = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
            if (baseImg && !baseImg.error) {
                 const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
                 baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
            }
            gameObjectsToRender.push({
                entityType: 'base', draw: () => Drawing.drawTheaterBase(ctx),
                renderY: (baseNode.y + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8 + baseRenderHeight
            });
        }
        gameObjectsToRender.sort((a, b) => a.renderY - b.renderY);
        gameObjectsToRender.forEach(obj => {
            if (obj.entityType === 'tower') Drawing.drawSingleTower(ctx, obj);
            else if (obj.entityType === 'enemy') Drawing.drawSingleEnemy(ctx, obj);
            else if (obj.entityType === 'base') obj.draw();
        });
    };

    if (state.isPaused && state.gameScreen === 'paused') {
        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTowerSpots(ctx);
        renderGameObjectsSorted();
        Drawing.drawProjectiles(ctx);
        Drawing.drawEffects(ctx);
        Drawing.drawUI(ctx);
        Drawing.drawWaveIntro(ctx);
        UIManager.showUiMessage(state.currentMessage || "Pauza"); // ZMIANA
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    if (state.gameScreen === 'playing' && !state.isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        state.towers.forEach(tower => {
            if (tower.isAnimatingIn) {
                tower.isAnimatingIn = false;
                gsap.to(tower, { duration: 0.6, currentScale: 1, currentAlpha: 1, currentRotation: 0, ease: "back.out(1.7)" });
            }
        });

        for (let i = state.effects.length - 1; i >= 0; i--) {
            const effect = state.effects[i];
            if (effect.isNew) {
                effect.isNew = false;
                gsap.to(effect, {
                    duration: (effect.durationFrames || 20) / 60,
                    scale: effect.maxScale,
                    alpha: 0,
                    ease: "expo.out",
                    onComplete: () => {
                        const index = state.effects.indexOf(effect);
                        if (index > -1) state.effects.splice(index, 1);
                    }
                });
            }
        }

        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            if (enemy.isDying && !enemy.isDeathAnimationStarted) {
                enemy.isDeathAnimationStarted = true;
                gsap.to(enemy, {
                    duration: 0.5,
                    currentAlpha: 0,
                    currentScale: (enemy.currentScale !== undefined ? enemy.currentScale : 1) * 0.3,
                    ease: "power2.in",
                    onComplete: () => {
                        const index = state.enemies.indexOf(enemy);
                        if (index > -1) state.enemies.splice(index, 1);
                        console.log(`[GSAP onComplete] Enemy ${enemy.id} animation finished. Calling checkWaveCompletion.`);
                        checkWaveCompletion();
                    }
                });
            }
        }

        if (state.showingWaveIntro) {
            if (!state.isPaused) {
                state.waveIntroTimer--; // ZMIANA: Przeniesiono dekrementację timera tutaj z drawing.js
            }
            if (state.waveIntroTimer <= 0) {
                GameLogic.startNextWaveActual();
            }
        } else {
            if (state.waveInProgress) {
                GameLogic.handleWaveSpawning();
            }
        }

        GameLogic.updateEnemies();
        GameLogic.updateTowers();
        GameLogic.updateProjectiles();

        Drawing.drawBackgroundAndPath(ctx);
        Drawing.drawTowerSpots(ctx);
        renderGameObjectsSorted();
        Drawing.drawProjectiles(ctx);
        Drawing.drawEffects(ctx);
        Drawing.drawUI(ctx);
        Drawing.drawWaveIntro(ctx);

        UIManager.updateUiStats(); // ZMIANA
        UIManager.updateTowerUpgradePanel(); // ZMIANA
        if (state.messageTimer > 0 && state.currentMessage) {
            UIManager.showUiMessage(state.currentMessage); // ZMIANA
            if (!state.isPaused && state.currentMessage !== "Pauza") state.messageTimer--;
        } else if (state.messageTimer <= 0 && document.getElementById('uiMessages').textContent !== "") { // Sprawdzamy bezpośrednio element, bo UIManager może go wyczyścić z opóźnieniem
            if (!(state.currentMessage === "Pauza" && state.isPaused)) {
                UIManager.showUiMessage(""); // ZMIANA
                state.currentMessage = "";
            }
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function checkWaveCompletion() {
    console.log(`[checkWaveCompletion] Called. WaveInProgress: ${state.waveInProgress}, CurrentWave: ${state.currentWaveNumber}, Enemies: ${state.enemies.filter(e => !e.isDeathAnimationStarted || e.currentAlpha > 0).length}, SpawnsLeft: ${state.currentWaveSpawnsLeft}`);

    if (!state.waveInProgress) {
        console.log("[checkWaveCompletion] Wave not in progress. Returning.");
        return;
    }

    const activeOrAnimatingEnemies = state.enemies.filter(e => !e.isDeathAnimationStarted || e.currentAlpha > 0);

    if (activeOrAnimatingEnemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        console.log(`[checkWaveCompletion] All enemies cleared for wave ${state.currentWaveNumber}.`);
        state.waveInProgress = false;
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber;
        Storage.saveGameProgress(state);

        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            console.log(`[checkWaveCompletion] Last wave (${state.currentWaveNumber}) completed. Calling GameLogic.completeLevel().`);
            GameLogic.completeLevel();
        } else {
            Utils.showMessage(state, `Fala ${state.currentWaveNumber} pokonana! Następna za chwilę...`, 180);
            if (state.autoStartNextWaveEnabled) prepareAutoStartNextWave(5);
        }
        UIManager.updateUiStats(); // ZMIANA
    } else {
        console.log(`[checkWaveCompletion] Wave ${state.currentWaveNumber} not fully cleared. Active/Animating: ${activeOrAnimatingEnemies.length}, SpawnsLeft: ${state.currentWaveSpawnsLeft}`);
    }
}

function prepareAutoStartNextWave(seconds) {
    if (state.gameOver || state.gameScreen !== 'playing' || state.isPaused || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
        clearTimeout(autoStartTimerId); return;
    }
    clearTimeout(autoStartTimerId);
    autoStartCountdown = seconds;
    Utils.showMessage(state, `Następna fala za: ${autoStartCountdown}s`, 65 * seconds + 100);
    function countdownTick() {
        if (state.isPaused || state.gameScreen !== 'playing' || state.waveInProgress || state.showingWaveIntro || state.gameOver) {
            Utils.showMessage(state, ""); clearTimeout(autoStartTimerId); return;
        }
        autoStartCountdown--;
        Utils.showMessage(state, `Następna fala za: ${autoStartCountdown}s`, 65);
        if (autoStartCountdown > 0) autoStartTimerId = setTimeout(countdownTick, 1000);
        else { Utils.showMessage(state, `Rozpoczynanie fali...`, 60); GameLogic.prepareNextWave(); UIManager.updateUiStats(); } // ZMIANA
    }
    autoStartTimerId = setTimeout(countdownTick, 1000);
}

uiButtonBileter.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'bileter'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }}); // ZMIANA
uiButtonOswietleniowiec.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'oswietleniowiec'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }}); // ZMIANA
uiButtonUpgradeSatisfaction.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) { GameLogic.upgradeZadowolenie(); UIManager.updateUiStats(); }}); // ZMIANA
uiButtonStartWave.addEventListener('click', () => {
    console.log("[uiButtonStartWave] Clicked. Current wave:", state.currentWaveNumber, "WaveInProgress:", state.waveInProgress, "ShowingIntro:", state.showingWaveIntro);
    clearTimeout(autoStartTimerId);
    Utils.showMessage(state, "");
    if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) {
        console.log("[uiButtonStartWave] Conditions met, calling prepareNextWave.");
        GameLogic.prepareNextWave();
        UIManager.updateUiStats(); // ZMIANA
    } else {
        console.log("[uiButtonStartWave] Conditions NOT met for starting wave.");
    }
});
uiButtonUpgradeDamage.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage'); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }}); // ZMIANA
uiButtonUpgradeFireRate.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate'); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }}); // ZMIANA
uiButtonSellTower.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.sellTower(state.selectedTowerForUpgrade); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }}); // ZMIANA

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
        if (animationFrameId === null) {
            console.log("[resumeButton] animationFrameId is null, restarting gameLoop.");
            gameLoop();
        } else {
            console.log("[resumeButton] animationFrameId is NOT null, gameLoop should resume automatically.");
        }
    }
});

function goToMainMenu() {
    clearTimeout(autoStartTimerId);
    state.isPaused = false; state.gameOver = false;
    state.selectedTowerType = null; state.selectedTowerForUpgrade = null;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log("[goToMainMenu] Cancelled animationFrameId:", animationFrameId);
    }
    animationFrameId = null;
    showScreen('menu');
}
returnToMenuButtonGame.addEventListener('click', goToMainMenu);
menuFromPauseButton.addEventListener('click', goToMainMenu);
backToMenuFromSummary.addEventListener('click', goToMainMenu);

nextLevelButton.addEventListener('click', () => {
    if (state.currentLevelIndex < C.levelData.length - 1 && C.levelData.length > 1) {
        startGameLevel(state.currentLevelIndex + 1, 0);
    } else {
        goToMainMenu();
    }
});

continueGameButton.addEventListener('click', () => { if (!continueGameButton.disabled) showScreen('levelSelection'); });

newGameButtonFromMenu.addEventListener('click', async () => {
    console.log("[NewGameButton] Clicked.");
    try {
        console.log("[NewGameButton] Calling showCustomConfirm...");
        const confirmed = await showCustomConfirm("Rozpocząć Nową Grę?", "Czy na pewno chcesz rozpocząć nową grę? Cały dotychczasowy postęp zostanie utracony.");
        console.log("[NewGameButton] showCustomConfirm promise resolved. Confirmed value:", confirmed);

        if (confirmed) {
            console.log("[NewGameButton] Confirmed: true. Resetting game state and starting new game.");
            clearTimeout(autoStartTimerId);
            state.autoStartNextWaveEnabled = true;
            state.currentAplauzBonusForNextLevel = 0;
            state.unlockedLevels = 1;
            state.levelProgress = {};
            Storage.saveGameProgress(state);
            if (saveStatusMainMenu) saveStatusMainMenu.textContent = "Nowa gra rozpoczęta. Postęp wyczyszczony.";
            updateContinueButtonState();
            console.log("[NewGameButton] Calling startGameLevel(0, 0)...");
            startGameLevel(0, 0);
            console.log("[NewGameButton] startGameLevel(0, 0) finished.");
        } else {
            console.log("[NewGameButton] Confirmed: false, or dialog dismissed. No action taken.");
        }
    } catch (error) {
        console.error("[NewGameButton] Error during new game process:", error);
    }
});

levelSelectButton.addEventListener('click', () => showScreen('levelSelection'));
creditsButton.addEventListener('click', () => showScreen('credits'));
backToMainMenuFromLevelSelection.addEventListener('click', () => showScreen('menu'));
backToMainMenuFromCredits.addEventListener('click', () => showScreen('menu'));

canvas.addEventListener('click', (event) => {
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;
    const gridX = Math.floor(clickX / C.TILE_SIZE); const gridY = Math.floor(clickY / C.TILE_SIZE);
    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >= 0) {
        const clickedTower = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (clickedTower) { state.selectedTowerForUpgrade = clickedTower; state.selectedTowerType = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); return; } // ZMIANA
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) { if (spot.occupied) Utils.showMessage(state, "To miejsce jest już zajęte!", 120); else if (!GameLogic.buildTower(gridX, gridY, state.selectedTowerType)) {}
            } else Utils.showMessage(state, "Tutaj nie można budować wieży.", 120);
            return;
        }
        if (!clickedTower && !state.selectedTowerType) { state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); } // ZMIANA
    }
});
canvas.addEventListener('mousemove', (event) => {
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') { canvas.style.cursor = 'default'; return; }
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top;
    let onCanvasActionable = false;
    const gridX = Math.floor(mouseX / C.TILE_SIZE); const gridY = Math.floor(mouseY / C.TILE_SIZE);
    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >=0) {
        if (state.selectedTowerType) { const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY && !s.occupied); if (spot) onCanvasActionable = true; }
        const towerOnSpot = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY); if (towerOnSpot) onCanvasActionable = true;
    }
    canvas.style.cursor = onCanvasActionable ? 'pointer' : 'default';
});

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        state.isDevModeActive = !state.isDevModeActive;
        Utils.showMessage(state, `Tryb deweloperski ${state.isDevModeActive ? 'AKTYWNY' : 'WYŁĄCZONY'}`, 120);
        UIManager.updateUiStats(); // ZMIANA
    }

    if (state.isDevModeActive && (state.gameScreen === 'playing' || state.gameScreen === 'paused') && customConfirmOverlay && !customConfirmOverlay.classList.contains('visible') ) {
        if (event.shiftKey && event.key === 'M') {
            event.preventDefault();
            state.aplauz += 1000;
            Utils.showMessage(state, "+1000 Aplauzu (DEV)", 90);
            UIManager.updateUiStats(); // ZMIANA
        } else if (event.shiftKey && event.key === 'W') {
            event.preventDefault();
            if (state.waveInProgress || state.showingWaveIntro) {
                Utils.showMessage(state, "Kończenie obecnej fali... (DEV)", 90);
                state.enemies.forEach(enemy => enemy.hp = 0);
                state.currentWaveSpawnsLeft = 0;
            } else if (state.currentWaveNumber < C.WAVES_PER_LEVEL && state.gameScreen === 'playing' && !state.gameOver) {
                Utils.showMessage(state, "Przeskakiwanie do następnej fali... (DEV)", 90);
                clearTimeout(autoStartTimerId);
                GameLogic.prepareNextWave();
            } else {
                Utils.showMessage(state, "Nie można rozpocząć/przeskoczyć fali. (DEV)", 90);
            }
            UIManager.updateUiStats(); // ZMIANA
        } else if (event.shiftKey && event.key === 'L') {
            event.preventDefault();
            state.unlockedLevels = C.levelData.length;
            C.levelData.forEach((level, index) => {
                state.levelProgress[index] = C.WAVES_PER_LEVEL;
            });
            Storage.saveGameProgress(state);
            Utils.showMessage(state, "Wszystkie akty odblokowane i ukończone! (DEV)", 120);
            if (state.gameScreen === 'playing' && !state.gameOver) GameLogic.completeLevel();
            else if (state.gameScreen !== 'menu') showScreen('menu');
            UIManager.updateUiStats(); // ZMIANA
        } else if (event.shiftKey && event.key === 'H') {
             event.preventDefault();
             state.zadowolenieWidowni = state.maxZadowolenieWidowni;
             Utils.showMessage(state, "Zadowolenie przywrócone! (DEV)", 90);
             UIManager.updateUiStats(); // ZMIANA
        }
    }
});


preloadImagesAndStart();