// js/drawing.js
import * as C from './config.js';
import { images, gameState as state } from './state.js';
import { drawTextWithOutline } from './utils.js';

export function drawTiledBackground(ctx) {
    if (!images.tileset || images.tileset.error || images.tileset.width === 0 || images.tileset.height === 0) {
        console.warn("Tileset image not loaded, has error, or has no dimensions. Falling back to old background rendering.");
        drawOldBackgroundAndPath(ctx);
        return;
    }

    if (state.currentBackgroundTileMap && state.currentBackgroundTileMap.length === C.ROWS) {
        for (let row = 0; row < C.ROWS; row++) {
            if (state.currentBackgroundTileMap[row] && state.currentBackgroundTileMap[row].length === C.COLS) {
                for (let col = 0; col < C.COLS; col++) {
                    const tileX_onCanvas = col * C.TILE_SIZE;
                    const tileY_onCanvas = row * C.TILE_SIZE;
                    const tileDataFromSheet = state.currentBackgroundTileMap[row][col];

                    if (tileDataFromSheet) {
                        ctx.drawImage(
                            images.tileset,
                            tileDataFromSheet.sx,
                            tileDataFromSheet.sy,
                            C.TILESET_TILE_SIZE_PX,
                            C.TILESET_TILE_SIZE_PX,
                            tileX_onCanvas,
                            tileY_onCanvas,
                            C.TILE_SIZE,
                            C.TILE_SIZE
                        );
                    } else {
                        ctx.fillStyle = 'pink'; 
                        ctx.fillRect(tileX_onCanvas, tileY_onCanvas, C.TILE_SIZE, C.TILE_SIZE);
                    }
                }
            }
        }
    } else {
        console.warn("currentBackgroundTileMap is not properly initialized. Falling back.");
        drawOldBackgroundAndPath(ctx);
    }
}

export function drawOldBackgroundAndPath(ctx) {
     if (images.tileset && !images.tileset.error && images.tileset.width > 0) {
        for (let row = 0; row < C.ROWS; row++) {
            for (let col = 0; col < C.COLS; col++) {
                 ctx.drawImage(
                    images.tileset, C.tileTypes.GRASS_BASIC.sx, C.tileTypes.GRASS_BASIC.sy,
                    C.TILESET_TILE_SIZE_PX, C.TILESET_TILE_SIZE_PX,
                    col * C.TILE_SIZE, row * C.TILE_SIZE,
                    C.TILE_SIZE, C.TILE_SIZE
                );
            }
        }
    } else {
        ctx.fillStyle = '#5E7C4B'; 
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
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
        let w = enemy.width * scaleFactor; 
        let h = enemy.height * scaleFactor;

        if (enemy.type === 'diva' && enemy.furyActive) {
            ctx.save(); // Zapisz stan przed nałożeniem efektu furii
            ctx.shadowColor = "rgba(255, 50, 50, 0.7)"; // Czerwona poświata
            ctx.shadowBlur = 8;                          // Rozmiar poświaty
        }


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
            ctx.fillStyle = enemy.type === 'krytyk' ? '#5A5A5A' : (enemy.type === 'diva' ? '#FF69B4' : (enemy.type === 'techniczny' ? '#4682B4' : '#007bff')); 
            const fallbackSize = w * 0.8; 
            ctx.fillRect(enemy.x - fallbackSize / 2, enemy.y - fallbackSize / 2, fallbackSize, fallbackSize); 
        }
        
        if (enemy.type === 'diva' && enemy.furyActive) {
            ctx.restore(); // Przywróć stan sprzed efektu furii
        }
        ctx.restore(); // Główny restore dla alpha i scale

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
        let fallbackColor = '#CCCCCC';
        if (tower.type === 'bileter') fallbackColor = '#4CAF50';
        else if (tower.type === 'oswietleniowiec') fallbackColor = '#FFEB3B';
        else if (tower.type === 'garderobiana') fallbackColor = '#FFC0CB'; 
        else if (tower.type === 'budkaInspicjenta') fallbackColor = '#A0522D'; 
        ctx.fillStyle = fallbackColor; 
        const fallbackSize = currentRenderSize * 0.8; 
        ctx.fillRect(drawXOffset + (currentRenderSize - fallbackSize)/2, drawYOffset + (currentRenderSize - fallbackSize), fallbackSize, fallbackSize); 
    }
    ctx.restore(); 
    
    if (tower.isSabotaged && images.sabotageEffectIcon && !images.sabotageEffectIcon.error) {
        const effectSize = C.TILE_SIZE * 0.7;
        const effectX = tower.x - effectSize / 2;
        const effectY = tower.y - tower.renderSize + C.TILE_SIZE / 2 - effectSize * 0.7 + Math.sin(Date.now() / 100) * 2; // Lekkie unoszenie
        ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 150) * 0.2; // Lekkie migotanie
        ctx.drawImage(
            images.sabotageEffectIcon,
            effectX,
            effectY,
            effectSize,
            effectSize
        );
        ctx.globalAlpha = 1.0; // Przywróć alpha
    }

    if ((tower.currentAlpha === undefined || tower.currentAlpha > 0.9) && (tower.currentScale === undefined || tower.currentScale > 0.9)) {
        let levelText = `D:${tower.damageLevel || 0}|S:${tower.fireRateLevel || 0}`;
        if (tower.type === 'garderobiana') {
            levelText += `|R:${tower.rangeLevel || 0}|E:${tower.effectStrengthLevel || 0}|T:${tower.effectDurationLevel || 0}`;
        } else if (tower.type === 'budkaInspicjenta') {
            levelText += `|C:${tower.critChanceLevel || 0}`;
        }
        const textDrawY = tower.y + C.TILE_SIZE / 2 - tower.renderSize - 6; 
        drawTextWithOutline(ctx, levelText, tower.x, textDrawY, C.UI_FONT_TINY, "#FFF", "rgba(0,0,0,0.8)");
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
            ctx.fillStyle = p.type === 'bilet' ? 'white' : (p.type === 'recenzja' ? '#DDD' : 'yellow');
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
            ctx.globalAlpha = effect.currentAlpha !== undefined ? effect.currentAlpha : effect.alpha; 
            
            if (effect.image && !effect.image.error) {
                const scale = effect.currentScale !== undefined ? effect.currentScale : 1;
                 ctx.drawImage(effect.image, 
                    effect.x - effect.width * scale / 2, 
                    effect.y - effect.height * scale / 2, 
                    effect.width * scale, 
                    effect.height * scale
                );
            } else { 
                const radius = effect.currentRadius !== undefined ? effect.currentRadius : (effect.scale || 10) ;
                ctx.fillStyle = effect.color || "orange";
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
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
    let totalIconsWidth = 0;
    state.waveIntroEnemies.forEach(enemyInfo => {
        totalIconsWidth += iconSize + (state.waveIntroEnemies.length > 1 ? 10 : 0);
    });
    if (state.waveIntroEnemies.length > 0) totalIconsWidth -=10;

    let startX = canvas.width / 2 - totalIconsWidth / 2;

    state.waveIntroEnemies.forEach((enemyInfo) => {
        const y = 160;
        if (enemyInfo.image && !enemyInfo.image.error) {
            ctx.drawImage(enemyInfo.image, startX, y, iconSize, iconSize);
             if (enemyInfo.isBoss) {
                drawTextWithOutline(ctx, "BOSS!", startX + iconSize / 2, y + iconSize + 25, "bold 18px Arial", "red", "black");
            } else if (enemyInfo.level > 1) {
                drawTextWithOutline(ctx, `Lvl ${enemyInfo.level}`, startX + iconSize / 2, y + iconSize + 20, "bold 16px Arial", enemyInfo.level === 2 ? "lightblue" : "pink", "black");
            }
        } else {
            ctx.fillStyle = enemyInfo.type === 'krytyk' ? '#5A5A5A' : (enemyInfo.type === 'diva' ? '#FF69B4' : (enemyInfo.type === 'techniczny' ? '#4682B4' : '#007bff'));
            ctx.fillRect(startX, y, iconSize, iconSize);
        }
        startX += iconSize + 10;
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
        const starState = state.lastLevelStats.starStates[i];
        
        ctx.save();
        const currentStarCenterX = starX + starSize / 2;
        const currentStarCenterY = currentY;
        ctx.translate(currentStarCenterX, currentStarCenterY);
        ctx.scale(starState.scale, starState.scale);
        ctx.globalAlpha = starState.opacity;
        ctx.translate(-currentStarCenterX, -currentStarCenterY);
        
        drawTextWithOutline(ctx, starState.character, currentStarCenterX, currentStarCenterY, `bold ${starSize * 1.2}px Arial`, starState.color, "black", 2, "center");
        ctx.restore();
        
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

    drawTextWithOutline(ctx, "Statystyki Aktu:", leftColumnX + columnWidth / 2, leftColumnY, C.UI_FONT_LARGE, "#f0e0c0", "black", 2.5, "center");
    leftColumnY += lineHeight * 1.8; 
    
    drawTextWithOutline(ctx, `Zadowolenie Widowni:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.finalSatisfaction} / ${stats.initialMaxSatisfaction}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Wieże Bileterów:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.bileter}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Wieże Oświetleniowców:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.oswietleniowiec}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Garderobiane:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.garderobiana || 0}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");
    leftColumnY += lineHeight;

    drawTextWithOutline(ctx, `Budki Inspicjenta:`, leftColumnX + sectionPadding, leftColumnY, C.UI_FONT_MEDIUM, "#d0bfa6", "black", 2, "left");
    drawTextWithOutline(ctx, `${stats.towersBuilt.budkaInspicjenta || 0}`, leftColumnX + valueXOffset, leftColumnY, C.UI_FONT_MEDIUM, "#ffd700", "black", 2, "right");


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

    if (buttonsCurrentY + requiredSpaceForButtons + 20 > canvasHeight) {
        buttonsCurrentY = canvasHeight - requiredSpaceForButtons - 20;
    }
    
    let menuButtonActualY = buttonsCurrentY;
    if (numButtons === 2) {
        menuButtonActualY = buttonsCurrentY + buttonHeight + 10;
    }
     state.levelCompleteButtons.push({
        id: 'mainMenu', text: "Menu Główne",
        x: canvasWidth / 2 - buttonWidth / 2, y: menuButtonActualY,
        width: buttonWidth, height: buttonHeight
    });
    drawStyledButton(ctx, "Menu Główne", canvasWidth / 2, menuButtonActualY + buttonHeight / 2, buttonWidth, buttonHeight);

    if (numButtons === 2) {
        state.levelCompleteButtons.push({
            id: 'nextLevel', text: "Następny Akt",
            x: canvasWidth / 2 - buttonWidth / 2, y: buttonsCurrentY,
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