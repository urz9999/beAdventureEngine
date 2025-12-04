import type { Character } from './Character';
import type { GameObject } from './GameObject';
import type { Interactable } from './Interactable';
import type { StaticText } from './StaticText';

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
