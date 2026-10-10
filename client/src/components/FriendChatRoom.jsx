import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Phone, Video, Trash2, Send, Sparkles, Bot, Clock, AlertTriangle 
} from 'lucide-react';
import { 
  getCurrentUsername, getChatMessages, sendFriendMessage, 
  toggleBotInChat, removeFriend 
} from '../friendsApi';
import { getAppLanguage, getTranslation } from '../i18n';
import LanguageToggle from './LanguageToggle';

function getUserInitials(name) {
  if (!name) return '?';
  const str = typeof name === 'string' ? name : String(name?.username || name?.from || name || '');
  return (str.trim().substring(0, 2) || '?').toUpperCase();
}

export default function FriendChatRoom({ friend, onBack, onStartCall, showToast }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);
  const myUsername = getCurrentUsername();

  const [chatMessages, setChatMessages] = useState([]);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [isGeminiThinking, setIsGeminiThinking] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const chatEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  // Listen for Gemini thinking events
  useEffect(() => {
    const handleThinking = (e) => {
      if (e.detail) {
        setIsGeminiThinking(Boolean(e.detail.status));
      }
    };
    window.addEventListener('seif-gemini-thinking', handleThinking);
    return () => window.removeEventListener('seif-gemini-thinking', handleThinking);
  }, []);

  // Poll for messages in this room (every 1.2s for ultra-fast updates)
  useEffect(() => {
    if (!friend || !myUsername) return;

    const fetchMessages = async () => {
      try {
        const res = await getChatMessages(friend);
        if (res && Array.isArray(res.messages)) {
          setChatMessages(res.messages);
          setIsBotEnabled(Boolean(res.isBotEnabled));
        }
      } catch (_) {}
    };

    fetchMessages();
    pollTimerRef.current = setInterval(fetchMessages, 1200);
    return () => clearInterval(pollTimerRef.current);
  }, [friend, myUsername]);

  // Reactive listener for incoming DMs
  useEffect(() => {
    const handleNewDm = (e) => {
      const msg = e.detail;
      if (msg && (msg.sender === friend || msg.isBot)) {
        getChatMessages(friend).then((res) => {
          if (res && res.messages) {
            setChatMessages(res.messages);
            setIsBotEnabled(Boolean(res.isBotEnabled));
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('seif-new-dm-received', handleNewDm);
    return () => window.removeEventListener('seif-new-dm-received', handleNewDm);
  }, [friend]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGeminiThinking]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = msgInput.trim();
    if (!text || !friend || sendingMsg) return;

    // Optimistic local update for instantaneous message display (0ms)
    const optimisticMsg = {
      id: 'opt_' + Date.now(),
      sender: myUsername,
      text,
      timestamp: Date.now(),
      isBot: false
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setMsgInput('');
    setSendingMsg(true);

    try {
      await sendFriendMessage(friend, text);
      const res = await getChatMessages(friend);
      if (res && res.messages) {
        setChatMessages(res.messages);
      }
    } catch (err) {
      if (showToast) showToast('تعذر إرسال الرسالة', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleBot = async () => {
    try {
      const enabled = await toggleBotInChat(friend);
      setIsBotEnabled(enabled);
      if (showToast) {
        showToast(enabled ? t.botConnectedBadge : (lang === 'ar' ? 'تم إيقاف البوت' : 'Bot removed'), 'info');
      }
      const res = await getChatMessages(friend);
      if (res && res.messages) setChatMessages(res.messages);
    } catch (_) {}
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriend(friend);
      if (showToast) {
        showToast(lang === 'ar' ? `تم حذف @${friend} من قائمة أصدقائك` : `Removed @${friend} from friends`, 'info');
      }
      onBack();
    } catch (err) {
      if (showToast) showToast('تعذر الحذف', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#07090e' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 8px) 14px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBack}
            className="ios-button-secondary"
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
            title="رجوع"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '15px',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
          }}>
            {getUserInitials(friend)}
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              @{friend}
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              <span>متصل ⚡ • @gemini متاح</span>
            </div>
          </div>
        </div>

        {/* Action icons: Voice Call, Video Call, Remove Friend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Voice Call */}
          <button
            onClick={() => onStartCall && onStartCall(friend, 'voice')}
            className="ios-button-secondary"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              padding: 0,
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399'
            }}
            title="مكالمة صوتية"
          >
            <Phone size={16} />
          </button>

          {/* Video Call */}
          <button
            onClick={() => onStartCall && onStartCall(friend, 'video')}
            className="ios-button-secondary"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              padding: 0,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}
            title="مكالمة فيديو"
          >
            <Video size={16} />
          </button>

          {/* Remove Friend */}
          <button
            onClick={() => setShowRemoveConfirm(true)}
            className="ios-button-secondary"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              padding: 0,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171'
            }}
            title="حذف الصديق"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            padding: '20px',
            maxWidth: '320px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              حذف الصديق؟
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.4' }}>
              هل أنت متأكد من حذف @{friend} من قائمة أصدقائك؟ لن تتمكنا من الدردشة معاً إلا بعد إرسال طلب جديد.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  handleRemoveFriend();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Hint Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        padding: '7px 14px',
        fontSize: '11px',
        color: '#38bdf8',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Sparkles size={13} />
        <span>اكتب @gemini في أي رسالة وسيرد عليكما كليكما في هذا الشات!</span>
      </div>

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px calc(var(--safe-bottom) + 110px) 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '13px' }}>
            👋 ابدأ المحادثة الآن مع @{friend}!
          </div>
        ) : (
          chatMessages.map((m) => {
            if (m.isSystem) {
              return (
                <div key={m.id} style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#94a3b8',
                  padding: '5px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '14px',
                  margin: '4px auto',
                  maxWidth: '85%'
                }}>
                  {m.text}
                </div>
              );
            }

            // Gemini message
            if (m.isBot) {
              return (
                <div key={m.id} style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                  border: '1.5px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '10px 14px',
                  boxShadow: '0 4px 20px rgba(56, 189, 248, 0.16)'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#38bdf8',
                    fontWeight: '800',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Sparkles size={13} />
                    <span>Gemini ✨ (الذكاء الاصطناعي)</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            }

            const isMe = m.sender === myUsername;
            return (
              <div key={m.id} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isMe
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '9px 13px'
              }}>
                {!isMe && (
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700', marginBottom: '2px' }}>
                    @{m.sender}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.4', wordBreak: 'break-word' }}>
                  {m.text}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: isMe ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                  textAlign: isMe ? 'left' : 'right',
                  marginTop: '3px'
                }}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}

        {/* Gemini Thinking Indicator */}
        {isGeminiThinking && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '18px 18px 18px 4px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            <Sparkles size={14} className="animate-spin" />
            <span>Gemini يفكر في الإجابة... ✍️</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Dock */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '8px 12px calc(var(--safe-bottom) + 64px) 12px',
        background: 'rgba(9, 10, 15, 0.96)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 40
      }}>
        {/* Quick @gemini Tag Shortcut */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
          padding: '0 4px'
        }}>
          <button
            type="button"
            onClick={() => {
              setMsgInput((prev) => {
                if (prev.includes('@gemini')) return prev;
                return prev.trim() ? `@gemini ${prev}` : '@gemini ';
              });
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.18)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={12} />
            <span>اسأل @gemini ✨</span>
          </button>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            سيرد عليكم أنتم الاثنين معاً
          </span>
        </div>

        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '24px',
            padding: '4px 6px 4px 12px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <input
            type="text"
            placeholder="اكتب رسالة أو اسأل @gemini..."
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            disabled={sendingMsg}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              padding: '6px 4px'
            }}
          />
          <button
            type="submit"
            disabled={!msgInput.trim() || sendingMsg}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: msgInput.trim() ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: msgInput.trim() ? 'pointer' : 'default'
            }}
          >
            <Send size={15} color={msgInput.trim() ? '#fff' : '#64748b'} />
          </button>
        </form>
      </div>
    </div>
  );
}
