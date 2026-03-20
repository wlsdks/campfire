import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, Flame, CheckCheck, Zap, Crown } from 'lucide-react';

const ICON_MAP = {
  Sparkle,
  Flame,
  CheckCheck,
  Zap,
  Crown,
};

const DISPLAY_DURATION = 3500;

/**
 * AchievementToast — shows a small toast when a new achievement is earned.
 * Tracks previously shown achievements and only shows new ones.
 *
 * @param {{ achievements: Array<{id, label, description, icon}> }} props
 */
export default function AchievementToast({ achievements }) {
  const [visible, setVisible] = useState(null);
  const shownRef = useRef(new Set());
  const queueRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const newOnes = achievements.filter((a) => !shownRef.current.has(a.id));
    if (newOnes.length === 0) return;

    newOnes.forEach((a) => {
      shownRef.current.add(a.id);
      queueRef.current.push(a);
    });

    if (!timerRef.current) showNext();
  }, [achievements]);

  function showNext() {
    const next = queueRef.current.shift();
    if (!next) {
      timerRef.current = null;
      return;
    }
    setVisible(next);
    timerRef.current = setTimeout(() => {
      setVisible(null);
      setTimeout(showNext, 300);
    }, DISPLAY_DURATION);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const Icon = visible ? (ICON_MAP[visible.icon] || Sparkle) : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={visible.id}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-3 bg-slate-900 text-white pl-3 pr-5 py-2.5 rounded-xl shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">{visible.label}</p>
              <p className="text-xs text-slate-300 leading-tight mt-0.5">{visible.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
