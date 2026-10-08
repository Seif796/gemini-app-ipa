import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Sparkles, Trash2, Calendar, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function TasksTab({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [breakingDownId, setBreakingDownId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await api.saveTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority,
        completed: false,
        subtasks: []
      });
      setTasks([res.task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowAddModal(false);
      showToast('Task added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add task', 'error');
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      await api.saveTask(updated);
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const toggleSubtask = async (task, subIndex) => {
    try {
      const newSubtasks = [...(task.subtasks || [])];
      newSubtasks[subIndex] = {
        ...newSubtasks[subIndex],
        completed: !newSubtasks[subIndex].completed
      };
      const updated = { ...task, subtasks: newSubtasks };
      await api.saveTask(updated);
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      showToast('Failed to update subtask', 'error');
    }
  };

  const handleAiBreakdown = async (task) => {
    setBreakingDownId(task.id);
    try {
      const res = await api.breakdownTask(task.title, task.description);
      const subtasks = (res.subtasks || []).map((s) => ({
        title: s.title,
        completed: false
      }));

      const updated = {
        ...task,
        subtasks,
        proTip: res.proTip,
        estimatedTimeMinutes: res.estimatedTimeMinutes
      };

      await api.saveTask(updated);
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      setExpandedTasks((prev) => ({ ...prev, [task.id]: true }));
      showToast('Task broken down with Gemini AI! ⚡', 'success');
    } catch (err) {
      showToast(err.message || 'AI breakdown failed', 'error');
    } finally {
      setBreakingDownId(null);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete task?')) {
      try {
        await api.deleteTask(id);
        setTasks(tasks.filter((t) => t.id !== id));
        showToast('Task deleted', 'success');
      } catch (err) {
        showToast('Failed to delete task', 'error');
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

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
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Tasks & Focus</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            {completedCount}/{tasks.length} Completed ({progressPercent}%)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="ios-button-primary"
          style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </header>

      {/* Progress Bar & Filter Tabs */}
      <div style={{ padding: '12px 16px 6px' }}>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: filter === f ? '#38bdf8' : '#94a3b8',
                border: filter === f ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 16px calc(var(--safe-bottom) + 80px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <CheckSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: '500' }}>No tasks found</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Add a task or use Gemini chat to generate action plans.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTasks[task.id] || false;
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const subCompleted = (task.subtasks || []).filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                className="glass-panel"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: task.completed ? 0.65 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <button
                    onClick={() => toggleTaskCompletion(task)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: task.completed ? '#10b981' : '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                      marginTop: '2px'
                    }}
                  >
                    {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#fff',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-line' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {/* Priority Tag */}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background:
                          task.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                          task.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color:
                          task.priority === 'high' ? '#f87171' :
                          task.priority === 'medium' ? '#fbbf24' : '#34d399'
                      }}>
                        {task.priority || 'Normal'}
                      </span>

                      {/* AI Breakdown Button */}
                      {!task.completed && (
                        <button
                          disabled={breakingDownId === task.id}
                          onClick={() => handleAiBreakdown(task)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#c084fc',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Sparkles size={11} />
                          <span>{breakingDownId === task.id ? 'Thinking...' : 'AI Breakdown'}</span>
                        </button>
                      )}

                      {/* Subtask count toggle */}
                      {hasSubtasks && (
                        <button
                          onClick={() => setExpandedTasks({ ...expandedTasks, [task.id]: !isExpanded })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span>{subCompleted}/{task.subtasks.length} Subtasks</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Subtasks Checklist Accordion */}
                {hasSubtasks && isExpanded && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {task.proTip && (
                      <div style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '4px', fontStyle: 'italic' }}>
                        💡 Tip: {task.proTip}
                      </div>
                    )}
                    {task.subtasks.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        onClick={() => toggleSubtask(task, sIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: sub.completed ? '#64748b' : '#e2e8f0',
                          textDecoration: sub.completed ? 'line-through' : 'none'
                        }}
                      >
                        {sub.completed ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} color="#64748b" />}
                        <span>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: '#13151f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add New Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                required
                placeholder="What do you want to accomplish?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="ios-input"
              />
              <textarea
                placeholder="Details or notes (optional)"
                rows={3}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="ios-input"
                style={{ resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {['low', 'medium', 'high'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: newTaskPriority === p ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: newTaskPriority === p ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: newTaskPriority === p ? '#818cf8' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="ios-button-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="ios-button-primary" style={{ flex: 1 }}>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
