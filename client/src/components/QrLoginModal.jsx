import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Smartphone, Laptop, CheckCircle, RefreshCw, X, Camera, ShieldCheck, Key } from 'lucide-react';
import { createQrLoginSession, approveQrLoginSession, getCurrentUsername } from '../friendsApi';

export default function QrLoginModal({ isOpen, onClose, mode = 'show', showToast, onLoginSuccess }) {
  const [session, setSession] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedUser, setApprovedUser] = useState('');
  const [mobileInputCode, setMobileInputCode] = useState('');
  const [approving, setApproving] = useState(false);
  const myUsername = getCurrentUsername();

  // If in 'show' mode (Laptop displays QR code)
  useEffect(() => {
    if (!isOpen || mode !== 'show') return;

    let sess = createQrLoginSession((username) => {
      setIsApproved(true);
      setApprovedUser(username);
      if (showToast) {
        showToast(`🎉 مرحباً بك @${username}! تم الدخول على اللابتوب بنجاح`, 'success');
      }
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(username);
        if (onClose) onClose();
      }, 1200);
    });

    setSession(sess);

    return () => {
      if (sess) sess.cancel();
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleMobileApprove = async (codeToApprove) => {
    const clean = (codeToApprove || mobileInputCode).trim();
    if (!clean) {
      if (showToast) showToast('يرجى مسح الكود أو إدخال الرمز', 'error');
      return;
    }

    setApproving(true);
    try {
      // If full JSON or raw session ID
      let sessionId = clean;
      if (clean.includes('{')) {
        try {
          const parsed = JSON.parse(clean);
          sessionId = parsed.sessionId || clean;
        } catch (_) {}
      }

      await approveQrLoginSession(sessionId);
      if (showToast) {
        showToast('🚀 تم تأكيد الدخول على اللابتوب بنجاح!', 'success');
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      if (showToast) showToast('تعذر ربط اللابتوب، تأكد من الكود', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleRefresh = () => {
    if (session) session.cancel();
    const sess = createQrLoginSession((username) => {
      setIsApproved(true);
      setApprovedUser(username);
      if (showToast) {
        showToast(`🎉 مرحباً بك @${username}! تم الدخول على اللابتوب بنجاح`, 'success');
      }
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(username);
        if (onClose) onClose();
      }, 1200);
    });
    setSession(sess);
  };

  const qrImageUrl = session?.sessionId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(session.sessionId)}`
    : '';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10002,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0d111c',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        padding: '24px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        textAlign: 'center',
        color: '#fff'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {mode === 'show' ? (
          /* LAPTOP MODE: DISPLAY QR CODE FOR SCANNING */
          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(56, 189, 248, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <QrCode size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
              تسجيل الدخول عبر كود QR
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.5' }}>
              افتح التطبيق في موبايلك واضغط <strong style={{ color: '#38bdf8' }}>ربط اللابتوب</strong> وصور الكود للدخول فوراً بدون كتابة اسم المستخدم!
            </p>

            {/* QR Code Canvas Frame */}
            <div style={{
              background: '#ffffff',
              padding: '14px',
              borderRadius: '20px',
              display: 'inline-block',
              margin: '0 auto 16px',
              boxShadow: '0 10px 30px rgba(56, 189, 248, 0.25)',
              position: 'relative'
            }}>
              {isApproved ? (
                <div style={{
                  width: '210px',
                  height: '210px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0f172a',
                  borderRadius: '12px',
                  color: '#10b981'
                }}>
                  <CheckCircle size={56} style={{ marginBottom: '10px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '800' }}>تم الدخول بنجاح!</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>@{approvedUser}</span>
                </div>
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR Login Code"
                  style={{ width: '210px', height: '210px', display: 'block', borderRadius: '10px' }}
                />
              ) : (
                <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  جاري تجهيز الكود...
                </div>
              )}
            </div>

            {/* Session code string fallback & status */}
            {!isApproved && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#38bdf8',
                marginBottom: '14px'
              }}>
                <span className="animate-spin">⚡</span>
                <span>بانتظار مسح الكود من هاتفك...</span>
                <button
                  onClick={handleRefresh}
                  title="تحديث الكود"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}

            <div style={{
              fontSize: '11px',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '8px 12px',
              borderRadius: '12px'
            }}>
              رمز الجلسة المباشرة: <code style={{ color: '#38bdf8', fontWeight: '700' }}>{session?.sessionId || '...'}</code>
            </div>
          </div>
        ) : (
          /* MOBILE MODE: SCAN / APPROVE LAPTOP LOGIN */
          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Laptop size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
              ربط اللابتوب بحسابك
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.5' }}>
              أدخل رمز الجلسة الظاهر على شاشة اللابتوب لتسجيل الدخول فوراً بحساب:
              <br />
              <strong style={{ color: '#38bdf8', fontSize: '14px' }}>@{myUsername}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '8px 14px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <Key size={18} color="#38bdf8" />
                <input
                  type="text"
                  placeholder="الصق أو اكتب كود الجلسة (qr_...)"
                  value={mobileInputCode}
                  onChange={(e) => setMobileInputCode(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => handleMobileApprove()}
              disabled={approving || !mobileInputCode.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                background: mobileInputCode.trim() ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: mobileInputCode.trim() ? 'pointer' : 'default',
                boxShadow: mobileInputCode.trim() ? '0 10px 25px rgba(56, 189, 248, 0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <ShieldCheck size={18} />
              <span>{approving ? 'جاري تأكيد الربط...' : 'تأكيد تسجيل الدخول على اللابتوب'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
