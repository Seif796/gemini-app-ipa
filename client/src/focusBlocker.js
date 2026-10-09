// Study & Focus Mode - App Blocker System
// Allows users to select distracting apps and lock them during study/focus sessions

const STORAGE_KEY = 'seif_focus_blocker_data';

export const POPULAR_DISTRACTING_APPS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', category: 'Social', color: '#fe2c55', scheme: 'tiktok://' },
  { id: 'instagram', name: 'Instagram', icon: '📸', category: 'Social', color: '#e1306c', scheme: 'instagram://' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', category: 'Entertainment', color: '#ff0000', scheme: 'youtube://' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', category: 'Social', color: '#fffc00', scheme: 'snapchat://' },
  { id: 'twitter', name: 'X / Twitter', icon: '🐦', category: 'Social', color: '#1da1f2', scheme: 'twitter://' },
  { id: 'facebook', name: 'Facebook', icon: '📘', category: 'Social', color: '#1877f2', scheme: 'fb://' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', category: 'Messaging', color: '#25d366', scheme: 'whatsapp://' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', category: 'Messaging', color: '#0088cc', scheme: 'tg://' },
  { id: 'netflix', name: 'Netflix', icon: '🍿', category: 'Entertainment', color: '#e50914', scheme: 'nflx://' },
  { id: 'games', name: 'Mobile Games', icon: '🎮', category: 'Gaming', color: '#8b5cf6', scheme: 'gamecenter:' }
];

export const DEFAULT_FOCUS_STATE = {
  isActive: false,
  durationMinutes: 25, // default Pomodoro 25 mins
  remainingSeconds: 25 * 60,
  blockedAppIds: ['tiktok', 'instagram', 'youtube'], // default blocked apps for studying
  sessionGoal: 'Study Session (جلسة مذاكرة)',
  strictMode: true, // prevents leaving early easily
  startedAt: null
};

export function getFocusState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FOCUS_STATE };
    const parsed = JSON.parse(raw);

    // If session was active, calculate remaining seconds based on wall clock
    if (parsed.isActive && parsed.startedAt) {
      const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
      const total = parsed.durationMinutes * 60;
      if (elapsed >= total) {
        parsed.isActive = false;
        parsed.remainingSeconds = 0;
        parsed.startedAt = null;
        saveFocusState(parsed);
      } else {
        parsed.remainingSeconds = total - elapsed;
      }
    }

    return { ...DEFAULT_FOCUS_STATE, ...parsed };
  } catch (e) {
    console.error('Error reading focus state:', e);
    return { ...DEFAULT_FOCUS_STATE };
  }
}

const CUSTOM_APPS_KEY = 'seif_custom_user_apps';

export function getUserCustomApps() {
  try {
    const raw = localStorage.getItem(CUSTOM_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUserCustomApps(apps) {
  try {
    localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent('seif-custom-apps-updated', { detail: apps }));
  } catch (e) {
    console.error('Error saving custom apps:', e);
  }
}

export function saveFocusState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('seif-focus-state-changed', { detail: state }));
  } catch (e) {
    console.error('Error saving focus state:', e);
  }
}

export function isAppBlockedInFocus(appIdOrName) {
  const current = getFocusState();
  if (!current.isActive) return false;
  if (!appIdOrName) return false;

  const clean = appIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return current.blockedAppIds.some((id) => clean.includes(id) || id.includes(clean));
}

