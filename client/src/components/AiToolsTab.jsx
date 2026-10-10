import React, { useState } from 'react';
import { Sparkles, Wand2, FileText, CheckCircle, Languages, Copy, Check, MessageSquare, ArrowRight, Zap, Lightbulb } from 'lucide-react';
import { api } from '../api';
import LanguageToggle from './LanguageToggle';

const TOOL_MODES = [
  { id: 'summarize', name: 'Summarizer (تلخيص نصوص)', icon: '📝', prompt: 'Summarize the following text clearly in bullet points with the main takeaways:' },
  { id: 'translate', name: 'Translate (ترجمة فورية)', icon: '🌍', prompt: 'Translate this text accurately into natural Arabic and English with explanations:' },
  { id: 'study', name: 'Study Flashcards (أسئلة واختبار)', icon: '🎓', prompt: 'Turn the following content into high-yield study flashcards and quiz questions with answers:' },
  { id: 'fix', name: 'Proofread & Polish (تصحيح وتطوير)', icon: '✨', prompt: 'Fix grammar, enhance tone, and polish this text into clear, professional wording:' },
  { id: 'code', name: 'Code Explainer (شرح أكواد)', icon: '💻', prompt: 'Explain how this code works step-by-step, point out potential bugs, and suggest improvements:' }
];

export const AI_QUICK_ACTIONS = [
  { id: '1', title: 'Plan my day', icon: '☀️', prompt: 'Create an efficient schedule for my day focusing on peak energy hours.' },
  { id: '2', title: 'Study session', icon: '📚', prompt: 'Create a 45-minute focused study plan for my subjects.' },
  { id: '3', title: 'Motivate me', icon: '🔥', prompt: 'Give me a powerful, energetic motivational boost to get to work right now!' },
  { id: '4', title: '5 Quick Ideas', icon: '💡', prompt: 'Brainstorm 5 innovative and creative ideas for productivity.' }
];

export default function AiToolsTab({ showToast, onSendToChat }) {
  const [selectedTool, setSelectedTool] = useState(TOOL_MODES[0]);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setResult('');

    try {
      const fullPrompt = `${selectedTool.prompt}\n\nContent:\n${inputText.trim()}`;
      const res = await api.chat(fullPrompt, [], 'gemini-flash-lite-latest');
      setResult(res.reply);
      showToast('Generated successfully! ⚡', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to process', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    showToast('Copied to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      paddingBottom: 'calc(var(--safe-bottom) + 80px)',
      overflowY: 'auto'
    }}>
      {/* Header */}
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
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)'
          }}>
            <Wand2 size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
              AI Smart Tools
            </h1>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>أدوات ذكية للمذاكرة والتلخيص والترجمة</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle compact={true} showToast={showToast} />
          <span style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#c084fc',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            Gemini ⚡
          </span>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Tool Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          {TOOL_MODES.map((tool) => {
            const isSelected = selectedTool.id === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setSelectedTool(tool); setResult(''); }}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: isSelected ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#e9d5ff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            );
          })}
        </div>

        {/* Input Box */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{selectedTool.name}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Fast Processing</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter text here to ${selectedTool.id}... (أدخل النص هنا)...`}
            style={{
              width: '100%',
              minHeight: '110px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              outline: 'none',
              resize: 'vertical',
              marginBottom: '12px'
            }}
          />

          <button
            onClick={handleExecute}
            disabled={!inputText.trim() || loading}
            className="ios-button-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              opacity: (!inputText.trim() || loading) ? 0.6 : 1
            }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Processing with AI...' : 'Generate with Gemini ⚡'}</span>
          </button>
        </div>

        {/* Output Result */}
        {result && (
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(26, 32, 50, 0.75)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>AI Result</span>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: copied ? '#10b981' : '#94a3b8',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div
              className="selectable-text"
              style={{
                fontSize: '13px',
                color: '#e2e8f0',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {result}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

