import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Wand2, FileText, Settings } from 'lucide-react';
import { getAppLanguage, getTranslation } from '../i18n';

export default function TabBar({ currentTab, onSelectTab, unreadTasksCount = 0, pendingFriendsCount = 0 }) {
  const [lang, setLang] = useState(getAppLanguage());
  const t = getTranslation(lang);

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail || getAppLanguage());
    window.addEventListener('seif-language-changed', handleLang);
    return () => window.removeEventListener('seif-language-changed', handleLang);
  }, []);

  const tabs = [
    { id: 'chat', label: t.tabChat, icon: MessageSquare },
    { id: 'friends', label: t.tabFriends, icon: Users, badge: pendingFriendsCount },
    { id: 'tools', label: t.tabTools, icon: Wand2 },
    { id: 'notes', label: t.tabNotes, icon: FileText },
    { id: 'settings', label: t.tabSettings, icon: Settings },
  ];

  return (
    <nav className="ios-tab-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`tab-item ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <div style={{
              position: 'relative',
              transform: isActive ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <Icon size={23} strokeWidth={isActive ? 2.5 : 2} />
              {tab.badge > 0 && (
                <span className="animate-badge-bounce" style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  lineHeight: '12px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{
              fontWeight: isActive ? '700' : '500',
              transition: 'color 0.2s ease'
            }}>{tab.label}</span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: '1px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
