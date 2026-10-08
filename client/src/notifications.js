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

  async sendNow(title, body) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'Seif Ai Test',
            body: body,
            id: Math.floor(Date.now() % 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'beep.wav'
          }
        ]
      });
      return;
    } catch (e) {
      // Fallback to Web Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title || 'Seif Ai Test', {
          body,
          icon: '/logo.svg'
        });
      }
    }
  }

  async scheduleReminder(title, delaySeconds) {
    const fireDate = new Date(Date.now() + delaySeconds * 1000);
    const id = Math.floor(Date.now() % 100000);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '⏰ Reminder from Seif Ai Test',
            body: title,
            id,
            schedule: { at: fireDate },
            sound: 'beep.wav'
          }
        ]
      });
    } catch (e) {
      // Web timeout fallback
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Reminder from Seif Ai Test', {
            body: title,
            icon: '/logo.svg'
          });
        }
      }, delaySeconds * 1000);
    }

    return { id, fireDate };
  }
}

export const notifications = new NotificationService();

