// Sound utilities using Web Audio API
// Weirdcore/Traumacore theme - creepy giggles, whispers, distorted sounds

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public async resume(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  // Creepy giggle sound
  private playGiggle(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Multiple short bursts like a childish giggle
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.08;
      const freq = 800 + Math.random() * 400 + (i * 100);

      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + 0.06);
      osc.type = 'sine';

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, startTime);
      filter.Q.setValueAtTime(5, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    }
  }

  // Creepy whisper sound
  private playWhisper(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // White noise filtered to sound like whisper
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.4);
    filter.Q.setValueAtTime(10, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.5);

    // Add a subtle tone underneath
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);
    osc.type = 'sine';

    oscGain.gain.setValueAtTime(0.03, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Distorted glitchy sound
  private playDistorted(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create softer distortion curve
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2); // Reduced from 5 to 2 for softer distortion
    }
    distortion.curve = curve;

    // Glitchy oscillators - reduced gain to match other sounds
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(distortion);
      distortion.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.1;
      const freq = 100 + Math.random() * 200;

      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.setValueAtTime(freq * 2, startTime + 0.05);
      osc.frequency.setValueAtTime(freq * 0.5, startTime + 0.1);
      osc.type = 'sawtooth';

      // Reduced gain: 0.1 -> 0.04 to compensate for distortion amplification
      gain.gain.setValueAtTime(0.04, startTime);
      gain.gain.setValueAtTime(0.02, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    }
  }

  // Void/cosmic horror sound
  private playVoid(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Deep drone - reduced gain since multiple sounds play together
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);

    drone.frequency.setValueAtTime(40, now);
    drone.frequency.linearRampToValueAtTime(30, now + 2);
    drone.type = 'sine';

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    droneGain.gain.linearRampToValueAtTime(0.04, now + 1);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    drone.start(now);
    drone.stop(now + 2);

    // Eerie high pitched whine
    const whine = ctx.createOscillator();
    const whineGain = ctx.createGain();
    const whineFilter = ctx.createBiquadFilter();

    whine.connect(whineFilter);
    whineFilter.connect(whineGain);
    whineGain.connect(ctx.destination);

    whine.frequency.setValueAtTime(2000, now);
    whine.frequency.linearRampToValueAtTime(4000, now + 1.5);
    whine.type = 'sine';

    whineFilter.type = 'bandpass';
    whineFilter.frequency.setValueAtTime(3000, now);
    whineFilter.Q.setValueAtTime(20, now);

    whineGain.gain.setValueAtTime(0, now + 0.5);
    whineGain.gain.linearRampToValueAtTime(0.03, now + 0.8);
    whineGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    whine.start(now + 0.5);
    whine.stop(now + 1.8);

    // Static noise burst - reduced
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now + 0.2);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.25);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now + 0.2);
    noise.stop(now + 0.5);
  }

  // Drop sound - squishy plop
  public playDropSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Squishy drop sound
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Game over sound - creepy descending tones
  public playGameOverSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Descending dissonant tones
    const frequencies = [400, 350, 280, 200, 150];

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + index * 0.25;

      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.linearRampToValueAtTime(freq * 0.8, startTime + 0.2);
      osc.type = 'triangle';

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    // Add static noise at the end
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, now + 1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now + 1);
    noise.stop(now + 1.5);
  }

  // Play merge sound based on type
  public playMergeSound(soundType: 'giggle' | 'whisper' | 'distorted' | 'void'): void {
    if (!this.isEnabled) return;

    switch (soundType) {
      case 'giggle':
        this.playGiggle();
        break;
      case 'whisper':
        this.playWhisper();
        break;
      case 'distorted':
        this.playDistorted();
        break;
      case 'void':
        this.playVoid();
        break;
    }
  }
}

export const soundManager = new SoundManager();
