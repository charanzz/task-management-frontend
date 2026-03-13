// FILE 3 OF 3 — src/hooks/useOffline.js
// Place in: src/hooks/useOffline.js
//
// Usage in Dashboard.jsx:
//   import { useOffline } from '../hooks/useOffline';
//   const { isOnline, pendingCount } = useOffline(token, API_URL, fetchTasks);
//
// Then render the <OfflineBanner> exported below.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { flushQueue, getQueue } from '../utils/offlineQueue';

export function useOffline(token, apiUrl, onFlushed) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [flushing, setFlushing] = useState(false);
  const [justFlushed, setJustFlushed] = useState(0);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getQueue().length);
  }, []);

  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    const queue = getQueue();
    if (queue.length > 0 && token) {
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

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Check for pending ops on mount (e.g. opened while offline then came back)
  useEffect(() => {
    refreshPendingCount();
    if (navigator.onLine && getQueue().length > 0 && token) {
      handleOnline();
    }
  }, [token]);

  return { isOnline, pendingCount, flushing, justFlushed, refreshPendingCount };
}

/**
 * Banner component — paste once in Dashboard.jsx return, near the top level.
 *
 * Usage:
 *   import { OfflineBanner } from '../hooks/useOffline';
 *   const offlineState = useOffline(token, API_URL, fetchTasks);
 *   ...
 *   <OfflineBanner {...offlineState} />
 */
export function OfflineBanner({ isOnline, pendingCount, flushing, justFlushed }) {
  if (isOnline && !flushing && justFlushed === 0) return null;

  const style = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9990,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 13,
    fontWeight: 500,
    transition: 'background 0.3s',
  };

  if (justFlushed > 0) {
    return (
      <div style={{ ...style, background: '#052e16', color: '#86efac' }}>
        ✅ Back online — {justFlushed} task{justFlushed > 1 ? 's' : ''} synced successfully
      </div>
    );
  }

  if (flushing) {
    return (
      <div style={{ ...style, background: '#1e3a5f', color: '#93c5fd' }}>
        <span style={{
          width: 14, height: 14,
          border: '2px solid #1d4ed8', borderTopColor: '#93c5fd',
          borderRadius: '50%', display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
        }} />
        Syncing {pendingCount} pending task{pendingCount > 1 ? 's' : ''}...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div style={{ ...style, background: '#451a03', color: '#fed7aa' }}>
        📡 Offline — your changes are saved locally and will sync when reconnected
        {pendingCount > 0 && (
          <span style={{
            background: '#7c2d12', borderRadius: 6,
            padding: '2px 8px', fontSize: 12, marginLeft: 4,
          }}>
            {pendingCount} pending
          </span>
        )}
      </div>
    );
  }

  return null;
}