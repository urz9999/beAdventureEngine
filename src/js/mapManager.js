class MapManager {

    map;

    gameStatus;
    gameVariables;

    spriteManager;
    soundSystem;

    constructor(gameStatus, gameVariables, spriteManager, soundSystem) {
        this.map = {};
        this.gameStatus = gameStatus;
        this.gameVariables = gameVariables;

        this.spriteManager = spriteManager;
        this.soundSystem = soundSystem;
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

        this.gameVariables.currentMap = number;
        this.gameVariables.currentMusic = map.startingMusic;

        // Load loader
        this.spriteManager.readAnimatedCharacter('Loading', `assets/images/ui/menu/loading.png`, 400, 50);

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

        // Load prize for questions
        const questions = map.interactables.filter(int => int.type === 'question');
        for(let i = 0; i < questions.length; i++) {
            const objects = questions[i].question.result.filter(r => r.object !== undefined);
            for(let j = 0; j < objects.length; j++) {
                this.spriteManager.readSprite(objects[j].object.name, `assets/images/ui/objects/${objects[j].object.name}.png`);
            }
        }

        // Set game variables to map data
        this.gameVariables.objects = map.objects;
        this.gameVariables.characters = map.characters;
        this.gameVariables.interactables = map.interactables;
        this.gameVariables.player = { direction: true, animation: 'idle', noplayer: false }
        if(map.noplayer !== undefined) {
            // Used for maps where you don't have your character to move and no interactable ui is shown
            this.gameVariables.player.noplayer = map.noplayer;
        }

        // Load all textures
        const waiter = setInterval(() => {
            if(this.spriteManager.allSpriteLoaded()) {
                // Set main position
                const startingLocation = spawnLocation || map.startingPoint;
                this.spriteManager.getSprite('main').setCoords(startingLocation[0], startingLocation[1]);

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
        }, 5000);
    }

    startLevel() {
        this.soundSystem.playBackgroundMusic(this.gameVariables.currentMusic);
    }
}
