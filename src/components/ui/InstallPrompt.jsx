import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PWA install prompt — shows a subtle bottom banner inviting students
 * to add Pick to their home screen. Only appears on mobile when the
 * browser fires `beforeinstallprompt` (Chrome/Edge/Samsung).
 * On iOS Safari, shows a manual instruction instead.
 */
// Detect iOS Safari once at module level (stable, no need for state)
const IS_IOS = typeof navigator !== 'undefined'
  && /iPad|iPhone|iPod/.test(navigator.userAgent)
  && !window.MSStream;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Don't show if user previously dismissed
    const dismissed = sessionStorage.getItem('pinggo-install-dismissed');
    if (dismissed) return;

    if (IS_IOS) {
      // On iOS, show after a brief delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem('pinggo-install-dismissed', '1');
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 z-40 bg-slate-900 text-white rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-md mx-auto"
        >
          <div className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <Download size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">홈 화면에 추가</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {IS_IOS
                ? '공유 버튼 → "홈 화면에 추가"를 눌러주세요'
                : '앱처럼 빠르게 접속할 수 있어요'}
            </p>
          </div>
          {!IS_IOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-shrink-0 bg-white text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-150"
            >
              설치
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
