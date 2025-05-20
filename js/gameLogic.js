import * as C from './config.js';
import { gameState as state, images } from './state.js';
import { showMessage } from './utils.js';
import { saveGameProgress } from './storage.js'; // Import z nowego pliku

let currentActHeaderRef;
export function setCurrentActHeaderRef(element) {
    currentActHeaderRef = element;
}

export function setupLevel(levelIdx, startFromWave = 0) {
    state.currentLevelIndex = levelIdx;
    const level = C.levelData[state.currentLevelIndex];
    state.currentPath = JSON.parse(JSON.stringify(level.path));
    state.currentTowerSpots = level.towerSpots.map(spot => ({...spot, occupied: false}));

    state.aplauz = 250 + state.currentLevelIndex * 75; // Reset aplauzu na start poziomu
    // zadowolenieWidowni i maxZadowolenieWidowni jest teraz bardziej skomplikowane jeśli ulepszenia są globalne
    // Na razie zakładamy, że ulepszenie Zadowolenia jest tymczasowe dla danej sesji gry (resetowane)
    // Aby było globalne, musiałoby być zapisywane i ładowane z localStorage i inaczej inicjowane.
    // Na razie uproszczenie:
    state.maxZadowolenieWidowni = 100; // Bazowe
    state.zadowolenieWidowni = state.maxZadowolenieWidowni;
    state.zadowolenieUpgradeLevel = 0; // Reset ulepszeń zadowolenia per poziom dla uproszczenia

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

    if (currentActHeaderRef) {
        currentActHeaderRef.textContent = state.currentLevelIndex + 1;
    }
    showMessage(state, `Akt ${state.currentLevelIndex + 1}: ${level.name}!`, 120);
    
    // Zapis postępu (że rozpoczęliśmy tę falę na tym poziomie)
    state.levelProgress[state.currentLevelIndex] = Math.max(state.levelProgress[state.currentLevelIndex] || 0, state.currentWaveNumber);
    saveGameProgress(state);
}

export function spawnEnemy(type, level = 1) {
    // ... (bez zmian)
    const baseStats = C.baseEnemyStats[type];
    const img = images[baseStats.imageKey];
    
    state.enemies.push({
        type: type,
        level: level, 
        x: state.currentPath[0].x * C.TILE_SIZE + C.TILE_SIZE / 2,
        y: state.currentPath[0].y * C.TILE_SIZE + C.TILE_SIZE / 2,
        hp: baseStats.baseHp * level, 
        maxHp: baseStats.baseHp * level,
        speed: baseStats.speed * (1 - (level - 1) * 0.05), 
        pathIndex: 0,
        image: img,
        width: baseStats.width,
        height: baseStats.height,
        reward: baseStats.aplauzReward 
    });
}

export function updateEnemies() {
    // ... (bez zmian, ale endGame jest wywoływane)
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
                enemy.pathIndex++;
                enemy.x = targetX;
                enemy.y = targetY;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else {
            state.zadowolenieWidowni--;
            state.enemies.splice(i, 1);
            if (state.zadowolenieWidowni <= 0) {
                state.zadowolenieWidowni = 0; 
                endGame(false); // Przegrana
            }
        }
    }
}

export function buildTower(spotXGrid, spotYGrid, type) {
    // ... (bez zmian)
    const definition = C.towerDefinitions[type];
    if (state.aplauz >= definition.cost) {
        state.aplauz -= definition.cost;
        const spot = state.currentTowerSpots.find(s => s.x === spotXGrid && s.y === spotYGrid);
        if(spot) spot.occupied = true;

        state.towers.push({
            id: Date.now() + Math.random(), 
            xGrid: spotXGrid, 
            yGrid: spotYGrid,
            x: spotXGrid * C.TILE_SIZE + C.TILE_SIZE / 2,
            y: spotYGrid * C.TILE_SIZE + C.TILE_SIZE / 2, 
            type: type,
            definition: definition, 
            damageLevel: 0, 
            fireRateLevel: 0, 
            currentDamage: definition.baseDamage,
            currentFireRate: definition.baseFireRate,
            range: definition.range,
            fireCooldown: 0,
            projectileType: definition.projectileType,
            image: images[definition.imageKey],
            renderSize: definition.renderSize
        });
        state.selectedTowerForUpgrade = null; 
        return true;
    } else {
        showMessage(state, "Za mało Aplauzu!");
        return false;
    }
}
export function upgradeTower(tower, upgradeType) {
    // ... (bez zmian)
    if (!tower) return;
    const definition = tower.definition.upgrades[upgradeType];
    const currentLevel = upgradeType === 'damage' ? tower.damageLevel : tower.fireRateLevel;

    if (currentLevel < C.MAX_UPGRADE_LEVEL) {
        const upgradeData = definition[currentLevel]; 
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;
            if (upgradeType === 'damage') {
                tower.currentDamage += upgradeData.value;
                tower.damageLevel++;
            } else if (upgradeType === 'fireRate') {
                tower.currentFireRate = Math.max(10, tower.currentFireRate - upgradeData.value); 
                tower.fireRateLevel++;
            }
            showMessage(state, `${tower.definition.imageKey === 'bileterTowerIcon' ? 'Bileter' : 'Reflektor'} ulepszony!`);
        } else {
            showMessage(state, "Za mało Aplauzu na to ulepszenie!");
        }
    } else {
        showMessage(state, "Wieża osiągnęła maksymalny poziom tego ulepszenia.");
    }
}
export function upgradeZadowolenie() {
    // ... (bez zmian - zakładając, że ulepszenia zadowolenia są per poziom)
    if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL) {
        const upgradeData = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel];
        if (state.aplauz >= upgradeData.cost) {
            state.aplauz -= upgradeData.cost;
            state.maxZadowolenieWidowni += upgradeData.bonus;
            state.zadowolenieWidowni += upgradeData.bonus; 
            state.zadowolenieUpgradeLevel++;
            showMessage(state, `Zadowolenie Widowni ulepszone do ${state.maxZadowolenieWidowni}!`);
        } else {
            showMessage(state, "Za mało Aplauzu na ulepszenie Zadowolenia!");
        }
    } else {
        showMessage(state, "Zadowolenie Widowni na maksymalnym poziomie!");
    }
}
export function updateTowers() { /* ... (bez zmian) ... */ }
function findTarget(tower) { /* ... (bez zmian) ... */ }
function fireProjectile(tower, target) { /* ... (bez zmian) ... */ }
export function updateProjectiles() { /* ... (bez zmian) ... */ }


function handleEnemyDefeated(enemy) {
    state.aplauz += (enemy.reward * enemy.level);
    const index = state.enemies.indexOf(enemy);
    if (index > -1) {
        state.enemies.splice(index, 1);
    }
    if (state.waveInProgress && state.enemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        state.waveInProgress = false;
        
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber; // Zapisz, że ta fala jest ukończona
        saveGameProgress(state);

        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            completeLevel();
        } else {
            showMessage(state, `Fala ${state.currentWaveNumber} pokonana!`, 120);
        }
    }
}

function completeLevel() {
    // Ta funkcja jest teraz wywoływana, gdy ostatnia fala poziomu jest ukończona
    showMessage(state, `Akt ${state.currentLevelIndex + 1} ukończony! Brawo!`, 240);
    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL; // Oznacz jako w pełni ukończony
    if (state.currentLevelIndex < C.levelData.length - 1) {
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2);
    }
    saveGameProgress(state);
    state.gameOver = true; // Oznaczamy koniec gry dla tego poziomu
    state.gameScreen = 'levelComplete'; // Specjalny stan, aby main.js mógł zareagować
}

export function prepareNextWave() {
    // ... (bez zmian)
    if (state.waveInProgress || state.gameOver || state.currentWaveNumber >= C.WAVES_PER_LEVEL) return;
    
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
    // ... (logika ta sama, ale aktualizujemy postęp)
    state.showingWaveIntro = false;
    state.currentWaveNumber++; // Zwiększamy numer fali
    state.waveInProgress = true;
    showMessage(state, `Fala ${state.currentWaveNumber} rozpoczęta!`, 60);

    // Aktualizuj postęp, że rozpoczęliśmy tę falę
    state.levelProgress[state.currentLevelIndex] = Math.max(state.levelProgress[state.currentLevelIndex] || 0, state.currentWaveNumber -1); // -1 bo currentWaveNumber jest już inkrementowany
    if(state.currentWaveNumber === 1 && (!state.levelProgress[state.currentLevelIndex] || state.levelProgress[state.currentLevelIndex] === 0) ){
        state.levelProgress[state.currentLevelIndex] = 0; // Zaczynamy od fali 0 (przed pierwszą)
    }
    saveGameProgress(state);
    
    // Reszta logiki spawnowania fal bez zmian
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
            type: waveData.boss.type, 
            level: waveData.boss.level,
            isBoss: true, 
            hpMultiplier: waveData.boss.hpMultiplier || (1 + (waveData.boss.level-1)*0.4), 
        });
    }

    state.currentWaveSpawns.sort(() => Math.random() - 0.5);
    state.currentWaveSpawnsLeft = state.currentWaveSpawns.length;
    state.spawnInterval = Math.max(35, waveData.interval * (1 - state.currentLevelIndex * 0.02) * (1 - (state.currentWaveNumber-1)*0.01) ); 
    state.spawnTimer = 0;
}

export function handleWaveSpawning() { /* ... (bez zmian) ... */ }

export function endGame(isWin) { // Wywoływane tylko przy przegranej w trakcie aktu
    if (isWin) { // Wygrana aktu jest obsługiwana przez completeLevel
        console.warn("endGame(true) wywołane, powinno być obsługiwane przez completeLevel");
        return;
    }
    state.gameOver = true;
    state.waveInProgress = false;
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 300);
    // Zapisujemy aktualny stan (w tym ile fal udało się przejść)
    saveGameProgress(state);
    state.gameScreen = 'levelLost'; // Specjalny stan dla main.js
}

export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        // stan gameScreen jest ustawiany w main.js
        showMessage(state, "Pauza", 36000); // Długi czas
    } else {
        // stan gameScreen jest ustawiany w main.js
        showMessage(state, "Wznowiono", 60);
    }
}

// Dodatkowe funkcje do gameLogic jeśli są potrzebne, np. reset poziomu bez przechodzenia do menu.