import { LocalNotifications } from '@capacitor/local-notifications';

// Snapchat-style signature chime synthesized via Web Audio API (tactile pop attack + bright ascending double-ping + glass sparkle)
export function playSynthNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.7, now);
    master.connect(ctx.destination);

    // Warm studio filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, now);
    filter.connect(master);

    // 1. Tactile Snap / Pop attack (frequency drop from 2400Hz to 1100Hz in 25ms)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(2400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(1100, now + 0.025);
    snapGain.gain.setValueAtTime(0.5, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    snapOsc.connect(snapGain);
    snapGain.connect(filter);
    snapOsc.start(now);
    snapOsc.stop(now + 0.04);

    // 2. First Chime Note: C6 (1046.5 Hz) - warm energetic ping at t = 0.015s
    const n1Osc = ctx.createOscillator();
    const n1Gain = ctx.createGain();
    n1Osc.type = 'sine';
    n1Osc.frequency.setValueAtTime(1046.5, now + 0.015);
    n1Gain.gain.setValueAtTime(0.0001, now + 0.015);
    n1Gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
    n1Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    n1Osc.connect(n1Gain);
    n1Gain.connect(filter);
    n1Osc.start(now + 0.015);
    n1Osc.stop(now + 0.30);

    // 3. Second Chime Note (Signature Ascending Sparkle Ping): G6 (1567.98 Hz) at t = 0.075s
    const n2Osc = ctx.createOscillator();
    const n2Gain = ctx.createGain();
    n2Osc.type = 'sine';
    n2Osc.frequency.setValueAtTime(1567.98, now + 0.075);
    n2Gain.gain.setValueAtTime(0.0001, now + 0.075);
    n2Gain.gain.exponentialRampToValueAtTime(0.70, now + 0.082);
    n2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
    n2Osc.connect(n2Gain);
    n2Gain.connect(filter);
    n2Osc.start(now + 0.075);
    n2Osc.stop(now + 0.60);

    // 4. High celestial sparkle overtone: C7 (2093.0 Hz) at t = 0.085s
    const n3Osc = ctx.createOscillator();
    const n3Gain = ctx.createGain();
    n3Osc.type = 'sine';
    n3Osc.frequency.setValueAtTime(2093.0, now + 0.085);
    n3Gain.gain.setValueAtTime(0.0001, now + 0.085);
    n3Gain.gain.exponentialRampToValueAtTime(0.35, now + 0.095);
    n3Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    n3Osc.connect(n3Gain);
    n3Gain.connect(filter);
    n3Osc.start(now + 0.085);
    n3Osc.stop(now + 0.48);
  } catch (err) {
    console.warn('Synth notification chime error:', err);
  }
}

let cachedAudio = null;

// Master notification sound player: plays custom audio file with instant synth fallback + haptic vibration
export function playNotificationSound() {
  try {
    if (!cachedAudio) {
      cachedAudio = new Audio('/notification.wav');
    }
    cachedAudio.currentTime = 0;
    cachedAudio.volume = 1.0;
    const p = cachedAudio.play();
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

  async scheduleLocal({ title, body }) {
    return this.sendNow(title, body);
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
