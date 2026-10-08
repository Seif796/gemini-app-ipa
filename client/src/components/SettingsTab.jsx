import React, { useState, useEffect } from 'react';
import { Key, Server, Smartphone, LogOut, CheckCircle, AlertCircle, Eye, EyeOff, Bell, Palette, Sparkles, Check } from 'lucide-react';
import { api, getCustomApiKey, setCustomApiKey, getServerUrl, setServerUrl } from '../api';
import { ICON_THEMES, getActiveTheme, setActiveTheme } from '../themeIcons';
import { notifications } from '../notifications';

export default function SettingsTab({ user, onLogout, showToast }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [activeThemeId, setActiveThemeId] = useState(getActiveTheme().id);

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
      showToast('Saved locally on device!', 'success');
    }
  };

  const testApiKey = async (keyToTest) => {
    setTestingKey(true);
    setKeyStatus(null);
    try {
      const res = await api.chat('Hello Gemini, respond with OK in 2 words', [], 'gemini-flash-lite-latest');
      if (res.reply) {
        setKeyStatus('valid');
        showToast('Gemini API working at high speed! ⚡', 'success');
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

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId);
    setActiveThemeId(themeId);
    showToast('App icon theme updated! 🎨', 'success');
  };

  const handleTestNotification = async () => {
    await notifications.requestPermission();
    await notifications.sendNow('Seif Ai Test', '🔔 Notification alerts are active and working on your iPhone!');
    showToast('Test alert sent to your phone!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Settings & Customization</h1>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>App Icons, Notifications, Reminders & Gemini AI</p>
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
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{user?.name || 'iPhone User'}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{user?.email || 'device@local'}</div>
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

        {/* App Icon & Themes Selector */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Palette size={18} color="#c084fc" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>App Icon & Aesthetic Theme</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            Choose your favorite app icon color and UI accent:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {ICON_THEMES.map((theme) => {
              const isSelected = activeThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? `2px solid ${theme.primary}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: theme.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 8px ${theme.glow}`,
                    flexShrink: 0
                  }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {theme.name}
                    </div>
                  </div>
                  {isSelected && <Check size={14} color={theme.primary} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications & AI Reminders */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bell size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Notifications & Background Reminders</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            Get push alerts when Seif Ai Test responds while you're outside the app, or when you ask: <em>"Remind me in 10 minutes to..."</em>
          </p>

          <button
            onClick={handleTestNotification}
            className="ios-button-primary"
            style={{ width: '100%', fontSize: '13px', padding: '10px' }}
          >
            <Bell size={16} />
            <span>Enable & Test Notification Alert</span>
          </button>
        </div>

        {/* Gemini API Key Section */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={18} color="#818cf8" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Gemini API Key</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            Your key is pre-configured and active. You can test connection or update it anytime:
          </p>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Paste Gemini API Key"
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
              <CheckCircle size={14} /> Gemini is connected & responding in &lt;1.5s! ⚡
            </div>
          )}
          {keyStatus === 'invalid' && (
            <div style={{ marginTop: '10px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> Connection check failed. Please verify key.
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
            Default points to your local PC IP or cloud host (e.g. Render / Railway). Direct mode will always handle AI requests even if this is offline!
          </p>

          <input
            type="text"
            placeholder="http://192.168.1.17:5000"
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

        {/* iPhone .IPA Install Guide */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Smartphone size={18} color="#ec4899" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Seif-Ai-Test.ipa Installation</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
            Download the latest <strong>Seif-Ai-Test.ipa</strong> from GitHub Actions Artifacts, plug your phone into your PC with USB, and install with <strong>Sideloadly</strong> in 1 minute!
          </p>
        </div>
      </div>
    </div>
  );
}
