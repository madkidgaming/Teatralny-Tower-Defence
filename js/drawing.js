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

    if (baseImg && !baseImg.error) {
         const baseY = baseNode.y;
         const baseRenderWidth = C.TILE_SIZE * C.BASE_SIZE_MULTIPLIER;
         const baseRenderHeight = (baseImg.height / baseImg.width) * baseRenderWidth;
         ctx.drawImage(baseImg,
            (baseNode.x + 0.5) * C.TILE_SIZE - baseRenderWidth / 2,
            (baseY + 0.5) * C.TILE_SIZE - baseRenderHeight * 0.8,
            baseRenderWidth, baseRenderHeight);
    } else {
        ctx.fillStyle = '#8B4513'; const fallbackSize = C.TILE_SIZE * 1.5; const baseY = baseNode.y;
        ctx.fillRect( (baseNode.x +0.5) * C.TILE_SIZE - fallbackSize/2, (baseY +0.5) * C.TILE_SIZE - fallbackSize/2, fallbackSize, fallbackSize);
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

export function drawEnemies(ctx) {
    state.enemies.forEach(enemy => {
        // Jeśli wróg nie jest oznaczony jako umierający, lub jeśli jest, ale jego alpha > 0
        if (!enemy.isDying || (enemy.currentAlpha !== undefined && enemy.currentAlpha > 0)) {
            ctx.save();
            ctx.globalAlpha = enemy.currentAlpha !== undefined ? enemy.currentAlpha : 1;
            const scaleFactor = enemy.currentScale !== undefined ? enemy.currentScale : 1;
            const w = enemy.width * scaleFactor; 
            const h = enemy.height * scaleFactor;

            if (enemy.image && !enemy.image.error) {
                if (enemy.level > 1 && (enemy.currentAlpha === undefined || enemy.currentAlpha > 0.1)) { // Nie rysuj cienia dla prawie znikającego wroga
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

            // Pasek HP - można go też skalować/ukrywać przy śmierci
            if (!enemy.isDying || (enemy.currentAlpha !== undefined && enemy.currentAlpha > 0.3)) { // Ukryj pasek HP gdy wróg prawie zniknął
                const barWidth = C.TILE_SIZE * 0.8; const barHeight = 7;
                ctx.fillStyle = 'rgba(255,0,0,0.7)'; ctx.fillRect(enemy.x - barWidth / 2, enemy.y - h / 2 - barHeight - 3, barWidth, barHeight);
                ctx.fillStyle = 'rgba(0,255,0,0.7)'; ctx.fillRect(enemy.x - barWidth / 2, enemy.y - h / 2 - barHeight - 3, barWidth * (enemy.hp / enemy.maxHp), barHeight);
                if (enemy.level > 1) {
                    drawTextWithOutline(ctx, `L${enemy.level}`, enemy.x, enemy.y - h / 2 - barHeight - 5, C.UI_FONT_TINY, "white", "black");
                }
            }
        }
    });
}

export function drawTowers(ctx) {
    state.towers.forEach(tower => {
        ctx.save();
        ctx.globalAlpha = tower.currentAlpha !== undefined ? tower.currentAlpha : 1;
        
        const scaleFactor = tower.currentScale !== undefined ? tower.currentScale : 1;
        const currentRenderSize = tower.renderSize * scaleFactor;
        
        const towerCenterX = tower.x; // Punkt obrotu i skalowania
        const towerCenterY = tower.y; // Punkt obrotu i skalowania

        ctx.translate(towerCenterX, towerCenterY);
        if (tower.currentRotation !== undefined) {
            ctx.rotate(tower.currentRotation * Math.PI / 180);
        }
        // Rysujemy obrazek tak, aby jego środek był w (0,0) po translacji
        const drawXOffset = -currentRenderSize / 2;
        // Aby dół wieży (jej "stopy") był wyrównany z tower.y + TILE_SIZE / 2,
        // a skalowanie i obrót były od środka obrazka
        const drawYOffset = C.TILE_SIZE / 2 - currentRenderSize;


        if (tower.image && !tower.image.error) {
            ctx.drawImage(tower.image, drawXOffset, drawYOffset, currentRenderSize, currentRenderSize);
        } else { 
            ctx.fillStyle = tower.type === 'bileter' ? '#4CAF50' : '#FFEB3B'; 
            const fallbackSize = currentRenderSize * 0.8; 
            ctx.fillRect(drawXOffset + (currentRenderSize - fallbackSize)/2, drawYOffset + (currentRenderSize - fallbackSize), fallbackSize, fallbackSize); 
        }
        ctx.restore(); // Przywraca stan ctx (w tym translate, rotate, globalAlpha)
        
        // Tekst poziomu (D:S:) - rysowany normalnie, bez transformacji, nad wieżą
        if (tower.currentAlpha === undefined || (tower.currentAlpha > 0.9 && tower.currentScale > 0.9)) {
            const textDrawY = tower.y + C.TILE_SIZE / 2 - tower.renderSize - 6; // Y dla tekstu nad oryginalnym rozmiarem wieży
            drawTextWithOutline(ctx, `D:${tower.damageLevel}|S:${tower.fireRateLevel}`, tower.x, textDrawY, C.UI_FONT_TINY, "#FFF", "rgba(0,0,0,0.8)");
        }

        if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade.id === tower.id) {
            // Ramka zaznaczenia rysowana wokół oryginalnych wymiarów i pozycji, bez transformacji wieży
            const originalDrawYforSelection = tower.y + C.TILE_SIZE / 2 - tower.renderSize;
            ctx.strokeStyle = "rgba(255, 215, 0, 0.9)"; 
            ctx.lineWidth = 3;
            ctx.strokeRect(tower.x - tower.renderSize / 2 -2, originalDrawYforSelection -2, tower.renderSize + 4, tower.renderSize + 4);
            ctx.lineWidth = 1;
        }
    });
}

export function drawProjectiles(ctx) {
    if (state.projectiles.length > 0 && state.projectiles.some(p=>p.image)) { // Dodatkowe sprawdzenie, czy jakikolwiek pocisk ma obrazek
        // console.log("[LOG-POCISK] Rysowanie, pociski:", state.projectiles.length); // LOG 9
    }
    state.projectiles.forEach((p, index) => {
        // if (index === 0 && state.projectiles.length > 0) console.log(`[LOG-POCISK] Rysowanie pocisku ${index}: X=${p.x.toFixed(1)}, Y=${p.y.toFixed(1)}, Img: ${p.image ? p.image.src : 'BRAK'}, Img Error: ${p.image ? p.image.error : 'N/A'}`); // LOG 10
        
        if (p.image && !p.image.error) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            // Można dodać skalowanie pocisków, jeśli `p.currentScale` jest zdefiniowane
            const scale = p.currentScale !== undefined ? p.currentScale : 1;
            ctx.drawImage(p.image, -p.width * scale / 2, -p.height * scale / 2, p.width * scale, p.height * scale);
            ctx.restore();
        } else { 
            ctx.fillStyle = p.type === 'bilet' ? 'white' : 'yellow';
            const fallbackWidth = p.width || C.TILE_SIZE * 0.2;
            const fallbackHeight = p.height || C.TILE_SIZE * 0.1;
            ctx.fillRect(p.x - fallbackWidth / 2, p.y - fallbackHeight / 2, fallbackWidth, fallbackHeight);
            // if (!p.image) console.warn("[LOG-POCISK] Rysowanie fallback - BRAK obrazka dla:", p.type); // LOG 11
            // else if (p.image.error) console.warn("[LOG-POCISK] Rysowanie fallback - BŁĄD obrazka dla:", p.type, p.image.src); // LOG 12
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
            ctx.arc(effect.x, effect.y, effect.scale, 0, Math.PI * 2); // effect.scale to promień
            ctx.fill();
            ctx.restore();
        });
    }
}

export function drawWaveIntro(ctx) {
    if (!state.showingWaveIntro || state.waveIntroTimer <= 0) return;

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

    if (!state.isPaused) {
        state.waveIntroTimer--;
    }
}

export function drawUI(ctx) { // Rysuje tylko elementy specyficzne dla canvasa
    if (state.selectedTowerForUpgrade) {
        const tower = state.selectedTowerForUpgrade;
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

export function drawGameOverScreen(ctx) { /* Pusta, nieużywana */ }