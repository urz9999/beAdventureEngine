import type { Partner, SettingsData } from '../types';

export class Settings {
  fps!: number;
  gameTick!: number;
  creditMap!: number;
  debug!: boolean;
  fullscreen!: boolean;

  color1!: string;
  color2!: string;
  color3!: string;
  color4!: string;
  color5!: string;
  color6!: string;
  color7!: string;
  color8!: string;
  color9!: string;

  strokeColor!: string;

  rainColor!: string;
  dropCount!: number;
  windVelocity!: number;
  dropWidth!: number;
  dropXBuffer!: number;
  dropMinVelocity!: number;
  dropMaxVelocity!: number;
  dropMinLength!: number;
  dropMaxLength!: number;
  dropMinAlpha!: number;
  dropMaxAlpha!: number;

  partners: Partner[] = [];

  noAlternateWorldMessages!: string[];
  worldTransition!: boolean;
  worldTransitionSWidth?: number;
  worldTransitionFrames?: number;
  worldTransitionSpeed?: number;
  worldTransitionDone = false;

  points = 0;
  usePointSystem!: boolean;

  loaded = false;

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    // Load data
    const response = await fetch(`assets/settings.json`);
    const settings: SettingsData = await response.json();

    this.fps = settings.fps;
    this.gameTick = settings.gameTick;
    this.creditMap = settings.creditMap;

    this.debug = settings.debug;
    this.fullscreen = settings.fullscreen;

    this.color1 = settings.color1;
    this.color2 = settings.color2;
    this.color3 = settings.color3;
    this.color4 = settings.color4;
    this.color5 = settings.color5;
    this.color6 = settings.color6;
    this.color7 = settings.color7;
    this.color8 = settings.color8;
    this.color9 = settings.color9;

    this.strokeColor = settings.strokeColor;

    // Drop settings
    this.rainColor = settings.rainColor;
    this.dropCount = settings.dropCount;
    this.windVelocity = settings.windVelocity;
    this.dropWidth = settings.dropWidth;
    this.dropXBuffer = settings.dropXBuffer;
    this.dropMinVelocity = settings.dropMinVelocity;
    this.dropMaxVelocity = settings.dropMaxVelocity;
    this.dropMinLength = settings.dropMinLength;
    this.dropMaxLength = settings.dropMaxLength;
    this.dropMinAlpha = settings.dropMinAlpha;
    this.dropMaxAlpha = settings.dropMaxAlpha;

    // Partners configuration
    this.partners = settings.partners;

    // Alternate World Deny Messages
    this.noAlternateWorldMessages = settings.noAlternateWorldMessages;
    this.worldTransition = settings.worldTransition;
    this.worldTransitionSWidth = settings.worldTransitionSWidth;
    this.worldTransitionFrames = settings.worldTransitionFrames;
    this.worldTransitionSpeed = settings.worldTransitionSpeed;
    this.worldTransitionDone = false;

    // Configuration for point system
    this.points = 0;
    this.usePointSystem = settings.usePointSystem;
    
    this.loaded = true;
  }
}
