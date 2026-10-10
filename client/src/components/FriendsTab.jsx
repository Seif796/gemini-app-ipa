import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, MessageCircle, Check, X, Copy, Send, Bot, 
  ArrowLeft, Clock, Sparkles, AlertCircle, RefreshCw, UserCheck, 
  Trash2, Phone, Video, Users2, AlertTriangle
} from 'lucide-react';
import { 
  getCurrentUsername, getFriendsData, sendFriendRequest, 
  acceptFriendRequest, rejectFriendRequest, removeFriend 
} from '../friendsApi';
import { playNotificationSound } from '../notifications';
import { getAppLanguage, getTranslation } from '../i18n';
import LanguageToggle from './LanguageToggle';
import FriendChatRoom from './FriendChatRoom';

function getUserInitials(name) {
  if (!name) return '?';
  const str = typeof name === 'string' ? name : String(name?.username || name?.from || name || '');
  return (str.trim().substring(0, 2) || '?').toUpperCase();
}

export default function FriendsTab({ showToast, onOpenUsernameModal, onOpenAccountSwitcher, onStartCall }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  const [myUsername, setMyUsername] = useState(getCurrentUsername());
  const [friendsData, setFriendsData] = useState({ friends: [], incomingRequests: [], outgoingRequests: [] });
  const [loading, setLoading] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null);

  // Active chat state
  const [activeFriend, setActiveFriend] = useState(null);

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

  // Listen for account switch
  useEffect(() => {
    const handleSwitched = (e) => {
      const newUser = e.detail?.username || getCurrentUsername();
      setMyUsername(newUser);
      setActiveFriend(null);
      loadFriends();
    };
    window.addEventListener('seif-account-switched', handleSwitched);
    return () => window.removeEventListener('seif-account-switched', handleSwitched);
  }, []);

  // Listen for real-time friend requests & acceptances
  useEffect(() => {
    const handleReqReceived = () => loadFriends();
    const handleFriendAccepted = (e) => {
      loadFriends();
      if (e.detail?.friend && showToast) {
        showToast(lang === 'ar' ? `🎉 @${e.detail.friend} قبل طلب صداقتك وأصبحتم أصدقاء الآن!` : `🎉 @${e.detail.friend} accepted your friend request!`, 'success');
      }
    };
    const handleFriendRemoved = () => loadFriends();

    window.addEventListener('seif-friend-request-received', handleReqReceived);
    window.addEventListener('seif-friend-accepted', handleFriendAccepted);
    window.addEventListener('seif-friend-removed', handleFriendRemoved);

    return () => {
      window.removeEventListener('seif-friend-request-received', handleReqReceived);
      window.removeEventListener('seif-friend-accepted', handleFriendAccepted);
      window.removeEventListener('seif-friend-removed', handleFriendRemoved);
    };
  }, [lang]);

  // Live polling for requests
  useEffect(() => {
    if (!myUsername || activeFriend) return;

    const poll = async () => {
      try {
        const data = await getFriendsData();
        setFriendsData((prev) => {
          const prevReqs = (prev && Array.isArray(prev.incomingRequests)) ? prev.incomingRequests : [];
          const newReqs = (data && Array.isArray(data.incomingRequests)) ? data.incomingRequests : [];
          if (newReqs.length > prevReqs.length && showToast) {
            playNotificationSound();
            showToast(lang === 'ar' ? '🔔 وصلك طلب صداقة جديد!' : '🔔 New friend request received!', 'info');
          }
          return {
            friends: (data && Array.isArray(data.friends)) ? data.friends : [],
            incomingRequests: newReqs,
            outgoingRequests: (data && Array.isArray(data.outgoingRequests)) ? data.outgoingRequests : []
          };
        });
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [myUsername, activeFriend, lang]);

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
      if (showToast) showToast(`${t.friendRequestSentSuccess} (@${clean})`, 'success');
      setTargetUsername('');
      await loadFriends();
    } catch (err) {
      if (showToast) showToast(err.message || t.errUsernameNotFound, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (requestId, fromUser) => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(requestId);
      if (showToast) showToast(`${t.friendAcceptedSuccess} (@${fromUser})`, 'success');
      await loadFriends();
      setActiveFriend(fromUser);
    } catch (err) {
      if (showToast) showToast(err.message || t.errUsernameNotFound, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      if (showToast) showToast(t.friendRejectedInfo, 'info');
      await loadFriends();
    } catch (err) {
      if (showToast) showToast('Error', 'error');
    }
  };

  const handleConfirmRemove = async () => {
    if (!friendToRemove) return;
    try {
      await removeFriend(friendToRemove);
      if (showToast) {
        showToast(lang === 'ar' ? `تم حذف @${friendToRemove} من أصدقائك` : `Removed @${friendToRemove}`, 'info');
      }
      setFriendToRemove(null);
      await loadFriends();
    } catch (_) {}
  };

  const copyMyUsername = () => {
    navigator.clipboard?.writeText(myUsername);
    if (showToast) showToast(`${t.copied} (@${myUsername})`, 'success');
  };

  // If in active friend chat, render FriendChatRoom
  if (activeFriend) {
    return (
      <FriendChatRoom
        friend={activeFriend}
        onBack={() => {
          setActiveFriend(null);
          loadFriends();
        }}
        onStartCall={onStartCall}
        showToast={showToast}
      />
    );
  }

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

      {/* Remove Confirmation Dialog */}
      {friendToRemove && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
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
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '320px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              حذف الصديق؟
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.4' }}>
              هل تريد بالتأكيد إزالة @{friendToRemove} من قائمة الأصدقاء؟
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setFriendToRemove(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
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
                onClick={handleConfirmRemove}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* My Username Card + Multi-Account Switcher */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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

          {/* Account Switcher Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <Users2 size={16} color="#38bdf8" />
              <span>{lang === 'ar' ? 'تبديل أو إضافة حساب آخر' : 'Switch or Add Account'}</span>
            </div>
            <button
              onClick={() => onOpenAccountSwitcher && onOpenAccountSwitcher()}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {lang === 'ar' ? 'إدارة الحسابات 🔑' : 'Manage Accounts 🔑'}
            </button>
          </div>
        </div>

        {/* 📥 DEDICATED FRIEND REQUESTS SECTION */}
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
                        gap: '5px'
                      }}
                    >
                      <Check size={15} />
                      <span>{t.acceptBtn}</span>
                    </button>
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
                        cursor: 'pointer'
                      }}
                      title={t.rejectBtn}
                    >
                      <X size={15} />
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

        {/* 👥 MY FRIENDS LIST + REMOVE FRIEND */}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Voice call shortcut */}
                      <button
                        onClick={() => onStartCall && onStartCall(friendName, 'voice')}
                        className="ios-button-secondary"
                        style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0, color: '#34d399' }}
                        title="مكالمة صوتية"
                      >
                        <Phone size={15} />
                      </button>

                      {/* Video call shortcut */}
                      <button
                        onClick={() => onStartCall && onStartCall(friendName, 'video')}
                        className="ios-button-secondary"
                        style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0, color: '#38bdf8' }}
                        title="مكالمة فيديو"
                      >
                        <Video size={15} />
                      </button>

                      {/* Chat button */}
                      <button
                        onClick={() => setActiveFriend(friendName)}
                        className="ios-button-primary"
                        style={{ padding: '7px 12px', fontSize: '12px', gap: '4px' }}
                      >
                        <MessageCircle size={14} />
                        <span>{t.chatWithFriendBtn}</span>
                      </button>

                      {/* Remove Friend button */}
                      <button
                        onClick={() => setFriendToRemove(friendName)}
                        className="ios-button-secondary"
                        style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0, color: '#f87171' }}
                        title="حذف الصديق"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
