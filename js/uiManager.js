// js/uiManager.js
import * as C from './config.js';
import { gameState as state } from './state.js';

// Cache DOM elements used by UI functions
let uiCurrentAct, uiCurrentWave, uiAplauz, uiAudienceSatisfaction,
    uiButtonBileter, uiButtonOswietleniowiec, uiButtonUpgradeSatisfaction,
    uiButtonStartWave, uiMessages, towerUpgradePanel, upgradePanelTowerName,
    uiButtonUpgradeDamage, uiButtonUpgradeFireRate, uiButtonSellTower;

function cacheDOMElements() {
    uiCurrentAct = document.getElementById('uiCurrentAct');
    uiCurrentWave = document.getElementById('uiCurrentWave');
    uiAplauz = document.getElementById('uiAplauz');
    uiAudienceSatisfaction = document.getElementById('uiAudienceSatisfaction');
    uiButtonBileter = document.getElementById('uiButtonBileter');
    uiButtonOswietleniowiec = document.getElementById('uiButtonOswietleniowiec');
    uiButtonUpgradeSatisfaction = document.getElementById('uiButtonUpgradeSatisfaction');
    uiButtonStartWave = document.getElementById('uiButtonStartWave');
    uiMessages = document.getElementById('uiMessages');
    towerUpgradePanel = document.getElementById('towerUpgradePanel');
    upgradePanelTowerName = document.getElementById('upgradePanelTowerName');
    uiButtonUpgradeDamage = document.getElementById('uiButtonUpgradeDamage');
    uiButtonUpgradeFireRate = document.getElementById('uiButtonUpgradeFireRate');
    uiButtonSellTower = document.getElementById('uiButtonSellTower');
}
// Wywołaj cachowanie, gdy DOM będzie gotowy. Dla modułów to zwykle działa poprawnie.
// Alternatywnie: document.addEventListener('DOMContentLoaded', cacheDOMElements);
cacheDOMElements();


export function updateUiStats() {
    // Upewnij się, że elementy DOM są dostępne
    if (!uiCurrentAct) cacheDOMElements();
    if (!uiCurrentAct) { // Jeśli nadal nie ma, coś jest nie tak z timingiem/DOM
        console.error("UIManager: DOM elements not cached for updateUiStats.");
        return;
    }


    if (!C.levelData[state.currentLevelIndex] &&
        state.gameScreen !== 'menu' &&
        state.gameScreen !== 'levelSelection' &&
        state.gameScreen !== 'credits' &&
        state.gameScreen !== 'levelCompleteScreen' && // HTMLowa wersja
        state.gameScreen !== 'levelCompleteCanvas' // Canvasowa wersja
    ) {
        return;
    }

     if (state.gameScreen === 'playing' || state.gameScreen === 'paused' || state.gameScreen === 'levelLost' || state.gameScreen === 'levelCompleteCanvas') {
        uiCurrentAct.textContent = state.currentLevelIndex + 1;
        let waveDisplay;
        if (state.currentWaveNumber > C.WAVES_PER_LEVEL) {
            waveDisplay = C.WAVES_PER_LEVEL;
        } else if (state.currentWaveNumber > 0) {
            waveDisplay = state.currentWaveNumber;
        } else {
            const progress = state.levelProgress[state.currentLevelIndex];
            if (progress === undefined || progress === -1) {
                waveDisplay = '-';
            } else {
                // Jeśli progress to 0, oznacza, że fala 0 (pierwsza) się nie zaczęła lub jest tuż przed startem.
                // Dla gracza lepiej wyświetlić "0" lub "1" jeśli progress to *ostatnia ukończona fala*.
                // Tutaj przyjmujemy, że progress=-1 to "niezaczęty", progress=0 to "na fali 0" (wyświetlane jako fala 1 dla gracza)
                waveDisplay = progress + 1 > 0 ? progress + 1 : '-';
                 if (state.currentWaveNumber === 0 && (progress === undefined || progress === -1)) waveDisplay = '-';
                 else if (state.currentWaveNumber === 0 && progress >=0) waveDisplay = progress +1; // np. jeśli zapisano postęp na fali 0.

                 // Uproszczenie: jeśli currentWaveNumber to 0, a nie ma progressu -
                 // Jeśli currentWaveNumber to 0, a jest progress to ostatnia fala
                  if (state.currentWaveNumber === 0) {
                     waveDisplay = (state.levelProgress[state.currentLevelIndex] >= 0) ? state.levelProgress[state.currentLevelIndex] +1 : '-';
                     if (waveDisplay === '-' && state.levelProgress[state.currentLevelIndex] === -1 && state.currentWaveNumber === 0) waveDisplay = '0'; // Pokaż 0/10 jeśli poziom jest nowy, ale jeszcze nie fala 1
                     if(state.currentWaveNumber > 0) waveDisplay = state.currentWaveNumber; // to nadpisze poprzednie
                  } else {
                    waveDisplay = state.currentWaveNumber;
                  }
                  if(waveDisplay === '0' && state.currentWaveNumber === 0 && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1)) waveDisplay = '-';


            }
        }
        // Ostateczne formatowanie waveDisplay, aby uniknąć "0/X" jeśli wolimy "-"
        let finalWaveDisplay = state.currentWaveNumber > C.WAVES_PER_LEVEL ? C.WAVES_PER_LEVEL : state.currentWaveNumber;
        if (state.currentWaveNumber === 0 && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1) ) {
            finalWaveDisplay = "-";
        } else if (state.currentWaveNumber === 0 && state.levelProgress[state.currentLevelIndex] >= 0) {
            finalWaveDisplay = state.levelProgress[state.currentLevelIndex]; //np. 0
        }


        uiCurrentWave.textContent = `${finalWaveDisplay === '-' ? '-' : finalWaveDisplay === 0 ? '0' : finalWaveDisplay }/${C.WAVES_PER_LEVEL}`;
        uiAplauz.textContent = state.aplauz;
        uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;
    }


    if (C.towerDefinitions.bileter && uiButtonBileter) {
        uiButtonBileter.querySelector('.cost').textContent = C.towerDefinitions.bileter.cost;
    }
    if (C.towerDefinitions.oswietleniowiec && uiButtonOswietleniowiec) {
        uiButtonOswietleniowiec.querySelector('.cost').textContent = C.towerDefinitions.oswietleniowiec.cost;
    }

    if (uiButtonUpgradeSatisfaction) {
        if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL && C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel]) {
            uiButtonUpgradeSatisfaction.querySelector('.cost').textContent = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel].cost;
            uiButtonUpgradeSatisfaction.classList.remove('disabled');
        } else {
            uiButtonUpgradeSatisfaction.querySelector('.cost').textContent = "MAX";
            uiButtonUpgradeSatisfaction.classList.add('disabled');
        }
    }

    if (uiButtonStartWave) {
        const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro || 
                                  state.currentWaveNumber >= C.WAVES_PER_LEVEL || 
                                  state.gameScreen === 'levelCompleteCanvas' || state.gameScreen === 'levelCompleteScreen';
        if (isStartWaveDisabled) uiButtonStartWave.classList.add('disabled');
        else uiButtonStartWave.classList.remove('disabled');
    }
}

export function showUiMessage(message) {
    if (!uiMessages) cacheDOMElements();
    if (!uiMessages) return;

    if(message && message.trim() !== "") {
        uiMessages.textContent = message;
        uiMessages.style.opacity = '1';
    } else {
        if (uiMessages.textContent !== "") {
            uiMessages.style.opacity = '0';
            setTimeout(() => {
                if (uiMessages.style.opacity === '0') uiMessages.textContent = '';
            }, 300); // Czas zgodny z transition w CSS
        }
    }
}

export function updateTowerUpgradePanel() {
    if (!towerUpgradePanel) cacheDOMElements();
    if (!towerUpgradePanel) return;

    if (state.selectedTowerForUpgrade && C.towerDefinitions[state.selectedTowerForUpgrade.type]) {
        towerUpgradePanel.classList.remove('hidden');
        const tower = state.selectedTowerForUpgrade;
        const towerDef = C.towerDefinitions[tower.type];
        
        if (upgradePanelTowerName) upgradePanelTowerName.textContent = tower.type === 'bileter' ? 'Bileter' : 'Oświetleniowiec';

        if (uiButtonUpgradeDamage) {
            if (tower.damageLevel < C.MAX_UPGRADE_LEVEL && towerDef.upgrades.damage[tower.damageLevel]) {
                uiButtonUpgradeDamage.querySelector('.cost').textContent = towerDef.upgrades.damage[tower.damageLevel].cost;
                uiButtonUpgradeDamage.classList.remove('disabled');
            } else {
                uiButtonUpgradeDamage.querySelector('.cost').textContent = "MAX";
                uiButtonUpgradeDamage.classList.add('disabled');
            }
        }
        if (uiButtonUpgradeFireRate) {
            if (tower.fireRateLevel < C.MAX_UPGRADE_LEVEL && towerDef.upgrades.fireRate[tower.fireRateLevel]) {
                uiButtonUpgradeFireRate.querySelector('.cost').textContent = towerDef.upgrades.fireRate[tower.fireRateLevel].cost;
                uiButtonUpgradeFireRate.classList.remove('disabled');
            } else {
                uiButtonUpgradeFireRate.querySelector('.cost').textContent = "MAX";
                uiButtonUpgradeFireRate.classList.add('disabled');
            }
        }
        if (uiButtonSellTower) {
            let sellValue = Math.floor(towerDef.cost * 0.75);
            for(let i=0; i < tower.damageLevel; i++) sellValue += Math.floor(towerDef.upgrades.damage[i].cost * 0.5);
            for(let i=0; i < tower.fireRateLevel; i++) sellValue += Math.floor(towerDef.upgrades.fireRate[i].cost * 0.5);
            uiButtonSellTower.querySelector('.value').textContent = sellValue;
        }
    } else {
        towerUpgradePanel.classList.add('hidden');
    }
}

export function updateSelectedTowerButtonUI() {
    if (!uiButtonBileter || !uiButtonOswietleniowiec) cacheDOMElements();
    if (!uiButtonBileter || !uiButtonOswietleniowiec) return;

    uiButtonBileter.classList.remove('selected-for-build');
    uiButtonOswietleniowiec.classList.remove('selected-for-build');

    if (state.selectedTowerType === 'bileter') {
        uiButtonBileter.classList.add('selected-for-build');
    } else if (state.selectedTowerType === 'oswietleniowiec') {
        uiButtonOswietleniowiec.classList.add('selected-for-build');
    }
}