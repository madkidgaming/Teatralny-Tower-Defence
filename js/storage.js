const SAVE_KEY_PROGRESS = 'teatrTdProgress_v1'; // Dodaj wersjonowanie klucza na wszelki wypadek

export function saveGameProgress(state) {
    try {
        const progressToSave = {
            unlockedLevels: state.unlockedLevels,
            levelProgress: state.levelProgress,
            // Można dodać zadowolenieUpgradeLevel, jeśli ma być globalne
            // zadowolenieUpgradeLevel: state.zadowolenieUpgradeLevel
        };
        localStorage.setItem(SAVE_KEY_PROGRESS, JSON.stringify(progressToSave));
        // console.log("Postęp gry zapisany:", progressToSave);
        const saveStatusEl = document.getElementById('saveStatus');
        if (saveStatusEl && state.gameScreen === 'menu') saveStatusEl.textContent = "Postęp zapisany automatycznie.";
    } catch (e) {
        console.error("Nie udało się zapisać postępu gry:", e);
        const saveStatusEl = document.getElementById('saveStatus');
        if (saveStatusEl) saveStatusEl.textContent = "Błąd zapisu postępu!";
    }
}

export function loadGameProgress(state) {
    try {
        const savedProgress = localStorage.getItem(SAVE_KEY_PROGRESS);
        if (savedProgress) {
            const parsedProgress = JSON.parse(savedProgress);
            state.unlockedLevels = parsedProgress.unlockedLevels || 1;
            state.levelProgress = parsedProgress.levelProgress || {};
            // state.zadowolenieUpgradeLevel = parsedProgress.zadowolenieUpgradeLevel || 0;
            // console.log("Postęp gry załadowany:", state.unlockedLevels, state.levelProgress);
        } else {
            // Ustawienia domyślne, jeśli nie ma zapisu
            state.unlockedLevels = 1;
            state.levelProgress = {};
            // state.zadowolenieUpgradeLevel = 0;
            // console.log("Brak zapisanego postępu, inicjowanie domyślnych wartości.");
            saveGameProgress(state); // Zapisz domyślny stan od razu
        }
    } catch (e) {
        console.error("Nie udało się załadować postępu gry:", e);
        state.unlockedLevels = 1; // W razie błędu, fallback do domyślnych
        state.levelProgress = {};
        // state.zadowolenieUpgradeLevel = 0;
    }
}