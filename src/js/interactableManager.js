class InteractableManager {
    gameCanvas;
    gameStatus;
    gameVariables;

    spriteManager;
    mapManager;

    processTriggerSemaphore;

    constructor(spriteManager, mapManager, gameStatus, gameVariables, gameCanvas) {
        this.spriteManager = spriteManager;
        this.mapManager = mapManager;

        this.gameStatus = gameStatus;
        this.gameVariables = gameVariables;
        this.gameCanvas = gameCanvas;

        this.processTriggerSemaphore = false;
    }

    processInteractables() {
        if(this.gameVariables.currentInteractable !== null && !this.gameStatus.walkingToInteractable) {
            // Here we have an interactable close enough to process it!
            switch (this.gameVariables.currentInteractable.type) {
                case 'dialog': this.processDialog(this.gameVariables.currentInteractable.messages); break;
                case 'look': this.processDialog(this.gameVariables.currentInteractable.messages); break;
                case 'object': this.addToInventory(); this.processDialog(this.gameVariables.currentInteractable.messages); break;
                case 'interact': this.processTriggerAndDialog(); break;
                case 'question': this.processQuestionDialog(); break;
                case 'combine': this.processCombine(); break;
                case 'minigame': this.processMinigame(); break;
                case 'openurl': this.processOpenUrl(); break;
                case 'teleport': this.processTeleport(); break;
                case 'exit': this.processTeleport(); break;
            }
        }
    }

    processClicksForEvents() {
        if(this.gameVariables.currentInteractable !== null && !this.gameStatus.walkingToInteractable) {
            // Here we have an interactable close enough to process it!
            switch (this.gameVariables.currentInteractable.type) {
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
            }
        }
    }

    processOpenUrl() {
        const url = this.gameVariables.currentInteractable.url;
        if(url !== undefined && url !== null) {
            window.location.href = url + '?pwd=AKA47rtzz99';
        }
    }

    processMinigame() {
        this.processConditions(() => {
            const minigameWin = true; // TODO: this will be read from the minigame variable to keep the external minigame and the game sync
            // Add object and triggers
            if(minigameWin) {
                // Process prize
                this.processResultPrize(this.gameVariables.currentInteractable.result);
                // Final message
                this.processDialog(this.gameVariables.currentInteractable.completedMessages);
            }
        }, () => {
            this.processDialog(this.gameVariables.currentInteractable.notMetMessages);
        });
    }

    processCombine() {
        this.processConditions(() => {
            // Add object and triggers
            this.processResultPrize(this.gameVariables.currentInteractable.result);
            // Final message
            this.processDialog(this.gameVariables.currentInteractable.completedMessages);
        }, () => {
            this.processDialog(this.gameVariables.currentInteractable.notMetMessages);
        });
    }

    processTeleport() {
        this.processConditions(() => {
            this.executeTeleport();
        }, () => {
            this.processDialog(this.gameVariables.currentInteractable.notMetMessages);
        });
    }

    processConditions(callbackOk, callbackFailure) {
        const conditions = this.gameVariables.currentInteractable.conditions;

        if(conditions === undefined) {
            callbackOk();
        } else {
            let test = true;

            for(let i = 0; i < conditions.length; i++) {
                const condition = conditions[i];
                if(condition.object !== undefined && condition.object !== null) {
                    // Manage object condition
                    const foundItem = this.gameVariables.inventory.filter(itm => itm.name === condition.object.name)[0];
                    if(condition.object.value === 1) {
                        test = test && (foundItem !== undefined);
                    } else {
                        test = test && (foundItem === undefined);
                    }
                }
                if(condition.trigger !== undefined && condition.trigger !== null) {
                    // Manage trigger condition
                    const trigger = this.gameVariables.triggers[condition.trigger.name];
                    if(condition.trigger.value === 1) {
                        test = test && (trigger !== undefined && trigger === 1);
                    } else {
                        test = test && (trigger !== undefined && trigger === 0);
                    }
                }
            }

            if(test) {
                callbackOk();
            } else {
                callbackFailure();
            }
        }
    }

    executeTeleport(forceMap) {
        this.gameStatus.cursor = 'standard';
        this.gameStatus.levelStatus = 0;
        const number = (forceMap !== undefined && forceMap.number) || this.gameVariables.currentInteractable.goTo;
        const spawnLocation = (forceMap !== undefined && forceMap.spawn) || this.gameVariables.currentInteractable.spawn;
        this.gameVariables.currentInteractable = null;
        this.gameStatus.processInteractable = false;
        this.mapManager.loadLevel(number, spawnLocation);
    }

    processQuestionDialog() {
        // first save question variables in question array: just once!
        if(this.gameVariables.questions[this.gameVariables.currentInteractable.linked] === undefined) {
            this.gameVariables.questions[this.gameVariables.currentInteractable.linked] = {
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
        const questionData = this.gameVariables.questions[this.gameVariables.currentInteractable.linked];
        if(
            !questionData.isRespondingToQuestion &&
            !questionData.correctAnswer &&
            !questionData.giveOkMessage &&
            !questionData.giveKomessage
        ) {
            this.processDialog(this.gameVariables.currentInteractable.messages, () => {
                questionData.isRespondingToQuestion = true;
                questionData.correctAnswer = false;
                questionData.giveOkMessage = false;
                questionData.giveKomessage = false;

                this.gameStatus.doingQuestion = true;
            });
        } else if(
            !questionData.isRespondingToQuestion &&
            questionData.correctAnswer &&
            !questionData.giveOkMessage &&
            !questionData.giveKomessage
        ) {
            this.processDialog(this.gameVariables.currentInteractable.completedMessages, () => {
                this.gameVariables.currentInteractable = null;
                this.gameStatus.processInteractable = false;
            });
        } else if(
            !questionData.isRespondingToQuestion &&
            !questionData.correctAnswer &&
            questionData.giveOkMessage &&
            !questionData.giveKomessage
        ) {
            this.processDialog(this.gameVariables.currentInteractable.goodAnswerMessages, () => {
                questionData.correctAnswer = true;
                questionData.isRespondingToQuestion = false;
                questionData.giveOkMessage = false;
                questionData.giveKomessage = false;

                if(!questionData.giveTrigger) {
                    questionData.giveTrigger = true;
                    this.processRewardToQuestion();
                }

                this.gameVariables.currentInteractable = null;
                this.gameStatus.processInteractable = false;
            });
        } else if(
            !questionData.isRespondingToQuestion &&
            !questionData.correctAnswer &&
            !questionData.giveOkMessage &&
            questionData.giveKomessage
        ) {
            this.processDialog(this.gameVariables.currentInteractable.wrongAnswerMessages, () => {
                questionData.correctAnswer = false;
                questionData.isRespondingToQuestion = false;
                questionData.giveOkMessage = false;
                questionData.giveKomessage = false;

                this.gameVariables.currentInteractable = null;
                this.gameStatus.processInteractable = false;
            });
        }
    }

    processTriggerAndDialog() {
        const trigger = this.gameVariables.currentInteractable.trigger;

        // Before doing anything trigger once per interactable interaction!
        if(!this.processTriggerSemaphore) {
            this.processTrigger();
            this.processTriggerSemaphore = true;
        }

        if(this.gameVariables.triggers[this.gameVariables.currentInteractable.linked] === 0 || trigger === 'toggle') {
            this.processDialog(this.gameVariables.currentInteractable.messages, () => {
                this.processTriggerSemaphore = false;
            });
        } else {
            this.processDialog(this.gameVariables.currentInteractable.completedMessages, () => {
                this.processTriggerSemaphore = false;
            });
        }
    }

    processTrigger() {
        console.log('times called');
        const setOpposite = (value) => {
            if(value !== undefined) {
                return (value === 1 ? 0 : 1);
            } else {
                return 1;
            }
        }

        // This way we can both set/update the trigger value
        const trigger = this.gameVariables.currentInteractable.trigger;
        this.gameVariables.triggers[this.gameVariables.currentInteractable.linked] =
            (trigger === 'toggle' ? setOpposite(this.gameVariables.triggers[this.gameVariables.currentInteractable.linked]) : trigger);
    }

    processDialog(mess, callback) {
        const messages = mess;
        const currentMessageToShow = this.gameVariables.currentInteractable.messageIndex || 0;
        if(currentMessageToShow === (messages.length)) {
            // finish: remove interactable only if not question or question is at the end, in that case we handle it safely from its processor callback
            this.gameVariables.currentInteractable.messageIndex = 0;

            if(this.gameVariables.currentInteractable.type !== 'question') {
                this.gameVariables.currentInteractable = null;
                this.gameStatus.processInteractable = false;
            }

            this.gameVariables.currentDialog = null;
            this.gameVariables.player.animation = 'idle';

            if(callback !== undefined) {
                callback();
            }
        } else {
            // Set the dialog component for drawing engine
            this.gameVariables.currentDialog = messages[currentMessageToShow];
            if(this.gameVariables.currentDialog.type === 'self') {
                this.gameVariables.player.animation = 'talking';
            } else {
                this.gameVariables.player.animation = 'idle';
            }
        }
    }

    incrementMessageIndex() {
        if (
            this.gameVariables.currentInteractable.messageIndex !== undefined &&
            this.gameVariables.currentInteractable.messageIndex !== null
        ) {
            this.gameVariables.currentInteractable.messageIndex = this.gameVariables.currentInteractable.messageIndex + 1;
        } else {
            this.gameVariables.currentInteractable.messageIndex = 1;
        }
    }

    incrementMessageIndexOrRespond() {
        if(!this.gameVariables.questions[this.gameVariables.currentInteractable.linked].isRespondingToQuestion) {
            // Just go with a normal message interaction
            if (
                this.gameVariables.currentInteractable.messageIndex !== undefined &&
                this.gameVariables.currentInteractable.messageIndex !== null
            ) {
                this.gameVariables.currentInteractable.messageIndex = this.gameVariables.currentInteractable.messageIndex + 1;
            } else {
                this.gameVariables.currentInteractable.messageIndex = 1;
            }
        } else {
            // Respond here to question
            const questionData = this.gameVariables.questions[this.gameVariables.currentInteractable.linked];
            const corretOneIndex = this.gameVariables.currentInteractable.question.answers.map(e => e.valid).indexOf(1);
            const answered = questionData.answeredQuestionNumber;

            console.log(corretOneIndex, answered);

            questionData.correctAnswer = false;
            questionData.giveOkMessage = (answered === corretOneIndex);
            questionData.giveKomessage = !questionData.giveOkMessage;
            questionData.isRespondingToQuestion = false;

            this.gameStatus.doingQuestion = false;
        }
    }

    addToInventory() {
        // Add to inventory and remove from screen
        if(this.gameVariables.inventory.filter(obj => obj.name === this.gameVariables.currentInteractable.linked).length === 0) {
            this.gameVariables.inventory.push({ name: this.gameVariables.currentInteractable.linked, description: this.gameVariables.currentInteractable.description });
            this.gameVariables.interactables = this.gameVariables.interactables.filter(obj => obj.linked !== this.gameVariables.currentInteractable.linked);
            this.gameVariables.objects = this.gameVariables.objects.filter(obj => obj.name !== this.gameVariables.currentInteractable.linked);
        }
    }

    processRewardToQuestion() {
        this.processResultPrize(this.gameVariables.currentInteractable.question.result);
    }

    processResultPrize(results) {
        for(let i = 0; i < results.length; i++) {
            const trigger = results[i].trigger;
            const object = results[i].object;
            const wingame = results[i].wingame;

            if(trigger !== undefined) {
                this.gameVariables.triggers[this.gameVariables.currentInteractable.linked] = 1;
            }
            if(object !== undefined) {
                if(this.gameVariables.inventory.filter(obj => obj.name === object.name).length === 0) {
                    this.gameVariables.inventory.push({ name: object.name, description: object.description });
                }
            }
            if(wingame !== undefined) {
                // Set wingame status to true: this will wait for current interactable
                // to finish and then will change to credit scene
                this.gameStatus.wingame = true;
            }
        }
    }

    processWinGame(creditMap) {
        if(this.gameStatus.wingame && this.gameVariables.currentInteractable === null) {
            this.gameStatus.levelStatus = 4;
            this.gameStatus.wingame = false;
            this.gameStatus.inCredits = true;
            // go to credit map
            this.executeTeleport({ number: creditMap, spawn: [0,0]});
        }
    }
}
