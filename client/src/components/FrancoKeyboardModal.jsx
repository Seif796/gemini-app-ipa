import React, { useState, useEffect } from 'react';
import { 
  X, Keyboard, Sparkles, Copy, Check, Share2, ArrowRight, 
  Send, ExternalLink, Globe, Delete, RefreshCw, Zap, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { convertArabicToFranco, convertCharToFranco } from '../francoConverter';
import { getAppLanguage } from '../i18n';

// Arabic Keyboard Rows
const AR_ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'];
const AR_ROW_2 = ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'];
const AR_ROW_3 = ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'];

// Franco / English QWERTY Rows
const EN_ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const EN_ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const EN_ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

// Numerals & Franco Special Keys (3, 7, 5, 2, 6, 9)
const NUM_ROW_1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const NUM_ROW_2 = ['3', '7', '5', '2', '6', '9', '8', "'", '!', '?'];

// Themes
const KEYBOARD_THEMES = [
  { id: 'cyber', name: 'Cyber Blue', bg: '#0b0f19', keyBg: 'rgba(56, 189, 248, 0.12)', border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)' },
  { id: 'midnight', name: 'Midnight Dark', bg: '#07090e', keyBg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.2)', glow: 'rgba(255, 255, 255, 0.2)' },
  { id: 'emerald', name: 'Neon Emerald', bg: '#061a14', keyBg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'purple', name: 'Electric Purple', bg: '#130d24', keyBg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'gold', name: 'Obsidian Gold', bg: '#19140a', keyBg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
];

export default function FrancoKeyboardModal({ isOpen, onClose, onInsertText, showToast }) {
  const [lang] = useState(getAppLanguage());
  const [inputText, setInputText] = useState('');
  const [francoText, setFrancoText] = useState('');
  const [isFrancoActive, setIsFrancoActive] = useState(true);
  const [keyboardMode, setKeyboardMode] = useState('ar'); // 'ar' | 'en' | 'num'
  const [activeTheme, setActiveTheme] = useState(KEYBOARD_THEMES[0]);
  const [activeTab, setActiveTab] = useState('keyboard'); // 'keyboard' | 'guide'
  const [copied, setCopied] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);

  useEffect(() => {
    if (isFrancoActive) {
      setFrancoText(convertArabicToFranco(inputText));
    } else {
      setFrancoText(inputText);
    }
  }, [inputText, isFrancoActive]);

  if (!isOpen) return null;

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  };

  const handleKeyPress = (ch) => {
    triggerHaptic();
    setPressedKey(ch);
    setTimeout(() => setPressedKey(null), 180);

    setInputText((prev) => prev + ch);
  };

  const handleBackspace = () => {
    triggerHaptic();
    setPressedKey('back');
    setTimeout(() => setPressedKey(null), 180);

    setInputText((prev) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    triggerHaptic();
    setInputText((prev) => prev + ' ');
  };

  const handleClear = () => {
    triggerHaptic();
    setInputText('');
  };

  const handleCopyFranco = async () => {
    const textToCopy = francoText || inputText;
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      if (showToast) showToast('تم نسخ الفرانكو للحافظة! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      if (showToast) showToast('تم النسخ!', 'info');
    }
  };

  const handleSendToWhatsApp = () => {
    const textToSend = francoText || inputText;
    if (!textToSend) {
      if (showToast) showToast('يرجى كتابة نص أولاً للمشاركة', 'warning');
      return;
    }

    const encoded = encodeURIComponent(textToSend);
    // WhatsApp URL scheme for iOS & Web
    const whatsappUrl = `whatsapp://send?text=${encoded}`;
    const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      window.location.href = whatsappUrl;
      setTimeout(() => {
        window.open(webWhatsappUrl, '_blank');
      }, 700);
      if (showToast) showToast('جاري فتح الواتساب... 💬', 'success');
    } catch (_) {
      window.open(webWhatsappUrl, '_blank');
    }
  };

  const handleInsertToApp = () => {
    const textToInsert = francoText || inputText;
    if (onInsertText && textToInsert) {
      onInsertText(textToInsert);
      if (showToast) showToast('تم إدراج النص في الشات! ✨', 'success');
      onClose();
    }
  };

  const openIosSettings = () => {
    try {
      window.location.href = 'App-Prefs:root=General&path=Keyboard';
      setTimeout(() => {
        window.location.href = 'App-Prefs:';
      }, 500);
    } catch (_) {}
    if (showToast) showToast('افتح تطبيق الإعدادات ➔ عام ➔ لوحة المفاتيح', 'info');
  };

  return (
    <div className="animate-backdrop" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Container Box */}
      <div className="animate-slide-up" style={{
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        background: activeTheme.bg,
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        borderTop: `2px solid ${activeTheme.border}`,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 -10px 40px ${activeTheme.glow}, 0 -20px 60px rgba(0,0,0,0.8)`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden'
      }}>
        {/* Top Handle & Switch Tabs */}
        <div style={{
          padding: '12px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
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
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>كيبورد سيف فرانكو</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontWeight: '700'
                }}>
                  iOS Extension
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Pill (Keyboard / Guide) */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '3px'
          }}>
            <button
              onClick={() => setActiveTab('keyboard')}
              style={{
                padding: '5px 12px',
                borderRadius: '13px',
                border: 'none',
                background: activeTab === 'keyboard' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: activeTab === 'keyboard' ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ⌨️ تجربة الكيبورد
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              style={{
                padding: '5px 12px',
                borderRadius: '13px',
                border: 'none',
                background: activeTab === 'guide' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: activeTab === 'guide' ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📲 تفعيل في الآيفون
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
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

        {activeTab === 'guide' ? (
          /* iOS Settings Setup Guide (Like Snapchat Bitmoji) */
          <div style={{ padding: '20px 18px', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
              }}>
                <Keyboard size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>
                تفعيل لوحة المفاتيح في نظام iOS
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', maxWidth: '380px', margin: '0 auto' }}>
                لإتاحة الكيبورد في **الواتساب، الملاحظات، وسفاري**، اتبع الخطوات السهلة التالية مثل لوحة مفاتيح سناب شات:
              </p>
            </div>

            {/* Step-by-Step Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { step: '1', title: 'افتح إعدادات الآيفون (Settings)', desc: 'انتقل إلى تطبيق الإعدادات في هاتفك.' },
                { step: '2', title: 'عام (General) ➔ لوحة المفاتيح (Keyboard)', desc: 'اضغط على قسم عام ثم لوحة المفاتيح.' },
                { step: '3', title: 'لوحات المفاتيح ➔ إضافة لوحة مفاتيح جديدة...', desc: 'ستظهر لك قائمة لوحات المفاتيح المتاحة.' },
                { step: '4', title: 'اختر: Seif Franco Keyboard', desc: 'اضغط عليها ثم فعّل "السماح بالوصول الكامل (Allow Full Access)".' },
                { step: '5', title: 'جاهز للاستخدام في الواتساب! 💬', desc: 'في أي محادثة اضغط مطولاً على أيقونة الكرة الأرضية 🌐 للتبديل للكيبورد.' },
              ].map((s) => (
                <div key={s.step} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '12px'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    color: '#07090e',
                    fontWeight: '900',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shortcut button */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={openIosSettings}
                className="ios-button-primary"
                style={{ flex: 1, padding: '12px', fontSize: '13px', gap: '8px' }}
              >
                <ExternalLink size={16} />
                <span>فتح إعدادات الآيفون الآن ⚙️</span>
              </button>
              <button
                onClick={() => setActiveTab('keyboard')}
                className="ios-button-secondary"
                style={{ padding: '12px 18px', fontSize: '13px' }}
              >
                جرب الكيبورد
              </button>
            </div>
          </div>
        ) : (
          /* Live Interactive Keyboard Playground */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Live Dual Display: Arabic & Franco Output */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.4)',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              {/* Controls Header: Franco Mode Switch & WhatsApp share */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setIsFrancoActive(!isFrancoActive)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: isFrancoActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.08)',
                      border: `1.5px solid ${isFrancoActive ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                      color: isFrancoActive ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Zap size={13} color={isFrancoActive ? '#38bdf8' : '#94a3b8'} />
                    <span>تحويل فرانكو: {isFrancoActive ? 'مفعل ⚡' : 'معطل'}</span>
                  </button>

                  {/* Theme Switcher Mini */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {KEYBOARD_THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setActiveTheme(th)}
                        title={th.name}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: th.border,
                          border: activeTheme.id === th.id ? '2px solid #fff' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* WhatsApp & Copy actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleSendToWhatsApp}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '12px',
                      background: 'rgba(37, 211, 102, 0.2)',
                      border: '1px solid #25d366',
                      color: '#25d366',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="إرسال إلى واتساب مباشرة"
                  >
                    <Share2 size={12} />
                    <span>واتساب 💬</span>
                  </button>

                  <button
                    onClick={handleCopyFranco}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '12px',
                      background: copied ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      border: copied ? '1px solid #34d399' : '1px solid #38bdf8',
                      color: copied ? '#34d399' : '#38bdf8',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'تم!' : 'نسخ'}</span>
                  </button>

                  {onInsertText && (
                    <button
                      onClick={handleInsertToApp}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      إدراج في الشات ✨
                    </button>
                  )}
                </div>
              </div>

              {/* Text Outputs Display */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '10px 14px',
                minHeight: '52px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {isFrancoActive ? (
                  <>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>الأصل بالعربي: {inputText || '...'}</span>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>⚡ فرانكو مباشر</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8', wordBreak: 'break-word', letterSpacing: '0.3px' }}>
                      {francoText || 'اكتب في الكيبورد بالأسفل وسيتحول لفرانكو فوراً...'}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', wordBreak: 'break-word' }}>
                    {inputText || 'اكتب في الكيبورد بالأسفل...'}
                  </div>
                )}
              </div>

              {/* Quick Preset Franco Phrases */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                marginTop: '8px',
                scrollbarWidth: 'none'
              }}>
                {[
                  { ar: 'صباح الخير', fr: '9ba7 el 5air' },
                  { ar: 'عامل ايه يا صاحبي', fr: '3amel eh ya sa7by' },
                  { ar: 'الحمدلله كله تمام', fr: 'el7mdllah kolo tamam' },
                  { ar: 'وحشتني جدا', fr: 'wa7ashtny gedan' },
                  { ar: 'هكلمك كمان شوية', fr: 'hakalmak kman shwaya' },
                  { ar: 'فينك يا غالي', fr: 'fenak ya 3\'aly' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      triggerHaptic();
                      setInputText((prev) => prev ? `${prev} ${item.ar}` : item.ar);
                    }}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <span>{item.ar}</span>
                    <span style={{ color: '#38bdf8', marginLeft: '4px', fontSize: '10px' }}>({item.fr})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SOFTWARE KEYBOARD UI */}
            <div style={{
              padding: '10px 8px calc(var(--safe-bottom) + 12px)',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px'
            }}>
              {/* Top Quick Suggestions or Numbers Strip */}
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                {NUM_ROW_2.map((numKey) => (
                  <button
                    key={numKey}
                    onClick={() => handleKeyPress(numKey)}
                    style={{
                      flex: 1,
                      maxWidth: '48px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#38bdf8',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {numKey}
                  </button>
                ))}
              </div>

              {/* Row 1 */}
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {(keyboardMode === 'ar' ? AR_ROW_1 : keyboardMode === 'en' ? EN_ROW_1 : NUM_ROW_1).map((key) => {
                  const francoChar = isFrancoActive && keyboardMode === 'ar' ? convertCharToFranco(key) : null;
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      style={{
                        flex: 1,
                        maxWidth: '44px',
                        height: '42px',
                        borderRadius: '9px',
                        background: pressedKey === key ? '#38bdf8' : activeTheme.keyBg,
                        border: `1px solid ${activeTheme.border}`,
                        color: pressedKey === key ? '#000' : '#fff',
                        fontWeight: '700',
                        fontSize: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'transform 0.08s ease'
                      }}
                    >
                      <span>{key}</span>
                      {francoChar && francoChar !== key && (
                        <span style={{ fontSize: '8px', color: '#38bdf8', lineHeight: '8px', marginTop: '-2px' }}>
                          {francoChar}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 2 */}
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', padding: '0 8px' }}>
                {(keyboardMode === 'ar' ? AR_ROW_2 : keyboardMode === 'en' ? EN_ROW_2 : ['@', '#', '$', '%', '&', '*', '-', '+', '=', '/']).map((key) => {
                  const francoChar = isFrancoActive && keyboardMode === 'ar' ? convertCharToFranco(key) : null;
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      style={{
                        flex: 1,
                        maxWidth: '44px',
                        height: '42px',
                        borderRadius: '9px',
                        background: pressedKey === key ? '#38bdf8' : activeTheme.keyBg,
                        border: `1px solid ${activeTheme.border}`,
                        color: pressedKey === key ? '#000' : '#fff',
                        fontWeight: '700',
                        fontSize: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      <span>{key}</span>
                      {francoChar && francoChar !== key && (
                        <span style={{ fontSize: '8px', color: '#38bdf8', lineHeight: '8px', marginTop: '-2px' }}>
                          {francoChar}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 3 (with Backspace) */}
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  onClick={() => setKeyboardMode(keyboardMode === 'ar' ? 'en' : 'ar')}
                  style={{
                    width: '44px',
                    height: '42px',
                    borderRadius: '9px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="تبديل اللغة"
                >
                  {keyboardMode === 'ar' ? 'EN' : 'عربي'}
                </button>

                {(keyboardMode === 'ar' ? AR_ROW_3 : keyboardMode === 'en' ? EN_ROW_3 : ['(', ')', '<', '>', '[', ']', '{', '}']).map((key) => {
                  const francoChar = isFrancoActive && keyboardMode === 'ar' ? convertCharToFranco(key) : null;
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      style={{
                        flex: 1,
                        maxWidth: '44px',
                        height: '42px',
                        borderRadius: '9px',
                        background: pressedKey === key ? '#38bdf8' : activeTheme.keyBg,
                        border: `1px solid ${activeTheme.border}`,
                        color: pressedKey === key ? '#000' : '#fff',
                        fontWeight: '700',
                        fontSize: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      <span>{key}</span>
                      {francoChar && francoChar !== key && (
                        <span style={{ fontSize: '8px', color: '#38bdf8', lineHeight: '8px', marginTop: '-2px' }}>
                          {francoChar}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Backspace Button */}
                <button
                  onClick={handleBackspace}
                  style={{
                    width: '46px',
                    height: '42px',
                    borderRadius: '9px',
                    background: pressedKey === 'back' ? '#ef4444' : 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="مسح"
                >
                  <Delete size={18} />
                </button>
              </div>

              {/* Row 4 (123, Globe, Spacebar, Send/Return) */}
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '2px' }}>
                <button
                  onClick={() => setKeyboardMode(keyboardMode === 'num' ? 'ar' : 'num')}
                  style={{
                    width: '48px',
                    height: '42px',
                    borderRadius: '9px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {keyboardMode === 'num' ? 'حروف' : '123'}
                </button>

                <button
                  onClick={handleClear}
                  style={{
                    width: '40px',
                    height: '42px',
                    borderRadius: '9px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                  title="مسح الكل"
                >
                  C
                </button>

                {/* Wide Spacebar */}
                <button
                  onClick={handleSpace}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    background: activeTheme.keyBg,
                    border: `1.5px solid ${activeTheme.border}`,
                    color: '#cbd5e1',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                  }}
                >
                  {isFrancoActive ? 'مسافة • Space (Franco ⚡)' : 'مسافة • Space'}
                </button>

                {/* WhatsApp Action Button in Keyboard */}
                <button
                  onClick={handleSendToWhatsApp}
                  style={{
                    width: '90px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#25d366',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <Share2 size={13} />
                  <span>واتساب</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
