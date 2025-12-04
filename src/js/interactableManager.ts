import type { GameStatus, GameVariables, SettingsData, Dialog, Interactable } from '../types';
import type { SoundSystem } from './soundsSystem';
import type { SpriteManager } from './spriteManager';
import type { MapManager } from './mapManager';

export class InteractableManager {
  private gameCanvas: HTMLCanvasElement;
  private gameStatus: GameStatus;
  private gameVariables: GameVariables;
  private spriteManager: SpriteManager;
  private mapManager: MapManager;
  private soundSystem: SoundSystem;
  private settings: SettingsData;
  private processTriggerSemaphore: boolean;

  constructor(
    soundSystem: SoundSystem,
    spriteManager: SpriteManager,
    mapManager: MapManager,
    gameStatus: GameStatus,
    gameVariables: GameVariables,
    gameCanvas: HTMLCanvasElement,
    settings: SettingsData
  ) {
    this.soundSystem = soundSystem;
    this.spriteManager = spriteManager;
    this.mapManager = mapManager;
    this.gameStatus = gameStatus;
    this.gameVariables = gameVariables;
    this.gameCanvas = gameCanvas;
    this.settings = settings;
    this.processTriggerSemaphore = false;
  }

  processInteractables(): void {
    if (this.gameVariables.currentInteractable !== null && !this.gameStatus.walkingToInteractable) {
      // Here we have an interactable close enough to process it!
      // Update: added partner system so we check if we are currently in partner mode or not for every event
      const currentInteractable = this.gameVariables.currentInteractable;
      if (
        this.gameStatus.partnerIndex === 0 ||
        (
          currentInteractable.partner !== undefined &&
          currentInteractable.partner === this.settings.partners[this.gameStatus.partnerIndex - 1].name
        )
      ) {
        switch (currentInteractable.type) {
          case 'dialog': this.processDialog(currentInteractable.messages!); break;
          case 'look': this.processLook(); break;
          case 'object': this.addToInventory(); this.processDialog(currentInteractable.messages!); break;
          case 'interact': this.processTriggerAndDialog(); break;
          case 'question': this.processQuestionDialog(); break;
          case 'combine': this.processCombine(); break;
          case 'minigame': this.processMinigame(); break;
          case 'openurl': this.processOpenUrl(); break;
          case 'teleport': this.processTeleport(); break;
          case 'partner': this.processPartnerAndDialog(); break;
          case 'alternate': this.processAlternateWorldSwitch(); break;
          case 'exit': this.processTeleport(); break;
        }
      } else {
        this.processDeniedPartner();
      }
    }
  }

  processClicksForEvents(): void {
    if (this.gameVariables.currentInteractable !== null && !this.gameStatus.walkingToInteractable) {
      // Here we have an interactable close enough to process it!
      const currentInteractable = this.gameVariables.currentInteractable;
      switch (currentInteractable.type) {
        case 'dialog': this.incrementMessageIndex(); break;
        case 'look': this.incrementMessageIndex(); break;
        case 'object': this.incrementMessageIndex(); break;
        case 'interact': this.incrementMessageIndex(); break;
        case 'question': this.incrementMessageIndexOrRespond(); break;
        case 'combine': this.incrementMessageIndex(); break;
        case 'minigame': this.incrementMessageIndex(); break;
        case 'openurl': break;
        case 'teleport': break;
        case 'exit': this.incrementMessageIndex(); break;
        default: this.incrementMessageIndex(); break;
      }
    }
  }

  private processAlternateWorldSwitch(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    if (this.gameVariables.canAlternate) {
      if (currentInteractable.messages) {
        this.processDialog(currentInteractable.messages, () => {
          // Play sound if exists
          if (currentInteractable.sound !== undefined && currentInteractable.sound !== null) {
            this.soundSystem.playSound(currentInteractable.sound);
          }
          this.gameStatus.alternate = !this.gameStatus.alternate;
          // Change Music depending on world if needed
          if (this.gameStatus.alternate && this.gameVariables.alternateMusic) {
            this.soundSystem.playBackgroundMusic(this.gameVariables.alternateMusic);
          } else {
            this.soundSystem.playBackgroundMusic(this.gameVariables.currentMusic);
          }
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
          this.settings.worldTransitionDone = false;
        });
      } else {
        // Play sound if exists
        if (currentInteractable.sound !== undefined && currentInteractable.sound !== null) {
          this.soundSystem.playSound(currentInteractable.sound);
        }
        this.gameStatus.alternate = !this.gameStatus.alternate;
        // Change Music depending on world if needed
        if (this.gameStatus.alternate && this.gameVariables.alternateMusic) {
          this.soundSystem.playBackgroundMusic(this.gameVariables.alternateMusic);
        } else {
          this.soundSystem.playBackgroundMusic(this.gameVariables.currentMusic);
        }
        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
        this.settings.worldTransitionDone = false;
      }
    } else {
      if (!currentInteractable.messageIndex || currentInteractable.messageIndex === 0) {
        const messages: Dialog[] = [];
        for (let i = 0; i < this.settings.noAlternateWorldMessages.length; i++) {
          messages.push({
            type: "self",
            name: "Madeline",
            portrait: "main",
            text: this.settings.noAlternateWorldMessages[i]
          });
        }

        this.gameVariables.currentInteractable = {
          type: "dialog",
          linked: "main",
          width: currentInteractable.width,
          height: currentInteractable.height,
          x: currentInteractable.x,
          y: currentInteractable.y,
          messages: messages
        };
      }
      this.processDialog(this.gameVariables.currentInteractable!.messages!);
    }
  }

  private processDeniedPartner(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    if (!currentInteractable.messageIndex || currentInteractable.messageIndex === 0) {
      const partner = this.settings.partners[this.gameStatus.partnerIndex - 1];

      this.gameVariables.currentInteractable = {
        type: "dialog",
        linked: partner.id,
        width: currentInteractable.width,
        height: currentInteractable.height,
        x: currentInteractable.x,
        y: currentInteractable.y,
        messages: [
          {
            type: "other",
            name: partner.name,
            portrait: partner.name,
            text: partner.cancelDialog
          }
        ]
      };
    }
    this.processDialog(this.gameVariables.currentInteractable!.messages!, () => {
      this.gameVariables.currentInteractable = null;
      this.gameStatus.processInteractable = false;
    });
  }

  private processPartnerAndDialog(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    if (this.gameStatus.partnerIndex !== 0) {
      if (!this.gameVariables.triggers[currentInteractable.linked]) {
        this.processDialog(currentInteractable.completedMessages!, () => {
          this.processResultPrize(currentInteractable.result!);
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      } else {
        this.processDialog(currentInteractable.doneMessages!, () => {
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      }
    } else {
      if (!this.gameVariables.triggers[currentInteractable.linked]) {
        this.processDialog(currentInteractable.notMetMessages!, () => {
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      } else {
        this.processDialog(currentInteractable.doneMessages!, () => {
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      }
    }
  }

  private processOpenUrl(): void {
    const url = this.gameVariables.currentInteractable!.url;
    if (url !== undefined && url !== null) {
      window.location.href = url + '?pwd=AKA47rtzz99';
    }
  }

  private processMinigame(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    this.processConditions(() => {
      if (this.gameVariables.selectedMinigame === null) {
        this.gameVariables.selectedMinigame = this.gameVariables.minigames[currentInteractable.game!];
        this.gameStatus.levelStatus = 2;
        this.gameVariables.selectedMinigame.start();
      }
      // this will be read from the minigame variable to keep the external minigame and the game sync
      const minigameWin = this.gameStatus.minigameWin;

      // Add object and triggers
      if (minigameWin === true) {
        this.gameStatus.levelStatus = 1;

        // Process prize
        this.processResultPrize(currentInteractable.result!);
        // Final message
        this.processDialog(currentInteractable.completedMessages!, () => {
          this.gameStatus.minigameWin = undefined;
          this.gameVariables.selectedMinigame = null;
        });
      } else if (minigameWin === false) {
        this.gameStatus.levelStatus = 1;

        // Retry message
        this.processDialog(currentInteractable.retryMessages!, () => {
          this.gameStatus.minigameWin = undefined;
          this.gameVariables.selectedMinigame = null;
        });
      }
      // If still undefined do nothing and continue the minigame
    }, () => {
      this.processDialog(currentInteractable.notMetMessages!, () => {
        this.gameStatus.minigameWin = undefined;
        this.gameVariables.selectedMinigame = null;
      });
    });
  }

  private processCombine(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    if (currentInteractable.completed === undefined) {
      this.processConditions(() => {
        // Add object and triggers
        this.processResultPrize(currentInteractable.result!);

        // Final message
        this.processDialog(currentInteractable.completedMessages!, () => {
          // Prevent other accesses to win condition
          currentInteractable.completed = true;
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      }, () => {
        this.processDialog(currentInteractable.notMetMessages!, () => {
          this.gameVariables.currentInteractable = null;
          this.gameStatus.processInteractable = false;
        });
      });
    } else {
      this.processDialog(currentInteractable.doneMessages!, () => {
        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
      });
    }
  }

  private processTeleport(): void {
    this.processConditions(() => {
      this.executeTeleport();
    }, () => {
      this.processDialog(this.gameVariables.currentInteractable!.notMetMessages!);
    });
  }

  private processConditions(callbackOk: () => void, callbackFailure: () => void): void {
    const conditions = this.gameVariables.currentInteractable!.conditions;

    if (conditions === undefined) {
      callbackOk();
    } else {
      let test = true;

      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        if (condition.object !== undefined && condition.object !== null) {
          // Manage object condition
          const foundItem = this.gameVariables.inventory.filter(itm => itm.name === condition.object.name)[0];
          if (condition.object.value === 1) {
            test = test && (foundItem !== undefined);
          } else {
            test = test && (foundItem === undefined);
          }
        }
        if (condition.trigger !== undefined && condition.trigger !== null) {
          // Manage trigger condition
          const trigger = this.gameVariables.triggers[condition.trigger.name];
          if (condition.trigger.value === 1) {
            test = test && (trigger !== undefined && trigger === 1);
          } else {
            test = test && (trigger !== undefined && trigger === 0);
          }
        }
      }

      if (test) {
        callbackOk();
      } else {
        callbackFailure();
      }
    }
  }

  private executeTeleport(forceMap?: { number: number; spawn: [number, number] }): void {
    this.gameStatus.cursor = 'standard';
    this.gameStatus.levelStatus = 0;
    const number = forceMap?.number || this.gameVariables.currentInteractable!.goTo!;
    const spawnLocation = forceMap?.spawn || this.gameVariables.currentInteractable!.spawn;
    this.gameVariables.currentInteractable = null;
    this.gameStatus.processInteractable = false;
    this.mapManager.loadLevel(number, spawnLocation);
  }

  private processQuestionDialog(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    // first save question variables in question array: just once!
    if (this.gameVariables.questions[currentInteractable.linked] === undefined) {
      this.gameVariables.questions[currentInteractable.linked] = {
        isRespondingToQuestion: false,
        correctAnswer: false,
        giveOkMessage: false,
        giveKomessage: false,
        giveTrigger: false,
        answeredQuestionNumber: -1,
        boundingBoxes: []
      };
    }

    // Verify at which step of the question we are for dialogs or interactions
    const questionData = this.gameVariables.questions[currentInteractable.linked];
    if (
      !questionData.isRespondingToQuestion &&
      !questionData.correctAnswer &&
      !questionData.giveOkMessage &&
      !questionData.giveKomessage
    ) {
      this.processDialog(currentInteractable.messages!, () => {
        questionData.isRespondingToQuestion = true;
        questionData.correctAnswer = false;
        questionData.giveOkMessage = false;
        questionData.giveKomessage = false;

        this.gameStatus.doingQuestion = true;
      });
    } else if (
      !questionData.isRespondingToQuestion &&
      questionData.correctAnswer &&
      !questionData.giveOkMessage &&
      !questionData.giveKomessage
    ) {
      this.processDialog(currentInteractable.completedMessages!, () => {
        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
      });
    } else if (
      !questionData.isRespondingToQuestion &&
      !questionData.correctAnswer &&
      questionData.giveOkMessage &&
      !questionData.giveKomessage
    ) {
      this.processDialog(currentInteractable.goodAnswerMessages!, () => {
        questionData.correctAnswer = true;
        questionData.isRespondingToQuestion = false;
        questionData.giveOkMessage = false;
        questionData.giveKomessage = false;

        if (!questionData.giveTrigger) {
          questionData.giveTrigger = true;
          this.processRewardToQuestion();
        }

        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
      });
    } else if (
      !questionData.isRespondingToQuestion &&
      !questionData.correctAnswer &&
      !questionData.giveOkMessage &&
      questionData.giveKomessage
    ) {
      this.processDialog(currentInteractable.wrongAnswerMessages!, () => {
        questionData.correctAnswer = false;
        questionData.isRespondingToQuestion = false;
        questionData.giveOkMessage = false;
        questionData.giveKomessage = false;

        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
      });
    }
  }

  private processTriggerAndDialog(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    const trigger = currentInteractable.trigger;

    // Before doing anything trigger once per interactable interaction!
    if (!this.processTriggerSemaphore) {
      this.processTrigger();
      this.processTriggerSemaphore = true;
    }

    if (this.gameVariables.triggers[currentInteractable.linked] === 0 || trigger === 'toggle') {
      this.processDialog(currentInteractable.messages!, () => {
        this.processTriggerSemaphore = false;
      });
    } else {
      this.processDialog(currentInteractable.completedMessages!, () => {
        this.processTriggerSemaphore = false;
      });
    }
  }

  private processTrigger(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    const setOpposite = (value: number | undefined): number => {
      if (value !== undefined) {
        return (value === 1 ? 0 : 1);
      } else {
        return 1;
      }
    };

    // This way we can both set/update the trigger value
    const trigger = currentInteractable.trigger;
    this.gameVariables.triggers[currentInteractable.linked] =
      (trigger === 'toggle' ? setOpposite(this.gameVariables.triggers[currentInteractable.linked]) : trigger as number);

    // Apply weather effect if present
    if (currentInteractable.effect !== undefined) {
      const effect = currentInteractable.effect;
      if (this.gameVariables.triggers[currentInteractable.linked] === 1) {
        this.gameVariables.mapsEffects[effect.map] = effect.name;
      } else {
        delete this.gameVariables.mapsEffects[effect.map];
      }
    }

    // Play sound if exists
    if (currentInteractable.sound !== undefined && currentInteractable.sound !== null) {
      this.soundSystem.playSound(currentInteractable.sound);
    }
  }

  private processDialog(messages: Dialog[], callback?: () => void): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    const currentMessageToShow = currentInteractable.messageIndex || 0;
    if (currentMessageToShow === messages.length) {
      // finish: remove interactable only if not question or question is at the end, in that case we handle it safely from its processor callback
      currentInteractable.messageIndex = 0;

      if (
        currentInteractable.type !== 'question' &&
        currentInteractable.type !== 'partner' &&
        currentInteractable.type !== 'combine' &&
        currentInteractable.type !== 'alternate' &&
        currentInteractable.type !== 'look'
      ) {
        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
      }

      this.gameVariables.currentDialog = null;
      this.gameVariables.player.animation = 'idle';

      if (callback !== undefined) {
        callback();
      }
    } else {
      // Set the dialog component for drawing engine
      this.gameVariables.currentDialog = messages[currentMessageToShow];
      if (this.gameVariables.currentDialog.type === 'self') {
        this.gameVariables.player.animation = 'talking';
      } else {
        this.gameVariables.player.animation = 'idle';
      }
    }
  }

  private incrementMessageIndex(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    if (
      currentInteractable.messageIndex !== undefined &&
      currentInteractable.messageIndex !== null
    ) {
      currentInteractable.messageIndex = currentInteractable.messageIndex + 1;
    } else {
      currentInteractable.messageIndex = 0;
    }
  }

  private incrementMessageIndexOrRespond(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    const questionData = this.gameVariables.questions[currentInteractable.linked];
    if (!questionData.isRespondingToQuestion) {
      // Just go with a normal message interaction
      this.incrementMessageIndex();
    } else {
      // Respond here to question
      const correctOneIndex = currentInteractable.question!.answers.map(e => e.valid).indexOf(1);
      const answered = questionData.answeredQuestionNumber;

      questionData.correctAnswer = false;
      questionData.giveOkMessage = (answered === correctOneIndex);
      questionData.giveKomessage = !questionData.giveOkMessage;
      questionData.isRespondingToQuestion = false;

      this.gameStatus.doingQuestion = false;
    }
  }

  private addToInventory(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    // Add to inventory and remove from screen
    if (this.gameVariables.inventory.filter(obj => obj.name === currentInteractable.linked).length === 0) {
      this.gameVariables.inventory.push({
        name: currentInteractable.linked,
        description: currentInteractable.description!,
        usable: currentInteractable.usable || false,
        interactable: currentInteractable.interactable
      });
      this.gameVariables.interactables = this.gameVariables.interactables.filter(obj => obj.linked !== currentInteractable.linked);
      this.gameVariables.objects = this.gameVariables.objects.filter(obj => obj.name !== currentInteractable.linked);

      // Play sound if exists
      if (currentInteractable.sound !== undefined && currentInteractable.sound !== null) {
        this.soundSystem.playSound(currentInteractable.sound);
      }

      // Apply weather effect if present
      if (currentInteractable.effect !== undefined) {
        const effect = currentInteractable.effect;
        this.gameVariables.mapsEffects[effect.map] = effect.name;
      }
    }
  }

  private processRewardToQuestion(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    this.processResultPrize(currentInteractable.question!.result);
  }

  private processResultPrize(results: any[]): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    for (let i = 0; i < results.length; i++) {
      const trigger = results[i].trigger;
      const object = results[i].object;
      const wingame = results[i].wingame;
      const sound = results[i].sound;
      const effect = results[i].effect;
      const point = results[i].point;

      if (trigger !== undefined) {
        this.gameVariables.triggers[currentInteractable.linked] = 1;
        // Remove object from screen when trigger is set
        this.gameVariables.interactables = this.gameVariables.interactables.filter(obj => obj.linked !== currentInteractable.linked);
        this.gameVariables.objects = this.gameVariables.objects.filter(obj => obj.name !== currentInteractable.linked);
      }
      if (object !== undefined) {
        if (this.gameVariables.inventory.filter(obj => obj.name === object.name).length === 0) {
          this.gameVariables.inventory.push(object);
        }
      }
      if (wingame !== undefined) {
        // Set wingame status to true: this will wait for current interactable
        // to finish and then will change to credit scene
        this.gameStatus.wingame = true;
      }
      if (sound !== undefined && results[i].soundPlayed === undefined) {
        // Play sound if exists
        this.soundSystem.playSound(sound);
        results[i].soundPlayed = true;
      }
      if (effect !== undefined) {
        this.gameVariables.mapsEffects[effect.map] = effect.name;
      }
      if (point !== undefined && results[i].pointAssigned === undefined) {
        if (this.settings.points !== undefined) {
          this.settings.points += point;
        }
        results[i].pointAssigned = true;
      }
    }
  }

  processWinGame(creditMap: number): void {
    if (this.gameStatus.wingame && this.gameVariables.currentInteractable === null) {
      this.gameStatus.levelStatus = 4;
      this.gameStatus.wingame = false;
      this.gameStatus.inCredits = true;
      // go to credit map
      this.executeTeleport({ number: creditMap, spawn: [0, 0] });
    }
  }

  private processLook(): void {
    const currentInteractable = this.gameVariables.currentInteractable!;
    this.processDialog(currentInteractable.messages!, () => {
      if (currentInteractable.result) {
        this.processResultPrize(currentInteractable.result);
      }
      this.gameVariables.currentInteractable = null;
      this.gameStatus.processInteractable = false;
    });
  }
}
