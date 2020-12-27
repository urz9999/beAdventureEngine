class FalloutMinigame extends MiniGame {
    constructor(gameCanvas, gameWidth, gameHeight, settings, soundSystem,
                spriteManager, fontManager, mapManager, mouseManager, interactableManager,
                gameStatus, gameVariables) {

        super(gameCanvas, gameWidth, gameHeight, settings, soundSystem,
            spriteManager, fontManager, mapManager, mouseManager, interactableManager,
            gameStatus, gameVariables);
    }

    start() {}

    animate(time) {}

    draw(time) {}

    processMovement(canvasX, canvasY) {}

    processClicks(canvasX, canvasY) {}
}
