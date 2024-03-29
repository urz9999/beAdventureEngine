class MouseManager {

    gameCanvas;
    gameWidth;
    gameHeight;
    gameStatus;
    gameVariables;

    spriteManager;
    interactableManager;

    settings;

    constructor(spriteManager, interactableManager, gameStatus, gameVariables, gameCanvas, gameWidth, gameHeight, settings) {
        this.spriteManager = spriteManager;
        this.interactableManager = interactableManager;
        this.gameStatus = gameStatus;
        this.gameVariables = gameVariables;
        this.gameCanvas = gameCanvas;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.settings = settings;
    }

    processMouse(event) {
        event.preventDefault();
        event.stopPropagation();

        switch (event.type) {
            case 'mousemove': this.processMoves(event); break;
            case 'mousedown': this.processClicks(event); break;
        }
    }

    processMoves(event) {
        const rect = this.gameCanvas.getBoundingClientRect();
        const canvasX = (event.clientX - rect.left) / this.gameStatus.scale;
        const canvasY = (event.clientY - rect.top) / this.gameStatus.scale;

        // Pass control to the the minigame
        if(this.gameStatus.levelStatus === 2) {
            if(this.gameVariables.selectedMinigame !== undefined) {
                this.gameVariables.selectedMinigame.processMovement(canvasX, canvasY);
            } else {
                throw new Error("You need to launch a minigame in this state,please verify");
            }
            return;
        }

        if(!this.gameStatus.showInventory && !this.gameStatus.doingQuestion) {
            const foundInteractable = this.overInteractable(canvasX, canvasY);
            if(foundInteractable !== null) {
                switch (foundInteractable.type) {
                    case 'dialog': this.gameStatus.cursor = 'talk'; break;
                    case 'object': this.gameStatus.cursor = 'take'; break;
                    case 'interact': this.gameStatus.cursor = 'take'; break;
                    case 'location': this.gameStatus.cursor = 'exit'; break;
                    case 'question': this.gameStatus.cursor = 'talk'; break;
                    case 'look': this.gameStatus.cursor = 'look'; break;
                    case 'combine': this.gameStatus.cursor = 'combine'; break;
                    case 'partner': this.gameStatus.cursor = 'combine'; break;
                    case 'minigame': this.gameStatus.cursor = 'combine'; break;
                    case 'openurl': this.gameStatus.cursor = 'standard'; break;
                    case 'teleport': this.gameStatus.cursor = 'standard'; break;
                    case 'exit': this.gameStatus.cursor = 'exit'; break;
                }
                this.gameVariables.interactableAuraOn = foundInteractable.linked;
            } else {
                this.gameStatus.cursor = 'standard';
                this.gameVariables.interactableAuraOn = null;
            }
        } else {
            if(!this.gameStatus.doingQuestion) {
                // Check if the mouse is over some element of the inventory
                const index = this.overMenuSlot(canvasX, canvasY);
                if(index > -1) {
                    let obj = this.gameVariables.inventory[index];
                    if(obj !== undefined) {
                        this.gameVariables.inventoryTooltip = { tooltip: obj.description, index: Math.floor(index / 4) };
                    }
                } else {
                    this.gameVariables.inventoryTooltip = null;
                }
            } else {
                this.gameVariables.questions[this.gameVariables.currentInteractable.linked].answeredQuestionNumber = this.overQuestion(canvasX, canvasY);
            }
        }
    }

    processClicks(event) {
        let playerSprite = this.spriteManager.getSprite('main').subSprite;
        if(this.gameStatus.partnerIndex !== 0) {
            playerSprite = this.spriteManager.getSprite(this.settings.partners[this.gameStatus.partnerIndex - 1].name).subSprite;
        }
        const rect = this.gameCanvas.getBoundingClientRect();
        const canvasX = (event.clientX - rect.left) / this.gameStatus.scale;
        const canvasY = (event.clientY - rect.top) / this.gameStatus.scale;

        // Pass control to the the minigame
        if(this.gameStatus.levelStatus === 2) {
            if(this.gameVariables.selectedMinigame !== undefined) {
                this.gameVariables.selectedMinigame.processClicks(canvasX, canvasY);
            } else {
                throw new Error("You need to launch a minigame in this state,please verify");
            }
            return;
        }

        if(this.gameStatus.blockMouseAction || this.gameStatus.walkingToInteractable) { return; }

        this.gameVariables.player.clickedX = canvasX;

        // Inventory - Always process menu icons first
        if(this.overMenuIcon(canvasX, canvasY, 'InventoryIcon') && this.gameVariables.player.noplayer === false) {
            this.gameStatus.showInventory = !this.gameStatus.showInventory;
            if(this.gameStatus.showInventory) {
                this.gameStatus.cursor = 'standard';
            }
            return;
        }

        // Pause - Always process menu icons first
        if((this.overMenuIcon(canvasX, canvasY, 'PauseIcon') || this.overMenuIcon(canvasX, canvasY, 'PlayIcon')) && this.gameVariables.player.noplayer === false) {
            this.gameStatus.gamePaused = !this.gameStatus.gamePaused;
            return;
        }

        if(this.overMenuIcon(canvasX, canvasY, 'PartnerChange')) {
            this.gameStatus.partnerIndex++;
            if(this.gameStatus.partnerIndex > this.settings.partners.length) {
                this.gameStatus.partnerIndex = 0;
            }
            return;
        }

        if(!this.gameStatus.gamePaused) {

            // Process questions
            if(this.gameStatus.doingQuestion) {
                if(this.gameVariables.questions[this.gameVariables.currentInteractable.linked].answeredQuestionNumber > -1) {
                    this.interactableManager.processClicksForEvents();
                    this.gameStatus.blockMouseAction = false;
                }
                return;
            }

            if(!this.gameStatus.showInventory) {
                const foundInteractable = this.overInteractable(canvasX, canvasY);
                if(foundInteractable !== null && !this.gameStatus.processInteractable) {
                    this.gameVariables.currentInteractable = foundInteractable;
                    this.gameStatus.processInteractable = true;
                    // Move towards it or directly set for processing interactable
                    if (
                        this.gameVariables.player.noplayer === false &&
                        ((foundInteractable.x < playerSprite.dx - playerSprite.width) ||
                         (foundInteractable.x > playerSprite.dx + playerSprite.width))
                    ) {
                        // Move towards it
                        this.gameStatus.cursor = 'move';
                        this.gameVariables.player.animation = 'walking';
                        this.gameVariables.player.direction = foundInteractable.x > playerSprite.dx;
                        this.gameVariables.player.reachX = foundInteractable.x;

                        // Set moving towards conditions
                        this.gameStatus.walkingToInteractable = true;
                        this.gameStatus.blockMouseAction = true;
                    } else {
                        // Directly process interactable as they are close enough
                        this.gameStatus.walkingToInteractable = false;
                        this.gameStatus.blockMouseAction = false;
                        this.interactableManager.processClicksForEvents();
                    }
                } else {
                    // Move only if we are not processing an interactable already
                    if(!this.gameStatus.processInteractable && this.gameVariables.player.noplayer === false) {
                        // Just move in a direction
                        this.gameStatus.cursor = 'move';
                        this.gameVariables.player.animation = 'walking';
                        this.gameVariables.player.direction = (this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam) > playerSprite.dx;
                        this.gameVariables.player.reachX = this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam;
                        console.log(this.gameVariables.player.reachX);
                        this.gameStatus.blockMouseAction = true;
                    } else {
                        this.interactableManager.processClicksForEvents();
                        this.gameStatus.blockMouseAction = false;
                    }
                }
            } else {
                if(!this.gameStatus.doingQuestion) {
                    // Check if the mouse is over some element of the inventory
                    const index = this.overMenuSlot(canvasX, canvasY);
                    if(index > -1) {
                        let obj = this.gameVariables.inventory[index];
                        if(obj !== undefined && obj.usable === true) {
                            this.gameStatus.showInventory = false;
                            this.gameVariables.currentInteractable = obj.interactable;
                            this.gameStatus.processInteractable = true;
                            this.gameStatus.walkingToInteractable = false;
                            this.gameStatus.blockMouseAction = false;
                            this.gameVariables.inventoryTooltip = null;
                            this.interactableManager.processInteractables();
                        }
                    }
                }
            }
        }
    }

    setMouseCursor() {
        const name = this.gameStatus.cursor;
        const map = {
            'standard': `url('assets/images/ui/menu/cursors/standard.cur'), auto`,
            'move': `url('assets/images/ui/menu/cursors/move.cur'), auto`,
            'look': `url('assets/images/ui/menu/cursors/look.cur'), auto`,
            'take': `url('assets/images/ui/menu/cursors/take.cur'), auto`,
            'talk': `url('assets/images/ui/menu/cursors/talk.cur'), auto`,
            'alternate': `url('assets/images/ui/menu/cursors/talk.cur'), auto`,
            'combine': `url('assets/images/ui/menu/cursors/combine.cur'), auto`,
            'teleport': `url('assets/images/ui/menu/cursors/standard.cur'), auto`,
            'exit': `url('assets/images/ui/menu/cursors/exit.cur'), auto`
        };
        this.gameCanvas.style.cursor = map[name];
    }

    overMenuIcon(canvasX, canvasY, name) {
        const menuIcon = this.spriteManager.getSprite(name);
        const menuIconX = menuIcon.x;
        const menuIconY = 20;
        const test = (
            canvasX > menuIconX && canvasX < (menuIconX + menuIcon.width) &&
            canvasY > menuIconY && canvasY < (menuIconY + menuIcon.height)
        );

        return test;
    }

    overMenuSlot(canvasX, canvasY) {
        // Check if the mouse is over some element of the inventory
        const inventorySlot = this.spriteManager.getSprite('InventorySlot');
        const overallSpaceX = inventorySlot.width * 4 + 60;
        const overallSpaceY = inventorySlot.height * 4 + 60;

        console.log(this.gameWidth, this.gameHeight);

        for(let j = 0; j < 4; j++) {
            for(let i = 0; i < 4; i++) {

                const slotX = this.gameWidth / 2 - overallSpaceX / 2 + j * inventorySlot.width + j * 20;
                const slotY = this.gameHeight / 2 - overallSpaceY / 2 + i * inventorySlot.height + i * 20;

                if(
                    canvasX > slotX && canvasX < (slotX + inventorySlot.width) &&
                    canvasY > slotY && canvasY < (slotY + inventorySlot.height)
                ) {
                    return (i * 4 + j);
                }
            }
        }

        return -1;
    }

    overInteractable(canvasX, canvasY) {
        for(let i = 0; i < this.gameVariables.interactables.length; i++) {
            const interactable = Object.assign({}, this.gameVariables.interactables[i]);

            // Correct by player cam if needed as this only serves when the player is active
            // Also this serves only here because the other element on the UI are 0-translated again
            const translatedX = this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam;

            if(
                translatedX > interactable.x && translatedX < (interactable.x + interactable.width) &&
                canvasY > interactable.y && canvasY < (interactable.y + interactable.height)
            ) {
                if(this.gameStatus.alternate === true && interactable.alternate === true) { return interactable; }
                else if(!this.gameStatus.alternate && interactable.alternate === undefined) { return interactable; }
                else return null;
            }
        }
        return null;
    }

    overQuestion(canvasX, canvasY) {
        const questionData = this.gameVariables.questions[this.gameVariables.currentInteractable.linked];

        if(questionData !== undefined && questionData.boundingBoxes !== undefined) {
            for(let i = 0; i < questionData.boundingBoxes.length; i++) {
                const boundingBox = questionData.boundingBoxes[i];
                if(
                    canvasX > boundingBox.x && canvasX < (boundingBox.x + boundingBox.width) &&
                    canvasY > boundingBox.y && canvasY < (boundingBox.y + boundingBox.height)
                ) {
                    return i;
                }
            }
        }
        return -1;
    }
}
