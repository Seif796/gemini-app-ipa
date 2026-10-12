import React, { useState, useEffect } from 'react';
import { 
  Mail, X, Check, ShieldCheck, RefreshCw, Volume2, 
  AlertCircle, Sparkles, Send, ExternalLink, Inbox, Clock, Trash2, Plus
} from 'lucide-react';
import { 
  getLinkedEmail, linkEmail, unlinkEmail, getEmails, 
  getUnreadCount, markEmailAsRead, markAllEmailsAsRead, 
  generateEmailAiSummary, simulateIncomingEmail 
} from '../emailService';

export default function EmailModal({ isOpen, onClose, onAskAiSummary, showToast }) {
  const [account, setAccount] = useState(() => getLinkedEmail());
  const [emails, setEmails] = useState(() => getEmails());
  const [emailInput, setEmailInput] = useState('');
  const [provider, setProvider] = useState('gmail');
  const [isLinking, setIsLinking] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'summary'
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cur = getLinkedEmail();
      setAccount(cur);
      setEmails(getEmails());
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

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      if (showToast) showToast('يرجى إدخال بريد إلكتروني صحيح', 'warning');
      return;
    }

    setIsLinking(true);
    setTimeout(() => {
      const linked = linkEmail(emailInput, provider);
      setAccount(linked);
      setIsLinking(false);
      setEmailInput('');
      const sum = generateEmailAiSummary();
      setAiSummaryText(sum.text);
      if (showToast) showToast(`تم ربط البريد الإلكتروني بنجاح! 📧`, 'success');
    }, 400);
  };

  const handleUnlink = () => {
    unlinkEmail();
    setAccount(null);
    setAiSummaryText('');
    if (showToast) showToast('تم فك ارتباط البريد الإلكتروني', 'info');
  };

  const handleRefreshInbox = () => {
    setEmails(getEmails());
    const sum = generateEmailAiSummary();
    setAiSummaryText(sum.text);
    if (showToast) showToast('تم تحديث البريد الإلكتروني! 📬', 'success');
  };

  const handleAddDemoEmail = () => {
    const newEm = simulateIncomingEmail(
      'تنبيه جديد: تحديث بيانات الحساب والأمان',
      'فريق أمان Google / Apple',
      'تم تسجيل دخول جديد، برجاء التأكد من أنك أنت صاحب الحساب.'
    );
    setEmails(getEmails());
    const sum = generateEmailAiSummary();
    setAiSummaryText(sum.text);
    if (showToast) showToast('وصل إيميل جديد للمعاينة! 🔔', 'info');
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

    const cleanText = (aiSummaryText || '')
      .replace(/[#*`_~]/g, '')
      .replace(/[\n\r]+/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendSummaryToChat = () => {
    if (onAskAiSummary) {
      onAskAiSummary('ايه الحاجات الجديدة اللي على الإيميل؟');
      onClose();
    }
  };

  const unreadCount = getUnreadCount();

  return (
    <div className="animate-backdrop" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
    }}>
      <div className="animate-modal-pop" style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: '90vh',
        background: '#0d111c',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#fff'
      }}>
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
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
            }}>
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>مساعد البريد الإلكتروني</span>
                {account && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontWeight: '700'
                  }}>
                    متصل 🟢
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {account ? account.email : 'اربط بريدك ليتابع ويقرأ لك الجديد'}
              </div>
            </div>
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

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {!account ? (
            /* Connect Account Form */
            <div>
              <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '6px' }}>
                  ربط بريدك الإلكتروني مع التطبيق 📧
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto' }}>
                  اربط حسابك الآن ليقوم المساعد الذكي بمتابعة وتلخيص أي إيميل جديد يوصلك فوراً بصوته!
                </p>
              </div>

              {/* Provider Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
                {[
                  { id: 'gmail', label: 'Gmail', icon: '🔴' },
                  { id: 'outlook', label: 'Outlook', icon: '🔵' },
                  { id: 'icloud', label: 'iCloud', icon: '☁️' },
                  { id: 'other', label: 'آخر', icon: '✉️' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '12px',
                      background: provider === p.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1.5px solid ${provider === p.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: provider === p.id ? '#38bdf8' : '#cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Email Form */}
              <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                    أدخل بريدك الإلكتروني:
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="example@gmail.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      direction: 'ltr'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLinking}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                    marginTop: '6px'
                  }}
                >
                  {isLinking ? 'جاري الربط...' : '🔗 ربط البريد الإلكتروني الآن'}
                </button>
              </form>
            </div>
          ) : (
            /* Connected Inbox & AI Summary View */
            <div>
              {/* Top Quick Actions Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setActiveTab('inbox')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      background: activeTab === 'inbox' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${activeTab === 'inbox' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: activeTab === 'inbox' ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Inbox size={13} />
                    <span>الوارد ({unreadCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      background: activeTab === 'summary' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${activeTab === 'summary' ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: activeTab === 'summary' ? '#34d399' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={13} />
                    <span>ملخص الذكاء الاصطناعي 🤖</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleRefreshInbox}
                    title="تحديث الإيميل"
                    style={{
                      padding: '6px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={handleAddDemoEmail}
                    title="محاكاة وصول إيميل جديد"
                    style={{
                      padding: '6px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: 'none',
                      color: '#38bdf8',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {activeTab === 'summary' ? (
                /* AI Summary Card */
                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} />
                      <span>ملخص الرسائل الجديدة:</span>
                    </div>

                    <button
                      onClick={handleSpeakSummary}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '10px',
                        background: isSpeaking ? '#ef4444' : 'rgba(16, 185, 129, 0.2)',
                        border: 'none',
                        color: isSpeaking ? '#fff' : '#34d399',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Volume2 size={13} />
                      <span>{isSpeaking ? 'إيقاف الصوت' : '🔊 استمع للملخص'}</span>
                    </button>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: '#e2e8f0',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '14px'
                  }}>
                    {aiSummaryText || generateEmailAiSummary().text}
                  </div>

                  <button
                    onClick={handleSendSummaryToChat}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={13} />
                    <span>فتح واستكمال الحديث في الشات مع Gemini 💬</span>
                  </button>
                </div>
              ) : (
                /* Inbox List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {emails.map((em) => (
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
                        border: `1px solid ${!em.isRead ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {!em.isRead && (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8' }}></span>
                          )}
                          <span style={{ fontSize: '13px', fontWeight: !em.isRead ? '800' : '600', color: '#fff' }}>
                            {em.fromName}
                          </span>
                          {em.isUrgent && (
                            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '6px', background: '#ef4444', color: '#fff', fontWeight: '700' }}>
                              عاجل
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {em.date}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '3px' }}>
                        {em.subject}
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                        {selectedEmail?.id === em.id ? (em.body || em.snippet) : em.snippet}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unlink / Change Account option */}
              <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  الحساب: {account.email}
                </span>
                <button
                  onClick={handleUnlink}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  فك الارتباط
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

