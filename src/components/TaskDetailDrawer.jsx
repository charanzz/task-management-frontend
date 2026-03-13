// ─────────────────────────────────────────────────────────────────────────────
// TaskDetailDrawer.jsx
// Place in: src/components/TaskDetailDrawer.jsx
//
// Usage in Dashboard.jsx:
//   import TaskDetailDrawer from '../components/TaskDetailDrawer';
//
//   const [drawerTask, setDrawerTask] = useState(null);
//
//   // On task click: setDrawerTask(task)
//   // In render:
//   <TaskDetailDrawer
//     task={drawerTask}
//     onClose={() => setDrawerTask(null)}
//     onUpdated={fetchTasks}
//     token={token}
//     apiUrl={API_URL}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#ef4444', bg: '#450a0a', label: 'High',   icon: '🔴' },
  MEDIUM: { color: '#f59e0b', bg: '#451a03', label: 'Medium', icon: '🟡' },
  LOW:    { color: '#22c55e', bg: '#052e16', label: 'Low',    icon: '🟢' },
  NORMAL: { color: '#6b7280', bg: '#1f2937', label: 'Normal', icon: '⚪' },
};

const REMINDER_PRESETS = [
  { label: '5 min before',  offset: -5 },
  { label: '30 min before', offset: -30 },
  { label: '1 hr before',   offset: -60 },
  { label: '1 day before',  offset: -1440 },
  { label: '1 week before', offset: -10080 },
];

// ─── Tab component ─────────────────────────────────────────────────────────
function Tab({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${active ? '#6366f1' : 'transparent'}`,
        color: active ? '#e2e8f0' : '#6b7280',
        padding: '10px 16px',
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'inherit',
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          background: '#312e81',
          color: '#a5b4fc',
          borderRadius: 10,
          padding: '1px 6px',
          fontSize: 10,
          fontWeight: 700,
        }}>{badge}</span>
      )}
    </button>
  );
}

export default function TaskDetailDrawer({ task, onClose, onUpdated, token, apiUrl }) {
  const [tab, setTab] = useState('details');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [reminders, setReminders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiBreaking, setAiBreaking] = useState(false);
  const notesRef = useRef(null);

  // Populate fields when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setNotes(task.description || '');
    setPriority(task.priority || 'MEDIUM');
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTags(task.tags || '');
    setTab('details');
    loadSubtasks();
    loadComments();
    loadReminders();
  }, [task?.id]);

  const loadSubtasks = async () => {
    if (!task?.id) return;
    try {
      const r = await fetch(`${apiUrl}/api/tasks/${task.id}/subtasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setSubtasks(await r.json());
    } catch {}
  };

  const loadComments = async () => {
    if (!task?.id) return;
    try {
      const r = await fetch(`${apiUrl}/api/tasks/${task.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setComments(await r.json());
    } catch {}
  };

  const loadReminders = async () => {
    if (!task?.id) return;
    try {
      const r = await fetch(`${apiUrl}/api/reminders?taskId=${task.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setReminders(await r.json());
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: notes,
          priority,
          dueDate: dueDate || null,
          tags,
        }),
      });
      setSaved(true);
      onUpdated?.();
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const handleComplete = async () => {
    await fetch(`${apiUrl}/api/tasks/${task.id}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    onUpdated?.();
    onClose();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const r = await fetch(`${apiUrl}/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newSubtask }),
      });
      if (r.ok) {
        setNewSubtask('');
        loadSubtasks();
      } else {
        // Optimistic if endpoint not ready
        setSubtasks(p => [...p, { id: Date.now(), title: newSubtask, completed: false }]);
        setNewSubtask('');
      }
    } catch {}
  };

  const toggleSubtask = async (sub) => {
    setSubtasks(p => p.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s));
    try {
      await fetch(`${apiUrl}/api/tasks/${sub.id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const r = await fetch(`${apiUrl}/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (r.ok) {
        setNewComment('');
        loadComments();
      }
    } catch {}
  };

  const addReminder = async (offsetMinutes) => {
    // Check not already added
    if (reminders.some(r => r.offsetMinutes === offsetMinutes)) return;
    try {
      await fetch(`${apiUrl}/api/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: task.id, offsetMinutes }),
      });
      loadReminders();
    } catch {
      // Optimistic fallback
      setReminders(p => [...p, { id: Date.now(), offsetMinutes, sent: false }]);
    }
  };

  const removeReminder = async (rid) => {
    setReminders(p => p.filter(r => r.id !== rid));
    try {
      await fetch(`${apiUrl}/api/reminders/${rid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  // AI Breakdown — calls backend which calls Claude
  const handleAIBreakdown = async () => {
    setAiBreaking(true);
    try {
      const r = await fetch(`${apiUrl}/api/ai/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: task.id, title }),
      });
      if (r.ok) {
        const data = await r.json();
        const steps = Array.isArray(data.subtasks) ? data.subtasks : data;
        // Add each step as a subtask
        for (const step of steps) {
          await fetch(`${apiUrl}/api/tasks/${task.id}/subtasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title: step }),
          });
        }
        loadSubtasks();
        setTab('subtasks');
      }
    } catch {}
    setAiBreaking(false);
  };

  if (!task) return null;

  const pc = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
  const completedSubtasks = subtasks.filter(s => s.completed).length;

  const offsetLabel = (offset) => {
    if (offset === -5) return '5 min before';
    if (offset === -30) return '30 min before';
    if (offset === -60) return '1 hour before';
    if (offset === -1440) return '1 day before';
    if (offset === -10080) return '1 week before';
    return `${Math.abs(offset)} min before`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 800,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        right: 0, top: 0, bottom: 0,
        width: '100%',
        maxWidth: 500,
        background: '#0d1117',
        zIndex: 801,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #1f2937',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
        animation: 'slideInRight 0.2s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 0',
          borderBottom: '1px solid #1f2937',
          background: `linear-gradient(180deg, ${pc.bg}60 0%, transparent 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            {/* Priority dot */}
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: pc.color, flexShrink: 0, marginTop: 6,
              boxShadow: `0 0 8px ${pc.color}60`,
            }} />

            {/* Title */}
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                background: 'none', border: 'none', outline: 'none',
                color: '#f1f5f9', fontSize: 18, fontWeight: 600,
                lineHeight: 1.4, resize: 'none', fontFamily: 'inherit',
                caretColor: '#6366f1',
              }}
            />

            {/* Close */}
            <button onClick={onClose} style={{
              background: '#1f2937', border: 'none',
              borderRadius: 8, width: 32, height: 32,
              color: '#6b7280', cursor: 'pointer', fontSize: 16,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {/* Priority selector */}
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{
                background: pc.bg, border: `1px solid ${pc.color}50`,
                color: pc.color, borderRadius: 8, padding: '4px 10px',
                fontSize: 12, outline: 'none', cursor: 'pointer',
              }}
            >
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>

            {/* Due date */}
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                background: '#1f2937', border: '1px solid #374151',
                color: dueDate ? '#93c5fd' : '#6b7280',
                borderRadius: 8, padding: '4px 10px',
                fontSize: 12, outline: 'none', cursor: 'pointer',
              }}
            />

            {/* Tags */}
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="🏷️ tags"
              style={{
                background: '#1f2937', border: '1px solid #374151',
                color: '#e5e7eb', borderRadius: 8, padding: '4px 10px',
                fontSize: 12, outline: 'none', width: 120,
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', marginBottom: -1 }}>
            <Tab label="Details"   active={tab === 'details'}   onClick={() => setTab('details')} />
            <Tab label="Subtasks"  active={tab === 'subtasks'}  onClick={() => setTab('subtasks')}  badge={subtasks.length} />
            <Tab label="Comments"  active={tab === 'comments'}  onClick={() => setTab('comments')}  badge={comments.length} />
            <Tab label="Reminders" active={tab === 'reminders'} onClick={() => setTab('reminders')} badge={reminders.length} />
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* DETAILS */}
          {tab === 'details' && (
            <div>
              <label style={{ fontSize: 11, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase' }}>
                Notes
              </label>
              <textarea
                ref={notesRef}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes, links, context, meeting details..."
                rows={8}
                style={{
                  width: '100%', marginTop: 8,
                  background: '#161b27', border: '1px solid #1f2937',
                  borderRadius: 10, padding: 14,
                  color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
                  resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#374151'}
                onBlur={e => e.target.style.borderColor = '#1f2937'}
              />

              {/* Task status info */}
              <div style={{
                marginTop: 20, padding: 16,
                background: '#161b27', borderRadius: 10, border: '1px solid #1f2937',
              }}>
                <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Task Info
                </div>
                {[
                  { label: 'Status', value: task.completed ? '✅ Completed' : '🔄 In Progress' },
                  { label: 'Created', value: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—' },
                  { label: 'Subtasks', value: `${completedSubtasks}/${subtasks.length} done` },
                  { label: 'Recurring', value: task.recurrenceType || 'None' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #1f2937',
                  }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{row.label}</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTASKS */}
          {tab === 'subtasks' && (
            <div>
              {/* AI Breakdown button */}
              <button
                onClick={handleAIBreakdown}
                disabled={aiBreaking}
                style={{
                  width: '100%', marginBottom: 16,
                  background: aiBreaking ? '#1f2937' : 'linear-gradient(135deg, #312e81, #1e1b4b)',
                  border: '1px solid #4f46e5',
                  color: aiBreaking ? '#6b7280' : '#a5b4fc',
                  borderRadius: 10, padding: 12,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {aiBreaking ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: '2px solid #374151', borderTopColor: '#6366f1',
                      borderRadius: '50%', display: 'inline-block',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    Breaking down task...
                  </>
                ) : '🤖 AI: Break This Task Into Steps'}
              </button>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Progress</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {completedSubtasks}/{subtasks.length}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Subtask list */}
              <div style={{ marginBottom: 16 }}>
                {subtasks.map(sub => (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                    background: '#161b27', border: '1px solid #1f2937',
                    transition: 'opacity 0.2s',
                    opacity: sub.completed ? 0.5 : 1,
                  }}>
                    <input
                      type="checkbox"
                      checked={!!sub.completed}
                      onChange={() => toggleSubtask(sub)}
                      style={{ accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{
                      flex: 1, fontSize: 14, color: sub.completed ? '#4b5563' : '#94a3b8',
                      textDecoration: sub.completed ? 'line-through' : 'none',
                    }}>{sub.title}</span>
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '32px 20px',
                    color: '#374151', fontSize: 13,
                  }}>
                    No subtasks yet. Use AI breakdown or add manually below.
                  </div>
                )}
              </div>

              {/* Add subtask */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubtask()}
                  placeholder="Add a subtask..."
                  style={{
                    flex: 1, background: '#161b27', border: '1px solid #1f2937',
                    borderRadius: 10, padding: '10px 14px',
                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  onClick={addSubtask}
                  style={{
                    background: '#312e81', border: '1px solid #4f46e5',
                    color: '#a5b4fc', borderRadius: 10, padding: '10px 16px',
                    cursor: 'pointer', fontSize: 18, fontWeight: 700,
                  }}
                >+</button>
              </div>
            </div>
          )}

          {/* COMMENTS */}
          {tab === 'comments' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {comments.map((c, i) => (
                  <div key={c.id || i} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: '#161b27', border: '1px solid #1f2937',
                    marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                        {c.authorName || 'You'}
                      </span>
                      <span style={{ fontSize: 11, color: '#374151' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                      {c.content}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#374151', fontSize: 13 }}>
                    No comments yet.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  style={{
                    flex: 1, background: '#161b27', border: '1px solid #1f2937',
                    borderRadius: 10, padding: '10px 14px', color: '#e2e8f0',
                    fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={addComment}
                  style={{
                    background: '#312e81', border: '1px solid #4f46e5',
                    color: '#a5b4fc', borderRadius: 10, padding: '10px 16px',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  }}
                >Post</button>
              </div>
            </div>
          )}

          {/* REMINDERS */}
          {tab === 'reminders' && (
            <div>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
                Add multiple reminders — each sends an email at the specified time before the due date.
              </p>

              {/* Active reminders */}
              {reminders.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Active Reminders
                  </div>
                  {reminders.map(r => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#161b27', border: '1px solid #1f2937',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 16 }}>⏰</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#a5b4fc' }}>
                        {offsetLabel(r.offsetMinutes)}
                      </span>
                      {r.sent && (
                        <span style={{ fontSize: 11, color: '#22c55e' }}>✓ Sent</span>
                      )}
                      <button
                        onClick={() => removeReminder(r.id)}
                        style={{
                          background: 'none', border: 'none', color: '#ef4444',
                          cursor: 'pointer', fontSize: 16, padding: '0 4px',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preset chips */}
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                Add Reminder
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REMINDER_PRESETS.map(p => {
                  const alreadyAdded = reminders.some(r => r.offsetMinutes === p.offset);
                  return (
                    <button
                      key={p.offset}
                      onClick={() => addReminder(p.offset)}
                      disabled={alreadyAdded}
                      style={{
                        background: alreadyAdded ? '#1f2937' : '#161b27',
                        border: `1px solid ${alreadyAdded ? '#374151' : '#1f2937'}`,
                        color: alreadyAdded ? '#374151' : '#94a3b8',
                        borderRadius: 8, padding: '8px 14px',
                        fontSize: 12, cursor: alreadyAdded ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!alreadyAdded) {
                          e.currentTarget.style.borderColor = '#6366f1';
                          e.currentTarget.style.color = '#a5b4fc';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!alreadyAdded) {
                          e.currentTarget.style.borderColor = '#1f2937';
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      {alreadyAdded ? '✓ ' : '+ '}{p.label}
                    </button>
                  );
                })}
              </div>

              {!dueDate && (
                <div style={{
                  marginTop: 16, padding: '12px 14px',
                  background: '#451a03', border: '1px solid #7c2d12',
                  borderRadius: 10, fontSize: 13, color: '#fca5a5',
                }}>
                  ⚠️ Set a due date first — reminders are sent relative to the due date.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #1f2937',
          display: 'flex', gap: 10,
          background: '#0d1117',
        }}>
          <button
            onClick={handleComplete}
            disabled={task.completed}
            style={{
              background: task.completed ? '#1f2937' : '#052e16',
              border: `1px solid ${task.completed ? '#374151' : '#166534'}`,
              color: task.completed ? '#374151' : '#86efac',
              borderRadius: 10, padding: '10px 16px',
              fontSize: 13, cursor: task.completed ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {task.completed ? '✅ Done' : '✓ Mark Complete'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              background: saved
                ? 'linear-gradient(135deg, #052e16, #064e3b)'
                : 'linear-gradient(135deg, #312e81, #1e1b4b)',
              border: `1px solid ${saved ? '#166534' : '#4f46e5'}`,
              color: saved ? '#86efac' : '#a5b4fc',
              borderRadius: 10, padding: 11,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}