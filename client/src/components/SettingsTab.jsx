import React, { useState, useEffect } from 'react';
import { Key, Server, Smartphone, LogOut, CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink, Download, Globe, Shield } from 'lucide-react';
import { api, getCustomApiKey, setCustomApiKey, getServerUrl, setServerUrl, setToken } from '../api';

export default function SettingsTab({ user, onLogout, showToast }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // 'valid' | 'invalid'
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    setApiKeyInput(getCustomApiKey() || '');
    setServerUrlInput(getServerUrl());
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      setServerStatus('checking');
      await api.checkHealth();
      setServerStatus('online');
    } catch (err) {
      setServerStatus('offline');
    }
  };

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    setCustomApiKey(trimmed);
    try {
      await api.updateSettings({ geminiApiKey: trimmed });
      showToast('Gemini API key saved!', 'success');
      testApiKey(trimmed);
    } catch (err) {
      showToast('Saved locally, but failed to sync to server account.', 'warning');
    }
  };

  const testApiKey = async (keyToTest) => {
    const key = keyToTest !== undefined ? keyToTest : apiKeyInput.trim();
    if (!key && !user?.hasServerApiKey) {
      showToast('Please enter an API key first', 'error');
      return;
    }
    setTestingKey(true);
    setKeyStatus(null);
    try {
      const res = await api.chat('Hello Gemini, respond with OK if working', [], 'gemini-2.0-flash');
      if (res.reply) {
        setKeyStatus('valid');
        showToast('Gemini API connection verified! 🚀', 'success');
      }
    } catch (err) {
      setKeyStatus('invalid');
      showToast(err.message || 'Key validation failed', 'error');
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveServerUrl = () => {
    setServerUrl(serverUrlInput.trim());
    showToast('Server URL updated', 'success');
    checkServerHealth();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Settings & iPhone Setup</h1>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Configuration, 24/7 Hosting & .IPA Generator</p>
      </header>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* User Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="ios-button-secondary"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px' }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Gemini API Key Section */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={18} color="#818cf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Gemini API Key</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            Configure your personal Google Gemini API key. Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'underline' }}
            >
              Google AI Studio
            </a>.
          </p>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Paste AIzaSy... key here"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="ios-input"
              style={{ paddingRight: '40px', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveApiKey}
              className="ios-button-primary"
              style={{ flex: 1, padding: '10px', fontSize: '13px' }}
            >
              Save Key
            </button>
            <button
              disabled={testingKey}
              onClick={() => testApiKey()}
              className="ios-button-secondary"
              style={{ padding: '10px 14px', fontSize: '13px' }}
            >
              {testingKey ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {keyStatus === 'valid' && (
            <div style={{ marginTop: '10px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Gemini API key is valid and working!
            </div>
          )}
          {keyStatus === 'invalid' && (
            <div style={{ marginTop: '10px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> Failed to authenticate with this key.
            </div>
          )}
        </div>

        {/* 24/7 Online Server Host Configuration */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>24/7 Cloud Backend Server</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: serverStatus === 'online' ? '#10b981' : serverStatus === 'checking' ? '#fbbf24' : '#ef4444'
              }} />
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{serverStatus}</span>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
            To keep your companion online 24/7 for mobile users without keeping your PC on, deploy the included <code>server/</code> to Render or Railway (100% free).
          </p>

          <input
            type="text"
            placeholder="http://localhost:5000 or https://your-server.onrender.com"
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            className="ios-input"
            style={{ fontSize: '13px', marginBottom: '8px' }}
          />

          <button
            onClick={handleSaveServerUrl}
            className="ios-button-secondary"
            style={{ width: '100%', fontSize: '13px', padding: '8px' }}
          >
            Update Server Endpoint
          </button>
        </div>

        {/* iPhone Deployment (.IPA & 1-Tap PWA Install) */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Smartphone size={18} color="#ec4899" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>How to Install on iPhone</h3>
          </div>

          {/* Option 1: 1-Tap Safari Install */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>
              📲 Method 1: Instant 1-Tap Install (Safari)
            </div>
            <ol style={{ fontSize: '12px', color: '#cbd5e1', paddingLeft: '18px', lineHeight: '1.6' }}>
              <li>Open this web address in <strong>Safari</strong> on your iPhone.</li>
              <li>Tap the <strong>Share button</strong> (square with arrow up at bottom).</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
              <li>It instantly launches as a standalone fullscreen iOS app!</li>
            </ol>
          </div>

          {/* Option 2: Automated .IPA via GitHub Actions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#c084fc', marginBottom: '4px' }}>
              📦 Method 2: Download Native .IPA Package
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              The included GitHub Actions workflow builds a signed/sideloadable <code>Aether-AI.ipa</code> on Apple macOS cloud runners:
            </p>
            <ol style={{ fontSize: '12px', color: '#cbd5e1', paddingLeft: '18px', lineHeight: '1.6' }}>
              <li>Push this project to your GitHub repository.</li>
              <li>Go to the <strong>Actions</strong> tab on GitHub.</li>
              <li>Select <strong>"Build iOS .IPA"</strong> and click <strong>Run workflow</strong>.</li>
              <li>Download the compiled <code>Aether-AI.ipa</code> from GitHub Artifacts!</li>
              <li>Install via <strong>AltStore</strong>, <strong>SideStore</strong>, <strong>Scarlet</strong>, or <strong>Sideloadly</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
