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

let confirmResolve = null;

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


function showCustomConfirm(title = "Potwierdzenie", message = "Czy na pewno?") {
    return new Promise((resolve) => {
        confirmResolve = resolve; 
        customConfirmTitle.textContent = title;
        customConfirmMessage.textContent = message;
        customConfirmOverlay.classList.remove('hidden');
        customConfirmOverlay.classList.add('visible'); 
    });
}

function hideCustomConfirm() {
    customConfirmOverlay.classList.remove('visible');
    setTimeout(() => {
        customConfirmOverlay.classList.add('hidden');
    }, 300); 
    confirmResolve = null; 
}

customConfirmOkButton.addEventListener('click', () => {
    if (confirmResolve) {
        confirmResolve(true); 
    }
    hideCustomConfirm();
});

customConfirmCancelButton.addEventListener('click', () => {
    if (confirmResolve) {
        confirmResolve(false); 
    }
    hideCustomConfirm();
});

customConfirmOverlay.addEventListener('click', (event) => {
    if (event.target === customConfirmOverlay) { 
        if (confirmResolve) {
            confirmResolve(false);
        }
        hideCustomConfirm();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && customConfirmOverlay.classList.contains('visible')) {
        if (confirmResolve) {
            confirmResolve(false);
        }
        hideCustomConfirm();
    }
});


function updateUiStats() {
    if (!C.levelData[state.currentLevelIndex] && 
        state.gameScreen !== 'menu' && 
        state.gameScreen !== 'levelSelection' && 
        state.gameScreen !== 'credits' && 
        state.gameScreen !== 'levelCompleteScreen') {
        return;
    }

     if (state.gameScreen === 'playing' || state.gameScreen === 'paused' || state.gameScreen === 'levelLost') {
        uiCurrentAct.textContent = state.currentLevelIndex + 1;
        let waveDisplay;
        if (state.currentWaveNumber > C.WAVES_PER_LEVEL) {
            waveDisplay = C.WAVES_PER_LEVEL;
        } else if (state.currentWaveNumber > 0) {
            waveDisplay = state.currentWaveNumber;
        } else {
            const progress = state.levelProgress[state.currentLevelIndex];
            if (progress === undefined || progress === -1) {
                waveDisplay = '-';
            } else {
                waveDisplay = '0';
            }
        }
        uiCurrentWave.textContent = `${waveDisplay}/${C.WAVES_PER_LEVEL}`;
        uiAplauz.textContent = state.aplauz;
        uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;
    }


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

    const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL || state.gameScreen === 'levelCompleteScreen';
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
    if (state.selectedTowerForUpgrade && C.towerDefinitions[state.selectedTowerForUpgrade.type]) {
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
    levelSelectionScreen.classList.add('hidden');
    levelSelectionScreen.classList.remove('visible');
    creditsScreen.classList.add('hidden');
    creditsScreen.classList.remove('visible');
    levelCompleteScreen.classList.add('hidden'); 
    levelCompleteScreen.classList.remove('visible');
    gameLayout.classList.add('hidden');
    gameLayout.classList.remove('visible');
    pauseMenuScreen.classList.add('hidden');
    pauseMenuScreen.classList.remove('visible');

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
        levelCompleteScreen.classList.remove('hidden');
        levelCompleteScreen.classList.add('visible');
        renderLevelCompleteSummary(); 
    } else if (screenName === 'playing') {
        gameLayout.classList.remove('hidden');
        gameLayout.classList.add('visible');
        if (C.levelData && C.levelData[state.currentLevelIndex]) {
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
    } else if (screenName === 'levelLost') { 
        gameLayout.classList.remove('hidden'); 
        gameLayout.classList.add('visible');
        returnToMenuButtonGame.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        showUiMessage(state.currentMessage); 
        updateUiStats();
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
    clearTimeout(autoStartTimerId); 
    state.autoStartNextWaveEnabled = true; 
    GameLogic.setupLevel(levelIndex, startFromWave);
    showScreen('playing');
    if (animationFrameId === null) {
        gameLoop();
    }
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
    if (state.gameScreen === 'menu' || 
        state.gameScreen === 'levelSelection' || 
        state.gameScreen === 'credits') { 
        animationFrameId = null; 
        return;
    }

    if (state.gameScreen === 'levelCompleteScreen') {
        // Ekran podsumowania jest już wyświetlony przez showScreen, pętla gry nie jest tu potrzebna.
        // Ewentualne animacje na tym ekranie byłyby zarządzane przez GSAP bezpośrednio
        // przy jego pokazywaniu w renderLevelCompleteSummary lub osobnej funkcji.
        animationFrameId = null; 
        updateUiStats(); // Upewnij się, że statystyki w tle (jeśli widoczne) są OK.
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
        showUiMessage(state.currentMessage || "Pauza");
        animationFrameId = requestAnimationFrame(gameLoop); 
        return;
    }

    if (state.gameScreen === 'levelLost') { 
        Drawing.drawBackgroundAndPath(ctx); 
        Drawing.drawTowerSpots(ctx);
        renderGameObjectsSorted(); 
        Drawing.drawProjectiles(ctx); 
        Drawing.drawEffects(ctx);
        Drawing.drawUI(ctx);
        showUiMessage(state.currentMessage); 
        updateUiStats();
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
                        checkWaveCompletion(); 
                    }
                });
            }
        }

        GameLogic.updateEnemies(); 
        GameLogic.updateTowers(); 
        GameLogic.updateProjectiles();

        if (!state.showingWaveIntro) {
             GameLogic.handleWaveSpawning();
             if (state.currentWaveSpawnsLeft === 0 && state.enemies.filter(e => !e.isDying).length === 0 && state.waveInProgress) {
                 checkWaveCompletion();
             }
        } else if (state.waveIntroTimer <= 0 && !state.isPaused) {
            GameLogic.startNextWaveActual();
        }
        
        Drawing.drawBackgroundAndPath(ctx); 
        Drawing.drawTowerSpots(ctx);    
        renderGameObjectsSorted(); 
        Drawing.drawProjectiles(ctx); 
        Drawing.drawEffects(ctx);     
        Drawing.drawUI(ctx);          
        Drawing.drawWaveIntro(ctx);   

        updateUiStats(); 
        updateTowerUpgradePanel();
        if (state.messageTimer > 0 && state.currentMessage) {
            showUiMessage(state.currentMessage);
            if (!state.isPaused && state.currentMessage !== "Pauza") state.messageTimer--;
        } else if (state.messageTimer <= 0 && uiMessages.textContent !== "") {
            if (!(state.currentMessage === "Pauza" && state.isPaused)) { 
                showUiMessage(""); 
                state.currentMessage = ""; 
            }
        }
    }
    
    // Sprawdzanie po logice, czy stan gry się zmienił i wymaga reakcji (przejścia do ekranu)
    if (state.gameScreen === 'levelCompleteScreen' && animationFrameId !== null) {
        animationFrameId = null; 
        showScreen('levelCompleteScreen'); 
        return; 
    }
    if (state.gameScreen === 'levelLost' && animationFrameId !== null) {
        animationFrameId = null;
        showScreen('levelLost');
        return;
    }

    // Kontynuuj pętlę, jeśli żaden z powyższych warunków zatrzymania nie został spełniony
    // i gra nie jest w stanie, który sam zatrzymuje pętlę na początku.
    if (animationFrameId !== null) { // Dodatkowy warunek, aby upewnić się, że nie restartujemy już zatrzymanej pętli
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function checkWaveCompletion() {
    if (!state.waveInProgress) return;
    
    const activeOrAnimatingEnemies = state.enemies.filter(e => !e.isDeathAnimationStarted || e.currentAlpha > 0);

    if (activeOrAnimatingEnemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        state.waveInProgress = false; 
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber;
        Storage.saveGameProgress(state); 
        
        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            GameLogic.completeLevel(); // To ustawi state.gameScreen na 'levelCompleteScreen'
            // showScreen() zostanie wywołane w gameLoop po wykryciu zmiany stanu
        } else {
            Utils.showMessage(state, `Fala ${state.currentWaveNumber} pokonana! Następna za chwilę...`, 180);
            if (state.autoStartNextWaveEnabled) prepareAutoStartNextWave(5); 
        }
        updateUiStats(); 
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
        else { Utils.showMessage(state, `Rozpoczynanie fali...`, 60); GameLogic.prepareNextWave(); updateUiStats(); }
    }
    autoStartTimerId = setTimeout(countdownTick, 1000);
}

uiButtonBileter.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'bileter'; state.selectedTowerForUpgrade = null; updateTowerUpgradePanel(); updateSelectedTowerButtonUI(); }});
uiButtonOswietleniowiec.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { state.selectedTowerType = 'oswietleniowiec'; state.selectedTowerForUpgrade = null; updateTowerUpgradePanel(); updateSelectedTowerButtonUI(); }});
uiButtonUpgradeSatisfaction.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) { GameLogic.upgradeZadowolenie(); updateUiStats(); }});
uiButtonStartWave.addEventListener('click', () => { clearTimeout(autoStartTimerId); Utils.showMessage(state, ""); if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) { GameLogic.prepareNextWave(); updateUiStats(); }});
uiButtonUpgradeDamage.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'damage'); updateTowerUpgradePanel(); updateUiStats(); }});
uiButtonUpgradeFireRate.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.upgradeTower(state.selectedTowerForUpgrade, 'fireRate'); updateTowerUpgradePanel(); updateUiStats(); }});
uiButtonSellTower.addEventListener('click', () => { if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) { GameLogic.sellTower(state.selectedTowerForUpgrade); updateTowerUpgradePanel(); updateUiStats(); }});
pauseButton.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { GameLogic.togglePauseGame(); showScreen('paused'); }});
resumeButton.addEventListener('click', () => { if (state.isPaused) { GameLogic.togglePauseGame(); showScreen('playing'); if (!animationFrameId) gameLoop(); }});

function goToMainMenu() {
    clearTimeout(autoStartTimerId); 
    state.isPaused = false; state.gameOver = false;
    state.selectedTowerType = null; state.selectedTowerForUpgrade = null;
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
    const confirmed = await showCustomConfirm("Rozpocząć Nową Grę?", "Czy na pewno chcesz rozpocząć nową grę? Cały dotychczasowy postęp zostanie utracony.");
    if (confirmed) {
        clearTimeout(autoStartTimerId); state.autoStartNextWaveEnabled = true; 
        state.currentAplauzBonusForNextLevel = 0; 
        state.unlockedLevels = 1; state.levelProgress = {}; Storage.saveGameProgress(state);
        if (saveStatusMainMenu) saveStatusMainMenu.textContent = "Nowa gra rozpoczęta. Postęp wyczyszczony.";
        updateContinueButtonState();
        startGameLevel(0, 0); 
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
        if (clickedTower) { state.selectedTowerForUpgrade = clickedTower; state.selectedTowerType = null; updateTowerUpgradePanel(); updateSelectedTowerButtonUI(); return; }
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) { if (spot.occupied) Utils.showMessage(state, "To miejsce jest już zajęte!", 120); else if (!GameLogic.buildTower(gridX, gridY, state.selectedTowerType)) {}
            } else Utils.showMessage(state, "Tutaj nie można budować wieży.", 120);
            return; 
        }
        if (!clickedTower && !state.selectedTowerType) { state.selectedTowerForUpgrade = null; updateTowerUpgradePanel(); }
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
        console.log(`Tryb deweloperski: ${state.isDevModeActive}`);
        updateUiStats(); 
    }

    if (state.isDevModeActive && (state.gameScreen === 'playing' || state.gameScreen === 'paused') && !customConfirmOverlay.classList.contains('visible') ) { // Dodano sprawdzenie, czy dialog nie jest aktywny
        if (event.shiftKey && event.key === 'M') { 
            event.preventDefault();
            state.aplauz += 1000;
            Utils.showMessage(state, "+1000 Aplauzu (DEV)", 90);
            updateUiStats();
        } else if (event.shiftKey && event.key === 'W') { 
            event.preventDefault();
            if (state.waveInProgress || state.showingWaveIntro) {
                Utils.showMessage(state, "Kończenie obecnej fali... (DEV)", 90);
                state.enemies.forEach(enemy => enemy.hp = 0); 
                state.currentWaveSpawnsLeft = 0; 
                 // Pozwól logice w checkWaveCompletion/onComplete animacji zakończyć falę.
            } else if (state.currentWaveNumber < C.WAVES_PER_LEVEL && state.gameScreen === 'playing' && !state.gameOver) { // Upewnij się, że gra się toczy
                Utils.showMessage(state, "Przeskakiwanie do następnej fali... (DEV)", 90);
                clearTimeout(autoStartTimerId); // Anuluj automatyczny start, jeśli był
                GameLogic.prepareNextWave(); 
            } else {
                Utils.showMessage(state, "Nie można rozpocząć/przeskoczyć fali. (DEV)", 90);
            }
            updateUiStats();
        } else if (event.shiftKey && event.key === 'L') { 
            event.preventDefault();
            state.unlockedLevels = C.levelData.length;
            C.levelData.forEach((level, index) => {
                state.levelProgress[index] = C.WAVES_PER_LEVEL;
            });
            Storage.saveGameProgress(state);
            Utils.showMessage(state, "Wszystkie akty odblokowane i ukończone! (DEV)", 120);
            if (state.gameScreen === 'playing' && !state.gameOver) GameLogic.completeLevel(); // To ustawi gameScreen na 'levelCompleteScreen'
            else if (state.gameScreen !== 'menu') showScreen('menu'); // Jeśli nie w grze, wróć do menu po odblokowaniu
            updateUiStats();
        } else if (event.shiftKey && event.key === 'H') { 
             event.preventDefault();
             state.zadowolenieWidowni = state.maxZadowolenieWidowni;
             Utils.showMessage(state, "Zadowolenie przywrócone! (DEV)", 90);
             updateUiStats();
        }
    }
});


preloadImagesAndStart();