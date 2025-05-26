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

    state.currentWaveNumber = startFromWave; // startFromWave to numer fali, od której zaczynamy (0 to pierwsza)
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

    // state.levelProgress przechowuje numer ostatniej ukończonej fali (0-9)
    // Jeśli startFromWave jest 0 (nowy poziom lub restart), to resetujemy postęp na -1 (nierozpoczęty)
    // chyba że poziom był już ukończony, wtedy też można go zacząć od nowa.
    const currentLevelProg = state.levelProgress[state.currentLevelIndex];
    if (startFromWave === 0) { // Zaczynamy od początku
         if (currentLevelProg === undefined || currentLevelProg === -1 || currentLevelProg >= C.WAVES_PER_LEVEL) {
            state.levelProgress[state.currentLevelIndex] = -1; // Oznacz jako nierozpoczęty, jeśli zaczynamy od nowa
        }
        // Jeśli currentLevelProg jest między 0 a WAVES_PER_LEVEL-1, a my zaczynamy od 0,
        // to oznacza, że gracz wybrał restart poziomu, więc progress zostaje taki jaki jest (lub -1).
        // W praktyce, ScreenManager powinien przekazać startFromWave=0 dla "Nowa Gra" na poziomie
        // lub startFromWave=progress+1 dla "Kontynuuj".
    }
    // Jeśli startFromWave > 0, to znaczy, że kontynuujemy, więc levelProgress już jest ustawiony.

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

        if (enemy.isDying) {
            continue;
        }

        if (enemy.hp <= 0 && !enemy.isDying) {
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
        } else {
            state.zadowolenieWidowni--;

            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0;
                endGame(false); // Przegrana
            }

            // Usuń wroga z listy, nawet jeśli nie ma animacji (aby nie "wisiał" na końcu)
             if (!enemy.isDying) { // Tylko jeśli jeszcze nie umiera
                enemy.isDying = true; 
                enemy.hp = 0; // Upewnij się, że HP to 0
                // Można dodać animację zniknięcia
                gsap.to(enemy, { 
                    duration: 0.3, 
                    currentAlpha: 0, 
                    onComplete: () => {
                        const index = state.enemies.indexOf(enemy);
                        if (index > -1) state.enemies.splice(index, 1);
                    }
                });
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
        if (enemy.hp <= 0 || enemy.isDying) return; // Nie celuj w umierających
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
    // Nie ma potrzeby sprawdzać projectileImage.error tutaj, bo jest to robione w pętli rysowania

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

        if (!p.target || p.target.hp <= 0 || p.target.isDying) { // Pocisk znika, jeśli cel umarł/umiera
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

            if (p.target.hp <= 0 && !p.target.isDying) { // Tylko jeśli jeszcze nie rozpoczął umierania
                handleEnemyDefeated(p.target);
            }
        } else {
            p.x += (dx / distance) * p.speed; p.y += (dy / distance) * p.speed;
            p.angle = Math.atan2(dy, dx);
        }
    }
}

export function handleEnemyDefeated(enemy) {
    if (enemy.isDying) return; // Jeśli już umiera, nie rób nic (np. przez inne trafienie)
    
    state.aplauz += (enemy.reward * enemy.level);
    enemy.isDying = true; // Oznacz jako umierający, animacja GSAP w main.js się tym zajmie
    // GSAP w main.js ustawi isDeathAnimationStarted = true i animacje
}


export function completeLevel() {
    // console.log(`[GameLogic.completeLevel] Called. Current wave: ${state.currentWaveNumber}, Satisfaction: ${state.zadowolenieWidowni}`);

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
        state.lastLevelStats.stars = 0; // Mimo że technicznie przegrana, ale może być ukończony poziom z 0 zadowolenia
    }

    state.lastLevelStats.aplauzBonusForNextLevel = state.aplauz + totalSellValue;
    state.currentAplauzBonusForNextLevel = state.lastLevelStats.aplauzBonusForNextLevel;

    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL; // Oznacz poziom jako ukończony
    if (state.currentLevelIndex < C.levelData.length - 1) {
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2);
    }
    saveGameProgress(state);

    state.gameOver = true; // Oznacz grę jako zakończoną (ale wygraną na tym poziomie)
    state.gameScreen = 'levelCompleteCanvas'; 
    state.showingLevelCompleteSummary = true; 

    // console.log(`[GameLogic.completeLevel] Finished. Set gameOver=${state.gameOver}, gameScreen=${state.gameScreen}, showingLevelCompleteSummary=${state.showingLevelCompleteSummary}. Stars: ${state.lastLevelStats.stars}`);
}


export function prepareNextWave() {
    // currentWaveNumber to numer fali, która *ma się odbyć* (0 to pierwsza)
    // Jeśli currentWaveNumber >= WAVES_PER_LEVEL, to wszystkie fale się odbyły
    if (state.waveInProgress || state.gameOver || state.currentWaveNumber >= C.WAVES_PER_LEVEL) return;
    
    state.showingWaveIntro = true; 
    state.waveIntroTimer = 180; // 3 sekundy (180 klatek / 60fps)
    state.waveIntroEnemies = [];

    // Definicja fali jest oparta o state.currentWaveNumber (0 dla pierwszej fali, itd.)
    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const wavePattern = C.waveDefinitionsBase[waveIndexForDefinition];
    
    if (wavePattern.krytyk.count > 0) state.waveIntroEnemies.push({type: 'krytyk', level: wavePattern.krytyk.level, image: images.krytykTeatralny});
    if (wavePattern.spozniony.count > 0) state.waveIntroEnemies.push({type: 'spozniony', level: wavePattern.spozniony.level, image: images.spoznionyWidz});
    if (wavePattern.boss) state.waveIntroEnemies.push({type: wavePattern.boss.type, level: wavePattern.boss.level, image: images[C.baseEnemyStats[wavePattern.boss.type].imageKey], isBoss: true});
}

export function startNextWaveActual() {
    state.showingWaveIntro = false;
    // currentWaveNumber jest już ustawione na falę, która się rozpoczyna (np. 0 dla pierwszej)
    // state.currentWaveNumber++; // Nie inkrementujemy tutaj, currentWaveNumber to numer *nadchodzącej* fali
    state.waveInProgress = true;
    showMessage(state, `Fala ${state.currentWaveNumber + 1} rozpoczęta!`, 60); // +1 dla wyświetlania dla gracza

    // Zapisujemy postęp jako *ostatnią rozpoczętą* falę.
    // Jeśli state.currentWaveNumber to 0 (pierwsza fala), zapisujemy 0.
    const previousProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(previousProgress, state.currentWaveNumber);
    saveGameProgress(state);

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const waveData = JSON.parse(JSON.stringify(C.waveDefinitionsBase[waveIndexForDefinition]));
    const difficultyScale = 1 + (state.currentWaveNumber) * 0.025 + state.currentLevelIndex * 0.015; // currentWaveNumber jest 0-indexed
    state.currentWaveSpawns = [];

    if (waveData.krytyk) {
        for(let i=0; i < Math.ceil(waveData.krytyk.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'krytyk', level: waveData.krytyk.level});
    }
    if (waveData.spozniony) {
        for(let i=0; i < Math.ceil(waveData.spozniony.count * difficultyScale); i++) state.currentWaveSpawns.push({type: 'spozniony', level: waveData.spozniony.level});
    }
    // Boss pojawia się np. co 5 fal (fale 4, 9, itd. jeśli currentWaveNumber jest 0-indexed)
    if (waveData.boss && (state.currentWaveNumber + 1) % 5 === 0) { 
         state.currentWaveSpawns.push({
            type: waveData.boss.type, level: waveData.boss.level, isBoss: true,
            hpMultiplier: waveData.boss.hpMultiplier || (1 + (waveData.boss.level-1)*0.4),
        });
    }
    state.currentWaveSpawns.sort(() => Math.random() - 0.5); // Tasowanie kolejności
    state.currentWaveSpawnsLeft = state.currentWaveSpawns.length;
    state.spawnInterval = Math.max(35, waveData.interval * (1 - state.currentLevelIndex * 0.02) * (1 - (state.currentWaveNumber)*0.01) );
    state.spawnTimer = 0; // Pierwszy spawn od razu lub po krótkim opóźnieniu
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
                    reward: C.baseEnemyStats[enemyToSpawnData.type].aplauzReward * 2, // Boss daje więcej nagrody
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
        return; // Już przegrana, nie rób nic
    }
    if (isWin) {
        if (!state.gameOver) { 
            completeLevel(); // To ustawi gameOver na true i odpowiedni screen
        }
        return;
    }

    // Przegrana
    state.gameOver = true;
    state.waveInProgress = false;
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 30000);
    saveGameProgress(state); // Zapisz stan przegranej (np. żeby nie można było kontynuować tego poziomu)
    state.gameScreen = 'levelLost';
}


export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) showMessage(state, "Pauza", 360000); // Dłuższy czas dla pauzy
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
    state.selectedTowerForUpgrade = null; // Odznacz wieżę po sprzedaży
    saveGameProgress(state);
}