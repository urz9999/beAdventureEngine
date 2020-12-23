class beAdventureEngine {

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

    constructor(canvasId) {

        this.gameCanvas = document.getElementById(canvasId);
        this.gameCanvas.addEventListener('mousedown', (event) => this.mouseManager.processMouse(event), false);
        this.gameCanvas.addEventListener('mousemove', (event) => this.mouseManager.processMouse(event), false);

        this.gameStatus = {
            levelStatus: 0,
            lastTick: 0,

            showMainScreen: true,
            showLoader: false,
            showMenu: false,
            showInventory: false,
            showIntermission: false,

            doingQuestion: false,
            gamePaused: false,

            blockMouseAction: false,
            processInteractable: false,
            walkingToInteractable: false,

            cursor: 'standard'
        };

        this.gameVariables = {
            player: { direction: 1, animation: 'idle', reachX: 0, noplayer: false },
            objects: [],
            characters: [],
            inventory: [],
            interactables: [],
            triggers: {},
            questions: {},
            interactableAuraOn: null,
            currentMap: 0,
            currentMusic: '',
            currentInteractable: null,
            currentDialog: null,
            inventoryTooltip: null
        };

        this.settings = new Settings();
        this.soundSystem = new SoundSystem();
        this.spriteManager = new SpriteManager();
        this.fontManager = new FontManager(this.gameVariables);
        this.mapManager = new MapManager(this.gameStatus, this.gameVariables, this.spriteManager, this.soundSystem);
        this.interactableManager = new InteractableManager(this.spriteManager, this.mapManager, this.gameStatus, this.gameVariables, this.gameCanvas);
        this.mouseManager = new MouseManager(this.spriteManager, this.interactableManager, this.gameStatus, this.gameVariables, this.gameCanvas);


    }

    start(number) {
        // ==== Pre load general data here... ==================
        this.fontManager.addFont('starmap', { color: 'white', size: 18 });

        this.mapManager.loadLevel(number);
        requestAnimationFrame((time) => this.gameLoop(time));
    }



    gameLoop(time) {
        requestAnimationFrame((time) => this.gameLoop(time));

        // ==== Time tick ===================================
        const delay = this.settings.gameTick / this.settings.fps;
        const tick = time - this.gameStatus.lastTick;
        if (tick < delay) { return; }
        this.gameStatus.lastTick = time;

        // ==== Clear buffer ================================
        this.fixDpi();
        this.gameCanvas.getContext('2d').clearRect(0, 0, this.gameWidth, this.gameHeight);

        // ==== Logic operations ============================
        this.interactableManager.processInteractables();

        // ==== Animation Operation: including user inputs and interactions =====
        switch (this.gameStatus.levelStatus) {
            case 0: this.animateLoader(); break;
            case 1: this.animateMap(); break;
        }

        // ==== Drawing operation here... ===================
        switch (this.gameStatus.levelStatus) {
            case 0: this.drawLoader(); break;
            case 1: this.drawMap(); break;
        }

        // ==== End here ====================================
    }

    fixDpi() {
        // ==== fix dpi to avoid blur ==================
        const dpi = window.devicePixelRatio;
        const styleWidth = +getComputedStyle(this.gameCanvas).getPropertyValue("width").slice(0, -2);
        const styleHeight = +getComputedStyle(this.gameCanvas).getPropertyValue("height").slice(0, -2);
        this.gameCanvas.setAttribute('width', styleWidth * dpi);
        this.gameCanvas.setAttribute('height', styleHeight * dpi);
        // ==============================================

        this.gameWidth = this.gameCanvas.parentElement.clientWidth;
        this.gameHeight = this.gameCanvas.parentElement.clientHeight;

        // ==== scale all the canvas to the dpi value ===
        this.gameCanvas.getContext('2d').scale(dpi, dpi);
    }

    drawLoader() {
        this.gameCanvas.getContext('2d').fillStyle = "#000000";
        this.gameCanvas.getContext('2d').fillRect(0, 0, this.gameWidth, this.gameHeight);
        const loading = this.spriteManager.getSprite('Loading');
        if(loading !== undefined) {
            this.gameCanvas.getContext('2d').drawImage(
                loading.graphics,
                loading.subSprite.sx, loading.subSprite.sy, loading.subSprite.width, loading.subSprite.height,
                this.gameWidth / 2 - 200, this.gameHeight / 2 - 150, loading.subSprite.width, loading.subSprite.height
            )
        }
    }

    drawMap() {
        // Basic buffer
        const ctx = this.gameCanvas.getContext('2d');
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // Backgrounds
        const bgR = this.spriteManager.getSprite('BG_R');
        const bgM = this.spriteManager.getSprite('BG_M');
        ctx.drawImage(bgR.graphics, bgR.getCoords().x, bgR.getCoords().y + this.mapManager.map.bg_R_offset, bgR.width, bgR.height);
        ctx.drawImage(bgM.graphics, bgM.getCoords().x, bgM.getCoords().y + this.mapManager.map.bg_M_offset, bgM.width, bgM.height);

        // Characters
        for(let i = 0; i < this.gameVariables.characters.length; i++) {
            const name = this.gameVariables.characters[i].name;
            const char = this.spriteManager.getSprite(name);
            if(this.gameVariables.interactableAuraOn !== null && this.gameVariables.interactableAuraOn === name) {

            }
            ctx.drawImage(
                char.graphics,
                char.subSprite.sx, char.subSprite.sy, char.subSprite.width, char.subSprite.height,
                char.subSprite.dx, char.subSprite.dy, char.subSprite.width, char.subSprite.height
            );
        }

        // Objects
        for(let i = 0; i < this.gameVariables.objects.length; i++) {
            const name = this.gameVariables.objects[i].name;
            const obj = this.spriteManager.getSprite(name);
            const objON = this.spriteManager.getSprite(`${name}ON`);

            if(this.gameVariables.interactableAuraOn !== null && this.gameVariables.interactableAuraOn === name) { /* TODO: try a way to show aura only on object */ }

            const trigger = this.gameVariables.triggers[name];
            if(trigger !== undefined) {
                if(trigger === 0 || objON === undefined) {
                    ctx.drawImage(obj.graphics, obj.getCoords().x, obj.getCoords().y, obj.width, obj.height);
                } else {
                    ctx.drawImage(objON.graphics, obj.getCoords().x, obj.getCoords().y, objON.width, objON.height);
                }
            } else {
                ctx.drawImage(obj.graphics, obj.getCoords().x, obj.getCoords().y, obj.width, obj.height);
            }
        }

        // Player
        if (this.gameVariables.player.noplayer === false) {
            const player = this.spriteManager.getSprite('main');
            ctx.drawImage(
                player.graphics,
                player.subSprite.sx, player.subSprite.sy, player.subSprite.width, player.subSprite.height,
                player.subSprite.dx, player.subSprite.dy, player.subSprite.width, player.subSprite.height
            );
        }

        // Foreground
        const bgF = this.spriteManager.getSprite('BG_F');
        ctx.drawImage(bgF.graphics, bgF.getCoords().x, bgF.getCoords().y + this.mapManager.map.bg_F_offset, bgF.width, bgF.height);

        // Ui - Dialog Box
        if(this.gameVariables.currentDialog !== null) {
            // Draw current message
            const dialogSprite = this.spriteManager.getSprite('DialogBox');
            ctx.drawImage(dialogSprite.graphics, 254, 150);

            const name = this.gameVariables.currentDialog.name;
            const text = this.gameVariables.currentDialog.text;
            const portrait = this.gameVariables.currentDialog.portrait;

            if(portrait !== undefined && portrait !== null) {
                const faceSprite = this.spriteManager.getSprite(`${portrait}Face`);
                ctx.drawImage(faceSprite.graphics, 310, 220, 64, 64);
            }

            this.fontManager. drawText(this.gameCanvas, 200, name, 310, 180, 'starmap', 'white');
            this.fontManager. drawText(this.gameCanvas, 310, text, 390, 230, 'starmap', 'white');
        }

        // Ui - Show question dialog
        if(
            this.gameVariables.currentInteractable !== null &&
            this.gameVariables.currentInteractable.type === 'question'
        ) {
            // Ok is time to show the question dialog?
            const questionData = this.gameVariables.questions[this.gameVariables.currentInteractable.linked];
            if (questionData && questionData.isRespondingToQuestion) {
                const questionBG = this.spriteManager.getSprite('Question');
                ctx.drawImage(questionBG.graphics, this.gameWidth / 2 - questionBG.width / 2, this.gameHeight / 2 - questionBG.height / 2);

                const questionName = this.gameVariables.currentInteractable.question.name;
                this.fontManager.drawText(
                    this.gameCanvas, 380, questionName,
                    this.gameWidth / 2 - questionBG.width / 2 + 60, this.gameHeight / 2 - questionBG.height / 2 + 30,
                    'starmap', 'white'
                );

                const questionText = this.gameVariables.currentInteractable.question.text;
                const textHeight = this.fontManager.drawText(
                    this.gameCanvas, 380, questionText,
                    this.gameWidth / 2 - questionBG.width / 2 + 60, this.gameHeight / 2 - questionBG.height / 2 + 80,
                    'starmap', 'white'
                );

                const answers = this.gameVariables.currentInteractable.question.answers;
                let answerOffset = 0;

                for(let i = 0; i < answers.length; i++) {
                    const text = answers[i].text;

                    this.fontManager.drawText(
                        this.gameCanvas, 380, `${i+1})`,
                        this.gameWidth / 2 - questionBG.width / 2 + 60,
                        this.gameHeight / 2 - questionBG.height / 2 + 90 + textHeight + i * 10 + answerOffset,
                        'starmap', '#23c6e7'
                    )

                    const heightOfBbox = this.fontManager.drawText(
                        this.gameCanvas, 380, text,
                        this.gameWidth / 2 - questionBG.width / 2 + 80,
                        this.gameHeight / 2 - questionBG.height / 2 + 90 + textHeight + i * 10 + answerOffset,
                        'starmap', 'white'
                    );

                    if(questionData.boundingBoxes.length < answers.length) {
                        questionData.boundingBoxes.push({
                            x: this.gameWidth / 2 - questionBG.width / 2 + 60 - 3,
                            y: this.gameHeight / 2 - questionBG.height / 2 + 75 + textHeight + i * 10 + answerOffset - 3,
                            width: 386,
                            height: heightOfBbox + 3
                        });
                    }

                    answerOffset += heightOfBbox;
                }

                if(questionData.answeredQuestionNumber > -1) {
                    const boundingBox = questionData.boundingBoxes[questionData.answeredQuestionNumber];
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    ctx.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
                }
            }
        }

        if(this.gameVariables.player.noplayer === false) {
            // Ui - Semi opacque background
            if (this.gameStatus.showInventory) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            }

            // Ui - Inventory
            const inventoryIcon = this.spriteManager.getSprite('InventoryIcon');
            const inventorySlot = this.spriteManager.getSprite('InventorySlot');
            ctx.drawImage(inventoryIcon.graphics, this.gameWidth - inventoryIcon.width - 20, 20);

            if (this.gameStatus.showInventory) {
                const overallSpaceX = inventorySlot.width * 4 + 60;
                const overallSpaceY = inventorySlot.height * 4 + 60;

                for(let i = 0; i < 4; i++) {
                    for(let j = 0; j < 4; j++) {
                        let obj = this.gameVariables.inventory[i * 4 + j];

                        const slotX = this.gameWidth / 2 - overallSpaceX / 2 + j * inventorySlot.width + j * 20;
                        const slotY = this.gameHeight / 2 - overallSpaceY / 2 + i * inventorySlot.height + i * 20;

                        ctx.drawImage(inventorySlot.graphics, slotX, slotY);

                        if(obj !== undefined) {
                            obj = this.spriteManager.getSprite(obj.name);
                            const objX = slotX + inventorySlot.width / 2 - obj.width / 2;
                            const objY = slotY + inventorySlot.height / 2 - obj.height / 2;

                            ctx.drawImage(obj.graphics, objX, objY);
                        }
                    }
                }

                if(this.gameVariables.inventoryTooltip !== null) {
                    const tooltip = this.spriteManager.getSprite('Tooltip');
                    console.log(this.gameVariables.inventoryTooltip.index);
                    const tooltipOffsetY = this.gameVariables.inventoryTooltip.index < 3 ? this.gameVariables.inventoryTooltip.index * inventorySlot.height + this.gameVariables.inventoryTooltip.index * 10 : 0;
                    ctx.drawImage(tooltip.graphics, this.gameWidth / 2 - tooltip.width / 2, this.gameHeight / 2 - tooltip.height / 2 + tooltipOffsetY - 30);
                    const tooltipTextX = this.gameWidth / 2 - tooltip.width / 2 + 50;
                    const tooltipTextY = this.gameHeight / 2 - tooltip.height / 2;
                    this.fontManager.drawText(this.gameCanvas, 218, this.gameVariables.inventoryTooltip.tooltip, tooltipTextX, tooltipTextY + tooltipOffsetY, 'starmap', 'white');
                }
            }
        }

        this.mouseManager.setMouseCursor();
    }

    animateLoader() {
        const loading = this.spriteManager.getSprite('Loading');
        if(loading) {
            console.log('animate loading...');
            loading.animate();
        }
    }

    animateMap() {
        // Characters animations
        for(let i = 0; i < this.gameVariables.characters.length; i++) {
            const name = this.gameVariables.characters[i].name;
            const char = this.spriteManager.getSprite(name);
            char.animate();
        }

        // Player animations
        const player = this.spriteManager.getSprite('main');
        const bgR = this.spriteManager.getSprite('BG_R');
        const bgM = this.spriteManager.getSprite('BG_M');
        const bgF = this.spriteManager.getSprite('BG_F');

        const direction = this.gameVariables.player.direction;
        const animation = this.gameVariables.player.animation;
        switch (animation) {
            case 'idle': !direction ? player.playLeftIdle() : player.playRightIdle(); break;
            case 'walking': !direction ? player.playLeftWalking() : player.playRightWalking(); break;
            case 'talking': !direction ? player.playleftTalking() : player.playRightTalking(); break;
        }
        if(animation === 'walking') {
            // process movement
            const x = player.getCoords().x;
            if(
                (direction === false && x > this.gameVariables.player.reachX) ||
                (direction === true  && x < (this.gameVariables.player.reachX - player.subSprite.width))
            ) {
                const newX = x + (direction ? 20 : -20);
                player.setCoords(newX, player.getCoords().y);

                // ==== Move background, characters, interaction according to player
                // === Backgrounds
                bgR.setCoords(-newX * 0.3, bgR.getCoords().y);
                bgM.setCoords(-newX * 0.5, bgM.getCoords().y);
                bgF.setCoords(-newX * 0.7, bgF.getCoords().y);
                // === Characters
                for(let i = 0; i < this.gameVariables.characters.length; i++) {
                    const name = this.gameVariables.characters[i].name;
                    const char = this.spriteManager.getSprite(name);
                    char.setCoords(char.getCoords().x + x * 0.5 -newX * 0.5, char.getCoords().y);
                }
                // === Objects
                for(let i = 0; i < this.gameVariables.objects.length; i++) {
                    const name = this.gameVariables.objects[i].name;
                    const obj = this.spriteManager.getSprite(name);
                    obj.setCoords(obj.getCoords().x + x * 0.5 -newX * 0.5, obj.getCoords().y);
                }
                // === Interactions
                for(let i = 0; i < this.gameVariables.interactables.length; i++) {
                    const interactable = this.gameVariables.interactables[i];
                    interactable.x = interactable.x + x * 0.5 - newX * 0.5;
                }

                this.gameStatus.cursor = 'move';
            } else {
                // reached destination: return idle and enable clicks
                this.gameVariables.player.animation = 'idle';

                this.gameStatus.cursor = 'standard';
                this.gameStatus.blockMouseAction = false;
                this.gameStatus.walkingToInteractable = false;
            }
        }
    }
}
