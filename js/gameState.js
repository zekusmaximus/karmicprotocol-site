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
    this.finalScoreEl = document.getElementById('final-score');
    this.statsBreakdownEl = document.getElementById('stats-breakdown');
    this.highScoresEl = document.getElementById('high-scores');
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

  gameOver(score, stats, tier, distance) {
    // Display final score
    this.finalScoreEl.textContent = `${Math.floor(score).toLocaleString()} points`;

    // Display stats breakdown
    const minutes = Math.floor(stats.timeAlive / 60);
    const seconds = Math.floor(stats.timeAlive % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.statsBreakdownEl.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Time Survived</span>
        <span class="stat-value">${timeStr}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Obstacles Dodged</span>
        <span class="stat-value">${stats.obstaclesDodged}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Near-Misses</span>
        <span class="stat-value">${stats.nearMisses}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Max Combo</span>
        <span class="stat-value">${stats.maxCombo}x</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Phase Modes</span>
        <span class="stat-value">${stats.phaseModesTriggered}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Final Tier</span>
        <span class="stat-value">${tier}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Distance</span>
        <span class="stat-value">${Math.floor(distance)}m</span>
      </div>
    `;

    // Save and display high scores
    const run = {
      score: Math.floor(score),
      stats,
      tier,
      distance: Math.floor(distance),
      timestamp: Date.now(),
    };
    this.#saveHighScore(run);
    this.#displayHighScores(run.score);

    this.setState('gameover');
  }

  #saveHighScore(run) {
    let highScores = [];
    try {
      const stored = localStorage.getItem('decoherence-highscores');
      if (stored) {
        highScores = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load high scores:', e);
    }

    highScores.push(run);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep top 10

    try {
      localStorage.setItem('decoherence-highscores', JSON.stringify(highScores));
    } catch (e) {
      console.error('Failed to save high scores:', e);
    }
  }

  #displayHighScores(currentScore) {
    let highScores = [];
    try {
      const stored = localStorage.getItem('decoherence-highscores');
      if (stored) {
        highScores = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load high scores:', e);
    }

    if (highScores.length === 0) {
      this.highScoresEl.innerHTML = '';
      return;
    }

    let html = '<h4>High Scores</h4>';
    highScores.slice(0, 5).forEach((run, index) => {
      const isPersonalBest = run.score === currentScore;
      const rankClass = isPersonalBest ? 'personal-best' : '';
      html += `
        <div class="high-score-row">
          <span class="high-score-rank ${rankClass}">#${index + 1}</span>
          <span class="high-score-score ${rankClass}">${run.score.toLocaleString()}</span>
          <span class="high-score-details ${rankClass}">T${run.tier} • ${run.stats.nearMisses} near-misses</span>
        </div>
      `;
    });

    this.highScoresEl.innerHTML = html;
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
