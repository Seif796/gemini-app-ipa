import React, { useState, useEffect, useRef } from 'react';
import { Palette, Sparkles, Check, Bell, Upload, RotateCcw, Image, LogOut, CheckCircle2, Hourglass, Clock, ShieldAlert } from 'lucide-react';
import { ICON_THEMES, getActiveTheme, setActiveTheme, getCustomIconImage, setCustomIconImage } from '../themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatMinutes, formatSeconds } from '../screenTime';
import { notifications } from '../notifications';
import AppIconBadge from './AppIconBadge';

export default function SettingsTab({ user, onLogout, showToast }) {
  const [activeThemeId, setActiveThemeId] = useState(getActiveTheme().id);
  const [customImg, setCustomImg] = useState(getCustomIconImage());
  const [screenTime, setScreenTime] = useState(getScreenTimeData());
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleTheme = (e) => setActiveThemeId(e.detail?.id || getActiveTheme().id);
    const handleImg = (e) => setCustomImg(e.detail);
    const handleSt = (e) => {
      if (e.detail) setScreenTime({ ...e.detail });
    };

    window.addEventListener('seif-theme-changed', handleTheme);
    window.addEventListener('seif-icon-image-changed', handleImg);
    window.addEventListener('seif-screentime-updated', handleSt);
    return () => {
      window.removeEventListener('seif-theme-changed', handleTheme);
      window.removeEventListener('seif-icon-image-changed', handleImg);
      window.removeEventListener('seif-screentime-updated', handleSt);
    };
  }, []);

  const updateScreenTimeConfig = (updater) => {
    setScreenTime((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveScreenTimeData(updated);
      return updated;
    });
  };

  const handleSelectTheme = (themeId) => {
    setCustomIconImage(null); // Clear custom image when selecting a preset theme
    setCustomImg(null);
    setActiveTheme(themeId);
    setActiveThemeId(themeId);
    showToast('App icon updated! 🎨', 'success');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setCustomIconImage(base64);
        setCustomImg(base64);
        showToast('Custom App Icon uploaded & applied! 🖼️', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaultIcon = () => {
    setCustomIconImage(null);
    setCustomImg(null);
    setActiveTheme('cosmic');
    setActiveThemeId('cosmic');
    showToast('Reset to default App Icon! 🔄', 'info');
  };

  const handleTestNotification = async () => {
    await notifications.requestPermission();
    await notifications.sendNow('Seif Ai Test', '🔔 Notification alerts are active on your iPhone!');
    showToast('Test notification sent to your phone!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>App Settings</h1>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Customize App Icon, Notifications & Profile</p>
      </header>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* User Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AppIconBadge size={44} radius={14} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{user?.name || 'iPhone User'}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Seif Ai Test • 24/7 Active</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="ios-button-secondary"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px' }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 🎨 APP ICON CUSTOMIZER (Centerpiece) */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Palette size={18} color="#c084fc" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>App Icon (تغيير صورة وأيقونة التطبيق)</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.4' }}>
            Choose from custom designer icons below or upload your own personal photo/logo:
          </p>

          {/* Current Icon Preview Showcase */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AppIconBadge size={64} radius={20} showBorder={true} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                  {customImg ? 'Custom User Photo' : (ICON_THEMES.find(t => t.id === activeThemeId)?.name || 'Default Icon')}
                </div>
                <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Active on your iPhone
                </div>
              </div>
            </div>

            {customImg && (
              <button
                onClick={handleResetDefaultIcon}
                className="ios-button-secondary"
                style={{ padding: '6px 10px', fontSize: '11px', gap: '4px' }}
                title="Reset to default icon"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Upload Custom Photo Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="ios-button-primary"
            style={{
              width: '100%',
              marginBottom: '16px',
              padding: '12px',
              fontSize: '13px',
              gap: '8px'
            }}
          >
            <Upload size={16} />
            <span>Upload Your Own Photo as App Icon (رفع صورتك للأيقونة)</span>
          </button>

          {/* Designer Icons Grid */}
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
            Or choose a designer icon theme:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {ICON_THEMES.map((theme) => {
              const isSelected = !customImg && activeThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? `2px solid ${theme.primary}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: theme.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 10px ${theme.glow}`,
                    flexShrink: 0
                  }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {theme.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{theme.badge} Preset</div>
                  </div>
                  {isSelected && <Check size={14} color={theme.primary} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Screen Time & Digital Wellbeing Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hourglass size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Screen Time (وقت الشاشة)</h3>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              fontWeight: '600'
            }}>
              Wellbeing
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.4' }}>
            تحكم في مدة استخدامك اليومية للتطبيق واحصل على تنبيهات استراحة لحماية عينيك وتنظيم وقتك.
          </p>

          {/* Today's Usage Stats Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#38bdf8" />
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>اليوم (Today's Usage):</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
              {formatSeconds(screenTime.todayUsageSeconds)}
            </span>
          </div>

          {/* Daily Limit Switch & Selector */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            padding: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: screenTime.limitEnabled ? '10px' : '0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>الحد اليومي (Daily Limit)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>إيقاف التطبيق عند الوصول للحد المحدد</div>
              </div>
              <input
                type="checkbox"
                checked={screenTime.limitEnabled}
                onChange={(e) => {
                  updateScreenTimeConfig({ limitEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Daily screen time limit turned ON' : 'Daily limit turned OFF', 'info');
                }}
                style={{ width: '20px', height: '20px', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>

            {screenTime.limitEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', paddingTop: '8px' }}>
                {[15, 30, 45, 60, 90, 120].map((mins) => {
                  const isSelected = screenTime.dailyLimitMinutes === mins;
                  return (
                    <button
                      key={mins}
                      onClick={() => {
                        updateScreenTimeConfig({ dailyLimitMinutes: mins });
                        showToast(`Daily limit set to ${formatMinutes(mins)}`, 'success');
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#fbbf24' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {formatMinutes(mins)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Break Reminders Switch */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            padding: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>تنبيهات الاستراحة (Break Reminders)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>إشعار كل 20 دقيقة استخدام متواصل لأخذ راحة</div>
              </div>
              <input
                type="checkbox"
                checked={screenTime.breakRemindersEnabled}
                onChange={(e) => {
                  updateScreenTimeConfig({ breakRemindersEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Break reminders enabled' : 'Break reminders disabled', 'info');
                }}
                style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Notifications & Reminders Alert Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bell size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>iPhone Notifications</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            Get sound alerts when Seif Ai Test responds in the background, or when you set a reminder (e.g. <em>"Remind me in 5 minutes to..."</em>).
          </p>

          <button
            onClick={handleTestNotification}
            className="ios-button-secondary"
            style={{ width: '100%', fontSize: '13px', padding: '10px' }}
          >
            <Bell size={15} />
            <span>Test Notification Alert on iPhone</span>
          </button>
        </div>
      </div>
    </div>
  );
}
