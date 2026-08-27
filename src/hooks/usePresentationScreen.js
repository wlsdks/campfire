import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * 발표 화면용 전체화면 + 화면 꺼짐 방지.
 *
 * 지금까지 발표 모드는 CSS로만 전체화면처럼 보였을 뿐이라, 브라우저 주소창과 탭이 그대로
 * 프로젝터에 나갔다. 그리고 강사가 말하는 동안 입력이 없으면 노트북이 화면을 꺼버린다.
 *
 * 전체화면 요청은 사용자 제스처 안에서만 허용된다. 발표 모드 진입 클릭에서 이 컴포넌트가
 * 마운트되므로 대개 통과하지만, 브라우저가 거절하면 조용히 실패하고 수동 버튼만 남긴다.
 * Wake Lock은 화면이 보이는 동안만 유지되므로 탭이 돌아올 때 다시 잡는다.
 */
export function usePresentationScreen({ enabled = true } = {}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef(null);

  const fullscreenSupported = typeof document !== 'undefined'
    && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement;
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!request) return false;
    try {
      await request.call(el);
      return true;
    } catch (err) {
      // 사용자 제스처 밖이거나 브라우저 정책상 거절 — 수동 버튼으로 다시 시도할 수 있다
      logger.warn('[present] fullscreen 거절', err);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!exit || !(document.fullscreenElement || document.webkitFullscreenElement)) return;
    try {
      await exit.call(document);
    } catch (err) {
      logger.warn('[present] fullscreen 해제 실패', err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement || document.webkitFullscreenElement) exitFullscreen();
    else enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  // 브라우저가 ESC 등으로 전체화면을 풀 수도 있으므로 실제 상태를 구독한다
  useEffect(() => {
    const sync = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // 발표 모드에 들어오면 전체화면을 시도하고, 나갈 때 되돌린다
  useEffect(() => {
    if (!enabled) return;
    enterFullscreen();
    return () => { exitFullscreen(); };
  }, [enabled, enterFullscreen, exitFullscreen]);

  // 화면 꺼짐 방지 — 탭이 가려졌다 돌아오면 다시 잡는다
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.wakeLock) return;

    let cancelled = false;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        logger.warn('[present] wake lock 실패', err); // 배터리 절약 모드 등에서 거절될 수 있다
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') acquire(); };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [enabled]);

  return { isFullscreen, toggleFullscreen, fullscreenSupported };
}
