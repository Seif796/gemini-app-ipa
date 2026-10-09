import React, { useState, useEffect, useRef } from 'react';
import { api, getToken, setToken, isGuestMode } from './api';
import { getActiveTheme, setActiveTheme } from './themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatSeconds } from './screenTime';
import { notifications } from './notifications';
import TabBar from './components/TabBar';
import ChatTab from './components/ChatTab';
import NotesTab from './components/NotesTab';
import TasksTab from './components/TasksTab';
import SettingsTab from './components/SettingsTab';
import AuthModal from './components/AuthModal';
import ScreenTimeOverlay from './components/ScreenTimeOverlay';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState('chat');
  const [toast, setToast] = useState(null); // { message, type }
  const [screenTime, setScreenTime] = useState(getScreenTimeData());
  const continuousMinutesRef = useRef(0);

  useEffect(() => {
    setActiveTheme(getActiveTheme().id);
    checkInitialAuth();

    const handleStChange = (e) => {
      if (e.detail) setScreenTime({ ...e.detail });
    };
    window.addEventListener('seif-screentime-updated', handleStChange);
    return () => window.removeEventListener('seif-screentime-updated', handleStChange);
  }, []);

  // Screen time interval tracker - ticks every second when app is open
  useEffect(() => {
    const timer = setInterval(() => {
      setScreenTime((prev) => {
        const nextSeconds = prev.todayUsageSeconds + 1;
        const currentMins = Math.floor(nextSeconds / 60);
        let shouldLock = prev.isLocked;

        // Check daily limit
        if (prev.limitEnabled && prev.dailyLimitMinutes > 0 && !prev.isLocked) {
          if (nextSeconds >= prev.dailyLimitMinutes * 60) {
            shouldLock = true;
            notifications.scheduleLocal({
              title: '⌛ Screen Time Limit Reached',
              body: `You have reached your daily limit of ${prev.dailyLimitMinutes} minutes.`
            });
          }
        }

        // Check continuous break reminder (every breakIntervalMinutes)
        if (prev.breakRemindersEnabled && prev.breakIntervalMinutes > 0) {
          if (nextSeconds > 0 && nextSeconds % (prev.breakIntervalMinutes * 60) === 0) {
            notifications.scheduleLocal({
              title: '🧘 Break Time Reminder',
              body: `You have been using the app for ${prev.breakIntervalMinutes} mins. Take a short pause!`
            });
          }
        }

        const updated = {
          ...prev,
          todayUsageSeconds: nextSeconds,
          isLocked: shouldLock
        };

        // Persist to localStorage every 5 seconds to minimize disk writes
        if (nextSeconds % 5 === 0) {
          saveScreenTimeData(updated);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExtendScreenTime = (extraMinutes = 15) => {
    setScreenTime((prev) => {
      const updated = {
        ...prev,
        dailyLimitMinutes: prev.dailyLimitMinutes + extraMinutes,
        isLocked: false
      };
      saveScreenTimeData(updated);
      showToast(`+${extraMinutes} minutes added to today's screen time! ⏱️`, 'success');
      return updated;
    });
  };

  const handleUnlockScreenTime = () => {
    setScreenTime((prev) => {
      const updated = {
        ...prev,
        isLocked: false,
        limitEnabled: false
      };
      saveScreenTimeData(updated);
      showToast('Daily screen time limit disabled for today. Enjoy! 🌟', 'info');
      return updated;
    });
  };

  const checkInitialAuth = async () => {
    const token = getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
    } catch (err) {
      console.warn('Saved token expired or invalid:', err);
      setToken(null);
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    showToast('Signed out successfully', 'info');
  };

  if (authChecking) {
    return (
      <div className="ios-app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            margin: '0 auto 16px',
            animation: 'pulse 1.5s infinite alternate'
          }} />
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Connecting to 24/7 Companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ios-app-container">
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 'calc(var(--safe-top) + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background:
            toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
            toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
            toast.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 41, 59, 0.95)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {toast.message}
        </div>
      )}

      {/* Main Screen Content */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentTab === 'chat' && <ChatTab showToast={showToast} />}
        {currentTab === 'notes' && <NotesTab showToast={showToast} onTaskAdded={() => {}} />}
        {currentTab === 'tasks' && <TasksTab showToast={showToast} />}
        {currentTab === 'settings' && (
          <SettingsTab user={currentUser} onLogout={handleLogout} showToast={showToast} />
        )}
      </main>

      {/* iOS Bottom Navigation Bar */}
      <TabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Auth Modal if user is not signed in */}
      {!currentUser && (
        <AuthModal
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            showToast(`Welcome back, ${user.name}!`, 'success');
          }}
        />
      )}

      {/* Screen Time Enforcement Overlay */}
      <ScreenTimeOverlay
        screenTime={screenTime}
        onExtend={handleExtendScreenTime}
        onUnlock={handleUnlockScreenTime}
      />
    </div>
  );
}
