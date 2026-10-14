/**
 * CardioLens Web Audio Heartbeat Synthesizer
 * Generates realistic acoustic S1 ("Lub") and S2 ("Dub") heart sounds using the Web Audio API.
 * No external audio files or network requests required.
 */

class HeartbeatAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.45;
  private bpm: number = 68;

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Synthesize S1 ("Lub") sound: Lower pitch, longer duration (Mitral/Tricuspid closure)
   */
  private playS1(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // 1. Fundamental tone oscillator (52Hz -> 38Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, time);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(56, time);
    osc1.frequency.exponentialRampToValueAtTime(36, time + 0.14);

    gain1.gain.setValueAtTime(0.001, time);
    gain1.gain.linearRampToValueAtTime(0.85, time + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(time);
    osc1.stop(time + 0.18);

    // 2. Sub-bass acoustic chest resonance (40Hz -> 28Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(42, time);
    subOsc.frequency.exponentialRampToValueAtTime(28, time + 0.15);

    subGain.gain.setValueAtTime(0.001, time);
    subGain.gain.linearRampToValueAtTime(0.4, time + 0.025);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(time);
    subOsc.stop(time + 0.18);
  }

  /**
   * Synthesize S2 ("Dub") sound: Higher pitch, shorter snap (Aortic/Pulmonary closure)
   */
  private playS2(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // S2 occurs ~280ms after S1
    const s2Time = time + 0.28;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, s2Time);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(84, s2Time);
    osc.frequency.exponentialRampToValueAtTime(52, s2Time + 0.11);

    gain.gain.setValueAtTime(0.001, s2Time);
    gain.gain.linearRampToValueAtTime(0.7, s2Time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, s2Time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(s2Time);
    osc.stop(s2Time + 0.14);
  }

  /**
   * Play a single complete cardiac cycle (Lub-Dub)
   */
  public triggerBeat() {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playS1(now);
    this.playS2(now);
  }

  /**
   * Start continuous heartbeat rhythm loop
   */
  public start(bpm: number = 68) {
    this.bpm = bpm;
    if (this.isRunning) return;

    this.initContext();
    this.isRunning = true;

    // Trigger initial beat immediately
    this.triggerBeat();

    // Schedule subsequent beats based on BPM
    const intervalMs = (60 / this.bpm) * 1000;
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.triggerBeat();
      }
    }, intervalMs);
  }

  /**
   * Stop/Pause continuous heartbeat audio
   */
  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const heartbeatAudio = new HeartbeatAudioEngine();
