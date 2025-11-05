import { AudioManager } from './audioManager.js';
import { PlayerController } from './playerController.js';
import { gameState } from './gameState.js';
import { BASE_SPEED, LANE_COUNT, LANE_SPACING, PLAYER_Y_RATIO } from './constants.js';

const scoreEl = document.getElementById('score');
const flowEl = document.getElementById('flow');
const tierEl = document.getElementById('tier');
const distEl = document.getElementById('dist');

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('Play');
    this.audio = new AudioManager();
    this.seed = this.#dailySeed();
    this.rng = makeRng(this.seed);

    this.score = 0;
    this.flow = 1.0;
    this.flowMax = 5.0;
    this.isInPhaseMode = false;
    this.distance = 0;
    this.tier = 1;
    this.worldSpeed = BASE_SPEED;

    this.spawnTimer = 0;
    this.spawnInterval = 1300;
    this.nearMissWindow = 42;
    this.gameOverFlag = false;
    this.runActive = false;

    this.activeObstacles = [];
    this.activeHardAir = [];

    this.gestureActiveId = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartT = 0;
    this.swipeThreshold = 40;
    this.swipeTimeMax = 500;
    this.tapMoveTolerance = 12;
  }

  create() {
    try {
      this.cameras.main.setBackgroundColor('#0a0a0a');
      this.physics.world.setBounds(0, 0, innerWidth, innerHeight);

      this.laneSpacing = LANE_SPACING * (innerHeight / 720);
      this.baseX = innerWidth * 0.25; // Start player 25% from left
      this.groundY = innerHeight * 0.25; // Start lanes 25% from top

      // Set player movement bounds (can move in middle 60% of screen width)
      this.playerMinX = innerWidth * 0.15;
      this.playerMaxX = innerWidth * 0.75;

      this.#createProceduralTextures();
      this.#createBackground();
      this.#createLanes();
      this.#createPlayer();
      this.#createPools();
      this.#initPhysics();
      this.#initInput();

      this.timeSinceStart = 0;
      this.lastTierUp = 0;
      this.runActive = false;

      this.resetRun();
      gameState.attachScene(this);
    } catch (error) {
      gameState.handleError('Failed to initialise the scene.', error);
    }
  }

  async beginRun() {
    try {
      await this.audio.start();
      this.audio.setTier(this.tier);
    } catch (error) {
      throw new Error(error?.message || 'Audio initialisation failed.');
    }

    this.gameOverFlag = false;
    this.runActive = true;
    this.resetRun();
  }

  async restartRun() {
    await this.beginRun();
  }

  resetRun() {
    this.activeObstacles.forEach((o) => this.#recycleObstacle(o));
    this.activeObstacles.length = 0;
    this.activeHardAir.forEach((o) => this.#recycleHardAir(o));
    this.activeHardAir.length = 0;

    this.score = 0;
    this.flow = 1.0;
    this.isInPhaseMode = false;
    this.distance = 0;
    this.tier = 1;
    this.worldSpeed = BASE_SPEED;
    this.spawnInterval = 1300;
    this.spawnTimer = 0;
    this.timeSinceStart = 0;
    this.lastTierUp = 0;

    if (this.playerController) {
      this.playerController.reset(this.baseX, this.#laneY(2));
    }

    this.audio.setTier(this.tier);
    this.#updateHUD();
  }

  update(_time, deltaMs) {
    if (!this.runActive || this.gameOverFlag) {
      return;
    }

    const dt = Math.min(0.05, deltaMs / 1000);
    this.timeSinceStart += dt;

    // Handle up/down lane switching (just down events)
    const up = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W);
    const down = Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.S);

    if (up) this.playerController.moveUp();
    if (down) this.playerController.moveDown();

    // Handle left/right movement (held keys for continuous movement)
    const input = {
      left: this.cursors.left.isDown || this.keys.A.isDown,
      right: this.cursors.right.isDown || this.keys.D.isDown,
    };

    this.playerController.update(dt, input);

    for (const dot of this.bgDots) {
      dot.x -= (this.worldSpeed * 0.25) * dt;
      if (dot.x < -10) {
        dot.x = innerWidth + 10;
        dot.y = Math.random() * innerHeight;
      }
    }

    if (this.timeSinceStart - this.lastTierUp > 20 && this.tier < 4) {
      this.tier += 1;
      this.lastTierUp = this.timeSinceStart;
      this.audio.setTier(this.tier);
      this.#pulseHUD();
    }

    this.spawnTimer += dt * 1000;
    if (this.spawnTimer >= this.spawnInterval) {
      this.#spawnPattern(this.tier);
      this.spawnTimer = 0;
      this.spawnInterval = Math.max(850, this.spawnInterval - (30 + 10 * this.tier));
    }

    const velocity = this.worldSpeed * dt;
    for (let i = this.activeObstacles.length - 1; i >= 0; i -= 1) {
      const sprite = this.activeObstacles[i];
      sprite.x -= velocity;

      // Award points for passing obstacles
      if (sprite.x < -100) {
        this.#recycleObstacle(sprite);
        this.activeObstacles.splice(i, 1);
        this.#addScore(10);
      }
    }

    for (let i = this.activeHardAir.length - 1; i >= 0; i -= 1) {
      const sprite = this.activeHardAir[i];
      sprite.x -= velocity;
      if (sprite.x < -100) {
        this.#recycleHardAir(sprite);
        this.activeHardAir.splice(i, 1);
      }
    }

    this.distance += this.worldSpeed * dt * 0.05;
    this.#updateHUD();
  }

  #dailySeed() {
    const d = new Date();
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  #createBackground() {
    this.bgDots = [];
    for (let i = 0; i < 24; i += 1) {
      const rect = this.add.rectangle(
        Math.random() * innerWidth * 2,
        Math.random() * innerHeight,
        1 + Math.random() * 3,
        1 + Math.random() * 3,
        0x003322,
        0.22,
      );
      this.bgDots.push(rect);
    }
  }

  #createLanes() {
    this.lanes = [];
    for (let i = 0; i < LANE_COUNT; i += 1) {
      const y = this.#laneY(i);
      const lane = this.add.rectangle(innerWidth / 2, y, innerWidth, 2, 0x003322, 0.3);
      lane.setVisible(true);
      this.lanes.push(lane);
    }
  }

  #createPlayer() {
    this.player = this.add.sprite(this.baseX, this.#laneY(2), 'player').setScale(1);
    this.playerController = new PlayerController(this, this.player, (i) => this.#laneY(i));
    this.playerController.setBounds(this.playerMinX, this.playerMaxX);
  }

  #createPools() {
    this.obstacleGroup = this.add.group({ classType: Phaser.GameObjects.Sprite, runChildUpdate: false });
    this.hardAirGroup = this.add.group({ classType: Phaser.GameObjects.Sprite, runChildUpdate: false });
    this.activeObstacles = [];
    this.activeHardAir = [];
  }

  #initPhysics() {
    this.physics.add.overlap(this.player, this.obstacleGroup, this.#onHit, null, this);
    this.physics.add.overlap(this.player, this.hardAirGroup, this.#onHit, null, this);
  }

  #initInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,S,A,D');
    this.#initGestures();
  }

  #initGestures() {
    this.input.topOnly = true;

    this.input.on('pointerdown', (pointer) => {
      if (this.gestureActiveId !== null) return;
      this.gestureActiveId = pointer.id;
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.touchStartT = performance.now();
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.id !== this.gestureActiveId) return;
      const dx = pointer.x - this.touchStartX;
      const dy = pointer.y - this.touchStartY;
      const dt = performance.now() - this.touchStartT;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Swipe up/down for lane change
      if (absY >= this.swipeThreshold && absY > absX && dt <= this.swipeTimeMax) {
        if (dy < 0) {
          this.playerController.moveUp();
        } else {
          this.playerController.moveDown();
        }
      }
      this.gestureActiveId = null;
    });

    const cancelPointer = (pointer) => {
      if (pointer.id === this.gestureActiveId) {
        this.gestureActiveId = null;
      }
    };

    this.input.on('pointerout', cancelPointer);
    this.input.on('pointercancel', cancelPointer);
  }

  #spawnPattern(tier) {
    // Simpler patterns for 6 lanes - spawn obstacles in random lanes at varied intervals
    const numObstacles = Math.min(1 + Math.floor(tier / 2), 4); // 1-4 obstacles based on tier
    const baseX = innerWidth + 60;

    // Randomly select lanes for obstacles
    const availableLanes = [0, 1, 2, 3, 4, 5];
    const selectedLanes = Phaser.Utils.Array.Shuffle(availableLanes).slice(0, numObstacles);

    for (const laneIndex of selectedLanes) {
      // Randomize X position slightly for variety
      const spawnX = baseX + (this.rng() * 100 - 50);
      const obstacle = this.#getObstacle(spawnX, laneIndex);
      this.activeObstacles.push(obstacle);
    }
  }

  #getObstacle(x, lane) {
    let sprite = this.obstacleGroup.getFirstDead();
    if (!sprite) {
      sprite = this.add.sprite(x, this.groundY, 'obstacle');
      this.obstacleGroup.add(sprite);
      this.physics.add.existing(sprite);
      sprite.body.setImmovable(true);
      sprite.body.setAllowGravity(false);
    }
    sprite.setActive(true).setVisible(true);
    sprite.x = x;
    sprite.y = this.#laneY(lane);
    sprite.lane = lane;
    // Fully visible obstacle - no ghost effect
    sprite.setAlpha(1.0);
    sprite.clearTint();
    sprite.body.setSize(18, 18, true);
    sprite.body.setEnable(true);
    return sprite;
  }

  #recycleObstacle(sprite) {
    sprite.setActive(false).setVisible(false);
    sprite.body.setEnable(false);
    sprite.setAlpha(0);
  }

  #getHardAir(x, lane) {
    let sprite = this.hardAirGroup.getFirstDead();
    if (!sprite) {
      sprite = this.add.sprite(x, this.groundY, 'hard-air');
      this.hardAirGroup.add(sprite);
      this.physics.add.existing(sprite);
      sprite.body.setImmovable(true);
      sprite.body.setAllowGravity(false);
    }

    sprite.setActive(true).setVisible(true);
    sprite.x = x;
    // Tall lane wall on the row; center on row Y
    sprite.y = this.#laneY(lane);
    sprite.lane = lane;
    sprite.setAlpha(0.7);
    // Scale collision and visual to lane spacing
    const hardAirHeight = this.laneSpacing * 0.85;
    sprite.body.setSize(40, hardAirHeight, true);
    sprite.setDisplaySize(48, hardAirHeight);
    sprite.body.setEnable(true);
    return sprite;
  }

  #recycleHardAir(sprite) {
    sprite.setActive(false).setVisible(false);
    if (sprite.body) {
      sprite.body.setEnable(false);
    }
  }

  #onHit(player, obstacle) {
    if (this.gameOverFlag) return;
    this.#hitFeedback();
    this.playerController.hitstun();
    this.#gameOver();
  }

  #hitFeedback() {
    this.time.timeScale = 0.05;
    this.cameras.main.shake(160, 0.004);
    this.audio.hit();
    this.time.delayedCall(110, () => {
      this.time.timeScale = 1;
    });
  }

  #updateHUD() {
    scoreEl.textContent = Math.floor(this.score);
    flowEl.textContent = `${this.flow.toFixed(1)}×`;
    tierEl.textContent = this.tier;
    distEl.textContent = `${Math.floor(this.distance)}m`;
  }

  #pulseHUD() {
    tierEl.style.color = '#00ff88';
    tierEl.style.textShadow = '0 0 8px rgba(0,255,136,.6)';
    setTimeout(() => {
      tierEl.style.color = '';
      tierEl.style.textShadow = '';
    }, 400);
  }

  #addScore(value) {
    this.score += value * this.flow;
  }

  #laneY(index) {
    return this.groundY + index * this.laneSpacing;
  }

  #createProceduralTextures() {
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0x00ff88);
    g.fillRoundedRect(0, 0, 32, 48, 8);
    g.fillStyle(0x003322);
    g.fillRoundedRect(4, 12, 24, 20, 4);
    g.fillStyle(0x001100);
    g.fillCircle(16, 32, 6);
    g.generateTexture('player', 32, 48);
    g.clear();
    g.fillStyle(0xff0088);
    g.fillRoundedRect(0, 0, 24, 24, 4);
    g.fillStyle(0x440022);
    g.fillRoundedRect(2, 2, 20, 20, 2);
    g.generateTexture('obstacle', 24, 24);
    g.destroy();

    const gAir = this.add.graphics();
    const airW = 48;
    const airH = 32;
    gAir.fillStyle(0x445566, 0.4);
    gAir.fillRect(0, 0, airW, airH);
    gAir.lineStyle(1, 0x99aabb, 0.6);
    for (let i = 0; i < airH; i += 4) {
      gAir.strokePoints([
        { x: 0, y: i + (Math.random() * 4 - 2) },
        { x: airW, y: i + (Math.random() * 4 - 2) },
      ]);
    }
    gAir.generateTexture('hard-air', airW, airH);
    gAir.destroy();
  }

  #gameOver() {
    this.gameOverFlag = true;
    this.runActive = false;
    const summary = `Score ${Math.floor(this.score)} • Tier ${this.tier} • Distance ${Math.floor(this.distance)}m`;
    gameState.gameOver(summary);
  }
}
