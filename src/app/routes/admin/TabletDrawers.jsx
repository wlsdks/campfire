import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function TabletDrawers({
  leftOpen,
  rightOpen,
  onCloseLeft,
  onCloseRight,
  leftContent,
  rightContent,
}) {
  return (
    <>
      {/* Left drawer (질문 목록) */}
      <AnimatePresence>
        {leftOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={onCloseLeft}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[340px] max-w-[85vw] bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">질문 관리</span>
                <button
                  onClick={onCloseLeft}
                  className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90"
                  aria-label="닫기"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
                {leftContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right drawer (참여자/상호작용) */}
      <AnimatePresence>
        {rightOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={onCloseRight}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-[340px] max-w-[85vw] bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">참여자 · 상호작용</span>
                <button
                  onClick={onCloseRight}
                  className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90"
                  aria-label="닫기"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
                {rightContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
