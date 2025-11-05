import { LANE_COUNT, PLAYER_MOVE_SPEED } from './constants.js';

export class PlayerController {
  constructor(scene, sprite, laneYFor) {
    this.scene = scene;
    this.sprite = sprite;
    // laneYFor maps lane index to Y position
    this.laneYFor = laneYFor;
    this.state = 'IDLE';
    this.currentLane = 2; // Start in middle lane (0-indexed, so lane 2 of 6)
    this.targetLane = 2;

    // Movement speed
    this.moveSpeed = PLAYER_MOVE_SPEED;

    // X bounds for left/right movement
    this.minX = 0;
    this.maxX = 0;

    scene.physics.add.existing(sprite);
    sprite.body.setAllowGravity(false);
    sprite.body.setCircle(12, 4, 12);
  }

  setBounds(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
  }

  setLane(laneIndex) {
    if (this.state === 'HITSTUN') return;
    const clamped = Phaser.Math.Clamp(laneIndex, 0, LANE_COUNT - 1);
    if (clamped === this.currentLane && !this.scene.tweens.isTweening(this.sprite)) return;

    this.targetLane = clamped;
    this.currentLane = clamped;
    const targetY = this.laneYFor(clamped);

    // Play whoosh sound on lane switch
    this.scene.audio.whoosh();

    // Quick lane switch
    this.scene.tweens.add({
      targets: this.sprite,
      y: targetY,
      duration: 100,
      ease: 'Sine.Out',
    });
  }

  moveUp() {
    this.setLane(this.currentLane - 1);
  }

  moveDown() {
    this.setLane(this.currentLane + 1);
  }

  update(dt, input) {
    if (this.state === 'HITSTUN') return;

    // Handle left/right movement
    let moveX = 0;
    if (input.left) {
      moveX = -this.moveSpeed * dt;
    }
    if (input.right) {
      moveX = this.moveSpeed * dt;
    }

    // Apply movement and clamp to bounds
    if (moveX !== 0) {
      this.sprite.x += moveX;
      this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.minX, this.maxX);
    }
  }

  hitstun() {
    this.state = 'HITSTUN';
  }

  reset(x, y) {
    this.sprite.x = x;
    this.sprite.y = y;
    this.currentLane = 2;
    this.targetLane = 2;
    this.state = 'IDLE';
  }
}
