import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Trash2, Copy, Check, Bot, User, Cpu } from 'lucide-react';
import { api } from '../api';

const QUICK_PROMPTS = [
  '☀️ Plan my morning schedule',
  '🎯 Help me prioritize 3 goals today',
  '📝 Draft a polite professional email',
  '💡 Brainstorm 5 productivity habits'
];

export default function ChatTab({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
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
        // Default welcoming message
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            content: "👋 Hello! I'm **Aether**, your 24/7 Personal AI Productivity Companion powered by Google Gemini.\n\nHow can I help you today? You can ask me to organize your day, break down challenging tasks, summarize notes, or brainstorm solutions."
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

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history excluding errors & welcome
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.chat(text.trim(), history, model);

      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'model',
        content: res.reply,
        model: res.model
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: 'err_' + Date.now(),
        role: 'model',
        content: `⚠️ **Error:** ${err.message || 'Failed to connect to Gemini API.'}\n\n*Tip: Check that your Gemini API key is configured in the Settings tab!*`
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
            content: "Chat cleared! What would you like to work on next?"
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
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '700', lineHeight: '1.2' }}>Aether AI</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Gemini Online 24/7</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Model selector pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '4px 8px',
            borderRadius: '10px',
            fontSize: '11px',
            color: '#cbd5e1'
          }}>
            <Cpu size={12} color="#38bdf8" />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="gemini-3.8-flash" style={{ background: '#13151f' }}>3.8 Flash</option>
              <option value="gemini-3.8-flash-lite" style={{ background: '#13151f' }}>3.8 Flash Lite</option>
            </select>
          </div>

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
                  <Bot size={16} color="#818cf8" />
                </div>
              )}

              <div style={{
                maxWidth: '82%',
                position: 'relative',
                group: 'message-bubble'
              }}>
                <div
                  className="selectable-text"
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                      : 'rgba(26, 30, 46, 0.85)',
                    color: '#ffffff',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isUser
                      ? '0 4px 15px rgba(79, 70, 229, 0.25)'
                      : '0 2px 10px rgba(0, 0, 0, 0.2)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.content}
                </div>

                {!isUser && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    paddingLeft: '4px'
                  }}>
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
                      <span style={{ fontSize: '10px', color: '#64748b' }}>• {msg.model}</span>
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
              <Bot size={16} color="#818cf8" />
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '20px 20px 20px 4px',
              background: 'rgba(26, 30, 46, 0.85)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}>
              <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulse 1s infinite alternate' }}></span>
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
        background: 'rgba(9, 10, 15, 0.9)',
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
            placeholder="Ask Aether anything..."
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: input.trim() ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
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
