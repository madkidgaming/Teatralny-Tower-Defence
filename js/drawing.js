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

                        const isPathTile = state.currentPath.some(p => p.x === col && p.y === row);
                        if (isPathTile) {
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; 
                            ctx.lineWidth = 1;
                            ctx.strokeRect(tileX_onCanvas + 0.5, tileY_onCanvas + 0.5, C.TILE_SIZE -1, C.TILE_SIZE -1);
                        }

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
        ctx.fillStyle = '#8B4513'; 
        const fallbackSize = C.TILE_SIZE * 1.5;
        const baseY = baseNode.y;
        ctx.fillRect( (baseNode.x +0.5) * C.TILE_SIZE - fallbackSize/2, (baseNode.y +0.5) * C.TILE_SIZE - fallbackSize/2, fallbackSize, fallbackSize);
    }
}

export function drawTowerSpots(ctx) {
    if (!state.currentTowerSpots) return;
    state.currentTowerSpots.forEach(spot => {
        ctx.fillStyle = spot.occupied ? 'rgba(200, 0, 0, 0.15)' : 'rgba(0, 200, 0, 0.15)';
        ctx.strokeStyle = spot.occupied ? 'darkred' : 'darkgreen';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(spot.x * C.TILE_SIZE + C.TILE_SIZE*0.2, spot.y * C.TILE_SIZE + C.TILE_SIZE*0.2, C.TILE_SIZE*0.6, C.TILE_SIZE*0.6);
        ctx.fill();
        ctx.stroke();
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
            ctx.save();
            ctx.shadowColor = "rgba(255, 50, 50, 0.7)";
            ctx.shadowBlur = 8;
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
            ctx.restore(); 
        }
        ctx.restore(); 

        const hpBarYOffset = enemy.y - h / 2 - 8 - 3; 
        if ((enemy.currentAlpha === undefined || enemy.currentAlpha > 0.3) && enemy.hp > 0 && !enemy.isDying) {
            const barWidth = C.TILE_SIZE * 0.8;
            const barHeight = 7;
            ctx.fillStyle = 'rgba(255,0,0,0.7)'; 
            ctx.fillRect(enemy.x - barWidth / 2, hpBarYOffset, barWidth, barHeight);
            ctx.fillStyle = 'rgba(0,255,0,0.7)'; 
            ctx.fillRect(enemy.x - barWidth / 2, hpBarYOffset, barWidth * (enemy.hp / enemy.maxHp), barHeight);
            if (enemy.level > 1) {
                drawTextWithOutline(ctx, `L${enemy.level}`, enemy.x, hpBarYOffset - 2, C.UI_FONT_TINY, "white", "black");
            }
        }

        let statusIconXOffset = - (C.TILE_SIZE * 0.25); 
        const statusIconSize = C.TILE_SIZE * 0.35;
        const statusIconY = hpBarYOffset - statusIconSize - 2; 

        if (enemy.isSlowed) {
            const slowIconImg = images.slowStatusIcon;
            if (slowIconImg && !slowIconImg.error) {
                ctx.drawImage(slowIconImg, enemy.x + statusIconXOffset - statusIconSize / 2, statusIconY, statusIconSize, statusIconSize);
            } else { 
                ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(enemy.x + statusIconXOffset, statusIconY + statusIconSize / 2, statusIconSize / 2.5, 0, Math.PI * 2);
                ctx.fill();
                drawTextWithOutline(ctx, "S", enemy.x + statusIconXOffset, statusIconY + statusIconSize / 1.8, C.UI_FONT_TINY, "white", "black");
            }
            statusIconXOffset += statusIconSize + 2; 
        }

        if (enemy.damageTakenMultiplier && enemy.damageTakenMultiplier > 1) {
            const damageTakenIconImg = images.damageTakenStatusIcon;
            if (damageTakenIconImg && !damageTakenIconImg.error) {
                ctx.drawImage(damageTakenIconImg, enemy.x + statusIconXOffset - statusIconSize / 2, statusIconY, statusIconSize, statusIconSize);
            } else { 
                ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
                 ctx.beginPath();
                ctx.arc(enemy.x + statusIconXOffset, statusIconY + statusIconSize / 2, statusIconSize / 2.5, 0, Math.PI * 2);
                ctx.fill();
                drawTextWithOutline(ctx, "D+", enemy.x + statusIconXOffset, statusIconY + statusIconSize / 1.8, C.UI_FONT_TINY, "white", "black");
            }
        }
    }
}

export function drawSingleTower(ctx, tower) {
    ctx.save();
    let displayAlpha = tower.currentAlpha !== undefined ? tower.currentAlpha : 1;
    if (tower.upgradeFlashAlpha !== undefined) {
        displayAlpha = Math.min(1, displayAlpha + tower.upgradeFlashAlpha); 
    }
    ctx.globalAlpha = displayAlpha;
    
    const baseScaleFactor = tower.currentScale !== undefined ? tower.currentScale : 1;
    const upgradeScaleFactor = tower.upgradePulseScale !== undefined ? tower.upgradePulseScale : 1;
    const finalScaleFactor = baseScaleFactor * upgradeScaleFactor;
    const currentRenderSize = tower.renderSize * finalScaleFactor;
    
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
        const effectY = tower.y - tower.renderSize + C.TILE_SIZE / 2 - effectSize * 0.7 + Math.sin(Date.now() / 100) * 2; 
        ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 150) * 0.2; 
        ctx.drawImage(
            images.sabotageEffectIcon,
            effectX,
            effectY,
            effectSize,
            effectSize
        );
        ctx.globalAlpha = 1.0; 
    }

    // Rysowanie wskaźnika cooldownu
    const cooldownBarYBase = tower.y + C.TILE_SIZE / 2 - tower.renderSize - 15; // Bazowa pozycja Y dla wskaźników
    let currentIndicatorY = cooldownBarYBase;

    if (!tower.isSabotaged && tower.currentFireRate > 0 && tower.fireCooldown > 0) {
        const cooldownBarWidth = C.TILE_SIZE * 0.7;
        const cooldownBarHeight = 5;
        
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.fillRect(tower.x - cooldownBarWidth / 2, currentIndicatorY, cooldownBarWidth, cooldownBarHeight);

        const progress = (tower.currentFireRate - tower.fireCooldown) / tower.currentFireRate;
        ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'; 
        ctx.fillRect(tower.x - cooldownBarWidth / 2, currentIndicatorY, cooldownBarWidth * progress, cooldownBarHeight);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tower.x - cooldownBarWidth / 2, currentIndicatorY, cooldownBarWidth, cooldownBarHeight);
        ctx.lineWidth = 1;
        currentIndicatorY -= (cooldownBarHeight + 3); // Przesuń Y dla następnego wskaźnika (poziomu)
    }


    // Rysowanie wskaźników poziomu ulepszeń
    if ((displayAlpha > 0.9) && (finalScaleFactor > 0.9) && tower.definition && tower.definition.upgradeLevelNames) {
        const pipRadius = 2.5;
        const pipSpacing = 2; // Odstęp między środkami pipów
        const pipDiameter = pipRadius * 2;
        const totalPipSpacing = pipDiameter + pipSpacing;
        const prefixSpacing = 3;
        const lineHeight = 8; // Odstęp między liniami wskaźników ulepszeń

        let indicatorLineY = currentIndicatorY; // Zacznij od pozycji Y paska cooldownu lub wyżej

        tower.definition.upgradeLevelNames.forEach((upgradeKey, index) => {
            const currentLevel = tower[`${upgradeKey}Level`] || 0;
            const upgradesForType = tower.definition.upgrades[upgradeKey];
            if (!upgradesForType) return; // Pomiń, jeśli nie ma definicji ulepszeń dla tego klucza
            
            const maxLevel = upgradesForType.length;
            if (maxLevel === 0) return; // Pomiń, jeśli nie ma poziomów dla tego ulepszenia

            let prefix = "";
            switch(upgradeKey) {
                case 'damage': prefix = "D"; break;
                case 'fireRate': prefix = "S"; break; // Speed/Szybkostrzelność
                case 'range': prefix = "R"; break;
                case 'effectStrength': prefix = "E"; break;
                case 'effectDuration': prefix = "T"; break; // Time/Czas
                case 'critChance': prefix = "C"; break;
                default: prefix = upgradeKey.charAt(0).toUpperCase(); break;
            }
            prefix += ":";

            // Rysowanie prefixu
            ctx.font = C.UI_FONT_TINY;
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "left"; // Wyrównanie do lewej dla prefixu
            const prefixWidth = ctx.measureText(prefix).width;
            const totalPipsWidth = maxLevel * pipDiameter + (maxLevel > 0 ? (maxLevel - 1) * pipSpacing : 0);
            const totalIndicatorWidth = prefixWidth + prefixSpacing + totalPipsWidth;
            let startX = tower.x - totalIndicatorWidth / 2;

            drawTextWithOutline(ctx, prefix, startX, indicatorLineY, C.UI_FONT_TINY, "#FFF", "rgba(0,0,0,0.8)", 2, "left");
            
            // Rysowanie pipów
            let pipX = startX + prefixWidth + prefixSpacing + pipRadius;
            for (let i = 0; i < maxLevel; i++) {
                ctx.beginPath();
                ctx.arc(pipX, indicatorLineY - pipRadius, pipRadius, 0, Math.PI * 2);
                if (i < currentLevel) {
                    ctx.fillStyle = "#ffd700"; // Złoty dla zdobytych
                    ctx.fill();
                } else {
                    ctx.strokeStyle = "#AAA"; // Szary obrys dla pustych
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                pipX += totalPipSpacing;
            }
            indicatorLineY -= lineHeight; // Przesuń Y dla następnej linii wskaźnika
        });
    }


    if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade.id === tower.id) {
        const highlightPadding = tower.selectionHighlightPadding !== undefined ? tower.selectionHighlightPadding : 2; 
        const highlightAlpha = tower.selectionHighlightAlpha !== undefined ? tower.selectionHighlightAlpha : 0.9; 

        ctx.strokeStyle = `rgba(255, 215, 0, ${highlightAlpha})`; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(
            tower.x - tower.renderSize / 2 - highlightPadding, 
            (tower.y + C.TILE_SIZE / 2 - tower.renderSize) - highlightPadding, 
            tower.renderSize + highlightPadding * 2, 
            tower.renderSize + highlightPadding * 2
        );
        ctx.lineWidth = 1; 
    }
}

// ... (reszta pliku drawing.js bez zmian) ...
export function drawEnemies(ctx) {
    state.enemies.forEach(enemy => drawSingleEnemy(ctx, enemy));
}
export function drawTowers(ctx) {
    state.towers.forEach(tower => drawSingleTower(ctx, tower));
}


export function drawProjectiles(ctx) {
    state.projectiles.forEach((p) => { 
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
    const iconSpacing = 10;
    let totalIconsWidth = 0;

    if (state.waveIntroEnemies.length > 0) {
        totalIconsWidth = (state.waveIntroEnemies.length * iconSize) + ((state.waveIntroEnemies.length - 1) * iconSpacing);
        if (state.waveIntroEnemies.length === 1) { 
            totalIconsWidth = iconSize;
        }
    }

    let startX = ctx.canvas.width / 2 - totalIconsWidth / 2; 

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
        startX += iconSize + iconSpacing;
    });

    drawTextWithOutline(ctx, `Przygotuj się! (${Math.ceil(state.waveIntroTimer / 60)}s)`, ctx.canvas.width / 2, ctx.canvas.height - 80, C.UI_FONT_MEDIUM, "lightgray", "black");
}

export function drawUI(ctx) { 
    if (state.selectedTowerForUpgrade) {
        const tower = state.selectedTowerForUpgrade;
        
        const rangeRadius = tower.animatedRangeRadius !== undefined ? tower.animatedRangeRadius : tower.range;
        const rangeAlpha = tower.animatedRangeAlpha !== undefined ? tower.animatedRangeAlpha : 0.5;

        if ((tower.currentAlpha === undefined || tower.currentAlpha > 0.5)) {
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, rangeRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${rangeAlpha})`;
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

export function drawGameOverScreen(ctx) { /* Currently empty */ }
