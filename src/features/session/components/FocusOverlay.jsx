import { memo } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';

/**
 * FocusOverlay — 강사가 "집중" 모드 트리거 시 학생 화면에 표시.
 * 어두운 배경 + "강사를 봐주세요" 메시지. 리액션/채팅 비활성.
 */
export default memo(function FocusOverlay() {
  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="space-y-6"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PickMascot size="lg" mood="happy" />
        </motion.div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full"
          >
            <Eye size={18} className="text-white/80" />
            <span className="text-white/90 font-bold text-lg tracking-tight">집중!</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-white/60 text-[15px] leading-relaxed"
          >
            강사의 설명에 집중해주세요
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
            className="flex justify-center gap-1 pt-2"
          >
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});
