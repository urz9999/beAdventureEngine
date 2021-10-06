class beAdventurousEngine {

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
    mathHelper;
    effectManager;

    gameStatus;
    gameVariables;

    constructor(canvasId) {

        this.gameCanvas = document.getElementById(canvasId);
        this.gameCanvas.addEventListener('mousedown', (event) => this.mouseManager.processMouse(event), false);
        this.gameCanvas.addEventListener('mousemove', (event) => this.mouseManager.processMouse(event), false);

        // For fullscreen
        document.addEventListener('keypress', (event) => {
            if (event.code.toString() === 'KeyF') {
                this.settings.fullscreen = !this.settings.fullscreen;
            }
        });

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
            correctingView: false,

            blockMouseAction: false,
            processInteractable: false,
            walkingToInteractable: false,
            wingame: false,
            inCredits: false,

            cursor: 'standard',
            scale: 1,
            originalWidth: 0,
            originalHeight: 0,

            partnerIndex: 0,

            alternate: false,
        };

        this.gameVariables = {
            player: { direction: 1, animation: 'idle', reachX: 0, noplayer: false, initialOffsetX: 0, cam: 0 },
            objects: [],
            characters: [],
            inventory: [],
            interactables: [],
            triggers: {},
            questions: {},
            staticTexts: {},
            minigames: {},
            interactableAuraOn: null,
            canAlternate: false,
            currentMap: 0,
            currentMusic: '',
            alternateMusic: '',
            isMapBiggerThanCanvas: false,
            currentInteractable: null,
            currentDialog: null,
            inventoryTooltip: null,
            selectedMinigame: null,
            mapsEffects: {}
        };

        // Settings first
        this.settings = new Settings();

        // math helper
        this.mathHelper = new MathHelper();

        // ==== Start fixing Dpi from here and then in game-loop
        this.gameStatus.originalWidth = +getComputedStyle(this.gameCanvas).getPropertyValue("width").slice(0, -2);
        this.gameStatus.originalHeight = +getComputedStyle(this.gameCanvas).getPropertyValue("height").slice(0, -2);
        this.fixDpi();

        // ==== Respect this order to avoid circular dependencies ======
        this.soundSystem = new SoundSystem();
        this.spriteManager = new SpriteManager();
        this.fontManager = new FontManager(this.gameVariables, this.settings);
        this.mapManager = new MapManager(this.gameWidth, this.gameHeight, this.gameStatus, this.gameVariables, this.spriteManager, this.soundSystem, this.settings);
        this.interactableManager = new InteractableManager(this.soundSystem, this.spriteManager, this.mapManager, this.gameStatus, this.gameVariables, this.gameCanvas, this.settings);
        this.mouseManager = new MouseManager(this.spriteManager, this.interactableManager, this.gameStatus, this.gameVariables, this.gameCanvas, this.gameWidth, this.gameHeight, this.settings);
        this.effectManager = new EffectManager(this.gameCanvas, this.gameStatus, this.gameVariables, this.mathHelper, this.settings);
    }

    start(number) {
        // ==== Pre load general data here... ============================
        this.fontManager.addFont('starmap', { color: 'white', size: 18 });

        // ==== Load first map
        this.mapManager.loadLevel(number);
        // ==== Start animation loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    registerMiniGame(name, miniGame) {
        this.gameVariables.minigames[name] = new miniGame(
            this.gameCanvas, this.gameWidth, this.gameHeight, this.settings, this.soundSystem,
            this.spriteManager, this.fontManager, this.mapManager, this.mouseManager, this.interactableManager,
            this.gameStatus, this.gameVariables
        );
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
        if(!this.gameStatus.gamePaused) {
            this.interactableManager.processInteractables();
            // Process Win game
            this.interactableManager.processWinGame(this.settings.creditMap);
        }

        // ==== Animation Operation: including user inputs and interactions =====
        if(!this.gameStatus.gamePaused) {
            switch (this.gameStatus.levelStatus) {
                case 0: this.animateLoader(); break;
                case 1: this.animateMap(); break;
                case 2: this.gameVariables.selectedMinigame.animate(time);
            }
        }

        // ==== Drawing operation here... ===================
        switch (this.gameStatus.levelStatus) {
            case 0: this.drawLoader(); break;
            case 1: this.drawMap(tick); break;
            case 2: this.gameVariables.selectedMinigame.draw(time);
        }
    }

    fixDpi() {
        let styleWidth, styleHeight;

        // ==== fix dpi to avoid blur ==================
        const dpi = window.devicePixelRatio;
        // ==============================================

        // Set fullscreen if needed
        if(this.settings.fullscreen) {
            this.gameCanvas.parentElement.style.width = `${document.documentElement.clientWidth}px`;
            this.gameCanvas.parentElement.style.height = `${document.documentElement.clientHeight}px`;

            styleWidth = +getComputedStyle(this.gameCanvas).getPropertyValue("width").slice(0, -2);
            styleHeight = +getComputedStyle(this.gameCanvas).getPropertyValue("height").slice(0, -2);

            this.gameStatus.scale = styleWidth / this.gameStatus.originalWidth;
        } else {
            this.gameCanvas.parentElement.style.width = this.gameStatus.originalWidth + 'px';
            this.gameCanvas.parentElement.style.height = this.gameStatus.originalHeight + 'px';

            styleWidth = +getComputedStyle(this.gameCanvas).getPropertyValue("width").slice(0, -2);
            styleHeight = +getComputedStyle(this.gameCanvas).getPropertyValue("height").slice(0, -2);

            this.gameStatus.scale = 1;
        }

        this.gameCanvas.setAttribute('width', styleWidth * dpi);
        this.gameCanvas.setAttribute('height', styleHeight * dpi);

        this.gameWidth = this.gameCanvas.parentElement.clientWidth / this.gameStatus.scale;
        this.gameHeight = this.gameCanvas.parentElement.clientHeight / this.gameStatus.scale;

        // ==== scale all the canvas to the dpi value ===
        this.gameCanvas.getContext('2d').setTransform(dpi * this.gameStatus.scale,0,0,dpi * this.gameStatus.scale,0,0);
    }

    drawLoader() {
        this.gameCanvas.getContext('2d').fillStyle = "#000000";
        this.gameCanvas.getContext('2d').fillRect(0, 0, this.gameWidth, this.gameHeight);
        const loading = this.spriteManager.getSprite('Loading');
        if(loading !== undefined && loading !== null) {
            this.gameCanvas.getContext('2d').drawImage(
                loading.graphics,
                loading.subSprite.sx, loading.subSprite.sy, loading.subSprite.width, loading.subSprite.height,
                this.gameWidth * 0.5 - 200, this.gameHeight * 0.5 - 150, loading.subSprite.width, loading.subSprite.height
            )
        }
    }

    drawMap(dt) {
        // Basic buffer
        const ctx = this.gameCanvas.getContext('2d');

        // Save the state before translations
        ctx.save();

        // Apply special translation here if needed
        if(!this.gameVariables.player.noplayer && this.gameVariables.isMapBiggerThanCanvas) {
            const currentPlayer = this.gameStatus.partnerIndex === 0 ? this.spriteManager.getSprite('main') : this.spriteManager.getSprite(this.settings.partners[this.gameStatus.partnerIndex - 1].name);
            let cam = currentPlayer.subSprite.dx + currentPlayer.subSprite.width / 2 - this.gameWidth / 2;

            // check deadzones
            if(cam <= 0) cam = 0;
            if(cam >= this.gameWidth) cam = this.gameWidth;

            // Save it for later uses
            this.gameVariables.player.cam = cam;

            // Apply on viewport
            ctx.translate(-cam, 0);
        }

        // Backgrounds
        const bgR = !this.gameStatus.alternate ? this.spriteManager.getSprite('BG_R'): this.spriteManager.getSprite('BG_R_A');
        const bgM = !this.gameStatus.alternate ? this.spriteManager.getSprite('BG_M'): this.spriteManager.getSprite('BG_M_A');
        const bgR_Offset = !this.gameStatus.alternate ? this.mapManager.map.bg_R_offset : this.mapManager.map.bg_R_A_offset;
        const bgM_Offset = !this.gameStatus.alternate ? this.mapManager.map.bg_M_offset : this.mapManager.map.bg_M_A_offset;

        ctx.drawImage(bgR.graphics, bgR.getCoords().x, bgR.getCoords().y + bgR_Offset, bgR.width, bgR.height);
        ctx.drawImage(bgM.graphics, bgM.getCoords().x, bgM.getCoords().y + bgM_Offset, bgM.width, bgM.height);

        // Characters
        for(let i = 0; i < this.gameVariables.characters.length; i++) {
            const name = this.gameVariables.characters[i].name;
            const char = this.spriteManager.getSprite(name);

            if(
                (this.gameVariables.characters[i].alternate === true && this.gameStatus.alternate === true) ||
                (this.gameVariables.characters[i].alternate === undefined && this.gameStatus.alternate === false)
            ) {
                if(this.gameVariables.interactableAuraOn !== null && this.gameVariables.interactableAuraOn === name) {}

                ctx.drawImage(
                    char.graphics,
                    char.subSprite.sx, char.subSprite.sy, char.subSprite.width, char.subSprite.height,
                    char.subSprite.dx, char.subSprite.dy, char.subSprite.width, char.subSprite.height
                );
            }

        }

        // Objects
        for(let i = 0; i < this.gameVariables.objects.length; i++) {
            const name = this.gameVariables.objects[i].name;
            const obj = this.spriteManager.getSprite(name);
            const objON = this.spriteManager.getSprite(`${name}ON`);

            if(
                (this.gameVariables.objects[i].alternate === true && this.gameStatus.alternate === true) ||
                (this.gameVariables.objects[i].alternate === undefined && this.gameStatus.alternate === false)
            ) {
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
        }

        // Player & partners
        if (this.gameVariables.player.noplayer === false) {
            const player = this.spriteManager.getSprite('main');
            ctx.drawImage(
                player.graphics,
                player.subSprite.sx, player.subSprite.sy, player.subSprite.width, player.subSprite.height,
                player.subSprite.dx, player.subSprite.dy, player.subSprite.width, player.subSprite.height
            );

            // Load partners
            if(this.settings.partners.length > 0) {
                for(let i = 0; i < this.settings.partners.length; i++) {
                    const partner = this.settings.partners[i];
                    const partnerSprite = this.spriteManager.getSprite(partner.name);
                    ctx.drawImage(
                        partnerSprite.graphics,
                        partnerSprite.subSprite.sx, partnerSprite.subSprite.sy, partnerSprite.subSprite.width, partnerSprite.subSprite.height,
                        partnerSprite.subSprite.dx, partnerSprite.subSprite.dy, partnerSprite.subSprite.width, partnerSprite.subSprite.height
                    );
                }
            }
        }

        // If debug is active show interactable bounding boxes
        if(this.settings.debug) {
            // === Interactions
            for (let i = 0; i < this.gameVariables.interactables.length; i++) {
                ctx.beginPath();
                ctx.rect(
                    this.gameVariables.interactables[i].x,
                    this.gameVariables.interactables[i].y,
                    this.gameVariables.interactables[i].width,
                    this.gameVariables.interactables[i].height
                );
                ctx.stroke();
            }
        }

        // Foreground
        const bgF = !this.gameStatus.alternate ? this.spriteManager.getSprite('BG_F') : this.spriteManager.getSprite('BG_F_A');
        const bgF_Offset = !this.gameStatus.alternate ? this.mapManager.map.bg_F_offset : this.mapManager.map.bg_F_A_offset;
        ctx.drawImage(bgF.graphics, bgF.getCoords().x, bgF.getCoords().y + bgF_Offset, bgF.width, bgF.height);

        // World Transition Effect if present
        if(this.settings.worldTransition && !this.settings.worldTransitionDone) {     
            const transition = this.spriteManager.getSprite('transition');
            ctx.globalCompositeOperation = "multiply";
            ctx.scale(this.gameCanvas.width/transition.subSprite.width, this.gameCanvas.width/transition.subSprite.width);
            ctx.drawImage(
                transition.graphics,
                transition.subSprite.sx, transition.subSprite.sy, transition.subSprite.width, transition.subSprite.height,
                transition.subSprite.dx, transition.subSprite.dy, transition.subSprite.width, transition.subSprite.height
            );
        }

        // Before painting UI restore the context
        ctx.restore();

        // Effects
        this.effectManager.drawEffect(dt);

        // Ui - Dialog Box
        if(this.gameVariables.currentDialog !== null) {
            // Draw current message
            const dialogSprite = this.spriteManager.getSprite('DialogBox');
            ctx.drawImage(dialogSprite.graphics, 254, 150);

            const name = this.gameVariables.currentDialog.name;
            const text = this.gameVariables.currentDialog.text;
            const portrait = this.gameVariables.currentDialog.portrait;

            this.fontManager.drawText(this.gameCanvas, 200, name, 310, 180, 'starmap', 'white', true);

            if(portrait !== undefined && portrait !== null) {
                const faceSprite = this.spriteManager.getSprite(`${portrait}Face`);
                ctx.drawImage(faceSprite.graphics, 310, 220, 64, 64);

                this.fontManager. drawText(this.gameCanvas, 310, text, 390, 230, 'starmap', 'white', true);
            } else {
                this.fontManager. drawText(this.gameCanvas, 390, text, 310, 230, 'starmap', 'white', true);
            }
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
                    'starmap', 'white', true
                );

                const questionText = this.gameVariables.currentInteractable.question.text;
                const textHeight = this.fontManager.drawText(
                    this.gameCanvas, 380, questionText,
                    this.gameWidth / 2 - questionBG.width / 2 + 60, this.gameHeight / 2 - questionBG.height / 2 + 80,
                    'starmap', 'white', true
                );

                const answers = this.gameVariables.currentInteractable.question.answers;
                let answerOffset = 0;

                for(let i = 0; i < answers.length; i++) {
                    const text = answers[i].text;

                    this.fontManager.drawText(
                        this.gameCanvas, 380, `${i+1})`,
                        this.gameWidth / 2 - questionBG.width / 2 + 60,
                        this.gameHeight / 2 - questionBG.height / 2 + 90 + textHeight + i * 10 + answerOffset,
                        'starmap', '#23c6e7', true
                    )

                    const heightOfBbox = this.fontManager.drawText(
                        this.gameCanvas, 380, text,
                        this.gameWidth / 2 - questionBG.width / 2 + 80,
                        this.gameHeight / 2 - questionBG.height / 2 + 90 + textHeight + i * 10 + answerOffset,
                        'starmap', 'white', true
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
            // Ui - Semi opaque background
            if (this.gameStatus.showInventory) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            }

            // Ui - Inventory
            const inventoryIcon = this.spriteManager.getSprite('InventoryIcon');
            const inventorySlot = this.spriteManager.getSprite('InventorySlot');

            ctx.drawImage(inventoryIcon.graphics, this.gameWidth - inventoryIcon.width - 20, 20);
            inventoryIcon.x = this.gameWidth - inventoryIcon.width - 20;

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
                            const objSprite = this.spriteManager.getSprite(obj.name);
                            const objX = slotX + inventorySlot.width / 2 - objSprite.width / 2;
                            const objY = slotY + inventorySlot.height / 2 - objSprite.height / 2;

                            ctx.drawImage(objSprite.graphics, objX, objY);

                            if (obj.usable) {
                                const usable = this.spriteManager.getSprite('Usable');
                                ctx.drawImage(usable.graphics, slotX, slotY);
                            }
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
                    this.fontManager.drawText(this.gameCanvas, 218, this.gameVariables.inventoryTooltip.tooltip, tooltipTextX, tooltipTextY + tooltipOffsetY, 'starmap', 'white', true);
                }
            }

            // Ui - Partner Change
            if(this.settings.partners.length > 0) {
                const swapPartnersIcon = this.spriteManager.getSprite('PartnerChange');

                const faces = [];
                faces.push(this.spriteManager.getSprite('mainFace'));
                for(let i = 0; i < this.settings.partners.length; i++) {
                    faces.push(this.spriteManager.getSprite(this.settings.partners[i].name + 'Face'));
                }

                ctx.drawImage(swapPartnersIcon.graphics, 40, 20, 103, 63);
                ctx.drawImage(faces[this.gameStatus.partnerIndex].graphics, 74, 33, 35, 35);
            }

            // Ui - Point System
            if (this.settings.usePointSystem) {
                const points = this.spriteManager.getSprite('Points');
                ctx.drawImage(points.graphics, this.gameWidth / 2 - points.width / 2 - 130, 20);
                this.fontManager.drawText(this.gameCanvas, 300, this.settings.points.toString(), this.gameWidth / 2 - 80 - points.width / 2, 50, 'starmap', 'white', true);
            }

            // Ui - Pause Button
            const playIcon = this.spriteManager.getSprite('PlayIcon');
            const pauseIcon = this.spriteManager.getSprite('PauseIcon');
            if(this.gameStatus.gamePaused) {
                ctx.drawImage(playIcon.graphics, this.gameWidth - 40 - inventoryIcon.width - playIcon.width, 20);
            } else {
                ctx.drawImage(pauseIcon.graphics, this.gameWidth - 40 - inventoryIcon.width - pauseIcon.width, 20);
            }
            playIcon.x = this.gameWidth - 40 - inventoryIcon.width - playIcon.width;
            pauseIcon.x = this.gameWidth - 40 - inventoryIcon.width - pauseIcon.width;

            // Ui - Location
            if(this.gameVariables.showMapName) {
                const location = this.spriteManager.getSprite('Location');
                const locationText = this.gameVariables.mapName;
                ctx.drawImage(location.graphics, 20, 10);
                this.fontManager.drawText(this.gameCanvas, 380, locationText, 53, 37, 'starmap', 'white', true);
                this.gameVariables.mapNameOpacity = 1;
            } else {
                if(this.gameVariables.mapNameOpacity > 0) {
                    const location = this.spriteManager.getSprite('Location');
                    const locationText = this.gameVariables.mapName;

                    this.gameVariables.mapNameOpacity = this.mathHelper.lerp(this.gameVariables.mapNameOpacity, 0, 0.3);

                    ctx.globalAlpha = this.gameVariables.mapNameOpacity;
                    ctx.drawImage(location.graphics, 20, 10);
                    this.fontManager.drawText(this.gameCanvas, 380, locationText, 53, 37, 'starmap', 'white', true);
                    ctx.globalAlpha = 1;
                }
            }
        }

        // Ui - static texts
        for(let i = 0; i < this.gameVariables.staticTexts.length; i++) {
            const text = this.gameVariables.staticTexts[i];
            this.fontManager.drawText(this.gameCanvas, text.width, text.text, text.x, text.y, text.font, text.color);
        }

        this.mouseManager.setMouseCursor();
    }

    animateLoader() {
        const loading = this.spriteManager.getSprite('Loading');
        if(loading) {
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

        // Transition Animation
        if(this.settings.worldTransition && !this.settings.worldTransitionDone) {
            const transition = this.spriteManager.getSprite('transition');
            for(let i = 0; i < (this.settings.worldTransitionSpeed || 1); i++) {
                transition.animate();
                if(transition.isEnded()) {
                    this.settings.worldTransitionDone = true;
                    transition.currentFrame = 0;
                }
            }
        }

        // Player & partners animations
        const speed = 10;

        const player = this.spriteManager.getSprite('main');
        const direction = this.gameVariables.player.direction;
        const animation = this.gameVariables.player.animation;

        switch (animation) {
            case 'idle': {
                if(!direction) {
                    player.playLeftIdle();
                    for(let i = 0; i < this.settings.partners.length; i++) {
                        const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                        this.gameStatus.partnerIndex === 0 && player.getCoords().x > partner.getCoords().x ? partner.playRightIdle() : partner.playLeftIdle();
                    }
                } else {
                    player.playRightIdle();
                    for(let i = 0; i < this.settings.partners.length; i++) {
                        const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                        this.gameStatus.partnerIndex === 0 && player.getCoords().x < partner.getCoords().x ? partner.playLeftIdle() : partner.playRightIdle();
                    }
                }
                break;
            }
            case 'walking': {
                if(!direction) {
                    player.playLeftWalking();
                    for(let i = 0; i < this.settings.partners.length; i++) {
                        const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                        this.gameStatus.partnerIndex === 0 && player.getCoords().x > partner.getCoords().x ? partner.playRightWalking() : partner.playLeftWalking();
                    }
                } else {
                    player.playRightWalking();
                    for(let i = 0; i < this.settings.partners.length; i++) {
                        const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                        this.gameStatus.partnerIndex === 0 && player.getCoords().x < partner.getCoords().x ? partner.playLeftWalking() : partner.playRightWalking();
                    }
                }
                break;
            }
            case 'talking': {
                if(!direction) {
                    player.playleftTalking();
                    for(let i = 0; i < this.settings.partners.length; i++) { const partner = this.spriteManager.getSprite(this.settings.partners[i].name); partner.playleftTalking(); }
                } else {
                    player.playRightTalking();
                    for(let i = 0; i < this.settings.partners.length; i++) { const partner = this.spriteManager.getSprite(this.settings.partners[i].name); partner.playRightWalking(); }
                }
                break;
            }
        }

        if(animation === 'walking' || this.gameStatus.correctingView) {
            // process movement
            const x = this.gameStatus.partnerIndex === 0 ? player.getCoords().x : this.spriteManager.getSprite(this.settings.partners[this.gameStatus.partnerIndex - 1].name).getCoords().x;

            if( (direction === false && x >= this.gameVariables.player.reachX) || (direction === true  && x < (this.gameVariables.player.reachX)) ) {
                // Move player
                let shift = (direction ? speed : -speed);
                let partnerShift = (direction ? 1 : -1);

                this.gameVariables.player.reachX = this.gameVariables.player.reachX - shift;

                if(this.gameStatus.partnerIndex === 0) {
                    // If different from 0 the main character stay in place
                    player.setCoords(this.mathHelper.lerp(player.getCoords().x + shift, this.gameVariables.player.reachX, 0.1), player.getCoords().y);
                }

                // Move Partners
                for(let i = 0; i < this.settings.partners.length; i++) {
                    const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                    const partnerData = this.settings.partners.find(partner => partner.name === this.settings.partners[i].name);
                    const partnerOffset = this.gameStatus.partnerIndex !== (i+1) ? partnerData.offsetX * partnerShift : 0;

                    partner.setCoords(this.mathHelper.lerp(partner.getCoords().x + shift, this.gameVariables.player.reachX + partnerOffset, 0.1), partner.getCoords().y);
                }

                // Set cursor as move
                this.gameStatus.cursor = 'move';
            } else {

                // reached destination: return idle
                this.gameVariables.player.animation = 'idle';
                this.gameStatus.cursor = 'standard';

                // ... and enable clicks
                this.gameStatus.blockMouseAction = false;
                this.gameStatus.walkingToInteractable = false;
                this.gameStatus.correctingView = false;
            }
        }
    }

}