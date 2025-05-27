// js/screenManager.js
import { gameState as state } from './state.js';
import * as C from './config.js';

let _startGameLevelCallback = null;
let _updateContinueButtonStateCallback = null;
let _goToMainMenuCallback = null;

let pageTitle, gameLayout, mainMenuScreen, levelSelectionScreen, creditsScreen,
    levelCompleteScreenHTML, levelSelectionContainer, pauseMenuScreen,
    returnToMenuButtonGame, pauseButton, saveStatusMainMenu, saveStatusLevelSelection;

function cacheDOMElements() {
    pageTitle = document.getElementById('pageTitle');
    gameLayout = document.getElementById('gameLayout');
    mainMenuScreen = document.getElementById('mainMenu');
    levelSelectionScreen = document.getElementById('levelSelectionScreen');
    creditsScreen = document.getElementById('creditsScreen');
    levelCompleteScreenHTML = document.getElementById('levelCompleteScreen');
    levelSelectionContainer = document.getElementById('levelSelectionContainer');
    pauseMenuScreen = document.getElementById('pauseMenu');
    returnToMenuButtonGame = document.getElementById('returnToMenuButtonGame');
    pauseButton = document.getElementById('pauseButton');
    saveStatusMainMenu = document.getElementById('saveStatusMainMenu');
    saveStatusLevelSelection = document.getElementById('saveStatusLevelSelection');
}
cacheDOMElements(); 

export function initializeScreenManager(callbacks) {
    if (callbacks.startGameLevel) _startGameLevelCallback = callbacks.startGameLevel;
    if (callbacks.updateContinueButtonState) _updateContinueButtonStateCallback = callbacks.updateContinueButtonState;
    if (callbacks.goToMainMenu) _goToMainMenuCallback = callbacks.goToMainMenu;
}

export function showScreen(screenName) {
    if (!mainMenuScreen) cacheDOMElements(); 

    const screens = [mainMenuScreen, levelSelectionScreen, creditsScreen, levelCompleteScreenHTML, gameLayout, pauseMenuScreen];
    screens.forEach(screen => {
        if (screen) {
            screen.classList.remove('visible');
            screen.classList.add('hidden');
        }
    });

    console.log(`[ScreenManager.showScreen] Attempting to switch to screen: ${screenName}`);

    // ZMIANA TŁA STRONY (BODY) W ZALEŻNOŚCI OD EKRANU
    if (screenName === 'menu') {
        document.body.style.backgroundImage = "url('../assets/images/BACKGROUND_MENU.png')";
    } else {
        document.body.style.backgroundImage = "url('../assets/images/BACKGROUND_LEVELS.png')";
    }


    if (['menu', 'levelSelection', 'credits'].includes(screenName)) {
        if (pageTitle) pageTitle.textContent = "Teatr Tower Defense";
        const currentSaveStatusEl = screenName === 'menu' ? saveStatusMainMenu :
                                 screenName === 'levelSelection' ? saveStatusLevelSelection : null;
        if (currentSaveStatusEl) {
            if (!currentSaveStatusEl.textContent.toLowerCase().includes("błąd") &&
                !currentSaveStatusEl.textContent.toLowerCase().includes("nowa gra") &&
                !currentSaveStatusEl.textContent.toLowerCase().includes("wyczyszczony")) {
                currentSaveStatusEl.textContent = "Postęp gry jest zapisywany automatycznie.";
            }
        }
    }

    switch (screenName) {
        case 'menu':
            if (mainMenuScreen) {
                mainMenuScreen.classList.remove('hidden');
                mainMenuScreen.classList.add('visible');
            }
            if (_updateContinueButtonStateCallback) _updateContinueButtonStateCallback();
            break;
        case 'levelSelection':
            if (levelSelectionScreen) {
                levelSelectionScreen.classList.remove('hidden');
                levelSelectionScreen.classList.add('visible');
            }
            renderLevelSelection();
            break;
        case 'credits':
            if (creditsScreen) {
                creditsScreen.classList.remove('hidden');
                creditsScreen.classList.add('visible');
            }
            break;
        case 'levelCompleteCanvas':
            if (gameLayout) {
                gameLayout.classList.remove('hidden');
                gameLayout.classList.add('visible');
            }
            if (pageTitle) pageTitle.textContent = "Teatr Tower Defense - Podsumowanie Aktu";
            if (pauseButton) pauseButton.classList.add('hidden');
            if (returnToMenuButtonGame) returnToMenuButtonGame.classList.add('hidden');
            state.showingLevelCompleteSummary = true;
            break;
        case 'playing':
            if (gameLayout) {
                gameLayout.classList.remove('hidden');
                gameLayout.classList.add('visible');
            }
            if (pageTitle && C.levelData && C.levelData[state.currentLevelIndex]) {
                 pageTitle.textContent = `Teatr Tower Defense - Akt ${state.currentLevelIndex + 1}`;
            }
            if (returnToMenuButtonGame) returnToMenuButtonGame.classList.add('hidden');
            if (pauseButton) pauseButton.classList.remove('hidden');
            state.showingLevelCompleteSummary = false;
            break;
        case 'paused':
            if (gameLayout) {
                gameLayout.classList.remove('hidden');
                gameLayout.classList.add('visible');
            }
            if (pauseMenuScreen) {
                pauseMenuScreen.classList.remove('hidden');
                pauseMenuScreen.classList.add('visible');
            }
            state.showingLevelCompleteSummary = false;
            break;
        case 'levelLost':
            if (gameLayout) {
                gameLayout.classList.remove('hidden');
                gameLayout.classList.add('visible');
            }
            if (pageTitle) pageTitle.textContent = "Teatr Tower Defense - Koniec Gry";
            if (returnToMenuButtonGame) returnToMenuButtonGame.classList.remove('hidden');
            if (pauseButton) pauseButton.classList.add('hidden');
            state.showingLevelCompleteSummary = false;
            break;
        default:
            console.warn(`[ScreenManager.showScreen] Unknown screen name: ${screenName}. Defaulting to 'menu'.`);
            if (mainMenuScreen) {
                mainMenuScreen.classList.remove('hidden');
                mainMenuScreen.classList.add('visible');
            }
            document.body.style.backgroundImage = "url('../assets/images/BACKGROUND_MENU.png')"; // Domyślne tło dla 'menu'
            if (_updateContinueButtonStateCallback) _updateContinueButtonStateCallback();
            screenName = 'menu'; 
            break;
    }
    state.gameScreen = screenName;
}

export function renderLevelSelection() { 
    if (!levelSelectionContainer) {
        console.error("levelSelectionContainer is not found for renderLevelSelection.");
        return;
    }
    levelSelectionContainer.innerHTML = '';
    if (!C.levelData) {
        console.error("C.levelData is not defined in renderLevelSelection");
        return;
    }

    C.levelData.forEach((level, index) => {
        const button = document.createElement('button');
        button.classList.add('level-button');
        const isUnlocked = index < state.unlockedLevels;
        let progress = state.levelProgress[index] === undefined ? -1 : state.levelProgress[index];

        let progressText;
        if (progress >= C.WAVES_PER_LEVEL) {
            progressText = "(Ukończono ✔️)";
        } else if (progress >= 0) {
            progressText = `(Fale: ${progress + 1}/${C.WAVES_PER_LEVEL})`;
        } else {
            progressText = "(Nierozpoczęty)";
        }

        button.innerHTML = `
            <span class="level-name">Akt ${index + 1}${level.name ? ': ' + level.name : ''}</span>
            <span class="level-progress">${isUnlocked ? progressText : '🔒 Zablokowany'}</span>
        `;

        if (isUnlocked) {
            button.addEventListener('click', () => {
                const startFromWave = (progress >= C.WAVES_PER_LEVEL || progress < 0) ? 0 : progress +1;
                if (_startGameLevelCallback) {
                    _startGameLevelCallback(index, startFromWave);
                } else {
                    console.error("startGameLevel callback is not available to ScreenManager for level selection.");
                }
            });
        } else {
            button.classList.add('locked');
        }
        levelSelectionContainer.appendChild(button);
    });
}