class FontManager {
    fontList;
    gameVariables;
    settings;

    constructor(gameVariables, settings) {
        this.fontList = {};
        this.gameVariables = gameVariables;
        this.settings = settings;
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
        const fill = true;

        let words = text.split(' ');
        let currentLine = 0;
        let idx = 1;

        ctx.font = `${font.size}px ${fontName}`;
        ctx.fillStyle = color || font.color;
        ctx.strokeStyle = this.settings.strokeColor;
        ctx.lineWidth = 2;

        if (fitWidth <= 0) {
            if(stroke) this.drawStyledText(ctx, text, x, y, fontName, font.size, !fill);
            this.drawStyledText(ctx, text, x, y, fontName, font.size, fill);
            return;
        }

        while (words.length > 0 && idx <= words.length) {
            const str = words.slice(0, idx).join(' ');
            const w = ctx.measureText(str).width;
            if (w > fitWidth) {
                idx = (idx === 1 ? 2 : idx);

                if(stroke) this.drawStyledText(ctx, words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine), fontName, font.size, !fill);
                this.drawStyledText(ctx, words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine), fontName, font.size, fill);
                currentLine++;
                words = words.splice(idx - 1);
                idx = 1;
            } else {
                idx++;
            }
        }
        if(idx > 0) {
            if(stroke) this.drawStyledText(ctx, words.join(' '), x, y + (lineHeight * currentLine), fontName, font.size, !fill);
            this.drawStyledText(ctx, words.join(' '), x, y + (lineHeight * currentLine), fontName, font.size, fill);
        }
        return lineHeight * (currentLine + 1);
    }

    drawOrStroke(ctx, text, x, y, fill) {
        return (fill ? ctx.fillText(text, x, y) : ctx.strokeText(text, x, y));
    }

    drawStyledText(ctx, text, x, y, fontName, size, fill) {
        // Original color style
        const originalColorStyle = ctx.fillStyle;

        // Marker used in the text to mention style change
        const styleMarker = '§';

        // Table code style --> font style
        const styleCodeToStyle = {
            r: '',
            i: 'italic',
            b: 'bold',
            l: 'lighter',
            0: originalColorStyle,
            1: this.settings.color1,
            2: this.settings.color2,
            3: this.settings.color3,
            4: this.settings.color4,
            5: this.settings.color5,
            6: this.settings.color6,
            7: this.settings.color7,
            8: this.settings.color8,
            9: this.settings.color9
        };

        const buildFont = (fontName, size, fontCodeStyle) => {
            const style = styleCodeToStyle[fontCodeStyle];
            if(Number(fontCodeStyle) >= 0) {
                ctx.fillStyle = style;
            } else {
                ctx.font = style + ' ' + size + 'px' + ' ' + fontName;
            }
        }

        // Start with regular style
        let fontCodeStyle = 'r';

        do {
            // Set context font
            buildFont(fontName, size, fontCodeStyle);

            // Find longest run of text for current style
            let ind = text.indexOf(styleMarker);

            // Take all text if no more marker
            if (ind == -1) ind = text.length;

            // Draw current run
            const run = text.substring(0, ind);
            this.drawOrStroke(ctx, run, x, y, fill);

            // Return if ended
            if (ind == text.length) return;

            // Move forward
            x += ctx.measureText(run).width;
            // Update current style
            fontCodeStyle = text[ind + 1];

            // Keep only remaining part of text
            text = text.substring(ind + 2);

        } while (text.length > 0)
    }

    transformVariables(text) {
        return text.replace(/\$\{.+?\}/g, (match) => this.getTriggerValue(match));
    }

    getTriggerValue(match) {
        match = match.replace("${", "").replace("}", "");
        return this.gameVariables.triggers[match];
    }
}
