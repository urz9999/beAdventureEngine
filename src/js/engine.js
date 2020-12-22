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

            blockMouseAction: false,
            processInteractable: false,
            walkingToInteractable: false,

            cursor: 'standard'
        };

        this.gameVariables = {
            player: { direction: 1, animation: 'idle', reachX: 0 },
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
        this.mapManager = new MapManager();
        this.interactableManager = new InteractableManager(this.spriteManager, this.gameStatus, this.gameVariables, this.gameCanvas);
        this.mouseManager = new MouseManager(this.spriteManager, this.interactableManager, this.gameStatus, this.gameVariables, this.gameCanvas);
    }

    start(number) {
        // ==== Pre load general data here... ==================
        this.fontManager.addFont('starmap', { color: 'white', size: 18 });

        this.loadLevel(number);

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    startLevel() {
        this.soundSystem.playBackgroundMusic(this.gameVariables.currentMusic);
    }

    async loadLevel(number) {
        // 0 loading // 1 playing // 2 menu // 3 intermission // etc...
        this.gameStatus.levelStatus = 0;

        const map = await this.mapManager.loadMap(`map${number}`);

        this.gameVariables.currentMap = number;
        this.gameVariables.currentMusic = map.startingMusic;

        // Load background
        this.spriteManager.readSprite('BG_R', `assets/images/maps/map${number}/map${number}_R.png`);
        this.spriteManager.readSprite('BG_M', `assets/images/maps/map${number}/map${number}_M.png`);
        this.spriteManager.readSprite('BG_F', `assets/images/maps/map${number}/map${number}_F.png`);

        // Load UI
        this.spriteManager.readSprite('InventoryIcon', `assets/images/ui/menu/inventory.png`);
        this.spriteManager.readSprite('InventorySlot', `assets/images/ui/menu/inventorySlot.png`);
        this.spriteManager.readSprite('DialogBox', `assets/images/ui/menu/dialog.png`);
        this.spriteManager.readSprite('Tooltip', `assets/images/ui/menu/tooltip.png`);
        this.spriteManager.readSprite('Question', `assets/images/ui/menu/question.png`);

        // Load main character
        this.spriteManager.readMainCharacter();

        // Load other characters
        for(let i = 0; i < map.characters.length; i++) {
            const char = map.characters[i];
            this.spriteManager.readAnimatedCharacter(char.name, `assets/images/ui/pgs/${char.name}.png`, char.sWidth, char.frames);
        }

        // Load objects
        for(let i = 0; i < map.objects.length; i++) {
            const obj = map.objects[i];
            this.spriteManager.readSprite(obj.name, `assets/images/ui/objects/${obj.name}.png`);

            // For interactable of type trigger
            if(this.spriteManager.imageExists(`assets/images/ui/objects/${obj.name}ON.png`)) {
                this.spriteManager.readSprite(`${obj.name}ON`, `assets/images/ui/objects/${obj.name}ON.png`);
            }
        }

        // Set game variables to map data
        this.gameVariables.objects = map.objects;
        this.gameVariables.characters = map.characters;
        this.gameVariables.interactables = map.interactables;
        this.gameVariables.player = { direction: true, animation: 'idle' }

        // Load all textures
        const waiter = setInterval(() => {
            if(this.spriteManager.allSpriteLoaded()) {
                // Set main position
                this.spriteManager.getSprite('main').setCoords(map.startingPoint[0], map.startingPoint[1]);

                // Set character position
                for(let i = 0; i < map.characters.length; i++) {
                    const char = map.characters[i];
                    this.spriteManager.getSprite(char.name).setCoords(char.x, char.y);
                }

                // Set objects position
                for(let i = 0; i < map.objects.length; i++) {
                    const obj = map.objects[i];
                    this.spriteManager.getSprite(obj.name).setCoords(obj.x, obj.y);
                }

                this.gameStatus.levelStatus = 1;
                this.startLevel();
                clearInterval(waiter);
            }
        }, 500);
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
            case 0: break;
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
        this.gameCanvas.getContext('2d').fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.fontManager.drawText(this.gameCanvas, 200, 'Loading Map data...', this.gameWidth / 2 - 100, this.gameHeight/ 2 - 100, 'starmap', '#691dc1');
    }

    drawMap() {
        // Basic buffer
        const ctx = this.gameCanvas.getContext('2d');
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // Backgrounds
        const bgR = this.spriteManager.getSprite('BG_R');
        const bgM = this.spriteManager.getSprite('BG_M');
        ctx.drawImage(bgR.graphics, bgR.getCoords().x, bgR.getCoords().y + this.mapManager.map.bg_R_offset, bgR.width * bgR.scale, bgR.height * bgR.scale);
        ctx.drawImage(bgM.graphics, bgM.getCoords().x, bgM.getCoords().y + this.mapManager.map.bg_M_offset, bgM.width * bgM.scale, bgM.height * bgM.scale);

        // Objects
        for(let i = 0; i < this.gameVariables.objects.length; i++) {
            const name = this.gameVariables.objects[i].name;
            const obj = this.spriteManager.getSprite(name);
            const objON = this.spriteManager.getSprite(`${name}ON`);

            if(this.gameVariables.interactableAuraOn !== null && this.gameVariables.interactableAuraOn === name) { /* TODO: try a way to show aura only on object */ }

            const trigger = this.gameVariables.triggers[name];
            if(trigger !== undefined) {
                if(trigger === 0 || objON === undefined) {
                    ctx.drawImage(obj.graphics, obj.getCoords().x, obj.getCoords().y);
                } else {
                    ctx.drawImage(objON.graphics, obj.getCoords().x, obj.getCoords().y);
                }
            } else {
                ctx.drawImage(obj.graphics, obj.getCoords().x, obj.getCoords().y);
            }
        }

        // Characters
        for(let i = 0; i < this.gameVariables.characters.length; i++) {
            const name = this.gameVariables.characters[i].name;
            const char = this.spriteManager.getSprite(name);
            if(this.gameVariables.interactableAuraOn !== null && this.gameVariables.interactableAuraOn === name) {

            }
            ctx.drawImage(
                char.graphics,
                char.subSprite.sx, char.subSprite.sy, char.subSprite.width * char.scale, char.subSprite.height * char.scale,
                char.subSprite.dx, char.subSprite.dy, char.subSprite.width * char.scale, char.subSprite.height * char.scale
            );
        }

        // Player
        const player = this.spriteManager.getSprite('main');
        ctx.drawImage(
            player.graphics,
            player.subSprite.sx, player.subSprite.sy, player.subSprite.width * player.scale, player.subSprite.height * player.scale,
            player.subSprite.dx, player.subSprite.dy, player.subSprite.width * player.scale, player.subSprite.height * player.scale
        );

        // Foreground
        const bgF = this.spriteManager.getSprite('BG_F');
        ctx.drawImage(bgF.graphics, bgF.getCoords().x, bgF.getCoords().y + this.mapManager.map.bg_F_offset, bgF.width * bgF.scale, bgF.height * bgF.scale);

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
        }

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

            for(let j = 0; j < 4; j++) {
                for(let i = 0; i < 4; i++) {
                    let obj = this.gameVariables.inventory[i * 4 + j];

                    const slotX = this.gameWidth / 2 - overallSpaceX / 2 + i * inventorySlot.width + i * 20;
                    const slotY = this.gameHeight / 2 - overallSpaceY / 2 + j * inventorySlot.height + j * 20;

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
                const tooltipTextY = this.gameHeight / 2 - tooltip.height / 2 + 30;
                this.fontManager.drawText(this.gameCanvas, 218, this.gameVariables.inventoryTooltip.tooltip, tooltipTextX, tooltipTextY + tooltipOffsetY - 30, 'starmap', 'white');
            }
        }

        this.mouseManager.setMouseCursor();
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
