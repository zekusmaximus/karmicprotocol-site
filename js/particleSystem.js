/**
 * Enhanced Particle System with Object Pooling
 * Manages particle effects efficiently using object pooling
 */

import { GAME_CONFIG } from './config.js';

/**
 * Generic object pool for reusing objects
 */
export class ObjectPool {
  constructor(createFn, resetFn, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.available = [];
    this.active = new Set();
    this.maxSize = maxSize;
  }

  /**
   * Acquire an object from the pool
   * @returns {object} Pooled object
   */
  acquire() {
    let obj = this.available.pop() || this.createFn();
    this.active.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   * @param {object} obj - Object to release
   */
  release(obj) {
    if (!this.active.has(obj)) return;

    this.active.delete(obj);
    this.resetFn(obj);

    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Get count of active objects
   * @returns {number} Active object count
   */
  getActiveCount() {
    return this.active.size;
  }

  /**
   * Get count of available objects
   * @returns {number} Available object count
   */
  getAvailableCount() {
    return this.available.length;
  }

  /**
   * Clear all objects from pool
   */
  clear() {
    this.available = [];
    this.active.clear();
  }
}

/**
 * Individual particle
 */
class Particle {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.velocity = { x: 0, y: 0 };
    this.life = 0;
    this.maxLife = 1;
    this.dead = false;
  }

  reset(x, y, config = {}) {
    const {
      velocityX = 0,
      velocityY = 0,
      life = 1.0,
      color = 0xff66cc,
      size = 4,
      alpha = 1.0
    } = config;

    // Create sprite if needed
    if (!this.sprite) {
      this.sprite = this.scene.add.circle(x, y, size, color, alpha);
    } else {
      this.sprite.setPosition(x, y);
      this.sprite.setRadius(size);
      this.sprite.setFillStyle(color, alpha);
      this.sprite.setActive(true);
      this.sprite.setVisible(true);
    }

    this.velocity.x = velocityX;
    this.velocity.y = velocityY;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;

    // Update position
    this.sprite.x += this.velocity.x * dt;
    this.sprite.y += this.velocity.y * dt;

    // Update life
    this.life -= dt;

    // Fade out based on life remaining
    const lifeRatio = this.life / this.maxLife;
    this.sprite.alpha = lifeRatio;
    this.sprite.setScale(0.5 + lifeRatio * 0.5);

    // Check if dead
    if (this.life <= 0) {
      this.dead = true;
      this.sprite.setActive(false);
      this.sprite.setVisible(false);
    }
  }

  isDead() {
    return this.dead;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

/**
 * Main particle system
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particlePool = new ObjectPool(
      () => new Particle(scene),
      (particle) => particle.dead = true,
      GAME_CONFIG.PERFORMANCE.PARTICLE_POOL_MAX
    );
    this.activeParticles = [];
    this.intensity = GAME_CONFIG.EFFECTS.PARTICLE_INTENSITY;
  }

  /**
   * Spawn a single particle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} config - Particle configuration
   */
  spawnParticle(x, y, config = {}) {
    if (this.intensity <= 0) return;

    const particle = this.particlePool.acquire();
    particle.reset(x, y, config);
    this.activeParticles.push(particle);
  }

  /**
   * Spawn multiple particles in a burst
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} count - Number of particles
   * @param {object} config - Particle configuration
   */
  spawnBurst(x, y, count, config = {}) {
    const adjustedCount = Math.floor(count * this.intensity);

    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount;
      const speed = config.speed || 100;

      this.spawnParticle(x, y, {
        ...config,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed
      });
    }
  }

  /**
   * Spawn quantum particles (for phase mode)
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnQuantumParticles(x, y) {
    this.spawnBurst(x, y, 8, {
      life: 0.6,
      color: 0xaa44ff,
      size: 4,
      speed: 150,
      alpha: 0.8
    });
  }

  /**
   * Spawn near miss particles
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnNearMissParticles(x, y) {
    this.spawnBurst(x, y, 12, {
      life: 0.8,
      color: 0xff66cc,
      size: 3,
      speed: 120,
      alpha: 0.9
    });
  }

  /**
   * Spawn dodge particles
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnDodgeParticles(x, y) {
    this.spawnBurst(x, y, 6, {
      life: 0.5,
      color: 0x00ffff,
      size: 2,
      speed: 100,
      alpha: 0.7
    });
  }

  /**
   * Update all active particles
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.update(dt);

      if (particle.isDead()) {
        this.activeParticles.splice(i, 1);
        this.particlePool.release(particle);
      }
    }
  }

  /**
   * Set particle intensity (0.0 to 1.0)
   * @param {number} intensity - Particle intensity
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const particle of this.activeParticles) {
      this.particlePool.release(particle);
    }
    this.activeParticles = [];
  }

  /**
   * Destroy particle system
   */
  destroy() {
    this.clear();
    // Destroy all particle sprites
    for (const particle of this.particlePool.available) {
      particle.destroy();
    }
    for (const particle of this.particlePool.active) {
      particle.destroy();
    }
    this.particlePool.clear();
  }

  /**
   * Get statistics
   * @returns {object} Stats object
   */
  getStats() {
    return {
      active: this.activeParticles.length,
      pooled: this.particlePool.getAvailableCount(),
      total: this.activeParticles.length + this.particlePool.getAvailableCount()
    };
  }
}
