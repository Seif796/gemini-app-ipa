import { LocalNotifications } from '@capacitor/local-notifications';

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
    await this.ensurePermission();
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'Seif Ai Test',
            body: body || 'You have a new message!',
            id: Math.floor(Math.random() * 100000) + 1,
            schedule: { at: new Date(Date.now() + 200) },
            sound: 'default'
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
            sound: 'default'
          }
        ]
      });
      console.log(`Scheduled reminder for ${fireDate.toLocaleTimeString()}`);
    } catch (e) {
      console.warn('Native LocalNotifications fallback to setTimeout:', e);
    }

    // Always keep an active JS setTimeout backup for guaranteed reliability
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ تذكير مهم من Seif Ai Test', {
          body: title,
          icon: '/app-icon.png'
        });
      }
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (err) {}
    }, safeDelay * 1000);

    return { id, fireDate };
  }
}

export const notifications = new NotificationService();

