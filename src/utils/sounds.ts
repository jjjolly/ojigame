// Sound utilities using Web Audio API
// Creates synthesized singing bowl sounds for the spiritual theme

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

  // Resume audio context (needed for mobile browsers)
  public async resume(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  // Create a singing bowl tone with harmonics
  private playSingingBowl(
    baseFreq: number,
    duration: number,
    volume: number = 0.3,
    harmonicRichness: number = 1
  ): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Main fundamental frequency
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Second harmonic (octave)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(volume * 0.5 * harmonicRichness, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    // Third harmonic (perfect fifth above octave)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.frequency.setValueAtTime(baseFreq * 3, now);
    osc3.type = 'sine';
    gain3.gain.setValueAtTime(volume * 0.25 * harmonicRichness, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

    // Subtle beating effect with slightly detuned oscillator
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.connect(gain4);
    gain4.connect(ctx.destination);
    osc4.frequency.setValueAtTime(baseFreq * 1.003, now); // Slight detune for beating
    osc4.type = 'sine';
    gain4.gain.setValueAtTime(volume * 0.3, now);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.start(now);
    osc1.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration * 0.8);
    osc3.start(now);
    osc3.stop(now + duration * 0.6);
    osc4.start(now);
    osc4.stop(now + duration);
  }

  // Drop sound - gentle water drop
  public playDropSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Water drop: high to low frequency sweep
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Light merge sound - high, clear singing bowl
  public playLightMergeSound(): void {
    if (!this.isEnabled) return;
    // High frequency, short duration - like a small crystal bowl
    this.playSingingBowl(880, 1.5, 0.25, 0.8);
  }

  // Medium merge sound - mid-range singing bowl
  public playMediumMergeSound(): void {
    if (!this.isEnabled) return;
    // Medium frequency, moderate duration
    this.playSingingBowl(528, 2.0, 0.3, 1.0);
  }

  // Deep merge sound - low, resonant singing bowl
  public playDeepMergeSound(): void {
    if (!this.isEnabled) return;
    // Low frequency, long duration - like a large Tibetan bowl
    this.playSingingBowl(256, 2.5, 0.35, 1.2);
  }

  // Enlightenment sound - multiple bowls in harmony + ethereal tones
  public playEnlightenmentSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Multiple singing bowls in harmony (Om chord)
    this.playSingingBowl(256, 4.0, 0.25, 1.0); // Root
    setTimeout(() => {
      this.playSingingBowl(384, 3.5, 0.2, 0.8); // Fifth
    }, 100);
    setTimeout(() => {
      this.playSingingBowl(512, 3.0, 0.15, 0.6); // Octave
    }, 200);

    // Ethereal shimmer effect
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    const shimmerFilter = ctx.createBiquadFilter();

    shimmerOsc.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    shimmerOsc.type = 'sawtooth';
    shimmerOsc.frequency.setValueAtTime(1024, now + 0.3);
    shimmerOsc.frequency.linearRampToValueAtTime(2048, now + 2);

    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.setValueAtTime(2000, now + 0.3);
    shimmerFilter.Q.setValueAtTime(10, now + 0.3);

    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    shimmerOsc.start(now + 0.3);
    shimmerOsc.stop(now + 3);

    // Deep om drone
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();

    droneOsc.connect(droneGain);
    droneGain.connect(ctx.destination);

    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(64, now);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 4);

    droneOsc.start(now);
    droneOsc.stop(now + 4);
  }

  // Game over sound - melancholic descending tones
  public playGameOverSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Descending singing bowl tones
    const frequencies = [528, 440, 352, 264];

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + index * 0.3;

      osc.frequency.setValueAtTime(freq, startTime);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }

  // Play merge sound based on orb type
  public playMergeSound(soundType: 'light' | 'medium' | 'deep' | 'enlightenment'): void {
    switch (soundType) {
      case 'light':
        this.playLightMergeSound();
        break;
      case 'medium':
        this.playMediumMergeSound();
        break;
      case 'deep':
        this.playDeepMergeSound();
        break;
      case 'enlightenment':
        this.playEnlightenmentSound();
        break;
    }
  }
}

export const soundManager = new SoundManager();
