import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, User, Sparkles } from 'lucide-react';
import { sendCallResponse, sendCallEnd } from '../friendsApi';

export default function CallModal({ callState, onClose, showToast }) {
  // callState: {
  //   isOpen: boolean,
  //   isIncoming: boolean,
  //   callType: 'voice' | 'video',
  //   friend: string,
  //   status: 'ringing' | 'calling' | 'connected' | 'ended'
  // }
  const [status, setStatus] = useState(callState?.status || 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callState?.callType === 'voice');
  const [seconds, setSeconds] = useState(0);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const friend = callState?.friend || 'Friend';
  const callType = callState?.callType || 'voice';

  // Synchronize status with props
  useEffect(() => {
    if (callState?.status) {
      setStatus(callState.status);
    }
  }, [callState?.status]);

  // Request audio / video permissions safely without freezing
  useEffect(() => {
    let active = true;

    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            audio: true,
            video: callType === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          if (localVideoRef.current && callType === 'video') {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Call media access notice:', err?.message || err);
      }
    };

    if (callState?.isOpen) {
      startMedia();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [callState?.isOpen, callType]);

  // Connected call duration timer
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Format timer seconds (MM:SS)
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setStatus('connected');
    await sendCallResponse(friend, true);
    if (showToast) showToast(`📞 بدأت المكالمة مع @${friend}`, 'success');
  };

  const handleDecline = async () => {
    await sendCallResponse(friend, false);
    cleanupAndClose();
  };

  const handleEndCall = async () => {
    await sendCallEnd(friend);
    cleanupAndClose();
  };

  const cleanupAndClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearInterval(timerRef.current);
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
    }
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
    }
    setIsVideoOff(prev => !prev);
  };

  if (!callState?.isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'calc(var(--safe-top) + 24px) 20px calc(var(--safe-bottom) + 36px)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Top Header / Call Type Badge */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '16px'
        }}>
          {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
          <span>{callType === 'video' ? 'مكالمة فيديو مباشرة' : 'مكالمة صوتية HD'}</span>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          @{friend}
        </h2>

        <div style={{ fontSize: '15px', color: status === 'connected' ? '#34d399' : '#94a3b8', fontWeight: '600' }}>
          {status === 'calling' && 'جاري الاتصال... 📡'}
          {status === 'ringing' && 'رنين... 🔔'}
          {status === 'connected' && `متصل (${formatTime(seconds)}) ⚡`}
          {status === 'ended' && 'تم إنهاء المكالمة'}
        </div>
      </div>

      {/* Center Display / Avatar or Video Stream */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '30px 0'
      }}>
        {callType === 'video' && status === 'connected' && !isVideoOff ? (
          <div style={{
            width: '260px',
            height: '340px',
            borderRadius: '28px',
            overflow: 'hidden',
            border: '2px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.3)',
            background: '#0b0f19',
            position: 'relative'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              color: '#fff'
            }}>
              @{friend}
            </div>
          </div>
        ) : (
          <div style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: '800',
            boxShadow: status === 'connected'
              ? '0 0 45px rgba(52, 211, 153, 0.4)'
              : '0 0 40px rgba(56, 189, 248, 0.35)'
          }}>
            {(friend.substring(0, 2) || '?').toUpperCase()}

            {status !== 'connected' && (
              <div style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }} />
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div style={{ width: '100%', maxWidth: '340px' }}>
        {callState.isIncoming && status === 'ringing' ? (
          /* Incoming Call: Accept or Decline */
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <button
              onClick={handleDecline}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
              }}
              title="رفض"
            >
              <PhoneOff size={28} />
            </button>

            <button
              onClick={handleAccept}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)'
              }}
              title="قبول"
            >
              <Phone size={28} />
            </button>
          </div>
        ) : (
          /* Outgoing or Connected Call Controls */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <button
                onClick={toggleMute}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: isMuted ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: isMuted ? '#ef4444' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isVideoOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: isVideoOff ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: isVideoOff ? '#ef4444' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
                >
                  {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
              )}

              <button
                onClick={handleEndCall}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
                }}
                title="إنهاء المكالمة"
              >
                <PhoneOff size={26} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

