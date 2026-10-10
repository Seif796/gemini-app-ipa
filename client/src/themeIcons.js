export const ICON_THEMES = [
  {
    id: 'cosmic',
    name: 'Cosmic Violet',
    primary: '#818cf8',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    glow: 'rgba(139, 92, 246, 0.5)',
    symbol: 'sparkles',
    badge: '🟣'
  },
  {
    id: 'cyber',
    name: 'Electric Cyan',
    primary: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #3b82f6 100%)',
    glow: 'rgba(6, 182, 212, 0.5)',
    symbol: 'zap',
    badge: '🔵'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
    glow: 'rgba(245, 158, 11, 0.5)',
    symbol: 'crown',
    badge: '🟡'
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    glow: 'rgba(16, 185, 129, 0.5)',
    symbol: 'shield',
    badge: '🟢'
  },
  {
    id: 'ruby',
    name: 'Ruby Crimson',
    primary: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f43f5e 100%)',
    glow: 'rgba(239, 68, 68, 0.5)',
    symbol: 'flame',
    badge: '🔴'
  },
  {
    id: 'stealth',
    name: 'Midnight Stealth',
    primary: '#94a3b8',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #1e293b 100%)',
    glow: 'rgba(148, 163, 184, 0.4)',
    symbol: 'moon',
    badge: '🖤'
  }
];

export function getCustomIconImage() {
  return '/app-icon.png';
}

export function setCustomIconImage(dataUrl) {
  updateFavicon('/app-icon.png');
}

export function getActiveTheme() {
  try {
    const savedId = localStorage.getItem('seif_app_icon_theme') || 'cosmic';
    return ICON_THEMES.find(t => t.id === savedId) || ICON_THEMES[0];
  } catch (_) {
    return ICON_THEMES[0];
  }
}

export function setActiveTheme(themeId) {
  const theme = ICON_THEMES.find(t => t.id === themeId) || ICON_THEMES[0];
  try {
    localStorage.setItem('seif_app_icon_theme', theme.id);
  } catch (_) {}

  // Update CSS root variables
  document.documentElement.style.setProperty('--accent-gradient', theme.gradient);
  document.documentElement.style.setProperty('--accent-blue', theme.primary);

  // Clear custom image if preset selected
  if (!getCustomIconImage()) {
    updateFaviconWithTheme(theme);
  }

  // Dispatch custom event for reactive UI updates
  window.dispatchEvent(new CustomEvent('seif-theme-changed', { detail: theme }));
  return theme;
}

function updateFavicon(dataUrl) {
  try {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (dataUrl) {
      link.href = dataUrl;
    }
  } catch (e) {}
}

function updateFaviconWithTheme(theme) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw rounded square
    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.roundRect(0, 0, 64, 64, 16);
    ctx.fill();

    // Draw white center dot / star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.fill();

    updateFavicon(canvas.toDataURL());
  } catch (e) {}
}
