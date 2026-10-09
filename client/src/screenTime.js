// Screen Time & Digital Wellbeing Manager
// Tracks app usage time today, daily limit, break reminders, and lock state

const STORAGE_KEY = 'seif_screen_time_data';

export const DEFAULT_SCREEN_TIME = {
  dailyLimitMinutes: 60, // default limit 60 mins (0 = unlimited)
  limitEnabled: false,
  breakIntervalMinutes: 20, // break reminder every 20 mins of continuous use
  breakRemindersEnabled: true,
  todayUsageSeconds: 0,
  lastActiveDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  isLocked: false
};

export function getScreenTimeData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCREEN_TIME };
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);

    // If it's a new day, reset today's usage seconds
    if (data.lastActiveDate !== today) {
      data.todayUsageSeconds = 0;
      data.lastActiveDate = today;
      data.isLocked = false;
      saveScreenTimeData(data);
    }
    return { ...DEFAULT_SCREEN_TIME, ...data };
  } catch (e) {
    console.error('Failed to get screen time data:', e);
    return { ...DEFAULT_SCREEN_TIME };
  }
}

export function saveScreenTimeData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('seif-screentime-updated', { detail: data }));
  } catch (e) {
    console.error('Failed to save screen time data:', e);
  }
}

export function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  }
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

