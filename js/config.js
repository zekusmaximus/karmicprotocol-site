/**
 * Game Configuration
 * Central configuration file to eliminate magic numbers and provide context
 */

export const GAME_CONFIG = {
  // Spawning configuration
  SPAWNING: {
    INITIAL_INTERVAL: 1300,      // ms - Initial spawn interval
    MIN_INTERVAL: 850,            // ms - Minimum spawn interval
    DECREASE_PER_TIER: 40,        // ms - Decrease per difficulty tier
    DECREASE_BASE: 30             // ms - Base decrease rate
  },

  // Input configuration
  INPUT: {
    SWIPE_THRESHOLD: 40,          // pixels - Minimum swipe distance
    SWIPE_TIME_MAX: 500,          // ms - Maximum time for swipe gesture
    TAP_TOLERANCE: 12,            // pixels - Movement tolerance for tap
    NEAR_MISS_WINDOW: 42          // pixels - Near miss detection window
  },

  // Combo system configuration
  COMBO: {
    TIMEOUT: 3.0,                 // seconds - Time before combo breaks
    MULTIPLIER_PER_LEVEL: 0.1     // +10% per combo level
  },

  // Phase mode configuration
  PHASE_MODE: {
    DURATION: 3.0,                // seconds - Phase mode duration
    PARTICLE_INTERVAL: 50,        // ms - Particle spawn interval
    QUANTUM_FIELD_REPEATS: 59     // Number of quantum field effects
  },

  // Visual effects configuration
  EFFECTS: {
    PARTICLE_INTENSITY: 1.0,      // 0.0 to 1.0 - Particle system intensity
    BACKGROUND_ANIMATION: true,   // Enable/disable background animations
    TOUCH_FEEDBACK: true,         // Enable/disable touch feedback
    SCREEN_SHAKE: true            // Enable/disable screen shake
  },

  // Performance configuration
  PERFORMANCE: {
    TARGET_FPS: 60,               // Target frame rate
    PARTICLE_POOL_MAX: 100,       // Maximum pooled particles
    OBSTACLE_POOL_MAX: 50,        // Maximum pooled obstacles
    LOW_BATTERY_THRESHOLD: 0.2    // Battery level for low power mode
  },

  // Animation durations
  ANIMATIONS: {
    SCORE_COUNT_DURATION: 500,    // ms - Score counter animation
    MENU_TRANSITION: 300,         // ms - Menu transition duration
    PANEL_TRANSITION: 400,        // ms - Panel transition duration
    TOUCH_FEEDBACK: 300,          // ms - Touch feedback animation
    GLITCH_INTERVAL: 300          // ms - Glitch effect interval
  },

  // HUD configuration
  HUD: {
    UPDATE_INTERVAL: 16,          // ms - HUD update frequency (60fps)
    SCORE_DECIMAL_PLACES: 0,      // Decimal places for score display
    FLOW_DECIMAL_PLACES: 1        // Decimal places for flow multiplier
  },

  // Accessibility configuration
  ACCESSIBILITY: {
    SCREEN_READER_ENABLED: true,  // Enable screen reader announcements
    COLOR_BLIND_MODE: false,      // Color-blind friendly mode
    HIGH_CONTRAST: false,         // High contrast mode
    REDUCED_MOTION: false         // Reduced motion mode
  },

  // Mobile configuration
  MOBILE: {
    TOUCH_ZONE_HEIGHT: 0.4,       // % of screen height for touch zones
    SWIPE_INDICATOR_TIMEOUT: 5000 // ms - Time to hide swipe indicators
  }
};

// Performance modes
export const PERFORMANCE_MODES = {
  HIGH: {
    particleIntensity: 1.0,
    backgroundAnimation: true,
    audioQuality: 'high'
  },
  MEDIUM: {
    particleIntensity: 0.7,
    backgroundAnimation: true,
    audioQuality: 'medium'
  },
  LOW: {
    particleIntensity: 0.5,
    backgroundAnimation: false,
    audioQuality: 'low'
  }
};

// Game states
export const GameStates = {
  LOADING: 'loading',
  READY: 'ready',
  PLAYING: 'playing',
  PHASE_MODE: 'phase_mode',
  GAME_OVER: 'game_over',
  PAUSED: 'paused'
};
