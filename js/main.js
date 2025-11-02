import { BootScene } from './bootScene.js';
import { PlayScene } from './playScene.js';
import { gameState } from './gameState.js';
import { LANE_COUNT, LANE_SPACING } from './constants.js';

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
      // Rows layout: lane spacing scales with height
      playScene.laneSpacing = LANE_SPACING * (innerHeight / 720);
      playScene.baseX = innerWidth * 0.30;
      playScene.groundY = innerHeight * 0.30; // top row baseline
      if (playScene.player) {
        const lane = playScene.playerController ? playScene.playerController.currentLane : 1;
        playScene.player.y = playScene.groundY + lane * playScene.laneSpacing;
        playScene.player.x = playScene.baseX;
      }
      if (Array.isArray(playScene.lanes)) {
        for (let i = 0; i < LANE_COUNT; i += 1) {
          const lane = playScene.lanes[i];
          if (lane) {
            lane.x = innerWidth / 2;
            lane.y = playScene.groundY + i * playScene.laneSpacing;
            lane.width = innerWidth;
            lane.height = 2;
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
