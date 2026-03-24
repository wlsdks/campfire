import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check, Link2, Trophy, X, ChevronRight } from 'lucide-react';
import { useAssignment, useAssignmentActions, ASSIGNMENT_STATUS } from '@/features/assignments/api/useAssignments';
import Modal from '@/components/ui/Modal';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import { useAllResults, useAwards } from '@/features/assignments/api/useAwards';
import JudgingPanel from './JudgingPanel';
import JudgeResultCard from './JudgeResultCard';
import AwardsCeremony from './AwardsCeremony';
import { JUDGES, getAwardById } from '@/features/assignments/api/judges';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import PickMascot from '@/components/ui/PickMascot';

const TABS_WITH_JUDGING = [
  { key: 'submissions', label: '제출물' },
  { key: 'judge', label: 'AI 심사' },
  { key: 'awards', label: '시상' },
];

const TABS_WITHOUT_JUDGING = [
  { key: 'submissions', label: '제출물' },
];

/** Sort submissions by avgScore descending. */
function sortByScore(submissions, results) {
  return [...submissions].sort((a, b) => {
    const ra = results[a.id]?.summary?.avgScore || 0;
    const rb = results[b.id]?.summary?.avgScore || 0;
    return rb - ra;
  });
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

// ─── Submissions Tab ───────────────────────────────
function SubmissionsView({ assignmentId, submissions, results, awards, hasResults }) {
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
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
            {hasResults ? '심사 결과' : '제출 현황'}
          </p>
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

// ─── Judge Tab ─────────────────────────────────────
function JudgeView({ assignmentId, submissions, results, hasResults }) {
  const sorted = useMemo(() => sortByScore(submissions, results), [submissions, results]);
  const [selectedSub, setSelectedSub] = useState(null);

  const selectedResult = selectedSub ? results[selectedSub.id] : null;

  return (
    <div className="space-y-6">
      {/* 심사위원단 — 컴팩트 가로 스크롤 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {JUDGES.map((judge) => (
          <div key={judge.id} className="flex flex-col items-center gap-1.5 shrink-0">
            <Avatar name={judge.name} size="sm" />
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{judge.name}</p>
          </div>
        ))}
      </div>

      {/* 심사 컨트롤 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
        <JudgingPanel assignmentId={assignmentId} submissionCount={submissions.length} />
      </div>

      {/* 순위 — 클릭 시 심사평 모달 */}
      {hasResults && (
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">순위</p>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {sorted.map((sub, i) => {
              const r = results[sub.id];
              if (!r) return null;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className={`text-sm font-bold tabular-nums w-5 text-center ${
                    i === 0 ? 'text-slate-900 dark:text-slate-100'
                    : i < 3 ? 'text-slate-600 dark:text-slate-300'
                    : 'text-slate-300 dark:text-slate-500'
                  }`}>{i + 1}</span>
                  <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100 flex-1 truncate">
                    {sub.name}
                  </p>
                  <span className="text-xs text-slate-400 tabular-nums">{r.summary.selectedCount}/{r.summary.totalJudges}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums w-10 text-right">
                    {r.summary.avgScore}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 심사평 모달 */}
      <Modal
        open={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        ariaLabel="심사평 상세"
        className="!max-w-lg !max-h-[80vh] !overflow-y-auto"
      >
        {selectedSub && selectedResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{selectedSub.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  평균 {selectedResult.summary.avgScore}점 · {selectedResult.summary.selectedCount}/{selectedResult.summary.totalJudges}명 선택
                  · {selectedResult.summary.passed ? '합격' : '불합격'}
                </p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {JUDGES.map((judge) => (
                <JudgeResultCard key={judge.id} judge={judge} result={selectedResult.judges?.[judge.id]} />
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Awards Tab ────────────────────────────────────
function AwardsView({ assignmentId, hasResults }) {
  const { awards, loading } = useAwards(assignmentId);
  const [showCeremony, setShowCeremony] = useState(false);

  const closeCeremony = useCallback(() => setShowCeremony(false), []);

  useEffect(() => {
    if (!showCeremony) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCeremony();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCeremony, closeCeremony]);

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center py-16">
        <Trophy size={28} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 mt-4">심사 완료 후 시상 결과가 표시됩니다</p>
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 text-center"><p className="text-sm text-slate-400">불러오는 중...</p></div>;
  }

  if (!awards || Object.keys(awards).length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <Trophy size={28} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 mt-4">시상 데이터가 없습니다</p>
      </div>
    );
  }

  if (showCeremony) {
    return (
      <div
        className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center overflow-auto"
        onClick={closeCeremony}
      >
        <button
          onClick={closeCeremony}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white transition-colors z-10"
          aria-label="닫기"
        >
          <X size={24} />
        </button>
        <AwardsCeremony assignmentId={assignmentId} />
      </div>
    );
  }

  const rankAwards = ['grand', 'excellence', 'outstanding'].filter(id => awards[id]);
  const specialAwards = ['planning', 'creative', 'design', 'practical'].filter(id => awards[id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">수상 결과</p>
        <Button onClick={() => setShowCeremony(true)} variant="primary" size="sm">
          <Trophy size={14} />
          시상식 시작
        </Button>
      </div>

      {rankAwards.length > 0 && (
        <div className="space-y-3">
          {rankAwards.map((awardId, i) => {
            const info = getAwardById(awardId);
            const winner = awards[awardId];
            const isGrand = i === 0;
            return (
              <div
                key={awardId}
                className={`rounded-2xl p-6 ${
                  isGrand
                    ? 'bg-slate-900 dark:bg-slate-100'
                    : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${isGrand ? 'text-white/40 dark:text-slate-500' : 'text-slate-400'}`}>
                      {info?.description}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                      {info?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold tabular-nums leading-none ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                      {winner.name}
                    </p>
                    <p className={`text-sm mt-1 tabular-nums ${isGrand ? 'text-white/50 dark:text-slate-400' : 'text-slate-400'}`}>
                      {winner.score}점
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {specialAwards.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {specialAwards.map(awardId => {
            const info = getAwardById(awardId);
            const winner = awards[awardId];
            return (
              <div
                key={awardId}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4"
              >
                <p className="text-[11px] text-slate-400">{info?.description}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{info?.name}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-3">{winner.name}</p>
                <p className="text-xs text-slate-400 tabular-nums mt-0.5">{winner.score}점</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────
export default function AssignmentDetail({ assignmentId, onBack }) {
  const { assignment } = useAssignment(assignmentId);
  const { submissions } = useSubmissionList(assignmentId);
  const { results } = useAllResults(assignmentId);
  const { awards } = useAwards(assignmentId);
  const { closeAssignment } = useAssignmentActions();
  const [activeTab, setActiveTab] = useState('submissions');
  const [confirmClose, setConfirmClose] = useState(false);

  const hasResults = Object.keys(results).length > 0;
  const hasJudging = assignment?.hasJudging !== false; // 기본값 true (하위 호환)
  const TABS = hasJudging ? TABS_WITH_JUDGING : TABS_WITHOUT_JUDGING;

  if (!assignment) return null;

  const statusLabel = ASSIGNMENT_STATUS[assignment.status] || assignment.status;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          <span>과제 목록</span>
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {assignment.title}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {assignment.courseName}{assignment.roundNumber ? ` · ${assignment.roundNumber}차` : ''}
              {assignment.description && assignment.description !== assignment.title ? ` — ${assignment.description}` : ''}
            </p>
          </div>

          {assignment.status === 'open' && !confirmClose && (
            <Button
              onClick={() => setConfirmClose(true)}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              마감
            </Button>
          )}
        </div>
      </div>

      {confirmClose && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">마감하면 학생들이 더 이상 제출할 수 없습니다</p>
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={() => setConfirmClose(false)} variant="ghost" size="sm">취소</Button>
            <Button onClick={() => { closeAssignment(assignmentId); setConfirmClose(false); }} variant="danger" size="sm">마감하기</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-1 py-2 pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-slate-100 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'submissions' && (
            <SubmissionsView
              assignmentId={assignmentId}
              submissions={submissions}
              results={results}
              awards={awards}
              hasResults={hasResults}
            />
          )}
          {activeTab === 'judge' && (
            <JudgeView
              assignmentId={assignmentId}
              submissions={submissions}
              results={results}
              hasResults={hasResults}
            />
          )}
          {activeTab === 'awards' && (
            <AwardsView assignmentId={assignmentId} hasResults={hasResults} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
