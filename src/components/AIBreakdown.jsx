// ─────────────────────────────────────────────────────────────────────────────
// AIBreakdown.jsx
// Place in: src/components/AIBreakdown.jsx
//
// A standalone modal triggered by "🤖 Break It Down" button on task cards.
//
// Usage in Dashboard.jsx task list:
//   import AIBreakdown from '../components/AIBreakdown';
//   const [breakdownTask, setBreakdownTask] = useState(null);
//
//   // On task card, add button:
//   <button onClick={e => { e.stopPropagation(); setBreakdownTask(task); }}>
//     🤖 Break it down
//   </button>
//
//   // In render:
//   <AIBreakdown
//     task={breakdownTask}
//     onClose={() => setBreakdownTask(null)}
//     onSubtasksAdded={fetchTasks}
//     token={token}
//     apiUrl={API_URL}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export default function AIBreakdown({ task, onClose, onSubtasksAdded, token, apiUrl }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (task) {
      setSteps([]);
      setAdded(false);
      setError(null);
      setSelected(new Set());
      fetchBreakdown();
    }
  }, [task?.id]);

  const fetchBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/ai/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: task.id, title: task.title }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data.subtasks)
        ? data.subtasks
        : Array.isArray(data)
          ? data
          : [];

      setSteps(list.filter(Boolean));
      // Select all by default
      setSelected(new Set(list.map((_, i) => i)));
    } catch (err) {
      setError('Could not connect to AI. Please try again.');
      console.error('[AIBreakdown]', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(steps.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const handleAddSubtasks = async () => {
    const toAdd = steps.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;

    setAdding(true);
    try {
      // Add each selected step as a subtask
      await Promise.all(
        toAdd.map(stepTitle =>
          fetch(`${apiUrl}/api/tasks/${task.id}/subtasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title: stepTitle }),
          })
        )
      );
      setAdded(true);
      onSubtasksAdded?.();
      setTimeout(onClose, 1400);
    } catch (err) {
      setError('Failed to save subtasks. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  if (!task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 900,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '92%', maxWidth: 560,
        zIndex: 901,
        animation: 'popIn 0.2s ease',
      }}>
        <div style={{
          background: '#0d1117',
          borderRadius: 20,
          border: '1px solid #1f2937',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '24px 24px 20px',
            background: 'linear-gradient(135deg, #1e1b4b40, transparent)',
            borderBottom: '1px solid #1f2937',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #312e81, #1e1b4b)',
                border: '1px solid #4f46e5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>🤖</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: 17, fontWeight: 600 }}>
                  AI Task Breakdown
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.4 }}>
                  "{task.title}"
                </p>
              </div>
              <button onClick={onClose} style={{
                background: '#1f2937', border: 'none', color: '#6b7280',
                borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>×</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 24px' }}>

            {/* Loading state */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 16px',
                  border: '3px solid #1f2937', borderTopColor: '#6366f1',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ color: '#94a3b8', fontSize: 14 }}>
                  Claude is analyzing your task...
                </div>
                <div style={{ color: '#374151', fontSize: 12, marginTop: 6 }}>
                  Breaking down into actionable steps
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div style={{
                padding: '20px', background: '#450a0a',
                border: '1px solid #7f1d1d', borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ color: '#fca5a5', fontSize: 14, marginBottom: 16 }}>{error}</div>
                <button
                  onClick={fetchBreakdown}
                  style={{
                    background: '#7f1d1d', border: '1px solid #ef4444',
                    color: '#fca5a5', borderRadius: 8, padding: '8px 20px',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >Try Again</button>
              </div>
            )}

            {/* Success state */}
            {added && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <div style={{ color: '#86efac', fontSize: 18, fontWeight: 600 }}>
                  {selected.size} subtask{selected.size > 1 ? 's' : ''} added!
                </div>
              </div>
            )}

            {/* Steps list */}
            {!loading && !error && !added && steps.length > 0 && (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 14,
                }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    Select steps to add as subtasks
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={selectAll} style={{
                      background: 'none', border: 'none', color: '#6366f1',
                      cursor: 'pointer', fontSize: 12, padding: 0,
                    }}>Select all</button>
                    <span style={{ color: '#374151' }}>·</span>
                    <button onClick={selectNone} style={{
                      background: 'none', border: 'none', color: '#6b7280',
                      cursor: 'pointer', fontSize: 12, padding: 0,
                    }}>None</button>
                  </div>
                </div>

                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {steps.map((step, i) => {
                    const isSelected = selected.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => toggleStep(i)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '12px 14px', borderRadius: 10,
                          background: isSelected ? '#1e1b4b40' : '#161b27',
                          border: `1px solid ${isSelected ? '#4f46e5' : '#1f2937'}`,
                          marginBottom: 8, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#374151';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#1f2937';
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `2px solid ${isSelected ? '#6366f1' : '#374151'}`,
                          background: isSelected ? '#4f46e5' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', marginTop: 1,
                        }}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: 11, color: '#4f46e5', fontWeight: 600,
                            marginRight: 8,
                          }}>{i + 1}.</span>
                          <span style={{ fontSize: 14, color: isSelected ? '#e2e8f0' : '#94a3b8' }}>
                            {step}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && !added && steps.length > 0 && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #1f2937',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ flex: 1, fontSize: 12, color: '#374151' }}>
                {selected.size} of {steps.length} selected
              </span>
              <button onClick={onClose} style={{
                background: '#1f2937', border: '1px solid #374151',
                color: '#6b7280', borderRadius: 10, padding: '10px 16px',
                fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={handleAddSubtasks}
                disabled={adding || selected.size === 0}
                style={{
                  background: selected.size > 0
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : '#1f2937',
                  border: 'none', color: 'white',
                  borderRadius: 10, padding: '10px 20px',
                  fontSize: 13, fontWeight: 600,
                  cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                  opacity: selected.size > 0 ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {adding ? (
                  <>
                    <span style={{
                      width: 12, height: 12,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%', display: 'inline-block',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    Adding...
                  </>
                ) : `✅ Add ${selected.size} Subtask${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {!loading && !error && !added && steps.length > 0 && (
            <div style={{
              padding: '8px 24px 16px',
              display: 'flex', justifyContent: 'center',
            }}>
              <button onClick={fetchBreakdown} style={{
                background: 'none', border: 'none',
                color: '#374151', fontSize: 12, cursor: 'pointer',
                textDecoration: 'underline',
              }}>
                🔄 Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -52%) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// BACKEND — AIController.java
// Place in: src/main/java/com/taskmanager/controller/AIController.java
//
// This adds POST /api/ai/breakdown which your existing AIService already supports.
// ─────────────────────────────────────────────────────────────────────────────

/*
package com.taskmanager.controller;

import com.taskmanager.service.AIService;
import com.taskmanager.entity.User;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private AIService aiService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/breakdown")
    public ResponseEntity<?> breakdownTask(
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal UserDetails userDetails) {

        String title = (String) req.get("title");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "title is required"));
        }

        String prompt =
            "You are a productivity expert. Break this task into 6-8 specific, " +
            "actionable subtasks. Each subtask should be completable in under 2 hours. " +
            "Return ONLY a valid JSON array of strings — no markdown, no explanation, " +
            "no code fences. Just the raw JSON array.\n\n" +
            "Task: " + title;

        try {
            String raw = aiService.callClaudeRaw(prompt);

            // Parse JSON array from response
            List<String> subtasks = parseJsonArray(raw);
            return ResponseEntity.ok(Map.of("subtasks", subtasks));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "AI breakdown failed: " + e.getMessage()));
        }
    }

    @PostMapping("/smart-schedule")
    public ResponseEntity<?> smartSchedule(
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal UserDetails userDetails) {

        String taskTitle = (String) req.get("title");
        String taskPriority = (String) req.getOrDefault("priority", "MEDIUM");
        Object analyticsData = req.get("analytics"); // pass from frontend

        String prompt =
            "You are a smart scheduling assistant. Given this task and productivity data, " +
            "suggest the optimal time slot to work on it.\n\n" +
            "Task: " + taskTitle + "\n" +
            "Priority: " + taskPriority + "\n" +
            "Analytics: " + (analyticsData != null ? analyticsData.toString() : "none") + "\n\n" +
            "Return ONLY a JSON object: {\"suggestion\": \"Tuesday 10-11am\", \"reason\": \"your peak focus window\"}";

        try {
            String raw = aiService.callClaudeRaw(prompt);
            return ResponseEntity.ok(Map.of("result", raw));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Smart scheduling failed"));
        }
    }

    // ─── Helper: parse JSON array from Claude's response ─────────────────
    private List<String> parseJsonArray(String raw) {
        List<String> result = new ArrayList<>();
        if (raw == null || raw.isBlank()) return result;

        // Strip markdown code fences if present
        String cleaned = raw.trim()
            .replaceAll("^```json\\s*", "")
            .replaceAll("^```\\s*", "")
            .replaceAll("```$", "")
            .trim();

        // Find JSON array
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start == -1 || end == -1) {
            // Fallback: split by newlines if no JSON array found
            for (String line : cleaned.split("\\n")) {
                String l = line.trim().replaceAll("^[-*\\d.]+\\s*", "").trim();
                if (!l.isEmpty()) result.add(l);
            }
            return result;
        }

        String arrayStr = cleaned.substring(start, end + 1);

        // Extract quoted strings from array
        Pattern p = Pattern.compile("\"((?:[^\"\\\\]|\\\\.)*)\"");
        Matcher m = p.matcher(arrayStr);
        while (m.find()) {
            String item = m.group(1).replace("\\\"", "\"").replace("\\\\", "\\").trim();
            if (!item.isEmpty()) result.add(item);
        }

        return result;
    }
}
*/