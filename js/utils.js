// js/utils.js
export function showMessage(state, msg, duration = 180) {
    state.currentMessage = msg;
    state.messageTimer = duration;
}

export function drawTextWithOutline(ctx, text, x, y, font, fillColor, outlineColor, outlineWidth = 2.5, textAlign = "center") {
    ctx.font = font;
    const previousTextAlign = ctx.textAlign; // Zapamiętaj poprzednie wyrównanie
    ctx.textAlign = textAlign;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = "round"; // Lepsze dla rogów tekstu
    ctx.miterLimit = 2;    // Dla ostrych rogów
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
    ctx.lineWidth = 1; // Resetuj grubość linii
    ctx.textAlign = previousTextAlign; // Przywróć poprzednie wyrównanie
}