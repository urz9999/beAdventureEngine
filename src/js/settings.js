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

    // Point System
    points;
    usePointSystem;

    constructor() {
        this.fps = 30;
        this.gameTick = 6000;
        this.creditMap = 99; // Set here what map to use for credit

        this.debug = false;
        this.fullscreen = true;

        this.color1 = '#00faff';
        this.color2 = '#d000ff';
        this.color3 = '#bbff00';
        this.color4 = '#ff0000';
        this.color5 = '#000000';
        this.color6 = '#f3ad55';
        this.color7 = '#0022ff';
        this.color8 = '#56478c';
        this.color9 = '#8d8d8d';

        this.strokeColor = '#353728';

        // Drop settings
        this.rainColor = '#eff5f6';
        this.dropCount = 100;
        this.windVelocity = -0.1; // Determines how slanted the rain drops fall, 0 = straight down
        this.dropWidth = 0.5; // Increase for thicker rain
        this.dropXBuffer = 50; // How far to the sides of the screen drops will spawn
        this.dropMinVelocity = 0.3;
        this.dropMaxVelocity = 0.5;
        this.dropMinLength = 15;
        this.dropMaxLength = 30;
        this.dropMinAlpha = 0.3;
        this.dropMaxAlpha = 0.6;

        // Partners configuration
        this.partners = [
            { id: 'dog', name: 'Mecha Dog', offsetX: -80, offsetY: 50, size: 0.5, activateDialog: 'Warf, bau bau! (I\'m ready!)', okDialog: 'Wof! Wof! (Yes!)', cancelDialog: 'Cai! Cai! Booo! (can\'t make it!)', walkingFrames: 5, idleFrames: 5, talkingFrames: 0, width: 55, height: 41 }
        ];

        // Configuration for point system
        this.points = 0;
        this.usePointSystem = true;
    }
}
