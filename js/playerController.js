import { LANE_COUNT } from './constants.js';

export class PlayerController {
  constructor(scene, sprite, laneYFor) {
    this.scene = scene;
    this.sprite = sprite;
    // laneYFor maps lane index to Y position
    this.laneYFor = laneYFor;
    this.state = 'IDLE';
    this.currentLane = 1;
    this.targetLane = 1;
    this.jumpVelocity = 0;
    this.baselineY = sprite.y; // Initialize to current Y position

    // Variable jump tuning - vertical hop
    this.jumpImpulse = -450; // Initial upward velocity (negative Y = up)
    this.jumpHold = false;
    this.jumpHoldTime = 0;
    this.jumpHoldMax = 0.18; // seconds of low-gravity sustain
    this.lowGravity = 1200; // Gentle rise while holding
    this.normalGravity = 1800; // Normal fall after release
    this.fastFallGravity = 2400; // Faster descent after peak
    this.jumpCutVelocity = -100; // Clamp upward speed on early release

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
    const targetY = this.laneYFor(clamped);

    this.scene.tweens.add({
      targets: this.sprite,
      y: targetY,
      duration: 120,
      ease: 'Sine.Out',
      onComplete: () => {
        this.currentLane = clamped;
        this.baselineY = targetY;
        if (this.state === 'LANE_MOVE') {
          this.state = 'IDLE';
        }
      },
    });
  }

  jump() {
    if (this.state === 'HITSTUN' || this.state === 'JUMP') return;
    this.state = 'JUMP';
    this.baselineY = this.sprite.y;
    this.jumpVelocity = this.jumpImpulse;
    this.jumpHold = true;
    this.jumpHoldTime = 0;
  }

  // Vertical jump - hop up and down over obstacles
  update(dt, _originX) {
    if (this.state !== 'JUMP') return;

    // Select gravity based on jump phase and hold state
    let gravity = this.normalGravity;

    if (this.jumpVelocity < 0) {
      // Rising phase
      if (this.jumpHold && this.jumpHoldTime < this.jumpHoldMax) {
        // Still holding jump - use low gravity for sustained rise
        gravity = this.lowGravity;
        this.jumpHoldTime += dt;
      } else if (!this.jumpHold) {
        // Released early - cut jump short by clamping velocity
        if (this.jumpVelocity < this.jumpCutVelocity) {
          this.jumpVelocity = this.jumpCutVelocity;
        }
        gravity = this.normalGravity;
      }
    } else {
      // Falling phase - use faster gravity
      gravity = this.fastFallGravity;
    }

    // Apply gravity and update position
    this.jumpVelocity += gravity * dt;
    this.sprite.y += this.jumpVelocity * dt;

    // Land when returning to or below baseline
    if (this.sprite.y >= this.baselineY) {
      this.sprite.y = this.baselineY;
      this.jumpVelocity = 0;
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
