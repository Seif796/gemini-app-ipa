import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, Clock, Play, Square, Check, AlertCircle, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { POPULAR_DISTRACTING_APPS, getFocusState, saveFocusState } from '../focusBlocker';
import { notifications } from '../notifications';

export default function FocusBlockerTab({ showToast }) {
  const [focusState, setFocusState] = useState(getFocusState());
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [blockedApps, setBlockedApps] = useState(focusState.blockedAppIds);
  const [sessionGoal, setSessionGoal] = useState(focusState.sessionGoal);

  useEffect(() => {
    const handleFocusChange = (e) => {
      if (e.detail) {
        setFocusState(e.detail);
        setBlockedApps(e.detail.blockedAppIds);
      }
    };
    window.addEventListener('seif-focus-state-changed', handleFocusChange);
    return () => window.removeEventListener('seif-focus-state-changed', handleFocusChange);
  }, []);

  // Timer countdown tick
  useEffect(() => {
    if (!focusState.isActive) return;

    const timer = setInterval(() => {
      setFocusState((prev) => {
        if (!prev.isActive) return prev;
        const nextSec = prev.remainingSeconds - 1;
        if (nextSec <= 0) {
          notifications.scheduleLocal({
            title: '🎉 Focus Session Complete!',
            body: `Great job! You finished your study session without distractions.`
          });
          const finished = {
            ...prev,
            isActive: false,
            remainingSeconds: 0,
            startedAt: null
          };
          saveFocusState(finished);
          showToast('🎉 Focus session completed! Great work!', 'success');
          return finished;
        }

        const updated = { ...prev, remainingSeconds: nextSec };
        if (nextSec % 10 === 0) {
          saveFocusState(updated);
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [focusState.isActive]);

  const toggleAppSelection = (appId) => {
    if (focusState.isActive) {
      showToast('Cannot change blocked apps while session is active', 'warning');
      return;
    }
    setBlockedApps((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      return next;
    });
  };

  const handleStartFocus = () => {
    if (blockedApps.length === 0) {
      showToast('Please select at least 1 app to block for studying', 'warning');
      return;
    }

    const state = {
      isActive: true,
      durationMinutes: selectedDuration,
      remainingSeconds: selectedDuration * 60,
      blockedAppIds: blockedApps,
      sessionGoal: sessionGoal || 'Study Session',
      strictMode: true,
      startedAt: Date.now()
    };
    setFocusState(state);
    saveFocusState(state);
    notifications.scheduleLocal({
      title: '🛡️ Study Mode Activated',
      body: `${blockedApps.length} apps locked for ${selectedDuration} minutes. Stay focused!`
    });
    showToast(`Study Mode Started! 🔒 ${blockedApps.length} apps locked.`, 'success');
  };

  const handleStopFocus = () => {
    if (confirm('Are you sure you want to quit your focus session early?')) {
      const stopped = {
        ...focusState,
        isActive: false,
        remainingSeconds: 0,
        startedAt: null
      };
      setFocusState(stopped);
      saveFocusState(stopped);
      showToast('Study session ended.', 'info');
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = focusState.isActive
    ? Math.max(0, Math.min(100, (1 - focusState.remainingSeconds / (focusState.durationMinutes * 60)) * 100))
    : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      paddingBottom: 'calc(var(--safe-bottom) + 80px)',
      overflowY: 'auto'
    }}>
      {/* Top Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}>
            <Lock size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
              Study & App Blocker
            </h1>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>قفل التطبيقات للتركيز والمذاكرة</p>
          </div>
        </div>

        {focusState.isActive && (
          <span style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            Active Lock
          </span>
        )}
      </header>

      {/* Main Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Active Session Timer Card */}
        {focusState.isActive ? (
          <div className="glass-panel" style={{
            padding: '24px 20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{
              fontSize: '44px',
              fontWeight: '900',
              color: '#fff',
              letterSpacing: '1px',
              fontFamily: 'monospace',
              marginBottom: '6px',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}>
              {formatTimer(focusState.remainingSeconds)}
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '14px' }}>
              🎯 {focusState.sessionGoal}
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                transition: 'width 1s linear'
              }} />
            </div>

            <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '18px' }}>
              🔒 <strong>{focusState.blockedAppIds.length} Apps Locked</strong>. Stay focused and do not open distracting apps!
            </p>

            <button
              onClick={handleStopFocus}
              className="ios-button-secondary"
              style={{
                width: '100%',
                padding: '12px',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                fontSize: '13px'
              }}
            >
              <Square size={14} />
              <span>Give Up & Stop Lock (إنهاء الجلسة)</span>
            </button>
          </div>
        ) : (
          /* Pre-session Setup Card */
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BookOpen size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Start Study Lock (بدء وضع المذاكرة)</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.4' }}>
              حدد التطبيقات التي تشتتك، واختر مدة المذاكرة لقفلها ومنع فتحها حتى تنتهي الجلسة.
            </p>

            {/* Duration Selector */}
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
              ⏱️ Session Duration (مدة المذاكرة):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedDuration(mins)}
                  style={{
                    padding: '10px 0',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: selectedDuration === mins ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: selectedDuration === mins ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedDuration === mins ? '#38bdf8' : '#94a3b8',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartFocus}
              className="ios-button-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Play size={18} />
              <span>Lock Selected Apps ({selectedDuration} Min)</span>
            </button>
          </div>
        )}

        {/* App Checklist Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
              📱 Apps to Block (التطبيقات المقفولة)
            </h3>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
              {blockedApps.length} Selected
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {POPULAR_DISTRACTING_APPS.map((app) => {
              const isBlocked = blockedApps.includes(app.id);
              return (
                <div
                  key={app.id}
                  onClick={() => toggleAppSelection(app.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: isBlocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isBlocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{app.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{app.category}</div>
                    </div>
                  </div>

                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '7px',
                    border: isBlocked ? 'none' : '1.5px solid rgba(255, 255, 255, 0.2)',
                    background: isBlocked ? '#ef4444' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {isBlocked && <Check size={14} color="#fff" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

