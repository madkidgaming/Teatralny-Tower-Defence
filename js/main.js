import * as C from './config.js';
import { gameState as state, images, incrementImagesLoadedCount, imagesLoadedCount, totalImagesToLoad, setTotalImagesToLoad } from './state.js';
import * as Utils from './utils.js';
import * as Drawing from './drawing.js';
import * as GameLogic from './gameLogic.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentActHeader = document.getElementById('currentActHeader');

GameLogic.setCurrentActHeaderRef(currentActHeader); // Przekaż referencję do gameLogic

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
    state.uiRegions.fullscreenButton = {
        x: canvas.width - C.UI_PADDING - 40,
        y: C.UI_PADDING + 45 + C.UI_PADDING,
        width: 40,
        height: 30,
        label: "FS"
    };
}


function preloadImagesAndStart() {
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
    initializeUiRegions(); // UI Regions zależą od wymiarów canvasa
    
    GameLogic.setupLevel(0);
    gameLoop();
}

function gameLoop() {
    if (state.gameOver) {
        Drawing.drawGameOverScreen(ctx);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Drawing.drawBackgroundAndPath(ctx);
    Drawing.drawTheaterBase(ctx);
    Drawing.drawTowerSpots(ctx);

    GameLogic.updateEnemies();
    Drawing.drawEnemies(ctx);

    GameLogic.updateTowers();
    Drawing.drawTowers(ctx);

    GameLogic.updateProjectiles();
    Drawing.drawProjectiles(ctx);

    if (!state.showingWaveIntro) {
        GameLogic.handleWaveSpawning();
    } else {
        // Sprawdzenie czy timer intro dobiegł końca - przeniesione z drawing.js
        if (state.waveIntroTimer <= 0) {
            GameLogic.startNextWaveActual();
        }
    }

    Drawing.drawUI(ctx);
    Drawing.drawWaveIntro(ctx);

    requestAnimationFrame(gameLoop);
}


// --- Event Listeners ---
canvas.addEventListener('click', (event) => {
    if (state.gameOver || state.showingWaveIntro) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let uiClicked = false;

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
        // Sprawdzenie czy kliknięto poza panelem ulepszeń, jeśli tak, zamknij panel
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
            if (key !== 'upgradeZadowolenieButton' && key !== 'fullscreenButton' && !(state.selectedTowerForUpgrade && key.startsWith("towerButton"))) {
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
            } else if (key === "fullscreenButton") {
                Utils.toggleFullscreen(canvas);
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
    if (state.gameOver || state.showingWaveIntro) {
        canvas.style.cursor = 'default';
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let onButtonClickable = false;

    for (const key in state.uiRegions) {
        const region = state.uiRegions[key];
         if (region && (key.startsWith("towerButton") || key === "startWaveButton" || key === "upgradeZadowolenieButton" || key === "fullscreenButton")) {
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


// Start gry
preloadImagesAndStart();