// Core types for the game engine

export interface Vector2D {
  x: number;
  y: number;
}

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

export interface PlayerData {
  direction: number | boolean;
  animation: string;
  reachX?: number;
  clickedX?: number;
  noplayer: boolean;
  initialOffsetX: number;
  cam: number;
}

export interface GameVariables {
  player: PlayerData;
  objects: any[];
  characters: any[];
  inventory: InventoryItem[];
  interactables: Interactable[];
  triggers: Record<string, any>;
  questions: Record<string, QuestionData>;
  staticTexts: StaticText[];
  minigames: Record<string, any>;
  interactableAuraOn: string | null;
  canAlternate: boolean;
  currentMap: number;
  currentMusic: string;
  alternateMusic: string;
  isMapBiggerThanCanvas: boolean;
  currentInteractable: Interactable | null;
  currentDialog: Dialog | null;
  inventoryTooltip: InventoryTooltip | null;
  selectedMinigame: any | null;
  mapsEffects: Record<string, any>;
  showMapName?: boolean;
  mapName?: string;
  mapNameOpacity?: number;
}

export interface Dialog {
  type?: string;
  name: string;
  text: string;
  portrait?: string;
}

export interface InventoryItem {
  name: string;
  description: string;
  usable: boolean;
  interactable?: any;
}

export interface InventoryTooltip {
  tooltip: string;
  index: number;
}

export interface Interactable {
  type: string;
  linked: string;
  x: number;
  y: number;
  width: number;
  height: number;
  question?: Question;
  messages?: Dialog[];
  description?: string;
  usable?: boolean;
  interactable?: any;
  messageIndex?: number;
  trigger?: string | number;
  conditions?: any[];
  sound?: string;
  effect?: any;
  result?: any[];
  completedMessages?: Dialog[];
  notMetMessages?: Dialog[];
  doneMessages?: Dialog[];
  goodAnswerMessages?: Dialog[];
  wrongAnswerMessages?: Dialog[];
  retryMessages?: Dialog[];
  partner?: string;
  alternate?: boolean;
  goTo?: number;
  spawn?: [number, number];
  game?: string;
  url?: string;
  completed?: boolean;
}

export interface Question {
  name: string;
  text: string;
  answers: Answer[];
  result: any[];
}

export interface Answer {
  text: string;
  valid: number;
}

export interface QuestionData {
  isRespondingToQuestion: boolean;
  correctAnswer: boolean;
  giveOkMessage: boolean;
  giveKomessage: boolean;
  giveTrigger: boolean;
  boundingBoxes: BoundingBox[];
  answeredQuestionNumber: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StaticText {
  text: string;
  x: number;
  y: number;
  width: number;
  font: string;
  color: string;
}

export interface FontStyle {
  color: string;
  size: number;
}

export interface SpriteOptions {
  type?: 'main' | 'partner' | 'animated';
  sWidth?: number;
  sHeight?: number;
  walkingFrames?: number;
  idleFrames?: number;
  talkingFrames?: number;
  frames?: number;
}

export interface SubSprite {
  sx: number;
  sy: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
}

export interface Partner {
  name: string;
  id: string;
  offsetX: number;
  offsetY: number;
  walkingFrames: number;
  idleFrames: number;
  talkingFrames: number;
  width: number;
  height: number;
  cancelDialog: string;
}

export interface GameObject {
  name: string;
  x: number;
  y: number;
}

export interface Character {
  name: string;
  x: number;
  y: number;
  sWidth: number;
  frames: number;
}

export interface MapData {
  name: string;
  startingMusic: string;
  alternateMusic?: string;
  canAlternate?: boolean;
  noplayer?: boolean;
  startingPoint: [number, number];
  characters: Character[];
  objects: GameObject[];
  interactables: Interactable[];
  staticTexts: StaticText[];
  effect?: string;
  bg_R_offset?: number;
  bg_R_A_offset?: number;
  bg_M_offset?: number;
  bg_M_A_offset?: number;
  bg_F_offset?: number;
  bg_F_A_offset?: number;
  walkableOffset?: number;
}

export interface SettingsData {
  fps: number;
  gameTick: number;
  creditMap: number;
  debug: boolean;
  fullscreen: boolean;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  strokeColor: string;
  rainColor: string;
  dropCount: number;
  windVelocity: number;
  dropWidth: number;
  dropXBuffer: number;
  dropMinVelocity: number;
  dropMaxVelocity: number;
  dropMinLength: number;
  dropMaxLength: number;
  dropMinAlpha: number;
  dropMaxAlpha: number;
  partners: Partner[];
  noAlternateWorldMessages: string[];
  worldTransition: boolean;
  worldTransitionSWidth?: number;
  worldTransitionFrames?: number;
  worldTransitionSpeed?: number;
  worldTransitionDone?: boolean;
  usePointSystem: boolean;
  points?: number;
}
