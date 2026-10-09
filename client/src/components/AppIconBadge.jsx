import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Crown, Shield, Flame, Moon } from 'lucide-react';
import { getActiveTheme, getCustomIconImage } from '../themeIcons';

export default function AppIconBadge({ size = 38, radius = 13, showBorder = true }) {
  const [theme, setTheme] = useState(getActiveTheme());
  const [customImg, setCustomImg] = useState(getCustomIconImage());

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

  if (displayImg) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        overflow: 'hidden',
        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.4)`,
        border: showBorder ? '1.5px solid rgba(255, 255, 255, 0.2)' : 'none',
        flexShrink: 0,
        background: '#13151f'
      }}>
        <img
          src={displayImg}
          alt="App Icon"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${radius}px`,
      background: theme.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 15px ${theme.glow}`,
      border: showBorder ? '1.5px solid rgba(255, 255, 255, 0.15)' : 'none',
      transition: 'all 0.3s ease',
      flexShrink: 0
    }}>
      {renderSymbol()}
    </div>
  );
}

