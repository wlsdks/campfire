import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ChevronRight, Scale } from 'lucide-react';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import { ASSIGNMENT_STATUS } from '@/features/assignments/api/useAssignments';

export default function AssignmentCard({ assignment, onClick }) {
  const { count } = useSubmissionList(assignment.id);
  const [copied, setCopied] = useState(false);

  const submitUrl = `${window.location.origin}/submit?a=${assignment.id}`;
  const statusLabel = ASSIGNMENT_STATUS[assignment.status] || assignment.status;
  const isJudged = assignment.status === 'judged';

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.title}</p>
          <p className="text-xs text-slate-400 mt-1 truncate">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mr-1.5 align-middle ${
              isJudged
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {statusLabel}
            </span>
            {assignment.courseName}{assignment.roundNumber ? ` ${assignment.roundNumber}차` : ''}
            {' · '}{count}건 제출
            {assignment.hasJudging !== false && (
              <span className="inline-flex items-center gap-0.5 ml-1 align-middle text-slate-500 dark:text-slate-400">
                <Scale size={10} />
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors duration-150"
            title="제출 링크 복사"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </div>
    </motion.div>
  );
}
