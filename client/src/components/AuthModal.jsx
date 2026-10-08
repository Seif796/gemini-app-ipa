import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Settings, Server, Zap } from 'lucide-react';
import { api, getServerUrl, setServerUrl, setGuestMode } from '../api';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Server URL configuration toggle
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await api.signup(name, email, password);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      if (err.message === 'SERVER_UNREACHABLE') {
        setError("Cannot reach backend server. Make sure 'npm run dev' is running on your PC, check the Server URL below, or tap 'Continue as Guest' to enter immediately!");
        setShowServerConfig(true);
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
    onAuthSuccess({
      id: 'guest_user',
      name: 'iPhone User',
      email: 'device@local'
    });
  };

  const handleSaveServerUrl = () => {
    setServerUrl(serverUrlInput.trim());
    setError('');
    alert('Server URL saved: ' + serverUrlInput.trim());
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(5, 6, 10, 0.92)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(20, 23, 34, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        padding: '28px 22px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
        textAlign: 'center'
      }}>
        {/* App Icon Glow */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
        }}>
          <Sparkles size={28} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: '#fff' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
          {isLogin
            ? 'Sign in to sync your 24/7 AI Companion'
            : 'Join to organize notes & tasks with Gemini AI'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: '#f87171',
            fontSize: '12px',
            textAlign: 'left',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                placeholder="Full Name"
                className="ios-input"
                style={{ paddingLeft: '42px', height: '44px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              required
              placeholder="Email address"
              className="ios-input"
              style={{ paddingLeft: '42px', height: '44px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 chars)"
              className="ios-input"
              style={{ paddingLeft: '42px', height: '44px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ios-button-primary"
            style={{ width: '100%', height: '46px', fontSize: '14px' }}
          >
            {loading ? 'Connecting...' : (
              <>
                <span>{isLogin ? 'Sign In' : 'Get Started'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Instant Bypass */}
        <div style={{ marginTop: '14px' }}>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="ios-button-secondary"
            style={{
              width: '100%',
              height: '42px',
              fontSize: '13px',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              background: 'rgba(56, 189, 248, 0.08)'
            }}
          >
            <Zap size={14} color="#38bdf8" />
            <span>⚡ Continue as Guest (Use on iPhone Now)</span>
          </button>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {isLogin ? "No account? Sign Up" : "Have account? Sign In"}
          </button>

          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Server size={12} />
            <span>Server Settings</span>
          </button>
        </div>

        {/* Expandable Server Config Panel */}
        {showServerConfig && (
          <div style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '14px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              Backend URL (Use your PC's Wi-Fi IP or Cloud URL):
            </div>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="http://192.168.1.17:5000"
              className="ios-input"
              style={{ height: '36px', fontSize: '12px', marginBottom: '8px' }}
            />
            <button
              type="button"
              onClick={handleSaveServerUrl}
              className="ios-button-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '12px' }}
            >
              Save Server URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
