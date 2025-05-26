// js/main.js
import * as C from './config.js';
import { gameState as state, images, incrementImagesLoadedCount, imagesLoadedCount, totalImagesToLoad, setTotalImagesToLoad } from './state.js';
import * as Storage from './storage.js';
import * as Utils from './utils.js';
import * as Drawing from './drawing.js';
import * as GameLogic from './gameLogic.js';
import * as UIManager from './uiManager.js';
import *as ScreenManager from './screenManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ScreenManager.initializeScreenManager({
    startGameLevel: startGameLevel,
    updateContinueButtonState: updateContinueButtonState,
    goToMainMenu: goToMainMenu
});

const continueGameButton = document.getElementById('continueGameButton');
const newGameButtonFromMenu = document.getElementById('newGameButtonFromMenu');
const levelSelectButton = document.getElementById('levelSelectButton');
const creditsButton = document.getElementById('creditsButton');
const backToMainMenuFromLevelSelection = document.getElementById('backToMainMenuFromLevelSelection');
const backToMainMenuFromCredits = document.getElementById('backToMainMenuFromCredits');
const saveStatusMainMenu = document.getElementById('saveStatusMainMenu');
const customConfirmOverlay = document.getElementById('customConfirmOverlay');
const customConfirmTitle = document.getElementById('customConfirmTitle');
const customConfirmMessage = document.getElementById('customConfirmMessage');
const customConfirmOkButton = document.getElementById('customConfirmOkButton');
const customConfirmCancelButton = document.getElementById('customConfirmCancelButton');

if (!customConfirmOverlay || !customConfirmTitle || !customConfirmMessage || !customConfirmOkButton || !customConfirmCancelButton) {
    console.error("CRITICAL: One or more custom confirm dialog DOM elements are missing! Check IDs in index.html and main.js.");
}
let confirmResolve = null;

const uiButtonBileter = document.getElementById('uiButtonBileter');
const uiButtonOswietleniowiec = document.getElementById('uiButtonOswietleniowiec');
const uiButtonGarderobiana = document.getElementById('uiButtonGarderobiana');
const uiButtonBudkaInspicjenta = document.getElementById('uiButtonBudkaInspicjenta');
const uiButtonUpgradeSatisfaction = document.getElementById('uiButtonUpgradeSatisfaction');
const uiButtonStartWave = document.getElementById('uiButtonStartWave');
const uiButtonUpgradeDamage = document.getElementById('uiButtonUpgradeDamage');
const uiButtonUpgradeFireRate = document.getElementById('uiButtonUpgradeFireRate');
const uiButtonUpgradeSpecial1 = document.getElementById('uiButtonUpgradeSpecial1');
const uiButtonUpgradeSpecial2 = document.getElementById('uiButtonUpgradeSpecial2');
const uiButtonSellTower = document.getElementById('uiButtonSellTower');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const returnToMenuButtonGame = document.getElementById('returnToMenuButtonGame');
const menuFromPauseButton = document.getElementById('menuFromPauseButton');

function showCustomConfirm(title = "Potwierdzenie", message = "Czy na pewno?") {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        if (!customConfirmTitle || !customConfirmMessage || !customConfirmOverlay) {
            console.error("[showCustomConfirm] Dialog elements (title, message, or overlay) are null. Aborting dialog.");
            resolve(false); return;
        }
        customConfirmTitle.textContent = title;
        customConfirmMessage.textContent = message;
        customConfirmOverlay.classList.remove('hidden');
        customConfirmOverlay.classList.add('visible');
    });
}

function hideCustomConfirm() {
    if (customConfirmOverlay) {
        customConfirmOverlay.classList.remove('visible');
        setTimeout(() => { customConfirmOverlay.classList.add('hidden'); }, 300); // Delay to allow fade-out animation
    }
    confirmResolve = null;
}

customConfirmOkButton.addEventListener('click', () => { if (confirmResolve) confirmResolve(true); hideCustomConfirm(); });
customConfirmCancelButton.addEventListener('click', () => { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); });
customConfirmOverlay.addEventListener('click', (event) => { if (event.target === customConfirmOverlay) { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); }});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && customConfirmOverlay?.classList.contains('visible')) { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); }});

export function startGameLevel(levelIndex, startFromWave = 0) {
    console.log(`[main.js startGameLevel] Called with levelIndex: ${levelIndex}, startFromWave: ${startFromWave}`);
    clearTimeout(autoStartTimerId); // Clear any pending auto-start timers
    state.autoStartNextWaveEnabled = true; // Ensure auto-start is enabled for the new level
    GameLogic.setupLevel(levelIndex, startFromWave);
    ScreenManager.showScreen('playing');
    UIManager.updateUiStats();
    UIManager.updateTowerUpgradePanel();
    UIManager.updateSelectedTowerButtonUI();
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Stop previous game loop if any
    animationFrameId = null; // Reset animationFrameId
    gameLoop(); // Start the game loop
}

export function updateContinueButtonState() {
    const hasProgress = state.unlockedLevels > 1 || Object.values(state.levelProgress).some(p => p >= 0);
    if (hasProgress) {
        continueGameButton.classList.remove('disabled');
        continueGameButton.disabled = false;
    } else {
        continueGameButton.classList.add('disabled');
        continueGameButton.disabled = true;
    }
}

function preloadImagesAndStart() {
    Storage.loadGameProgress(state); // Load saved progress first
    setTotalImagesToLoad(Object.keys(C.imageSources).length);

    if (totalImagesToLoad === 0) { // If no images to load, proceed to init
        initGame();
        return;
    }

    for (const key in C.imageSources) {
        images[key] = new Image();
        images[key].src = C.imageSources[key];
        images[key].onload = () => {
            console.log(`Image loaded: ${key} from ${images[key].src}`);
            images[key].error = false; // Mark as not errored
            incrementImagesLoadedCount();
            if (imagesLoadedCount === totalImagesToLoad) {
                initGame(); // All images loaded, initialize game
            }
        };
        images[key].onerror = (e) => {
            console.error(`Błąd ładowania obrazka: ${key} z ${C.imageSources[key]}`, e);
            images[key].error = true; // Mark as errored
            incrementImagesLoadedCount(); // Still count it to not block game start indefinitely
            if (imagesLoadedCount === totalImagesToLoad) {
                initGame(); // Proceed even if some images fail, fallbacks will be used
            }
        }
    }
}

function initGame() {
    canvas.width = C.COLS * C.TILE_SIZE;
    canvas.height = C.ROWS * C.TILE_SIZE;
    ScreenManager.showScreen('menu'); // Start with the main menu
    updateContinueButtonState(); // Update continue button based on loaded progress
}

let animationFrameId = null;
let autoStartTimerId = null;
let autoStartCountdown = 0;

function gameLoop() {
    // Stop the loop if on a non-gameplay screen
    if (state.gameScreen === 'menu' || state.gameScreen === 'levelSelection' || state.gameScreen === 'credits' || state.gameScreen === 'levelCompleteScreen') {
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        Drawing.drawTiledBackground(ctx); // Draw background for summary screen
        Drawing.drawLevelCompleteSummary(ctx); // Draw the summary content
        UIManager.updateUiStats(); // Update UI stats (like Aplauz) which might be visible
    } else if (state.gameScreen === 'levelLost') {
        Drawing.drawTiledBackground(ctx);
        renderGameObjectsSorted(); // Draw towers and enemies in their final state
        Drawing.drawTextWithOutline(ctx, "KONIEC GRY!", canvas.width / 2, canvas.height / 2 - 40, "bold 48px Georgia", "red", "black", 4);
        Drawing.drawTextWithOutline(ctx, "Premiera tego aktu zrujnowana...", canvas.width / 2, canvas.height / 2 + 10, "bold 22px Georgia", "white", "black");
        UIManager.updateUiStats();
    } else if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
        // Handle paused state
        if (state.isPaused && state.gameScreen === 'paused') {
            Drawing.drawTiledBackground(ctx);
            Drawing.drawTowerSpots(ctx);
            renderGameObjectsSorted();
            Drawing.drawProjectiles(ctx);
            Drawing.drawEffects(ctx);
            Drawing.drawUI(ctx); // Draw tower ranges etc.
            if(state.showingWaveIntro) Drawing.drawWaveIntro(ctx); // Still show intro if paused during intro
            UIManager.showUiMessage(state.currentMessage || "Pauza"); // Show "Pauza" message
            UIManager.updateUiStats();
        } else if (state.gameScreen === 'playing' && !state.isPaused) { // Gameplay logic for active game
            // GSAP Animations for new towers, effects, and dying enemies
            state.towers.forEach(tower => {
                if (tower.isAnimatingIn) {
                    tower.isAnimatingIn = false;
                    gsap.to(tower, { duration: 0.6, currentScale: 1, currentAlpha: 1, currentRotation: 0, ease: "back.out(1.7)" });
                }
            });
            for (let i = state.effects.length - 1; i >= 0; i--) {
                const effect = state.effects[i];
                if (effect.isNew && !effect.isDebuffCloud) { // Debuff clouds have their own GSAP
                    effect.isNew = false;
                    gsap.to(effect, {
                        duration: (effect.durationFrames || 20) / 60, // Convert frames to seconds
                        scale: effect.maxScale, alpha: 0, ease: "expo.out",
                        onComplete: () => { const index = state.effects.indexOf(effect); if (index > -1) state.effects.splice(index, 1); }
                    });
                }
            }
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                const enemy = state.enemies[i];
                if (enemy.isDying && !enemy.isDeathAnimationStarted) {
                    enemy.isDeathAnimationStarted = true;
                    gsap.to(enemy, {
                        duration: 0.5, currentAlpha: 0,
                        currentScale: (enemy.currentScale !== undefined ? enemy.currentScale : 1) * 0.3, // Shrink on death
                        ease: "power2.in",
                        onComplete: () => { const index = state.enemies.indexOf(enemy); if (index > -1) state.enemies.splice(index, 1); checkWaveCompletion(); }
                    });
                }
            }

            // Wave logic
            if (state.showingWaveIntro) {
                // LOG DEBUG
                // console.log("Wave Intro Timer:", state.waveIntroTimer);
                state.waveIntroTimer--;
                if (state.waveIntroTimer <= 0) {
                    // LOG DEBUG
                    // console.log("Wave Intro Timer ended, starting next wave actual.");
                    GameLogic.startNextWaveActual();
                }
            } else if (state.waveInProgress) {
                GameLogic.handleWaveSpawning();
            }

            // Update game entities
            GameLogic.updateEnemies();
            GameLogic.updateTowers();
            GameLogic.updateProjectiles();

            // Drawing
            Drawing.drawTiledBackground(ctx);
            Drawing.drawTowerSpots(ctx);
            renderGameObjectsSorted(); // Draw towers, enemies, base sorted by Y
            Drawing.drawProjectiles(ctx);
            Drawing.drawEffects(ctx);
            Drawing.drawUI(ctx); // Tower ranges, etc.
            if(state.showingWaveIntro) Drawing.drawWaveIntro(ctx); // Draw wave intro overlay

            // Update UI
            UIManager.updateUiStats();
            UIManager.updateTowerUpgradePanel();
            if (state.messageTimer > 0 && state.currentMessage) {
                UIManager.showUiMessage(state.currentMessage);
                if (!state.isPaused && state.currentMessage !== "Pauza") state.messageTimer--;
            } else if (state.messageTimer <= 0 && document.getElementById('uiMessages').textContent !== "") {
                // Clear message if timer ran out, unless it's the "Pauza" message during pause
                if (!(state.currentMessage === "Pauza" && state.isPaused)) {
                    UIManager.showUiMessage(""); state.currentMessage = "";
                }
            }
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop); // Continue the loop
}

const renderGameObjectsSorted = () => {
    const gameObjectsToRender = [];
    // Add towers
    state.towers.forEach(t => gameObjectsToRender.push({ ...t, entityType: 'tower', renderY: t.y + C.TILE_SIZE / 2 })); // Use center Y for towers for now
    // Add enemies
    state.enemies.forEach(e => {
        const enemyFeetY = e.y + (e.height * (e.currentScale !== undefined ? e.currentScale : 1)) / 2; // Sort by feet position
        gameObjectsToRender.push({ ...e, entityType: 'enemy', renderY: enemyFeetY });
    });
    // Add theater base
    if (state.currentPath && state.currentPath.length > 0) {
        const baseNode = state.currentPath[state.currentPath.length -1];
        if (baseNode) {
            const baseImg = images.teatrBase;
            let baseRenderHeight = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER; // Default/fallback height
            if (baseImg && !baseImg.error && baseImg.width > 0 && baseImg.height > 0) {
                 const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
                 baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
            }
            // renderY for base should be its bottom edge for correct sorting
            gameObjectsToRender.push({
                entityType: 'base', draw: () => Drawing.drawTheaterBase(ctx),
                renderY: (baseNode.y + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8 + baseRenderHeight
            });
        }
    }

    // Sort all game objects by their renderY position
    gameObjectsToRender.sort((a, b) => a.renderY - b.renderY);

    // Draw sorted objects
    gameObjectsToRender.forEach(obj => {
        if (obj.entityType === 'tower') Drawing.drawSingleTower(ctx, obj);
        else if (obj.entityType === 'enemy') Drawing.drawSingleEnemy(ctx, obj);
        else if (obj.entityType === 'base') obj.draw(); // Base has its own draw function
    });
};

function checkWaveCompletion() {
    if (!state.waveInProgress) return; // Only check if a wave is supposed to be in progress

    // Check if any enemies are active or still in their death animation (alpha > 0)
    const activeOrAnimatingEnemies = state.enemies.filter(e => !e.isDeathAnimationStarted || (e.isDeathAnimationStarted && e.currentAlpha > 0));

    if (activeOrAnimatingEnemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        console.log(`[main.js checkWaveCompletion] All enemies cleared for wave (0-indexed): ${state.currentWaveNumber}. Displayed as: ${state.currentWaveNumber + 1}.`);
        state.waveInProgress = false;
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber; // Save progress up to the completed wave
        Storage.saveGameProgress(state);
        state.currentWaveNumber++; // Increment to the next wave number
        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            console.log(`[main.js checkWaveCompletion] All waves completed for level ${state.currentLevelIndex + 1}. Current wave number now: ${state.currentWaveNumber}`);
            GameLogic.completeLevel(); // All waves for the level are done
        } else {
            Utils.showMessage(state, `Fala ${state.currentWaveNumber} pokonana! Następna (${state.currentWaveNumber + 1}) za chwilę...`, 180);
            if (state.autoStartNextWaveEnabled) prepareAutoStartNextWave(5); // Start countdown for next wave
        }
        UIManager.updateUiStats();
    }
}

function prepareAutoStartNextWave(seconds) {
    // Conditions to prevent auto-starting
    if (state.gameOver || state.gameScreen !== 'playing' || state.isPaused || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
        clearTimeout(autoStartTimerId); return;
    }
    clearTimeout(autoStartTimerId); // Clear any existing timer
    autoStartCountdown = seconds;
    Utils.showMessage(state, `Następna fala (${state.currentWaveNumber + 1}) za: ${autoStartCountdown}s`, 65 * seconds + 100); // Show long message initially

    function countdownTick() {
        // Re-check conditions inside the tick, as game state might change
        if (state.isPaused || state.gameScreen !== 'playing' || state.waveInProgress || state.showingWaveIntro || state.gameOver) {
            Utils.showMessage(state, ""); // Clear countdown message
            clearTimeout(autoStartTimerId); return;
        }
        autoStartCountdown--;
        Utils.showMessage(state, `Następna fala (${state.currentWaveNumber + 1}) za: ${autoStartCountdown}s`, 65); // Short message for ticks
        if (autoStartCountdown > 0) {
            autoStartTimerId = setTimeout(countdownTick, 1000);
        } else {
            Utils.showMessage(state, `Rozpoczynanie fali ${state.currentWaveNumber + 1}...`, 60);
            GameLogic.prepareNextWave(); // Prepare the wave (shows intro)
            UIManager.updateUiStats(); // Update UI (e.g., start wave button might disable)
        }
    }
    autoStartTimerId = setTimeout(countdownTick, 1000); // Start the first tick
}

// Event Listeners for UI buttons
uiButtonBileter.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'bileter'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonOswietleniowiec.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'oswietleniowiec'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonGarderobiana.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'garderobiana'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonBudkaInspicjenta.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'budkaInspicjenta'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});

uiButtonUpgradeSatisfaction.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) { GameLogic.upgradeZadowolenie(); UIManager.updateUiStats(); }});
uiButtonStartWave.addEventListener('click', () => {
    clearTimeout(autoStartTimerId); Utils.showMessage(state, ""); // Stop auto-start and clear its message
    if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) {
        GameLogic.prepareNextWave(); UIManager.updateUiStats();
    }
});
uiButtonUpgradeDamage.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage'); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }});
uiButtonUpgradeFireRate.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate'); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }});

uiButtonUpgradeSpecial1.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        const towerDef = C.towerDefinitions[state.selectedTowerForUpgrade.type];
        // Determine the correct upgrade key for "Special1" based on tower's upgradeLevelNames
        // This logic assumes 'damage' and 'fireRate' might be present, and 'Special1' is the first non-standard one.
        let specialUpgradeKey = null;
        let specialIndex = 0;
        for (const key of towerDef.upgradeLevelNames || []) {
            if (key !== 'damage' && key !== 'fireRate') {
                if (specialIndex === 0) { // First special upgrade
                    specialUpgradeKey = key;
                    break;
                }
                specialIndex++;
            }
        }
        if(specialUpgradeKey) {
            GameLogic.upgradeTower(state.selectedTowerForUpgrade, specialUpgradeKey);
            UIManager.updateTowerUpgradePanel();
            UIManager.updateUiStats();
        }
    }
});
uiButtonUpgradeSpecial2.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        const towerDef = C.towerDefinitions[state.selectedTowerForUpgrade.type];
        let specialUpgradeKey = null;
        let specialIndex = 0;
        for (const key of towerDef.upgradeLevelNames || []) {
            if (key !== 'damage' && key !== 'fireRate') {
                if (specialIndex === 1) { // Second special upgrade
                    specialUpgradeKey = key;
                    break;
                }
                specialIndex++;
            }
        }
        if(specialUpgradeKey) {
            GameLogic.upgradeTower(state.selectedTowerForUpgrade, specialUpgradeKey);
            UIManager.updateTowerUpgradePanel();
            UIManager.updateUiStats();
        }
    }
});
// If Garderobiana (or other tower) has a third special upgrade (e.g., 'effectDuration'),
// you would need uiButtonUpgradeSpecial3 in HTML and a similar event listener:
// const uiButtonUpgradeSpecial3 = document.getElementById('uiButtonUpgradeSpecial3');
// if (uiButtonUpgradeSpecial3) {
//     uiButtonUpgradeSpecial3.addEventListener('click', () => {
//         // ... similar logic to find the third special upgrade key ...
//     });
// }


uiButtonSellTower.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.sellTower(state.selectedTowerForUpgrade); UIManager.updateTowerUpgradePanel(); UIManager.updateUiStats(); }});
pauseButton.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { GameLogic.togglePauseGame(); ScreenManager.showScreen('paused'); }});
resumeButton.addEventListener('click', () => { if (state.isPaused) { GameLogic.togglePauseGame(); ScreenManager.showScreen('playing'); if (animationFrameId === null) gameLoop(); /* Resume loop if it was stopped */ }});

export function goToMainMenu() {
    clearTimeout(autoStartTimerId); // Stop any auto-start timers
    state.isPaused = false; state.gameOver = false; state.selectedTowerType = null; state.selectedTowerForUpgrade = null; state.showingLevelCompleteSummary = false; state.levelCompleteButtons = [];
    if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null; // Stop game loop
    ScreenManager.showScreen('menu'); updateContinueButtonState();
}
returnToMenuButtonGame.addEventListener('click', goToMainMenu); // Button visible on levelLost screen
menuFromPauseButton.addEventListener('click', goToMainMenu);

// Main Menu navigation
continueGameButton.addEventListener('click', () => { if (!continueGameButton.disabled) ScreenManager.showScreen('levelSelection'); });
newGameButtonFromMenu.addEventListener('click', async () => {
    const confirmed = await showCustomConfirm("Rozpocząć Nową Grę?", "Czy na pewno chcesz rozpocząć nową grę? Cały dotychczasowy postęp zostanie utracony.");
    if (confirmed) {
        clearTimeout(autoStartTimerId); state.autoStartNextWaveEnabled = true; state.currentAplauzBonusForNextLevel = 0; state.unlockedLevels = 1; state.levelProgress = {}; Storage.saveGameProgress(state);
        if (saveStatusMainMenu) saveStatusMainMenu.textContent = "Nowa gra rozpoczęta. Postęp wyczyszczony.";
        updateContinueButtonState(); startGameLevel(0, 0); // Start level 0, wave 0
    }
});
levelSelectButton.addEventListener('click', () => ScreenManager.showScreen('levelSelection'));
creditsButton.addEventListener('click', () => ScreenManager.showScreen('credits'));
backToMainMenuFromLevelSelection.addEventListener('click', () => ScreenManager.showScreen('menu'));
backToMainMenuFromCredits.addEventListener('click', () => ScreenManager.showScreen('menu'));

// Canvas click handling
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;

    // Handle clicks on level complete screen buttons
    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        if (state.levelCompleteButtons?.length > 0) {
            state.levelCompleteButtons.forEach(button => {
                if (clickX >= button.x && clickX <= button.x + button.width && clickY >= button.y && clickY <= button.y + button.height) {
                    if (button.id === 'nextLevel') {
                        if (state.currentLevelIndex < C.levelData.length - 1) startGameLevel(state.currentLevelIndex + 1, 0);
                        else goToMainMenu(); // No more levels, go to menu
                    } else if (button.id === 'mainMenu') goToMainMenu();
                }
            });
        }
        return; // No further click processing on this screen
    }

    // Gameplay clicks (building/selecting towers)
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') return;

    const gridX = Math.floor(clickX / C.TILE_SIZE); const gridY = Math.floor(clickY / C.TILE_SIZE);
    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >= 0) { // Click is within grid
        const clickedTower = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (clickedTower) { // Clicked on an existing tower
            state.selectedTowerForUpgrade = clickedTower; state.selectedTowerType = null; // Select for upgrade
            UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); return;
        }
        if (state.selectedTowerType) { // A tower type is selected for building
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) { // Clicked on a valid tower spot
                if (spot.occupied) Utils.showMessage(state, "To miejsce jest już zajęte!", 120);
                else GameLogic.buildTower(gridX, gridY, state.selectedTowerType);
            } else Utils.showMessage(state, "Tutaj nie można budować wieży.", 120);
            return;
        }
        // Clicked on empty space without a tower type selected and not on a tower -> deselect
        if (!clickedTower && !state.selectedTowerType) {
            state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel();
        }
    }
});

// Canvas mousemove handling for cursor changes
canvas.addEventListener('mousemove', (event) => {
    // Cursor for level complete screen buttons
    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; let onButton = false;
        if (state.levelCompleteButtons?.length > 0) {
            state.levelCompleteButtons.forEach(button => { if (mouseX >= button.x && mouseX <= button.x + button.width && mouseY >= button.y && mouseY <= button.y + button.height) onButton = true; });
        }
        canvas.style.cursor = onButton ? 'pointer' : 'default'; return;
    }

    // Cursor for gameplay
    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') { canvas.style.cursor = 'default'; return; }

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; let onCanvasActionable = false;
    const gridX = Math.floor(mouseX / C.TILE_SIZE); const gridY = Math.floor(mouseY / C.TILE_SIZE);

    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >=0) { // Mouse is within grid
        if (state.selectedTowerType) { // Tower selected for building
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY && !s.occupied);
            if (spot) onCanvasActionable = true; // Pointer if on an available spot
        }
        const towerOnSpot = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        if (towerOnSpot) onCanvasActionable = true; // Pointer if hovering over an existing tower
    }
    canvas.style.cursor = onCanvasActionable ? 'pointer' : 'default';
});

// Dev mode keybindings
document.addEventListener('keydown', (event) => {
    // Toggle Dev Mode
    if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'D') {
        event.preventDefault(); state.isDevModeActive = !state.isDevModeActive;
        Utils.showMessage(state, `Tryb deweloperski ${state.isDevModeActive ? 'AKTYWNY' : 'WYŁĄCZONY'}`, 120); UIManager.updateUiStats();
    }

    // Dev Mode actions (only if active and confirm dialog is not visible)
    if (state.isDevModeActive && customConfirmOverlay && !customConfirmOverlay.classList.contains('visible')) {
        if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
            if (event.shiftKey && event.key === 'M') { // Add Money (Aplauz)
                event.preventDefault(); state.aplauz += 1000; Utils.showMessage(state, "+1000 Aplauzu (DEV)", 90); UIManager.updateUiStats();
            }
            else if (event.shiftKey && event.key === 'W') { // Skip/End Wave
                event.preventDefault();
                if (state.waveInProgress || state.showingWaveIntro) {
                    Utils.showMessage(state, "Kończenie obecnej fali... (DEV)", 90);
                    state.enemies.forEach(enemy => enemy.hp = 0); // Defeat all enemies
                    state.currentWaveSpawnsLeft = 0; // No more spawns for this wave
                } else if (state.currentWaveNumber < C.WAVES_PER_LEVEL && !state.gameOver && !state.isPaused) {
                    Utils.showMessage(state, "Przeskakiwanie do następnej fali... (DEV)", 90);
                    clearTimeout(autoStartTimerId); // Stop auto-start
                    GameLogic.prepareNextWave(); // Prepare next wave immediately
                } else {
                    Utils.showMessage(state, "Nie można rozpocząć/przeskoczyć fali. (DEV)", 90);
                }
                UIManager.updateUiStats();
            }  else if (event.shiftKey && event.key === 'H') { // Restore Health (Zadowolenie)
                event.preventDefault(); state.zadowolenieWidowni = state.maxZadowolenieWidowni;
                Utils.showMessage(state, "Zadowolenie przywrócone! (DEV)", 90); UIManager.updateUiStats();
            }
        }
        if (event.shiftKey && event.key === 'L') { // Unlock and Complete All Levels
            event.preventDefault(); Utils.showMessage(state, "Wszystkie akty odblokowane i ukończone! (DEV)", 120);
            state.unlockedLevels = C.levelData.length;
            C.levelData.forEach((level, index) => { state.levelProgress[index] = C.WAVES_PER_LEVEL; });
            Storage.saveGameProgress(state);
            // If in a game, complete it. Otherwise, update menu/selection screen.
            if ((state.gameScreen === 'playing' || state.gameScreen === 'paused') && !state.gameOver) GameLogic.completeLevel();
            else if (state.gameScreen !== 'menu' && state.gameScreen !== 'levelCompleteCanvas' && state.gameScreen !== 'levelLost') goToMainMenu();
            else if (state.gameScreen === 'menu') updateContinueButtonState();
            else if (state.gameScreen === 'levelSelection') ScreenManager.renderLevelSelection();
        }
    }
});

preloadImagesAndStart(); // Start the game loading process