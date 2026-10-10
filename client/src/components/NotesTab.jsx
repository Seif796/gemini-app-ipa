import React, { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, Trash2, Edit3, Check, ArrowRight, Zap, ListChecks } from 'lucide-react';
import { api } from '../api';
import LanguageToggle from './LanguageToggle';

export default function NotesTab({ showToast, onTaskAdded }) {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await api.getNotes();
      setNotes(res.notes || []);
    } catch (err) {
      showToast('Failed to load notes', 'error');
    }
  };

  const handleCreateNew = () => {
    setEditingNote({
      id: '',
      title: '',
      content: '',
      tags: [],
      aiSummary: ''
    });
  };

  const handleSaveNote = async () => {
    if (!editingNote.title.trim() && !editingNote.content.trim()) {
      setEditingNote(null);
      return;
    }
    try {
      const res = await api.saveNote(editingNote);
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.id === res.note.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = res.note;
          return updated;
        }
        return [res.note, ...prev];
      });
      setEditingNote(null);
      showToast('Note saved', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save note', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (confirm('Delete this note?')) {
      try {
        await api.deleteNote(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (editingNote?.id === id) setEditingNote(null);
        showToast('Note deleted', 'success');
      } catch (err) {
        showToast('Failed to delete', 'error');
      }
    }
  };

  const handleAiEnhance = async (mode) => {
    if (!editingNote?.content?.trim()) {
      showToast('Please type some notes first', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.enhanceNote(editingNote.content, mode);
      if (mode === 'summarize') {
        setEditingNote((prev) => ({ ...prev, aiSummary: res.enhanced }));
        showToast('AI summary generated!', 'success');
      } else if (mode === 'actions') {
        // Automatically create a task from this note
        await api.saveTask({
          title: `Action from Note: ${editingNote.title || 'Untitled'}`,
          description: res.enhanced,
          priority: 'high'
        });
        showToast('Extracted & saved to Tasks list! 🚀', 'success');
        if (onTaskAdded) onTaskAdded();
      } else {
        setEditingNote((prev) => ({ ...prev, content: res.enhanced }));
        showToast(`Note enhanced with ${mode}!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'AI enhance failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredNotes = notes.filter((n) =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass-header" style={{
        padding: 'calc(var(--safe-top) + 12px) 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Smart Notes</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>{notes.length} notes with AI Intelligence</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle compact={true} showToast={showToast} />
          <button
            onClick={handleCreateNew}
            className="ios-button-primary"
            style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* Search Input */}
      <div style={{ padding: '12px 16px 6px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ios-input"
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Notes List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <Edit3 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: '500' }}>No notes yet</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Tap "New Note" to jot down thoughts and let Gemini organize them.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setEditingNote(note)}
              className="glass-panel"
              style={{
                padding: '16px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                  {note.title || 'Untitled Note'}
                </h3>
                <button
                  onClick={(e) => handleDelete(note.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {note.aiSummary && (
                <div style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  margin: '6px 0 10px',
                  fontSize: '12px',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}>
                  <Sparkles size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{note.aiSummary}</span>
                </div>
              )}

              <p style={{
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {note.content || 'No content...'}
              </p>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Edit <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Editor Modal Sheet */}
      {editingNote && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#13151f',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 16px calc(var(--safe-bottom) + 20px) 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button
                onClick={() => setEditingNote(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>
                {editingNote.id ? 'Edit Note' : 'New Note'}
              </span>
              <button
                onClick={handleSaveNote}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>

            {/* AI Assistant Toolbar */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '14px',
              padding: '8px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={14} color="#818cf8" />
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#cbd5e1' }}>Gemini AI Tools:</span>
                {aiLoading && <span style={{ fontSize: '11px', color: '#38bdf8' }}>Processing...</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                <button
                  disabled={aiLoading}
                  onClick={() => handleAiEnhance('summarize')}
                  className="ios-button-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '10px' }}
                >
                  <Zap size={12} color="#fbbf24" />
                  <span>Summarize</span>
                </button>
                <button
                  disabled={aiLoading}
                  onClick={() => handleAiEnhance('bullets')}
                  className="ios-button-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '10px' }}
                >
                  <ListChecks size={12} color="#38bdf8" />
                  <span>Bullet Points</span>
                </button>
                <button
                  disabled={aiLoading}
                  onClick={() => handleAiEnhance('actions')}
                  className="ios-button-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '10px' }}
                >
                  <Sparkles size={12} color="#ec4899" />
                  <span>Extract Tasks</span>
                </button>
                <button
                  disabled={aiLoading}
                  onClick={() => handleAiEnhance('polish')}
                  className="ios-button-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '10px' }}
                >
                  <Edit3 size={12} color="#10b981" />
                  <span>Polish Tone</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '700',
                outline: 'none',
                marginBottom: '10px'
              }}
            />

            <textarea
              placeholder="Start writing or paste notes..."
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={12}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '15px',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                flex: 1
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
