import React, { useState, useEffect } from 'react';
import { Bell, LogOut, CheckCircle2, Hourglass, Clock, ShieldAlert, Volume2 } from 'lucide-react';
import { getActiveTheme } from '../themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatMinutes, formatSeconds } from '../screenTime';
import { notifications } from '../notifications';
import { logoSound } from '../logoAudio';
import AppIconBadge from './AppIconBadge';

export default function SettingsTab({ user, onLogout, showToast }) {
  const [screenTime, setScreenTime] = useState(getScreenTimeData());

  useEffect(() => {
    const handleSt = (e) => {
      if (e.detail) setScreenTime({ ...e.detail });
    };

    window.addEventListener('seif-screentime-updated', handleSt);
    return () => {
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Seif AI Guest (ضيف)</div>
                <div style={{ fontSize: '12px', color: '#38bdf8' }}>⚡ Fast Direct Mode • No Account Needed</div>
              </div>
            </div>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              Instant
            </span>
          </div>
        </div>

        {/* 🎨 Official App Icon Display */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AppIconBadge size={56} radius={18} showBorder={true} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                  Seif Ai Test
                </div>
                <div style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> اضغط الشعار لسماع الصوت
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logoSound.playLogoSound();
                showToast('✨ تم تشغيل نغمة الشعار!', 'success');
              }}
              className="ios-button-secondary"
              style={{ padding: '8px 12px', fontSize: '12px', gap: '6px' }}
              title="تشغيل نغمة الشعار"
            >
              <Volume2 size={15} color="#38bdf8" />
              <span>صوت الشعار 🎵</span>
            </button>
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
