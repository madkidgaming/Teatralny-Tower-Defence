// js/uiManager.js
import * as C from './config.js';
import { gameState as state } from './state.js';

let uiCurrentAct, uiCurrentWave, uiAplauz, uiAudienceSatisfaction,
    uiButtonBileter, uiButtonOswietleniowiec, uiButtonGarderobiana, uiButtonBudkaInspicjenta,
    uiButtonUpgradeSatisfaction, uiButtonStartWave, uiMessages, 
    towerUpgradePanel, upgradePanelTowerName, uiButtonUpgradeDamage, uiButtonUpgradeFireRate, 
    uiButtonUpgradeSpecial1, uiButtonUpgradeSpecial2, uiButtonUpgradeSpecial3, // Dodany przycisk dla 3. specjalnego ulepszenia
    uiButtonSellTower;

function cacheDOMElements() {
    uiCurrentAct = document.getElementById('uiCurrentAct');
    uiCurrentWave = document.getElementById('uiCurrentWave');
    uiAplauz = document.getElementById('uiAplauz');
    uiAudienceSatisfaction = document.getElementById('uiAudienceSatisfaction');
    
    uiButtonBileter = document.getElementById('uiButtonBileter');
    uiButtonOswietleniowiec = document.getElementById('uiButtonOswietleniowiec');
    uiButtonGarderobiana = document.getElementById('uiButtonGarderobiana');
    uiButtonBudkaInspicjenta = document.getElementById('uiButtonBudkaInspicjenta');

    uiButtonUpgradeSatisfaction = document.getElementById('uiButtonUpgradeSatisfaction');
    uiButtonStartWave = document.getElementById('uiButtonStartWave');
    uiMessages = document.getElementById('uiMessages');
    
    towerUpgradePanel = document.getElementById('towerUpgradePanel');
    upgradePanelTowerName = document.getElementById('upgradePanelTowerName');
    uiButtonUpgradeDamage = document.getElementById('uiButtonUpgradeDamage');
    uiButtonUpgradeFireRate = document.getElementById('uiButtonUpgradeFireRate');
    uiButtonUpgradeSpecial1 = document.getElementById('uiButtonUpgradeSpecial1'); // Możesz chcieć go dodać do HTML
    uiButtonUpgradeSpecial2 = document.getElementById('uiButtonUpgradeSpecial2'); // Możesz chcieć go dodać do HTML
    // uiButtonUpgradeSpecial3 = document.getElementById('uiButtonUpgradeSpecial3'); // Jeśli dodasz trzeci przycisk
    uiButtonSellTower = document.getElementById('uiButtonSellTower');
}
cacheDOMElements();


export function updateUiStats() {
    if (!uiCurrentAct) cacheDOMElements();
    if (!uiCurrentAct) { 
        console.error("UIManager: DOM elements not cached for updateUiStats.");
        return;
    }

    if (!C.levelData[state.currentLevelIndex] &&
        !['menu', 'levelSelection', 'credits', 'levelCompleteScreen', 'levelCompleteCanvas'].includes(state.gameScreen)
    ) {
        return;
    }

     if (['playing', 'paused', 'levelLost', 'levelCompleteCanvas'].includes(state.gameScreen)) {
        uiCurrentAct.textContent = state.currentLevelIndex + 1;
        
        let displayWaveNumber = state.currentWaveNumber;
        if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
            if (state.waveInProgress || state.showingWaveIntro) {
                displayWaveNumber = state.currentWaveNumber + 1;
            } else if (state.currentWaveNumber === 0 && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1)) {
                displayWaveNumber = "-";
            } else if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
                 displayWaveNumber = C.WAVES_PER_LEVEL;
            } else { // Między falami
                displayWaveNumber = state.currentWaveNumber +1; 
            }
        } else { // levelLost or levelCompleteCanvas
            if (state.gameScreen === 'levelCompleteCanvas') {
                displayWaveNumber = C.WAVES_PER_LEVEL;
            } else { // levelLost
                displayWaveNumber = (state.currentWaveNumber > 0 && state.currentWaveNumber <= C.WAVES_PER_LEVEL) ? state.currentWaveNumber : (state.levelProgress[state.currentLevelIndex] === -1 ? "-" : (state.levelProgress[state.currentLevelIndex] || 0) + 1) ;
                if(displayWaveNumber > C.WAVES_PER_LEVEL) displayWaveNumber = C.WAVES_PER_LEVEL;
            }
        }
        if (state.currentWaveNumber === 0 && !state.waveInProgress && !state.showingWaveIntro && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1)){
            displayWaveNumber = "-"; // Przed pierwszą falą
        }


        uiCurrentWave.textContent = `${displayWaveNumber}/${C.WAVES_PER_LEVEL}`;
        uiAplauz.textContent = state.aplauz;
        uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;
    }

    ['bileter', 'oswietleniowiec', 'garderobiana', 'budkaInspicjenta'].forEach(towerType => {
        const buttonId = `uiButton${towerType.charAt(0).toUpperCase() + towerType.slice(1)}`;
        const buttonEl = document.getElementById(buttonId);
        if (buttonEl && C.towerDefinitions[towerType]) {
            buttonEl.querySelector('.cost').textContent = C.towerDefinitions[towerType].cost;
        }
    });

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
            }, 300);
        }
    }
}

export function updateTowerUpgradePanel() {
    if (!towerUpgradePanel) cacheDOMElements();
    if (!towerUpgradePanel) return;

    const specialButtons = [uiButtonUpgradeSpecial1, uiButtonUpgradeSpecial2 /*, uiButtonUpgradeSpecial3 */];
    specialButtons.forEach(btn => btn?.classList.add('hidden'));
    [uiButtonUpgradeDamage, uiButtonUpgradeFireRate].forEach(btn => btn?.classList.add('hidden'));


    if (state.selectedTowerForUpgrade && C.towerDefinitions[state.selectedTowerForUpgrade.type]) {
        towerUpgradePanel.classList.remove('hidden');
        const tower = state.selectedTowerForUpgrade;
        const towerDef = C.towerDefinitions[tower.type];
        
        if (upgradePanelTowerName) upgradePanelTowerName.textContent = towerDef.name;

        const standardUpgradeMap = { damage: uiButtonUpgradeDamage, fireRate: uiButtonUpgradeFireRate };

        towerDef.upgradeLevelNames?.forEach((upgradeKey, index) => {
            let button;
            let isStandard = false;
            if (standardUpgradeMap[upgradeKey]) {
                button = standardUpgradeMap[upgradeKey];
                isStandard = true;
            } else {
                // Mapowanie specjalnych ulepszeń na przyciski Special1, Special2 itd.
                // To zakłada, że pierwsze specjalne ulepszenie w upgradeLevelNames to Special1 itd.
                let specialButtonIndex = 0;
                for(let i=0; i < index; i++){
                    if(!standardUpgradeMap[towerDef.upgradeLevelNames[i]]) specialButtonIndex++;
                }
                button = specialButtons[specialButtonIndex];
            }

            if (button && towerDef.upgrades[upgradeKey]) {
                button.classList.remove('hidden');
                let buttonText = upgradeKey.charAt(0).toUpperCase() + upgradeKey.slice(1);
                // Poprawki nazw dla standardowych
                if (upgradeKey === 'damage') buttonText = "Obrażenia+";
                else if (upgradeKey === 'fireRate') buttonText = "Szybkostrzelność+";
                else if (upgradeKey === 'range') buttonText = "Zasięg+";
                else if (upgradeKey === 'effectStrength') buttonText = "Siła Efektu+";
                else if (upgradeKey === 'effectDuration') buttonText = "Czas Efektu+";
                else if (upgradeKey === 'critChance') buttonText = "Szansa Kryt.+";

                const currentLevel = tower[`${upgradeKey}Level`] || 0;
                const maxLevelForThisSpecificUpgrade = towerDef.upgrades[upgradeKey].length;


                if (currentLevel < maxLevelForThisSpecificUpgrade) {
                    button.innerHTML = `${buttonText} (<span class="cost">${towerDef.upgrades[upgradeKey][currentLevel].cost}</span> Ap.)`;
                    button.classList.remove('disabled');
                } else {
                    button.innerHTML = `${buttonText} (<span class="cost">MAX</span> Ap.)`;
                    button.classList.add('disabled');
                }
            }
        });
        
        if (uiButtonSellTower) {
            let sellValue = Math.floor(towerDef.cost * 0.75);
             tower.definition.upgradeLevelNames?.forEach(upgradeName => {
                const levelKey = `${upgradeName}Level`;
                for(let i = 0; i < (tower[levelKey] || 0); i++) {
                    sellValue += Math.floor((tower.definition.upgrades[upgradeName]?.[i]?.cost || 0) * 0.5);
                }
            });
            uiButtonSellTower.querySelector('.value').textContent = sellValue;
        }

    } else {
        towerUpgradePanel.classList.add('hidden');
    }
}


export function updateSelectedTowerButtonUI() {
    if (!uiButtonBileter) cacheDOMElements(); 
    
    const towerButtons = {
        'bileter': uiButtonBileter,
        'oswietleniowiec': uiButtonOswietleniowiec,
        'garderobiana': uiButtonGarderobiana,
        'budkaInspicjenta': uiButtonBudkaInspicjenta
    };

    for (const type in towerButtons) {
        if (towerButtons[type]) {
            if (state.selectedTowerType === type) {
                towerButtons[type].classList.add('selected-for-build');
            } else {
                towerButtons[type].classList.remove('selected-for-build');
            }
        }
    }
}