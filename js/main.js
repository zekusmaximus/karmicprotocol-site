import { BootScene } from './bootScene.js';
import { PlayScene } from './playScene.js';
import { gameState } from './gameState.js';
import { LANE_COUNT, LANE_SPACING, PLAYER_Y_RATIO } from './constants.js';

gameState.showLoading('Booting simulation…');

let gameInstance = null;

try {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0a0a0a',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [BootScene, PlayScene],
    parent: 'game-container',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  };

  gameInstance = new Phaser.Game(config);
} catch (error) {
  gameState.handleError('Unable to start the game engine.', error);
}

const handleResize = () => {
  if (!gameInstance) return;
  try {
    gameInstance.scale.resize(window.innerWidth, window.innerHeight);
    const playScene = gameInstance.scene.getScene('Play');
    if (playScene) {
      playScene.laneSpacing = LANE_SPACING * (innerWidth / 1280);
      playScene.baseX = innerWidth * 0.30;
      playScene.groundY = innerHeight * PLAYER_Y_RATIO;
      if (playScene.player) {
        playScene.player.y = playScene.groundY;
      }
      if (Array.isArray(playScene.lanes)) {
        for (let i = 0; i < LANE_COUNT; i += 1) {
          const lane = playScene.lanes[i];
          if (lane) {
            lane.x = playScene.baseX + i * playScene.laneSpacing;
            lane.y = playScene.groundY;
          }
        }
      }
    }
  } catch (error) {
    gameState.handleError('An error occurred while resizing the game.', error);
  }
};

window.addEventListener('resize', handleResize, { passive: true });

document.addEventListener(
  'contextmenu',
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

window.addEventListener('unhandledrejection', (event) => {
  gameState.handleError('An unexpected error occurred.', event.reason);
});

window.addEventListener('error', (event) => {
  gameState.handleError('An unexpected error occurred.', event.error || event.message);
});
