import React, { useState, useEffect, useRef } from 'react';
import { api, getToken, setToken, isGuestMode, setGuestMode } from './api';
import { getActiveTheme, setActiveTheme } from './themeIcons';
import { getScreenTimeData, saveScreenTimeData, formatSeconds } from './screenTime';
import { notifications } from './notifications';
import { 
  getCurrentUsername, getFriendsData, checkNewIncomingDmMessages, 
  updateUserLocation, checkAcceptedFriendships, checkNearbyFriendsAlerts, 
  checkDepartedFriendsAlerts, sendCallInvite 
} from './friendsApi';
import { initLocationTracking } from './locationService';
import { getAppLanguage } from './i18n';
import TabBar from './components/TabBar';
import ChatTab from './components/ChatTab';
import FriendsTab from './components/FriendsTab';
import AiToolsTab from './components/AiToolsTab';
import NotesTab from './components/NotesTab';
import TasksTab from './components/TasksTab';
import SettingsTab from './components/SettingsTab';
import ScreenTimeOverlay from './components/ScreenTimeOverlay';
import UsernameModal from './components/UsernameModal';
import CallModal from './components/CallModal';
import AccountSwitcherModal from './components/AccountSwitcherModal';
import AboutModal from './components/AboutModal';

export default function App() {
  const [myUsername, setMyUsername] = useState(() => getCurrentUsername());
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(() => !getCurrentUsername());
  const [currentUser, setCurrentUser] = useState(() => ({ name: getCurrentUsername() || 'User', email: 'guest@seif-ai.local' }));
  const [currentTab, setCurrentTab] = useState('chat');
  const [pendingFriendsCount, setPendingFriendsCount] = useState(0);
  const [toast, setToast] = useState(null); // { message, type }
  const [screenTime, setScreenTime] = useState(() => getScreenTimeData());
  const [callState, setCallState] = useState(null); // { isOpen, isIncoming, callType, friend, status }
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const continuousMinutesRef = useRef(0);

  useEffect(() => {
    setActiveTheme(getActiveTheme().id);
    setGuestMode(true);

    const initialLang = getAppLanguage();
    document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = initialLang;

    const handleStChange = (e) => {
      if (e.detail) setScreenTime({ ...e.detail });
    };

    const handleLangChange = (e) => {
      const l = e.detail || getAppLanguage();
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = l;
    };

    window.addEventListener('seif-screentime-updated', handleStChange);
    window.addEventListener('seif-language-changed', handleLangChange);
    return () => {
      window.removeEventListener('seif-screentime-updated', handleStChange);
      window.removeEventListener('seif-language-changed', handleLangChange);
    };
  }, []);

  // Initialize real-time location tracking for user & friend proximity
  useEffect(() => {
    if (myUsername) {
      initLocationTracking((coords) => {
        updateUserLocation(coords.lat, coords.lng);
      });
    }
  }, [myUsername]);

  // Global background listener for DM messages, friend requests, proximity & acceptances
  useEffect(() => {
    if (!myUsername) return;

    const pollDmAndRequests = async () => {
      try {
        // 1. Check for incoming DM messages (Title: sender name, Body: message text)
        const newDmMessages = await checkNewIncomingDmMessages();
        if (Array.isArray(newDmMessages) && newDmMessages.length > 0) {
          for (const msg of newDmMessages) {
            const senderTitle = msg.isBot ? '🤖 Gemini ✨' : `@${msg.sender}`;
            const messageBody = msg.text || '';

            // Native notification with Title = sender name, Body = message text
            await notifications.sendNow(senderTitle, messageBody);

            // In-app visual toast banner
            showToast(`💬 ${senderTitle}: ${messageBody}`, 'info');

            // Dispatch global event for FriendsTab reactive sync
            window.dispatchEvent(new CustomEvent('seif-new-dm-received', { detail: msg }));
          }
        }

        // 2. Check for newly accepted friend requests (Notify the sender: "مبروك قبلت صديقك")
        const newlyAccepted = await checkAcceptedFriendships();
        if (Array.isArray(newlyAccepted) && newlyAccepted.length > 0) {
          for (const friend of newlyAccepted) {
            await notifications.sendNow('🎉 مبروك!', `@${friend} قبل طلب صداقتك وأصبحتم أصدقاء الآن! ابدأ الدردشة معه 🤝`);
            showToast(`🎉 مبروك! قبلت صديقك @${friend}`, 'success');
          }
        }

        // 3. Check for nearby friends in close proximity (< 500m)
        const nearbyFriends = await checkNearbyFriendsAlerts();
        if (Array.isArray(nearbyFriends) && nearbyFriends.length > 0) {
          for (const item of nearbyFriends) {
            const distText = item.distance < 100 ? 'أقل من 100 متر' : `${item.distance} متر`;
            const title = `📍 @${item.friend} قريب منك!`;
            const body = `أنت وصديقك @${item.friend} قريبين من بعض (${distText})! كلمه وشوفه دلوقتي 🤝`;
            await notifications.sendNow(title, body);
            showToast(body, 'info');
          }
        }

        // 4. Check for departed friends (distance widened after being nearby)
        const departedFriends = await checkDepartedFriendsAlerts();
        if (Array.isArray(departedFriends) && departedFriends.length > 0) {
          for (const item of departedFriends) {
            const title = `🚶‍♂️ بعدتوا عن بعض!`;
            const body = `أنت وصديقك @${item.friend} بعدتوا عن بعض دلوقتي! كلمه شوية وسلّي وقتك 💬`;
            await notifications.sendNow(title, body);
            showToast(body, 'info');
          }
        }

        // 5. Check pending friend requests for badge
        const data = await getFriendsData();
        const count = (data && Array.isArray(data.incomingRequests)) ? data.incomingRequests.length : 0;
        setPendingFriendsCount(count);
      } catch (_) {}
    };

    pollDmAndRequests();
    const interval = setInterval(pollDmAndRequests, 2500);
    return () => clearInterval(interval);
  }, [myUsername]);

  // Real-time voice & video call signaling listeners + account switch
  useEffect(() => {
    const handleCallInvite = (e) => {
      const ev = e.detail;
      if (ev && ev.from) {
        setCallState({
          isOpen: true,
          isIncoming: true,
          callType: ev.callType || 'voice',
          friend: ev.from,
          status: 'ringing'
        });
      }
    };

    const handleCallResponse = (e) => {
      const ev = e.detail;
      if (ev) {
        if (ev.accepted) {
          setCallState(prev => prev ? ({ ...prev, status: 'connected' }) : null);
        } else {
          showToast(`❌ تم رفض المكالمة من @${ev.from}`, 'info');
          setCallState(null);
        }
      }
    };

    const handleCallEnd = () => {
      setCallState(null);
    };

    const handleAccountSwitched = (e) => {
      const newUser = e.detail?.username || getCurrentUsername();
      setMyUsername(newUser);
      setCurrentUser({ name: newUser || 'User', email: `${newUser}@seif-ai.local` });
    };

    window.addEventListener('seif-call-invite', handleCallInvite);
    window.addEventListener('seif-call-response', handleCallResponse);
    window.addEventListener('seif-call-end', handleCallEnd);
    window.addEventListener('seif-account-switched', handleAccountSwitched);

    return () => {
      window.removeEventListener('seif-call-invite', handleCallInvite);
      window.removeEventListener('seif-call-response', handleCallResponse);
      window.removeEventListener('seif-call-end', handleCallEnd);
      window.removeEventListener('seif-account-switched', handleAccountSwitched);
    };
  }, []);

  const handleStartCall = async (friend, callType = 'voice') => {
    setCallState({
      isOpen: true,
      isIncoming: false,
      callType,
      friend,
      status: 'calling'
    });
    await sendCallInvite(friend, callType);
  };

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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleLogout = () => {
    setToken(null);
    showToast('Signed out successfully', 'info');
  };

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
        {currentTab === 'chat' && (
          <ChatTab 
            showToast={showToast} 
            onStartCall={handleStartCall} 
            onSwitchTab={(t) => setCurrentTab(t)} 
            onOpenAbout={() => setIsAboutModalOpen(true)}
          />
        )}
        {currentTab === 'friends' && (
          <FriendsTab 
            showToast={showToast} 
            onOpenUsernameModal={() => setIsUsernameModalOpen(true)}
            onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
            onStartCall={handleStartCall}
          />
        )}
        {currentTab === 'tools' && <AiToolsTab showToast={showToast} />}
        {currentTab === 'notes' && <NotesTab showToast={showToast} onTaskAdded={() => {}} />}
        {currentTab === 'tasks' && <TasksTab showToast={showToast} />}
        {currentTab === 'settings' && (
          <SettingsTab 
            user={currentUser} 
            onLogout={handleLogout} 
            showToast={showToast} 
            onOpenAbout={() => setIsAboutModalOpen(true)}
          />
        )}
      </main>

      {/* iOS Bottom Navigation Bar */}
      <TabBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingFriendsCount={pendingFriendsCount}
      />

      {/* Voice & Video Call Modal */}
      <CallModal
        callState={callState}
        onClose={() => setCallState(null)}
        showToast={showToast}
      />

      {/* Multi-Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
        onAddNew={() => setIsUsernameModalOpen(true)}
        showToast={showToast}
      />

      {/* Screen Time Enforcement Overlay */}
      <ScreenTimeOverlay
        screenTime={screenTime}
        onExtend={handleExtendScreenTime}
        onUnlock={handleUnlockScreenTime}
      />

      {/* Pure Username Sign-In / Account Modal */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        hasExistingAccount={!!myUsername}
        onComplete={(username) => {
          setIsUsernameModalOpen(false);
          setMyUsername(username);
          setCurrentUser({ name: username, email: `${username}@seif-ai.local` });
        }}
        showToast={showToast}
      />

      {/* Dedicated About App Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}
