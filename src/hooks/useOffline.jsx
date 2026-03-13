// src/hooks/useOffline.jsx
// Self-contained — no external imports needed.
// Drop this single file in src/hooks/useOffline.jsx and you're done.

import { useState, useEffect, useCallback } from 'react';

// ── Inline offline queue (localStorage-backed) ────────────────────────────
const QUEUE_KEY = 'tf_offline_queue';

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export function enqueueOfflineOp(op) {
  const q = getQueue();
  q.push({ ...op, id: Date.now(), ts: new Date().toISOString() });
  saveQueue(q);
}

async function flushQueue(token, apiUrl) {
  const q = getQueue();
  if (!q.length) return { flushed: 0 };
  let flushed = 0;
  const remaining = [];
  for (const op of q) {
    try {
      await fetch(`${apiUrl}${op.url}`, {
        method: op.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      flushed++;
    } catch {
      remaining.push(op);
    }
  }
  saveQueue(remaining);
  return { flushed };
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useOffline(token, apiUrl, onFlushed) {
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [flushing, setFlushing]         = useState(false);
  const [justFlushed, setJustFlushed]   = useState(0);

  const refreshCount = useCallback(() => setPendingCount(getQueue().length), []);

  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    const q = getQueue();
    if (q.length > 0 && token) {
      setFlushing(true);
      const { flushed } = await flushQueue(token, apiUrl);
      if (flushed > 0) {
        setJustFlushed(flushed);
        onFlushed?.();
        setTimeout(() => setJustFlushed(0), 4000);
      }
      setPendingCount(getQueue().length);
      setFlushing(false);
    }
  }, [token, apiUrl, onFlushed]);

  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  useEffect(() => {
    refreshCount();
    if (navigator.onLine && getQueue().length > 0 && token) handleOnline();
  }, [token]);

  return { isOnline, pendingCount, flushing, justFlushed, refreshCount };
}

// ── Banner component ───────────────────────────────────────────────────────
export function OfflineBanner({ isOnline, pendingCount, flushing, justFlushed }) {
  if (isOnline && !flushing && justFlushed === 0) return null;

  const base = {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9990,
    padding: '12px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10, fontSize: 13, fontWeight: 500,
  };

  if (justFlushed > 0) return (
    <div style={{ ...base, background: '#052e16', color: '#86efac' }}>
      Back online — {justFlushed} task{justFlushed > 1 ? 's' : ''} synced
    </div>
  );

  if (flushing) return (
    <div style={{ ...base, background: '#1e3a5f', color: '#93c5fd' }}>
      <span style={{ width:14, height:14, border:'2px solid #1d4ed8', borderTopColor:'#93c5fd', borderRadius:'50%', display:'inline-block', animation:'spin .6s linear infinite' }} />
      Syncing {pendingCount} pending task{pendingCount > 1 ? 's' : ''}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isOnline) return (
    <div style={{ ...base, background: '#451a03', color: '#fed7aa' }}>
      Offline — changes saved locally, will sync when reconnected
      {pendingCount > 0 && (
        <span style={{ background:'#7c2d12', borderRadius:6, padding:'2px 8px', fontSize:12, marginLeft:4 }}>
          {pendingCount} pending
        </span>
      )}
    </div>
  );

  return null;
}