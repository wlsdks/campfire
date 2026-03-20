import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport matches the given media query.
 * Updates live on resize.
 *
 * Usage:
 *   const isTablet = useMediaQuery('(max-width: 1023px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    // Sync on mount in case SSR value diverged
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
