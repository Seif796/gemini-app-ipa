import { LocalNotifications } from '@capacitor/local-notifications';

// Ultra-crisp, multi-harmonic crystal bell chime synthesized via Web Audio API (100% offline & zero latency)
export function playSynthNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, now);
    master.connect(ctx.destination);

    // Warm low-pass filter for pristine studio sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, now);
    filter.connect(master);

    // Harmonic crystalline chord notes: F5, A5, C6, E6, G6, C7
    const tones = [
      { f: 698.46, d: 0.00, dur: 0.80, v: 0.35 },
      { f: 880.00, d: 0.04, dur: 0.85, v: 0.40 },
      { f: 1046.50, d: 0.08, dur: 0.95, v: 0.45 },
      { f: 1318.51, d: 0.12, dur: 1.05, v: 0.35 },
      { f: 1567.98, d: 0.16, dur: 1.15, v: 0.30 },
      { f: 2093.00, d: 0.20, dur: 0.65, v: 0.20 } // celestial sparkle
    ];

    tones.forEach(({ f, d, dur, v }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + d);
      g.gain.setValueAtTime(0.0001, now + d);
      g.gain.exponentialRampToValueAtTime(v, now + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + d + dur);
      osc.connect(g);
      g.connect(filter);
      osc.start(now + d);
      osc.stop(now + d + dur + 0.05);
    });
  } catch (err) {
    console.warn('Synth notification chime error:', err);
  }
}

// Master notification sound player: plays audio file with instant synth fallback + haptic vibration
export function playNotificationSound() {
  try {
    const audio = new Audio('/notification.wav');
    audio.volume = 0.9;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => playSynthNotificationChime());
    }
  } catch (_) {
    playSynthNotificationChime();
  }

  // Haptic feedback for mobile devices
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch (_) {}
  }
}

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.init();
  }

  async init() {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        this.hasPermission = true;
      }

      // Automatically play notification chime whenever a local notification arrives
      try {
        LocalNotifications.addListener('localNotificationReceived', () => {
          playNotificationSound();
        });
        LocalNotifications.addListener('localNotificationActionPerformed', () => {
          playNotificationSound();
        });
      } catch (_) {}
    } catch (e) {
      if ('Notification' in window && Notification.permission === 'granted') {
        this.hasPermission = true;
      }
    }
  }

  async requestPermission() {
    try {
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') {
        this.hasPermission = true;
        return true;
      }
    } catch (e) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        this.hasPermission = perm === 'granted';
        return this.hasPermission;
      }
    }
    return false;
  }

  async ensurePermission() {
    if (this.hasPermission) return true;
    return await this.requestPermission();
  }

  async sendNow(title, body) {
    await this.ensurePermission();
    // Play the signature notification sound immediately
    playNotificationSound();

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'Seif Ai Test',
            body: body || 'You have a new message!',
            id: Math.floor(Math.random() * 100000) + 1,
            schedule: { at: new Date(Date.now() + 200) },
            sound: 'notification.wav'
          }
        ]
      });
      return;
    } catch (e) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title || 'Seif Ai Test', {
          body,
          icon: '/app-icon.png'
        });
      }
    }
  }

  async scheduleReminder(title, delaySeconds = 60) {
    await this.ensurePermission();
    const safeDelay = Math.max(1, delaySeconds);
    const fireDate = new Date(Date.now() + safeDelay * 1000);
    const id = Math.floor(Math.random() * 100000) + 1;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '⏰ تذكير مهم من Seif Ai Test',
            body: title,
            id,
            schedule: { at: fireDate },
            sound: 'notification.wav'
          }
        ]
      });
      console.log(`Scheduled reminder for ${fireDate.toLocaleTimeString()}`);
    } catch (e) {
      console.warn('Native LocalNotifications fallback to setTimeout:', e);
    }

    // Always keep an active JS setTimeout backup for guaranteed reliability and chime
    setTimeout(() => {
      // Play signature notification sound when reminder fires
      playNotificationSound();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ تذكير مهم من Seif Ai Test', {
          body: title,
          icon: '/app-icon.png'
        });
      }
    }, safeDelay * 1000);

    return { id, fireDate };
  }
}

export const notifications = new NotificationService();
