import type { Partner } from './Partner';

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
