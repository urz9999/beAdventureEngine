/*
* this.gameStatus.minigameWin; Set this to true or false when you end the
* minigame to make the engine process the result, left it undefined to be
* sure the minigame can continue is job
*/

class MiniGame {

    gameCanvas;
    gameWidth;
    gameHeight;

    settings;
    soundSystem;
    spriteManager;
    fontManager;
    mapManager;
    mouseManager;
    interactableManager;

    gameStatus;
    gameVariables;

    constructor(gameCanvas, gameWidth, gameHeight, settings, soundSystem,
                spriteManager, fontManager, mapManager, mouseManager, interactableManager,
                gameStatus, gameVariables) {

        this.gameCanvas = gameCanvas;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.settings = settings;
        this.soundSystem = soundSystem;
        this.spriteManager = spriteManager;
        this.fontManager = fontManager;
        this.mapManager = mapManager;
        this.mouseManager = mouseManager;
        this.interactableManager = interactableManager;

        this.gameStatus = gameStatus;
        this.gameVariables = gameVariables;
    }

    start() {}

    animate(time) {}

    draw(time) {}

    processMovement(canvasX, canvasY) {}

    processClicks(canvasX, canvasY) {}

}
