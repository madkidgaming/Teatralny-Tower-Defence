// js/gameLogic.js
import * as C from './config.js';
import { gameState as state, images } from './state.js';
import { showMessage } from './utils.js';
import { saveGameProgress } from './storage.js';

// Funkcja pomocnicza do obliczania wartości sprzedaży wieży (używana w completeLevel i sellTower)
function calculateTowerSellValue(towerInstance) {
    if (!towerInstance) return 0;

    const towerDef = C.towerDefinitions[towerInstance.type];
    if (!towerDef) return 0;

    let sellValue = Math.floor(towerDef.cost * 0.75); // 75% kosztu bazowego

    // Dodaj 50% kosztu ulepszeń
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
    // Resetujemy 'occupied' dla towerSpots przy ładowaniu poziomu z configu,
    // bo config.js ma je pre-mapowane z occupied: false, ale chcemy świeżą kopię za każdym razem.
    state.currentTowerSpots = C.levelData[state.currentLevelIndex].towerSpots.map(spot => ({...spot, occupied: false}));


    state.aplauz = (250 + state.currentLevelIndex * 75) + state.currentAplauzBonusForNextLevel;
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
    state.effects.length = 0; // state.effects jest inicjalizowane jako [] w state.js
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
                if (rand < 0.75) { // 75% szans na trawę podstawową
                    tileData = C.tileTypes.GRASS_BASIC;
                } else {
                    // Pozostałe 25% na dekoracyjną trawę
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
    // Jeśli zaczynamy od fali 0 I (nie ma progresu LUB progres to -1 (nowy poziom) LUB poziom został ukończony)
    // to ustawiamy progres na -1, co oznacza, że gramy poziom od nowa bez kontynuacji.
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
        speed: baseStats.speed * (1 - (level - 1) * 0.05), // Lekkie zmniejszenie prędkości z poziomem (0.05 na poziom)
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
        newEnemy.sabotageCooldown = 0; // Cooldown przed następnym możliwym sabotażem
    }

    state.enemies.push(newEnemy);
}

export function updateEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];

        if (enemy.isDying) continue;

        // Aktualizacja statusów (np. spowolnienie)
        if (enemy.slowTimer > 0) {
            enemy.slowTimer--;
            if (enemy.slowTimer <= 0) {
                enemy.isSlowed = false;
                enemy.currentSpeed = (enemy.type === 'diva' && enemy.furyActive) ? (enemy.speed * enemy.furySpeedMultiplier) : enemy.speed;
                enemy.damageTakenMultiplier = 1;
                enemy.debuffSourceTowerId = null;
            }
        }
        
        // Logika specyficzna dla Divy (furia)
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
                // Można dodać efekt wizualny furii tutaj
            }
        }

        // Sprawdzenie, czy wróg został pokonany
        if (enemy.hp <= 0 && !enemy.isDying) {
            handleEnemyDefeated(enemy);
            continue; // Przejdź do następnego wroga
        }

        // Ruch wroga
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

            // Logika sabotażu dla Technicznego
            if (enemy.type === 'techniczny' && enemy.sabotageCooldown <= 0) {
                state.towers.forEach(tower => {
                    if (!tower.isSabotaged) {
                        const distToTower = Math.sqrt(Math.pow(enemy.x - tower.x, 2) + Math.pow(enemy.y - tower.y, 2));
                        if (distToTower < C.TILE_SIZE * 0.8) { // Zasięg sabotażu
                            if (Math.random() < enemy.sabotageChance) {
                                tower.isSabotaged = true;
                                tower.sabotageTimer = enemy.sabotageDuration;
                                enemy.sabotageCooldown = 300; // 5 sekund cooldownu dla tego wroga (przy 60 FPS)
                                console.log(`Tower ${tower.id} sabotaged by ${enemy.id}`);
                                // Można dodać efekt wizualny sabotażu
                            }
                        }
                    }
                });
            }
            if(enemy.sabotageCooldown > 0) enemy.sabotageCooldown--;

        } else { // Wróg dotarł do końca ścieżki
            state.zadowolenieWidowni--;
            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0;
                endGame(false); // Przegrana
            }
            // Wróg "pokonany" bez nagrody, bo dotarł do końca
            if (!enemy.isDying) { // Upewnij się, że nie jest już w trakcie animacji śmierci
                handleEnemyDefeated(enemy, false); // false oznacza brak nagrody
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
            x: spotXGrid * C.TILE_SIZE + C.TILE_SIZE / 2, // Środek kafelka
            y: spotYGrid * C.TILE_SIZE + C.TILE_SIZE / 2, // Środek kafelka
            type: type, definition: definition, // Przechowujemy referencję do definicji dla łatwego dostępu
            damageLevel: 0, fireRateLevel: 0,
            // Inicjalizacja poziomów specjalnych ulepszeń
            rangeLevel: 0, effectStrengthLevel: 0, effectDurationLevel: 0, critChanceLevel: 0,

            currentDamage: definition.baseDamage, // Może być undefined dla wież bez obrażeń (np. Garderobiana)
            currentFireRate: definition.baseFireRate,
            range: definition.range,
            fireCooldown: 0,
            projectileType: definition.projectileType,
            image: images[definition.imageKey],
            renderSize: definition.renderSize,
            currentScale: 0.1, currentAlpha: 0, currentRotation: -45, isAnimatingIn: true, // Dla animacji pojawiania się
            isSabotaged: false, sabotageTimer: 0,
        };
        // Inicjalizacja specyficznych właściwości wieży
        if (type === 'budkaInspicjenta') {
            newTower.critChance = definition.critChance;
            newTower.critMultiplier = definition.critMultiplier;
            newTower.targetPriority = definition.targetPriority; // np. 'closest', 'strongest'
        }
        if (type === 'garderobiana') {
            newTower.debuffStats = { ...definition.debuffStats }; // Kopia, aby ulepszenia nie wpływały na definicję
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

// KONIEC CZĘŚCI 1/2 PLIKU js/gameLogic.js (Komentarz pozostawiony dla kontekstu, jeśli był ważny)

export function upgradeTower(tower, upgradeKey) {
    if (!tower || !tower.definition.upgrades || !tower.definition.upgrades[upgradeKey]) {
        showMessage(state, "Błąd: Nieprawidłowy typ ulepszenia dla tej wieży.", 120);
        return;
    }

    const upgradesForType = tower.definition.upgrades[upgradeKey]; // Tablica definicji ulepszeń dla danego klucza
    const currentLevelKey = `${upgradeKey}Level`; // np. damageLevel, rangeLevel, effectStrengthLevel

    // Sprawdzenie, czy wieża ma odpowiedni licznik poziomu ulepszenia.
    // buildTower powinien inicjalizować wszystkie potrzebne XXXLevel na 0.
    if (!tower.hasOwnProperty(currentLevelKey)) {
        console.warn(`Wieża typu ${tower.type} nie ma zdefiniowanego licznika poziomu '${currentLevelKey}'. Inicjalizuję na 0.`);
        tower[currentLevelKey] = 0;
    }
    
    const currentSpecificLevel = tower[currentLevelKey];
    const maxLevelForThisUpgrade = upgradesForType.length;

    if (currentSpecificLevel < maxLevelForThisUpgrade) {
        const upgradeData = upgradesForType[currentSpecificLevel]; // Pobierz dane dla następnego poziomu
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;

            // Zastosuj ulepszenie
            if (upgradeKey === 'damage') {
                tower.currentDamage += upgradeData.value;
            } else if (upgradeKey === 'fireRate') {
                // Zakładamy, że upgradeData.value jest UJEMNE dla ulepszenia fireRate,
                // ponieważ fireRate to cooldown. Mniejszy cooldown = szybszy strzał.
                // np. currentFireRate = 100, upgradeData.value = -10 => nowy fireRate = 90
                tower.currentFireRate = Math.max(10, tower.currentFireRate + upgradeData.value);
            } else if (upgradeKey === 'range' && tower.type === 'garderobiana') { // Przykład specyficznego ulepszenia
                tower.range += upgradeData.value;
            } else if (upgradeKey === 'effectStrength' && tower.type === 'garderobiana') {
                tower.debuffStats.slowFactor = Math.max(0.1, tower.debuffStats.slowFactor - upgradeData.slowFactorReduction);
                tower.debuffStats.damageTakenMultiplier += upgradeData.damageTakenIncrease;
            } else if (upgradeKey === 'effectDuration' && tower.type === 'garderobiana') {
                tower.debuffStats.duration += upgradeData.value;
            } else if (upgradeKey === 'critChance' && tower.type === 'budkaInspicjenta') {
                tower.critChance += upgradeData.value;
            }
            // Inne specjalne ulepszenia można dodać tutaj

            tower[currentLevelKey]++; // Zwiększ poziom tego konkretnego ulepszenia

            showMessage(state, `${tower.definition.name} ulepszona (${upgradeKey})!`, 90);
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
            state.zadowolenieWidowni += upgradeData.bonus; // Dodaj również do aktualnego zadowolenia
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
        // Obsługa sabotażu
        if (tower.isSabotaged && tower.sabotageTimer > 0) {
            tower.sabotageTimer--;
            if (tower.sabotageTimer <= 0) {
                tower.isSabotaged = false;
                console.log(`Tower ${tower.id} sabotage ended.`);
            }
            return; // Sabotowana wieża nie działa
        }

        if (tower.fireCooldown > 0) {
            tower.fireCooldown--;
        } else {
            if (tower.type === 'garderobiana') { // Garderobiana ma specjalną logikę "strzału" (efekt obszarowy)
                applyPuderDebuff(tower);
                tower.fireCooldown = tower.currentFireRate; // Reset cooldownu
            } else { // Pozostałe wieże strzelają pociskami
                const target = findTarget(tower);
                if (target) {
                    fireProjectile(tower, target);
                    tower.fireCooldown = tower.currentFireRate; // Reset cooldownu
                }
            }
        }
    });
}

function findTarget(tower) {
    let potentialTargets = state.enemies.filter(enemy => {
        if (enemy.hp <= 0 || enemy.isDying) return false; // Nie celuj w pokonanych/umierających
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        return (dx * dx + dy * dy) < (tower.range * tower.range); // Sprawdzenie zasięgu (szybsze niż Math.sqrt)
    });

    if (potentialTargets.length === 0) return null;

    // Sortowanie celów według priorytetu (jeśli zdefiniowany)
    if (tower.targetPriority === 'strongest') {
        potentialTargets.sort((a, b) => b.hp - a.hp); // Najwięcej HP
    } else { // Domyślnie: najbliższy (lub można dodać 'first' - najdłużej na ścieżce)
        potentialTargets.sort((a, b) => {
            // Obliczanie dystansu do celu (można pominąć sqrt, jeśli tylko porównujemy)
            const distA = Math.pow(a.x - tower.x, 2) + Math.pow(a.y - tower.y, 2);
            const distB = Math.pow(b.x - tower.x, 2) + Math.pow(b.y - tower.y, 2);
            return distA - distB;
        });
    }
    return potentialTargets[0]; // Zwróć najlepszy cel
}

function applyPuderDebuff(tower) {
    const affectedEnemiesThisTurn = [];
    state.enemies.forEach(enemy => {
        if (enemy.hp <= 0 || enemy.isDying) return;
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < tower.range * tower.range) {
            // Zastosuj debuff, jeśli wróg nie jest już zdebuffowany przez tę samą wieżę LUB jego poprzedni debuff wygasł
            if(enemy.debuffSourceTowerId !== tower.id || enemy.slowTimer <= 0) {
                enemy.isSlowed = true;
                enemy.slowFactor = tower.debuffStats.slowFactor;
                // Aktualizuj prędkość, uwzględniając furię Divy
                enemy.currentSpeed = (enemy.type === 'diva' && enemy.furyActive ? (enemy.speed * C.baseEnemyStats.diva.furySpeedMultiplier) : enemy.speed) * enemy.slowFactor;
                enemy.damageTakenMultiplier = tower.debuffStats.damageTakenMultiplier;
                enemy.slowTimer = tower.debuffStats.duration; // Czas trwania debuffu w klatkach
                enemy.debuffSourceTowerId = tower.id; // Zapisz ID wieży, która nałożyła debuff
                affectedEnemiesThisTurn.push(enemy);
            }
        }
    });

    // Jeśli jacyś wrogowie zostali dotknięci, pokaż efekt wizualny (chmura pudru)
    if (affectedEnemiesThisTurn.length > 0) {
        const effectData = C.projectileTypes.puderDebuff; // Definicja efektu z config.js
        const effectImage = images[effectData.imageKey];

        if (effectImage && !effectImage.error) {
            // Sprawdź, czy efekt chmury dla tej wieży już istnieje
            let cloudEffect = state.effects.find(e => e.isDebuffCloud && e.sourceTowerId === tower.id);
            if (!cloudEffect) { // Jeśli nie, stwórz nowy
                cloudEffect = {
                    id: `debuff_cloud_${tower.id}`,
                    sourceTowerId: tower.id,
                    x: tower.x, y: tower.y,
                    image: effectImage,
                    width: tower.range * 2.2, // Chmura nieco większa niż zasięg wieży
                    height: tower.range * 2.2,
                    alpha: 0.1, // Początkowa alfa (może być animowana)
                    scale: 1,
                    durationFrames: effectData.duration, // Jak długo efekt ma być widoczny
                    isNew: true, // Flaga dla systemu animacji (jeśli jest)
                    isDebuffCloud: true, // Identyfikator tego typu efektu
                    currentAlpha: 0.1, // Dla animacji GSAP
                    currentScale: 0.5, // Dla animacji GSAP
                };
                state.effects.push(cloudEffect);
                // Animacja pulsowania chmury za pomocą GSAP (jeśli dostępne)
                if (typeof gsap !== 'undefined') {
                    gsap.to(cloudEffect, {
                        currentScale: 1,
                        currentAlpha: 0.5, // Docelowa alfa pulsowania
                        duration: 0.5,
                        yoyo: true, // Powrót do stanu początkowego
                        repeat: -1, // Nieskończone powtarzanie
                        ease: "sine.inOut"
                    });
                }
            }
            // Odśwież timer usuwania chmury (jeśli gracz ponownie aktywuje efekt)
            if (cloudEffect.removeTimeout) clearTimeout(cloudEffect.removeTimeout);
            cloudEffect.removeTimeout = setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(cloudEffect); // Zatrzymaj animację pulsowania
                    gsap.to(cloudEffect, { // Animacja zanikania
                        currentAlpha: 0,
                        duration: 0.5,
                        onComplete: () => {
                            const index = state.effects.indexOf(cloudEffect);
                            if (index > -1) state.effects.splice(index, 1);
                        }
                    });
                } else { // Fallback, jeśli GSAP nie jest dostępny
                    const index = state.effects.indexOf(cloudEffect);
                    if (index > -1) state.effects.splice(index, 1);
                }
            }, (tower.debuffStats.duration / 60 * 1000) + 500); // Usuń chmurę chwilę po wygaśnięciu debuffu
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
    // Logika trafienia krytycznego dla Budki Inspicjenta
    if (tower.type === 'budkaInspicjenta' && Math.random() < tower.critChance) {
        actualDamage *= tower.critMultiplier;
        isCrit = true;
        console.log("Krytyk z Budki Inspicjenta trafił krytycznie!");
    }

    // Ustalenie punktu startowego pocisku (np. lufa wieży)
    // To jest uproszczenie, można dostosować dla każdej wieży indywidualnie
    const fireYOffset = tower.definition.renderSize * 0.4; // Przesunięcie od środka wieży w górę
    const fireY = (tower.y + C.TILE_SIZE / 2 - tower.definition.renderSize) + fireYOffset;

    const newProjectile = {
        x: tower.x, y: fireY, // Pozycja startowa
        target: target, // Obiekt celu
        type: tower.projectileType,
        speed: projectileData.speed,
        damage: actualDamage, // Obrażenia (mogą być zmodyfikowane przez krytyk)
        isCrit: isCrit,
        image: projectileImage,
        width: projectileData.width, height: projectileData.height,
        angle: Math.atan2(target.y - fireY, target.x - tower.x) // Kąt do celu (dla obracania obrazka)
    };
    state.projectiles.push(newProjectile);
}

export function updateProjectiles() {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];

        // Sprawdzenie, czy cel jest nadal ważny
        if (!p.target || p.target.hp <= 0 || p.target.isDying) {
            state.projectiles.splice(i, 1); // Usuń pocisk, jeśli cel zniknął/pokonany
            continue;
        }

        // Ruch pocisku
        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < p.speed) { // Pocisk dotarł do celu
            let finalDamage = p.damage * (p.target.damageTakenMultiplier || 1); // Uwzględnij mnożnik obrażeń od debuffu

            // Uwzględnij redukcję obrażeń Divy
            if (p.target.type === 'diva') {
                finalDamage *= (1 - (p.target.currentDamageReduction || 0));
            }
            p.target.hp -= finalDamage;

            state.projectiles.splice(i, 1); // Usuń pocisk

            // Stwórz efekt trafienia
            const hitEffect = {
                x: p.target.x, y: p.target.y, scale: 0, alpha: 1,
                durationFrames: p.isCrit ? 30 : 20, // Dłuższy efekt dla krytyka
                maxScale: p.isCrit ? C.TILE_SIZE * 0.4 : C.TILE_SIZE * 0.25,
                color: p.isCrit ? 'rgba(255,100,0,0.95)' : (p.type === 'laser' ? 'rgba(255,255,100,0.9)' : (p.type === 'recenzja' ? 'rgba(200,200,200,0.8)' : 'rgba(220,220,220,0.8)')),
                isNew: true // Flaga dla systemu animacji
            };
            state.effects.push(hitEffect);

            // Sprawdź, czy cel został pokonany po trafieniu
            if (p.target.hp <= 0 && !p.target.isDying) {
                handleEnemyDefeated(p.target);
            }
        } else { // Kontynuuj ruch w kierunku celu
            p.x += (dx / distance) * p.speed;
            p.y += (dy / distance) * p.speed;
            p.angle = Math.atan2(dy, dx); // Aktualizuj kąt (jeśli cel się porusza)
        }
    }
}

export function handleEnemyDefeated(enemy, withReward = true) {
    if (enemy.isDying) return; // Już jest w trakcie animacji śmierci
    
    if (withReward) {
        state.aplauz += (enemy.reward * enemy.level); // Nagroda skalowana poziomem wroga
    }
    enemy.isDying = true; // Rozpocznij proces umierania (animacja zostanie obsłużona w pętli gry)
    // Tutaj można dodać logikę np. odtworzenia dźwięku pokonania wroga
}

export function completeLevel() {
    state.lastLevelStats.completed = true;
    state.lastLevelStats.levelName = C.levelData[state.currentLevelIndex]?.name || `Akt ${state.currentLevelIndex + 1}`;
    state.lastLevelStats.finalSatisfaction = state.zadowolenieWidowni;
    state.lastLevelStats.initialMaxSatisfaction = state.initialMaxAudienceSatisfaction;

    // Zlicz zbudowane wieże na potrzeby statystyk
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

    // Obliczanie gwiazdek
    if (state.zadowolenieWidowni === state.initialMaxAudienceSatisfaction) {
        state.lastLevelStats.stars = 3;
    } else if (state.zadowolenieWidowni >= 0.6 * state.initialMaxAudienceSatisfaction) {
        state.lastLevelStats.stars = 2;
    } else if (state.zadowolenieWidowni > 0) {
        state.lastLevelStats.stars = 1;
    } else {
        state.lastLevelStats.stars = 0; // Powinno być niemożliwe, jeśli przegrana jest obsługiwana wcześniej
    }

    // Reset stanu gwiazdek dla animacji
    state.lastLevelStats.starStates.forEach(star => {
        star.scale = 0.3; star.opacity = 0; star.isFilled = false;
        star.fillProgress = 0; star.character = '☆'; star.color = '#777777';
    });
    state.lastLevelStats.isStarAnimationComplete = false;

    state.lastLevelStats.aplauzBonusForNextLevel = state.aplauz + totalSellValue;
    state.currentAplauzBonusForNextLevel = state.lastLevelStats.aplauzBonusForNextLevel; // Przekaż bonus do następnego poziomu

    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL; // Oznacz poziom jako ukończony
    if (state.currentLevelIndex < C.levelData.length - 1) { // Odblokuj następny poziom
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2); // +1 za obecny, +1 za następny (indeks + 2)
    }
    saveGameProgress(state);

    state.gameOver = true; // Oznacz grę jako zakończoną (ale wygraną)
    state.gameScreen = 'levelCompleteCanvas'; // Przełącz na ekran podsumowania
    state.showingLevelCompleteSummary = true;
    console.log(`[gameLogic.js completeLevel] Level ${state.currentLevelIndex + 1} completed. Stars: ${state.lastLevelStats.stars}`);
    
    // Animacja gwiazdek (GSAP lub fallback)
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(state.lastLevelStats.starStates); // Anuluj poprzednie animacje gwiazdek

        const tl = gsap.timeline({
            onComplete: () => {
                state.lastLevelStats.isStarAnimationComplete = true;
                // Ustaw finalny stan gwiazdek po animacji (upewnienie się)
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

        const starAppearDelay = 0.6;      // Opóźnienie przed pojawieniem się pierwszej gwiazdki
        const interStarAppearDelay = 0.2; // Opóźnienie między pojawianiem się kolejnych gwiazdek
        const starAppearDuration = 0.3;   // Czas trwania animacji pojawiania się gwiazdki
        
        const starFillDelayAfterAppear = 0.4; // Opóźnienie przed rozpoczęciem wypełniania gwiazdek
        const interStarFillDelay = 0.5;       // Opóźnienie między wypełnianiem kolejnych gwiazdek
        const starFillDuration = 0.3;         // Czas trwania animacji wypełniania gwiazdki

        // Animacja pojawiania się wszystkich 3 konturów gwiazdek
        for (let i = 0; i < 3; i++) {
            tl.to(state.lastLevelStats.starStates[i], {
                scale: 1,
                opacity: 1,
                character: '☆', // Upewnij się, że zaczynają jako puste
                color: '#a0a0a0', // Kolor pustej gwiazdki
                duration: starAppearDuration,
                delay: (i === 0) ? starAppearDelay : interStarAppearDelay,
                ease: "back.out(1.4)",
            }, (i === 0) ? ">" : `<${interStarAppearDelay*0.8}`); // Użyj relatywnych pozycji dla płynności
        }
        
        tl.addLabel("fillStars", `>${starFillDelayAfterAppear}`); // Etykieta dla momentu rozpoczęcia wypełniania

        // Animacja wypełniania zdobytych gwiazdek
        for (let i = 0; i < state.lastLevelStats.stars; i++) {
            tl.to(state.lastLevelStats.starStates[i], {
                scale: 1.3, // Lekkie powiększenie przed wypełnieniem
                duration: starFillDuration / 2,
                ease: "power2.out",
                onStart: () => { // W momencie rozpoczęcia animacji wypełniania
                    state.lastLevelStats.starStates[i].character = '★';
                    state.lastLevelStats.starStates[i].color = '#ffd700'; // Zmień na złotą, wypełnioną gwiazdkę
                }
            }, `fillStars+=${i * interStarFillDelay}`) // Rozpocznij z opóźnieniem dla każdej gwiazdki
            .to(state.lastLevelStats.starStates[i], {
                scale: 1, // Powrót do normalnego rozmiaru
                duration: starFillDuration / 2,
                ease: "power1.in",
                onComplete: () => {
                    state.lastLevelStats.starStates[i].isFilled = true; // Oznacz jako wypełnioną
                }
            }, ">"); // Kontynuuj bezpośrednio po poprzedniej części animacji tej gwiazdki
        }
    } else { // Fallback, jeśli GSAP nie jest dostępny
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
        return; // Nie przygotowuj fali, jeśli gra się toczy, jest zakończona lub wszystkie fale przeszły
    }
    
    state.showingWaveIntro = true; // Pokaż ekran intro fali
    state.waveIntroTimer = 180; // 3 sekundy (przy 60 FPS)
    state.waveIntroEnemies = []; // Zresetuj listę wrogów do pokazania w intro

    // Użyj indeksu fali, ale nie przekraczaj liczby zdefiniowanych wzorców fal
    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const wavePattern = C.waveDefinitionsBase[waveIndexForDefinition];
    
    // Zbierz informacje o typach wrogów w nadchodzącej fali
    for (const enemyType in wavePattern) {
        if (enemyType === 'interval' || enemyType === 'boss') continue; // Pomiń pola niebędące typami wrogów
        if (wavePattern[enemyType].count > 0) {
            const enemyConfig = C.baseEnemyStats[enemyType];
            if (enemyConfig) {
                 state.waveIntroEnemies.push({type: enemyType, level: wavePattern[enemyType].level, image: images[enemyConfig.imageKey]});
            }
        }
    }
    // Dodaj informacje o bossie, jeśli jest zdefiniowany dla tej fali
    if (wavePattern.boss) {
        const bossConfig = C.baseEnemyStats[wavePattern.boss.type];
        if (bossConfig) {
            state.waveIntroEnemies.push({type: wavePattern.boss.type, level: wavePattern.boss.level, image: images[bossConfig.imageKey], isBoss: true});
        }
    }
}

export function startNextWaveActual() {
    state.showingWaveIntro = false; // Ukryj ekran intro
    state.waveInProgress = true;    // Oznacz falę jako trwającą
    showMessage(state, `Fala ${state.currentWaveNumber + 1} rozpoczęta!`, 60);

    // Zapisz postęp (która fala została osiągnięta)
    const previousProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(previousProgress, state.currentWaveNumber);
    saveGameProgress(state);

    const waveIndexForDefinition = Math.min(state.currentWaveNumber, C.waveDefinitionsBase.length - 1);
    const waveData = JSON.parse(JSON.stringify(C.waveDefinitionsBase[waveIndexForDefinition])); // Głęboka kopia danych fali
    // Skalowanie trudności fali w oparciu o numer fali i poziom
    const difficultyScale = 1 + (state.currentWaveNumber) * 0.025 + state.currentLevelIndex * 0.015;
    state.currentWaveSpawns = []; // Tablica wrogów do zespawnowania w tej fali

    // Generuj listę wrogów do zespawnowania
    for (const enemyType in waveData) {
        if (enemyType === 'interval' || enemyType === 'boss') continue;
        if (waveData[enemyType] && waveData[enemyType].count > 0) {
            for(let i=0; i < Math.ceil(waveData[enemyType].count * difficultyScale); i++) { // Skaluj liczbę wrogów
                state.currentWaveSpawns.push({type: enemyType, level: waveData[enemyType].level});
            }
        }
    }

    // Dodaj bossa, jeśli jest zdefiniowany i to odpowiednia fala (np. co 5 fal)
    if (waveData.boss && (state.currentWaveNumber + 1) % 5 === 0) { // Boss co 5 fal
         state.currentWaveSpawns.push({
            type: waveData.boss.type, level: waveData.boss.level, isBoss: true,
            hpMultiplier: waveData.boss.hpMultiplier || (1 + (waveData.boss.level-1)*0.4), // Mnożnik HP dla bossa
        });
    }

    state.currentWaveSpawns.sort(() => Math.random() - 0.5); // Losowa kolejność spawnowania
    state.currentWaveSpawnsLeft = state.currentWaveSpawns.length; // Liczba wrogów do zespawnowania
    // Skaluj interwał spawnowania wrogów
    state.spawnInterval = Math.max(35, waveData.interval * (1 - state.currentLevelIndex * 0.02) * (1 - (state.currentWaveNumber)*0.01) );
    state.spawnTimer = state.spawnInterval > 60 ? 60 : state.spawnInterval; // Początkowy timer spawnu (może być krótszy dla pierwszej jednostki)
}

export function handleWaveSpawning() {
    if (state.waveInProgress && state.currentWaveSpawnsLeft > 0) {
        state.spawnTimer--;
        if (state.spawnTimer <= 0) {
            const enemyToSpawnData = state.currentWaveSpawns.shift(); // Pobierz następnego wroga z kolejki
            state.currentWaveSpawnsLeft--;

            if (enemyToSpawnData.isBoss) { // Specjalna logika spawnowania bossa
                const bossBaseStats = C.baseEnemyStats[enemyToSpawnData.type];
                const bossImg = images[bossBaseStats.imageKey];
                const newBoss = { // Stwórz obiekt bossa z odpowiednio zmodyfikowanymi statystykami
                    id: Date.now() + Math.random().toString(36).substring(2, 7) + '_boss',
                    type: enemyToSpawnData.type, level: enemyToSpawnData.level,
                    x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
                    y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
                    hp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier, // Zwiększone HP
                    maxHp: bossBaseStats.baseHp * enemyToSpawnData.level * enemyToSpawnData.hpMultiplier,
                    speed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15), // Bossy mogą być wolniejsze
                    currentSpeed: bossBaseStats.speed * (1 - (enemyToSpawnData.level - 1) * 0.15),
                    pathIndex: 0,
                    image: bossImg, width: bossBaseStats.width * 1.3, height: bossBaseStats.height * 1.3, // Większy rozmiar
                    reward: C.baseEnemyStats[enemyToSpawnData.type].aplauzReward * 2, // Większa nagroda
                    isDying: false, isDeathAnimationStarted: false,
                    isSlowed: false, slowTimer: 0, slowFactor: 1, damageTakenMultiplier: 1, debuffSourceTowerId: null,
                };
                 // Dodaj specjalne właściwości bossa (np. furia Divy)
                 if (enemyToSpawnData.type === 'diva') {
                    newBoss.baseDamageReduction = bossBaseStats.damageReduction;
                    newBoss.currentDamageReduction = bossBaseStats.damageReduction;
                    newBoss.furyThreshold = bossBaseStats.furyThreshold;
                    newBoss.furySpeedMultiplier = bossBaseStats.furySpeedMultiplier;
                    newBoss.furyDamageReduction = bossBaseStats.furyDamageReduction;
                    newBoss.furyDuration = bossBaseStats.furyDuration; // Boss może mieć dłuższą furię
                    newBoss.furyActive = false;
                    newBoss.furyTimer = 0;
                }
                state.enemies.push(newBoss);
            } else { // Spawnowanie standardowego wroga
                spawnEnemy(enemyToSpawnData.type, enemyToSpawnData.level);
            }
            state.spawnTimer = state.spawnInterval; // Reset timera spawnu
        }
    }
}

export function endGame(isWin) {
    // Zapobiegaj wielokrotnemu wywołaniu endGame, zwłaszcza przy przegranej
    if (state.gameOver && !isWin) {
        return;
    }

    if (isWin) {
        if (!state.gameOver) { // Upewnij się, że completeLevel jest wywoływane tylko raz
            completeLevel();
        }
        // Nie rób nic więcej, completeLevel przełącza ekran
        return;
    }

    // Logika dla przegranej
    state.gameOver = true;
    state.waveInProgress = false; // Zatrzymaj falę
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 30000); // Długi czas wyświetlania
    saveGameProgress(state); // Zapisz stan gry (np. osiągniętą falę przed przegraną)
    state.gameScreen = 'levelLost'; // Przełącz na ekran przegranej
}


export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        showMessage(state, "Pauza", 360000); // Komunikat pauzy wyświetlany "nieskończenie" (długi czas)
    } else {
        showMessage(state, "Wznowiono", 60); // Krótki komunikat wznowienia
    }
}

export function sellTower(towerToSell) {
    if (!towerToSell) return;

    const sellValue = calculateTowerSellValue(towerToSell);
    state.aplauz += sellValue;

    // Usuń wieżę z listy
    const index = state.towers.findIndex(t => t.id === towerToSell.id);
    if (index > -1) state.towers.splice(index, 1);

    // Oznacz miejsce jako wolne
    const spot = state.currentTowerSpots.find(s => s.x === towerToSell.xGrid && s.y === towerToSell.yGrid);
    if (spot) spot.occupied = false;

    showMessage(state, `Sprzedano wieżę za ${sellValue} Aplauzu.`, 120);
    state.selectedTowerForUpgrade = null; // Odznacz wieżę po sprzedaży
    saveGameProgress(state);
}