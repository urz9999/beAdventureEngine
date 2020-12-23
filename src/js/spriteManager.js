class SpriteManager {

    spriteList;

    constructor() {
        this.spriteList = {};
    }

    clearSpriteList() {
       this.spriteList = {};
    }

    readMainCharacter() {
        this.readSprite('main', '/assets/images/ui/pgs/main.png',{
            type: 'main',
            sWidth: 53,
            sHeight: 94,
            walkingFrames: 7,
            idleFrames: 4,
            talkingFrames: 3
        });
        if(this.imageExists('/assets/images/ui/pgs/mainFace.png')) {
            this.readSprite('mainFace', '/assets/images/ui/pgs/mainFace.png');
        }
    }

    readAnimatedCharacter(name, path, sWidth, frames) {
        this.readSprite(name, path, {
            type: 'animated',
            sWidth: sWidth,
            frames: frames
        });
        if(this.imageExists(path.replace('.png', '') + 'Face.png')) {
            this.readSprite(`${name}Face`, path.replace('.png', '') + 'Face.png');
        }
    }

    readSprite(name, path, opts) {
        const image = new Image();
        image.src = path;
        image.onload = () => {
            if(opts === undefined) {
                const sprite = new Sprite(0,0, image.width, image.height, image);
                this.spriteList[name] = { ready: true, sprite: sprite };
            } else {
                if(opts.type === 'main') {
                    const sprite = new MainSprite(0,0, image.width, image.height, image, opts.sWidth, opts.sHeight, opts.walkingFrames, opts.idleFrames, opts.talkingFrames);
                    this.spriteList[name] = { ready: true, sprite: sprite };
                } else {
                    const sprite = new AnimatedSprite(0, 0, image.width, image.height, image, opts.sWidth, image.height, opts.frames);
                    this.spriteList[name] = { ready: true, sprite: sprite };
                }
            }
        };
        this.spriteList[name] = { ready: false, sprite: null };
    }

    getSprite(name) {
        const spriteData = this.spriteList[name];
        return (spriteData !== undefined ? spriteData.sprite : undefined);
    }

    allSpriteLoaded() {
        let allReady = true;
        for (let name in this.spriteList) {
            // check if the property/key is defined in the object itself, not in parent
            if (this.spriteList.hasOwnProperty(name)) {
                allReady = allReady && this.spriteList[name].ready;
            }
        }
        return allReady;
    }

    imageExists(url){
        const http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status != 404;
    }
}

class Sprite {
    x;
    y;
    width;
    height;
    graphics;

    constructor(x, y, width, height, graphics) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.graphics = graphics;
    }

    setCoords(x, y) {
        this.x = x;
        this.y = y;
    }

    getCoords() {
        return {x: this.x, y: this.y};
    }
}

class MainSprite extends Sprite {
    sWidth;
    sHeight;
    walkingFrames;
    idleFrames;
    talkingFrames;

    walkingCurrentFrame;
    idleCurrentFrame;
    talkingCurrentFrame;

    subSprite;

    constructor(x, y, width, height, graphics, sWidth, sHeight, walkingFrames, idleFrames, talkingFrames) {
        super(x, y, width, height, graphics);
        this.sWidth = sWidth;
        this.sHeight = sHeight;
        this.walkingFrames = walkingFrames;
        this.idleFrames = idleFrames;
        this.talkingFrames = talkingFrames;

        this.walkingCurrentFrame = 0;
        this.idleCurrentFrame = 0;
        this.talkingCurrentFrame = 0;
    }

    animate(currentFrame, frames, ox, oy) {
        currentFrame++;
        if (currentFrame >= frames) {
            currentFrame = 0;
        }

        this.subSprite = {
            sx: ox + this.sWidth * currentFrame,
            sy: oy,
            width: this.sWidth,
            height: this.sHeight,
            dx: this.x,
            dy: this.y
        };

        return currentFrame;
    }

    playLeftWalking() {
        this.walkingCurrentFrame = this.animate(this.walkingCurrentFrame, this.walkingFrames, 0, 2 * this.sHeight);
    }
    playRightWalking() {
        this.walkingCurrentFrame = this.animate(this.walkingCurrentFrame, this.walkingFrames, 0, 3 * this.sHeight);
    }
    playLeftIdle() {
        this.idleCurrentFrame = this.animate(this.idleCurrentFrame, this.idleFrames, 0, 0);
    }
    playRightIdle() {
        this.idleCurrentFrame = this.animate(this.idleCurrentFrame, this.idleFrames, 0, this.sHeight);
    }
    playleftTalking() {
        this.talkingCurrentFrame = this.animate(this.talkingCurrentFrame, this.talkingFrames, this.idleFrames * this.sWidth, 0);
    }
    playRightTalking() {
        this.talkingCurrentFrame = this.animate(this.talkingCurrentFrame, this.talkingFrames, this.idleFrames * this.sWidth, this.sHeight);
    }

    getFrame() {
        return this.subSprite;
    }
}

class AnimatedSprite extends Sprite {
    sWidth;
    sHeight;
    frames;

    currentFrame;
    subSprite;

    constructor(x, y, width, height, graphics, sWidth, sHeight, frames) {
        super(x, y, width, height, graphics);
        this.sWidth = sWidth;
        this.sHeight = sHeight;
        this.frames = frames;
        this.currentFrame = 0;
    }

    animate() {
        this.currentFrame++;
        if (this.currentFrame >= this.frames) {
            this.currentFrame = 0;
        }

        this.subSprite = {
            sx: this.sWidth * this.currentFrame,
            sy: 0,
            width: this.sWidth,
            height: this.sHeight,
            dx: this.x,
            dy: this.y
        };
    }

    getFrame() {
        return this.subSprite;
    }
}
