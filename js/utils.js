// showMessage i drawTextWithOutline pozostają takie same
// Funkcje fullscreen zostały usunięte z tego pliku (i z projektu)

export function showMessage(state, msg, duration = 180) {
    state.currentMessage = msg;
    state.messageTimer = duration;
}

export function drawTextWithOutline(ctx, text, x, y, font, fillColor, outlineColor, outlineWidth = 2.5) {
    ctx.font = font;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
    ctx.lineWidth = 1;
}