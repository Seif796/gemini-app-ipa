export const ICON_THEMES = [
  {
    id: 'cosmic',
    name: 'Cosmic Violet',
    primary: '#818cf8',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    glow: 'rgba(139, 92, 246, 0.5)',
    badge: '🟣'
  },
  {
    id: 'cyber',
    name: 'Electric Cyan',
    primary: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #3b82f6 100%)',
    glow: 'rgba(6, 182, 212, 0.5)',
    badge: '🔵'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
    glow: 'rgba(245, 158, 11, 0.5)',
    badge: '🟡'
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    glow: 'rgba(16, 185, 129, 0.5)',
    badge: '🟢'
  },
  {
    id: 'ruby',
    name: 'Ruby Crimson',
    primary: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f43f5e 100%)',
    glow: 'rgba(239, 68, 68, 0.5)',
    badge: '🔴'
  }
];

export function getActiveTheme() {
  const savedId = localStorage.getItem('seif_app_icon_theme') || 'cosmic';
  return ICON_THEMES.find(t => t.id === savedId) || ICON_THEMES[0];
}

export function setActiveTheme(themeId) {
  const theme = ICON_THEMES.find(t => t.id === themeId) || ICON_THEMES[0];
  localStorage.setItem('seif_app_icon_theme', theme.id);

  // Update CSS root variables
  document.documentElement.style.setProperty('--accent-gradient', theme.gradient);
  document.documentElement.style.setProperty('--accent-blue', theme.primary);

  // Dispatch custom event for reactive UI updates
  window.dispatchEvent(new CustomEvent('seif-theme-changed', { detail: theme }));
  return theme;
}
