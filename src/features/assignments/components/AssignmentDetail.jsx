import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, ExternalLink, Clock, User } from 'lucide-react';
import { useAssignment, useAssignmentActions } from '@/features/assignments/api/useAssignments';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import { useAllResults } from '@/features/assignments/api/useAwards';
import JudgingPanel from './JudgingPanel';
import JudgeResultCard from './JudgeResultCard';
import { JUDGES } from '@/features/assignments/api/judges';
import Button from '@/components/ui/Button';

function SubmissionRow({ submission, result, onExpand, expanded }) {
  const summary = result?.summary;
  return (
    <button
      onClick={onExpand}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            {submission.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100 truncate">{submission.name}</p>
            {submission.projectUrl && (
              <p className="text-xs text-slate-400 truncate">{submission.projectUrl}</p>
            )}
          </div>
        </div>
        {summary && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{summary.avgScore}</p>
            <span className={`text-[11px] font-medium ${summary.passed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {summary.passed ? '합격' : '불합격'}
            </span>
          </div>
        )}
      </div>

      {/* Expanded: judge results */}
      {expanded && result?.judges && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-2 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {JUDGES.map((judge) => (
            <JudgeResultCard key={judge.id} judge={judge} result={result.judges[judge.id]} />
          ))}
        </motion.div>
      )}
    </button>
  );
}

/**
 * AssignmentDetail — 강사용 과제 상세 (제출 현황 + 심사 + 결과).
 */
export default function AssignmentDetail({ assignmentId, onBack }) {
  const { assignment } = useAssignment(assignmentId);
  const { submissions } = useSubmissionList(assignmentId);
  const { results } = useAllResults(assignmentId);
  const { closeAssignment, deleteAssignment } = useAssignmentActions();
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!assignment) return null;

  const submitUrl = `${window.location.origin}/submit?a=${assignmentId}`;

  function handleCopy() {
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Sort by score if judged
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const ra = results[a.id]?.summary?.avgScore || 0;
    const rb = results[b.id]?.summary?.avgScore || 0;
    return rb - ra;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{assignment.title}</h3>
          <p className="text-sm text-slate-400">{submissions.length}건 제출</p>
        </div>
      </div>

      {/* Link + actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-sm text-slate-600 dark:text-slate-300 active:scale-[0.98] transition-transform"
        >
          {copied ? <Check size={14} className="text-emerald-500 shrink-0" /> : <Copy size={14} className="text-slate-400 shrink-0" />}
          <span className="truncate">{copied ? '복사됨!' : '제출 링크 복사'}</span>
        </button>
        {assignment.status === 'open' && (
          <Button onClick={() => closeAssignment(assignmentId)} variant="secondary" size="sm">마감</Button>
        )}
      </div>

      {/* Judging panel */}
      {assignment.status !== 'judged' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
          <JudgingPanel assignmentId={assignmentId} submissionCount={submissions.length} />
        </div>
      )}

      {/* Submissions */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {assignment.status === 'judged' ? '심사 결과' : '제출 현황'}
        </p>
        {sortedSubmissions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">아직 제출된 과제가 없습니다</p>
        ) : (
          sortedSubmissions.map((sub, i) => (
            <SubmissionRow
              key={sub.id}
              submission={sub}
              result={results[sub.id]}
              expanded={expandedId === sub.id}
              onExpand={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
