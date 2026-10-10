import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Trash2, Copy, Check, Bot, Bell, Clock, Cpu, 
  ExternalLink, Power, Mic, MicOff, Camera as CameraIcon, Image as ImageIcon, 
  Volume2, X, Phone, Video, UserPlus, Search 
} from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { api } from '../api';
import { notifications } from '../notifications';
import { getActiveTheme } from '../themeIcons';
import { openApp, closeCurrentApp, findAppByName } from '../appLauncher';
import { getAllChatsOverview } from '../friendsApi';
import AppIconBadge from './AppIconBadge';
import LanguageToggle from './LanguageToggle';
import FriendChatRoom from './FriendChatRoom';
import { getAppLanguage, getTranslation } from '../i18n';

export default function ChatTab({ showToast, onStartCall, onSwitchTab }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('aether_local_chats');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 'welcome',
        role: 'model',
        content: "👋 مرحباً بك في **Seif Ai Test**!\n\nأنا مساعدك الذكي السريع على مدار 24 ساعة. اسألني أي سؤال أو التقط مسألة بالكاميرا لحلها، أو قل: **\"فكرني بعد 5 دقائق بـ...\"** لضبط تنبيهات حقيقية!"
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-flash-lite-latest');
  const [copiedId, setCopiedId] = useState(null);
  const [theme, setTheme] = useState(getActiveTheme());
  const [selectedImage, setSelectedImage] = useState(null); // base64 image for Gemini Vision
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Chat view mode: 'ai' (Gemini) vs 'friends' (كل المحادثات)
  const [chatMode, setChatMode] = useState('ai');
  const [activeFriendChat, setActiveFriendChat] = useState(null);
  const [chatsList, setChatsList] = useState(() => getAllChatsOverview());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const refreshChats = () => {
      setChatsList(getAllChatsOverview());
    };
    window.addEventListener('seif-new-dm-received', refreshChats);
    window.addEventListener('seif-friend-accepted', refreshChats);
    window.addEventListener('seif-friend-removed', refreshChats);
    window.addEventListener('seif-account-switched', refreshChats);
    return () => {
      window.removeEventListener('seif-new-dm-received', refreshChats);
      window.removeEventListener('seif-friend-accepted', refreshChats);
      window.removeEventListener('seif-friend-removed', refreshChats);
      window.removeEventListener('seif-account-switched', refreshChats);
    };
  }, []);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  useEffect(() => {
    loadChatHistory();
    notifications.init();

    // Initialize Web Speech Recognition if available on iPhone / Safari
    try {
      const WebSpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (WebSpeechRec) {
        const recognition = new WebSpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ar-SA'; // Primary Arabic, also supports English

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
            showToast('🎙️ صوتك اتسجل بنجاح!', 'info');
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (e) {
      console.warn('Speech recognition Web API not permitted or available:', e);
    }

    const handleThemeChange = (e) => {
      if (e.detail) setTheme(e.detail);
    };
    window.addEventListener('seif-theme-changed', handleThemeChange);
    return () => window.removeEventListener('seif-theme-changed', handleThemeChange);
  }, []);

  const toggleSpeechRecognition = async () => {
    if (isListening) {
      try {
        if (Capacitor.isNativePlatform()) {
          await SpeechRecognition.stop();
        } else if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping speech:', e);
      }
      setIsListening(false);
      return;
    }

    // 1. Native iOS/Android Speech Recognition via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          showToast('يرجى تفعيل الإملاء الصوتي (Dictation) في إعدادات الهاتف', 'warning');
          return;
        }

        const perm = await SpeechRecognition.checkPermissions();
        if (perm.speechRecognition !== 'granted') {
          const req = await SpeechRecognition.requestPermissions();
          if (req.speechRecognition !== 'granted') {
            showToast('يرجى السماح بصلاحية الميكروفون والتعرف على الصوت', 'warning');
            return;
          }
        }

        setIsListening(true);
        showToast('🎙️ اتكلم دلوقتي وسامعك...', 'info');

        await SpeechRecognition.removeAllListeners();

        await SpeechRecognition.addListener('partialResults', (data) => {
          if (data?.matches?.length > 0) {
            setInput(data.matches[0]);
          }
        });

        await SpeechRecognition.addListener('listeningState', (data) => {
          if (data.status === 'stopped') {
            setIsListening(false);
          }
        });

        const res = await SpeechRecognition.start({
          language: 'ar-SA',
          maxResults: 2,
          prompt: 'تحدث الآن...',
          partialResults: true,
          popup: false
        });

        if (res?.matches?.length > 0) {
          setInput(res.matches[0]);
        }
        setIsListening(false);
        return;
      } catch (err) {
        console.warn('Native speech recognition failed:', err);
        setIsListening(false);
        const msg = err?.message || '';
        if (!msg.toLowerCase().includes('cancel')) {
          showToast('تعذر التعرف على الصوت، جرب التحدث مرة أخرى', 'warning');
        }
        return;
      }
    }

    // 2. Web Speech Recognition fallback for Safari / Chrome
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('🎙️ اتكلم دلوقتي وسامعك...', 'info');
      } catch (err) {
        setIsListening(false);
        showToast('تعذر تشغيل الميكروفون، حاول مرة أخرى', 'warning');
      }
      return;
    }

    showToast('خاصية التعرف على الصوت غير مدعومة في هذا المتصفح', 'warning');
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
    // Detect Arabic
    const isArabic = /[\u0600-\u06FF]/.test(text);
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCameraClick = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt // Gives native iOS action sheet: Take Photo or Choose from Photos
      });
      if (photo && photo.dataUrl) {
        setSelectedImage(photo.dataUrl);
        showToast('📸 تم اختيار الصورة بنجاح! اسألني عنها أو قولي حلها', 'success');
      }
    } catch (err) {
      const errMsg = err?.message?.toLowerCase() || '';
      if (errMsg.includes('cancelled') || errMsg.includes('canceled') || errMsg.includes('user cancelled')) {
        return;
      }
      // Fallback to file picker
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        showToast('تعذر فتح الكاميرا: ' + (err?.message || 'حاول ثانية'), 'error');
      }
    }
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('من فضلك اختر صورة صحيحة', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      showToast('📸 تم إرفاق الصورة! اسألني عنها أو قولي حلها', 'success');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      const res = await api.getChats();
      if (res.chats && res.chats.length > 0) {
        setMessages(res.chats);
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            content: "👋 Hello! I'm **Seif Ai Test**, your ultra-fast 24/7 AI Companion.\n\nTell me anything: ask questions, break down goals, or say **\"Remind me in 5 minutes to...\"** and I will set real alerts for you!"
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    const currentImg = selectedImage;
    if ((!text.trim() && !currentImg) || loading) return;

    // Ask notification permission on first interaction
    notifications.requestPermission().catch(() => {});

    const promptText = text.trim() || (currentImg ? 'من فضلك افحص هذه الصورة، وحل المسألة أو اشرح المكتوب فيها بالتفصيل وبشكل مبسط.' : '');

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: promptText,
      image: currentImg
    };

    setMessages((prev) => [...prev, userMsg]);
    api.saveChatMessage(userMsg);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.chat(promptText, history, model, currentImg);

      let cleanContent = res.reply;
      let appAction = null;

      // Detect & process OPEN_APP command
      const openAppMatch = res.reply.match(/\[OPEN_APP:\s*(.*?)\]/i);
      if (openAppMatch) {
        const requestedApp = openAppMatch[1].trim();
        cleanContent = cleanContent.replace(/\[OPEN_APP:.*?\]/i, '').trim();
        const appInfo = findAppByName(requestedApp);
        appAction = { type: 'open', target: requestedApp, info: appInfo };
        showToast(`Opening ${appInfo ? appInfo.name : requestedApp}... 🚀`, 'info');
        setTimeout(() => {
          openApp(requestedApp);
        }, 600);
      }

      // Detect & process CLOSE_APP command
      const closeAppMatch = res.reply.match(/\[CLOSE_APP:\s*(.*?)\]/i);
      if (closeAppMatch) {
        cleanContent = cleanContent.replace(/\[CLOSE_APP:.*?\]/i, '').trim();
        appAction = { type: 'close' };
        showToast('Closing application... 👋', 'info');
        setTimeout(() => {
          closeCurrentApp();
        }, 1200);
      }

      // Detect & process AI Reminders
      let reminderMatch = res.reply.match(/\[REMINDER:\s*(\d+)\s*\|\s*(.*?)\]/i);
      
      // Fallback: If AI confirmed reminder in Arabic or English text but missed the exact tag
      if (!reminderMatch) {
        const arabicMinuteMatch = text.match(/فكرني\s+(?:بعد|كمان)?\s*(\d+)\s*(?:دقيقة|دقايق|دقائق)/i);
        const englishMinuteMatch = text.match(/remind\s+(?:me)?\s+(?:in)?\s*(\d+)\s*(?:min|minute|minutes)/i);
        const matchedMinutes = arabicMinuteMatch?.[1] || englishMinuteMatch?.[1];
        if (matchedMinutes) {
          const delaySec = parseInt(matchedMinutes, 10) * 60;
          reminderMatch = ['fallback', String(delaySec), text];
        }
      }

      if (reminderMatch) {
        const delaySeconds = parseInt(reminderMatch[1], 10) || 60;
        const reminderText = reminderMatch[2].trim();
        cleanContent = cleanContent.replace(/\[REMINDER:.*?\]/i, '').trim();

        // Schedule guaranteed notification & task
        await notifications.scheduleReminder(reminderText, delaySeconds);
        await api.saveTask({
          title: `⏰ تذكير: ${reminderText}`,
          description: `تنبيه مجدول لوقت ${new Date(Date.now() + delaySeconds * 1000).toLocaleTimeString()}`,
          priority: 'high',
          completed: false
        });

        const mins = Math.max(1, Math.round(delaySeconds / 60));
        showToast(`⏰ تم ضبط التنبيه بعد ${mins} دقيقة بنجاح! 🔔`, 'success');
      }

      // If user is currently in another tab or app, send a notification alert!
      if (document.hidden) {
        const preview = cleanContent.length > 90 ? cleanContent.substring(0, 90) + '...' : cleanContent;
        notifications.sendNow('Seif Ai Test', preview);
      }

      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'model',
        content: cleanContent,
        model: res.model,
        appAction
      };

      setMessages((prev) => [...prev, aiMsg]);
      api.saveChatMessage(aiMsg);
    } catch (err) {
      const errorMsg = {
        id: 'err_' + Date.now(),
        role: 'model',
        content: `⚠️ **Notice:** ${err.message || 'Connecting to Gemini...'}\n\nPlease check your internet connection or verify your API key in Settings.`
      };
      setMessages((prev) => [...prev, errorMsg]);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear chat history?')) {
      try {
        await api.clearChats();
        setMessages([
          {
            id: 'welcome_reset',
            role: 'model',
            content: "Chat cleared! How can I help you next?"
          }
        ]);
        showToast('Chat history cleared', 'success');
      } catch (err) {
        showToast('Failed to clear chats', 'error');
      }
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (activeFriendChat) {
    return (
      <FriendChatRoom
        friend={activeFriendChat}
        onBack={() => {
          setActiveFriendChat(null);
          setChatsList(getAllChatsOverview());
        }}
        onStartCall={onStartCall}
        showToast={showToast}
      />
    );
  }

  const filteredChats = (chatsList || []).filter(c => 
    !searchQuery.trim() || c.friend.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AppIconBadge size={38} radius={12} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: '700', lineHeight: '1.2' }}>Seif Ai Test</h1>
              <span style={{ fontSize: '12px' }}>{theme.badge}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.onlineStatus}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LanguageToggle compact={true} showToast={showToast} />

          <button
            onClick={() => notifications.requestPermission().then(() => showToast('Notifications enabled! 🔔', 'success'))}
            title="Enable Notifications"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '10px',
              padding: '7px',
              cursor: 'pointer',
              color: '#38bdf8'
            }}
          >
            <Bell size={16} />
          </button>

          {chatMode === 'ai' && (
            <button
              onClick={handleClearHistory}
              title={t.clear}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '10px',
                padding: '7px',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Mode Switcher: Gemini AI vs All Chats */}
      <div style={{
        display: 'flex',
        padding: '4px',
        margin: '0 16px 8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => setChatMode('ai')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '12px',
            background: chatMode === 'ai' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
            color: chatMode === 'ai' ? '#fff' : '#94a3b8',
            border: 'none',
            fontWeight: '700',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={14} />
          <span>Gemini AI</span>
        </button>

        <button
          onClick={() => {
            setChatMode('friends');
            setChatsList(getAllChatsOverview());
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '12px',
            background: chatMode === 'friends' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
            color: chatMode === 'friends' ? '#fff' : '#94a3b8',
            border: 'none',
            fontWeight: '700',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Bot size={14} />
          <span>{lang === 'ar' ? 'المحادثات (Chats)' : 'All Chats'}</span>
          {chatsList.length > 0 && (
            <span style={{
              background: chatMode === 'friends' ? 'rgba(0,0,0,0.3)' : 'rgba(56, 189, 248, 0.2)',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '10px'
            }}>
              {chatsList.length}
            </span>
          )}
        </button>
      </div>

      {chatMode === 'friends' ? (
        /* ALL CHATS LIST VIEW */
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px calc(var(--safe-bottom) + 80px)' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث في المحادثات...' : 'Search chats...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94a3b8' }}>
              <p style={{ fontSize: '14px', marginBottom: '14px' }}>
                {lang === 'ar' ? 'لا توجد محادثات بعد!' : 'No chats yet!'}
              </p>
              <button
                onClick={() => onSwitchTab && onSwitchTab('friends')}
                className="ios-button-primary"
                style={{ padding: '10px 20px', fontSize: '13px', margin: '0 auto', gap: '6px' }}
              >
                <UserPlus size={16} />
                <span>{lang === 'ar' ? 'إضافة أصدقاء وبدء دردشة' : 'Add Friends & Start Chat'}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredChats.map((c) => (
                <div
                  key={c.friend}
                  onClick={() => setActiveFriendChat(c.friend)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
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
                      {(c.friend.substring(0, 2) || '?').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                        @{c.friend}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.isMe ? 'أنت: ' : ''}{c.lastMessage}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartCall) onStartCall(c.friend, 'voice');
                      }}
                      className="ios-button-secondary"
                      style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0, color: '#34d399' }}
                      title="مكالمة صوتية"
                    >
                      <Phone size={15} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartCall) onStartCall(c.friend, 'video');
                      }}
                      className="ios-button-secondary"
                      style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0, color: '#38bdf8' }}
                      title="مكالمة فيديو"
                    >
                      <Video size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GEMINI AI VIEW */
        <>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '8px',
                maxWidth: '100%'
              }}
            >
              {!isUser && (
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <AppIconBadge size={28} radius={9} showBorder={false} />
                </div>
              )}

              <div style={{ maxWidth: '82%', position: 'relative' }}>
                <div
                  className="selectable-text"
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: isUser ? theme.gradient : 'rgba(26, 30, 46, 0.85)',
                    color: '#ffffff',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isUser ? `0 4px 15px ${theme.glow}` : '0 2px 10px rgba(0, 0, 0, 0.2)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.image && (
                    <div style={{ marginBottom: '8px', borderRadius: '12px', overflow: 'hidden', maxWidth: '240px' }}>
                      <img src={msg.image} alt="User upload" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  )}

                  {msg.content}

                  {msg.appAction?.type === 'open' && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <button
                        onClick={() => openApp(msg.appAction.target)}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Open {msg.appAction.info ? msg.appAction.info.name : msg.appAction.target}</span>
                      </button>
                    </div>
                  )}

                  {msg.appAction?.type === 'close' && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <button
                        onClick={() => closeCurrentApp()}
                        style={{
                          background: 'rgba(239, 68, 68, 0.25)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Power size={13} />
                        <span>Close App (خروج)</span>
                      </button>
                    </div>
                  )}
                </div>

                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', paddingLeft: '4px' }}>
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId === msg.id ? '#10b981' : '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => speakText(msg.content)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isSpeaking ? '#38bdf8' : '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                      title="استمع للرد بالصوت"
                    >
                      <Volume2 size={13} />
                      <span>{isSpeaking ? 'Listening...' : 'نطق'}</span>
                    </button>

                    {msg.model && (
                      <span style={{ fontSize: '10px', color: '#64748b' }}>• ⚡ Fast AI</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '10px',
              background: 'rgba(129, 140, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} color={theme.primary} />
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '20px 20px 20px 4px',
              background: 'rgba(26, 30, 46, 0.85)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}>
              <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.primary, animation: 'pulse 1s infinite alternate' }}></span>
              <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s 0.2s infinite alternate' }}></span>
              <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc', animation: 'pulse 1s 0.4s infinite alternate' }}></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Selected Image Thumbnail Preview before sending */}
      {selectedImage && (
        <div style={{
          padding: '6px 16px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #38bdf8' }}>
            <img src={selectedImage} alt="Selected preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>
            📸 صورة مرفقة لحلها وشرحها بالذكاء الاصطناعي
          </div>
        </div>
      )}

      {/* Input Dock */}
      <div style={{
        padding: '8px 12px calc(var(--safe-bottom) + 64px) 12px',
        background: 'rgba(9, 10, 15, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Hidden File Input for Camera / Gallery */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImagePick}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '24px',
            padding: '4px 6px 4px 10px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Camera / Image Pick Button */}
          <button
            type="button"
            onClick={handleCameraClick}
            title="صور مسألة أو صفحة بالكاميرا"
            style={{
              background: selectedImage ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: selectedImage ? '#38bdf8' : '#94a3b8'
            }}
          >
            <CameraIcon size={18} />
          </button>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title="تحدث بالصوت"
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
              border: isListening ? '1px solid #ef4444' : 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isListening ? '#f87171' : '#94a3b8',
              animation: isListening ? 'pulse 1s infinite alternate' : 'none'
            }}
          >
            <Mic size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={isListening ? t.voiceListeningToast : t.chatInputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
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

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || loading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: (input.trim() || selectedImage) ? theme.gradient : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (input.trim() || selectedImage) ? 'pointer' : 'default',
              boxShadow: (input.trim() || selectedImage) ? `0 2px 10px ${theme.glow}` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Send size={15} color={(input.trim() || selectedImage) ? '#ffffff' : '#64748b'} />
          </button>
        </form>
      </div>
      </>
      )}
    </div>
  );
}
