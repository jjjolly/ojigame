// Sound utilities using Web Audio API
// Creates synthesized sounds for the game

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

  // Drop sound - soft "koton" sound
  public playDropSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  // Light merge sound - "hoh" / "hah"
  public playLightMergeSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low-pitched voice-like sound
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.setValueAtTime(180, ctx.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
    oscillator.type = 'sawtooth';

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  // Heavy merge sound - "goooon" / "deeeen"
  public playHeavyMergeSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();

    // Main low frequency oscillator
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    oscillator1.connect(filter1);
    filter1.connect(gainNode1);
    gainNode1.connect(ctx.destination);

    oscillator1.frequency.setValueAtTime(80, ctx.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5);
    oscillator1.type = 'sawtooth';

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(400, ctx.currentTime);
    filter1.Q.setValueAtTime(5, ctx.currentTime);

    gainNode1.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    // Sub bass
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.frequency.setValueAtTime(50, ctx.currentTime);
    oscillator2.type = 'sine';

    gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.5);
    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.4);
  }

  // Enlightenment sound - bell + "SATORI!" voice
  public playEnlightenmentSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();

    // Bell sound
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);

    bellOsc.frequency.setValueAtTime(800, ctx.currentTime);
    bellOsc.type = 'sine';

    bellGain.gain.setValueAtTime(0.5, ctx.currentTime);
    bellGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    // Bell harmonics
    const bellOsc2 = ctx.createOscillator();
    const bellGain2 = ctx.createGain();

    bellOsc2.connect(bellGain2);
    bellGain2.connect(ctx.destination);

    bellOsc2.frequency.setValueAtTime(1200, ctx.currentTime);
    bellOsc2.type = 'sine';

    bellGain2.gain.setValueAtTime(0.3, ctx.currentTime);
    bellGain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    // Voice-like "SATORI" sound
    const voiceOsc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const voiceFilter = ctx.createBiquadFilter();

    voiceOsc.connect(voiceFilter);
    voiceFilter.connect(voiceGain);
    voiceGain.connect(ctx.destination);

    voiceOsc.type = 'sawtooth';
    voiceOsc.frequency.setValueAtTime(120, ctx.currentTime + 0.3);
    voiceOsc.frequency.setValueAtTime(150, ctx.currentTime + 0.5);
    voiceOsc.frequency.setValueAtTime(100, ctx.currentTime + 0.8);

    voiceFilter.type = 'bandpass';
    voiceFilter.frequency.setValueAtTime(500, ctx.currentTime + 0.3);
    voiceFilter.frequency.setValueAtTime(800, ctx.currentTime + 0.5);
    voiceFilter.frequency.setValueAtTime(400, ctx.currentTime + 0.8);
    voiceFilter.Q.setValueAtTime(3, ctx.currentTime);

    voiceGain.gain.setValueAtTime(0, ctx.currentTime);
    voiceGain.gain.setValueAtTime(0.5, ctx.currentTime + 0.3);
    voiceGain.gain.setValueAtTime(0.6, ctx.currentTime + 0.5);
    voiceGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    bellOsc.start(ctx.currentTime);
    bellOsc.stop(ctx.currentTime + 2);
    bellOsc2.start(ctx.currentTime);
    bellOsc2.stop(ctx.currentTime + 1.5);
    voiceOsc.start(ctx.currentTime + 0.3);
    voiceOsc.stop(ctx.currentTime + 1.2);
  }

  // Game over sound - sad, short melody
  public playGameOverSound(): void {
    if (!this.isEnabled) return;

    const ctx = this.getAudioContext();

    // Descending notes
    const notes = [400, 350, 300, 250];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + index * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.15 + 0.15);

      osc.start(ctx.currentTime + index * 0.15);
      osc.stop(ctx.currentTime + index * 0.15 + 0.15);
    });
  }

  // Play merge sound based on uncle type
  public playMergeSound(soundType: 'light' | 'heavy' | 'enlightenment'): void {
    switch (soundType) {
      case 'light':
        this.playLightMergeSound();
        break;
      case 'heavy':
        this.playHeavyMergeSound();
        break;
      case 'enlightenment':
        this.playEnlightenmentSound();
        break;
    }
  }
}

export const soundManager = new SoundManager();
