/**
 * Game State Machine
 * Manages game state transitions and lifecycle
 */

import { GameStates } from './config.js';

// Base state class
class State {
  constructor(name) {
    this.name = name;
  }

  onEnter(data) {
    // Override in subclasses
  }

  onExit() {
    // Override in subclasses
  }

  update(delta) {
    // Override in subclasses
  }
}

// Loading state
class LoadingState extends State {
  constructor() {
    super(GameStates.LOADING);
  }

  onEnter(data) {
    console.log('[State] Entering LOADING');
  }

  onExit() {
    console.log('[State] Exiting LOADING');
  }
}

// Ready state (waiting for player to start)
class ReadyState extends State {
  constructor() {
    super(GameStates.READY);
  }

  onEnter(data) {
    console.log('[State] Entering READY');
    if (data?.scene) {
      data.scene.runActive = false;
    }
  }

  onExit() {
    console.log('[State] Exiting READY');
  }
}

// Playing state
class PlayingState extends State {
  constructor() {
    super(GameStates.PLAYING);
  }

  onEnter(data) {
    console.log('[State] Entering PLAYING');
    if (data?.scene) {
      data.scene.runActive = true;
      data.scene.gameOverFlag = false;
    }
  }

  onExit() {
    console.log('[State] Exiting PLAYING');
  }

  update(delta) {
    // Game loop logic can be coordinated here
  }
}

// Phase mode state
class PhaseModeState extends State {
  constructor() {
    super(GameStates.PHASE_MODE);
  }

  onEnter(data) {
    console.log('[State] Entering PHASE_MODE');
    if (data?.scene) {
      data.scene.isInPhaseMode = true;
    }
  }

  onExit() {
    console.log('[State] Exiting PHASE_MODE');
    if (this.scene) {
      this.scene.isInPhaseMode = false;
    }
  }
}

// Game over state
class GameOverState extends State {
  constructor() {
    super(GameStates.GAME_OVER);
  }

  onEnter(data) {
    console.log('[State] Entering GAME_OVER');
    if (data?.scene) {
      data.scene.runActive = false;
      data.scene.gameOverFlag = true;
    }
  }

  onExit() {
    console.log('[State] Exiting GAME_OVER');
  }
}

// Paused state
class PausedState extends State {
  constructor() {
    super(GameStates.PAUSED);
  }

  onEnter(data) {
    console.log('[State] Entering PAUSED');
    if (data?.scene) {
      data.scene.physics?.pause();
    }
  }

  onExit() {
    console.log('[State] Exiting PAUSED');
    if (this.scene) {
      this.scene.physics?.resume();
    }
  }
}

// Main state machine
export class GameStateMachine {
  constructor() {
    this.currentState = null;
    this.states = {
      [GameStates.LOADING]: new LoadingState(),
      [GameStates.READY]: new ReadyState(),
      [GameStates.PLAYING]: new PlayingState(),
      [GameStates.PHASE_MODE]: new PhaseModeState(),
      [GameStates.GAME_OVER]: new GameOverState(),
      [GameStates.PAUSED]: new PausedState()
    };
    this.stateData = {};
    this.transitionCallbacks = [];
  }

  /**
   * Initialize the state machine
   * @param {string} initialState - Initial state name
   * @param {object} data - Initial state data
   */
  init(initialState, data = {}) {
    this.stateData = data;
    this.transition(initialState, data);
  }

  /**
   * Transition to a new state
   * @param {string} toState - Target state name
   * @param {object} data - State transition data
   */
  transition(toState, data = {}) {
    if (!this.states[toState]) {
      console.error(`[StateMachine] Invalid state: ${toState}`);
      return;
    }

    const fromState = this.currentState?.name;

    // Exit current state
    if (this.currentState) {
      this.currentState.onExit();
    }

    // Transition to new state
    this.currentState = this.states[toState];
    this.stateData = { ...this.stateData, ...data };

    // Enter new state
    this.currentState.onEnter(this.stateData);

    // Notify listeners
    this.#notifyTransition(fromState, toState, data);
  }

  /**
   * Update current state
   * @param {number} delta - Time delta in seconds
   */
  update(delta) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(delta);
    }
  }

  /**
   * Get current state name
   * @returns {string} Current state name
   */
  getCurrentState() {
    return this.currentState?.name;
  }

  /**
   * Check if in a specific state
   * @param {string} stateName - State name to check
   * @returns {boolean} True if in the specified state
   */
  isInState(stateName) {
    return this.currentState?.name === stateName;
  }

  /**
   * Register a callback for state transitions
   * @param {function} callback - Callback function (fromState, toState, data) => {}
   */
  onTransition(callback) {
    this.transitionCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of a state transition
   * @private
   */
  #notifyTransition(fromState, toState, data) {
    this.transitionCallbacks.forEach(callback => {
      try {
        callback(fromState, toState, data);
      } catch (error) {
        console.error('[StateMachine] Error in transition callback:', error);
      }
    });
  }
}
