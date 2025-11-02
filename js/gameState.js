class GameState {
  constructor() {
    this.state = 'loading';
    this.playScene = null;

    this.hudEl = document.getElementById('hud');
    this.overlays = {
      loading: document.getElementById('overlay-loading'),
      start: document.getElementById('overlay-start'),
      gameover: document.getElementById('overlay-gameover'),
    };

    this.loadingMessageEl = document.getElementById('loading-message');
    this.errorEl = document.getElementById('status-error');
    this.finalStatsEl = document.getElementById('final-stats');
    this.startButton = document.getElementById('btn-start');
    this.restartButton = document.getElementById('btn-restart');

    this.startButton.addEventListener('click', () => {
      void this.start();
    });

    this.restartButton.addEventListener('click', () => {
      void this.restart();
    });

    window.addEventListener(
      'keydown',
      (event) => {
        if (
          (event.code === 'Space' || event.code === 'Enter') &&
          !this.overlays.start.classList.contains('hidden')
        ) {
          event.preventDefault();
          void this.start();
        }
      },
      { passive: false },
    );
  }

  showLoading(message) {
    if (message) {
      this.loadingMessageEl.textContent = message;
    }
    this.setState('loading');
  }

  finishLoading() {
    if (this.state === 'loading') {
      this.setState('ready');
    }
  }

  attachScene(scene) {
    this.playScene = scene;
    this.finishLoading();
  }

  async start() {
    this.clearError();
    if (!this.playScene) {
      return;
    }
    try {
      await this.playScene.beginRun();
      this.setState('playing');
    } catch (error) {
      this.handleError('Unable to start the run. Please try again.', error);
    }
  }

  async restart() {
    this.clearError();
    if (!this.playScene) {
      return;
    }
    try {
      await this.playScene.restartRun();
      this.setState('playing');
    } catch (error) {
      this.handleError('Unable to restart the run. Please reload the page.', error);
    }
  }

  gameOver(summary) {
    if (typeof summary === 'string') {
      this.finalStatsEl.textContent = summary;
    }
    this.setState('gameover');
  }

  setState(nextState) {
    this.state = nextState;
    const show = (element, visible) => {
      if (!element) return;
      element.classList.toggle('hidden', !visible);
    };

    show(this.overlays.loading, nextState === 'loading');
    show(this.overlays.start, nextState === 'ready');
    show(this.overlays.gameover, nextState === 'gameover');

    if (this.hudEl) {
      const hideHud = nextState === 'loading';
      this.hudEl.classList.toggle('hidden', hideHud);
    }
  }

  handleError(message, error) {
    console.error(message, error);
    if (this.errorEl) {
      this.errorEl.textContent = message;
      this.errorEl.classList.remove('hidden');
    }
    this.setState('ready');
  }

  clearError() {
    if (this.errorEl) {
      this.errorEl.textContent = '';
      this.errorEl.classList.add('hidden');
    }
  }
}

export const gameState = new GameState();
