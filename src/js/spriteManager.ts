import type { SpriteOptions, SubSprite } from '../types';

export class SpriteManager {
  private spriteList: Record<string, { ready: boolean; sprite: Sprite | null; type?: string }> = {};

  clearSpriteList(): void {
    this.spriteList = {};
  }

  readMainCharacter(): void {
    this.readSprite('main', 'assets/images/ui/pgs/main.png', {
      type: 'main',
      sWidth: 53,
      sHeight: 94,
      walkingFrames: 7,
      idleFrames: 4,
      talkingFrames: 3
    });
    if (this.imageExists('/assets/images/ui/pgs/mainFace.png')) {
      this.readSprite('mainFace', 'assets/images/ui/pgs/mainFace.png');
    }
  }

  readPartnerCharacter(
    id: string,
    name: string,
    walkingFrames: number,
    idleFrames: number,
    talkingFrames: number,
    width: number,
    height: number
  ): void {
    this.readSprite(name, `assets/images/ui/pgs/${id}.png`, {
      type: 'partner',
      sWidth: width,
      sHeight: height,
      walkingFrames: walkingFrames,
      idleFrames: idleFrames,
      talkingFrames: talkingFrames
    });
    if (this.imageExists(`/assets/images/ui/pgs/${id}Face.png`)) {
      this.readSprite(`${name}Face`, `assets/images/ui/pgs/${id}Face.png`);
    }
  }

  readAnimatedCharacter(name: string, path: string, sWidth: number, frames: number): void {
    this.readSprite(name, path, {
      type: 'animated',
      sWidth: sWidth,
      frames: frames
    });
    if (this.imageExists(path.replace('.png', '') + 'Face.png')) {
      this.readSprite(`${name}Face`, path.replace('.png', '') + 'Face.png');
    }
  }

  readSprite(name: string, path: string, opts?: SpriteOptions): void {
    const image = new Image();
    image.src = path;
    image.onload = () => {
      if (opts === undefined) {
        const sprite = new Sprite(0, 0, image.width, image.height, image);
        this.spriteList[name] = { ready: true, sprite: sprite };
      } else {
        if (opts.type === 'main' || opts.type === 'partner') {
          const sprite = new MainSprite(
            0, 0, image.width, image.height, image,
            opts.sWidth!, opts.sHeight!, opts.walkingFrames!, opts.idleFrames!, opts.talkingFrames!
          );
          this.spriteList[name] = { ready: true, sprite: sprite, type: opts.type };
        } else {
          const sprite = new AnimatedSprite(
            0, 0, image.width, image.height, image,
            opts.sWidth!, image.height, opts.frames!
          );
          this.spriteList[name] = { ready: true, sprite: sprite, type: 'generic' };
        }
      }
    };
    this.spriteList[name] = { ready: false, sprite: null };
  }

  getSprite(name: string): Sprite | null | undefined {
    const spriteData = this.spriteList[name];
    return spriteData !== undefined ? spriteData.sprite : undefined;
  }

  allSpriteLoaded(): boolean {
    let allReady = true;
    for (const name in this.spriteList) {
      if (this.spriteList.hasOwnProperty(name)) {
        allReady = allReady && this.spriteList[name].ready;
      }
    }
    return allReady;
  }

  imageExists(url: string): boolean {
    const http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status !== 404 && http.status !== 403;
  }
}

export class Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  graphics: HTMLImageElement;

  constructor(x: number, y: number, width: number, height: number, graphics: HTMLImageElement) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.graphics = graphics;
  }

  setCoords(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  getCoords(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}

export class MainSprite extends Sprite {
  sWidth: number;
  sHeight: number;
  walkingFrames: number;
  idleFrames: number;
  talkingFrames: number;

  walkingCurrentFrame: number;
  idleCurrentFrame: number;
  talkingCurrentFrame: number;

  subSprite!: SubSprite;

  constructor(
    x: number, y: number, width: number, height: number, graphics: HTMLImageElement,
    sWidth: number, sHeight: number, walkingFrames: number, idleFrames: number, talkingFrames: number
  ) {
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

  private animate(currentFrame: number, frames: number, ox: number, oy: number): number {
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

  playLeftWalking(): void {
    this.walkingCurrentFrame = this.animate(this.walkingCurrentFrame, this.walkingFrames, 0, 2 * this.sHeight);
  }

  playRightWalking(): void {
    this.walkingCurrentFrame = this.animate(this.walkingCurrentFrame, this.walkingFrames, 0, 3 * this.sHeight);
  }

  playLeftIdle(): void {
    this.idleCurrentFrame = this.animate(this.idleCurrentFrame, this.idleFrames, 0, 0);
  }

  playRightIdle(): void {
    this.idleCurrentFrame = this.animate(this.idleCurrentFrame, this.idleFrames, 0, this.sHeight);
  }

  playleftTalking(): void {
    this.talkingCurrentFrame = this.animate(this.talkingCurrentFrame, this.talkingFrames, this.idleFrames * this.sWidth, 0);
  }

  playRightTalking(): void {
    this.talkingCurrentFrame = this.animate(this.talkingCurrentFrame, this.talkingFrames, this.idleFrames * this.sWidth, this.sHeight);
  }

  getFrame(): SubSprite {
    return this.subSprite;
  }
}

export class AnimatedSprite extends Sprite {
  sWidth: number;
  sHeight: number;
  frames: number;

  currentFrame: number;
  subSprite!: SubSprite;

  constructor(
    x: number, y: number, width: number, height: number, graphics: HTMLImageElement,
    sWidth: number, sHeight: number, frames: number
  ) {
    super(x, y, width, height, graphics);
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.frames = frames;
    this.currentFrame = 0;
  }

  animate(): void {
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

  getFrame(): SubSprite {
    return this.subSprite;
  }

  isEnded(): boolean {
    return this.currentFrame === this.frames - 1;
  }
}
