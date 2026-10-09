import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, MessageCircle, Check, X, Copy, Send, Bot, 
  ArrowLeft, Clock, Sparkles, AlertCircle, RefreshCw, Mic, Volume2
} from 'lucide-react';
import { 
  getCurrentUsername, getFriendsData, sendFriendRequest, 
  acceptFriendRequest, rejectFriendRequest, getChatMessages, 
  sendFriendMessage, toggleBotInChat 
} from '../friendsApi';
import { playNotificationSound } from '../notifications';
import AppIconBadge from './AppIconBadge';

function getUserInitials(name) {
  if (!name) return '?';
  const str = typeof name === 'string' ? name : String(name?.username || name?.from || name || '');
  return (str.trim().substring(0, 2) || '?').toUpperCase();
}

export default function FriendsTab({ showToast, onOpenUsernameModal }) {
  const [myUsername, setMyUsername] = useState(getCurrentUsername());
  const [friendsData, setFriendsData] = useState({ friends: [], incomingRequests: [], outgoingRequests: [] });
  const [loading, setLoading] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Active chat state
  const [activeFriend, setActiveFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const chatEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    const current = getCurrentUsername();
    setMyUsername(current);
    if (current) {
      loadFriends();
    }
  }, []);

  // Poll for live chat & friend requests
  useEffect(() => {
    if (!myUsername) return;

    const poll = async () => {
      try {
        if (activeFriend) {
          const res = await getChatMessages(activeFriend);
          setChatMessages((prev) => {
            const prevArr = Array.isArray(prev) ? prev : [];
            const newArr = (res && Array.isArray(res.messages)) ? res.messages : [];
            if (newArr.length > prevArr.length) {
              const last = newArr[newArr.length - 1];
              if (last && last.sender !== myUsername) {
                playNotificationSound();
              }
            }
            return newArr;
          });
          setIsBotEnabled(Boolean(res?.isBotEnabled));
        } else {
          const data = await getFriendsData();
          setFriendsData((prev) => {
            const prevReqs = (prev && Array.isArray(prev.incomingRequests)) ? prev.incomingRequests : [];
            const newReqs = (data && Array.isArray(data.incomingRequests)) ? data.incomingRequests : [];
            if (newReqs.length > prevReqs.length) {
              playNotificationSound();
              showToast('🔔 وصلك طلب صداقة جديد!', 'info');
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
    pollTimerRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollTimerRef.current);
  }, [myUsername, activeFriend]);

  useEffect(() => {
    if (activeFriend) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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
    const clean = targetUsername.trim();
    if (!clean) return;

    setActionLoading(true);
    try {
      await sendFriendRequest(clean);
      showToast(`تم إرسال طلب الصداقة إلى @${clean} بنجاح! 📨`, 'success');
      setTargetUsername('');
      loadFriends();
    } catch (err) {
      showToast(err.message || 'تعذر إرسال طلب الصداقة', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (requestId, fromUser) => {
    try {
      await acceptFriendRequest(requestId);
      showToast(`أصبحت أنت و @${fromUser} أصدقاء الآن! 🎉`, 'success');
      loadFriends();
    } catch (err) {
      showToast(err.message || 'تعذر قبول الطلب', 'error');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      showToast('تم رفض طلب الصداقة', 'info');
      loadFriends();
    } catch (err) {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleOpenChat = async (friend) => {
    setActiveFriend(friend);
    setChatMessages([]);
    try {
      const res = await getChatMessages(friend);
      setChatMessages(res.messages);
      setIsBotEnabled(res.isBotEnabled);
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
      setChatMessages(res.messages);
    } catch (err) {
      showToast('تعذر إرسال الرسالة', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleBot = async () => {
    if (!activeFriend) return;
    try {
      const enabled = await toggleBotInChat(activeFriend);
      setIsBotEnabled(enabled);
      showToast(enabled ? '🤖 تم تفعيل البوت الذكي في الشات!' : 'تم إيقاف البوت من الشات', 'info');
      const res = await getChatMessages(activeFriend);
      setChatMessages(res.messages);
    } catch (_) {}
  };

  const copyMyUsername = () => {
    navigator.clipboard?.writeText(myUsername);
    showToast(`تم نسخ اسم المستخدم: @${myUsername} 📋`, 'success');
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
              style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              {getUserInitials(activeFriend)}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                @{typeof activeFriend === 'string' ? activeFriend : activeFriend?.username || ''}
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                محادثة صديق
              </div>
            </div>
          </div>

          {/* Bot Toggle in Chat Button */}
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
            title={isBotEnabled ? 'البوت متصل بالمحادثة' : 'إضافة البوت للدردشة معكم'}
          >
            <Bot size={15} color={isBotEnabled ? '#38bdf8' : '#94a3b8'} />
            <span>{isBotEnabled ? 'البوت متصل 🤖' : 'إضافة البوت ➕'}</span>
          </button>
        </header>

        {/* Bot active banner */}
        {isBotEnabled && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '6px 14px',
            fontSize: '11px',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={13} />
            <span>الذكاء الاصطناعي (Seif Bot) يشارك في هذا الشات! اسأله أي شيء وسيرد عليكم معاً.</span>
          </div>
        )}

        {/* Message Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px calc(var(--safe-bottom) + 80px) 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '13px' }}>
              👋 ابدأ المحادثة الآن مع صديقك @{activeFriend}!
            </div>
          ) : (
            chatMessages.map((m) => {
              if (m.isSystem) {
                return (
                  <div key={m.id} style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#94a3b8',
                    padding: '4px 10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    margin: '4px auto',
                    maxWidth: '85%'
                  }}>
                    {m.text}
                  </div>
                );
              }

              if (m.isBot) {
                return (
                  <div key={m.id} style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                    border: '1.5px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '10px 14px',
                    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.15)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#38bdf8',
                      fontWeight: '700',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Bot size={13} /> Seif AI Bot
                    </div>
                    <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {m.text}
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
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '2px' }}>
                      @{m.sender}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.4' }}>
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 40
        }}>
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
              placeholder={isBotEnabled ? "اكتب رسالة أو اسأل البوت..." : "اكتب رسالة لصديقك..."}
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

  // ---------------- RENDER: MAIN FRIENDS LIST & REQUESTS ----------------
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
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Friends (الأصدقاء)</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>أضف أصدقاءك بالـ Username ودردش معهم ومع البوت</p>
        </div>
        <button
          onClick={loadFriends}
          className="ios-button-secondary"
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
          title="تحديث"
        >
          <RefreshCw size={16} />
        </button>
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
                width: '44px',
                height: '44px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '17px'
              }}>
                {getUserInitials(myUsername)}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>اسم المستخدم الخاص بك:</div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8' }}>
                  @{myUsername || 'لم يتم التسجيل'}
                </div>
              </div>
            </div>

            <button
              onClick={copyMyUsername}
              className="ios-button-secondary"
              style={{ padding: '8px 12px', fontSize: '12px', gap: '6px' }}
              title="نسخ اسم المستخدم"
            >
              <Copy size={14} />
              <span>نسخ</span>
            </button>
          </div>
        </div>

        {/* ➕ Add Friend Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <UserPlus size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>إضافة صديق جديد (Add Friend)</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            أدخل اسم مستخدم صديقك لإرسال طلب صداقة له:
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
                placeholder="username الصديق..."
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
              <span>إرسال طلب</span>
            </button>
          </form>
        </div>

        {/* 🔔 Incoming Friend Requests */}
        {(Array.isArray(friendsData?.incomingRequests) ? friendsData.incomingRequests.length : 0) > 0 && (
          <div className="glass-panel" style={{ padding: '16px', border: '1.5px solid rgba(56, 189, 248, 0.4)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#fbbf24" />
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>طلبات الصداقة الواردة</h3>
              </div>
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {Array.isArray(friendsData?.incomingRequests) ? friendsData.incomingRequests.length : 0} جديد
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(Array.isArray(friendsData?.incomingRequests) ? friendsData.incomingRequests : []).map((req) => (
                <div key={req?.id || Math.random()} style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {getUserInitials(req?.from)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>@{req?.from}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>أرسل لك طلب صداقة</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAccept(req.id, req.from)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={14} />
                      <span>قبول</span>
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 👥 My Friends List */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                أصدقائي ({Array.isArray(friendsData?.friends) ? friendsData.friends.length : 0})
              </h3>
            </div>
          </div>

          {(!Array.isArray(friendsData?.friends) || friendsData.friends.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '13px' }}>
              ليس لديك أصدقاء بعد. اكتب اسم مستخدم صديقك بالأعلى وأرسل له طلب صداقة! 🤝
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(Array.isArray(friendsData?.friends) ? friendsData.friends : []).map((friend) => {
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '14px'
                      }}>
                        {getUserInitials(friendName)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>@{friendName}</div>
                        <div style={{ fontSize: '11px', color: '#34d399' }}>صديق متصل ⚡</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenChat(friendName)}
                      className="ios-button-primary"
                      style={{ padding: '8px 14px', fontSize: '12px', gap: '6px' }}
                    >
                      <MessageCircle size={14} />
                      <span>دردشة 💬</span>
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

