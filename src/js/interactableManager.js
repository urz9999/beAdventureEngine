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
                case 'teleport': this.processTeleport(); break;
            }
        }
    }

    processTeleport() {
        this.gameStatus.levelStatus = 0;
        const number = this.gameVariables.currentInteractable.goTo;
        const spawnLocation = this.gameVariables.currentInteractable.spawn;
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

    processClicksForEvents() {
        if(this.gameVariables.currentInteractable !== null && !this.gameStatus.walkingToInteractable) {
            // Here we have an interactable close enough to process it!
            switch (this.gameVariables.currentInteractable.type) {
                case 'dialog': this.incrementMessageIndex(); break;
                case 'look': this.incrementMessageIndex(); break;
                case 'object': this.incrementMessageIndex(); break;
                case 'interact': this.incrementMessageIndex(); break;
                case 'question': this.incrementMessageIndexOrRespond(); break;
                case 'teleport': break;
            }
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
        for(let i = 0; i < this.gameVariables.currentInteractable.question.result.length; i++) {
            const trigger = this.gameVariables.currentInteractable.question.result[i].trigger;
            const object = this.gameVariables.currentInteractable.question.result[i].object;
            if(trigger !== undefined) {
                this.gameVariables.triggers[this.gameVariables.currentInteractable.linked] = 1;
            }
            if(object !== undefined) {
                if(this.gameVariables.inventory.filter(obj => obj.name === object.name).length === 0) {
                    this.gameVariables.inventory.push({ name: object.name, description: object.description });
                }
            }
        }
    }
}
