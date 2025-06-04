// js/uiManager.js
import * as C from './config.js';
import { gameState as state } from './state.js';

let uiCurrentAct, uiCurrentWave, uiAplauz, uiAudienceSatisfaction,
    uiButtonBileter, uiButtonOswietleniowiec, uiButtonGarderobiana, uiButtonBudkaInspicjenta,
    uiButtonUpgradeSatisfaction, uiButtonStartWave, uiMessages, 
    towerUpgradePanel, upgradePanelTowerName, uiButtonUpgradeDamage, uiButtonUpgradeFireRate, 
    uiButtonUpgradeSpecial1, uiButtonUpgradeSpecial2, 
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
    uiButtonUpgradeSpecial1 = document.getElementById('uiButtonUpgradeSpecial1'); 
    uiButtonUpgradeSpecial2 = document.getElementById('uiButtonUpgradeSpecial2'); 
    uiButtonSellTower = document.getElementById('uiButtonSellTower');
}
cacheDOMElements(); // Wywołaj od razu, aby mieć pewność, że elementy są dostępne


export function updateUiStats() {
    if (!uiCurrentAct) cacheDOMElements(); // Ponowne sprawdzenie, na wszelki wypadek
    if (!uiCurrentAct) { 
        console.error("UIManager: DOM elements not cached for updateUiStats.");
        return;
    }

    if (['playing', 'paused', 'levelLost', 'levelCompleteCanvas'].includes(state.gameScreen)) {
        uiCurrentAct.textContent = state.currentLevelIndex + 1;
        
        let displayWaveNumber = state.currentWaveNumber;
        // ... (reszta logiki dla displayWaveNumber - bez zmian) ...
        if (state.gameScreen === 'playing' || state.gameScreen === 'paused') {
            if (state.waveInProgress || state.showingWaveIntro) {
                displayWaveNumber = state.currentWaveNumber + 1;
            } else if (state.currentWaveNumber === 0 && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1)) {
                displayWaveNumber = "-";
            } else if (state.currentWaveNumber >= C.WAVES_PER_LEVEL) {
                 displayWaveNumber = C.WAVES_PER_LEVEL;
            } else { 
                displayWaveNumber = state.currentWaveNumber +1; 
            }
        } else { 
            if (state.gameScreen === 'levelCompleteCanvas') {
                displayWaveNumber = C.WAVES_PER_LEVEL;
            } else { 
                displayWaveNumber = (state.currentWaveNumber > 0 && state.currentWaveNumber <= C.WAVES_PER_LEVEL) ? state.currentWaveNumber : (state.levelProgress[state.currentLevelIndex] === -1 ? "-" : (state.levelProgress[state.currentLevelIndex] || 0) + 1) ;
                if(displayWaveNumber > C.WAVES_PER_LEVEL) displayWaveNumber = C.WAVES_PER_LEVEL;
            }
        }
        if (state.currentWaveNumber === 0 && !state.waveInProgress && !state.showingWaveIntro && (state.levelProgress[state.currentLevelIndex] === undefined || state.levelProgress[state.currentLevelIndex] === -1)){
            displayWaveNumber = "-"; 
        }

        uiCurrentWave.textContent = `${displayWaveNumber}/${C.WAVES_PER_LEVEL}`;
        uiAplauz.textContent = state.aplauz;
        uiAudienceSatisfaction.textContent = `${state.zadowolenieWidowni}/${state.maxZadowolenieWidowni}`;
    }

    // Aktualizacja kosztów i dostępności przycisków wież
    const towerButtonsMap = {
        'bileter': uiButtonBileter,
        'oswietleniowiec': uiButtonOswietleniowiec,
        'garderobiana': uiButtonGarderobiana,
        'budkaInspicjenta': uiButtonBudkaInspicjenta
    };

    for (const towerType in towerButtonsMap) {
        const buttonEl = towerButtonsMap[towerType];
        const towerDef = C.towerDefinitions[towerType];
        if (buttonEl && towerDef) {
            const costValueSpan = buttonEl.querySelector('.cost-value');
            if (costValueSpan) costValueSpan.textContent = towerDef.cost;

            if (state.aplauz >= towerDef.cost) {
                buttonEl.classList.remove('disabled');
            } else {
                buttonEl.classList.add('disabled');
            }
        }
    }

    // Aktualizacja kosztu i dostępności ulepszenia satysfakcji
    if (uiButtonUpgradeSatisfaction) {
        const costValueSpan = uiButtonUpgradeSatisfaction.querySelector('.cost-value');
        if (state.zadowolenieUpgradeLevel < C.MAX_ZADOWOLENIE_UPGRADE_LEVEL && C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel]) {
            const upgradeCost = C.zadowolenieUpgrades[state.zadowolenieUpgradeLevel].cost;
            if (costValueSpan) costValueSpan.textContent = upgradeCost;
            if (state.aplauz >= upgradeCost) {
                uiButtonUpgradeSatisfaction.classList.remove('disabled');
            } else {
                uiButtonUpgradeSatisfaction.classList.add('disabled');
            }
        } else {
            if (costValueSpan) costValueSpan.textContent = "MAX";
            uiButtonUpgradeSatisfaction.classList.add('disabled');
        }
    }

    // Dostępność przycisku Start Fali
    if (uiButtonStartWave) {
        const isStartWaveDisabled = state.gameOver || state.waveInProgress || state.showingWaveIntro || 
                                  state.currentWaveNumber >= C.WAVES_PER_LEVEL || 
                                  state.gameScreen === 'levelCompleteCanvas' || state.gameScreen === 'levelCompleteScreen';
        if (isStartWaveDisabled) {
            uiButtonStartWave.classList.add('disabled');
        } else {
            uiButtonStartWave.classList.remove('disabled');
        }
    }
    // Aktualizacja panelu ulepszeń wieży (w tym dostępności przycisków)
    updateTowerUpgradePanel();
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

    const specialButtons = [uiButtonUpgradeSpecial1, uiButtonUpgradeSpecial2];
    specialButtons.forEach(btn => btn?.classList.add('hidden')); // Ukryj wszystkie specjalne na początku
    [uiButtonUpgradeDamage, uiButtonUpgradeFireRate].forEach(btn => btn?.classList.add('hidden')); // Ukryj standardowe na początku


    if (state.selectedTowerForUpgrade && C.towerDefinitions[state.selectedTowerForUpgrade.type]) {
        towerUpgradePanel.classList.remove('hidden');
        const tower = state.selectedTowerForUpgrade;
        const towerDef = C.towerDefinitions[tower.type];
        
        if (upgradePanelTowerName) upgradePanelTowerName.textContent = towerDef.name;

        const standardUpgradeMap = { damage: uiButtonUpgradeDamage, fireRate: uiButtonUpgradeFireRate };

        let specialButtonCounter = 0; // Licznik dla przycisków specjalnych

        towerDef.upgradeLevelNames?.forEach((upgradeKey) => {
            let button;
            let buttonTextMainSpan;
            let buttonCostValueSpan;

            if (standardUpgradeMap[upgradeKey]) {
                button = standardUpgradeMap[upgradeKey];
            } else {
                if (specialButtonCounter < specialButtons.length) {
                    button = specialButtons[specialButtonCounter];
                    specialButtonCounter++;
                }
            }

            if (button && towerDef.upgrades[upgradeKey]) {
                button.classList.remove('hidden');
                buttonTextMainSpan = button.querySelector('.button-text-main');
                buttonCostValueSpan = button.querySelector('.cost-value');

                let buttonText = upgradeKey.charAt(0).toUpperCase() + upgradeKey.slice(1);
                if (upgradeKey === 'damage') buttonText = "Obrażenia+";
                else if (upgradeKey === 'fireRate') buttonText = "Szybkostrzelność+";
                else if (upgradeKey === 'range') buttonText = "Zasięg+";
                else if (upgradeKey === 'effectStrength') buttonText = "Siła Efektu+";
                else if (upgradeKey === 'effectDuration') buttonText = "Czas Efektu+";
                else if (upgradeKey === 'critChance') buttonText = "Szansa Kryt.+";
                
                if (buttonTextMainSpan) buttonTextMainSpan.textContent = buttonText;

                const currentLevel = tower[`${upgradeKey}Level`] || 0;
                const maxLevelForThisSpecificUpgrade = towerDef.upgrades[upgradeKey].length;

                if (currentLevel < maxLevelForThisSpecificUpgrade) {
                    const upgradeCost = towerDef.upgrades[upgradeKey][currentLevel].cost;
                    if (buttonCostValueSpan) buttonCostValueSpan.textContent = upgradeCost;
                    if (state.aplauz >= upgradeCost) {
                        button.classList.remove('disabled');
                    } else {
                        button.classList.add('disabled');
                    }
                } else {
                    if (buttonCostValueSpan) buttonCostValueSpan.textContent = "MAX";
                    button.classList.add('disabled');
                }
            }
        });
        
        if (uiButtonSellTower) {
            let sellValue = 0; // Wartość sprzedaży jest liczona w gameLogic, tutaj tylko wyświetlamy
            const sellValueSpan = uiButtonSellTower.querySelector('.cost-value');
            // Logika obliczania wartości sprzedaży powinna być w gameLogic i przekazywana lub odczytywana
            // Dla uproszczenia, na razie zostawmy 0, ale to powinno być dynamiczne
            if (tower) { // Upewnij się, że wieża jest wybrana
                let calculatedSellValue = Math.floor(towerDef.cost * 0.75);
                tower.definition.upgradeLevelNames?.forEach(upgradeName => {
                    const levelKey = `${upgradeName}Level`;
                    for(let i = 0; i < (tower[levelKey] || 0); i++) {
                        calculatedSellValue += Math.floor((tower.definition.upgrades[upgradeName]?.[i]?.cost || 0) * 0.5);
                    }
                });
                sellValue = calculatedSellValue;
            }
            if (sellValueSpan) sellValueSpan.textContent = sellValue;
            uiButtonSellTower.classList.remove('disabled'); // Przycisk sprzedaży jest zawsze dostępny, jeśli wieża jest wybrana
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
