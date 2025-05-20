import * as C from './config.js';
import { images, gameState as state } from './state.js';
import { drawTextWithOutline } from './utils.js';

// ... (drawBackgroundAndPath, drawTheaterBase, drawTowerSpots, drawEnemies, drawTowers, drawProjectiles, drawWaveIntro) ...
// Wszystkie te funkcje pozostają takie same.

// Funkcja drawUI może wymagać drobnej modyfikacji, jeśli np. przycisk fullscreen był w niej rysowany.
// Obecnie nie ma takiej potrzeby, bo przyciski pauzy itp. są elementami HTML.
export function drawUI(ctx) {
    if (state.showingWaveIntro) return;
    
    // Górny panel statystyk
    ctx.fillStyle = "rgba(40, 20, 10, 0.85)";
    ctx.fillRect(0, 0, ctx.canvas.width, 45); 

    ctx.textAlign = "left";
    drawTextWithOutline(ctx, `Aplauz: ${state.aplauz}`, C.UI_PADDING, 30, C.UI_FONT_LARGE, "#FFD700", "rgba(0,0,0,0.8)");
    ctx.textAlign = "center";
    drawTextWithOutline(ctx, `Fala: ${state.currentWaveNumber}/${C.WAVES_PER_LEVEL}`, ctx.canvas.width / 2, 30, C.UI_FONT_LARGE, "#FFF", "rgba(0,0,0,0.8)");
    ctx.textAlign = "right";
    drawTextWithOutline(ctx, `Zadowolenie: ${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`, ctx.canvas.width - C.UI_PADDING, 30, C.UI_FONT_LARGE, "#FFD700", "rgba(0,0,0,0.8)");

    // Dolny panel UI
    ctx.fillStyle = "rgba(40, 20, 10, 0.85)"; 
    ctx.fillRect(0, ctx.canvas.height - C.UI_BOTTOM_PANEL_HEIGHT, ctx.canvas.width, C.UI_BOTTOM_PANEL_HEIGHT);

    // Przyciski wież i ulepszenia Zadowolenia
    for (const key in state.uiRegions) {
        if (key.startsWith("towerButton") && state.uiRegions[key]) {
            // ... (logika rysowania przycisków wież - bez zmian) ...
            const region = state.uiRegions[key];
            const towerDef = C.towerDefinitions[region.type];
            const img = images[towerDef.imageKey];

            ctx.fillStyle = (state.selectedTowerType === region.type) ? "#c8763b" : "#8B4513"; 
            ctx.fillRect(region.x, region.y, region.width, region.height);
            ctx.strokeStyle = "#54311a"; 
            ctx.lineWidth = 2;
            ctx.strokeRect(region.x, region.y, region.width, region.height);
            ctx.lineWidth = 1;

            const iconSize = C.UI_BUTTON_HEIGHT * 0.55; 
            const iconYOffset = (C.UI_BUTTON_HEIGHT - iconSize) / 2;
            const iconX = region.x + C.UI_PADDING / 2; 

            if (img && !img.error) {
                ctx.drawImage(img, iconX, region.y + iconYOffset, iconSize, iconSize);
            }
            
            const textX = iconX + iconSize + 6; 
            ctx.textAlign = "left";
            ctx.textBaseline = "middle"; 
            drawTextWithOutline(ctx, region.label, textX, region.y + C.UI_BUTTON_HEIGHT / 2 - 7, C.UI_FONT_MEDIUM, "#FFFFFF", "rgba(0,0,0,0.7)");
            drawTextWithOutline(ctx, `Koszt: ${towerDef.cost}`, textX, region.y + C.UI_BUTTON_HEIGHT / 2 + 13, C.UI_FONT_SMALL, "#FFFFAA", "rgba(0,0,0,0.7)");
            ctx.textBaseline = "alphabetic"; 
        }
    }
            
    const zadowolenieRegion = state.uiRegions.upgradeZadowolenieButton;
    if(zadowolenieRegion){
        // ... (logika rysowania przycisku zadowolenia - bez zmian) ...
        let zadowolenieUpgradeCostText = "MAX";
        let zadowolenieButtonColor = "#555"; 
        if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
            const nextZadowolenieUpgrade = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel];
            zadowolenieUpgradeCostText = `(${nextZadowolenieUpgrade.cost} Ap.)`;
            zadowolenieButtonColor = state.aplauz >= nextZadowolenieUpgrade.cost ? "#3f51b5" : "#777"; 
        }
        ctx.fillStyle = zadowolenieButtonColor;
        ctx.fillRect(zadowolenieRegion.x, zadowolenieRegion.y, zadowolenieRegion.width, zadowolenieRegion.height);
        ctx.strokeStyle = "#2c387e";
        ctx.lineWidth = 2;
        ctx.strokeRect(zadowolenieRegion.x, zadowolenieRegion.y, zadowolenieRegion.width, zadowolenieRegion.height);
        ctx.lineWidth = 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawTextWithOutline(ctx, zadowolenieRegion.label, zadowolenieRegion.x + zadowolenieRegion.width / 2, zadowolenieRegion.y + zadowolenieRegion.height / 2 - 7, C.UI_FONT_MEDIUM, "#FFFFFF", "rgba(0,0,0,0.7)");
        drawTextWithOutline(ctx, zadowolenieUpgradeCostText, zadowolenieRegion.x + zadowolenieRegion.width / 2, zadowolenieRegion.y + zadowolenieRegion.height / 2 + 13, C.UI_FONT_SMALL, "#FFFFAA", "rgba(0,0,0,0.7)");
    }

    const startRegion = state.uiRegions.startWaveButton;
    if(startRegion) {
        // ... (logika rysowania przycisku start fali - bez zmian) ...
        const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro; 
        ctx.fillStyle = isStartWaveDisabled ? "#555" : "#c00";
        ctx.fillRect(startRegion.x, startRegion.y, startRegion.width, startRegion.height);
        ctx.strokeStyle = "#800";
        ctx.lineWidth = 2;
        ctx.strokeRect(startRegion.x, startRegion.y, startRegion.width, startRegion.height);
        ctx.lineWidth = 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawTextWithOutline(ctx, startRegion.label, startRegion.x + startRegion.width / 2, startRegion.y + startRegion.height / 2, C.UI_FONT_MEDIUM, "#FFFFFF", "rgba(0,0,0,0.7)");
        ctx.textBaseline = "alphabetic"; 
    }

    // Panel ulepszeń wieży
    if (state.selectedTowerForUpgrade) {
        // ... (logika rysowania panelu ulepszeń - bez zmian) ...
        const tower = state.selectedTowerForUpgrade;
        const panelX = tower.x - C.UPGRADE_PANEL_WIDTH / 2;
        const panelY = Math.max(C.UI_PADDING + 45, tower.y - tower.definition.renderSize / 2 - C.UPGRADE_PANEL_HEIGHT - C.UI_PADDING); 

        ctx.fillStyle = "rgba(50, 30, 20, 0.95)"; 
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.fillRect(panelX, panelY, C.UPGRADE_PANEL_WIDTH, C.UPGRADE_PANEL_HEIGHT);
        ctx.strokeRect(panelX, panelY, C.UPGRADE_PANEL_WIDTH, C.UPGRADE_PANEL_HEIGHT);
        ctx.lineWidth = 1;

        ctx.textAlign = "center";
        const towerName = tower.definition.imageKey === 'bileterTowerIcon' ? 'Bileter' : 'Reflektor';
        drawTextWithOutline(ctx, `${towerName} (Poziomy)`, panelX + C.UPGRADE_PANEL_WIDTH / 2, panelY + 20, C.UI_FONT_MEDIUM, "#FFFFFF", "rgba(0,0,0,0.6)");

        const dmgUpgrades = tower.definition.upgrades.damage;
        let dmgButtonLabel = "DMG Max";
        let dmgButtonColor = "#555";
        if (tower.damageLevel < C.MAX_UPGRADE_LEVEL) {
            const nextDmgUpgrade = dmgUpgrades[tower.damageLevel];
            dmgButtonLabel = `Obraż.+ (${nextDmgUpgrade.cost} Ap.)`;
            dmgButtonColor = state.aplauz >= nextDmgUpgrade.cost ? "#4CAF50" : "#777";
        }
        state.upgradeDamageButtonRegion = { x: panelX + C.UI_PADDING, y: panelY + 40, width: C.UPGRADE_PANEL_WIDTH - 2 * C.UI_PADDING, height: C.UPGRADE_BUTTON_HEIGHT, label: dmgButtonLabel };
        ctx.fillStyle = dmgButtonColor;
        ctx.fillRect(state.upgradeDamageButtonRegion.x, state.upgradeDamageButtonRegion.y, state.upgradeDamageButtonRegion.width, state.upgradeDamageButtonRegion.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawTextWithOutline(ctx, state.upgradeDamageButtonRegion.label, state.upgradeDamageButtonRegion.x + state.upgradeDamageButtonRegion.width / 2, state.upgradeDamageButtonRegion.y + C.UPGRADE_BUTTON_HEIGHT / 2, C.UI_FONT_SMALL, "#FFFFFF", "rgba(0,0,0,0.6)");
                
        const fireRateUpgrades = tower.definition.upgrades.fireRate;
        let frButtonLabel = "SZYB Max";
        let frButtonColor = "#555";
        if (tower.fireRateLevel < C.MAX_UPGRADE_LEVEL) {
            const nextFRUpgrade = fireRateUpgrades[tower.fireRateLevel];
            frButtonLabel = `Szyb.+ (${nextFRUpgrade.cost} Ap.)`;
            frButtonColor = state.aplauz >= nextFRUpgrade.cost ? "#2196F3" : "#777";
        }
        state.upgradeFireRateButtonRegion = { x: panelX + C.UI_PADDING, y: panelY + 40 + C.UPGRADE_BUTTON_HEIGHT + 5, width: C.UPGRADE_PANEL_WIDTH - 2 * C.UI_PADDING, height: C.UPGRADE_BUTTON_HEIGHT, label: frButtonLabel };
        ctx.fillStyle = frButtonColor;
        ctx.fillRect(state.upgradeFireRateButtonRegion.x, state.upgradeFireRateButtonRegion.y, state.upgradeFireRateButtonRegion.width, state.upgradeFireRateButtonRegion.height);
        drawTextWithOutline(ctx, state.upgradeFireRateButtonRegion.label, state.upgradeFireRateButtonRegion.x + state.upgradeFireRateButtonRegion.width / 2, state.upgradeFireRateButtonRegion.y + C.UPGRADE_BUTTON_HEIGHT / 2, C.UI_FONT_SMALL, "#FFFFFF", "rgba(0,0,0,0.6)");
        ctx.textBaseline = "alphabetic";
    } else {
        state.upgradeDamageButtonRegion = null;
        state.upgradeFireRateButtonRegion = null;
    }

    // Komunikaty
    if (state.currentMessage && state.messageTimer > 0) {
        // ... (logika rysowania komunikatów - bez zmian) ...
        ctx.font = C.UI_FONT_LARGE; 
        const metrics = ctx.measureText(state.currentMessage);
        const msgWidth = metrics.width;
        const msgActualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || 20; 

        const msgX = ctx.canvas.width / 2; 
        const msgY = 65; 
                
        ctx.fillStyle = "rgba(20, 10, 5, 0.85)"; 
        ctx.fillRect(msgX - msgWidth/2 - 15, msgY - msgActualHeight/2 - 8, msgWidth + 30, msgActualHeight + 16);
                
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawTextWithOutline(ctx, state.currentMessage, msgX, msgY, C.UI_FONT_LARGE, "#FFD700", "rgba(0,0,0,0.8)", 3);
        if (!state.isPaused || state.currentMessage === "Pauza") { // Timer wiadomości pauzuje się z grą, chyba że to wiadomość "Pauza"
             if(state.currentMessage !== "Pauza" || !state.isPaused) state.messageTimer--;
        }
        ctx.textBaseline = "alphabetic"; 
    } else if (state.messageTimer <= 0) {
        state.currentMessage = "";
    }
}

export function drawGameOverScreen(ctx) { /* ... (bez zmian) ... */ }