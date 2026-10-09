import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { api, setGuestMode } from '../api';
import AppIconBadge from './AppIconBadge';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Auto fallback to guest mode if server is not reachable
      handleGuestLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
    onAuthSuccess({
      id: 'iphone_user',
      name: 'iPhone User',
      email: 'device@local'
    });
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
        maxWidth: '380px',
        background: 'rgba(20, 23, 34, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        padding: '28px 22px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
        textAlign: 'center'
      }}>
        {/* App Icon Glow */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <AppIconBadge size={60} radius={18} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: '#fff' }}>
          Seif Ai Test
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
          Your 24/7 Personal AI Productivity Companion
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
            textAlign: 'left'
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
              placeholder="Password"
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
            {loading ? 'Please wait...' : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* ⚡ Instant iPhone Enter Button */}
        <div style={{ marginTop: '12px' }}>
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
            <span>⚡ Enter App Directly (الدخول المباشر)</span>
          </button>
        </div>

        <div style={{ marginTop: '16px' }}>
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
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
