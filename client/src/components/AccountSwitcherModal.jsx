import React from 'react';
import { User, Plus, Check, Trash2, X, Shield, ArrowRight } from 'lucide-react';
import { getSavedAccounts, switchAccount, removeSavedAccount, getCurrentUsername } from '../friendsApi';
import { getAppLanguage } from '../i18n';

export default function AccountSwitcherModal({ isOpen, onClose, onAddNew, showToast }) {
  if (!isOpen) return null;

  const current = getCurrentUsername();
  const accounts = getSavedAccounts();
  const lang = getAppLanguage();

  const handleSelect = (username) => {
    if (username === current) {
      onClose();
      return;
    }
    switchAccount(username);
    if (showToast) {
      showToast(lang === 'ar' ? `تم التبديل إلى الحساب @${username}!` : `Switched to @${username}!`, 'success');
    }
    onClose();
  };

  const handleRemove = (e, username) => {
    e.stopPropagation();
    if (accounts.length <= 1) {
      if (showToast) showToast(lang === 'ar' ? 'لا يمكن حذف الحساب الوحيد' : 'Cannot remove only account', 'error');
      return;
    }
    removeSavedAccount(username);
    if (showToast) {
      showToast(lang === 'ar' ? `تمت إزالة @${username}` : `Removed @${username}`, 'info');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#0d111c',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        padding: '24px 20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              {lang === 'ar' ? 'تبديل الحسابات' : 'Switch Accounts'}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {lang === 'ar' ? 'اختر حساباً للتبديل إليه فوراً أو أنشئ حساباً جديداً' : 'Select an account to switch or add another'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Accounts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', marginBottom: '16px' }}>
          {accounts.map((acc) => {
            const isMe = acc.username === current;
            return (
              <div
                key={acc.username}
                onClick={() => handleSelect(acc.username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: isMe ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isMe ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: isMe ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '14px'
                  }}>
                    {(acc.username.substring(0, 2) || '?').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                      @{acc.username}
                    </div>
                    <div style={{ fontSize: '11px', color: isMe ? '#38bdf8' : '#94a3b8' }}>
                      {isMe ? (lang === 'ar' ? 'الحساب النشط حالياً' : 'Active Account') : (lang === 'ar' ? 'حساب محفوظ' : 'Saved Account')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMe ? (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleRemove(e, acc.username)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        padding: '6px',
                        cursor: 'pointer'
                      }}
                      title="إزالة الحساب"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Account Button */}
        <button
          onClick={() => {
            onClose();
            onAddNew();
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
          }}
        >
          <Plus size={18} />
          <span>{lang === 'ar' ? 'إنشاء حساب آخر أو تسجيل دخول 🔑' : 'Add Another Account 🔑'}</span>
        </button>
      </div>
    </div>
  );
}

