// js/drawing.js
import * as C from './config.js';
import { images, gameState as state } from './state.js';
import { drawTextWithOutline } from './utils.js'; // Potrzebne do rysowania na canvasie (np. UI tower)

export function drawBackgroundAndPath(ctx) {
    if (!state.currentPath || state.currentPath.length === 0 || !C.levelData[state.currentLevelIndex]) {
        // Jeśli nie ma ścieżki lub danych poziomu, narysuj proste tło, aby uniknąć błędu
        ctx.fillStyle = '#cccccc'; // Domyślne tło, jeśli coś pójdzie nie tak
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }
    ctx.fillStyle = C.levelData[state.currentLevelIndex].bgColor || '#c2b280';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

export function drawTheaterBase(ctx) {
    const baseImg = images.teatrBase;
    if (!state.currentPath || state.currentPath.length === 0) return;
    const baseNode = state.currentPath[state.currentPath.length -1];
    if (!baseNode) return;

    if (baseImg && !baseImg.error) {
         const baseY = baseNode.y; // Pełna wysokość canvasa
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
        ctx.fillRect( (baseNode.x +0.5) * C.TILE_SIZE - fallbackSize/2, (baseY +0.5) * C.TILE_SIZE - fallbackSize/2, fallbackSize, fallbackSize);
    }
}

export function drawTowerSpots(ctx) {
    if (!state.currentTowerSpots) return;
    state.currentTowerSpots.forEach(spot => {
        // Rysuj wszystkie zdefiniowane spoty, zakładając, że są w granicach C.ROWS
        ctx.fillStyle = spot.occupied ? 'rgba(200, 0, 0, 0.15)' : 'rgba(0, 200, 0, 0.15)';
        ctx.strokeStyle = spot.occupied ? 'darkred' : 'darkgreen';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(spot.x * C.TILE_SIZE + C.TILE_SIZE*0.2, spot.y * C.TILE_SIZE + C.TILE_SIZE*0.2, C.TILE_SIZE*0.6, C.TILE_SIZE*0.6);
        ctx.fill();
        ctx.stroke();
    });
}

export function drawEnemies(ctx) {
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
            drawTextWithOutline(ctx, `L${enemy.level}`, enemy.x, enemy.y - enemy.height / 2 - barHeight - 5, C.UI_FONT_TINY, "white", "black");
            // ctx.fillStyle = "white";
            // ctx.font = C.UI_FONT_TINY;
            // ctx.textAlign = "center";
            // ctx.strokeStyle = "black";
            // ctx.lineWidth = 2;
            // const levelIndicator = `L${enemy.level}`;
            // ctx.strokeText(levelIndicator, enemy.x, enemy.y - enemy.height / 2 - barHeight - 5);
            // ctx.fillText(levelIndicator, enemy.x, enemy.y - enemy.height / 2 - barHeight - 5);
            // ctx.lineWidth = 1;
        }
    });
}
export function drawTowers(ctx) {
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
        
        drawTextWithOutline(ctx, `D:${tower.damageLevel}|S:${tower.fireRateLevel}`, tower.x, drawY - 6, C.UI_FONT_TINY, "#FFF", "rgba(0,0,0,0.8)");

        if (state.selectedTowerForUpgrade && state.selectedTowerForUpgrade.id === tower.id) {
            ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
            ctx.lineWidth = 4;
            ctx.strokeRect(tower.x - size / 2 -2, drawY -2, size + 4, size + 4);
            ctx.lineWidth = 1;
        }
    });
}
export function drawProjectiles(ctx) { /* ... bez zmian z poprzedniej wersji drawing.js ... */ }
export function drawWaveIntro(ctx) {
    if (!state.showingWaveIntro || state.waveIntroTimer <= 0) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.textAlign = "center"; // Ustaw raz dla wszystkich tekstów w intro
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

export function drawUI(ctx) {
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
export function drawGameOverScreen(ctx) { /* Pusta */ }