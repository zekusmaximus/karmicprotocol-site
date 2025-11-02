import { LANE_COUNT } from './constants.js';

export class PlayerController {
  constructor(scene, sprite, laneXFor) {
    this.scene = scene;
    this.sprite = sprite;
    // laneXFor now represents lane-to-Y mapping in row layout
    this.laneXFor = laneXFor;
    this.state = 'IDLE';
    this.currentLane = 1;
    this.targetLane = 1;
    this.vy = 0;
    this.jumpGravity = -700; // base drag (affects lateral hop)
    this.jumpImpulse = 300; // forward impulse along X

    // Variable jump tuning
    this.jumpHold = false;
    this.jumpHoldTime = 0;
    this.jumpHoldMax = 0.18; // seconds of low-gravity sustain
    this.lowGravity = -420; // while holding within window
    this.fallGravity = -950; // faster return
    this.releaseCutVel = 120; // clamp forward speed on early release

    scene.physics.add.existing(sprite);
    sprite.body.setAllowGravity(false);
    sprite.body.setCircle(12, 4, 12);
  }

  setLane(laneIndex) {
    if (this.state === 'HITSTUN') return;
    const clamped = Phaser.Math.Clamp(laneIndex, 0, LANE_COUNT - 1);
    if (clamped === this.currentLane) return;

    this.targetLane = clamped;
    const wasJumping = this.state === 'JUMP';
    if (!wasJumping) this.state = 'LANE_MOVE';
    const y = this.laneXFor(clamped);

    this.scene.tweens.add({
      targets: this.sprite,
      y,
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

  // In row layout, jump is a lateral hop along X around a baseline (originX)
  update(dt, originX) {
    if (this.state !== 'JUMP') return;
    // Use the same variable-jump timing to control hop distance
    let g = this.jumpGravity;
    if (this.vy > 0) {
      // moving forward
      if (this.jumpHold && this.jumpHoldTime < this.jumpHoldMax) {
        g = this.lowGravity;
        this.jumpHoldTime += dt;
      } else if (!this.jumpHold) {
        // cut hop early: cap forward velocity
        if (this.vy > this.releaseCutVel) this.vy = this.releaseCutVel;
        g = this.jumpGravity;
      }
    } else {
      // returning back toward baseline
      g = this.fallGravity;
    }

    this.vy += g * dt;
    this.sprite.x += this.vy * dt;
    if (this.sprite.x <= originX) {
      this.sprite.x = originX;
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
