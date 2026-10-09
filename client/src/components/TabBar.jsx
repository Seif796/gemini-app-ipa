import React from 'react';
import { MessageSquare, Wand2, FileText, CheckSquare, Settings } from 'lucide-react';

export default function TabBar({ currentTab, onSelectTab, unreadTasksCount = 0 }) {
  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'tools', label: 'AI Tools', icon: Wand2 },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: unreadTasksCount },
    { id: 'settings', label: 'Settings', icon: Settings },
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
            <div style={{ position: 'relative' }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  lineHeight: '12px'
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
