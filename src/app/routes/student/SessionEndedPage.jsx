import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import ClassQAPanel from '@/features/class-questions/components/ClassQAPanel';
import SessionSummaryCard from '@/features/session/components/SessionSummaryCard';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

export default function SessionEndedPage({ sessionId, session, reviewing = false }) {
  const [showQA, setShowQA] = useState(false);
  const isEnded = session?.status === 'ended';

  return (
    <div className={`min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 pt-16 ${reviewing || isEnded ? 'pb-36' : 'pb-8'}`}>
      <StudentHeader sessionId={sessionId} />

      {/* Confetti on session end */}
      {isEnded && (
        <Suspense fallback={null}>
          <ConfettiBurst />
        </Suspense>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full"
      >
        <SessionSummaryCard session={session} sessionId={sessionId} reviewing={reviewing} />
      </motion.div>

      {/* reviewing: full bottom bar (chat + questions) */}
      {reviewing && <StudentBottomBar sessionId={sessionId} />}

      {/* ended: question-only floating button (사후 질문) */}
      {isEnded && (
        <>
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQA(true)}
            className="fixed bottom-6 right-5 flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-sm font-semibold z-30 active:shadow-md transition-shadow"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <HelpCircle size={18} />
            질문하기
          </motion.button>
          <ClassQAPanel sessionId={sessionId} open={showQA} onClose={() => setShowQA(false)} />
        </>
      )}
    </div>
  );
}
