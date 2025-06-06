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

// Referencje do elementów ekranu ładowania
const loadingScreen = document.getElementById('loadingScreen');
const loadingLogo = document.getElementById('loadingLogo');
const loadingText = document.getElementById('loadingText');
const mainMenuScreen = document.getElementById('mainMenu'); // Potrzebne do pokazania po załadowaniu

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
        setTimeout(() => { customConfirmOverlay.classList.add('hidden'); }, 300);
    }
    confirmResolve = null;
}

customConfirmOkButton.addEventListener('click', () => { if (confirmResolve) confirmResolve(true); hideCustomConfirm(); });
customConfirmCancelButton.addEventListener('click', () => { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); });
customConfirmOverlay.addEventListener('click', (event) => { if (event.target === customConfirmOverlay) { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); }});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && customConfirmOverlay?.classList.contains('visible')) { if (confirmResolve) confirmResolve(false); hideCustomConfirm(); }});

export function startGameLevel(levelIndex, startFromWave = 0) {
    console.log(`[main.js startGameLevel] Called with levelIndex: ${levelIndex}, startFromWave: ${startFromWave}`);
    clearTimeout(autoStartTimerId);
    state.autoStartNextWaveEnabled = true;
    GameLogic.setupLevel(levelIndex, startFromWave);
    ScreenManager.showScreen('playing'); // ScreenManager zajmie się ukryciem menu
    UIManager.updateUiStats();
    UIManager.updateTowerUpgradePanel();
    UIManager.updateSelectedTowerButtonUI();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    gameLoop();
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

function finishLoadingAndShowMenu() {
    if (loadingScreen && loadingLogo && loadingText) {
        const tl = gsap.timeline({
            onComplete: () => {
                if (loadingScreen) loadingScreen.style.display = 'none';
                ScreenManager.showScreen('menu'); // Pokaż menu główne
                updateContinueButtonState();
                
                // Inicjalizacja particles.js Z POPRAWNĄ KONFIGURACJĄ
                if (typeof particlesJS !== 'undefined') {
                    particlesJS('particles-js', {
                        "particles": {
                            "number": {
                                "value": 60, 
                                "density": {
                                    "enable": true,
                                    "value_area": 800
                                }
                            },
                            "color": {
                                "value": "#ffd700" // Złoty kolor
                            },
                            "shape": {
                                "type": "circle",
                                "stroke": {
                                    "width": 0,
                                    "color": "#000000"
                                },
                                "polygon": {
                                    "nb_sides": 5
                                }
                            },
                            "opacity": {
                                "value": 0.4, 
                                "random": true,
                                "anim": {
                                    "enable": true, 
                                    "speed": 0.8,
                                    "opacity_min": 0.1,
                                    "sync": false
                                }
                            },
                            "size": {
                                "value": 2.5, // Małe cząsteczki
                                "random": true,
                                "anim": {
                                    "enable": false, 
                                    "speed": 40,
                                    "size_min": 0.1,
                                    "sync": false
                                }
                            },
                            "line_linked": {
                                "enable": false // Linie wyłączone
                            },
                            "move": {
                                "enable": true,
                                "speed": 1.2, 
                                "direction": "top-right", 
                                "random": true,
                                "straight": false,
                                "out_mode": "out",
                                "bounce": false,
                                "attract": {
                                    "enable": false,
                                    "rotateX": 600,
                                    "rotateY": 1200
                                }
                            }
                        },
                        "interactivity": {
                            "detect_on": "canvas",
                            "events": {
                                "onhover": {
                                    "enable": false, 
                                    "mode": "repulse"
                                },
                                "onclick": {
                                    "enable": false, 
                                    "mode": "push"
                                },
                                "resize": true
                            },
                            "modes": {
                                "grab": {"distance": 400, "line_linked": {"opacity": 1}},
                                "bubble": {"distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3},
                                "repulse": {"distance": 200, "duration": 0.4},
                                "push": {"particles_nb": 4},
                                "remove": {"particles_nb": 2}
                            }
                        },
                        "retina_detect": true
                    });
                    console.log("Particles.js initialized after loading screen with gold config.");
                } else {
                    console.warn("Particles.js library not found for init after loading.");
                }
            }
        });

        tl.to([loadingLogo, loadingText], { 
            opacity: 0, 
            y: -30, 
            duration: 0.4, 
            ease: "power1.in", 
            stagger: 0.1 
        }, "+=0.5") 
        .to(loadingScreen, { 
            opacity: 0, 
            duration: 0.6, 
            ease: "power1.inOut"
        }, "-=0.2"); 

    } else { 
        ScreenManager.showScreen('menu');
        updateContinueButtonState();
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', { /* ... Twoja konfiguracja particles.js ... */ });
        }
    }
    canvas.width = C.COLS * C.TILE_SIZE;
    canvas.height = C.ROWS * C.TILE_SIZE;
}


function preloadImagesAndStart() {
    Storage.loadGameProgress(state);
    setTotalImagesToLoad(Object.keys(C.imageSources).length);

    if (totalImagesToLoad === 0) {
        finishLoadingAndShowMenu(); 
        return;
    }

    if (loadingScreen) loadingScreen.style.display = 'flex';
    if (mainMenuScreen) mainMenuScreen.classList.add('hidden'); 

    for (const key in C.imageSources) {
        images[key] = new Image();
        images[key].src = C.imageSources[key];
        images[key].onload = () => {
            console.log(`Image loaded: ${key} from ${images[key].src}`);
            images[key].error = false;
            incrementImagesLoadedCount();
            if (imagesLoadedCount === totalImagesToLoad) {
                console.log("All images loaded. Finishing loading sequence.");
                finishLoadingAndShowMenu(); 
            }
        };
        images[key].onerror = (e) => {
            console.error(`Błąd ładowania obrazka: ${key} z ${C.imageSources[key]}`, e);
            images[key].error = true;
            incrementImagesLoadedCount();
            if (imagesLoadedCount === totalImagesToLoad) {
                console.log("All images attempted to load (some with errors). Finishing loading sequence.");
                finishLoadingAndShowMenu();
            }
        }
    }
}


let animationFrameId = null;
let autoStartTimerId = null;
let autoStartCountdown = 0;

function gameLoop() {
    if (state.gameScreen === 'menu' || state.gameScreen === 'levelSelection' || state.gameScreen === 'credits' || state.gameScreen === 'levelCompleteScreen') {
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        Drawing.drawTiledBackground(ctx); 
        Drawing.drawLevelCompleteSummary(ctx); 
        UIManager.updateUiStats(); 
    } else if (state.gameScreen === 'levelLost') {
        Drawing.drawTiledBackground(ctx);
        renderGameObjectsSorted(); 
        Drawing.drawTextWithOutline(ctx, "KONIEC GRY!", canvas.width / 2, canvas.height / 2 - 40, "bold 48px Georgia", "red", "black", 4);
        Drawing.drawTextWithOutline(ctx, "Premiera tego aktu zrujnowana...", canvas.width / 2, canvas.height / 2 + 10, "bold 22px Georgia", "white", "black");
        UIManager.updateUiStats();
    } else if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
        if (state.isPaused && state.gameScreen === 'paused') {
            Drawing.drawTiledBackground(ctx);
            Drawing.drawTowerSpots(ctx);
            renderGameObjectsSorted();
            Drawing.drawProjectiles(ctx);
            Drawing.drawEffects(ctx);
            Drawing.drawUI(ctx); 
            if(state.showingWaveIntro) Drawing.drawWaveIntro(ctx); 
            UIManager.showUiMessage(state.currentMessage || "Pauza"); 
            UIManager.updateUiStats();
        } else if (state.gameScreen === 'playing' && !state.isPaused) { 
            state.towers.forEach(tower => {
                if (tower.isAnimatingIn) {
                    tower.isAnimatingIn = false;
                    gsap.to(tower, { duration: 0.6, currentScale: 1, currentAlpha: 1, currentRotation: 0, ease: "back.out(1.7)" });
                }
                if (tower.justUpgraded && !tower.upgradeAnimation) {
                    tower.upgradeAnimation = gsap.timeline({onComplete: () => {
                        tower.justUpgraded = false;
                        tower.upgradeAnimation = null; 
                        tower.upgradeFlashAlpha = 0; 
                        tower.upgradePulseScale = 1; 
                    }})
                    .to(tower, { upgradeFlashAlpha: 0.7, duration: 0.15, yoyo: true, repeat: 1 }) 
                    .to(tower, { upgradePulseScale: 1.15, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, "-=0.2"); 
                }
            });
            for (let i = state.effects.length - 1; i >= 0; i--) {
                const effect = state.effects[i];
                if (effect.isNew && !effect.isDebuffCloud) { 
                    effect.isNew = false;
                    gsap.to(effect, {
                        duration: (effect.durationFrames || 20) / 60, 
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
                        currentScale: (enemy.currentScale !== undefined ? enemy.currentScale : 1) * 0.3, 
                        ease: "power2.in",
                        onComplete: () => { const index = state.enemies.indexOf(enemy); if (index > -1) state.enemies.splice(index, 1); checkWaveCompletion(); }
                    });
                }
            }

            if (state.showingWaveIntro) {
                state.waveIntroTimer--;
                if (state.waveIntroTimer <= 0) {
                    GameLogic.startNextWaveActual();
                }
            } else if (state.waveInProgress) {
                GameLogic.handleWaveSpawning();
            }

            GameLogic.updateEnemies();
            GameLogic.updateTowers();
            GameLogic.updateProjectiles();

            Drawing.drawTiledBackground(ctx);
            Drawing.drawTowerSpots(ctx);
            renderGameObjectsSorted(); 
            Drawing.drawProjectiles(ctx);
            Drawing.drawEffects(ctx);
            Drawing.drawUI(ctx); 
            if(state.showingWaveIntro) Drawing.drawWaveIntro(ctx); 

            UIManager.updateUiStats();
            UIManager.updateTowerUpgradePanel();
            if (state.messageTimer > 0 && state.currentMessage) {
                UIManager.showUiMessage(state.currentMessage);
                if (!state.isPaused && state.currentMessage !== "Pauza") state.messageTimer--;
            } else if (state.messageTimer <= 0 && document.getElementById('uiMessages').textContent !== "") {
                if (!(state.currentMessage === "Pauza" && state.isPaused)) {
                    UIManager.showUiMessage(""); state.currentMessage = "";
                }
            }
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop); 
}

const renderGameObjectsSorted = () => {
    const gameObjectsToRender = [];
    state.towers.forEach(t => gameObjectsToRender.push({ ...t, entityType: 'tower', renderY: t.y + C.TILE_SIZE / 2 }));
    state.enemies.forEach(e => {
        const enemyFeetY = e.y + (e.height * (e.currentScale !== undefined ? e.currentScale : 1)) / 2;
        gameObjectsToRender.push({ ...e, entityType: 'enemy', renderY: enemyFeetY });
    });
    if (state.currentPath && state.currentPath.length > 0) {
        const baseNode = state.currentPath[state.currentPath.length -1];
        if (baseNode) {
            const baseImg = images.teatrBase;
            let baseRenderHeight = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
            if (baseImg && !baseImg.error && baseImg.width > 0 && baseImg.height > 0) {
                 const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
                 baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
            }
            gameObjectsToRender.push({
                entityType: 'base', draw: () => Drawing.drawTheaterBase(ctx),
                renderY: (baseNode.y + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8 + baseRenderHeight
            });
        }
    }

    gameObjectsToRender.sort((a, b) => a.renderY - b.renderY);

    gameObjectsToRender.forEach(obj => {
        if (obj.entityType === 'tower') Drawing.drawSingleTower(ctx, obj);
        else if (obj.entityType === 'enemy') Drawing.drawSingleEnemy(ctx, obj);
        else if (obj.entityType === 'base') obj.draw();
    });
};

function checkWaveCompletion() {
    if (!state.waveInProgress) return;

    const activeOrAnimatingEnemies = state.enemies.filter(e => !e.isDeathAnimationStarted || (e.isDeathAnimationStarted && e.currentAlpha > 0));

    if (activeOrAnimatingEnemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        console.log(`[main.js checkWaveCompletion] All enemies cleared for wave (0-indexed): ${state.currentWaveNumber}. Displayed as: ${state.currentWaveNumber + 1}.`);
        state.waveInProgress = false;
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber;
        Storage.saveGameProgress(state);
        state.currentWaveNumber++;
        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            console.log(`[main.js checkWaveCompletion] All waves completed for level ${state.currentLevelIndex + 1}. Current wave number now: ${state.currentWaveNumber}`);
            GameLogic.completeLevel();
        } else {
            Utils.showMessage(state, `Fala ${state.currentWaveNumber} pokonana! Następna (${state.currentWaveNumber + 1}) za chwilę...`, 180);
            if (state.autoStartNextWaveEnabled) prepareAutoStartNextWave(5);
        }
        UIManager.updateUiStats();
    }
}

function prepareAutoStartNextWave(seconds) {
    if (state.gameOver || state.gameScreen !== 'playing' || state.isPaused || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
        clearTimeout(autoStartTimerId); return;
    }
    clearTimeout(autoStartTimerId);
    autoStartCountdown = seconds;
    Utils.showMessage(state, `Następna fala (${state.currentWaveNumber + 1}) za: ${autoStartCountdown}s`, 65 * seconds + 100);

    function countdownTick() {
        if (state.isPaused || state.gameScreen !== 'playing' || state.waveInProgress || state.showingWaveIntro || state.gameOver) {
            Utils.showMessage(state, "");
            clearTimeout(autoStartTimerId); return;
        }
        autoStartCountdown--;
        Utils.showMessage(state, `Następna fala (${state.currentWaveNumber + 1}) za: ${autoStartCountdown}s`, 65);
        if (autoStartCountdown > 0) {
            autoStartTimerId = setTimeout(countdownTick, 1000);
        } else {
            Utils.showMessage(state, `Rozpoczynanie fali ${state.currentWaveNumber + 1}...`, 60);
            GameLogic.prepareNextWave();
            UIManager.updateUiStats();
        }
    }
    autoStartTimerId = setTimeout(countdownTick, 1000);
}

function stopTowerAnimations(tower) {
    if (tower) {
        if (tower.rangePulseAnimation) {
            tower.rangePulseAnimation.kill();
            tower.rangePulseAnimation = null;
        }
        if (tower.selectionPulseAnimation) {
            tower.selectionPulseAnimation.kill();
            tower.selectionPulseAnimation = null;
        }
        tower.animatedRangeRadius = tower.range;
        tower.animatedRangeAlpha = 0.5; 
        tower.selectionHighlightAlpha = 0.9; 
        tower.selectionHighlightPadding = 2; 
    }
}

function startTowerAnimations(tower) {
    if (tower) {
        if (!tower.rangePulseAnimation) {
            tower.animatedRangeRadius = tower.range * 0.95; 
            tower.animatedRangeAlpha = 0.3;
            tower.rangePulseAnimation = gsap.timeline({ repeat: -1, yoyo: true })
                .to(tower, { animatedRangeRadius: tower.range * 1.05, duration: 1.2, ease: "sine.inOut" })
                .to(tower, { animatedRangeAlpha: 0.6, duration: 1.2, ease: "sine.inOut" }, "<"); 
        }
        if (!tower.selectionPulseAnimation) {
            tower.selectionHighlightAlpha = 0.6;
            tower.selectionHighlightPadding = 1;
            tower.selectionPulseAnimation = gsap.timeline({ repeat: -1, yoyo: true })
                .to(tower, { selectionHighlightAlpha: 1, duration: 0.8, ease: "power1.inOut" })
                .to(tower, { selectionHighlightPadding: 3, duration: 0.8, ease: "power1.inOut" }, "<");
        }
    }
}

uiButtonBileter.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { stopTowerAnimations(state.selectedTowerForUpgrade); state.selectedTowerType = 'bileter'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonOswietleniowiec.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { stopTowerAnimations(state.selectedTowerForUpgrade); state.selectedTowerType = 'oswietleniowiec'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonGarderobiana.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { stopTowerAnimations(state.selectedTowerForUpgrade); state.selectedTowerType = 'garderobiana'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});
uiButtonBudkaInspicjenta.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { stopTowerAnimations(state.selectedTowerForUpgrade); state.selectedTowerType = 'budkaInspicjenta'; state.selectedTowerForUpgrade = null; UIManager.updateTowerUpgradePanel(); UIManager.updateSelectedTowerButtonUI(); }});

uiButtonUpgradeSatisfaction.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused && state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) { GameLogic.upgradeZadowolenie(); UIManager.updateUiStats(); }});
uiButtonStartWave.addEventListener('click', () => {
    clearTimeout(autoStartTimerId); Utils.showMessage(state, "");
    if (state.gameScreen === 'playing' && !state.isPaused && !state.waveInProgress && !state.showingWaveIntro && !state.gameOver && state.currentWaveNumber < C.WAVES_PER_LEVEL) {
        GameLogic.prepareNextWave(); UIManager.updateUiStats();
    }
});

function handleUpgradeButtonClick(upgradeKey) {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        const success = GameLogic.upgradeTower(state.selectedTowerForUpgrade, upgradeKey); 
        if (success) {
            // Flaga justUpgraded jest ustawiana w GameLogic.upgradeTower
        }
        UIManager.updateTowerUpgradePanel();
        UIManager.updateUiStats();
    }
}

uiButtonUpgradeDamage.addEventListener('click', () => handleUpgradeButtonClick('damage'));
uiButtonUpgradeFireRate.addEventListener('click', () => handleUpgradeButtonClick('fireRate'));

uiButtonUpgradeSpecial1.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        const towerDef = C.towerDefinitions[state.selectedTowerForUpgrade.type];
        let specialUpgradeKey = null;
        let specialIndex = 0;
        for (const key of towerDef.upgradeLevelNames || []) {
            if (key !== 'damage' && key !== 'fireRate') {
                if (specialIndex === 0) {
                    specialUpgradeKey = key;
                    break;
                }
                specialIndex++;
            }
        }
        if(specialUpgradeKey) handleUpgradeButtonClick(specialUpgradeKey);
    }
});
uiButtonUpgradeSpecial2.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        const towerDef = C.towerDefinitions[state.selectedTowerForUpgrade.type];
        let specialUpgradeKey = null;
        let specialIndex = 0;
        for (const key of towerDef.upgradeLevelNames || []) {
            if (key !== 'damage' && key !== 'fireRate') {
                if (specialIndex === 1) {
                    specialUpgradeKey = key;
                    break;
                }
                specialIndex++;
            }
        }
        if(specialUpgradeKey) handleUpgradeButtonClick(specialUpgradeKey);
    }
});

uiButtonSellTower.addEventListener('click', () => {
    if (state.selectedTowerForUpgrade && state.gameScreen === 'playing' && !state.isPaused) {
        stopTowerAnimations(state.selectedTowerForUpgrade); 
        GameLogic.sellTower(state.selectedTowerForUpgrade);
        UIManager.updateTowerUpgradePanel();
        UIManager.updateUiStats();
    }
});
pauseButton.addEventListener('click', () => { if (state.gameScreen === 'playing' && !state.isPaused) { GameLogic.togglePauseGame(); ScreenManager.showScreen('paused'); }});
resumeButton.addEventListener('click', () => { if (state.isPaused) { GameLogic.togglePauseGame(); ScreenManager.showScreen('playing'); if (animationFrameId === null) gameLoop(); }});

export function goToMainMenu() {
    clearTimeout(autoStartTimerId);
    stopTowerAnimations(state.selectedTowerForUpgrade); 
    state.isPaused = false; state.gameOver = false; state.selectedTowerType = null; state.selectedTowerForUpgrade = null; state.showingLevelCompleteSummary = false; state.levelCompleteButtons = [];
    if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null;
    ScreenManager.showScreen('menu'); updateContinueButtonState();
}
returnToMenuButtonGame.addEventListener('click', goToMainMenu);
menuFromPauseButton.addEventListener('click', goToMainMenu);

continueGameButton.addEventListener('click', () => { if (!continueGameButton.disabled) ScreenManager.showScreen('levelSelection'); });
newGameButtonFromMenu.addEventListener('click', async () => {
    const confirmed = await showCustomConfirm("Rozpocząć Nową Grę?", "Czy na pewno chcesz rozpocząć nową grę? Cały dotychczasowy postęp zostanie utracony.");
    if (confirmed) {
        clearTimeout(autoStartTimerId); state.autoStartNextWaveEnabled = true; state.currentAplauzBonusForNextLevel = 0; state.unlockedLevels = 1; state.levelProgress = {}; Storage.saveGameProgress(state);
        if (saveStatusMainMenu) saveStatusMainMenu.textContent = "Nowa gra rozpoczęta. Postęp wyczyszczony.";
        updateContinueButtonState(); startGameLevel(0, 0);
    }
});
levelSelectButton.addEventListener('click', () => ScreenManager.showScreen('levelSelection'));
creditsButton.addEventListener('click', () => ScreenManager.showScreen('credits'));
backToMainMenuFromLevelSelection.addEventListener('click', () => ScreenManager.showScreen('menu'));
backToMainMenuFromCredits.addEventListener('click', () => ScreenManager.showScreen('menu'));

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;

    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        if (state.levelCompleteButtons?.length > 0) {
            state.levelCompleteButtons.forEach(button => {
                if (clickX >= button.x && clickX <= button.x + button.width && clickY >= button.y && clickY <= button.y + button.height) {
                    if (button.id === 'nextLevel') {
                        if (state.currentLevelIndex < C.levelData.length - 1) startGameLevel(state.currentLevelIndex + 1, 0);
                        else goToMainMenu();
                    } else if (button.id === 'mainMenu') goToMainMenu();
                }
            });
        }
        return;
    }

    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') return;

    const gridX = Math.floor(clickX / C.TILE_SIZE); const gridY = Math.floor(clickY / C.TILE_SIZE);
    if (gridY < C.ROWS && gridX < C.COLS && gridY >= 0 && gridX >= 0) {
        const clickedTower = state.towers.find(t => t.xGrid === gridX && t.yGrid === gridY);
        
        if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade !== clickedTower) {
            stopTowerAnimations(state.selectedTowerForUpgrade); 
        }

        if (clickedTower) {
            state.selectedTowerForUpgrade = clickedTower;
            state.selectedTowerType = null;
            startTowerAnimations(clickedTower); 
            UIManager.updateTowerUpgradePanel();
            UIManager.updateSelectedTowerButtonUI();
            return;
        }
        if (state.selectedTowerType) {
            const spot = state.currentTowerSpots.find(s => s.x === gridX && s.y === gridY);
            if (spot) {
                if (spot.occupied) Utils.showMessage(state, "To miejsce jest już zajęte!", 120);
                else GameLogic.buildTower(gridX, gridY, state.selectedTowerType);
            } else Utils.showMessage(state, "Tutaj nie można budować wieży.", 120);
            return;
        }
        if (!clickedTower && !state.selectedTowerType) {
            stopTowerAnimations(state.selectedTowerForUpgrade); 
            state.selectedTowerForUpgrade = null;
            UIManager.updateTowerUpgradePanel();
        }
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (state.gameScreen === 'levelCompleteCanvas' && state.showingLevelCompleteSummary) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; let onButton = false;
        if (state.levelCompleteButtons?.length > 0) {
            state.levelCompleteButtons.forEach(button => { if (mouseX >= button.x && mouseX <= button.x + button.width && mouseY >= button.y && mouseY <= button.y + button.height) onButton = true; });
        }
        canvas.style.cursor = onButton ? 'pointer' : 'default'; return;
    }

    if (state.gameOver || state.showingWaveIntro || state.isPaused || state.gameScreen !== 'playing') { canvas.style.cursor = 'default'; return; }

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; let onCanvasActionable = false;
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

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'D') {
        event.preventDefault(); state.isDevModeActive = !state.isDevModeActive;
        Utils.showMessage(state, `Tryb deweloperski ${state.isDevModeActive ? 'AKTYWNY' : 'WYŁĄCZONY'}`, 120); UIManager.updateUiStats();
    }

    if (state.isDevModeActive && customConfirmOverlay && !customConfirmOverlay.classList.contains('visible')) {
        if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
            if (event.shiftKey && event.key === 'M') {
                event.preventDefault(); state.aplauz += 1000; Utils.showMessage(state, "+1000 Aplauzu (DEV)", 90); UIManager.updateUiStats();
            }
            else if (event.shiftKey && event.key === 'W') {
                event.preventDefault();
                if (state.waveInProgress || state.showingWaveIntro) {
                    Utils.showMessage(state, "Kończenie obecnej fali... (DEV)", 90);
                    state.enemies.forEach(enemy => enemy.hp = 0);
                    state.currentWaveSpawnsLeft = 0;
                } else if (state.currentWaveNumber < C.WAVES_PER_LEVEL && !state.gameOver && !state.isPaused) {
                    Utils.showMessage(state, "Przeskakiwanie do następnej fali... (DEV)", 90);
                    clearTimeout(autoStartTimerId);
                    GameLogic.prepareNextWave();
                } else {
                    Utils.showMessage(state, "Nie można rozpocząć/przeskoczyć fali. (DEV)", 90);
                }
                UIManager.updateUiStats();
            }  else if (event.shiftKey && event.key === 'H') {
                event.preventDefault(); state.zadowolenieWidowni = state.maxZadowolenieWidowni;
                Utils.showMessage(state, "Zadowolenie przywrócone! (DEV)", 90); UIManager.updateUiStats();
            }
        }
        if (event.shiftKey && event.key === 'L') {
            event.preventDefault(); Utils.showMessage(state, "Wszystkie akty odblokowane i ukończone! (DEV)", 120);
            state.unlockedLevels = C.levelData.length;
            C.levelData.forEach((level, index) => { state.levelProgress[index] = C.WAVES_PER_LEVEL; });
            Storage.saveGameProgress(state);
            if ((state.gameScreen === 'playing' || state.gameScreen === 'paused') && !state.gameOver) GameLogic.completeLevel();
            else if (state.gameScreen !== 'menu' && state.gameScreen !== 'levelCompleteCanvas' && state.gameScreen !== 'levelLost') goToMainMenu();
            else if (state.gameScreen === 'menu') updateContinueButtonState();
            else if (state.gameScreen === 'levelSelection') ScreenManager.renderLevelSelection();
        }
    }
});

// Rozpocznij ładowanie zasobów i pokaż ekran ładowania
preloadImagesAndStart();
