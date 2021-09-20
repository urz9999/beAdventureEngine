class MapManager {

    map;

    gameStatus;
    gameVariables;
    gameWidth;
    gameHeight;

    spriteManager;
    soundSystem;
    settings;

    constructor(gamewidth, gameHeight, gameStatus, gameVariables, spriteManager, soundSystem, settings) {
        this.map = {};

        this.gameWidth = gamewidth;
        this.gameHeight = gameHeight;
        this.gameStatus = gameStatus;
        this.gameVariables = gameVariables;

        this.spriteManager = spriteManager;
        this.soundSystem = soundSystem;

        this.settings = settings;
    }

    async loadMap(name) {
        // Load data
        const response = await fetch(`assets/maps/${name}.json`)
        this.map = await response.json();
        return this.map;
    }

    async loadLevel(number, spawnLocation) {
        // 0 loading // 1 playing // 2 menu // 3 intermission // etc...
        this.gameStatus.levelStatus = 0;

        const map = await this.loadMap(`map${number}`);

        this.gameVariables.mapName = map.name;
        this.gameVariables.currentMap = number;
        this.gameVariables.currentMusic = map.startingMusic;

        // Load loader
        this.spriteManager.readAnimatedCharacter('Loading', `assets/images/ui/menu/loading.png`, 400, 50);

        // Load background
        this.spriteManager.readSprite('BG_R', `assets/images/maps/map${number}/map${number}_R.png`);
        this.spriteManager.readSprite('BG_M', `assets/images/maps/map${number}/map${number}_M.png`);
        this.spriteManager.readSprite('BG_F', `assets/images/maps/map${number}/map${number}_F.png`);

        // Load UI
        this.spriteManager.readSprite('PlayIcon', `assets/images/ui/menu/play.png`);
        this.spriteManager.readSprite('PauseIcon', `assets/images/ui/menu/pause.png`);
        this.spriteManager.readSprite('InventoryIcon', `assets/images/ui/menu/inventory.png`);
        this.spriteManager.readSprite('InventorySlot', `assets/images/ui/menu/inventorySlot.png`);
        this.spriteManager.readSprite('PartnerChange', `assets/images/ui/menu/partnerChange.png`);
        this.spriteManager.readSprite('DialogBox', `assets/images/ui/menu/dialog.png`);
        this.spriteManager.readSprite('Tooltip', `assets/images/ui/menu/tooltip.png`);
        this.spriteManager.readSprite('Question', `assets/images/ui/menu/question.png`);
        this.spriteManager.readSprite('Location', `assets/images/ui/menu/location.png`);
        this.spriteManager.readSprite('Points', `assets/images/ui/menu/point.png`);

        // Load main character
        this.spriteManager.readMainCharacter();
        // Load partners
        if(this.settings.partners.length > 0) {
            for(let i = 0; i < this.settings.partners.length; i++) {
                const partner = this.settings.partners[i];
                this.spriteManager.readPartnerCharacter(partner.id, partner.name, partner.walkingFrames, partner.idleFrames, partner.talkingFrames, partner.width, partner.height);
            }
        }

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

        // Load prize for questions
        const questions = map.interactables.filter(int => int.type === 'question');
        for(let i = 0; i < questions.length; i++) {
            const objects = questions[i].question.result.filter(r => r.object !== undefined);
            for(let j = 0; j < objects.length; j++) {
                this.spriteManager.readSprite(objects[j].object.name, `assets/images/ui/objects/${objects[j].object.name}.png`);
            }
        }

        // Load prize for combines
        const combines = map.interactables.filter(int => int.type === 'combine');
        for(let i = 0; i < combines.length; i++) {
            const objects = combines[i].result.filter(r => r.object !== undefined);
            for(let j = 0; j < objects.length; j++) {
                this.spriteManager.readSprite(objects[j].object.name, `assets/images/ui/objects/${objects[j].object.name}.png`);
            }
        }

        // Load prize for partners
        const partners = map.interactables.filter(int => int.type === 'partner');
        for(let i = 0; i < partners.length; i++) {
            const objects = partners[i].result.filter(r => r.object !== undefined);
            for(let j = 0; j < objects.length; j++) {
                this.spriteManager.readSprite(objects[j].object.name, `assets/images/ui/objects/${objects[j].object.name}.png`);
            }
        }

        // Set game variables to map data
        this.gameVariables.objects = this.filterObjectsFromInventory(map.objects);
        this.gameVariables.characters = map.characters;
        this.gameVariables.interactables = this.filterInteractablesFromInventory(map.interactables);
        this.gameVariables.staticTexts = map.staticTexts;
        this.gameVariables.player = { direction: true, animation: 'idle', noplayer:  map.noplayer || false, initialOffsetX: 0, cam: 0 }

        // Load initial effect
        if(this.map.effect !== undefined) {
            this.gameVariables.mapsEffects[number] = this.map.effect;
        }

        // Load all textures
        const waiter = setInterval(() => {
            if(this.spriteManager.allSpriteLoaded()) {
                // Check if we need to set the camera as moving
                this.gameVariables.isMapBiggerThanCanvas = this.spriteManager.getSprite('BG_M').width > this.gameWidth;

                // Set main position
                const startingLocation = spawnLocation || map.startingPoint;

                // Fix for over game width positions
                let initialOffsetX = 0;
                if (startingLocation[0] > this.gameWidth) {
                    while (startingLocation[0] > this.gameWidth) {
                        startingLocation[0] -= this.gameWidth;
                        initialOffsetX -= this.gameWidth;
                    }
                }
                this.gameVariables.player.initialOffsetX = initialOffsetX;

                this.spriteManager.getSprite('main').setCoords(startingLocation[0], startingLocation[1]);

                for(let i = 0; i < this.settings.partners.length; i++) {
                    const partner = this.spriteManager.getSprite(this.settings.partners[i].name);
                    partner.setCoords(startingLocation[0] + this.settings.partners[i].offsetX, startingLocation[1] + this.settings.partners[i].offsetY);
                }

                // Set character position
                for(let i = 0; i < this.gameVariables.characters.length; i++) {
                    const char = this.gameVariables.characters[i];
                    this.spriteManager.getSprite(char.name).setCoords(char.x + initialOffsetX, char.y);
                }

                // Set objects position
                for(let i = 0; i < this.gameVariables.objects.length; i++) {
                    const obj = this.gameVariables.objects[i];
                    this.spriteManager.getSprite(obj.name).setCoords(obj.x + initialOffsetX, obj.y);
                }

                // Set interactable position
                for(let i = 0; i < this.gameVariables.interactables.length; i++) {
                    const interactable = this.gameVariables.interactables[i];
                    interactable.x = interactable.x + initialOffsetX;
                }

                // Set background  position
                const bgR = this.spriteManager.getSprite('BG_R');
                bgR.x = bgR.x + initialOffsetX;
                const bgM = this.spriteManager.getSprite('BG_M');
                bgM.x = bgM.x + initialOffsetX;
                const bgF = this.spriteManager.getSprite('BG_F');
                bgF.x = bgF.x + initialOffsetX;

                // ==== Set status to map and start level
                this.gameStatus.levelStatus = 1;
                this.startLevel();
                clearInterval(waiter);
            }
        }, 2000);
    }

    startLevel() {
        this.gameVariables.showMapName = true;
        this.soundSystem.playBackgroundMusic(this.gameVariables.currentMusic);
        const mapWaiter = setTimeout(() => {
            this.gameVariables.showMapName = false;
            clearTimeout(mapWaiter);
        }, 3000);
    }

    filterObjectsFromInventory(objects) {
        return objects.filter(obj => {
            for(let i = 0; i < this.gameVariables.inventory.length; i++) {
                const inv = this.gameVariables.inventory[i];
                if(inv.name === obj.name) {
                    return false;
                }
            }
            return true;
        });
    }

    filterInteractablesFromInventory(interactables) {
        return interactables.filter(int => {
            for(let i = 0; i < this.gameVariables.inventory.length; i++) {
                const inv = this.gameVariables.inventory[i];
                if(inv.name === int.linked) {
                    return false;
                }
            }
            return true;
        });
    }
}
