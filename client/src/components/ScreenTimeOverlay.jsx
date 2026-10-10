import React from 'react';
import { Hourglass, Lock, Unlock, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatSeconds, formatMinutes } from '../screenTime';

export default function ScreenTimeOverlay({ screenTime, onExtend, onUnlock }) {
  if (!screenTime || !screenTime.limitEnabled || !screenTime.isLocked) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: 'rgba(10, 15, 30, 0.94)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(244, 63, 94, 0.35))',
        border: '1.5px solid rgba(239, 68, 68, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 0 35px rgba(239, 68, 68, 0.3)'
      }}>
        <Hourglass size={42} color="#f87171" />
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
        Screen Time Limit Reached
      </h2>
      <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
        وقت الشاشة المحدد لهذا اليوم انتهى
      </p>

      <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '320px', lineHeight: '1.5', marginBottom: '24px' }}>
        You have reached your daily limit of <strong>{formatMinutes(screenTime.dailyLimitMinutes)}</strong>.
        Take a rest, or extend your time below if needed.
      </p>

      {/* Usage statistics badge */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '12px 20px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Clock size={18} color="#38bdf8" />
        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
          Today's Usage: <strong style={{ color: '#fff' }}>{formatSeconds(screenTime.todayUsageSeconds)}</strong>
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
        <button
          onClick={() => onExtend(15)}
          className="ios-button-primary"
          style={{
            padding: '14px',
            fontSize: '15px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
          }}
        >
          <Clock size={16} />
          <span>Extend 15 Minutes (+15 دقيقة)</span>
        </button>

        <button
          onClick={onUnlock}
          className="ios-button-secondary"
          style={{
            padding: '12px',
            fontSize: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <Unlock size={15} />
          <span>Ignore Limit for Today</span>
        </button>
      </div>
    </div>
  );
}

