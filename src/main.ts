import { FalloutMinigame } from './assets/minigames/fallout-minigame/falloutMinigame';
import { beAdventurousEngine } from './js/engine';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new beAdventurousEngine('game');
  
  // Register minigames
  game.registerMiniGame('FalloutMinigame', FalloutMinigame);
  
  // Start the game
  game.start(0);
});

// Make it available globally if needed for debugging
(window as any).game = { beAdventurousEngine };
