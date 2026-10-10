import React, { useState, useEffect } from 'react';
import { 
  X, Info, Sparkles, Shield, Cpu, Code2, Heart, Share2, 
  Copy, Check, Phone, MessageSquare, MapPin, Users, Hourglass, 
  Volume2, Globe, CheckCircle2 
} from 'lucide-react';
import { getAppLanguage, getTranslation } from '../i18n';
import AppIconBadge from './AppIconBadge';
import { logoSound } from '../logoAudio';

export default function AboutModal({ isOpen, onClose, showToast }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  if (!isOpen) return null;

  const appInfoText = `📱 Seif AI Companion
Version: v2.5.0 (Build 2026.10 iOS)
Developer: Seif (سيف)
Engine: Google Gemini 2.5 Flash
Features: AI Chat, HD Voice & Video Calls, Real-Time Friends & DM, Radar Distance Alerts, Screen Time & Multi-Account.
Status: Connected & Ready 24/7`;

  const handleCopyInfo = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appInfoText);
      }
      setCopied(true);
      if (showToast) showToast(t.appInfoCopied || 'تم نسخ معلومات التطبيق! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      if (showToast) showToast(t.appInfoCopied || 'تم النسخ!', 'info');
    }
  };

  const handlePlayChime = () => {
    logoSound.playLogoSound();
    if (showToast) showToast(t.logoSoundToast || '✨ تم تشغيل نغمة الشعار!', 'success');
  };

  const featureList = [
    { icon: Sparkles, color: '#38bdf8', text: t.featureGeminiAi },
    { icon: MessageSquare, color: '#60a5fa', text: t.featureFriendsDm },
    { icon: Phone, color: '#34d399', text: t.featureCalls },
    { icon: MapPin, color: '#f43f5e', text: t.featureRadar },
    { icon: Users, color: '#a855f7', text: t.featureAccounts },
    { icon: Hourglass, color: '#f59e0b', text: t.featureScreenTime },
    { icon: Shield, color: '#10b981', text: t.featurePrivacy }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '28px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>
              {t.aboutAppTitle || 'حول التطبيق'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Main Hero Card */}
          <div style={{
            textAlign: 'center',
            padding: '20px 16px',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={handlePlayChime}>
              <AppIconBadge size={72} radius={22} showBorder={true} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
              Seif AI Companion
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              color: '#38bdf8',
              fontWeight: '700',
              marginBottom: '10px'
            }}>
              <Sparkles size={12} />
              <span>v2.5.0 • iOS Build 2026.10</span>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: '1.5',
              maxWidth: '320px',
              margin: '0 auto'
            }}>
              {t.aboutDescription}
            </p>

            {/* Quick Chime & Copy actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={handlePlayChime}
                style={{
                  padding: '7px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Volume2 size={13} color="#38bdf8" />
                <span>{lang === 'ar' ? 'صوت الشعار 🎵' : 'Play Chime 🎵'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyInfo}
                style={{
                  padding: '7px 12px',
                  borderRadius: '12px',
                  background: copied ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: copied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
                  color: copied ? '#34d399' : '#38bdf8',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ البيانات 📋' : 'Copy Info 📋')}</span>
              </button>
            </div>
          </div>

          {/* Key Specs Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '18px',
            padding: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                {t.appDeveloperLabel}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code2 size={14} color="#38bdf8" />
                <span>Seif (سيف)</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                {t.appPoweredByLabel}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={14} color="#a855f7" />
                <span>Gemini 2.5 Flash</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                {t.appVersionLabel}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>
                v2.5.0
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                {t.appStatusLabel}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#34d399' }}>
                {t.appStatusValue}
              </div>
            </div>
          </div>

          {/* Features Highlights */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '18px',
            padding: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={15} color="#38bdf8" />
              <span>{t.aboutFeaturesTitle}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {featureList.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12px',
                      color: '#cbd5e1',
                      padding: '6px 8px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={14} color={item.color} />
                    </div>
                    <span style={{ lineHeight: '1.3' }}>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            paddingTop: '4px'
          }}>
            <span>Crafted with</span>
            <Heart size={12} color="#f43f5e" fill="#f43f5e" />
            <span>by Seif for iOS</span>
          </div>
        </div>

        {/* Bottom Button */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <button
            onClick={onClose}
            className="ios-button-primary"
            style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: '700' }}
          >
            {lang === 'ar' ? 'تم / إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
