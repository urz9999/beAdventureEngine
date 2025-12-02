import type { GameStatus, GameVariables } from '../types';
import type { Settings } from './settings.js';
import type { SoundSystem } from './soundsSystem.js';
import type { SpriteManager } from './spriteManager.js';
import type { FontManager } from './fontManager.js';

export class MiniGame {
  protected gameCanvas: HTMLCanvasElement;
  protected gameWidth: number;
  protected gameHeight: number;

  protected settings: Settings;
  protected soundSystem: SoundSystem;
  protected spriteManager: SpriteManager;
  protected fontManager: FontManager;
  protected mapManager: any;
  protected mouseManager: any;
  protected interactableManager: any;

  protected gameStatus: GameStatus;
  protected gameVariables: GameVariables;

  constructor(
    gameCanvas: HTMLCanvasElement,
    gameWidth: number,
    gameHeight: number,
    settings: Settings,
    soundSystem: SoundSystem,
    spriteManager: SpriteManager,
    fontManager: FontManager,
    mapManager: any,
    mouseManager: any,
    interactableManager: any,
    gameStatus: GameStatus,
    gameVariables: GameVariables
  ) {
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

  start(): void {}

  animate(_time: number): void {}

  draw(_time: number): void {}

  processMovement(_canvasX: number, _canvasY: number): void {}

  processClicks(_canvasX: number, _canvasY: number): void {}
}
