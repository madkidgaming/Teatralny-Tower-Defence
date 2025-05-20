// js/gameLogic.js
import * as C from './config.js';
import { gameState as state, images } from './state.js';
import { showMessage } from './utils.js';
import { saveGameProgress } from './storage.js';

export function setupLevel(levelIdx, startFromWave = 0) {
    state.currentLevelIndex = levelIdx;
    const level = C.levelData[state.currentLevelIndex];
    if (!level) {
        console.error("Nie znaleziono danych dla poziomu:", levelIdx);
        showMessage(state, "Błąd: Nie można załadować danych poziomu.", 300);
        state.gameScreen = 'menu'; 
        return;
    }
    state.currentPath = JSON.parse(JSON.stringify(level.path));
    state.currentTowerSpots = level.towerSpots.map(spot => ({...spot, occupied: false}));

    state.aplauz = 250 + state.currentLevelIndex * 75;
    state.maxZadowolenieWidowni = 100;
    state.zadowolenieWidowni = state.maxZadowolenieWidowni;
    state.zadowolenieUpgradeLevel = 0;

    state.currentWaveNumber = startFromWave;
    state.enemies.length = 0;
    state.towers.length = 0;
    state.projectiles.length = 0;
    state.gameOver = false;
    state.waveInProgress = false;
    state.showingWaveIntro = false;
    state.selectedTowerType = null;
    state.selectedTowerForUpgrade = null;
    state.isPaused = false;
    state.currentMessage = "";
    state.messageTimer = 0;

    showMessage(state, `Akt ${state.currentLevelIndex + 1}${level.name ? ': ' + level.name : ''}!`, 120);
    
    const currentLevelProg = state.levelProgress[state.currentLevelIndex];
    if (startFromWave === 0 && (currentLevelProg === undefined || currentLevelProg === -1 || currentLevelProg >= C.WAVES_PER_LEVEL)) {
        state.levelProgress[state.currentLevelIndex] = -1;
    }
    saveGameProgress(state);
}

export function spawnEnemy(type, level = 1) {
    const baseStats = C.baseEnemyStats[type];
    const img = images[baseStats.imageKey];
    state.enemies.push({
        type: type, level: level, 
        x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
        y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
        hp: baseStats.baseHp * level, maxHp: baseStats.baseHp * level,
        speed: baseStats.speed * (1 - (level - 1) * 0.05), pathIndex: 0,
        image: img, width: baseStats.width, height: baseStats.height,
        reward: baseStats.aplauzReward 
    });
}

export function updateEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        if (enemy.pathIndex < state.currentPath.length - 1) {
            const targetNode = state.currentPath[enemy.pathIndex + 1];
            const targetX = targetNode.x * C.TILE_SIZE + C.TILE_SIZE / 2;
            const targetY = targetNode.y * C.TILE_SIZE + C.TILE_SIZE / 2;
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < enemy.speed) {
                enemy.pathIndex++; enemy.x = targetX; enemy.y = targetY;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else {
            state.zadowolenieWidowni--; state.enemies.splice(i, 1);
            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0; endGame(false);
            }
        }
    }
}

export function buildTower(spotXGrid, spotYGrid, type) {
    const definition = C.towerDefinitions[type];
    if (!definition) {
        showMessage(state, "Błąd: Nieznany typ wieży.", 120); return false;
    }
    if (state.aplauz >= definition.cost) {
        const spot = state.currentTowerSpots.find(s => s.x === spotXGrid && s.y === spotYGrid);
        if (!spot) {
            showMessage(state, "Błąd: Nieprawidłowe miejsce na wieżę.", 120); return false;
        }
        if (spot.occupied) {
            showMessage(state, "To miejsce jest już zajęte!", 120); return false;
        }
        state.aplauz -= definition.cost; spot.occupied = true;
        state.towers.push({
            id: Date.now() + Math.random(), xGrid: spotXGrid, yGrid: spotYGrid,
            x: spotXGrid * C.TILE_SIZE + C.TILE_SIZE / 2, y: spotYGrid * C.TILE_SIZE + C.TILE_SIZE / 2, 
            type: type, definition: definition, damageLevel: 0, fireRateLevel: 0, 
            currentDamage: definition.baseDamage, currentFireRate: definition.baseFireRate,
            range: definition.range, fireCooldown: 0, projectileType: definition.projectileType,
            image: images[definition.imageKey], renderSize: definition.renderSize
        });
        showMessage(state, `${definition.imageKey === 'bileterTowerIcon' ? 'Bileter' : 'Reflektor'} postawiony!`, 90);
        saveGameProgress(state);
        return true;
    } else {
        showMessage(state, "Za mało Aplauzu na tę wieżę!", 120); return false;
    }
}

export function upgradeTower(tower, upgradeType) {
    if (!tower) return;
    const definition = tower.definition.upgrades[upgradeType];
    const currentLevel = upgradeType === 'damage' ? tower.damageLevel : tower.fireRateLevel;
    if (currentLevel < C.MAX_UPGRADE_LEVEL) {
        const upgradeData = definition[currentLevel]; 
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;
            if (upgradeType === 'damage') {
                tower.currentDamage += upgradeData.value; tower.damageLevel++;
            } else if (upgradeType === 'fireRate') {
                tower.currentFireRate = Math.max(10, tower.currentFireRate - upgradeData.value); tower.fireRateLevel++;
            }
            showMessage(state, `${tower.definition.imageKey === 'bileterTowerIcon' ? 'Bileter' : 'Reflektor'} ulepszony!`, 90);
            saveGameProgress(state);
        } else {
            showMessage(state, "Za mało Aplauzu na to ulepszenie!", 120);
        }
    } else {
        showMessage(state, "Wieża osiągnęła maksymalny poziom tego ulepszenia.", 120);
    }
}

export function upgradeZadowolenie() {
    if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
        const upgradeData = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel];
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;
            state.maxZadowolenieWidowni += upgradeData.bonus;
            state.zadowolenieWidowni += upgradeData.bonus; 
            state.zadowolenieUpgradeLevel++;
            showMessage(state, `Zadowolenie Widowni ulepszone do ${state.maxZadowolenieWidowni}!`, 90);
            saveGameProgress(state);
        } else {
            showMessage(state, "Za mało Aplauzu na ulepszenie Zadowolenia!", 120);
        }
    } else {
        showMessage(state, "Zadowolenie Widowni na maksymalnym poziomie!", 120);
    }
}

export function updateTowers() {
    state.towers.forEach(tower => {
        if (tower.fireCooldown > 0) tower.fireCooldown--;
        else {
            const target = findTarget(tower);
            if (target) { 
                fireProjectile(tower, target); // Wywołanie fireProjectile
                tower.fireCooldown = tower.currentFireRate; 
            }
        }
    });
}

function findTarget(tower) {
    let closestEnemy = null; let minDistance = tower.range;
    state.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const dx = enemy.x - tower.x; const dy = enemy.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) { minDistance = distance; closestEnemy = enemy; }
    });
    return closestEnemy;
}

function fireProjectile(tower, target) {
    const projectileData = C.projectileTypes[tower.projectileType];
    if (!projectileData) {
        console.error("[LOG-POCISK] Brak danych dla typu pocisku:", tower.projectileType); // LOG 1
        return;
    }
    const projectileImage = images[projectileData.imageKey];
    if (!projectileImage) {
        console.error("[LOG-POCISK] Brak obrazka dla pocisku (klucz):", projectileData.imageKey); // LOG 2
    } else if (projectileImage.error) {
        console.error("[LOG-POCISK] Błąd ładowania obrazka dla pocisku:", projectileData.imageKey, projectileImage.src); // LOG 3
    }

    const fireY = (tower.y + C.TILE_SIZE / 2 - tower.definition.renderSize) + tower.definition.renderSize * 0.4; 
    const newProjectile = {
        x: tower.x, y: fireY, target: target, type: tower.projectileType, speed: projectileData.speed,
        damage: tower.currentDamage, image: projectileImage, // Użyj projectileImage
        width: projectileData.width, height: projectileData.height,
        angle: Math.atan2(target.y - fireY, target.x - tower.x)
    };
    state.projectiles.push(newProjectile);
    console.log("[LOG-POCISK] Wystrzelono:", JSON.parse(JSON.stringify(newProjectile)), "Obrazek:", (projectileImage ? projectileImage.src : "BRAK"), "Liczba pocisków:", state.projectiles.length); // LOG 4
}

export function updateProjectiles() {
    // if (state.projectiles.length > 0) console.log("[LOG-POCISK] Aktualizacja, pociski:", state.projectiles.length); // LOG 5 (może być dużo logów)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        // if (i === 0 && state.projectiles.length > 0) console.log(`[LOG-POCISK] Aktualizacja pocisku ${i}: X=${p.x.toFixed(1)}, Y=${p.y.toFixed(1)}, Cel HP: ${p.target ? p.target.hp : 'BRAK'}`); // LOG 6 (loguj tylko pierwszy)

        if (!p.target || p.target.hp <= 0) { 
            // console.log("[LOG-POCISK] Usuwanie pocisku - brak celu lub cel martwy"); // LOG 7
            state.projectiles.splice(i, 1); 
            continue; 
        }
        const dx = p.target.x - p.x; const dy = p.target.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < p.speed) {
            // console.log("[LOG-POCISK] Trafienie! Obrażenia:", p.damage); // LOG 8
            p.target.hp -= p.damage; 
            state.projectiles.splice(i, 1);
            if (p.target.hp <= 0) handleEnemyDefeated(p.target);
        } else {
            p.x += (dx / distance) * p.speed; p.y += (dy / distance) * p.speed;
            p.angle = Math.atan2(dy, dx);
        }
    }
}

function handleEnemyDefeated(enemy) {
    state.aplauz += (enemy.reward * enemy.level);
    const index = state.enemies.indexOf(enemy);
    if (index > -1) state.enemies.splice(index, 1);
    if (state.waveInProgress && state.enemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        state.waveInProgress = false;
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber;
        saveGameProgress(state);
        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) completeLevel();
        else showMessage(state, `Fala ${state.currentWaveNumber} pokonana!`, 120);
    }
}

function completeLevel() {
    showMessage(state, `Akt ${state.currentLevelIndex + 1} ukończony! Brawo!`, 240);
    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL;
    if (state.currentLevelIndex < C.levelData.length - 1) {
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2);
    }
    saveGameProgress(state);
    state.gameOver = true;
    state.gameScreen = 'levelComplete';
}

export function prepareNextWave() {
    if (state.waveInProgress || state.gameOver || state.currentWaveNumber >= C.WAVES_PER_LEVEL) return;
    state.showingWaveIntro = true; state.waveIntroTimer = 180; state.waveIntroEnemies = [];
    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1); 
    const wavePattern = C.waveDefinitionsBase[waveIndexForDefinition];
    if (wavePattern.krytyk.count > 0) state.waveIntroEnemies.push({type: 'krytyk', level: wavePattern.krytyk.level, image: images.krytykTeatralny});
    if (wavePattern.spozniony.count > 0) state.waveIntroEnemies.push({type: 'spozniony', level: wavePattern.spozniony.level, image: images.spoznionyWidz});
    if (wavePattern.boss) state.waveIntroEnemies.push({type: wavePattern.boss.type, level: wavePattern.boss.level, image: images[C.baseEnemyStats[wavePattern.boss.type].imageKey], isBoss: true});
}

export function startNextWaveActual() {
    state.showingWaveIntro = false; state.currentWaveNumber++; state.waveInProgress = true;
    showMessage(state, `Fala ${state.currentWaveNumber} rozpoczęta!`, 60);
    
    const waveToRecord = state.currentWaveNumber === 1 ? 0 : state.currentWaveNumber -1;
    const previousProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(previousProgress, waveToRecord);
    saveGameProgress(state);
    
    const waveIndexForDefinition = Math.min(state.currentWaveNumber - 1, C.waveDefinitionsBase.length - 1);
    const waveData = JSON.parse(JSON.stringify(C.waveDefinitionsBase[waveIndexForDefinition])); 
    const difficultyScale = 1 + (state.currentWaveNumber - 1) * 0.025 + state.currentLevelIndex * 0.015; 
    state.currentWaveSpawns = [];
    if (waveData.krytyk) {
        for(let i=0; i < Math.ceil(waveData.krytyk.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'krytyk', level: waveData.krytyk.level});
    }
    if (waveData.spozniony) {
        for(let i=0; i < Math.ceil(waveData.spozniony.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'spozniony', level: waveData.spozniony.level});
    }
    if (waveData.boss && state.currentWaveNumber % 5 === 0) { 
         state.currentWaveSpawns.push({
            type: waveData.boss.type, level: waveData.boss.level, isBoss: true, 
            hpMultiplier: waveData.boss.hpMultiplier || (1 + (waveData.boss.level-1)*0.4), 
        });
    }
    state.currentWaveSpawns.sort(() => Math.random() - 0.5);
    state.currentWaveSpawnsLeft = state.currentWaveSpawns.length;
    state.spawnInterval = Math.max(35, waveData.interval * (1 - state.currentLevelIndex * 0.02) * (1 - (state.currentWaveNumber-1)*0.01) ); 
    state.spawnTimer = 0;
}

export function handleWaveSpawning() {
    if (state.waveInProgress && state.currentWaveSpawnsLeft > 0) {
        state.spawnTimer--;
        if (state.spawnTimer <= 0) {
            const enemyToSpawnData = state.currentWaveSpawns.shift(); state.currentWaveSpawnsLeft--;
            if (enemyToSpawnData.isBoss) {
                const bossBaseStats = C.baseEnemyStats[enemyToSpawnData.type];
                const bossImg = images[bossBaseStats.imageKey];
                state.enemies.push({
                    type: enemyToSpawnData.type, level: enemyToSpawnData.level,
                    x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2, y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
                    hp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    maxHp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    speed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15), pathIndex: 0,
                    image: bossImg, width: bossBaseStats.width * 1.3, height: bossBaseStats.height * 1.3,
                    reward: C.baseEnemyStats[enemyToSpawnData.type].aplauzReward 
                });
            } else spawnEnemy(enemyToSpawnData.type, enemyToSpawnData.level);
            state.spawnTimer = state.spawnInterval;
        }
    }
}

export function endGame(isWin) {
    if (isWin) return;
    state.gameOver = true; state.waveInProgress = false;
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 300);
    saveGameProgress(state); state.gameScreen = 'levelLost';
}

export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) showMessage(state, "Pauza", 36000);
    else showMessage(state, "Wznowiono", 60);
}

export function sellTower(towerToSell) {
    if (!towerToSell) return;
    const towerDef = C.towerDefinitions[towerToSell.type];
    let sellValue = Math.floor(towerDef.cost * 0.75);
    for(let i=0; i < towerToSell.damageLevel; i++) sellValue += Math.floor(towerDef.upgrades.damage[i].cost * 0.5);
    for(let i=0; i < towerToSell.fireRateLevel; i++) sellValue += Math.floor(towerDef.upgrades.fireRate[i].cost * 0.5);
    state.aplauz += sellValue;
    const index = state.towers.findIndex(t => t.id === towerToSell.id);
    if (index > -1) state.towers.splice(index, 1);
    const spot = state.currentTowerSpots.find(s => s.x === towerToSell.xGrid && s.y === towerToSell.yGrid);
    if (spot) spot.occupied = false;
    showMessage(state, `Sprzedano wieżę za ${sellValue} Aplauzu.`, 120);
    saveGameProgress(state);
}