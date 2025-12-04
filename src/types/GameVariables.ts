import type { PlayerData } from './PlayerData';
import type { InventoryItem } from './InventoryItem';
import type { Interactable } from './Interactable';
import type { QuestionData } from './QuestionData';
import type { StaticText } from './StaticText';
import type { Dialog } from './Dialog';
import type { InventoryTooltip } from './InventoryTooltip';

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
