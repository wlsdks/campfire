import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import QuestionForm from './QuestionForm';
import { MainContent } from './PresentationView';
import { SuspenseFallback } from '@/components/ui/Skeleton';

const ClassSummary = lazy(() => import('./ClassSummary'));

export default function CenterContent({
  showCenterForm,
  onHideCenterForm,
  onCenterFormSubmit,
  effectiveReadOnly,
  session,
  currentMode,
  sessionId,
  onlineList,
  leaderboard,
  drawParticipants,
  participants,
  scores,
  count,
  teamScores,
}) {
  return (
    <AnimatePresence mode="wait">
      {showCenterForm ? (
        <motion.div
          key="center-form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">새 질문 추가</h2>
                <p className="text-slate-400 text-sm mt-1">질문을 작성하고 추가하세요</p>
              </div>
              <button
                onClick={onHideCenterForm}
                className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                aria-label="취소"
              >
                <X size={20} />
              </button>
            </div>
            <QuestionForm
              onSubmit={onCenterFormSubmit}
              onCancel={onHideCenterForm}
              error={null}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full h-full"
        >
          {effectiveReadOnly && !session?.currentQuestion ? (
            <Suspense fallback={<SuspenseFallback fullPage={false} />}>
              <ClassSummary
                session={session}
                participants={participants}
                scores={scores}
                leaderboard={leaderboard}
                count={count}
              />
            </Suspense>
          ) : (
            <MainContent
              currentMode={currentMode}
              sessionId={sessionId}
              session={session}
              onlineList={onlineList}
              leaderboard={leaderboard}
              drawParticipants={drawParticipants}
              teamScores={teamScores}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
