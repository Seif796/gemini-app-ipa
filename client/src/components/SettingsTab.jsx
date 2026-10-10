import React, { useState, useEffect } from 'react';
import { 
  Bell, LogOut, CheckCircle2, Hourglass, Clock, ShieldAlert, 
  Volume2, UserCheck, Globe, Info, Sparkles, Code2, Cpu 
} from 'lucide-react';
import { getActiveTheme } from '../themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatMinutes, formatSeconds } from '../screenTime';
import { notifications } from '../notifications';
import { logoSound } from '../logoAudio';
import { getCurrentUsername } from '../friendsApi';
import { getAppLanguage, setAppLanguage, getTranslation } from '../i18n';
import AppIconBadge from './AppIconBadge';
import LanguageToggle from './LanguageToggle';
import AboutModal from './AboutModal';

export default function SettingsTab({ user, onLogout, showToast, onOpenAbout }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);
  const [screenTime, setScreenTime] = useState(getScreenTimeData());
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    const handleSt = (e) => {
      if (e.detail) setScreenTime({ ...e.detail });
    };

    const handleLang = (e) => {
      setLang(e.detail || getAppLanguage());
    };

    window.addEventListener('seif-screentime-updated', handleSt);
    window.addEventListener('seif-language-changed', handleLang);
    return () => {
      window.removeEventListener('seif-screentime-updated', handleSt);
      window.removeEventListener('seif-language-changed', handleLang);
    };
  }, []);

  const handleSelectLanguage = (newLang) => {
    if (newLang === lang) return;
    setAppLanguage(newLang);
    setLang(newLang);
    showToast(newLang === 'ar' ? 'تم ضبط لغة التطبيق: العربية 🇸🇦' : 'App language set to: English 🇺🇸', 'success');
  };

  const updateScreenTimeConfig = (updater) => {
    setScreenTime((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveScreenTimeData(updated);
      return updated;
    });
  };

  const handleTestNotification = async () => {
    await notifications.requestPermission();
    await notifications.sendNow('Seif Ai Test', lang === 'ar' ? '🔔 التنبيهات ونغمة الإشعار مفعلة وتعمل بنجاح على هاتفك!' : '🔔 Notification alerts and crystal chime are active on your iPhone!');
    showToast(t.testNotificationToast, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>{t.settingsHeaderTitle}</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t.settingsHeaderSubtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (onOpenAbout) onOpenAbout();
              else setIsAboutOpen(true);
            }}
            title={t.aboutAppTitle}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Info size={16} />
          </button>
          <LanguageToggle compact={true} showToast={showToast} />
        </div>
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
        {/* 🌐 Language Switcher Card (Arabic / English) */}
        <div className="glass-panel" style={{ padding: '16px', border: '1.5px solid rgba(56, 189, 248, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{t.languageSettingTitle}</h3>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: '700'
            }}>
              {lang === 'ar' ? 'العربية' : 'English'}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.4' }}>
            {t.languageSettingDesc}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSelectLanguage('ar')}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                border: lang === 'ar' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                background: lang === 'ar' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                color: lang === 'ar' ? '#38bdf8' : '#cbd5e1',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>🇸🇦 العربية (Arabic)</span>
              {lang === 'ar' && <CheckCircle2 size={16} color="#38bdf8" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                border: lang === 'en' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                background: lang === 'en' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                color: lang === 'en' ? '#38bdf8' : '#cbd5e1',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>🇺🇸 English (الإنجليزية)</span>
              {lang === 'en' && <CheckCircle2 size={16} color="#38bdf8" />}
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AppIconBadge size={44} radius={14} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  @{getCurrentUsername() || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={13} /> {t.permanentAccountDesc}
                </div>
              </div>
            </div>
            <span style={{
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {t.active}
            </span>
          </div>
        </div>

        {/* ℹ️ About App & Developer Card */}
        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                {t.aboutAppTitle || 'حول التطبيق'}
              </h3>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: '700'
            }}>
              v2.5.0
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: '16px',
            marginBottom: '12px'
          }}>
            <AppIconBadge size={52} radius={16} showBorder={true} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                Seif AI Companion
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.3' }}>
                {lang === 'ar' ? 'تطوير: سيف • محرك الذكاء: Gemini 2.5' : 'Developer: Seif • Powered by Gemini 2.5'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => {
                if (onOpenAbout) onOpenAbout();
                else setIsAboutOpen(true);
              }}
              className="ios-button-primary"
              style={{ padding: '10px', fontSize: '12px', gap: '6px', justifyContent: 'center' }}
            >
              <Info size={14} />
              <span>{lang === 'ar' ? 'تفاصيل التطبيق ℹ️' : 'About Details ℹ️'}</span>
            </button>

            <button
              onClick={() => {
                logoSound.playLogoSound();
                showToast(t.logoSoundToast, 'success');
              }}
              className="ios-button-secondary"
              style={{ padding: '10px', fontSize: '12px', gap: '6px', justifyContent: 'center' }}
            >
              <Volume2 size={14} color="#38bdf8" />
              <span>{lang === 'ar' ? 'صوت الشعار 🎵' : 'Logo Chime 🎵'}</span>
            </button>
          </div>
        </div>

        {/* Screen Time & Digital Wellbeing Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hourglass size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{t.screenTimeTitle}</h3>
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
            {t.screenTimeDesc}
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
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{t.todayUsageLabel}</span>
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
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{t.dailyLimitLabel}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{t.dailyLimitDesc}</div>
              </div>
              <input
                type="checkbox"
                checked={screenTime.limitEnabled}
                onChange={(e) => {
                  updateScreenTimeConfig({ limitEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Daily limit enabled' : 'Daily limit disabled', 'info');
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
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{t.breakRemindersLabel}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{t.breakRemindersDesc}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{t.notificationSoundTitle}</h3>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: '600'
            }}>
              Active 🔔
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            {t.notificationSoundDesc}
          </p>

          <button
            onClick={handleTestNotification}
            className="ios-button-primary"
            style={{ width: '100%', fontSize: '13px', padding: '11px', gap: '8px' }}
          >
            <Bell size={16} />
            <span>{t.testNotificationBtn}</span>
          </button>
        </div>
      </div>

      {/* About App Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}
