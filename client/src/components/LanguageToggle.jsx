import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { getAppLanguage, toggleAppLanguage, getTranslation } from '../i18n';

export default function LanguageToggle({ compact = false, showToast = null }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  const handleToggle = (e) => {
    e?.stopPropagation?.();
    const nextLang = toggleAppLanguage();
    if (showToast) {
      showToast(nextLang === 'ar' ? 'تم تحويل لغة التطبيق إلى العربية 🇸🇦' : 'App language switched to English 🇺🇸', 'success');
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: '#38bdf8',
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        <Globe size={14} color="#38bdf8" />
        <span>{t.switchLanguage}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="ios-button-secondary"
      style={{
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '16px',
        color: '#38bdf8'
      }}
    >
      <Globe size={15} color="#38bdf8" />
      <span>{t.switchLanguage}</span>
    </button>
  );
}
