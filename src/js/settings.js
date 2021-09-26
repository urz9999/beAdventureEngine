class Settings {
    fps;
    gameTick;
    creditMap;
    debug;
    fullscreen;

    color1;
    color2;
    color3;
    color4;
    color5;
    color6;
    color7;
    color8;
    color9;

    strokeColor;

    rainColor;
    dropCount;
    windVelocity;
    dropWidth;
    dropXBuffer;
    dropMinVelocity;
    dropMaxVelocity;
    dropMinLength;
    dropMaxLength;
    dropMinAlpha;
    dropMaxAlpha;

    // Partner System
    partners = [];

    noAlternateWorldMessages;

    // Point System
    points;
    usePointSystem;

    constructor() {
        this.loaded = false;
        this.loadSettings();

    }

    async loadSettings() {
        // Load data
        const response = await fetch(`assets/settings.json`);
        const settings = await response.json();

        this.fps = settings.fps;
        this.gameTick = settings.gameTick;
        this.creditMap = settings.creditMap; // Set here what map to use for credit

        this.debug = settings.debug;
        this.fullscreen = settings.fullscreen;

        this.color1 = settings.color1;
        this.color2 = settings.color2;
        this.color3 = settings.color3;
        this.color4 = settings.color4;
        this.color5 = settings.color5;
        this.color6 = settings.color6;
        this.color7 = settings.color7;
        this.color8 = settings.color8;
        this.color9 = settings.color9;

        this.strokeColor = settings.strokeColor;

        // Drop settings
        this.rainColor = settings.rainColor;
        this.dropCount = settings.dropCount;
        this.windVelocity = settings.windVelocity; // Determines how slanted the rain drops fall, 0 = straight down
        this.dropWidth = settings.dropWidth; // Increase for thicker rain
        this.dropXBuffer = settings.dropXBuffer; // How far to the sides of the screen drops will spawn
        this.dropMinVelocity = settings.dropMinVelocity;
        this.dropMaxVelocity = settings.dropMaxVelocity;
        this.dropMinLength = settings.dropMinLength;
        this.dropMaxLength = settings.dropMaxLength;
        this.dropMinAlpha = settings.dropMinAlpha;
        this.dropMaxAlpha = settings.dropMaxAlpha;

        // Partners configuration
        this.partners = settings.partners

        // Alternate World Deny Messages
        this.noAlternateWorldMessages = settings.noAlternateWorldMessages;

        // Configuration for point system
        this.points = 0;
        this.usePointSystem = settings.usePointSystem;
    }
}
