// js/drawing.js
import * as C from './config.js';
import { images, gameState as state } from './state.js';
import { drawTextWithOutline } from './utils.js';

export function drawBackgroundAndPath(ctx) {
    if (!state.currentPath || state.currentPath.length === 0 || !C.levelData[state.currentLevelIndex]) {
        ctx.fillStyle = '#cccccc'; 
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }
    ctx.fillStyle = C.levelData[state.currentLevelIndex].bgColor || '#c2b280';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = C.levelData[state.currentLevelIndex].pathColor || '#a0522d';
    ctx.lineWidth = C.TILE_SIZE * 0.9;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2, state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2);
    for (let i = 1; i < state.currentPath.length; i++) {
        ctx.lineTo(state.currentPath[i].x * C.TILE_SIZE + C.TILE_SIZE / 2, state.currentPath[i].y * C.TILE_SIZE + C.TILE_SIZE / 2);
    }
    ctx.stroke();
}

export function drawTheaterBase(ctx) {
    const baseImg = images.teatrBase;
    if (!state.currentPath || state.currentPath.length === 0) return;
    const baseNode = state.currentPath[state.currentPath.length -1];
    if (!baseNode) return;

    if (baseImg && !baseImg.error && baseImg.width > 0 && baseImg.height > 0) {
         const baseY = baseNode.y;
         const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
         const baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
         ctx.drawImage(baseImg,
            (baseNode.x + 0.5) * C.TILE_SIZE - baseRenderWidth / 2,
            (baseY + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8,
            baseRenderWidth, baseRenderHeight);
    } else {
        ctx.fillStyle = '#8B4513'; const fallbackSize = C.TILE_SIZE * 1.5; const baseY = baseNode.y;
        ctx.fillRect( (baseNode.x +0.5) * C.TILE_SIZE - fallbackSize/2, (baseNode.y +0.5) * C.TILE_SIZE - fallbackSize/2, fallbackSize, fallbackSize);
    }
}

export function drawTowerSpots(ctx) {
    if (!state.currentTowerSpots) return;
    state.currentTowerSpots.forEach(spot => {
        ctx.fillStyle = spot.occupied ? 'rgba(200, 0, 0, 0.15)' : 'rgba(0, 200, 0, 0.15)';
        ctx.strokeStyle = spot.occupied ? 'darkred' : 'darkgreen';
        ctx.lineWidth = 1; ctx.beginPath();
        ctx.rect(spot.x * C.TILE_SIZE + C.TILE_SIZE*0.2, spot.y * C.TILE_SIZE + C.TILE_SIZE*0.2, C.TILE_SIZE*0.6, C.TILE_SIZE*0.6);
        ctx.fill(); ctx.stroke();
    });
}

export function drawSingleEnemy(ctx, enemy) {
    if (!enemy.isDeathAnimationStarted || (enemy.currentAlpha !== undefined && enemy.currentAlpha > 0)) {
        ctx.save();
        ctx.globalAlpha = enemy.currentAlpha !== undefined ? enemy.currentAlpha : 1;
        const scaleFactor = enemy.currentScale !== undefined ? enemy.currentScale : 1;
        const w = enemy.width * scaleFactor; 
        const h = enemy.height * scaleFactor;

        if (enemy.image && !enemy.image.error) {
            if (enemy.level > 1 && (enemy.currentAlpha === undefined || enemy.currentAlpha > 0.1)) { 
                ctx.save();
                ctx.shadowBlur = 6;
                ctx.shadowColor = enemy.level === 2 ? "rgba(100, 180, 255, 0.9)" : "rgba(255, 100, 100, 0.9)";
                for (let i = 0; i < 4; i++) {
                     ctx.drawImage(enemy.image, enemy.x - w / 2 + (i === 0 ? -2 : i === 1 ? 2 : 0), enemy.y - h / 2 + (i === 2 ? -2 : i === 3 ? 2 : 0), w, h);
                }
                ctx.restore();
            }
            ctx.drawImage(enemy.image, enemy.x - w / 2, enemy.y - h / 2, w, h);
        } else { 
            ctx.fillStyle = enemy.type === 'krytyk' ? '#5A5A5A' : '#007bff'; 
            const fallbackSize = w * 0.8; 
            ctx.fillRect(enemy.x - fallbackSize / 2, enemy.y - fallbackSize / 2, fallbackSize, fallbackSize); 
        }
        ctx.restore();

        if ((enemy.currentAlpha === undefined || enemy.currentAlpha > 0.3) && enemy.hp > 0 && !enemy.isDying) { 
            const barWidth = C.TILE_SIZE * 0.8; const barHeight = 7;
            ctx.fillStyle = 'rgba(255,0,0,0.7)'; ctx.fillRect(enemy.x - barWidth / 2, enemy.y - h / 2 - barHeight - 3, barWidth, barHeight);
            ctx.fillStyle = 'rgba(0,255,0,0.7)'; ctx.fillRect(enemy.x - barWidth / 2, enemy.y - h / 2 - barHeight - 3, barWidth * (enemy.hp / enemy.maxHp), barHeight);
            if (enemy.level > 1) {
                drawTextWithOutline(ctx, `L${enemy.level}`, enemy.x, enemy.y - h / 2 - barHeight - 5, C.UI_FONT_TINY, "white", "black");
            }
        }
    }
}

export function drawSingleTower(ctx, tower) {
    ctx.save();
    ctx.globalAlpha = tower.currentAlpha !== undefined ? tower.currentAlpha : 1;
    
    const scaleFactor = tower.currentScale !== undefined ? tower.currentScale : 1;
    const currentRenderSize = tower.renderSize * scaleFactor;
    
    const towerCenterX = tower.x; 
    const towerCenterY = tower.y; 

    ctx.translate(towerCenterX, towerCenterY);
    if (tower.currentRotation !== undefined) {
        ctx.rotate(tower.currentRotation * Math.PI / 180);
    }
    
    const drawXOffset = -currentRenderSize / 2;
    const drawYOffset = C.TILE_SIZE / 2 - currentRenderSize;


    if (tower.image && !tower.image.error) {
        ctx.drawImage(tower.image, drawXOffset, drawYOffset, currentRenderSize, currentRenderSize);
    } else { 
        ctx.fillStyle = tower.type === 'bileter' ? '#4CAF50' : '#FFEB3B'; 
        const fallbackSize = currentRenderSize * 0.8; 
        ctx.fillRect(drawXOffset + (currentRenderSize - fallbackSize)/2, drawYOffset + (currentRenderSize - fallbackSize), fallbackSize, fallbackSize); 
    }
    ctx.restore(); 
    
    if ((tower.currentAlpha === undefined || tower.currentAlpha > 0.9) && (tower.currentScale === undefined || tower.currentScale > 0.9)) {
        const textDrawY = tower.y + C.TILE_SIZE / 2 - tower.renderSize - 6; 
        drawTextWithOutline(ctx, `D:${tower.damageLevel}|S:${tower.fireRateLevel}`, tower.x, textDrawY, C.UI_FONT_TINY, "#FFF", "rgba(0,0,0,0.8)");
    }

    if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade.id === tower.id) {
        const originalDrawYforSelection = tower.y + C.TILE_SIZE / 2 - tower.renderSize;
        ctx.strokeStyle = "rgba(255, 215, 0, 0.9)"; 
        ctx.lineWidth = 3;
        ctx.strokeRect(tower.x - tower.renderSize / 2 -2, originalDrawYforSelection -2, tower.renderSize + 4, tower.renderSize + 4);
        ctx.lineWidth = 1;
    }
}

export function drawEnemies(ctx) {
    state.enemies.forEach(enemy => drawSingleEnemy(ctx, enemy));
}
export function drawTowers(ctx) {
    state.towers.forEach(tower => drawSingleTower(ctx, tower));
}


export function drawProjectiles(ctx) {
    state.projectiles.forEach((p, index) => {
        if (p.image && !p.image.error) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            const scale = p.currentScale !== undefined ? p.currentScale : 1;
            ctx.drawImage(p.image, -p.width * scale / 2, -p.height * scale / 2, p.width * scale, p.height * scale);
            ctx.restore();
        } else { 
            ctx.fillStyle = p.type === 'bilet' ? 'white' : 'yellow';
            const fallbackWidth = p.width || C.TILE_SIZE * 0.2;
            const fallbackHeight = p.height || C.TILE_SIZE * 0.1;
            ctx.fillRect(p.x - fallbackWidth / 2, p.y - fallbackHeight / 2, fallbackWidth, fallbackHeight);
        }
    });
}

export function drawEffects(ctx) {
    if (state.effects && state.effects.length > 0) {
        state.effects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.alpha; 
            ctx.fillStyle = effect.color || "orange";
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.scale, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();
        });
    }
}

export function drawWaveIntro(ctx) {
    if (!state.showingWaveIntro || state.waveIntroTimer < 0) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.textAlign = "center";
    drawTextWithOutline(ctx, `Nadchodzi Fala ${state.currentWaveNumber + 1}!`, ctx.canvas.width / 2, 80, "bold 28px Georgia", "#ffd700", "black");
    drawTextWithOutline(ctx, "Przeciwnicy:", ctx.canvas.width / 2, 130, C.UI_FONT_LARGE, "white", "black");

    const iconSize = C.TILE_SIZE * 1.5;
    const startX = ctx.canvas.width / 2 - (state.waveIntroEnemies.length * (iconSize + 20) - 20) / 2;

    state.waveIntroEnemies.forEach((enemyInfo, index) => {
        const x = startX + index * (iconSize + 20);
        const y = 160;
        if (enemyInfo.image && !enemyInfo.image.error) {
            ctx.drawImage(enemyInfo.image, x, y, iconSize, iconSize);
             if (enemyInfo.isBoss) {
                drawTextWithOutline(ctx, "BOSS!", x + iconSize / 2, y + iconSize + 25, "bold 18px Arial", "red", "black");
            } else if (enemyInfo.level > 1) {
                drawTextWithOutline(ctx, `Lvl ${enemyInfo.level}`, x + iconSize / 2, y + iconSize + 20, "bold 16px Arial", enemyInfo.level === 2 ? "lightblue" : "pink", "black");
            }
        } else {
            ctx.fillStyle = enemyInfo.type === 'krytyk' ? '#5A5A5A' : '#007bff';
            ctx.fillRect(x, y, iconSize, iconSize);
        }
    });
    
    drawTextWithOutline(ctx, `Przygotuj się! (${Math.ceil(state.waveIntroTimer / 60)}s)`, ctx.canvas.width / 2, ctx.canvas.height - 80, C.UI_FONT_MEDIUM, "lightgray", "black");
}

export function drawUI(ctx) { 
    if (state.selectedTowerForUpgrade) {
        const tower = state.selectedTowerForUpgrade;
        if ((tower.currentAlpha === undefined || tower.currentAlpha > 0.5)) {
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2); 
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
        }
    }
}

export function drawLevelCompleteSummary(ctx) {
    if (!state.showingLevelCompleteSummary) return;

    const stats = state.lastLevelStats;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let currentY = 50; 

    drawTextWithOutline(ctx, `${stats.levelName || 'Akt ' + (state.currentLevelIndex +1)} Ukończony!`, canvasWidth / 2, currentY, "bold 30px Georgia", "#ffd700", "black", 3, "center");
    currentY += 50; 

    const starSize = 28;
    const totalStarWidth = (3 * starSize) + (2 * 8);
    let starX = canvasWidth / 2 - totalStarWidth / 2;
    for (let i = 0; i < 3; i++) {
        const starChar = (i < stats.stars) ? '★' : '☆';
        const starColor = (i < stats.stars) ? "#ffd700" : "#888888";
        drawTextWithOutline(ctx, starChar, starX + starSize / 2, currentY, `bold ${starSize * 1.2}px Arial`, starColor, "black", 2, "center");
        starX += starSize + 8;
    }
    currentY += starSize + 35; 

    const columnGap = 40;
    const totalContentWidth = canvasWidth * 0.85;
    const columnWidth = (totalContentWidth - columnGap) / 2;
    
    const leftColumnX = canvasWidth / 2 - totalContentWidth / 2;
    const rightColumnX = leftColumnX + columnWidth + columnGap;

    const lineHeight = 26; 
    const sectionPadding = 20; 
    let leftColumnY = currentY;
    let rightColumnY = currentY;
    const valueXOffset = columnWidth - sectionPadding;

    // --- LEWA KOLUMNA: Statystyki Aktu ---
    drawTextWithOutline(ctx, "Statystyki Aktu:", leftColumnX + columnWidth / 2, leftColumnY, C.UI_FONT_LARGE, "#f0e0c0", "black", 2.5, "center");
    leftColumnY += lineHeight * 1.8; 
    
    // ZMIANA: Usunięto "Nazwa Aktu:", ponieważ jest już w tytule głównym
    // drawTextWithOutline(ctx, `Nazwa Aktu:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    // drawTextWithOutline(ctx, `${stats.levelName || `Akt ${state.currentLevelIndex + 1}`}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    // leftColumnY += lineHeight; // Usunięto, więc nie ma potrzeby inkrementacji Y

    drawTextWithOutline(ctx, `Zadowolenie Widowni:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.finalSatisfaction} / ${stats.initialMaxSatisfaction}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Wieże Bileterów:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.bileter}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Wieże Oświetleniowców:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.oswietleniowiec}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;


    // --- PRAWA KOLUMNA: Bonus na Następny Akt ---
    drawTextWithOutline(ctx, "Bonus na Następny Akt:", rightColumnX + columnWidth / 2, rightColumnY, C.UI_FONT_LARGE, "#f0e0c0", "black", 2.5, "center");
    rightColumnY += lineHeight * 1.8;

    drawTextWithOutline(ctx, `Pozostały Aplauz:`, rightColumnX + sectionPadding, rightColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.remainingAplauz} Ap.`, rightColumnX + valueXOffset, rightColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    rightColumnY += lineHeight;

    drawTextWithOutline(ctx, `Wartość Sprzedaży Wież:`, rightColumnX + sectionPadding, rightColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.totalTowerValue} Ap.`, rightColumnX + valueXOffset, rightColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    rightColumnY += lineHeight * 1.1;
    
    ctx.beginPath();
    ctx.moveTo(rightColumnX + sectionPadding / 2, rightColumnY);
    ctx.lineTo(rightColumnX + columnWidth - sectionPadding / 2, rightColumnY);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    rightColumnY += lineHeight * 0.9;

    const totalBonusFont = "bold 14px Arial";
    drawTextWithOutline(ctx, `Łączny Bonus Aplauzu:`, rightColumnX + sectionPadding, rightColumnY, totalBonusFont, "#e0c9a6", "black", 2.2, "left");
    drawTextWithOutline(ctx, `${stats.aplauzBonusForNextLevel} Ap.`, rightColumnX + valueXOffset, rightColumnY, totalBonusFont, "#50C878", "black", 2.2, "right");
    // rightColumnY += lineHeight; // Już niepotrzebne, przyciski poniżej

    const maxYFromColumns = Math.max(leftColumnY, rightColumnY);
    let buttonsCurrentY = maxYFromColumns + 35;

    const buttonWidth = 200;
    const buttonHeight = 40;
    state.levelCompleteButtons = [];

    let numButtons = 1;
    if (state.currentLevelIndex < C.levelData.length - 1 && C.levelData.length > 1) {
        numButtons = 2;
    }
    const requiredSpaceForButtons = numButtons * buttonHeight + (numButtons - 1) * 10; 

    if (buttonsCurrentY + requiredSpaceForButtons + 20 > canvasHeight) { // Sprawdzenie, czy przyciski nie wyjdą poza ekran
        buttonsCurrentY = canvasHeight - requiredSpaceForButtons - 20;
    }
    
    // Przycisk "Menu Główne" zawsze na dole (lub prawie na dole)
    let menuButtonActualY = buttonsCurrentY;
    if (numButtons === 2) { // Jeśli są dwa przyciski, "Menu Główne" jest niżej
        menuButtonActualY = buttonsCurrentY + buttonHeight + 10;
    }
     state.levelCompleteButtons.push({
        id: 'mainMenu', text: "Menu Główne",
        x: canvasWidth / 2 - buttonWidth / 2, y: menuButtonActualY,
        width: buttonWidth, height: buttonHeight
    });
    drawStyledButton(ctx, "Menu Główne", canvasWidth / 2, menuButtonActualY + buttonHeight / 2, buttonWidth, buttonHeight);

    if (numButtons === 2) { // Jeśli jest przycisk "Następny Akt", rysujemy go nad "Menu Główne"
        state.levelCompleteButtons.push({
            id: 'nextLevel', text: "Następny Akt",
            x: canvasWidth / 2 - buttonWidth / 2, y: buttonsCurrentY, // buttonsCurrentY jest teraz dla górnego przycisku
            width: buttonWidth, height: buttonHeight
        });
        drawStyledButton(ctx, "Następny Akt", canvasWidth / 2, buttonsCurrentY + buttonHeight / 2, buttonWidth, buttonHeight);
    }
}

function drawStyledButton(ctx, text, centerX, centerY, width, height) {
    const x = centerX - width / 2;
    const y = centerY - height / 2;

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#b8860b");
    gradient.addColorStop(1, "#8c6c0a");
    ctx.fillStyle = gradient;
    
    const cornerRadius = 6;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#5c400a";
    ctx.lineWidth = 1.5; 
    ctx.stroke(); 
    
    const baseFontSize = parseInt(C.UI_FONT_MEDIUM.match(/\d+/)[0]) || 13;
    drawTextWithOutline(ctx, text, centerX, centerY + baseFontSize / 3.3, C.UI_FONT_MEDIUM, "white", "black", 2.5, "center");
    ctx.lineWidth = 1;
}

export function drawGameOverScreen(ctx) { /* Pusta, nieużywana */ }