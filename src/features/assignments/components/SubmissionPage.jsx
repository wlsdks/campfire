import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAssignment } from '@/features/assignments/api/useAssignments';
import { submitWork, findSubmissionByName, useSubmissionResults } from '@/features/assignments/api/useSubmissions';
import { useAwards } from '@/features/assignments/api/useAwards';
import SubmissionForm from './SubmissionForm';
import SubmissionResult from './SubmissionResult';
import PickMascot from '@/components/ui/PickMascot';
import Button from '@/components/ui/Button';

/**
 * SubmissionPage — 학생이 과제를 제출하고 결과를 확인하는 공개 페이지.
 * URL: /submit?a={assignmentId}
 */
export default function SubmissionPage({ assignmentId }) {
  const { assignment, loading } = useAssignment(assignmentId);
  const { awards } = useAwards(assignmentId);
  const [view, setView] = useState('form'); // 'form' | 'result'
  const [foundSubmission, setFoundSubmission] = useState(null);
  const [lookupName, setLookupName] = useState('');

  // Result subscription (only when viewing result)
  const { results } = useSubmissionResults(
    view === 'result' ? assignmentId : null,
    foundSubmission?.id
  );

  const handleSubmit = useCallback(async (data) => {
    await submitWork(assignmentId, data);
  }, [assignmentId]);

  const handleLookup = useCallback(async () => {
    if (!lookupName.trim()) return;
    const sub = await findSubmissionByName(assignmentId, lookupName.trim());
    if (sub) {
      setFoundSubmission(sub);
      setView('result');
    }
  }, [assignmentId, lookupName]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">불러오는 중...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <PickMascot size="lg" mood="waiting" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">과제를 찾을 수 없습니다</h2>
          <p className="text-slate-400 text-[15px]">링크가 올바른지 확인해주세요</p>
        </div>
      </div>
    );
  }

  const isJudged = assignment.status === 'judged';
  const isOpen = assignment.status === 'open';

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-5 py-4 flex items-center gap-3">
        {view === 'result' && (
          <button onClick={() => { setView('form'); setFoundSubmission(null); }} className="p-1 -ml-1 rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{assignment.title}</h1>
          <p className="text-sm text-slate-400 truncate">
            {isJudged ? '심사 완료' : isOpen ? '제출 가능' : '마감'}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isJudged ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            : isOpen ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            : 'bg-slate-50 dark:bg-slate-600 text-slate-400'
        }`}>
          {isJudged ? '결과 확인' : isOpen ? '제출 중' : '마감'}
        </span>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Assignment description */}
        {assignment.description && view === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">{assignment.description}</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Submission form (if open) */}
              {isOpen && <SubmissionForm onSubmit={handleSubmit} />}

              {/* Result lookup (if judged) */}
              {isJudged && (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">심사 결과 확인</h2>
                    <p className="text-slate-400 text-[15px]">제출 시 입력한 이름을 입력하세요</p>
                  </div>
                  <input
                    type="text"
                    value={lookupName}
                    onChange={(e) => setLookupName(e.target.value)}
                    placeholder="이름"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3.5 text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                    autoFocus
                  />
                  <Button onClick={handleLookup} variant="primary" size="lg" disabled={!lookupName.trim()} className="w-full">
                    결과 확인
                  </Button>
                </div>
              )}

              {/* Closed */}
              {!isOpen && !isJudged && (
                <div className="text-center space-y-4 py-12">
                  <PickMascot size="md" mood="waiting" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">과제가 마감되었습니다</h2>
                  <p className="text-slate-400 text-[15px]">심사 결과가 나오면 이 페이지에서 확인할 수 있어요</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <SubmissionResult
                submission={foundSubmission}
                results={results}
                awards={awards}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
