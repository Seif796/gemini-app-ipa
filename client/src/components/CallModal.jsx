import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, User, Sparkles, Radio } from 'lucide-react';
import { sendCallResponse, sendCallEnd, sendCallSignal } from '../friendsApi';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function CallModal({ callState, onClose, showToast }) {
  const [status, setStatus] = useState(callState?.status || 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callState?.callType === 'voice');
  const [seconds, setSeconds] = useState(0);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const streamRef = useRef(null);
  const pcRef = useRef(null);
  const timerRef = useRef(null);
  const pendingCandidates = useRef([]);
  const pendingOfferRef = useRef(null);

  const friend = callState?.friend || 'Friend';
  const callType = callState?.callType || 'voice';
  const isIncoming = Boolean(callState?.isIncoming);

  // Synchronize status with props
  useEffect(() => {
    if (callState?.status) {
      setStatus(callState.status);
    }
  }, [callState?.status]);

  // Gentle ringtone generator for realistic calling & ringing feedback
  useEffect(() => {
    let audioCtx = null;
    let ringTimer = null;

    if (callState?.isOpen && (status === 'calling' || status === 'ringing')) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();

          const playRing = () => {
            if (!audioCtx || audioCtx.state === 'closed') return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(status === 'calling' ? 440 : 520, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.2);
          };

          playRing();
          ringTimer = setInterval(playRing, 2800);
        }
      } catch (_) {}
    }

    return () => {
      if (ringTimer) clearInterval(ringTimer);
      if (audioCtx) {
        try { audioCtx.close(); } catch (_) {}
      }
    };
  }, [callState?.isOpen, status]);

  // Request audio / video permissions and obtain local media stream
  useEffect(() => {
    let active = true;

    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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

          // If already connected, add tracks to peer connection
          if (pcRef.current) {
            stream.getTracks().forEach(track => {
              try {
                pcRef.current.addTrack(track, stream);
              } catch (_) {}
            });
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

  // Initialize WebRTC PeerConnection when status becomes 'connected'
  useEffect(() => {
    if (status !== 'connected' || !callState?.isOpen) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local stream tracks to PC
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, streamRef.current);
        } catch (_) {}
      });
    }

    // Handle remote tracks: stream remote voice and video
    pc.ontrack = (event) => {
      setHasRemoteTrack(true);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        if (remoteVideoRef.current && callType === 'video') {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    };

    // Send ICE candidates to friend via cloud signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendCallSignal(friend, { type: 'candidate', candidate: event.candidate.toJSON() });
      }
    };

    // If caller, create SDP Offer
    if (!isIncoming) {
      const createOffer = async () => {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video'
          });
          await pc.setLocalDescription(offer);
          sendCallSignal(friend, { type: 'offer', sdp: offer });
        } catch (err) {
          console.warn('WebRTC offer error:', err);
        }
      };
      createOffer();
    }

    // Process any offer that arrived early
    if (pendingOfferRef.current && isIncoming) {
      const pendingSdp = pendingOfferRef.current;
      pendingOfferRef.current = null;
      (async () => {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(pendingSdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendCallSignal(friend, { type: 'answer', sdp: answer });
        } catch (e) {
          console.warn('Pending offer processing error:', e);
        }
      })();
    }

    // Process any candidates that arrived early
    while (pendingCandidates.current.length > 0) {
      const cand = pendingCandidates.current.shift();
      try {
        pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      } catch (_) {}
    }

    return () => {
      try {
        pc.close();
      } catch (_) {}
      pcRef.current = null;
    };
  }, [status, callState?.isOpen, isIncoming, friend, callType]);

  // Listen for WebRTC Signaling Events from friend
  useEffect(() => {
    const handleSignal = async (e) => {
      const ev = e.detail;
      if (!ev || ev.from !== friend || !ev.signal) return;

      const pc = pcRef.current;
      const { type, sdp, candidate } = ev.signal;

      try {
        if (type === 'offer' && sdp) {
          if (!pc) {
            // Queue offer for when PC mounts
            pendingOfferRef.current = sdp;
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendCallSignal(friend, { type: 'answer', sdp: answer });

          // Flush queued candidates
          while (pendingCandidates.current.length > 0) {
            const c = pendingCandidates.current.shift();
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        } else if (type === 'answer' && sdp) {
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          // Flush queued candidates
          while (pendingCandidates.current.length > 0) {
            const c = pendingCandidates.current.shift();
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        } else if (type === 'candidate' && candidate) {
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.current.push(candidate);
          }
        }
      } catch (err) {
        console.warn('WebRTC signal processing notice:', err?.message || err);
      }
    };

    window.addEventListener('seif-call-signal', handleSignal);
    return () => window.removeEventListener('seif-call-signal', handleSignal);
  }, [friend]);

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
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (_) {}
      pcRef.current = null;
    }
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
      padding: 'calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 28px)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Hidden audio element that plays remote voice loud and clear */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Top Header / Call Type Badge */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
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
          marginBottom: '12px'
        }}>
          {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
          <span>{callType === 'video' ? 'مكالمة فيديو حية HD' : 'مكالمة صوتية نقية HD'}</span>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>
          @{friend}
        </h2>

        <div style={{ fontSize: '14px', color: status === 'connected' ? '#34d399' : '#94a3b8', fontWeight: '700' }}>
          {status === 'calling' && 'جاري الاتصال بصديقك... 📡'}
          {status === 'ringing' && 'رنين... 🔔'}
          {status === 'connected' && `متصل ومباشر (${formatTime(seconds)}) ⚡`}
          {status === 'ended' && 'تم إنهاء المكالمة'}
        </div>
      </div>

      {/* Center Display: Video Stream or HD Audio Visualizer */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0'
      }}>
        {callType === 'video' && status === 'connected' ? (
          /* Video Call View: Full Remote Video + Floating Local Video PIP */
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            maxHeight: '440px',
            borderRadius: '28px',
            overflow: 'hidden',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.25)',
            background: '#0b0f19'
          }}>
            {/* Remote Video (Friend's Camera) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Friend Name Badge */}
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span>@{friend}</span>
            </div>

            {/* Floating Picture-in-Picture Local Camera (Your Camera) */}
            {!isVideoOff && (
              <div style={{
                position: 'absolute',
                bottom: '14px',
                right: '14px',
                width: '100px',
                height: '135px',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
                background: '#000'
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
                  bottom: '4px',
                  left: '6px',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '2px 5px',
                  borderRadius: '6px'
                }}>
                  أنت
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Voice Call View: HD Voice Pulse Avatar */
          <div style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
            fontWeight: '900',
            boxShadow: status === 'connected'
              ? '0 0 50px rgba(52, 211, 153, 0.5)'
              : '0 0 45px rgba(56, 189, 248, 0.4)'
          }}>
            {(friend.substring(0, 2) || '?').toUpperCase()}

            {/* Pulsing Audio Ring */}
            <div style={{
              position: 'absolute',
              inset: '-14px',
              borderRadius: '50%',
              border: status === 'connected' ? '2.5px solid rgba(52, 211, 153, 0.5)' : '2.5px solid rgba(56, 189, 248, 0.4)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {isIncoming && status === 'ringing' ? (
          /* Incoming Call Actions: Accept or Decline */
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
          /* Active Call Controls */
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={toggleMute}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                border: isMuted ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
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
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: isVideoOff ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                  border: isVideoOff ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
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
                width: '62px',
                height: '62px',
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
        )}
      </div>
    </div>
  );
}
