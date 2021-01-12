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

        this.strokeColor = '#353728'
    }
}
