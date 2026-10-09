// iOS App URL Schemes and App Management Launcher
// Allows Seif AI to open installed apps or show custom deep-link actions on iPhone

export const KNOWN_APPS = {
  // Common Social & Messaging Apps
  whatsapp: { name: 'WhatsApp', scheme: 'whatsapp://', universal: 'https://wa.me/', color: '#25D366' },
  telegram: { name: 'Telegram', scheme: 'tg://', universal: 'https://t.me/', color: '#0088cc' },
  instagram: { name: 'Instagram', scheme: 'instagram://', universal: 'https://instagram.com/', color: '#E1306C' },
  twitter: { name: 'X (Twitter)', scheme: 'twitter://', universal: 'https://twitter.com/', color: '#1DA1F2' },
  x: { name: 'X (Twitter)', scheme: 'twitter://', universal: 'https://twitter.com/', color: '#000000' },
  facebook: { name: 'Facebook', scheme: 'fb://', universal: 'https://facebook.com/', color: '#1877F2' },
  tiktok: { name: 'TikTok', scheme: 'tiktok://', universal: 'https://tiktok.com/', color: '#000000' },
  snapchat: { name: 'Snapchat', scheme: 'snapchat://', universal: 'https://snapchat.com/', color: '#FFFC00' },
  youtube: { name: 'YouTube', scheme: 'youtube://', universal: 'https://youtube.com/', color: '#FF0000' },

  // System & Utilities
  safari: { name: 'Safari / Browser', scheme: 'https://google.com', universal: 'https://google.com', color: '#007AFF' },
  camera: { name: 'Camera', scheme: 'camera://', color: '#64748b' },
  photos: { name: 'Photos', scheme: 'photos-redirect://', color: '#f59e0b' },
  settings: { name: 'Settings', scheme: 'app-settings:', color: '#64748b' },
  mail: { name: 'Mail', scheme: 'mailto:', color: '#0284c7' },
  maps: { name: 'Apple Maps', scheme: 'maps://', universal: 'https://maps.apple.com/', color: '#10b981' },
  googlemaps: { name: 'Google Maps', scheme: 'comgooglemaps://', universal: 'https://maps.google.com/', color: '#34A853' },
  spotify: { name: 'Spotify', scheme: 'spotify://', universal: 'https://open.spotify.com/', color: '#1DB954' },
  music: { name: 'Apple Music', scheme: 'music://', color: '#FA2D48' },
  notes: { name: 'Notes', scheme: 'mobilenotes://', color: '#eab308' },
  reminders: { name: 'Reminders', scheme: 'x-apple-reminderkit://', color: '#f97316' },
  calculator: { name: 'Calculator', scheme: 'calc://', color: '#8b5cf6' },
  facetime: { name: 'FaceTime', scheme: 'facetime://', color: '#22c55e' }
};

export function findAppByName(name) {
  if (!name) return null;
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (KNOWN_APPS[clean]) return { id: clean, ...KNOWN_APPS[clean] };

  // Fuzzy match
  for (const [key, app] of Object.entries(KNOWN_APPS)) {
    if (clean.includes(key) || key.includes(clean) || app.name.toLowerCase().includes(clean)) {
      return { id: key, ...app };
    }
  }
  return null;
}

export function openApp(appKeyOrUrl) {
  try {
    const known = findAppByName(appKeyOrUrl);

    // Check if app is blocked by Study / Focus Mode
    try {
      const rawFocus = localStorage.getItem('seif_focus_blocker_data');
      if (rawFocus) {
        const focus = JSON.parse(rawFocus);
        if (focus.isActive) {
          const appCheck = (known?.id || appKeyOrUrl).toLowerCase();
          const isBlocked = focus.blockedAppIds?.some((id) => appCheck.includes(id) || id.includes(appCheck));
          if (isBlocked) {
            window.dispatchEvent(new CustomEvent('seif-blocked-app-attempted', {
              detail: { name: known?.name || appKeyOrUrl }
            }));
            return false;
          }
        }
      }
    } catch (e) {
      console.warn('Focus block check error:', e);
    }

    let targetUrl = appKeyOrUrl;
    if (known) {
      targetUrl = known.scheme;
    }

    if (!targetUrl.includes('://') && !targetUrl.startsWith('app-settings:') && !targetUrl.startsWith('mailto:')) {
      targetUrl = `${targetUrl}://`;
    }

    // Try opening URL scheme
    window.location.href = targetUrl;
    return true;
  } catch (err) {
    console.error('Failed to open app URL scheme:', err);
    return false;
  }
}

// Close current app simulation / guidance
export function closeCurrentApp() {
  // In iOS / Webkit, window.close() works when opened via script, or sends back to homescreen
  try {
    if (window.navigator?.app?.exitApp) {
      window.navigator.app.exitApp();
      return true;
    }
    // Attempt standard window.close
    window.close();
  } catch (e) {
    console.warn('Exit app called:', e);
  }
  return false;
}

