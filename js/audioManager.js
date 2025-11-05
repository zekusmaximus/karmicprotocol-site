export class AudioManager {
  constructor() {
    this.ctx = null;
    this.layers = null;
    this.started = false;
  }

  isSupported() {
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  async start() {
    if (this.started || !this.isSupported()) {
      return;
    }

    const ContextCtor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new ContextCtor();

    const createGain = () => this.ctx.createGain();
    const gMaster = createGain();
    const gPad = createGain();
    const gArp = createGain();
    const gNoise = createGain();

    gMaster.connect(this.ctx.destination);
    gPad.connect(gMaster);
    gArp.connect(gMaster);
    gNoise.connect(gMaster);

    gMaster.gain.value = 0.5;
    gPad.gain.value = 0.18;
    gArp.gain.value = 0.0;
    gNoise.gain.value = 0.0;

    const pad1 = this.ctx.createOscillator();
    const pad2 = this.ctx.createOscillator();
    pad1.type = 'sawtooth';
    pad2.type = 'sawtooth';
    pad1.frequency.value = 110;
    pad2.frequency.value = 112.2;
    pad1.connect(gPad);
    pad2.connect(gPad);
    pad1.start();
    pad2.start();

    const arp = this.ctx.createOscillator();
    arp.type = 'square';
    arp.frequency.value = 0;
    const gArpEnv = createGain();
    gArpEnv.gain.value = 0;
    arp.connect(gArpEnv);
    gArpEnv.connect(gArp);
    arp.start();

    const noiseBuffer = this.#whiteNoiseBuffer(this.ctx);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    noise.connect(hp);
    hp.connect(gNoise);
    noise.start();

    this.layers = { gMaster, gPad, gArp, gNoise, arp, gArpEnv };
    this.started = true;
  }

  setTier(tier) {
    if (!this.layers || !this.ctx) return;
    const now = this.ctx.currentTime;
    const { gPad, gArp, gNoise } = this.layers;
    gPad.gain.setTargetAtTime(0.16 + 0.06 * Math.min(3, tier - 1), now, 0.25);
    gArp.gain.setTargetAtTime(tier >= 2 ? 0.08 : 0.0, now, 0.25);
    gNoise.gain.setTargetAtTime(tier >= 3 ? 0.05 : 0.0, now, 0.25);
  }

  blip(pitchMultiplier = 1.0) {
    if (!this.layers || !this.ctx) return;
    const { arp, gArpEnv } = this.layers;
    const now = this.ctx.currentTime;

    // Vary pitch based on multiplier
    const baseFreq = 440;
    arp.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);

    gArpEnv.gain.cancelScheduledValues(now);
    gArpEnv.gain.setValueAtTime(0.0, now);
    gArpEnv.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gArpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  }

  whoosh() {
    if (!this.layers || !this.ctx) return;
    const { gNoise } = this.layers;
    const now = this.ctx.currentTime;
    gNoise.gain.cancelScheduledValues(now);
    gNoise.gain.setValueAtTime(gNoise.gain.value, now);
    gNoise.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  }

  comboBreak() {
    if (!this.layers || !this.ctx) return;
    const { arp, gArpEnv } = this.layers;
    const now = this.ctx.currentTime;

    // Descending tone for combo break
    arp.frequency.setValueAtTime(800, now);
    arp.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gArpEnv.gain.cancelScheduledValues(now);
    gArpEnv.gain.setValueAtTime(0.0, now);
    gArpEnv.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gArpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  }

  hit() {
    if (!this.layers || !this.ctx) return;
    const { gMaster } = this.layers;
    const now = this.ctx.currentTime;
    gMaster.gain.setTargetAtTime(0.15, now, 0.01);
    gMaster.gain.setTargetAtTime(0.5, now + 0.12, 0.08);
  }

  #whiteNoiseBuffer(ctx) {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    return buffer;
  }
}
