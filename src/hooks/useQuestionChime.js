import { useEffect, useRef } from 'react';
import { playChime } from '@/lib/chime';

/**
 * Plays a subtle notification chime when a new question activates.
 *
 * Skips the initial mount (so joining a session with an active
 * question doesn't chime). Only plays on subsequent changes,
 * i.e., when the instructor activates a new question.
 *
 * Also skips if the student has muted sounds via localStorage.
 *
 * @param {string|null} currentQuestionId - The active question ID
 */
export function useQuestionChime(currentQuestionId) {
  const prevRef = useRef(undefined); // undefined = not yet mounted
  const mountedRef = useRef(false);

  useEffect(() => {
    // Skip the very first render — don't chime on initial page load
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = currentQuestionId;
      return;
    }

    // Only chime when question changes to a truthy value (activation)
    if (
      currentQuestionId &&
      currentQuestionId !== prevRef.current
    ) {
      // Check mute preference
      const muted = localStorage.getItem('pinggo_sound_muted') === 'true';
      if (!muted) {
        playChime();
      }
    }

    prevRef.current = currentQuestionId;
  }, [currentQuestionId]);
}
