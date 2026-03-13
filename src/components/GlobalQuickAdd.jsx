// ─────────────────────────────────────────────────────────────────────────────
// GlobalQuickAdd.jsx
// Place in: src/components/GlobalQuickAdd.jsx
//
// Usage in Dashboard.jsx:
//   import GlobalQuickAdd from '../components/GlobalQuickAdd';
//   <GlobalQuickAdd token={token} apiUrl={API_URL} onTaskAdded={fetchTasks} />
//
// The component self-registers ⌘K / Ctrl+K globally — just mount it once.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'HIGH', color: '#ef4444', icon: '🔴' },
  { label: 'Medium', value: 'MEDIUM', color: '#f59e0b', icon: '🟡' },
  { label: 'Low', value: 'LOW', color: '#22c55e', icon: '🟢' },
];

const DATE_CHIPS = [
  {
    label: 'Today',
    getValue: () => new Date().toISOString().split('T')[0],
  },
  {
    label: 'Tomorrow',
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    },
  },
  {
    label: 'This Weekend',
    getValue: () => {
      const d = new Date();
      const day = d.getDay();
      d.setDate(d.getDate() + (6 - day));
      return d.toISOString().split('T')[0];
    },
  },
  {
    label: 'Next Week',
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    },
  },
];

// NLP-style parser: extracts priority + due date hints from free text
function parseNLP(text) {
  let title = text;
  let priority = null;
  let dueDate = null;

  // Priority detection
  if (/\b(urgent|critical|asap|high priority|!{2,})\b/i.test(text)) {
    priority = 'HIGH';
    title = title.replace(/\b(urgent|critical|asap|high priority|!{2,})\b/gi, '').trim();
  } else if (/\blow priority\b/i.test(text)) {
    priority = 'LOW';
    title = title.replace(/\blow priority\b/gi, '').trim();
  }

  // Date detection
  const today = new Date();
  if (/\btoday\b/i.test(text)) {
    dueDate = today.toISOString().split('T')[0];
    title = title.replace(/\btoday\b/gi, '').trim();
  } else if (/\btomorrow\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    dueDate = d.toISOString().split('T')[0];
    title = title.replace(/\btomorrow\b/gi, '').trim();
  } else if (/\bnext week\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    dueDate = d.toISOString().split('T')[0];
    title = title.replace(/\bnext week\b/gi, '').trim();
  } else if (/\bmonday\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    dueDate = d.toISOString().split('T')[0];
    title = title.replace(/\bmonday\b/gi, '').trim();
  } else if (/\bfriday\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7));
    dueDate = d.toISOString().split('T')[0];
    title = title.replace(/\bfriday\b/gi, '').trim();
  }

  // Clean up leftover punctuation
  title = title.replace(/\s{2,}/g, ' ').trim().replace(/^[,\s]+|[,\s]+$/g, '');

  return { title: title || text, priority, dueDate };
}

export default function GlobalQuickAdd({ token, apiUrl, onTaskAdded }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nlpHints, setNlpHints] = useState(null);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Register global hotkey
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSuccess(false);
    } else {
      // Reset form on close
      setTimeout(() => {
        setText('');
        setPriority(null);
        setDueDate('');
        setTags('');
        setNlpHints(null);
      }, 200);
    }
  }, [open]);

  // Live NLP parsing as user types
  useEffect(() => {
    if (text.length > 3) {
      const hints = parseNLP(text);
      if (hints.priority || hints.dueDate) {
        setNlpHints(hints);
      } else {
        setNlpHints(null);
      }
    } else {
      setNlpHints(null);
    }
  }, [text]);

  const applyNlpHints = () => {
    if (!nlpHints) return;
    if (nlpHints.priority) setPriority(nlpHints.priority);
    if (nlpHints.dueDate) setDueDate(nlpHints.dueDate);
    setText(nlpHints.title);
    setNlpHints(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);

    // Apply NLP hints automatically on submit
    const parsed = parseNLP(text);
    const finalPriority = priority || parsed.priority || 'MEDIUM';
    const finalDueDate = dueDate || parsed.dueDate || null;
    const finalTitle = parsed.title;

    try {
      const res = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: finalTitle,
          priority: finalPriority,
          dueDate: finalDueDate,
          tags: tags || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        onTaskAdded?.();
        setTimeout(() => {
          setOpen(false);
        }, 800);
      }
    } catch (err) {
      console.error('Quick add failed:', err);
    } finally {
      setLoading(false);
    }
  }, [text, priority, dueDate, tags, apiUrl, token, onTaskAdded]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) {
    return (
      <>
        {/* Floating trigger button */}
        <button
          onClick={() => setOpen(true)}
          title="Quick Add Task (⌘K)"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            borderRadius: 16,
            padding: '12px 20px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 32px rgba(79,70,229,0.45)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            fontSize: 14,
            fontWeight: 600,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.55)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,70,229,0.45)';
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span>
          <span>Quick Add</span>
          <kbd style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '2px 7px',
            fontSize: 11,
            letterSpacing: 0.5,
          }}>⌘K</kbd>
        </button>
        <style>{`
          @media (max-width: 768px) {
            /* On mobile, hide kbd hint */
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9998,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '16vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: 580,
          zIndex: 9999,
          animation: 'slideDown 0.18s ease',
        }}
      >
        <div style={{
          background: '#111827',
          borderRadius: 18,
          border: '1px solid #1f2937',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,70,229,0.15)',
          overflow: 'hidden',
        }}>

          {/* Success state */}
          {success && (
            <div style={{
              padding: '28px',
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <div style={{ color: '#34d399', fontSize: 18, fontWeight: 600 }}>Task added!</div>
            </div>
          )}

          {!success && (
            <>
              {/* Main input row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid #1f2937',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>✏️</span>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Add task... try "call John tomorrow high priority"'
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#f1f5f9',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    caretColor: '#6366f1',
                  }}
                />
                <kbd style={{
                  flexShrink: 0,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#6b7280',
                  fontSize: 11,
                }}>ESC</kbd>
              </div>

              {/* NLP hint banner */}
              {nlpHints && (nlpHints.priority || nlpHints.dueDate) && (
                <div style={{
                  background: '#1a1f35',
                  borderBottom: '1px solid #1f2937',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animation: 'fadeIn 0.15s ease',
                }}>
                  <span style={{ fontSize: 13, color: '#6366f1' }}>🤖 Detected:</span>
                  {nlpHints.priority && (
                    <span style={{
                      background: nlpHints.priority === 'HIGH' ? '#7f1d1d' : '#14532d',
                      color: nlpHints.priority === 'HIGH' ? '#fca5a5' : '#86efac',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 12,
                    }}>{nlpHints.priority} priority</span>
                  )}
                  {nlpHints.dueDate && (
                    <span style={{
                      background: '#1e3a5f',
                      color: '#93c5fd',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 12,
                    }}>📅 {nlpHints.dueDate}</span>
                  )}
                  <button
                    onClick={applyNlpHints}
                    style={{
                      marginLeft: 'auto',
                      background: '#312e81',
                      border: '1px solid #4f46e5',
                      color: '#a5b4fc',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >Apply ↵</button>
                </div>
              )}

              {/* Options row */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #1f2937' }}>

                {/* Priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#4b5563', width: 56, flexShrink: 0 }}>PRIORITY</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {PRIORITY_OPTIONS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(priority === p.value ? null : p.value)}
                        style={{
                          background: priority === p.value ? `${p.color}22` : '#1f2937',
                          border: `1px solid ${priority === p.value ? p.color : '#374151'}`,
                          color: priority === p.value ? p.color : '#6b7280',
                          borderRadius: 8,
                          padding: '4px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due date chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#4b5563', width: 56, flexShrink: 0 }}>DUE</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DATE_CHIPS.map(chip => {
                      const val = chip.getValue();
                      const isSelected = dueDate === val;
                      return (
                        <button
                          key={chip.label}
                          onClick={() => setDueDate(isSelected ? '' : val)}
                          style={{
                            background: isSelected ? '#312e81' : '#1f2937',
                            border: `1px solid ${isSelected ? '#6366f1' : '#374151'}`,
                            color: isSelected ? '#a5b4fc' : '#6b7280',
                            borderRadius: 8,
                            padding: '4px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >{chip.label}</button>
                      );
                    })}
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      style={{
                        background: '#1f2937',
                        border: '1px solid #374151',
                        color: '#9ca3af',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 12,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#4b5563', width: 56, flexShrink: 0 }}>TAGS</span>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="work, personal, urgent"
                    style={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: '4px 12px',
                      color: '#e5e7eb',
                      fontSize: 12,
                      outline: 'none',
                      width: 200,
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 12, color: '#374151' }}>
                  <kbd style={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 4,
                    padding: '1px 6px',
                    color: '#6b7280',
                    fontSize: 11,
                  }}>Enter</kbd>
                  {' '}to save
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      color: '#6b7280',
                      borderRadius: 10,
                      padding: '8px 16px',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >Cancel</button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                    style={{
                      background: loading ? '#312e81' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      border: 'none',
                      color: 'white',
                      borderRadius: 10,
                      padding: '8px 20px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: text.trim() ? 'pointer' : 'not-allowed',
                      opacity: text.trim() ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          width: 12, height: 12,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.6s linear infinite',
                        }} />
                        Adding...
                      </>
                    ) : '＋ Add Task'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}