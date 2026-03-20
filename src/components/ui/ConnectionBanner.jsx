import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

/**
 * Slim banner that slides down when Firebase connection is lost.
 * Shows "연결 끊김" while offline, briefly shows "다시 연결됨" on reconnect.
 * Renders below the header (fixed, z-10 so it layers under modals/overlays).
 */
export default function ConnectionBanner() {
  const { showBanner } = useConnectionStatus();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-14 left-0 right-0 z-10"
        >
          <div
            role="alert"
            aria-live="assertive"
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
              showBanner === 'offline'
                ? 'bg-slate-900 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {showBanner === 'offline' ? (
              <>
                <WifiOff size={15} className="shrink-0" />
                <span>연결 끊김 — 자동으로 재연결합니다</span>
                <span className="ml-1 w-1 h-1 rounded-full bg-white/60 animate-pulse" />
              </>
            ) : (
              <>
                <Wifi size={15} className="shrink-0" />
                <span>다시 연결됨</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
