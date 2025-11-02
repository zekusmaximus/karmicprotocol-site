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
    this.jumpGravity = 700; // base gravity
    this.jumpImpulse = -300;

    // Variable jump tuning
    this.jumpHold = false;
    this.jumpHoldTime = 0;
    this.jumpHoldMax = 0.18; // seconds of low-gravity sustain
    this.lowGravity = 420; // while holding within window
    this.fallGravity = 950; // faster fall
    this.releaseCutVel = -120; // clamp upward speed on early release

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
    this.jumpHold = true;
    this.jumpHoldTime = 0;
  }

  update(dt, groundY) {
    if (this.state !== 'JUMP') return;
    // Choose gravity based on hold + phase of jump
    let g = this.jumpGravity;
    if (this.vy < 0) {
      // moving up
      if (this.jumpHold && this.jumpHoldTime < this.jumpHoldMax) {
        g = this.lowGravity;
        this.jumpHoldTime += dt;
      } else if (!this.jumpHold) {
        // cut jump early
        if (this.vy < this.releaseCutVel) this.vy = this.releaseCutVel;
        g = this.jumpGravity;
      }
    } else {
      // falling
      g = this.fallGravity;
    }

    this.vy += g * dt;
    this.sprite.y += this.vy * dt;
    if (this.sprite.y >= groundY) {
      this.sprite.y = groundY;
      this.vy = 0;
      this.state = 'IDLE';
      this.jumpHold = false;
      this.jumpHoldTime = 0;
    }
  }

  hitstun() {
    this.state = 'HITSTUN';
  }

  // Keyboard/touch: start and release control for variable jump
  startJump() {
    if (this.state !== 'JUMP') {
      this.jump();
    } else {
      this.jumpHold = true;
    }
  }

  releaseJump() {
    this.jumpHold = false;
  }
}
