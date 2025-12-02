# beAdventure Engine - TypeScript

A TypeScript-based point & click adventure game engine built with HTML5 Canvas.

Originally a pure JavaScript engine for point & click adventures, now modernized with TypeScript for better type safety and developer experience.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher)

### Installation

Install dependencies using pnpm:

```bash
pnpm install
```

### Development & Testing

Build and serve the game locally:

```bash
pnpm start
```

This will:
1. Compile TypeScript to JavaScript (ES2020 modules)
2. Compile SCSS to CSS
3. Copy assets to the `dist/` folder
4. Start a local server at `http://localhost:8080`

The game will open automatically in your browser.

### Individual Build Steps

If you need to run individual build steps:

```bash
# Compile TypeScript only
pnpm run compile

# Compile SCSS only
pnpm run compile:scss

# Copy assets only
pnpm run copy:assets

# Build everything
pnpm run build

# Serve the dist folder
pnpm run serve
```

### Type Checking

Run TypeScript type checking without building:

```bash
pnpm type-check
```

## 📁 Project Structure

```
beAdventureEngineTS/
├── src/
│   ├── assets/          # Game assets (copied to dist during build)
│   │   ├── fonts/
│   │   ├── images/
│   │   │   ├── maps/    # Map backgrounds (R/M/F layers)
│   │   │   └── ui/      # UI elements, characters, objects
│   │   ├── maps/        # Map JSON definitions
│   │   ├── minigames/
│   │   ├── musics/
│   │   ├── sounds/
│   │   └── settings.json
│   ├── css/
│   │   └── style.scss   # Main styles
│   ├── js/              # TypeScript modules
│   │   ├── engine.ts              # Main game loop and rendering
│   │   ├── settings.ts            # Game settings loader
│   │   ├── mathHelper.ts          # Math utilities
│   │   ├── soundsSystem.ts        # Audio management
│   │   ├── spriteManager.ts       # Sprite loading and management
│   │   ├── fontManager.ts         # Text rendering
│   │   ├── effectManager.ts       # Visual effects
│   │   ├── minigame.ts            # Base minigame class
│   │   ├── mapManager.ts          # Map loading and transitions
│   │   ├── mouseManager.ts        # Mouse interaction handling
│   │   └── interactableManager.ts # Game interactables logic
│   ├── types/
│   │   └── index.ts     # TypeScript type definitions
│   ├── index.html       # Entry HTML file
│   └── main.ts          # Application entry point
├── dist/                # Production build output
│   ├── assets/          # Copied game assets
│   ├── css/             # Compiled CSS
│   ├── js/              # Compiled JavaScript modules
│   ├── types/           # Type declarations
│   ├── main.js          # Compiled entry point
│   └── index.html       # HTML file
├── package.json
├── tsconfig.json        # TypeScript configuration
└── README.md
```

## 🔧 Technical Details

### Build System

The project uses a simple build pipeline without bundlers:
- **TypeScript Compiler**: Compiles `.ts` files to ES2020 modules with `.js` extensions
- **Sass**: Compiles SCSS to CSS
- **http-server**: Serves the game locally for testing

This approach preserves the original JavaScript behavior, including synchronous asset checking with `XMLHttpRequest`, which is important for the game's asset loading system.

### TypeScript Configuration

The `tsconfig.json` is configured for:
- ES2020 module output with Node resolution
- Strict type checking enabled
- Source maps for debugging
- Relative imports with `.js` extensions (required for ES modules without bundlers)

### Import Statements

All relative imports must include the `.js` extension, even in TypeScript files:

```typescript
import { Settings } from './settings.js';
import { SpriteManager } from './spriteManager.js';
```

This is required for ES modules to work properly when served directly without a bundler.

## 🎮 Game Engine Overview

### Core Systems

- **Engine**: Main game loop, rendering pipeline, and state management
- **SpriteManager**: Loads and manages all sprites with synchronous asset checking
- **MapManager**: Handles map loading, transitions, and camera system
- **InteractableManager**: Processes player interactions (look, take, talk, combine, etc.)
- **MouseManager**: Handles mouse input and cursor states
- **SoundSystem**: Audio playback for music and sound effects
- **FontManager**: Text rendering system
- **EffectManager**: Visual effects (fade, shake, etc.)

### Asset Loading

The engine uses a synchronous `XMLHttpRequest` approach to check if optional assets exist before loading them. This ensures the game doesn't get stuck waiting for missing files.

### Map System

Maps consist of:
- Background layers (Rear, Middle, Foreground)
- Animated characters
- Interactive objects
- Interactable zones with actions
- Spawn points and camera settings

## 📝 Development Status

### ✅ Fully Converted to TypeScript
- All core game systems
- Full type definitions
- Working map transitions
- Partner/companion system
- Inventory system
- Dialog system
- Question/answer system
- Minigame integration (Fallout-style hacking minigame)

### 🐛 Recent Bug Fixes
- Fixed Vite compatibility issues with synchronous asset checking
- Fixed map transition bugs (UI and characters now render correctly)
- Fixed partner animation bug (talking animations work properly)
- Fixed partner object collection (objects removed from screen correctly)
- Fixed question answer validation (numeric `valid` field instead of boolean)

## 🎯 Usage Example

```typescript
import { beAdventurousEngine } from './js/engine.js';
import { FalloutMinigame } from './assets/minigames/fallout-minigame/falloutMinigame.js';

// Initialize the game
const game = new beAdventurousEngine('game');

// Register minigames
game.registerMiniGame('FalloutMinigame', FalloutMinigame);

// Start from map 0
game.start(0);
```

## 📚 Original Documentation

For the original JavaScript engine, see the **[.pdf documentation](https://github.com/urz9999/beAdventureEngine/blob/main/beAdventurous%20Engine%201.0.pdf)** covering configuration, minigames, tutorials, and more.

---

# About the assets
To make a simple demo project and to speedup development I used many graphical resources I found on the Internet.
I'll try to give proper credit here for every resource I'm able to. 
If I've missed some, please, help me correct this.
This is a didactical, fun and hopefully useful project and none of these resources 
were used with any commercial intent.

### Font
[https://www.fontpalace.com/font-details/00-starmap-truetype/](https://www.fontpalace.com/font-details/00-starmap-truetype/)

### Opening Screen / Credit Screen
[https://www.artstation.com/pixeljeff1995](https://www.artstation.com/pixeljeff1995)

### Loading Screen
[https://pixpilgames.tumblr.com/](https://pixpilgames.tumblr.com/)

### Maps
[https://www.reddit.com/r/Cyberpunk/comments/d6jf4x/i_made_a_pixel_art_background_from_osaka_for/](https://www.reddit.com/r/Cyberpunk/comments/d6jf4x/i_made_a_pixel_art_background_from_osaka_for/)

[https://opengameart.org/content/cyberpunk-street-environment](https://opengameart.org/content/cyberpunk-street-environment)

### Sprites
[https://www.reddit.com/r/Terraria/comments/98o10w/all_terraria_potions_resprited/](https://www.reddit.com/r/Terraria/comments/98o10w/all_terraria_potions_resprited/)

[https://www.pinterest.it/pin/714946509587457586/](https://www.pinterest.it/pin/714946509587457586/)

[https://www.deviantart.com/cayiika/art/Dr-Nefarious-Pixel-Art-animated-668660087](https://www.deviantart.com/cayiika/art/Dr-Nefarious-Pixel-Art-animated-668660087)

[https://www.spriters-resource.com/pc_computer/cherrytreehighcomedyclub/sheet/51851/](https://www.spriters-resource.com/pc_computer/cherrytreehighcomedyclub/sheet/51851/)

[https://www.spriters-resource.com/neo_geo_ngcd/ms2/sheet/11231/](https://www.spriters-resource.com/neo_geo_ngcd/ms2/sheet/11231/)

