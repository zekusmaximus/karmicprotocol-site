import { LANE_COUNT } from './constants.js';

export class PlayerController {
  constructor(scene, sprite, laneXFor) {
    this.scene = scene;
    this.sprite = sprite;
    this.laneXFor = laneXFor;
    this.state = 'IDLE';
    this.currentLane = 1;
    this.targetLane = 1;
    this.vy = 0;
    this.jumpGravity = 500;
    this.jumpImpulse = -300;

    scene.physics.add.existing(sprite);
    sprite.body.setAllowGravity(false);
    sprite.body.setCircle(12, 4, 12);
  }

  setLane(laneIndex) {
    if (this.state === 'HITSTUN') return;
    const clamped = Phaser.Math.Clamp(laneIndex, 0, LANE_COUNT - 1);
    if (clamped === this.currentLane) return;

    this.targetLane = clamped;
    this.state = 'LANE_MOVE';
    const x = this.laneXFor(clamped);

    this.scene.tweens.add({
      targets: this.sprite,
      x,
      duration: 120,
      ease: 'Sine.Out',
      onComplete: () => {
        this.currentLane = clamped;
        if (this.state === 'LANE_MOVE') {
          this.state = 'IDLE';
        }
      },
    });
  }

  jump() {
    if (this.state === 'HITSTUN' || this.state === 'JUMP') return;
    this.state = 'JUMP';
    this.vy = this.jumpImpulse;
  }

  update(dt, groundY) {
    if (this.state !== 'JUMP') return;
    this.vy += this.jumpGravity * dt;
    this.sprite.y += this.vy * dt;
    if (this.sprite.y >= groundY) {
      this.sprite.y = groundY;
      this.vy = 0;
      this.state = 'IDLE';
    }
  }

  hitstun() {
    this.state = 'HITSTUN';
  }
}
