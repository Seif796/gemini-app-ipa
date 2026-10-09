// High-tech futuristic sonic branding chime for Seif AI logo
class LogoSoundPlayer {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playLogoSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(ctx.destination);

      // Low-pass filter for silky smooth futuristic warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
      filter.connect(masterGain);

      // Harmonic futuristic chime frequencies (E major 9th sparkle)
      // [freq, delay, duration, gainLevel, type]
      const notes = [
        // Sub warm base pulse
        { freq: 164.81, delay: 0, dur: 0.7, vol: 0.35, type: 'sine' },     // E3
        // Sparkle bells
        { freq: 659.25, delay: 0.02, dur: 0.8, vol: 0.45, type: 'sine' },  // E5
        { freq: 987.77, delay: 0.06, dur: 0.85, vol: 0.4, type: 'triangle' }, // B5
        { freq: 1318.51, delay: 0.10, dur: 0.9, vol: 0.35, type: 'sine' }, // E6
        { freq: 1661.22, delay: 0.14, dur: 0.95, vol: 0.3, type: 'sine' }, // G#6
        { freq: 2489.02, delay: 0.18, dur: 0.6, vol: 0.2, type: 'sine' }   // D#7 (celestial shimmer)
      ];

      notes.forEach(({ freq, delay, dur, vol, type }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);

        // Gentle vibrato shimmer on higher notes
        if (freq > 1000) {
          osc.frequency.exponentialRampToValueAtTime(freq * 1.008, now + delay + dur);
        }

        noteGain.gain.setValueAtTime(0.0001, now + delay);
        noteGain.gain.exponentialRampToValueAtTime(vol, now + delay + 0.025);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.05);
      });

      // Subtle haptic vibration for mobile
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([25, 45, 20]);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Logo sound playback error:', err);
      // Fallback to high quality chime audio
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (_) {}
    }
  }
}

export const logoSound = new LogoSoundPlayer();

