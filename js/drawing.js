import * as C from './config.js';
import { images, gameState as state } from './state.js';
import { drawTextWithOutline } from './utils.js';


export function drawBackgroundAndPath(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    ctx.fillStyle = C.levelData[state.currentLevelIndex].bgColor || '#c2b280';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!state.currentPath || state.currentPath.length === 0) return; // Dodatkowe zabezpieczenie

    ctx.strokeStyle = C.levelData[state.currentLevelIndex].pathColor || '#a0522d';
    ctx.lineWidth = C.TILE_SIZE * 0.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2, state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2);
    for (let i = 1; i < state.currentPath.length; i++) {
        ctx.lineTo(state.currentPath[i].x * C.TILE_SIZE + C.TILE_SIZE / 2, state.currentPath[i].y * C.TILE_SIZE + C.TILE_SIZE / 2);
    }
    ctx.stroke();
}

export function drawTheaterBase(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    const baseImg = images.teatrBase;
    // Dodatkowe zabezpieczenie jeśli currentPath jest puste lub za krótkie
    if (!state.currentPath || state.currentPath.length === 0) return;

    const baseNode = state.currentPath[state.currentPath.length -1];
    if (!baseNode) return; // Zabezpieczenie jeśli baseNode nie istnieje

    if (baseImg && !baseImg.error) {
         const baseY = Math.min(baseNode.y, C.MAX_GAME_ROW -1);

         const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
         const baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
         ctx.drawImage(baseImg,
            (baseNode.x + 0.5) * C.TILE_SIZE - baseRenderWidth / 2,
            (baseY + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8,
            baseRenderWidth, baseRenderHeight);
    } else {
        ctx.fillStyle = '#8B4513';
        const fallbackSize = C.TILE_SIZE * 1.5;
        const baseY = Math.min(baseNode.y, C.MAX_GAME_ROW -1);
        ctx.fillRect( (baseNode.x +0.5) * C.TILE_SIZE - fallbackSize/2, (baseY +0.5) * C.TILE_SIZE - fallbackSize/2, fallbackSize, fallbackSize); // Poprawione centrowanie
    }
}

export function drawTowerSpots(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    if (!state.currentTowerSpots) return; // Zabezpieczenie
    state.currentTowerSpots.forEach(spot => {
        if (spot.y <= C.MAX_GAME_ROW) {
            ctx.fillStyle = spot.occupied ? 'rgba(200, 0, 0, 0.15)' : 'rgba(0, 200, 0, 0.15)';
            ctx.strokeStyle = spot.occupied ? 'darkred' : 'darkgreen';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(spot.x * C.TILE_SIZE + C.TILE_SIZE*0.2, spot.y * C.TILE_SIZE + C.TILE_SIZE*0.2, C.TILE_SIZE*0.6, C.TILE_SIZE*0.6);
            ctx.fill();
            ctx.stroke();
        }
    });
}

export function drawEnemies(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    state.enemies.forEach(enemy => {
        if (enemy.image && !enemy.image.error) {
            if (enemy.level > 1) {
                ctx.save();
                ctx.shadowBlur = 6;
                ctx.shadowColor = enemy.level === 2 ? "rgba(100, 180, 255, 0.9)" : "rgba(255, 100, 100, 0.9)";
                for (let i = 0; i < 4; i++) {
                     ctx.drawImage(enemy.image,
                        enemy.x - enemy.width / 2 + (i === 0 ? -2 : i === 1 ? 2 : 0),
                        enemy.y - enemy.height / 2 + (i === 2 ? -2 : i === 3 ? 2 : 0),
                        enemy.width, enemy.height);
                }
                ctx.restore();
            }
            ctx.drawImage(enemy.image, enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = enemy.type === 'krytyk' ? '#5A5A5A' : '#007bff';
            const fallbackSize = enemy.width * 0.8;
            ctx.fillRect(enemy.x - fallbackSize / 2, enemy.y - fallbackSize / 2, fallbackSize, fallbackSize);
        }

        const barWidth = C.TILE_SIZE * 0.8;
        const barHeight = 7;
        ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.height / 2 - barHeight - 3, barWidth, barHeight);
        ctx.fillStyle = 'rgba(0,255,0,0.7)';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.height / 2 - barHeight - 3, barWidth * (enemy.hp / enemy.maxHp), barHeight);

        if (enemy.level > 1) {
            ctx.fillStyle = "white";
            ctx.font = C.UI_FONT_TINY;
            ctx.textAlign = "center";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            const levelIndicator = `L${enemy.level}`;
            ctx.strokeText(levelIndicator, enemy.x, enemy.y - enemy.height / 2 - barHeight - 5);
            ctx.fillText(levelIndicator, enemy.x, enemy.y - enemy.height / 2 - barHeight - 5);
            ctx.lineWidth = 1;
        }
    });
}

export function drawTowers(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    state.towers.forEach(tower => {
        const size = tower.renderSize;
        const drawY = tower.y + C.TILE_SIZE / 2 - size;

        if (tower.image && !tower.image.error) {
            ctx.drawImage(tower.image, tower.x - size / 2, drawY, size, size);
        } else {
            ctx.fillStyle = tower.type === 'bileter' ? '#4CAF50' : '#FFEB3B';
            const fallbackSize = size * 0.8;
            ctx.fillRect(tower.x - fallbackSize / 2, drawY + size - fallbackSize, fallbackSize, fallbackSize);
        }

        ctx.fillStyle = "#FFF";
        ctx.font = C.UI_FONT_TINY;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.lineWidth = 2.5;
        const levelText = `D:${tower.damageLevel}|S:${tower.fireRateLevel}`;
        ctx.strokeText(levelText, tower.x, drawY - 6);
        ctx.fillText(levelText, tower.x, drawY - 6);
        ctx.lineWidth = 1;


        if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade.id === tower.id) {
            ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
            ctx.lineWidth = 4;
            ctx.strokeRect(tower.x - size / 2 -2, drawY -2, size + 4, size + 4);
            ctx.lineWidth = 1;
        }
    });
}

export function drawProjectiles(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    state.projectiles.forEach(p => {
        if (p.image && !p.image.error) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.drawImage(p.image, -p.width / 2, -p.height / 2, p.width, p.height);
            ctx.restore();
        } else {
            ctx.fillStyle = p.type === 'bilet' ? 'white' : 'yellow';
            const fallbackSize = p.width * 0.5;
            ctx.fillRect(p.x - fallbackSize, p.y - fallbackSize/2, fallbackSize*2, fallbackSize);
        }
    });
}

export function drawWaveIntro(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    if (!state.showingWaveIntro || state.waveIntroTimer <= 0) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 28px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(`Nadchodzi Fala ${state.currentWaveNumber + 1}!`, ctx.canvas.width / 2, 80);

    ctx.font = C.UI_FONT_LARGE;
    ctx.fillStyle = "white";
    ctx.fillText("Przeciwnicy:", ctx.canvas.width / 2, 130);

    const iconSize = C.TILE_SIZE * 1.5;
    const startX = ctx.canvas.width / 2 - (state.waveIntroEnemies.length * (iconSize + 20) - 20) / 2;

    state.waveIntroEnemies.forEach((enemyInfo, index) => {
        const x = startX + index * (iconSize + 20);
        const y = 160;
        if (enemyInfo.image && !enemyInfo.image.error) {
            ctx.drawImage(enemyInfo.image, x, y, iconSize, iconSize);
             if (enemyInfo.isBoss) {
                ctx.fillStyle = "red";
                ctx.font = "bold 18px Arial";
                ctx.fillText("BOSS!", x + iconSize / 2, y + iconSize + 25);
            } else if (enemyInfo.level > 1) {
                ctx.fillStyle = enemyInfo.level === 2 ? "lightblue" : "pink";
                ctx.font = "bold 16px Arial";
                ctx.fillText(`Lvl ${enemyInfo.level}`, x + iconSize / 2, y + iconSize + 20);
            }
        } else {
            ctx.fillStyle = enemyInfo.type === 'krytyk' ? '#5A5A5A' : '#007bff';
            ctx.fillRect(x, y, iconSize, iconSize);
        }
    });

    ctx.fillStyle = "lightgray";
    ctx.font = C.UI_FONT_MEDIUM;
    ctx.fillText(`Przygotuj się! (${Math.ceil(state.waveIntroTimer / 60)}s)`, ctx.canvas.width / 2, ctx.canvas.height - 80);

    if (!state.isPaused) { // Timer intro pauzuje się z grą
        state.waveIntroTimer--;
    }
    // Logika startNextWaveActual jest teraz w main.js, w gameLoop, po tym jak timer dobiegnie końca
}

export function drawUI(ctx) { // UPEWNIJ SIĘ, ŻE JEST 'export'
    if (state.showingWaveIntro) return;
    
    // Górny panel statystyk
    ctx.fillStyle = "rgba(40, 20, 10, 0.85)";
    ctx.fillRect(0, 0, ctx.canvas.width, 45); 

    ctx.textAlign = "left";
    drawTextWithOutline(ctx, `Aplauz: ${state.aplauz}`, C.UI_PADDING, 30, C.UI_FONT_LARGE, "#FFD700", "rgba(0,0,0,0.8)");
    ctx.textAlign = "center";
    drawTextWithOutline(ctx, `Fala: ${state.currentWaveNumber > 0 ? state.currentWaveNumber : '-'}/${C.WAVES_PER_LEVEL}`, ctx.canvas.width / 2, 30, C.UI_FONT_LARGE, "#FFF", "rgba(0,0,0,0.8)");
    ctx.textAlign = "right";
    drawTextWithOutline(ctx, `Zadowolenie: ${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`, ctx.canvas.width - C.UI_PADDING, 30, C.UI_FONT_LARGE, "#FFD700", "rgba(0,0,0,0.8)");

    // Dolny panel UI
    ctx.fillStyle = "rgba(40, 20, 10, 0.85)"; 
    ctx.fillRect(0, ctx.canvas.height - C.UI_BOTTOM_PANEL_HEIGHT, ctx.canvas.width, C.UI_BOTTOM_PANEL_HEIGHT);

    for (const key in state.uiRegions) {
        if (key.startsWith("towerButton") && state.uiRegions[key]) {
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
        const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro || state.currentWaveNumber >= C.WAVES_PER_LEVEL;
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

    if (state.selectedTowerForUpgrade) {
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

    if (state.currentMessage && state.messageTimer > 0) {
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
        
        if (!state.isPaused || state.currentMessage === "Pauza") {
             if(state.currentMessage !== "Pauza" || !state.isPaused) state.messageTimer--;
        }
        ctx.textBaseline = "alphabetic"; 
    } else if (state.messageTimer <= 0) {
        state.currentMessage = "";
    }
}

export function drawGameOverScreen(ctx) { // Ta funkcja może nie być już potrzebna, jeśli komunikaty końca gry są przez state.currentMessage
    // Zostawiam na razie, ale jej funkcjonalność przejmuje system komunikatów i zmiana ekranu
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.font = "bold 36px Georgia";
    ctx.fillStyle = state.currentMessage.includes("GRATULACJE") || state.currentMessage.includes("ukończony") ? "lime" : "red";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.currentMessage, ctx.canvas.width/2, ctx.canvas.height/2 - 30);
    
    // ctx.font = "20px Arial";
    // ctx.fillStyle = "white";
    // ctx.fillText("Kliknij 'Menu Główne', aby kontynuować.", ctx.canvas.width/2, ctx.canvas.height/2 + 30);
    ctx.textBaseline = "alphabetic";
}