import React, { useState } from 'react';
import { User, Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { registerOrLoginUsername } from '../friendsApi';
import AppIconBadge from './AppIconBadge';

export default function UsernameModal({ isOpen, onComplete, showToast }) {
  const [username, setUsername] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const clean = username.trim();
    if (!clean) {
      setError('يرجى كتابة اسم المستخدم');
      return;
    }

    setLoading(true);
    try {
      const user = await registerOrLoginUsername(clean, isExisting);
      showToast(isExisting ? `👋 أهلاً بعودتك يا @${user.username}!` : `🎉 تم تسجيل دخولك بنجاح باسم @${user.username}!`, 'success');
      onComplete(user.username);
    } catch (err) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'rgba(18, 22, 34, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* App Logo & Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <AppIconBadge size={62} radius={20} showBorder={true} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          {isExisting ? 'تسجيل الدخول إلى حسابك' : 'مرحباً بك في Seif AI'}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.4' }}>
          {isExisting
            ? 'أدخل اسم المستخدم الخاص بك للوصول إلى أصدقائك ومحادثاتك'
            : 'اختر اسم مستخدم خاص بك للتواصل والدردشة مع أصدقائك والذكاء الاصطناعي'}
        </p>

        {/* Tab Switcher: New vs Existing */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setIsExisting(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: !isExisting ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: !isExisting ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            حساب جديد ✨
          </button>
          <button
            type="button"
            onClick={() => { setIsExisting(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: isExisting ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: isExisting ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            لدي حساب مسبقاً 🔑
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#38bdf8',
              fontWeight: '700',
              fontSize: '15px'
            }}>
              @
            </span>
            <input
              type="text"
              placeholder="اكتب اسم المستخدم هنا..."
              value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s+/g, '')); setError(''); }}
              disabled={loading}
              autoFocus
              dir="ltr"
              style={{
                width: '100%',
                padding: '14px 14px 14px 34px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: error ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              fontSize: '12px',
              textAlign: 'right',
              padding: '6px 10px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '10px'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading || !username.trim() ? 'default' : 'pointer',
              opacity: loading || !username.trim() ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <span>{isExisting ? 'دخول واسترجاع الحساب' : 'تأكيد اسم المستخدم والبدء'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b' }}>
          🔒 سيبقى حسابك مسجلاً دائماً على هذا الهاتف تلقائياً.
        </div>
      </div>
    </div>
  );
}
