class FontManager {
    fontList;
    gameVariables;

    constructor(gameVariables) {
        this.fontList = {};
        this.gameVariables = gameVariables;
    }

    addFont(name, style) {
        this.fontList[name] = style;
    }

    drawText(canvas, maxWidth, text, x, y, fontName, color, stroke) {
        text = this.transformVariables(text);

        const font = this.fontList[fontName];
        const ctx = canvas.getContext("2d");
        const lineHeight = font.size * 1.2;
        const fitWidth = maxWidth || 0;
        const fill = !stroke;

        let words = text.split(' ');
        let currentLine = 0;
        let idx = 1;

        ctx.font = `${font.size}px ${fontName}`;
        ctx.fillStyle = color || font.color;
        ctx.strokeStyle = color || font.color;
        ctx.lineWidth = 2;

        if (fitWidth <= 0) {
            this.drawOrStroke(ctx, text, x, y, fill);
            return;
        }

        while (words.length > 0 && idx <= words.length) {
            const str = words.slice(0, idx).join(' ');
            const w = ctx.measureText(str).width;
            if (w > fitWidth) {
                idx = (idx === 1 ? 2 : idx);

                this.drawOrStroke(ctx, words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine), fill);

                currentLine++;
                words = words.splice(idx - 1);
                idx = 1;
            } else {
                idx++;
            }
        }
        if(idx > 0) {
            this.drawOrStroke(ctx, words.join(' '), x, y + (lineHeight * currentLine), fill);
        }
    }

    drawOrStroke(ctx, text, x, y, fill) {
        return (fill ? ctx.fillText(text, x, y) : ctx.strokeText(text, x, y));
    }

    transformVariables(text) {
        return text.replace(/\$\{.+?\}/g, (match) => this.getTriggerValue(match));
    }

    getTriggerValue(match) {
        match = match.replace("${", "").replace("}", "");
        return this.gameVariables.triggers[match];
    }
}
