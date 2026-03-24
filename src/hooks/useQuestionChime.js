import { useEffect, useRef } from 'react';
import { playChime } from '@/lib/chime';
import { playQuizBgm, stopQuizBgm } from '@/lib/quiz-bgm';

/**
 * Plays a subtle notification chime when a new question activates.
 * For quiz questions, also plays tension BGM that stops on answer reveal.
 *
 * @param {string|null} currentQuestionId - The active question ID
 * @param {boolean} isQuiz - Whether the current question is a quiz (scored)
 * @param {boolean} revealed - Whether the answer has been revealed
 */
export function useQuestionChime(currentQuestionId, isQuiz = false, revealed = false) {
  const prevRef = useRef(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = currentQuestionId;
      return;
    }

    if (
      currentQuestionId &&
      currentQuestionId !== prevRef.current
    ) {
      const muted = localStorage.getItem('pinggo_sound_muted') === 'true';
      if (!muted) {
        playChime();
        if (isQuiz) {
          playQuizBgm(0.35);
        }
      }
    }

    if (!currentQuestionId && prevRef.current) {
      stopQuizBgm();
    }

    prevRef.current = currentQuestionId;
  }, [currentQuestionId, isQuiz]);

  // Stop BGM when answer is revealed (tension resolved)
  useEffect(() => {
    if (revealed) stopQuizBgm();
  }, [revealed]);

  useEffect(() => {
    return () => stopQuizBgm();
  }, []);
}
