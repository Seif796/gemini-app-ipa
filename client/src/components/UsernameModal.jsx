import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle, X, Shuffle } from 'lucide-react';
import { registerOrLoginUsername, getSavedAccounts, switchAccount } from '../friendsApi';
import { getAppLanguage, getTranslation } from '../i18n';
import AppIconBadge from './AppIconBadge';
import LanguageToggle from './LanguageToggle';

export default function UsernameModal({ isOpen, onClose, hasExistingAccount = false, onComplete, showToast }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  const [username, setUsername] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  useEffect(() => {
    if (isOpen) {
      try {
        setSavedAccounts(getSavedAccounts());
      } catch (_) {
        setSavedAccounts([]);
      }
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateSuggestion = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefixes = lang === 'ar' ? ['سيف', 'نجم', 'صديق', 'بطل', 'user'] : ['seif', 'star', 'alex', 'hero', 'user'];
    const chosen = prefixes[Math.floor(Math.random() * prefixes.length)];
    setUsername(`${chosen}_${rand}`);
    setError('');
  };

  const handleSelectSaved = async (savedName) => {
    if (!savedName) return;
    setLoading(true);
    setError('');
    try {
      const user = await registerOrLoginUsername(savedName, true);
      if (showToast) {
        showToast(`${t.welcomeBackUser} @${user.username}!`, 'success');
      }
      if (onComplete) onComplete(user.username);
    } catch (err) {
      setError(err.message || t.errUsernameNotFound);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Clean leading @, normalize whitespace to underscore, strip disallowed characters
    let clean = (username || '').trim().replace(/^@+/, '').replace(/\s+/g, '_');
    clean = clean.replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF-]/g, '');

    if (!clean) {
      setError(t.errEmptyUsername || (lang === 'ar' ? 'يرجى إدخال اسم المستخدم' : 'Please enter a username'));
      return;
    }

    if (clean.length < 2) {
      setError(t.errUsernameTooShort || (lang === 'ar' ? 'اسم المستخدم يجب أن يكون حرفين على الأقل' : 'Username must be at least 2 characters'));
      return;
    }

    setLoading(true);
    try {
      const user = await registerOrLoginUsername(clean, isExisting);
      if (showToast) {
        showToast(isExisting ? `${t.welcomeBackUser} @${user.username}!` : `${t.welcomeNewUser} @${user.username}!`, 'success');
      }
      if (onComplete) onComplete(user.username);
    } catch (err) {
      setError(err.message || t.errUsernameNotFound || (lang === 'ar' ? 'حدث خطأ أثناء حفظ الحساب' : 'Error saving account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'rgba(18, 22, 34, 0.96)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
        textAlign: 'center',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Top Controls: Close (if can dismiss) + Language Toggle */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: lang === 'ar' ? '16px' : 'auto',
          right: lang === 'ar' ? 'auto' : '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {(hasExistingAccount && onClose) && (
            <button
              type="button"
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
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X size={16} />
            </button>
          )}
          <LanguageToggle compact={true} showToast={showToast} />
        </div>

        {/* App Logo & Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', marginTop: '10px' }}>
          <AppIconBadge size={62} radius={20} showBorder={true} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          {isExisting ? t.modalTitleExisting : t.modalTitleNew}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.4' }}>
          {isExisting ? t.modalSubtitleExisting : t.modalSubtitleNew}
        </p>

        {/* Tab Switcher: New vs Existing */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '4px',
          marginBottom: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setIsExisting(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: !isExisting ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: !isExisting ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            {t.tabNewUser}
          </button>
          <button
            type="button"
            onClick={() => { setIsExisting(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: isExisting ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: isExisting ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            {t.tabExistingUser}
          </button>
        </div>

        {/* Existing Accounts Fast Selection (Shown when on Existing tab or if saved accounts exist) */}
        {isExisting && savedAccounts.length > 0 && (
          <div style={{
            marginBottom: '16px',
            textAlign: lang === 'ar' ? 'right' : 'left',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
              {lang === 'ar' ? '📌 حساباتك السابقة على هذا الهاتف:' : '📌 Previously saved on this device:'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {savedAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSelectSaved(acc.username)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} color="#38bdf8" />
                    <span>@{acc.username}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                    {lang === 'ar' ? 'دخول فوراً ⚡' : 'Sign in ⚡'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: lang === 'ar' ? 'auto' : '14px',
              right: lang === 'ar' ? '14px' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#38bdf8',
              fontWeight: '700',
              fontSize: '15px'
            }}>
              @
            </span>
            <input
              type="text"
              placeholder={t.inputUsernamePlaceholder || (lang === 'ar' ? 'اكتب اسم المستخدم...' : 'Type username...')}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              disabled={loading}
              autoFocus
              dir="auto"
              style={{
                width: '100%',
                padding: lang === 'ar' ? '14px 34px 14px 14px' : '14px 14px 14px 34px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: error ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Suggestion pill for fast 1-click naming */}
          {!isExisting && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <button
                type="button"
                onClick={handleGenerateSuggestion}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                <Shuffle size={12} />
                <span>{lang === 'ar' ? 'اقتراح اسم عشوائي ✨' : 'Suggest random name ✨'}</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              fontSize: '12px',
              textAlign: lang === 'ar' ? 'right' : 'left',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading || !username.trim() ? 'default' : 'pointer',
              opacity: loading || !username.trim() ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <span>{t.btnSubmitting}</span>
            ) : (
              <>
                <span>{isExisting ? t.btnSubmitExisting : t.btnSubmitNew}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b' }}>
          {t.permanentNotice}
        </div>
      </div>
    </div>
  );
}
