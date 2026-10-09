import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Crown, Shield, Flame, Moon } from 'lucide-react';
import { getActiveTheme, getCustomIconImage } from '../themeIcons';
import { logoSound } from '../logoAudio';

export default function AppIconBadge({ size = 38, radius = 13, showBorder = true, clickable = true }) {
  const [theme, setTheme] = useState(getActiveTheme());
  const [customImg, setCustomImg] = useState(getCustomIconImage());
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleTheme = (e) => setTheme(e.detail || getActiveTheme());
    const handleImg = (e) => setCustomImg(e.detail);

    window.addEventListener('seif-theme-changed', handleTheme);
    window.addEventListener('seif-icon-image-changed', handleImg);
    return () => {
      window.removeEventListener('seif-theme-changed', handleTheme);
      window.removeEventListener('seif-icon-image-changed', handleImg);
    };
  }, []);

  const handleClick = (e) => {
    if (!clickable) return;
    e.stopPropagation();
    setIsPressed(true);
    logoSound.playLogoSound();
    setTimeout(() => setIsPressed(false), 300);
  };

  const iconProps = { size: Math.round(size * 0.52), color: '#ffffff' };

  const renderSymbol = () => {
    switch (theme.symbol) {
      case 'zap': return <Zap {...iconProps} />;
      case 'crown': return <Crown {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'flame': return <Flame {...iconProps} />;
      case 'moon': return <Moon {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  const displayImg = customImg || '/app-icon.png';

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${radius}px`,
    overflow: 'hidden',
    boxShadow: isPressed
      ? '0 0 25px rgba(56, 189, 248, 0.9), 0 0 35px rgba(99, 102, 241, 0.6)'
      : '0 4px 15px rgba(0, 0, 0, 0.4)',
    border: showBorder
      ? (isPressed ? '2px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.2)')
      : 'none',
    flexShrink: 0,
    background: '#13151f',
    transform: isPressed ? 'scale(1.18) rotate(4deg)' : 'scale(1) rotate(0deg)',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: clickable ? 'pointer' : 'default',
    userSelect: 'none'
  };

  if (displayImg) {
    return (
      <div
        onClick={handleClick}
        title={clickable ? 'اضغط لسماع صوت الشعار المميز ✨' : undefined}
        style={containerStyle}
      >
        <img
          src={displayImg}
          alt="App Icon"
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      title={clickable ? 'اضغط لسماع صوت الشعار المميز ✨' : undefined}
      style={{
        ...containerStyle,
        background: theme.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPressed
          ? `0 0 25px ${theme.glow}`
          : `0 4px 15px ${theme.glow}`
      }}
    >
      {renderSymbol()}
    </div>
  );
}
