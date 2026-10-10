import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, MessageCircle, Check, X, Copy, Send, Bot, 
  ArrowLeft, Clock, Sparkles, AlertCircle, RefreshCw, UserCheck
} from 'lucide-react';
import { 
  getCurrentUsername, getFriendsData, sendFriendRequest, 
  acceptFriendRequest, rejectFriendRequest, getChatMessages, 
  sendFriendMessage, toggleBotInChat 
} from '../friendsApi';
import { playNotificationSound } from '../notifications';
import { getAppLanguage, getTranslation } from '../i18n';
import LanguageToggle from './LanguageToggle';

function getUserInitials(name) {
  if (!name) return '?';
  const str = typeof name === 'string' ? name : String(name?.username || name?.from || name || '');
  return (str.trim().substring(0, 2) || '?').toUpperCase();
}

export default function FriendsTab({ showToast, onOpenUsernameModal }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  const [myUsername, setMyUsername] = useState(getCurrentUsername());
  const [friendsData, setFriendsData] = useState({ friends: [], incomingRequests: [], outgoingRequests: [] });
  const [loading, setLoading] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Active chat state
  const [activeFriend, setActiveFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [isGeminiThinking, setIsGeminiThinking] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const chatEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  useEffect(() => {
    const current = getCurrentUsername();
    setMyUsername(current);
    if (current) {
      loadFriends();
    }
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

  // Listen for real-time friend requests & acceptances
  useEffect(() => {
    const handleReqReceived = () => {
      loadFriends();
    };
    const handleFriendAccepted = (e) => {
      loadFriends();
      if (e.detail?.friend) {
        showToast(lang === 'ar' ? `🎉 @${e.detail.friend} قبل طلب صداقتك وأصبحتم أصدقاء الآن!` : `🎉 @${e.detail.friend} accepted your friend request!`, 'success');
      }
    };
    window.addEventListener('seif-friend-request-received', handleReqReceived);
    window.addEventListener('seif-friend-accepted', handleFriendAccepted);
    return () => {
      window.removeEventListener('seif-friend-request-received', handleReqReceived);
      window.removeEventListener('seif-friend-accepted', handleFriendAccepted);
    };
  }, [lang]);

  // Live polling for friend requests & chat messages
  useEffect(() => {
    if (!myUsername) return;

    const poll = async () => {
      try {
        if (activeFriend) {
          const res = await getChatMessages(activeFriend);
          if (res && Array.isArray(res.messages)) {
            setChatMessages(res.messages);
            setIsBotEnabled(Boolean(res.isBotEnabled));
          }
        } else {
          const data = await getFriendsData();
          setFriendsData((prev) => {
            const prevReqs = (prev && Array.isArray(prev.incomingRequests)) ? prev.incomingRequests : [];
            const newReqs = (data && Array.isArray(data.incomingRequests)) ? data.incomingRequests : [];
            if (newReqs.length > prevReqs.length) {
              playNotificationSound();
              showToast(lang === 'ar' ? '🔔 وصلك طلب صداقة جديد!' : '🔔 New friend request received!', 'info');
            }
            return {
              friends: (data && Array.isArray(data.friends)) ? data.friends : [],
              incomingRequests: newReqs,
              outgoingRequests: (data && Array.isArray(data.outgoingRequests)) ? data.outgoingRequests : []
            };
          });
        }
      } catch (_) {}
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);
    return () => clearInterval(pollTimerRef.current);
  }, [myUsername, activeFriend, lang]);

  // Reactive listener for incoming DM messages
  useEffect(() => {
    const handleNewDm = (e) => {
      const msg = e.detail;
      if (activeFriend && msg && (msg.sender === activeFriend || msg.isBot)) {
        getChatMessages(activeFriend).then((res) => {
          if (res && res.messages) {
            setChatMessages(res.messages);
            setIsBotEnabled(Boolean(res.isBotEnabled));
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('seif-new-dm-received', handleNewDm);
    return () => window.removeEventListener('seif-new-dm-received', handleNewDm);
  }, [activeFriend]);

  useEffect(() => {
    if (activeFriend) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isGeminiThinking]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsData();
      setFriendsData(data);
    } catch (err) {
      console.warn('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    const clean = targetUsername.toLowerCase().replace(/^@+/, '').trim();
    if (!clean) return;

    setActionLoading(true);
    try {
      await sendFriendRequest(clean);
      showToast(`${t.friendRequestSentSuccess} (@${clean})`, 'success');
      setTargetUsername('');
      await loadFriends();
    } catch (err) {
      showToast(err.message || t.errUsernameNotFound, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (requestId, fromUser) => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(requestId);
      showToast(`${t.friendAcceptedSuccess} (@${fromUser})`, 'success');
      await loadFriends();
      // Immediately open the chat room with this friend!
      handleOpenChat(fromUser);
    } catch (err) {
      showToast(err.message || t.errUsernameNotFound, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      showToast(t.friendRejectedInfo, 'info');
      await loadFriends();
    } catch (err) {
      showToast('Error', 'error');
    }
  };

  const handleOpenChat = async (friend) => {
    setActiveFriend(friend);
    setChatMessages([]);
    try {
      const res = await getChatMessages(friend);
      setChatMessages(res.messages || []);
      setIsBotEnabled(Boolean(res?.isBotEnabled));
    } catch (_) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = msgInput.trim();
    if (!text || !activeFriend || sendingMsg) return;

    setSendingMsg(true);
    setMsgInput('');
    try {
      await sendFriendMessage(activeFriend, text);
      const res = await getChatMessages(activeFriend);
      setChatMessages(res.messages || []);
    } catch (err) {
      showToast('Could not send message', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleBot = async () => {
    if (!activeFriend) return;
    try {
      const enabled = await toggleBotInChat(activeFriend);
      setIsBotEnabled(enabled);
      showToast(enabled ? t.botConnectedBadge : (lang === 'ar' ? 'تم إيقاف البوت من الشات' : 'Bot removed from chat'), 'info');
      const res = await getChatMessages(activeFriend);
      setChatMessages(res.messages || []);
    } catch (_) {}
  };

  const copyMyUsername = () => {
    navigator.clipboard?.writeText(myUsername);
    showToast(`${t.copied} (@${myUsername})`, 'success');
  };

  // ---------------- RENDER: CHAT ROOM WITH FRIEND ----------------
  if (activeFriend) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Chat Room Header */}
        <header className="glass-header" style={{
          padding: 'calc(var(--safe-top) + 8px) 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setActiveFriend(null)}
              className="ios-button-secondary"
              style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
              title={t.back}
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
              {getUserInitials(activeFriend)}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                @{typeof activeFriend === 'string' ? activeFriend : activeFriend?.username || ''}
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                {t.friendChatBadge} • @gemini متاح
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LanguageToggle compact={true} showToast={showToast} />
            {/* Gemini Bot Toggle in Chat Button */}
            <button
              onClick={handleToggleBot}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: isBotEnabled ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                background: isBotEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isBotEnabled ? '#38bdf8' : '#94a3b8',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={isBotEnabled ? t.botConnectedBadge : t.addBotBtn}
            >
              <Bot size={15} color={isBotEnabled ? '#38bdf8' : '#94a3b8'} />
              <span>{isBotEnabled ? t.botConnectedBadge : t.addBotBtn}</span>
            </button>
          </div>
        </header>

        {/* Gemini Group Hint Banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '8px 14px',
          fontSize: '12px',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={14} />
          <span>{t.botBannerText}</span>
        </div>

        {/* Message Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px calc(var(--safe-bottom) + 105px) 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '13px' }}>
              {t.startChatPrompt}
            </div>
          ) : (
            chatMessages.map((m) => {
              if (m.isSystem) {
                return (
                  <div key={m.id} style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#94a3b8',
                    padding: '6px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    margin: '4px auto',
                    maxWidth: '85%',
                    lineHeight: '1.4'
                  }}>
                    {m.text}
                  </div>
                );
              }

              // Gemini AI Bot Message (styled with AI badge & glow)
              if (m.isBot) {
                return (
                  <div key={m.id} style={{
                    alignSelf: 'flex-start',
                    maxWidth: '88%',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                    border: '1.5px solid rgba(56, 189, 248, 0.45)',
                    borderRadius: '20px 20px 20px 4px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.18)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#38bdf8',
                      fontWeight: '800',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Sparkles size={14} color="#38bdf8" />
                      <span>Gemini ✨ (الذكاء الاصطناعي)</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: '#64748b',
                      textAlign: 'left',
                      marginTop: '6px'
                    }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              }

              // User Message (Me vs Friend)
              const isMe = m.sender === myUsername;
              return (
                <div key={m.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                  background: isMe
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  padding: '10px 14px',
                  boxShadow: isMe ? '0 2px 10px rgba(2, 132, 199, 0.3)' : 'none'
                }}>
                  {!isMe && (
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', marginBottom: '3px' }}>
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
                    marginTop: '4px'
                  }}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}

          {/* Gemini Thinking Animation */}
          {isGeminiThinking && (
            <div style={{
              alignSelf: 'flex-start',
              maxWidth: '85%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '20px 20px 20px 4px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: '700',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.15)'
            }}>
              <Sparkles size={14} className="animate-spin" />
              <span>{t.geminiThinking}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Dock */}
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
              <span>{t.askGeminiBtn}</span>
            </button>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {t.bothUsersSeeGemini}
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
              placeholder={t.typeMessageWithBotPlaceholder}
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
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: msgInput.trim() ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: msgInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} color={msgInput.trim() ? '#fff' : '#64748b'} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- RENDER: MAIN FRIENDS LIST & REQUESTS ----------------
  const incomingReqs = Array.isArray(friendsData?.incomingRequests) ? friendsData.incomingRequests : [];
  const friendsList = Array.isArray(friendsData?.friends) ? friendsData.friends : [];

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
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{t.friendsHeaderTitle}</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t.friendsHeaderSubtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle compact={true} showToast={showToast} />
          <button
            onClick={loadFriends}
            className="ios-button-secondary"
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
            title={lang === 'ar' ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* My Username Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '18px',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
              }}>
                {getUserInitials(myUsername)}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.myUsernameLabel}</div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8' }}>
                  @{myUsername || t.notRegistered}
                </div>
              </div>
            </div>

            <button
              onClick={copyMyUsername}
              className="ios-button-secondary"
              style={{ padding: '8px 12px', fontSize: '12px', gap: '6px' }}
              title={t.copy}
            >
              <Copy size={14} />
              <span>{t.copy}</span>
            </button>
          </div>
        </div>

        {/* 📥 DEDICATED FRIEND REQUESTS SECTION (Place for Accepting / Declining) */}
        <div className="glass-panel" style={{
          padding: '16px',
          border: incomingReqs.length > 0 ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                {t.incomingRequestsTitle}
              </h3>
            </div>
            {incomingReqs.length > 0 ? (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 9px',
                borderRadius: '12px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
              }}>
                {incomingReqs.length} {t.newRequestsBadge}
              </span>
            ) : (
              <span style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#64748b',
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                0
              </span>
            )}
          </div>

          {incomingReqs.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              padding: '14px 12px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.08)'
            }}>
              {t.noIncomingRequests}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {incomingReqs.map((req) => (
                <div key={req?.id || Math.random()} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px'
                    }}>
                      {getUserInitials(req?.from)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>@{req?.from}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.sentYouRequestText}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* ✅ Accept Button: Accepts & immediately starts chat! */}
                    <button
                      onClick={() => handleAccept(req?.id, req?.from)}
                      disabled={actionLoading}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Check size={15} />
                      <span>{t.acceptBtn}</span>
                    </button>
                    {/* ❌ Reject Button */}
                    <button
                      onClick={() => handleReject(req?.id)}
                      disabled={actionLoading}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.18)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={t.rejectBtn}
                    >
                      <X size={15} />
                      <span>{t.rejectBtn}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ➕ ADD FRIEND SECTION */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <UserPlus size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{t.addFriendTitle}</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            {t.addFriendSubtitle}
          </p>

          <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#38bdf8',
                fontWeight: '700',
                fontSize: '14px'
              }}>
                @
              </span>
              <input
                type="text"
                placeholder={t.friendUsernamePlaceholder}
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                dir="ltr"
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 28px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !targetUsername.trim()}
              className="ios-button-primary"
              style={{ padding: '10px 16px', fontSize: '13px', whiteSpace: 'nowrap', gap: '6px' }}
            >
              <UserPlus size={15} />
              <span>{actionLoading ? t.sendingRequestBtn : t.sendFriendRequestBtn}</span>
            </button>
          </form>
        </div>

        {/* 👥 MY FRIENDS & CHATS SECTION */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                {t.myFriendsTitle} ({friendsList.length})
              </h3>
            </div>
          </div>

          {friendsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '13px' }}>
              {t.noFriendsYet}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {friendsList.map((friend) => {
                const friendName = typeof friend === 'string' ? friend : (friend?.username || '');
                return (
                  <div key={friendName || Math.random()} style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '15px',
                        boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
                      }}>
                        {getUserInitials(friendName)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>@{friendName}</div>
                        <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                          {t.connectedFriend}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenChat(friendName)}
                      className="ios-button-primary"
                      style={{ padding: '8px 14px', fontSize: '12px', gap: '6px' }}
                    >
                      <MessageCircle size={14} />
                      <span>{t.chatWithFriendBtn}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
