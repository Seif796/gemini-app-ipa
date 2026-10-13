import React, { useState, useEffect } from 'react';
import { 
  Bell, LogOut, CheckCircle2, Hourglass, Clock, ShieldAlert, 
  Volume2, UserCheck, Globe, Info, Sparkles, Code2, Cpu, 
  Keyboard, Zap, Share2, Key, Eye, EyeOff, Clipboard, Check, RefreshCw, ExternalLink 
} from 'lucide-react';
import { getActiveTheme } from '../themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatMinutes, formatSeconds } from '../screenTime';
import { notifications } from '../notifications';
import { getCurrentUsername } from '../friendsApi';
import { getAppLanguage, setAppLanguage, getTranslation } from '../i18n';
import { getCustomApiKey, setCustomApiKey, directGeminiCall } from '../api';
import AppIconBadge from './AppIconBadge';
import LanguageToggle from './LanguageToggle';
import AboutModal from './AboutModal';

export default function SettingsTab({ user, onLogout, showToast, onOpenAbout, onOpenFrancoKeyboard }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);
  const [screenTime, setScreenTime] = useState(getScreenTimeData());
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getCustomApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);

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

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    setCustomApiKey(trimmed);
    showToast(lang === 'ar' ? 'تم حفظ مفتاح Gemini بنجاح! ⚡' : 'Gemini API key saved! ⚡', 'success');
    setKeyTestResult(null);
  };

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const val = text.trim();
        setApiKeyInput(val);
        setCustomApiKey(val);
        showToast(lang === 'ar' ? 'تم لصق وحفظ المفتاح مباشرة! 📋' : 'Pasted and saved key! 📋', 'success');
        setKeyTestResult(null);
      } else {
        showToast(lang === 'ar' ? 'الحافظة فارغة' : 'Clipboard is empty', 'info');
      }
    } catch (_) {
      showToast(lang === 'ar' ? 'يرجى لصق المفتاح يدوياً داخل الحقل' : 'Please paste manually into the input', 'info');
    }
  };

  const handleTestApiKey = async () => {
    const current = apiKeyInput.trim() || getCustomApiKey();
    if (!current) {
      showToast(lang === 'ar' ? 'يرجى إدخال مفتاح Gemini أولاً' : 'Please enter a Gemini key first', 'warning');
      return;
    }
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await directGeminiCall('Respond with "OK"');
      if (res && res.reply) {
        setKeyTestResult('valid');
        showToast(lang === 'ar' ? 'المفتاح يعمل بنجاح 100%! 🚀' : 'Gemini key is active and working! 🚀', 'success');
      } else {
        setKeyTestResult('invalid');
        showToast(lang === 'ar' ? 'فشل التحقق من المفتاح' : 'Key validation failed', 'error');
      }
    } catch (err) {
      setKeyTestResult('invalid');
      showToast(err.message || (lang === 'ar' ? 'المفتاح غير صالح أو الاتصال مقطوع' : 'Key invalid or network error'), 'error');
    } finally {
      setIsTestingKey(false);
    }
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
        {/* 🔑 Gemini API Key Configuration Card */}
        <div className="glass-panel" style={{
          padding: '18px',
          border: '1.5px solid rgba(129, 140, 248, 0.45)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Key size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  {lang === 'ar' ? 'مفتاح ذكاء اصطناعي (Gemini API)' : 'Google Gemini API Key'}
                </h3>
                <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700' }}>
                  Gemini 2.5 Flash & Pro Engine ⚡
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              padding: '3px 9px',
              borderRadius: '12px',
              background: apiKeyInput.trim() ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: apiKeyInput.trim() ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              color: apiKeyInput.trim() ? '#34d399' : '#fbbf24',
              fontWeight: '800'
            }}>
              {apiKeyInput.trim() ? (lang === 'ar' ? 'مفعل ومضبوط ✅' : 'Configured ✅') : (lang === 'ar' ? 'غير محدد ⚠️' : 'Not Set ⚠️')}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px', lineHeight: '1.4' }}>
            {lang === 'ar' 
              ? 'أدخل مفتاح Gemini API الخاص بك لتشغيل المحادثات وحل المسائل بالصور بدون قيود وبأعلى سرعة ممكنة.'
              : 'Enter your personal Google Gemini API key to run AI conversations and multimodal vision at maximum speed.'}
          </p>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy... (Paste Gemini API Key)"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setKeyTestResult(null);
              }}
              className="ios-input"
              style={{
                width: '100%',
                paddingRight: '76px',
                paddingLeft: '14px',
                fontSize: '13px',
                fontFamily: showKey ? 'monospace' : 'inherit',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#fff',
                height: '42px'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'إخفاء' : 'إظهار'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={handlePasteApiKey}
                title="لصق من الحافظة"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                لصق
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={handleSaveApiKey}
              className="ios-button-primary"
              style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center' }}
            >
              <Check size={15} />
              <span>{lang === 'ar' ? 'حفظ المفتاح' : 'Save Key'}</span>
            </button>
            <button
              disabled={isTestingKey}
              onClick={handleTestApiKey}
              className="ios-button-secondary"
              style={{ padding: '10px 14px', fontSize: '13px', justifyContent: 'center' }}
            >
              {isTestingKey ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} color="#fbbf24" />}
              <span>{isTestingKey ? (lang === 'ar' ? 'جاري الفحص...' : 'Testing...') : (lang === 'ar' ? 'اختبار الاتصال' : 'Test Key')}</span>
            </button>
          </div>

          {keyTestResult === 'valid' && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <CheckCircle2 size={15} />
              <span>{lang === 'ar' ? 'تم الاتصال بنجاح! المفتاح يعمل وجاهز 🚀' : 'Success! Gemini key is active & ready 🚀'}</span>
            </div>
          )}

          {keyTestResult === 'invalid' && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <ShieldAlert size={15} />
              <span>{lang === 'ar' ? 'المفتاح غير صالح أو لم يتم تفعيله بعد' : 'Invalid key. Please verify on Google AI Studio'}</span>
            </div>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: '700',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(129, 140, 248, 0.1)'
            }}
          >
            <ExternalLink size={13} />
            <span>{lang === 'ar' ? 'احصل على مفتاح مجاني في 30 ثانية (Google AI Studio) ↗' : 'Get a free key in 30 seconds (Google AI Studio) ↗'}</span>
          </a>
        </div>

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

          <div>
            <button
              onClick={() => {
                if (onOpenAbout) onOpenAbout();
                else setIsAboutOpen(true);
              }}
              className="ios-button-primary"
              style={{ width: '100%', padding: '12px', fontSize: '13px', gap: '8px', justifyContent: 'center' }}
            >
              <Info size={15} />
              <span>{lang === 'ar' ? 'تفاصيل ومعلومات التطبيق ℹ️' : 'About Application Details ℹ️'}</span>
            </button>
          </div>
        </div>

        {/* ⌨️ Seif Franco Keyboard Card (Featured like Snapchat Bitmoji Keyboard) */}
        <div className="glass-panel" style={{
          padding: '18px',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)',
          boxShadow: '0 8px 32px rgba(56, 189, 248, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Keyboard size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  لوحة مفاتيح سيف فرانكو
                </h3>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  Franco Keyboard • iOS Extension ⚡
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '3px 9px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontWeight: '800'
            }}>
              مفعل 🟢
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '14px', lineHeight: '1.5' }}>
            {lang === 'ar'
              ? 'كيبورد ذكي يترجم العربي إلى فرانكو تلقائياً فور كتابتك! يمكنك تفعيله في إعدادات الآيفون لاستخدامه مباشرة في الواتساب وفي كل التطبيقات ككيبورد رسمي.'
              : 'Smart keyboard that converts Arabic to Franco automatically! Enable it in iOS Settings to use directly inside WhatsApp and everywhere across the system.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onOpenFrancoKeyboard && onOpenFrancoKeyboard()}
              className="ios-button-primary"
              style={{ width: '100%', padding: '12px', fontSize: '13px', gap: '8px', justifyContent: 'center' }}
            >
              <Zap size={16} />
              <span>{lang === 'ar' ? 'تجربة الكيبورد وتخصيص الألوان ⌨️' : 'Try Keyboard & Themes ⌨️'}</span>
            </button>

            <button
              onClick={() => onOpenFrancoKeyboard && onOpenFrancoKeyboard()}
              className="ios-button-secondary"
              style={{ width: '100%', padding: '11px', fontSize: '12px', gap: '6px', justifyContent: 'center' }}
            >
              <Share2 size={14} color="#38bdf8" />
              <span>{lang === 'ar' ? '📲 طريقة التفعيل في إعدادات الآيفون (WhatsApp)' : 'iOS Settings Activation Guide (WhatsApp)'}</span>
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
