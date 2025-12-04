export interface GameStatus {
  levelStatus: number;
  lastTick: number;
  showMainScreen: boolean;
  showLoader: boolean;
  showMenu: boolean;
  showInventory: boolean;
  showIntermission: boolean;
  doingQuestion: boolean;
  gamePaused: boolean;
  correctingView: boolean;
  blockMouseAction: boolean;
  processInteractable: boolean;
  walkingToInteractable: boolean;
  wingame: boolean;
  inCredits: boolean;
  cursor: string;
  scale: number;
  originalWidth: number;
  originalHeight: number;
  partnerIndex: number;
  alternate: boolean;
  minigameWin?: boolean;
}
