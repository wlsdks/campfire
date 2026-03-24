import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Link2, Download } from 'lucide-react';
import { useSubmissionList, exportResultsCSV } from '@/features/assignments/api/useSubmissions';
import { JUDGES, getAwardById } from '@/features/assignments/api/judges';
import JudgeResultCard from './JudgeResultCard';
import Avatar from '@/components/ui/Avatar';
import PickMascot from '@/components/ui/PickMascot';

/** Sort submissions by avgScore descending. */
function sortByScore(submissions, results) {
  return [...submissions].sort((a, b) => {
    const ra = results[a.id]?.summary?.avgScore || 0;
    const rb = results[b.id]?.summary?.avgScore || 0;
    return rb - ra;
  });
}

// ─── Stats Card ────────────────────────────────────
function StatCard({ value, label }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 py-4 px-3 text-center">
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-2">{label}</p>
    </div>
  );
}

// ─── Submission Card ───────────────────────────────
function SubmissionCard({ submission, result, rank, awardInfo }) {
  const [expanded, setExpanded] = useState(false);
  const summary = result?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {rank != null && (
              <span className={`text-sm font-bold tabular-nums w-5 text-center shrink-0 ${
                rank === 1 ? 'text-slate-900 dark:text-slate-100'
                : rank <= 3 ? 'text-slate-600 dark:text-slate-300'
                : 'text-slate-300 dark:text-slate-500'
              }`}>
                {rank}
              </span>
            )}
            <Avatar name={submission.name} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {submission.name}
                </p>
                {awardInfo && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    {awardInfo.name}
                  </span>
                )}
              </div>
              {(submission.projectUrl || submission.fileName) && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {submission.projectUrl || submission.fileName}
                </p>
              )}
            </div>
          </div>

          {summary && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                {summary.avgScore}
              </p>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                <span className={`text-[11px] font-medium ${summary.passed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                  {summary.passed ? '합격' : '불합격'}
                </span>
                <span className="text-[11px] text-slate-300">·</span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {summary.selectedCount}/{summary.totalJudges}
                </span>
              </div>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && result?.judges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {JUDGES.map((judge) => (
                  <JudgeResultCard key={judge.id} judge={judge} result={result.judges[judge.id]} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Submissions Tab ───────────────────────────────
export default function SubmissionsView({ assignmentId, submissions, results, awards, hasResults }) {
  const [copied, setCopied] = useState(false);
  const submitUrl = `${window.location.origin}/submit?a=${assignmentId}`;

  function handleCopy() {
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const awardMap = useMemo(() => {
    if (!awards) return {};
    const map = {};
    Object.entries(awards).forEach(([awardId, data]) => {
      if (data.submissionId) {
        const info = getAwardById(awardId);
        if (info) map[data.submissionId] = info;
      }
    });
    return map;
  }, [awards]);

  const sorted = useMemo(() => sortByScore(submissions, results), [submissions, results]);

  const { passedCount, avgScore } = useMemo(() => {
    if (!hasResults) return { passedCount: null, avgScore: null };
    const vals = Object.values(results);
    const passed = vals.filter(r => r.summary?.passed).length;
    const avg = (vals.reduce((s, r) => s + (r.summary?.avgScore || 0), 0) / Math.max(vals.length, 1)).toFixed(1);
    return { passedCount: passed, avgScore: avg };
  }, [results, hasResults]);

  return (
    <div className="space-y-6">
      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        {copied
          ? <Check size={16} className="text-emerald-500 shrink-0" />
          : <Link2 size={16} className="text-slate-300 shrink-0" />
        }
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1 text-left">
          {copied ? '링크가 복사되었습니다' : submitUrl}
        </span>
        <Copy size={14} className="text-slate-300 shrink-0" />
      </button>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value={submissions.length} label="제출" />
        <StatCard value={passedCount ?? '–'} label="합격" />
        <StatCard value={avgScore ?? '–'} label="평균" />
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <PickMascot size="lg" mood="waiting" className="mx-auto" />
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-6">
            아직 제출된 과제가 없습니다
          </p>
          <p className="text-sm text-slate-400 mt-1">
            제출 링크를 학생들에게 공유해주세요
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {hasResults ? '심사 결과' : '제출 현황'}
            </p>
            {hasResults && (
              <button
                onClick={() => exportResultsCSV(submissions, results)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={13} />
                CSV
              </button>
            )}
          </div>
          <div className="space-y-2">
            {sorted.map((sub, i) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                result={results[sub.id]}
                rank={hasResults ? i + 1 : null}
                awardInfo={awardMap[sub.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
