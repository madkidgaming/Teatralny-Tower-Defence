// js/gameLogic.js
import * as C from './config.js';
import { gameState as state, images } from './state.js';
import { showMessage } from './utils.js';
import { saveGameProgress } from './storage.js';

// Funkcja pomocnicza do obliczania wartości sprzedaży wieży
function calculateTowerSellValue(towerInstance) {
    if (!towerInstance) return 0;

    const towerDef = C.towerDefinitions[towerInstance.type];
    if (!towerDef) return 0;

    let sellValue = Math.floor(towerDef.cost * 0.75); 

    towerDef.upgradeLevelNames?.forEach(upgradeName => {
        const levelKey = `${upgradeName}Level`;
        const currentUpgradeLevel = towerInstance[levelKey] || 0;
        if (towerDef.upgrades[upgradeName]) {
            for (let i = 0; i < currentUpgradeLevel; i++) {
                sellValue += Math.floor((towerDef.upgrades[upgradeName][i]?.cost || 0) * 0.5);
            }
        }
    });
    return sellValue;
}


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
    state.currentTowerSpots = C.levelData[state.currentLevelIndex].towerSpots.map(spot => ({...spot, occupied: false}));

    state.aplauz = (325 + state.currentLevelIndex * 85) + state.currentAplauzBonusForNextLevel;
    state.currentAplauzBonusForNextLevel = 0; 

    state.maxZadowolenieWidowni = 100;
    state.zadowolenieWidowni = state.maxZadowolenieWidowni;
    state.initialMaxAudienceSatisfaction = state.maxZadowolenieWidowni;
    state.zadowolenieUpgradeLevel = 0;

    state.currentWaveNumber = startFromWave;
    console.log(`[gameLogic.setupLevel] Level ${levelIdx} starting at wave (0-indexed): ${startFromWave}`);

    state.enemies.length = 0;
    state.towers.length = 0;
    state.projectiles.length = 0;
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
    state.lastLevelStats.starStates.forEach(star => {
        star.scale = 0; star.opacity = 0; star.isFilled = false;
        star.fillProgress = 0; star.character = '☆'; star.color = '#777777';
    });
    state.lastLevelStats.isStarAnimationComplete = false;
    state.lastLevelStats.towersBuilt = {
        bileter: 0,
        oswietleniowiec: 0,
        garderobiana: 0,
        budkaInspicjenta: 0
    };


    state.currentBackgroundTileMap = [];
    for (let row = 0; row < C.ROWS; row++) {
        state.currentBackgroundTileMap[row] = [];
        for (let col = 0; col < C.COLS; col++) {
            let tileData;
            const isPathTile = state.currentPath.some(p => p.x === col && p.y === row);

            if (isPathTile) {
                tileData = C.pathVariants[Math.floor(Math.random() * C.pathVariants.length)];
            } else {
                const rand = Math.random();
                if (rand < 0.75) { 
                    tileData = C.tileTypes.GRASS_BASIC;
                } else {
                    const decorativeGrass = [
                        C.tileTypes.GRASS_FLOWER_YELLOW,
                        C.tileTypes.GRASS_FLOWER_WHITE,
                        C.tileTypes.GRASS_BLADES_1,
                        C.tileTypes.GRASS_BLADES_2
                    ];
                    tileData = decorativeGrass[Math.floor(Math.random() * decorativeGrass.length)];
                }
            }
            state.currentBackgroundTileMap[row][col] = tileData;
        }
    }

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
    const newEnemy = {
        id: Date.now() + Math.random().toString(36).substring(2, 7) + `_enemy_${type}`,
        type: type, level: level,
        x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
        y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
        hp: baseStats.baseHp * level, maxHp: baseStats.baseHp * level,
        speed: baseStats.speed * (1 - (level - 1) * 0.05), 
        currentSpeed: baseStats.speed * (1 - (level - 1) * 0.05),
        pathIndex: 0,
        image: img, width: baseStats.width, height: baseStats.height,
        reward: baseStats.aplauzReward,
        isDying: false,
        isDeathAnimationStarted: false,
        isSlowed: false,
        slowTimer: 0,
        slowFactor: 1,
        damageTakenMultiplier: 1,
        debuffSourceTowerId: null,
    };

    if (type === 'diva') {
        newEnemy.baseDamageReduction = baseStats.damageReduction;
        newEnemy.currentDamageReduction = baseStats.damageReduction;
        newEnemy.furyThreshold = baseStats.furyThreshold;
        newEnemy.furySpeedMultiplier = baseStats.furySpeedMultiplier;
        newEnemy.furyDamageReduction = baseStats.furyDamageReduction;
        newEnemy.furyDuration = baseStats.furyDuration;
        newEnemy.furyActive = false;
        newEnemy.furyTimer = 0;
    }
    if (type === 'techniczny') {
        newEnemy.sabotageChance = baseStats.sabotageChance;
        newEnemy.sabotageDuration = baseStats.sabotageDuration;
        newEnemy.sabotageCooldown = 0; 
        newEnemy.baseSabotageCooldown = baseStats.sabotageCooldown; 
    }

    state.enemies.push(newEnemy);
}

export function updateEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];

        if (enemy.isDying) continue;

        if (enemy.slowTimer > 0) {
            enemy.slowTimer--;
            if (enemy.slowTimer <= 0) {
                enemy.isSlowed = false;
                enemy.currentSpeed = (enemy.type === 'diva' && enemy.furyActive) ? (enemy.speed * enemy.furySpeedMultiplier) : enemy.speed;
                enemy.damageTakenMultiplier = 1;
                enemy.debuffSourceTowerId = null;
            }
        }
        
        if (enemy.type === 'diva') {
            if (enemy.furyActive) {
                enemy.furyTimer--;
                if (enemy.furyTimer <= 0) {
                    enemy.furyActive = false;
                    enemy.currentSpeed = enemy.speed * (enemy.isSlowed ? enemy.slowFactor : 1);
                    enemy.currentDamageReduction = enemy.baseDamageReduction;
                }
            } else if (!enemy.isDying && enemy.hp / enemy.maxHp <= enemy.furyThreshold) {
                enemy.furyActive = true;
                enemy.furyTimer = enemy.furyDuration;
                enemy.currentSpeed = enemy.speed * enemy.furySpeedMultiplier * (enemy.isSlowed ? enemy.slowFactor : 1);
                enemy.currentDamageReduction = enemy.furyDamageReduction;
            }
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

            const speedToUse = enemy.currentSpeed;

            if (distance < speedToUse) {
                enemy.pathIndex++;
                enemy.x = targetX;
                enemy.y = targetY;
            } else {
                enemy.x += (dx / distance) * speedToUse;
                enemy.y += (dy / distance) * speedToUse;
            }

            if (enemy.type === 'techniczny' && enemy.sabotageCooldown <= 0) {
                state.towers.forEach(tower => {
                    const distToTower = Math.sqrt(Math.pow(enemy.x - tower.x, 2) + Math.pow(enemy.y - tower.y, 2));
                    if (distToTower < C.TILE_SIZE * 0.8 && !tower.isSabotaged) { 
                        if (Math.random() < enemy.sabotageChance) {
                            tower.isSabotaged = true;
                            tower.sabotageTimer = enemy.sabotageDuration;
                            enemy.sabotageCooldown = enemy.baseSabotageCooldown; 
                            showMessage(state, `Techniczny Sabotażysta uszkodził wieżę ${tower.definition.name}!`, 120); 
                            console.log(`Tower ${tower.id} sabotaged by ${enemy.id}`);
                        }
                    }
                });
            }
            if(enemy.sabotageCooldown > 0) enemy.sabotageCooldown--;

        } else { 
            state.zadowolenieWidowni--;
            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0;
                endGame(false); 
            }
            if (!enemy.isDying) { 
                handleEnemyDefeated(enemy, false); 
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
        state.aplauz -= definition.cost;
        spot.occupied = true;

        const newTower = {
            id: Date.now() + Math.random().toString(36).substring(2, 7) + `_tower_${type}`,
            xGrid: spotXGrid, yGrid: spotYGrid,
            x: spotXGrid * C.TILE_SIZE + C.TILE_SIZE / 2, 
            y: spotYGrid * C.TILE_SIZE + C.TILE_SIZE / 2, 
            type: type, definition: definition, 
            damageLevel: 0, fireRateLevel: 0,
            rangeLevel: 0, effectStrengthLevel: 0, effectDurationLevel: 0, critChanceLevel: 0,

            currentDamage: definition.baseDamage, 
            currentFireRate: definition.baseFireRate,
            range: definition.range,
            fireCooldown: 0,
            projectileType: definition.projectileType,
            image: images[definition.imageKey],
            renderSize: definition.renderSize,
            currentScale: 0.1, currentAlpha: 0, currentRotation: -45, isAnimatingIn: true, 
            isSabotaged: false, sabotageTimer: 0,
            justUpgraded: false, // Dodano flagę
            upgradeFlashAlpha: 0, // Dla animacji GSAP
            upgradePulseScale: 1, // Dla animacji GSAP
            animatedRangeRadius: definition.range, // Dla animacji GSAP
            animatedRangeAlpha: 0.5, // Dla animacji GSAP
            selectionHighlightAlpha: 0.9, // Dla animacji GSAP
            selectionHighlightPadding: 2, // Dla animacji GSAP
        };
        if (type === 'budkaInspicjenta') {
            newTower.critChance = definition.critChance;
            newTower.critMultiplier = definition.critMultiplier;
            newTower.targetPriority = definition.targetPriority; 
        }
        if (type === 'garderobiana') {
            newTower.debuffStats = { ...definition.debuffStats }; 
        }

        state.towers.push(newTower);
        state.lastLevelStats.towersBuilt[type] = (state.lastLevelStats.towersBuilt[type] || 0) + 1;

        showMessage(state, `${definition.name} postawiona!`, 90);
        saveGameProgress(state);
        return true;
    } else {
        showMessage(state, "Za mało Aplauzu na tę wieżę!", 120);
        return false;
    }
}

export function upgradeTower(tower, upgradeKey) {
    if (!tower || !tower.definition.upgrades || !tower.definition.upgrades[upgradeKey]) {
        showMessage(state, "Błąd: Nieprawidłowy typ ulepszenia dla tej wieży.", 120);
        return false; // Zwróć false przy błędzie
    }

    const upgradesForType = tower.definition.upgrades[upgradeKey]; 
    const currentLevelKey = `${upgradeKey}Level`; 

    if (!tower.hasOwnProperty(currentLevelKey)) {
        console.warn(`Wieża typu ${tower.type} nie ma zdefiniowanego licznika poziomu '${currentLevelKey}'. Inicjalizuję na 0.`);
        tower[currentLevelKey] = 0;
    }
    
    const currentSpecificLevel = tower[currentLevelKey];
    const maxLevelForThisUpgrade = upgradesForType.length;

    if (currentSpecificLevel < maxLevelForThisUpgrade) {
        const upgradeData = upgradesForType[currentSpecificLevel]; 
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;

            if (upgradeKey === 'damage') {
                tower.currentDamage += upgradeData.value;
            } else if (upgradeKey === 'fireRate') {
                tower.currentFireRate = Math.max(10, tower.currentFireRate + upgradeData.value);
            } else if (upgradeKey === 'range' && tower.type === 'garderobiana') { 
                tower.range += upgradeData.value;
                tower.animatedRangeRadius = tower.range; // Zaktualizuj też animowany zasięg
            } else if (upgradeKey === 'effectStrength' && tower.type === 'garderobiana') {
                tower.debuffStats.slowFactor = Math.max(0.1, tower.debuffStats.slowFactor - upgradeData.slowFactorReduction);
                tower.debuffStats.damageTakenMultiplier += upgradeData.damageTakenIncrease;
            } else if (upgradeKey === 'effectDuration' && tower.type === 'garderobiana') {
                tower.debuffStats.duration += upgradeData.value;
            } else if (upgradeKey === 'critChance' && tower.type === 'budkaInspicjenta') {
                tower.critChance += upgradeData.value;
            }
            
            tower[currentLevelKey]++; 
            tower.justUpgraded = true; // Ustaw flagę dla animacji

            showMessage(state, `${tower.definition.name} ulepszona (${upgradeKey})!`, 90);
            saveGameProgress(state);
            return true; // Zwróć true przy sukcesie
        } else {
            showMessage(state, "Za mało Aplauzu na to ulepszenie!", 120);
            return false;
        }
    } else {
        showMessage(state, "Wieża osiągnęła maksymalny poziom tego ulepszenia.", 120);
        return false;
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
        if (tower.isSabotaged) { 
            tower.sabotageTimer--;
            if (tower.sabotageTimer <= 0) {
                tower.isSabotaged = false;
                showMessage(state, `Wieża ${tower.definition.name} naprawiona!`, 90); 
                console.log(`Tower ${tower.id} sabotage ended.`);
            }
            return; 
        }

        if (tower.fireCooldown > 0) {
            tower.fireCooldown--;
        } else {
            if (tower.type === 'garderobiana') { 
                applyPuderDebuff(tower);
                tower.fireCooldown = tower.currentFireRate; 
            } else { 
                const target = findTarget(tower);
                if (target) {
                    fireProjectile(tower, target);
                    tower.fireCooldown = tower.currentFireRate; 
                }
            }
        }
    });
}

function findTarget(tower) {
    let potentialTargets = state.enemies.filter(enemy => {
        if (enemy.hp <= 0 || enemy.isDying) return false; 
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        return (dx * dx + dy * dy) < (tower.range * tower.range); 
    });

    if (potentialTargets.length === 0) return null;

    if (tower.targetPriority === 'strongest') {
        potentialTargets.sort((a, b) => b.hp - a.hp); 
    } else { 
        potentialTargets.sort((a, b) => {
            const distA = Math.pow(a.x - tower.x, 2) + Math.pow(a.y - tower.y, 2);
            const distB = Math.pow(b.x - tower.x, 2) + Math.pow(b.y - tower.y, 2);
            return distA - distB;
        });
    }
    return potentialTargets[0]; 
}

function applyPuderDebuff(tower) {
    const affectedEnemiesThisTurn = [];
    state.enemies.forEach(enemy => {
        if (enemy.hp <= 0 || enemy.isDying) return;
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < tower.range * tower.range) {
            if(enemy.debuffSourceTowerId !== tower.id || enemy.slowTimer <= 0) {
                enemy.isSlowed = true;
                enemy.slowFactor = tower.debuffStats.slowFactor;
                enemy.currentSpeed = (enemy.type === 'diva' && enemy.furyActive ? (enemy.speed * C.baseEnemyStats.diva.furySpeedMultiplier) : enemy.speed) * enemy.slowFactor;
                enemy.damageTakenMultiplier = tower.debuffStats.damageTakenMultiplier;
                enemy.slowTimer = tower.debuffStats.duration; 
                enemy.debuffSourceTowerId = tower.id; 
                affectedEnemiesThisTurn.push(enemy);
            }
        }
    });

    if (affectedEnemiesThisTurn.length > 0) {
        const effectData = C.projectileTypes.puderDebuff; 
        const effectImage = images[effectData.imageKey];

        if (effectImage && !effectImage.error) {
            let cloudEffect = state.effects.find(e => e.isDebuffCloud && e.sourceTowerId === tower.id);
            if (!cloudEffect) { 
                cloudEffect = {
                    id: `debuff_cloud_${tower.id}`,
                    sourceTowerId: tower.id,
                    x: tower.x, y: tower.y,
                    image: effectImage,
                    width: tower.range * 2.2, 
                    height: tower.range * 2.2,
                    alpha: 0.1, 
                    scale: 1,
                    durationFrames: effectData.duration, 
                    isNew: true, 
                    isDebuffCloud: true, 
                    currentAlpha: 0.1, 
                    currentScale: 0.5, 
                };
                state.effects.push(cloudEffect);
                if (typeof gsap !== 'undefined') {
                    gsap.to(cloudEffect, {
                        currentScale: 1,
                        currentAlpha: 0.5, 
                        duration: 0.5,
                        yoyo: true, 
                        repeat: -1, 
                        ease: "sine.inOut"
                    });
                }
            }
            if (cloudEffect.removeTimeout) clearTimeout(cloudEffect.removeTimeout);
            cloudEffect.removeTimeout = setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(cloudEffect); 
                    gsap.to(cloudEffect, { 
                        currentAlpha: 0,
                        duration: 0.5,
                        onComplete: () => {
                            const index = state.effects.indexOf(cloudEffect);
                            if (index > -1) state.effects.splice(index, 1);
                        }
                    });
                } else { 
                    const index = state.effects.indexOf(cloudEffect);
                    if (index > -1) state.effects.splice(index, 1);
                }
            }, (tower.debuffStats.duration / 60 * 1000) + 500); 
        }
    }
}


function fireProjectile(tower, target) {
    const projectileData = C.projectileTypes[tower.projectileType];
    if (!projectileData) {
        console.error("Brak danych dla typu pocisku:", tower.projectileType); return;
    }
    const projectileImage = images[projectileData.imageKey];
    
    let actualDamage = tower.currentDamage;
    let isCrit = false;
    if (tower.type === 'budkaInspicjenta' && Math.random() < tower.critChance) {
        actualDamage *= tower.critMultiplier;
        isCrit = true;
        console.log("Krytyk z Budki Inspicjenta trafił krytycznie!");
    }

    const fireYOffset = tower.definition.renderSize * 0.4; 
    const fireY = (tower.y + C.TILE_SIZE / 2 - tower.definition.renderSize) + fireYOffset;

    const newProjectile = {
        x: tower.x, y: fireY, 
        target: target, 
        type: tower.projectileType,
        speed: projectileData.speed,
        damage: actualDamage, 
        isCrit: isCrit,
        image: projectileImage,
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

        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < p.speed) { 
            let finalDamage = p.damage * (p.target.damageTakenMultiplier || 1); 

            if (p.target.type === 'diva') {
                finalDamage *= (1 - (p.target.currentDamageReduction || 0));
            }
            p.target.hp -= finalDamage;

            state.projectiles.splice(i, 1); 

            const hitEffect = {
                x: p.target.x, y: p.target.y, scale: 0, alpha: 1,
                durationFrames: p.isCrit ? 30 : 20, 
                maxScale: p.isCrit ? C.TILE_SIZE * 0.4 : C.TILE_SIZE * 0.25,
                color: p.isCrit ? 'rgba(255,100,0,0.95)' : (p.type === 'laser' ? 'rgba(255,255,100,0.9)' : (p.type === 'recenzja' ? 'rgba(200,200,200,0.8)' : 'rgba(220,220,220,0.8)')),
                isNew: true 
            };
            state.effects.push(hitEffect);

            if (p.target.hp <= 0 && !p.target.isDying) {
                handleEnemyDefeated(p.target);
            }
        } else { 
            p.x += (dx / distance) * p.speed;
            p.y += (dy / distance) * p.speed;
            p.angle = Math.atan2(dy, dx); 
        }
    }
}

export function handleEnemyDefeated(enemy, withReward = true) {
    if (enemy.isDying) return; 
    
    if (withReward) {
        state.aplauz += (enemy.reward * enemy.level); 
    }
    enemy.isDying = true; 
}

export function completeLevel() {
    state.lastLevelStats.completed = true;
    state.lastLevelStats.levelName = C.levelData[state.currentLevelIndex]?.name || `Akt ${state.currentLevelIndex + 1}`;
    state.lastLevelStats.finalSatisfaction = state.zadowolenieWidowni;
    state.lastLevelStats.initialMaxSatisfaction = state.initialMaxAudienceSatisfaction;

    state.lastLevelStats.towersBuilt.bileter = state.towers.filter(t => t.type === 'bileter').length;
    state.lastLevelStats.towersBuilt.oswietleniowiec = state.towers.filter(t => t.type === 'oswietleniowiec').length;
    state.lastLevelStats.towersBuilt.garderobiana = state.towers.filter(t => t.type === 'garderobiana').length;
    state.lastLevelStats.towersBuilt.budkaInspicjenta = state.towers.filter(t => t.type === 'budkaInspicjenta').length;

    let totalSellValue = 0;
    state.towers.forEach(tower => {
        totalSellValue += calculateTowerSellValue(tower);
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

    state.lastLevelStats.starStates.forEach(star => {
        star.scale = 0.3; star.opacity = 0; star.isFilled = false;
        star.fillProgress = 0; star.character = '☆'; star.color = '#777777';
    });
    state.lastLevelStats.isStarAnimationComplete = false;

    state.lastLevelStats.aplauzBonusForNextLevel = state.aplauz + totalSellValue;
    state.currentAplauzBonusForNextLevel = state.lastLevelStats.aplauzBonusForNextLevel; 

    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL; 
    if (state.currentLevelIndex < C.levelData.length - 1) { 
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2); 
    }
    saveGameProgress(state);

    state.gameOver = true; 
    state.gameScreen = 'levelCompleteCanvas'; 
    state.showingLevelCompleteSummary = true;
    console.log(`[gameLogic.js completeLevel] Level ${state.currentLevelIndex + 1} completed. Stars: ${state.lastLevelStats.stars}`);
    
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(state.lastLevelStats.starStates); 

        const tl = gsap.timeline({
            onComplete: () => {
                state.lastLevelStats.isStarAnimationComplete = true;
                for(let i = 0; i < 3; i++) {
                    if (i < state.lastLevelStats.stars) {
                        state.lastLevelStats.starStates[i].isFilled = true;
                        state.lastLevelStats.starStates[i].character = '★';
                        state.lastLevelStats.starStates[i].color = '#ffd700';
                        state.lastLevelStats.starStates[i].opacity = 1;
                        state.lastLevelStats.starStates[i].scale = 1;
                    } else {
                         state.lastLevelStats.starStates[i].isFilled = false;
                         state.lastLevelStats.starStates[i].character = '☆';
                         state.lastLevelStats.starStates[i].color = '#777777';
                         state.lastLevelStats.starStates[i].opacity = 1;
                         state.lastLevelStats.starStates[i].scale = 1;
                    }
                }
                console.log("GSAP Star animation timeline complete");
            }
        });

        const starAppearDelay = 0.6;      
        const interStarAppearDelay = 0.2; 
        const starAppearDuration = 0.3;   
        
        const starFillDelayAfterAppear = 0.4; 
        const interStarFillDelay = 0.5;       
        const starFillDuration = 0.3;         

        for (let i = 0; i < 3; i++) {
            tl.to(state.lastLevelStats.starStates[i], {
                scale: 1,
                opacity: 1,
                character: '☆', 
                color: '#a0a0a0', 
                duration: starAppearDuration,
                delay: (i === 0) ? starAppearDelay : interStarAppearDelay,
                ease: "back.out(1.4)",
            }, (i === 0) ? ">" : `<${interStarAppearDelay*0.8}`); 
        }
        
        tl.addLabel("fillStars", `>${starFillDelayAfterAppear}`); 

        for (let i = 0; i < state.lastLevelStats.stars; i++) {
            tl.to(state.lastLevelStats.starStates[i], {
                scale: 1.3, 
                duration: starFillDuration / 2,
                ease: "power2.out",
                onStart: () => { 
                    state.lastLevelStats.starStates[i].character = '★';
                    state.lastLevelStats.starStates[i].color = '#ffd700'; 
                }
            }, `fillStars+=${i * interStarFillDelay}`) 
            .to(state.lastLevelStats.starStates[i], {
                scale: 1, 
                duration: starFillDuration / 2,
                ease: "power1.in",
                onComplete: () => {
                    state.lastLevelStats.starStates[i].isFilled = true; 
                }
            }, ">"); 
        }
    } else { 
        for (let i = 0; i < 3; i++) {
            state.lastLevelStats.starStates[i].scale = 1;
            state.lastLevelStats.starStates[i].opacity = 1;
            if (i < state.lastLevelStats.stars) {
                state.lastLevelStats.starStates[i].isFilled = true;
                state.lastLevelStats.starStates[i].character = '★';
                state.lastLevelStats.starStates[i].color = '#ffd700';
            } else {
                 state.lastLevelStats.starStates[i].isFilled = false;
                 state.lastLevelStats.starStates[i].character = '☆';
                 state.lastLevelStats.starStates[i].color = '#777777';
            }
        }
        state.lastLevelStats.isStarAnimationComplete = true;
    }
}


export function prepareNextWave() {
    if (state.waveInProgress || state.gameOver || state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
        return; 
    }
    
    state.showingWaveIntro = true; 
    state.waveIntroTimer = 180; 
    state.waveIntroEnemies = []; 

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const wavePattern = C.waveDefinitionsBase[waveIndexForDefinition];
    
    for (const enemyType in wavePattern) {
        if (enemyType === 'interval' || enemyType === 'boss') continue; 
        if (wavePattern[enemyType].count > 0) {
            const enemyConfig = C.baseEnemyStats[enemyType];
            if (enemyConfig) {
                 state.waveIntroEnemies.push({type: enemyType, level: wavePattern[enemyType].level, image: images[enemyConfig.imageKey]});
            }
        }
    }
    if (wavePattern.boss) {
        const bossConfig = C.baseEnemyStats[wavePattern.boss.type];
        if (bossConfig) {
            state.waveIntroEnemies.push({type: wavePattern.boss.type, level: wavePattern.boss.level, image: images[bossConfig.imageKey], isBoss: true});
        }
    }
}

export function startNextWaveActual() {
    state.showingWaveIntro = false; 
    state.waveInProgress = true;    
    showMessage(state, `Fala ${state.currentWaveNumber + 1} rozpoczęta!`, 60);

    const previousProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(previousProgress, state.currentWaveNumber);
    saveGameProgress(state);

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const waveData = JSON.parse(JSON.stringify(C.waveDefinitionsBase[waveIndexForDefinition])); 
    
    const difficultyScale = 1 + (state.currentWaveNumber) * 0.045 + state.currentLevelIndex * 0.015;
    state.currentWaveSpawns = []; 

    for (const enemyType in waveData) {
        if (enemyType === 'interval' || enemyType === 'boss') continue;
        if (waveData[enemyType] && waveData[enemyType].count > 0) {
            for(let i=0; i < Math.ceil(waveData[enemyType].count * difficultyScale); i++) { 
                state.currentWaveSpawns.push({type: enemyType, level: waveData[enemyType].level});
            }
        }
    }

    if (waveData.boss && (state.currentWaveNumber + 1) === C.WAVES_PER_LEVEL) { 
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
                    x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
                    y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
                    hp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier, 
                    maxHp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    speed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15), 
                    currentSpeed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15),
                    pathIndex: 0,
                    image: bossImg, width: bossBaseStats.width * 1.3, height: bossBaseStats.height * 1.3, 
                    reward: C.baseEnemyStats[enemyToSpawnData.type].aplauzReward * 2, 
                    isDying: false, isDeathAnimationStarted: false,
                    isSlowed: false, slowTimer: 0, slowFactor: 1, damageTakenMultiplier: 1, debuffSourceTowerId: null,
                };
                 if (enemyToSpawnData.type === 'diva') {
                    newBoss.baseDamageReduction = bossBaseStats.damageReduction;
                    newBoss.currentDamageReduction = bossBaseStats.damageReduction;
                    newBoss.furyThreshold = bossBaseStats.furyThreshold;
                    newBoss.furySpeedMultiplier = bossBaseStats.furySpeedMultiplier;
                    newBoss.furyDamageReduction = bossBaseStats.furyDamageReduction;
                    newBoss.furyDuration = bossBaseStats.furyDuration; 
                    newBoss.furyActive = false;
                    newBoss.furyTimer = 0;
                }
                state.enemies.push(newBoss);
            } else { 
                spawnEnemy(enemyToSpawnData.type, enemyToSpawnData.level);
            }
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
    if (state.isPaused) {
        showMessage(state, "Pauza", 360000); 
    } else {
        showMessage(state, "Wznowiono", 60); 
    }
}

export function sellTower(towerToSell) {
    if (!towerToSell) return;

    const sellValue = calculateTowerSellValue(towerToSell);
    state.aplauz += sellValue;

    const index = state.towers.findIndex(t => t.id === towerToSell.id);
    if (index > -1) state.towers.splice(index, 1);

    const spot = state.currentTowerSpots.find(s => s.x === towerToSell.xGrid && s.y === towerToSell.yGrid);
    if (spot) spot.occupied = false;

    showMessage(state, `Sprzedano wieżę za ${sellValue} Aplauzu.`, 120);
    state.selectedTowerForUpgrade = null; 
    saveGameProgress(state);
}
