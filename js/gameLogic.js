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

    state.aplauz = (250 + state.currentLevelIndex * 75) + state.currentAplauzBonusForNextLevel;
    state.currentAplauzBonusForNextLevel = 0;

    state.maxZadowolenieWidowni = 100;
    state.zadowolenieWidowni = state.maxZadowolenieWidowni;
    state.initialMaxAudienceSatisfaction = state.maxZadowolenieWidowni;
    state.zadowolenieUpgradeLevel = 0;

    // startFromWave to numer fali, od której zaczynamy (0 to pierwsza fala)
    state.currentWaveNumber = startFromWave; 
    console.log(`[gameLogic.setupLevel] Level ${levelIdx} starting at wave (0-indexed): ${startFromWave}`);

    state.enemies.length = 0;
    state.towers.length = 0;
    state.projectiles.length = 0;
    state.effects = state.effects || [];
    state.effects.length = 0;
    state.gameOver = false;
    state.waveInProgress = false;
    state.showingWaveIntro = false;
    state.showingLevelCompleteSummary = false;
    state.selectedTowerType = null;
    state.selectedTowerForUpgrade = null;
    state.isPaused = false;
    state.currentMessage = "";
    state.messageTimer = 0;
    state.levelCompleteButtons = [];

    showMessage(state, `Akt ${state.currentLevelIndex + 1}${level.name ? ': ' + level.name : ''}!`, 120);

    const currentLevelProg = state.levelProgress[state.currentLevelIndex];
    // Jeśli zaczynamy od fali 0 (nowy start poziomu lub restart po ukończeniu)
    // i poziom nie był wcześniej rozpoczęty LUB był ukończony, ustawiamy progress na -1 (nierozpoczęty).
    if (startFromWave === 0 && (currentLevelProg === undefined || currentLevelProg === -1 || currentLevelProg >= C.WAVES_PER_LEVEL)) {
        state.levelProgress[state.currentLevelIndex] = -1; 
    }
    // Jeśli kontynuujemy (startFromWave > 0), levelProgress już powinien być poprawnie ustawiony.
    saveGameProgress(state);
}

export function spawnEnemy(type, level = 1) {
    const baseStats = C.baseEnemyStats[type];
    const img = images[baseStats.imageKey];
    state.enemies.push({
        id: Date.now() + Math.random().toString(36).substring(2, 7) + '_enemy',
        type: type, level: level,
        x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
        y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
        hp: baseStats.baseHp * level, maxHp: baseStats.baseHp * level,
        speed: baseStats.speed * (1 - (level - 1) * 0.05), pathIndex: 0,
        image: img, width: baseStats.width, height: baseStats.height,
        reward: baseStats.aplauzReward,
        isDying: false,
        isDeathAnimationStarted: false
    });
}

export function updateEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];

        if (enemy.isDying) { // Jeśli animacja śmierci już się rozpoczęła, GSAP się tym zajmie
            continue;
        }

        if (enemy.hp <= 0 && !enemy.isDying) { // Jeśli HP spadło do zera, ale nie jest jeszcze oznaczony jako umierający
            handleEnemyDefeated(enemy);
            continue;
        }

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
        } else { // Wróg dotarł do bazy
            state.zadowolenieWidowni--;

            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0;
                endGame(false); // Przegrana
            }
            
            // Oznacz wroga jako umierającego, aby animacja GSAP mogła go usunąć
            if (!enemy.isDying) {
                handleEnemyDefeated(enemy, false); // false oznacza, że nie ma nagrody
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

        const newTower = {
            id: Date.now() + Math.random().toString(36).substring(2, 7) + '_tower',
            xGrid: spotXGrid, yGrid: spotYGrid,
            x: spotXGrid * C.TILE_SIZE + C.TILE_SIZE / 2, y: spotYGrid * C.TILE_SIZE + C.TILE_SIZE / 2,
            type: type, definition: definition, damageLevel: 0, fireRateLevel: 0,
            currentDamage: definition.baseDamage, currentFireRate: definition.baseFireRate,
            range: definition.range, fireCooldown: 0, projectileType: definition.projectileType,
            image: images[definition.imageKey], renderSize: definition.renderSize,
            currentScale: 0.1,
            currentAlpha: 0,
            currentRotation: -45,
            isAnimatingIn: true
        };
        state.towers.push(newTower);

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
                fireProjectile(tower, target);
                tower.fireCooldown = tower.currentFireRate;
            }
        }
    });
}

function findTarget(tower) {
    let closestEnemy = null; let minDistance = tower.range;
    state.enemies.forEach(enemy => {
        if (enemy.hp <= 0 || enemy.isDying) return; 
        const dx = enemy.x - tower.x; const dy = enemy.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) { minDistance = distance; closestEnemy = enemy; }
    });
    return closestEnemy;
}

function fireProjectile(tower, target) {
    const projectileData = C.projectileTypes[tower.projectileType];
    if (!projectileData) {
        console.error("Brak danych dla typu pocisku:", tower.projectileType);
        return;
    }
    const projectileImage = images[projectileData.imageKey];

    const fireY = (tower.y + C.TILE_SIZE / 2 - tower.definition.renderSize) + tower.definition.renderSize * 0.4;
    const newProjectile = {
        x: tower.x, y: fireY, target: target, type: tower.projectileType, speed: projectileData.speed,
        damage: tower.currentDamage, image: projectileImage,
        width: projectileData.width, height: projectileData.height,
        angle: Math.atan2(target.y - fireY, target.x - tower.x)
    };
    state.projectiles.push(newProjectile);
}

export function updateProjectiles() {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];

        if (!p.target || p.target.hp <= 0 || p.target.isDying) { 
            state.projectiles.splice(i, 1);
            continue;
        }
        const dx = p.target.x - p.x; const dy = p.target.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < p.speed) {
            p.target.hp -= p.damage;
            state.projectiles.splice(i, 1);

            const hitEffect = {
                x: p.target.x, y: p.target.y, scale: 0, alpha: 1,
                durationFrames: 20, maxScale: C.TILE_SIZE * 0.25,
                color: p.type === 'laser' ? 'rgba(255,255,100,0.9)' : 'rgba(220,220,220,0.8)',
                isNew: true
            };
            state.effects.push(hitEffect);

            if (p.target.hp <= 0 && !p.target.isDying) { 
                handleEnemyDefeated(p.target);
            }
        } else {
            p.x += (dx / distance) * p.speed; p.y += (dy / distance) * p.speed;
            p.angle = Math.atan2(dy, dx);
        }
    }
}

// Dodano parametr withReward, domyślnie true
export function handleEnemyDefeated(enemy, withReward = true) {
    if (enemy.isDying) return; 
    
    if (withReward) {
        state.aplauz += (enemy.reward * enemy.level);
    }
    enemy.isDying = true;
    // Animacja śmierci jest obsługiwana przez GSAP w main.js, który sprawdza enemy.isDying
}

export function completeLevel() {
    state.lastLevelStats.completed = true;
    state.lastLevelStats.levelName = C.levelData[state.currentLevelIndex]?.name || `Akt ${state.currentLevelIndex + 1}`;
    state.lastLevelStats.finalSatisfaction = state.zadowolenieWidowni;
    state.lastLevelStats.initialMaxSatisfaction = state.initialMaxAudienceSatisfaction;

    state.lastLevelStats.towersBuilt.bileter = state.towers.filter(t => t.type === 'bileter').length;
    state.lastLevelStats.towersBuilt.oswietleniowiec = state.towers.filter(t => t.type === 'oswietleniowiec').length;

    let totalSellValue = 0;
    state.towers.forEach(tower => {
        const towerDef = C.towerDefinitions[tower.type];
        let sellValue = Math.floor(towerDef.cost * 0.75);
        for(let i = 0; i < tower.damageLevel; i++) sellValue += Math.floor(towerDef.upgrades.damage[i].cost * 0.5);
        for(let i = 0; i < tower.fireRateLevel; i++) sellValue += Math.floor(towerDef.upgrades.fireRate[i].cost * 0.5);
        totalSellValue += sellValue;
    });
    state.lastLevelStats.totalTowerValue = totalSellValue;
    state.lastLevelStats.remainingAplauz = state.aplauz;

    if (state.zadowolenieWidowni === state.initialMaxAudienceSatisfaction) {
        state.lastLevelStats.stars = 3;
    } else if (state.zadowolenieWidowni >= 0.6 * state.initialMaxAudienceSatisfaction) {
        state.lastLevelStats.stars = 2;
    } else if (state.zadowolenieWidowni > 0) {
        state.lastLevelStats.stars = 1;
    } else {
        state.lastLevelStats.stars = 0;
    }

    state.lastLevelStats.aplauzBonusForNextLevel = state.aplauz + totalSellValue;
    state.currentAplauzBonusForNextLevel = state.lastLevelStats.aplauzBonusForNextLevel;

    // Zamiast ustawiać levelProgress na state.currentWaveNumber, ustawiamy na C.WAVES_PER_LEVEL
    // bo to oznacza, że wszystkie fale zostały ukończone.
    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL; 
    if (state.currentLevelIndex < C.levelData.length - 1) {
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2);
    }
    saveGameProgress(state);

    state.gameOver = true;
    state.gameScreen = 'levelCompleteCanvas'; 
    state.showingLevelCompleteSummary = true; 
    console.log(`[gameLogic.js completeLevel] Level ${state.currentLevelIndex + 1} completed. Screen: ${state.gameScreen}`);
}


export function prepareNextWave() {
    // state.currentWaveNumber jest indeksem następnej fali (0 dla pierwszej)
    if (state.waveInProgress || state.gameOver || state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
        console.log(`[gameLogic.prepareNextWave] Cannot prepare wave. InProgress: ${state.waveInProgress}, GameOver: ${state.gameOver}, CurrentWave: ${state.currentWaveNumber}`);
        return;
    }
    
    console.log(`[gameLogic.prepareNextWave] Preparing wave (0-indexed): ${state.currentWaveNumber}. Displayed as: ${state.currentWaveNumber + 1}`);
    state.showingWaveIntro = true; 
    state.waveIntroTimer = 180;
    state.waveIntroEnemies = [];

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const wavePattern = C.waveDefinitionsBase[waveIndexForDefinition];
    
    if (wavePattern.krytyk.count > 0) state.waveIntroEnemies.push({type: 'krytyk', level: wavePattern.krytyk.level, image: images.krytykTeatralny});
    if (wavePattern.spozniony.count > 0) state.waveIntroEnemies.push({type: 'spozniony', level: wavePattern.spozniony.level, image: images.spoznionyWidz});
    if (wavePattern.boss) state.waveIntroEnemies.push({type: wavePattern.boss.type, level: wavePattern.boss.level, image: images[C.baseEnemyStats[wavePattern.boss.type].imageKey], isBoss: true});
}

export function startNextWaveActual() {
    state.showingWaveIntro = false;
    state.waveInProgress = true;
    // state.currentWaveNumber już wskazuje na falę, która się rozpoczyna
    console.log(`[gameLogic.startNextWaveActual] Starting wave (0-indexed): ${state.currentWaveNumber}. Displayed as: ${state.currentWaveNumber + 1}`);
    showMessage(state, `Fala ${state.currentWaveNumber + 1} rozpoczęta!`, 60);

    // Zapisz postęp: state.currentWaveNumber to numer fali, która właśnie się rozpoczęła (0-indexed)
    // state.levelProgress powinien przechowywać *ostatnią ukończoną* lub *aktualnie trwającą najwyższą* falę
    const previousProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(previousProgress, state.currentWaveNumber);
    saveGameProgress(state);

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const waveData = JSON.parse(JSON.stringify(C.waveDefinitionsBase[waveIndexForDefinition]));
    const difficultyScale = 1 + (state.currentWaveNumber) * 0.025 + state.currentLevelIndex * 0.015;
    state.currentWaveSpawns = [];

    if (waveData.krytyk) {
        for(let i=0; i < Math.ceil(waveData.krytyk.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'krytyk', level: waveData.krytyk.level});
    }
    if (waveData.spozniony) {
        for(let i=0; i < Math.ceil(waveData.spozniony.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'spozniony', level: waveData.spozniony.level});
    }
    if (waveData.boss && (state.currentWaveNumber + 1) % 5 === 0) { 
         state.currentWaveSpawns.push({
            type: waveData.boss.type, level: waveData.boss.level, isBoss: true,
            hpMultiplier: waveData.boss.hpMultiplier || (1 + (waveData.boss.level-1)*0.4),
        });
    }
    state.currentWaveSpawns.sort(() => Math.random() - 0.5);
    state.currentWaveSpawnsLeft = state.currentWaveSpawns.length;
    state.spawnInterval = Math.max(35, waveData.interval * (1 - state.currentLevelIndex * 0.02) * (1 - (state.currentWaveNumber)*0.01) );
    state.spawnTimer = state.spawnInterval > 60 ? 60 : state.spawnInterval; 
}

export function handleWaveSpawning() {
    if (state.waveInProgress && state.currentWaveSpawnsLeft > 0) {
        state.spawnTimer--;
        if (state.spawnTimer <= 0) {
            const enemyToSpawnData = state.currentWaveSpawns.shift(); 
            state.currentWaveSpawnsLeft--;
            if (enemyToSpawnData.isBoss) {
                const bossBaseStats = C.baseEnemyStats[enemyToSpawnData.type];
                const bossImg = images[bossBaseStats.imageKey];
                const newBoss = {
                    id: Date.now() + Math.random().toString(36).substring(2, 7) + '_boss',
                    type: enemyToSpawnData.type, level: enemyToSpawnData.level,
                    x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2, y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
                    hp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    maxHp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    speed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15), pathIndex: 0,
                    image: bossImg, width: bossBaseStats.width * 1.3, height: bossBaseStats.height * 1.3,
                    reward: C.baseEnemyStats[enemyToSpawnData.type].aplauzReward * 2, 
                    isDying: false, isDeathAnimationStarted: false
                };
                state.enemies.push(newBoss);
            } else spawnEnemy(enemyToSpawnData.type, enemyToSpawnData.level);
            state.spawnTimer = state.spawnInterval;
        }
    }
}

export function endGame(isWin) {
    if (state.gameOver && !isWin) {
        return;
    }
    if (isWin) {
        if (!state.gameOver) { 
            completeLevel();
        }
        return;
    }

    state.gameOver = true;
    state.waveInProgress = false;
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 30000);
    saveGameProgress(state);
    state.gameScreen = 'levelLost';
}


export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) showMessage(state, "Pauza", 360000);
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
    state.selectedTowerForUpgrade = null;
    saveGameProgress(state);
}