import type { GameStatus, GameVariables, SettingsData, Interactable } from '../types';
import type { AnimatedSprite, MainSprite, SpriteManager } from './spriteManager';
import type { InteractableManager } from './interactableManager';

export class MouseManager {
  private gameCanvas: HTMLCanvasElement;
  private gameWidth: number;
  private gameHeight: number;
  private gameStatus: GameStatus;
  private gameVariables: GameVariables;
  private spriteManager: SpriteManager;
  private interactableManager: InteractableManager;
  private settings: SettingsData;

  constructor(
    spriteManager: SpriteManager,
    interactableManager: InteractableManager,
    gameStatus: GameStatus,
    gameVariables: GameVariables,
    gameCanvas: HTMLCanvasElement,
    gameWidth: number,
    gameHeight: number,
    settings: SettingsData
  ) {
    this.spriteManager = spriteManager;
    this.interactableManager = interactableManager;
    this.gameStatus = gameStatus;
    this.gameVariables = gameVariables;
    this.gameCanvas = gameCanvas;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.settings = settings;
  }

  processMouse(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    switch (event.type) {
      case 'mousemove': this.processMoves(event); break;
      case 'mousedown': this.processClicks(event); break;
    }
  }

  private processMoves(event: MouseEvent): void {
    const rect = this.gameCanvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) / this.gameStatus.scale;
    const canvasY = (event.clientY - rect.top) / this.gameStatus.scale;

    // Pass control to the minigame
    if (this.gameStatus.levelStatus === 2) {
      if (this.gameVariables.selectedMinigame !== undefined) {
        this.gameVariables.selectedMinigame.processMovement(canvasX, canvasY);
      } else {
        throw new Error("You need to launch a minigame in this state, please verify");
      }
      return;
    }

    if (!this.gameStatus.showInventory && !this.gameStatus.doingQuestion) {
      const foundInteractable = this.overInteractable(canvasX, canvasY);
      if (foundInteractable !== null) {
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
      if (!this.gameStatus.doingQuestion) {
        // Check if the mouse is over some element of the inventory
        const index = this.overMenuSlot(canvasX, canvasY);
        if (index > -1) {
          const obj = this.gameVariables.inventory[index];
          if (obj !== undefined) {
            this.gameVariables.inventoryTooltip = { tooltip: obj.description, index: Math.floor(index / 4) };
          }
        } else {
          this.gameVariables.inventoryTooltip = null;
        }
      } else {
        const currentInteractable = this.gameVariables.currentInteractable;
        if (currentInteractable && this.gameVariables.questions[currentInteractable.linked]) {
          this.gameVariables.questions[currentInteractable.linked].answeredQuestionNumber = this.overQuestion(canvasX, canvasY);
        }
      }
    }
  }

  private processClicks(event: MouseEvent): void {
    let playerSprite = (this.spriteManager.getSprite('main') as MainSprite)?.subSprite;
    if (this.gameStatus.partnerIndex !== 0) {
      playerSprite = (this.spriteManager.getSprite(this.settings.partners[this.gameStatus.partnerIndex - 1].name) as AnimatedSprite)?.subSprite;
    }
    
    const rect = this.gameCanvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) / this.gameStatus.scale;
    const canvasY = (event.clientY - rect.top) / this.gameStatus.scale;

    // Pass control to the minigame
    if (this.gameStatus.levelStatus === 2) {
      if (this.gameVariables.selectedMinigame !== undefined) {
        this.gameVariables.selectedMinigame.processClicks(canvasX, canvasY);
      } else {
        throw new Error("You need to launch a minigame in this state, please verify");
      }
      return;
    }

    if (this.gameStatus.blockMouseAction || this.gameStatus.walkingToInteractable) {
      return;
    }

    this.gameVariables.player.clickedX = canvasX;

    // Inventory - Always process menu icons first
    if (this.overMenuIcon(canvasX, canvasY, 'InventoryIcon') && this.gameVariables.player.noplayer === false) {
      this.gameStatus.showInventory = !this.gameStatus.showInventory;
      if (this.gameStatus.showInventory) {
        this.gameStatus.cursor = 'standard';
      }
      return;
    }

    // Pause - Always process menu icons first
    if ((this.overMenuIcon(canvasX, canvasY, 'PauseIcon') || this.overMenuIcon(canvasX, canvasY, 'PlayIcon')) && this.gameVariables.player.noplayer === false) {
      this.gameStatus.gamePaused = !this.gameStatus.gamePaused;
      return;
    }

    if (this.overMenuIcon(canvasX, canvasY, 'PartnerChange')) {
      this.gameStatus.partnerIndex++;
      if (this.gameStatus.partnerIndex > this.settings.partners.length) {
        this.gameStatus.partnerIndex = 0;
      }
      return;
    }

    if (!this.gameStatus.gamePaused) {
      // Process questions
      if (this.gameStatus.doingQuestion) {
        const currentInteractable = this.gameVariables.currentInteractable;
        if (currentInteractable && this.gameVariables.questions[currentInteractable.linked]?.answeredQuestionNumber > -1) {
          this.interactableManager.processClicksForEvents();
          this.gameStatus.blockMouseAction = false;
        }
        return;
      }

      if (!this.gameStatus.showInventory) {
        const foundInteractable = this.overInteractable(canvasX, canvasY);
        if (foundInteractable !== null && !this.gameStatus.processInteractable) {
          this.gameVariables.currentInteractable = foundInteractable;
          this.gameStatus.processInteractable = true;
          
          // Move towards it or directly set for processing interactable
          if (
            playerSprite &&
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
          if (!this.gameStatus.processInteractable && this.gameVariables.player.noplayer === false && playerSprite) {
            // Just move in a direction
            this.gameStatus.cursor = 'move';
            this.gameVariables.player.animation = 'walking';
            this.gameVariables.player.direction = (this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam) > playerSprite.dx;
            this.gameVariables.player.reachX = this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam;
            this.gameStatus.blockMouseAction = true;
          } else {
            this.interactableManager.processClicksForEvents();
            this.gameStatus.blockMouseAction = false;
          }
        }
      } else {
        if (!this.gameStatus.doingQuestion) {
          // Check if the mouse is over some element of the inventory
          const index = this.overMenuSlot(canvasX, canvasY);
          if (index > -1) {
            const obj = this.gameVariables.inventory[index];
            if (obj !== undefined && obj.usable === true) {
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

  setMouseCursor(): void {
    const name = this.gameStatus.cursor;
    const map: Record<string, string> = {
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
    this.gameCanvas.style.cursor = map[name] || map['standard'];
  }

  private overMenuIcon(canvasX: number, canvasY: number, name: string): boolean {
    const menuIcon = this.spriteManager.getSprite(name);
    if (!menuIcon) return false;
    
    const menuIconX = menuIcon.x;
    const menuIconY = 20;
    return (
      canvasX > menuIconX && canvasX < (menuIconX + menuIcon.width) &&
      canvasY > menuIconY && canvasY < (menuIconY + menuIcon.height)
    );
  }

  private overMenuSlot(canvasX: number, canvasY: number): number {
    const inventorySlot = this.spriteManager.getSprite('InventorySlot');
    if (!inventorySlot) return -1;
    
    const overallSpaceX = inventorySlot.width * 4 + 60;
    const overallSpaceY = inventorySlot.height * 4 + 60;

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const slotX = this.gameWidth / 2 - overallSpaceX / 2 + j * inventorySlot.width + j * 20;
        const slotY = this.gameHeight / 2 - overallSpaceY / 2 + i * inventorySlot.height + i * 20;

        if (
          canvasX > slotX && canvasX < (slotX + inventorySlot.width) &&
          canvasY > slotY && canvasY < (slotY + inventorySlot.height)
        ) {
          return (i * 4 + j);
        }
      }
    }
    return -1;
  }

  private overInteractable(canvasX: number, canvasY: number): Interactable | null {
    for (let i = 0; i < this.gameVariables.interactables.length; i++) {
      const interactable = { ...this.gameVariables.interactables[i] };

      // Correct by player cam if needed as this only serves when the player is active
      const translatedX = this.gameVariables.player.noplayer ? canvasX : canvasX + this.gameVariables.player.cam;

      if (
        translatedX > interactable.x && translatedX < (interactable.x + interactable.width) &&
        canvasY > interactable.y && canvasY < (interactable.y + interactable.height)
      ) {
        if (this.gameStatus.alternate === true && interactable.alternate === true) {
          return interactable;
        } else if (!this.gameStatus.alternate && interactable.alternate === undefined) {
          return interactable;
        } else {
          return null;
        }
      }
    }
    return null;
  }

  private overQuestion(canvasX: number, canvasY: number): number {
    const currentInteractable = this.gameVariables.currentInteractable;
    if (!currentInteractable) return -1;
    
    const questionData = this.gameVariables.questions[currentInteractable.linked];
    if (questionData !== undefined && questionData.boundingBoxes !== undefined) {
      for (let i = 0; i < questionData.boundingBoxes.length; i++) {
        const boundingBox = questionData.boundingBoxes[i];
        if (
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
