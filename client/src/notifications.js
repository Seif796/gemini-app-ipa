import { LocalNotifications } from '@capacitor/local-notifications';

// Mobile tactile haptic vibration (system notification itself plays the sound)
export function playNotificationSound() {
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
    // Mobile Capacitor LocalNotifications (fires real iOS/Android notification with system sound)
    try {
      await this.ensurePermission();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'Seif Ai Test',
            body: body || 'رسالة جديدة!',
            id: Math.floor(Math.random() * 100000) + 1,
            schedule: { at: new Date(Date.now() + 50) },
            sound: 'notification.wav'
          }
        ]
      });
      return;
    } catch (_) {}

    // 4. Web Browser Notification fallback
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title || 'Seif Ai Test', {
            body,
            icon: '/app-icon.png'
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') {
              new Notification(title || 'Seif Ai Test', {
                body,
                icon: '/app-icon.png'
              });
            }
          });
        }
      }
    } catch (_) {}
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
      // Only set JS timer fallback if native LocalNotifications failed
      setTimeout(() => {
        playNotificationSound();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ تذكير مهم من Seif Ai Test', {
            body: title,
            icon: '/app-icon.png'
          });
        }
      }, safeDelay * 1000);
    }

    return { id, fireDate };
  }
}

export const notifications = new NotificationService();
