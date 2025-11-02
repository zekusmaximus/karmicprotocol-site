import { gameState } from './gameState.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    gameState.showLoading('Loading assets…');
    this.load.on('loaderror', (file) => {
      gameState.handleError(`Failed to load asset: ${file.key}`, new Error('Asset load error'));
    });
  }

  create() {
    gameState.finishLoading();
    this.scene.start('Play');
  }
}
