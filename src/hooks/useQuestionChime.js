import { useEffect, useRef } from 'react';
import { playChime } from '@/lib/chime';
import { playQuizBgm, stopQuizBgm } from '@/lib/quiz-bgm';

/**
 * Plays a subtle notification chime when a new question activates.
 * For quiz questions, also plays the Haydn BGM for dramatic tension.
 *
 * Skips the initial mount (so joining a session with an active
 * question doesn't chime). Only plays on subsequent changes,
 * i.e., when the instructor activates a new question.
 *
 * Also skips if the student has muted sounds via localStorage.
 *
 * @param {string|null} currentQuestionId - The active question ID
 * @param {boolean} isQuiz - Whether the current question is a quiz (scored)
 */
export function useQuestionChime(currentQuestionId, isQuiz = false) {
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
        // Quiz questions get the dramatic Haydn BGM
        if (isQuiz) {
          playQuizBgm(0.35);
        }
      }
    }

    // Stop BGM when question deactivates
    if (!currentQuestionId && prevRef.current) {
      stopQuizBgm();
    }

    prevRef.current = currentQuestionId;
  }, [currentQuestionId, isQuiz]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopQuizBgm();
  }, []);
}
