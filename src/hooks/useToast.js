import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Shared toast state hook.
 * Returns { toast, showToast } — toast is the current message string (or null),
 * showToast(msg) displays it for 2 seconds with auto-dismiss.
 *
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('저장되었습니다');
 *   // Render <Toast message={toast} /> from components/ui/Toast
 */
export function useToast(duration = 2000) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const showToast = useCallback((message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(message);
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}
