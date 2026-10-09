import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Trash2, Copy, Check, Bot, Bell, Clock, Cpu } from 'lucide-react';
import { api } from '../api';
import { notifications } from '../notifications';
import { getActiveTheme } from '../themeIcons';
import AppIconBadge from './AppIconBadge';

const QUICK_PROMPTS = [
  '⏰ Remind me in 10 minutes to take a break',
  '☀️ Plan my morning schedule',
  '🎯 Prioritize my 3 top goals today',
  '💡 Brainstorm 5 productivity habits'
];

export default function ChatTab({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-flash-lite-latest');
  const [copiedId, setCopiedId] = useState(null);
  const [theme, setTheme] = useState(getActiveTheme());
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    notifications.init();

    const handleThemeChange = (e) => {
      if (e.detail) setTheme(e.detail);
    };
    window.addEventListener('seif-theme-changed', handleThemeChange);
    return () => window.removeEventListener('seif-theme-changed', handleThemeChange);
  }, []);

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
    if (!text.trim() || loading) return;

    // Ask notification permission on first interaction
    notifications.requestPermission().catch(() => {});

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    api.saveChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.chat(text.trim(), history, model);

      let cleanContent = res.reply;

      // Detect & process AI Reminders
      const reminderMatch = res.reply.match(/\[REMINDER:\s*(\d+)\s*\|\s*(.*?)\]/i);
      if (reminderMatch) {
        const delaySeconds = parseInt(reminderMatch[1], 10) || 60;
        const reminderText = reminderMatch[2].trim();
        cleanContent = res.reply.replace(/\[REMINDER:.*?\]/i, '').trim();

        // Schedule notification & task
        await notifications.scheduleReminder(reminderText, delaySeconds);
        await api.saveTask({
          title: `⏰ Reminder: ${reminderText}`,
          description: `Scheduled alert set for ${new Date(Date.now() + delaySeconds * 1000).toLocaleTimeString()}`,
          priority: 'high',
          completed: false
        });

        const mins = Math.max(1, Math.round(delaySeconds / 60));
        showToast(`⏰ Reminder set for ${mins} min from now!`, 'success');
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
        model: res.model
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
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Gemini Online 24/7 • Reminders Ready</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

          <button
            onClick={handleClearHistory}
            title="Clear Chat"
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
        </div>
      </header>

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
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '10px',
                  background: 'rgba(129, 140, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <Bot size={16} color={theme.primary} />
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
                  {msg.content}
                </div>

                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', paddingLeft: '4px' }}>
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

      {/* Quick Prompts Chips */}
      {messages.length <= 2 && (
        <div style={{
          padding: '0 16px 8px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              style={{
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Dock */}
      <div style={{
        padding: '8px 16px calc(var(--safe-bottom) + 64px) 16px',
        background: 'rgba(9, 10, 15, 0.92)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '24px',
            padding: '4px 6px 4px 16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <input
            type="text"
            placeholder="Ask Seif Ai Test or say 'Remind me in 5m to...'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: input.trim() ? theme.gradient : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
              boxShadow: input.trim() ? `0 2px 10px ${theme.glow}` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} color={input.trim() ? '#ffffff' : '#64748b'} />
          </button>
        </form>
      </div>
    </div>
  );
}
