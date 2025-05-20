// js/gameLogic.js
import * as C from './config.js';
import { gameState as state, images } from './state.js';
import { showMessage } from './utils.js';
import { saveGameProgress } from './storage.js';

let currentActHeaderRef; // To nie jest już używane, można usunąć
// export function setCurrentActHeaderRef(element) {
//     currentActHeaderRef = element;
// }

export function setupLevel(levelIdx, startFromWave = 0) {
    state.currentLevelIndex = levelIdx;
    const level = C.levelData[state.currentLevelIndex];
    if (!level) {
        console.error("Nie znaleziono danych dla poziomu:", levelIdx);
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
    state.currentMessage = ""; // Wyczyść poprzednie komunikaty
    state.messageTimer = 0;

    // if (currentActHeaderRef) { // Już nie używane
    //     currentActHeaderRef.textContent = state.currentLevelIndex + 1;
    // }
    showMessage(state, `Akt ${state.currentLevelIndex + 1}: ${level.name || ''}!`, 120);
    
    const initialProgress = state.levelProgress[state.currentLevelIndex] === undefined ? -1 : state.levelProgress[state.currentLevelIndex];
    state.levelProgress[state.currentLevelIndex] = Math.max(initialProgress, startFromWave > 0 ? startFromWave -1 : -1); // Jeśli startujemy od fali > 0, to znaczy, że poprzednia jest zrobiona. -1 dla nierozpoczętego.
    saveGameProgress(state);
}

export function spawnEnemy(type, level = 1) { /* ... bez zmian ... */ }
export function updateEnemies() { /* ... bez zmian ... */ }
export function buildTower(spotXGrid, spotYGrid, type) { /* ... bez zmian ... */ }
export function upgradeTower(tower, upgradeType) { /* ... bez zmian ... */ }
export function upgradeZadowolenie() { /* ... bez zmian ... */ }
export function updateTowers() { /* ... bez zmian ... */ }
// function findTarget(tower) { /* ... bez zmian ... */ } // nie jest exportowana, więc może zostać
// function fireProjectile(tower, target) { /* ... bez zmian ... */ } // nie jest exportowana
export function updateProjectiles() { /* ... bez zmian ... */ }

function handleEnemyDefeated(enemy) {
    state.aplauz += (enemy.reward * enemy.level);
    const index = state.enemies.indexOf(enemy);
    if (index > -1) {
        state.enemies.splice(index, 1);
    }
    if (state.waveInProgress && state.enemies.length === 0 && state.currentWaveSpawnsLeft === 0) {
        state.waveInProgress = false;
        state.levelProgress[state.currentLevelIndex] = state.currentWaveNumber;
        saveGameProgress(state);

        if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
            completeLevel();
        } else {
            showMessage(state, `Fala ${state.currentWaveNumber} pokonana!`, 120);
        }
    }
}

function completeLevel() {
    showMessage(state, `Akt ${state.currentLevelIndex + 1} ukończony! Brawo!`, 240);
    state.levelProgress[state.currentLevelIndex] = C.WAVES_PER_LEVEL;
    if (state.currentLevelIndex < C.levelData.length - 1) {
        state.unlockedLevels = Math.max(state.unlockedLevels, state.currentLevelIndex + 2);
    }
    saveGameProgress(state);
    state.gameOver = true; // Oznacza ukończenie/przegraną obecnego poziomu
    state.gameScreen = 'levelComplete';
}

export function prepareNextWave() { /* ... bez zmian ... */ }
export function startNextWaveActual() {
    state.showingWaveIntro = false;
    state.currentWaveNumber++;
    state.waveInProgress = true;
    showMessage(state, `Fala ${state.currentWaveNumber} rozpoczęta!`, 60);
    
    // Zapisz, że rozpoczęliśmy tę falę. Jeśli gracz wyjdzie, będzie mógł kontynuować od tej fali.
    state.levelProgress[state.currentLevelIndex] = Math.max(state.levelProgress[state.currentLevelIndex] || 0, state.currentWaveNumber -1);
    saveGameProgress(state);
    
    // ... reszta logiki spawnowania fal bez zmian ...
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
export function handleWaveSpawning() { /* ... bez zmian ... */ }

export function endGame(isWin) { // Tylko dla przegranej
    if (isWin) return; // Wygrana obsługiwana przez completeLevel
    state.gameOver = true;
    state.waveInProgress = false;
    showMessage(state, "KONIEC GRY! Premiera tego aktu zrujnowana...", 300);
    saveGameProgress(state);
    state.gameScreen = 'levelLost';
}

export function togglePauseGame() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        showMessage(state, "Pauza", 36000);
    } else {
        showMessage(state, "Wznowiono", 60);
    }
}

export function sellTower(towerToSell) {
    if (!towerToSell) return;
    const towerDef = C.towerDefinitions[towerToSell.type];
    let sellValue = Math.floor(towerDef.cost * 0.75);
    for(let i=0; i < towerToSell.damageLevel; i++) sellValue += Math.floor(towerDef.upgrades.damage[i].cost * 0.5);
    for(let i=0; i < towerToSell.fireRateLevel; i++) sellValue += Math.floor(towerDef.upgrades.fireRate[i].cost * 0.5);
    state.aplauz += sellValue;
    const index = state.towers.findIndex(t => t.id === towerToSell.id);
    if (index > -1) {
        state.towers.splice(index, 1);
    }
    const spot = state.currentTowerSpots.find(s => s.x === towerToSell.xGrid && s.y === towerToSell.yGrid);
    if (spot) {
        spot.occupied = false;
    }
    showMessage(state, `Sprzedano wieżę za ${sellValue} Aplauzu.`, 120);
}