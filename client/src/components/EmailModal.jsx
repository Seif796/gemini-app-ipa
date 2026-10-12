import React, { useState, useEffect } from 'react';
import { 
  Mail, X, Check, ShieldCheck, RefreshCw, Volume2, 
  AlertCircle, Sparkles, Send, ExternalLink, Inbox, Clock, Trash2, Plus,
  Eye, EyeOff, Lock, Server, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getLinkedEmail, verifyAndLinkEmail, unlinkEmail, getEmails, 
  getUnreadCount, markEmailAsRead, markAllEmailsAsRead, 
  generateEmailAiSummary, simulateIncomingEmail 
} from '../emailService';

const PROVIDER_CONFIGS = {
  gmail: { name: 'Google (Gmail)', host: 'imap.gmail.com', port: 993, hint: 'يتطلب كلمة مرور التطبيقات (App Password) المكونة من 16 حرفاً لحماية الحساب' },
  outlook: { name: 'Microsoft (Outlook / Hotmail)', host: 'outlook.office365.com', port: 993, hint: 'يدعم كلمة المرور الرسمية أو كلمة مرور التطبيقات' },
  icloud: { name: 'Apple iCloud', host: 'imap.mail.me.com', port: 993, hint: 'يتطلب App-Specific Password من موقع appleid.apple.com' },
  yahoo: { name: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993, hint: 'يتطلب كلمة مرور تطبيقات من إعدادات أمان Yahoo' },
  custom: { name: 'خادم IMAP مخصص (Custom)', host: '', port: 993, hint: 'أدخل عنوان خادم IMAP الخاص بك والمنفذ' }
};

export default function EmailModal({ isOpen, onClose, onAskAiSummary, showToast }) {
  const [account, setAccount] = useState(() => getLinkedEmail());
  const [emails, setEmails] = useState(() => getEmails());
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [provider, setProvider] = useState('gmail');
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState(993);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'summary'
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cur = getLinkedEmail();
      setAccount(cur);
      setEmails(getEmails());
      setVerifyError('');
      if (cur) {
        setAiSummaryText(generateEmailAiSummary().text);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAccountChange = (e) => setAccount(e.detail);
    const handleEmailsUpdate = (e) => setEmails(e.detail || getEmails());

    window.addEventListener('seif-email-account-changed', handleAccountChange);
    window.addEventListener('seif-emails-updated', handleEmailsUpdate);

    return () => {
      window.removeEventListener('seif-email-account-changed', handleAccountChange);
      window.removeEventListener('seif-emails-updated', handleEmailsUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const currentProviderConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.gmail;

  const handleVerifyAndConnect = async (e) => {
    e.preventDefault();
    setVerifyError('');

    if (!emailInput || !emailInput.includes('@')) {
      setVerifyError('يرجى إدخال عنوان بريد إلكتروني صحيح.');
      if (showToast) showToast('يرجى إدخال بريد إلكتروني صحيح', 'warning');
      return;
    }

    if (!passwordInput.trim()) {
      setVerifyError('يرجى إدخال كلمة المرور للتحقق من صحتها.');
      if (showToast) showToast('يرجى إدخال كلمة المرور', 'warning');
      return;
    }

    setIsVerifying(true);

    try {
      const hostToUse = provider === 'custom' ? customHost : currentProviderConfig.host;
      const portToUse = provider === 'custom' ? customPort : currentProviderConfig.port;

      const linked = await verifyAndLinkEmail({
        email: emailInput,
        password: passwordInput,
        provider,
        host: hostToUse,
        port: portToUse
      });

      setAccount(linked);
      setEmails(getEmails());
      setPasswordInput('');
      setVerifyError('');
      const sum = generateEmailAiSummary();
      setAiSummaryText(sum.text);
      if (showToast) showToast('✅ تم التحقق من كلمة المرور والاتصال بالبريد بنجاح!', 'success');
    } catch (err) {
      console.error('Email verification error:', err);
      const msg = err?.message || 'فشل التحقق من كلمة المرور. تأكد من صحة البيانات.';
      setVerifyError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnlink = () => {
    if (confirm('هل أنت متأكد من فك ارتباط هذا البريد الإلكتروني؟')) {
      unlinkEmail();
      setAccount(null);
      setEmails([]);
      setAiSummaryText('');
      setVerifyError('');
      if (showToast) showToast('تم فك ارتباط البريد الإلكتروني بنجاح', 'info');
    }
  };

  const handleRefreshInbox = () => {
    setEmails(getEmails());
    const sum = generateEmailAiSummary();
    setAiSummaryText(sum.text);
    if (showToast) showToast('تم تحديث صندوق الوارد! 📬', 'success');
  };

  const handleSpeakSummary = () => {
    if (!('speechSynthesis' in window)) {
      if (showToast) showToast('خاصية النطق الصوتي غير مدعومة في المتصفح', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = (aiSummaryText || generateEmailAiSummary().text).replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const unreadCount = getUnreadCount();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="animate-view-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>مساعد البريد الإلكتروني الذكي</span>
                {account?.isVerified && (
                  <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                    تم التحقق 🔒
                  </span>
                )}
              </h2>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                ربط حساب IMAP حقيقي • فحص كلمة المرور • تلخيص فوري
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Linked Account Status Card */}
          {account && account.isVerified ? (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(52, 211, 153, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                      {account.email}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      خادم البريد: {account.host}:{account.port} • كلمة المرور: تم التحقق بنجاح ✅
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUnlink}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  فك الارتباط
                </button>
              </div>

              {/* Navigation Tabs (Inbox vs AI Summary) */}
              <div style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '3px',
                borderRadius: '12px',
                gap: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('inbox')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'inbox' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                    color: activeTab === 'inbox' ? '#fff' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Inbox size={14} />
                  <span>صندوق الوارد ({unreadCount} جديد)</span>
                </button>

                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'summary' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                    color: activeTab === 'summary' ? '#fff' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={14} />
                  <span>ملخص الذكاء الاصطناعي ⚡</span>
                </button>
              </div>
            </div>
          ) : (
            /* REAL LOGIN / CONNECT FORM WITH PASSWORD FIELD */
            <form onSubmit={handleVerifyAndConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                    تسجيل الدخول والتحقق الفعلي من كلمة المرور
                  </span>
                </div>

                {/* Error Banner if authentication fails */}
                {verifyError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#fca5a5',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>{verifyError}</div>
                  </div>
                )}

                {/* Provider Selector */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    مزود البريد الإلكتروني (Provider):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {Object.entries(PROVIDER_CONFIGS).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setProvider(key);
                          setVerifyError('');
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: provider === key ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: provider === key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: provider === key ? '#38bdf8' : '#cbd5e1',
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {cfg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Address Input */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    عنوان البريد الإلكتروني:
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="example@gmail.com أو outlook.com"
                    dir="ltr"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Password / App Password Input with Show/Hide Toggle */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>كلمة المرور (أو App Password):</span>
                    <span style={{ color: '#38bdf8', fontSize: '10px' }}>TLS Encrypted 🔒</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="كلمة المرور أو كلمة مرور التطبيق (16 حرفاً)"
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '11px 40px 11px 14px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {currentProviderConfig.hint}
                  </div>
                </div>

                {/* Custom IMAP Host & Port if 'custom' selected */}
                {provider === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>خادم IMAP Host:</label>
                      <input
                        type="text"
                        value={customHost}
                        onChange={(e) => setCustomHost(e.target.value)}
                        placeholder="mail.yourdomain.com"
                        dir="ltr"
                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>المنفذ Port:</label>
                      <input
                        type="number"
                        value={customPort}
                        onChange={(e) => setCustomPort(e.target.value)}
                        placeholder="993"
                        dir="ltr"
                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Google / Apple App Password Guide Toggle */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '8px 12px'
                }}>
                  <div 
                    onClick={() => setShowHelpGuide(!showHelpGuide)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <HelpCircle size={13} />
                      كيف أحصل على كلمة مرور التطبيقات (App Password)؟
                    </span>
                    {showHelpGuide ? <ChevronUp size={14} color="#38bdf8" /> : <ChevronDown size={14} color="#38bdf8" />}
                  </div>

                  {showHelpGuide && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
                      <p style={{ margin: '0 0 6px 0' }}>
                        💡 <strong>لحسابات Google / Gmail:</strong> تتطلب حماية Google إنشاء كلمة مرور تطبيقات من 16 حرفاً بدلاً من كلمة المرور الرئيسية.
                      </p>
                      <ol style={{ paddingLeft: '18px', margin: '0 0 8px 0' }}>
                        <li>افتح إعدادات أمان Google في متصفحك.</li>
                        <li>فعّل التحقق بخطوتين (2-Step Verification).</li>
                        <li>اختر <strong>كلمات مرور التطبيقات (App Passwords)</strong> وأنشئ كلمة مرور جديدة باسم (Seif AI).</li>
                        <li>انسخ الـ 16 حرفاً وضعها في خانة كلمة المرور أعلاه.</li>
                      </ol>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        فتح صفحة كلمات مرور تطبيقات Google ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '14px',
                    background: isVerifying ? 'rgba(56, 189, 248, 0.3)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isVerifying ? 'wait' : 'pointer',
                    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>جاري الاتصال بخادم البريد وفحص كلمة المرور...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>التحقق من كلمة المرور والاتصال الفعلي 🔒</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: INBOX vs SUMMARY */}
          {account?.isVerified && activeTab === 'summary' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                  ملخص الذكاء الاصطناعي الذكي
                </span>
                <button
                  onClick={handleSpeakSummary}
                  style={{
                    background: isSpeaking ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Volume2 size={14} />
                  <span>{isSpeaking ? 'إيقاف الصوت ⏹' : 'استمع للملخص 🔊'}</span>
                </button>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#e2e8f0',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {aiSummaryText || generateEmailAiSummary().text}
              </div>

              <button
                onClick={() => {
                  if (onAskAiSummary) {
                    onAskAiSummary('ايه الحاجات الجديدة اللي على الإيميل؟');
                  }
                }}
                className="ios-button-primary"
                style={{ width: '100%', padding: '11px', fontSize: '12px', justifyContent: 'center', gap: '6px' }}
              >
                <Send size={14} />
                <span>اسأل الذكاء الاصطناعي في الشات عن هذا الإيميل</span>
              </button>
            </div>
          )}

          {account?.isVerified && activeTab === 'inbox' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                  الرسائل الحديثة ({emails.length}):
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleRefreshInbox}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>تحديث</span>
                  </button>
                  <button
                    onClick={() => {
                      markAllEmailsAsRead();
                      setEmails(getEmails());
                      if (showToast) showToast('تم تعليم كل الرسائل كمقروءة', 'info');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    تحديد الكل كمقروء
                  </button>
                </div>
              </div>

              {emails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b', fontSize: '13px' }}>
                  صندوق الوارد فارغ حالياً ✨
                </div>
              ) : (
                emails.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => {
                      markEmailAsRead(em.id);
                      setEmails(getEmails());
                      setSelectedEmail(selectedEmail?.id === em.id ? null : em);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: em.isRead ? 'rgba(255, 255, 255, 0.03)' : 'rgba(56, 189, 248, 0.08)',
                      border: em.isRead ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(56, 189, 248, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!em.isRead && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: em.isRead ? '600' : '800', color: em.isRead ? '#cbd5e1' : '#fff' }}>
                          {em.fromName}
                        </span>
                        {em.isUrgent && (
                          <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                            عاجل ⚠️
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{em.date}</span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '700', color: em.isRead ? '#94a3b8' : '#e2e8f0' }}>
                      {em.subject}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                      {em.snippet}
                    </div>

                    {selectedEmail?.id === em.id && em.body && (
                      <div style={{
                        marginTop: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        lineHeight: '1.5'
                      }}>
                        {em.body}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
