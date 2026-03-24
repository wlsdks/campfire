import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import { useEngagementData } from '@/features/report/api/useEngagementData';
import SummaryCard from './SummaryCard';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04 } } },
};

const GRID = 'grid grid-cols-[1fr_80px_80px_80px] max-sm:grid-cols-[1fr_64px_64px] gap-2';

export default function EngagementTab({ sessions }) {
  const [selectedSession, setSelectedSession] = useState('');
  const { data, loading, error, fetchEngagement } = useEngagementData();

  const conductedSessions = useMemo(() =>
    (sessions || []).filter(s => s.status !== 'setting' && s.participantCount > 0),
    [sessions]
  );

  function handleSessionChange(e) {
    const value = e.target.value;
    setSelectedSession(value);
    if (value) fetchEngagement(value);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="engagement-session" className="block text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">세션 선택</label>
        <select
          id="engagement-session"
          value={selectedSession}
          onChange={handleSessionChange}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
        >
          <option value="">세션을 선택하세요</option>
          {conductedSessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.courseName || '미분류'}{s.roundNumber ? ` ${s.roundNumber}차` : ''} — {s.participantCount}명 참여
            </option>
          ))}
        </select>
      </div>

      {!selectedSession && (
        <EmptyState
          title="세션을 선택해주세요"
          description="수업별 학생 참여도를 확인할 수 있습니다"
          mascotSize="sm"
          mood="thinking"
          className="py-8"
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span className="text-sm">참여도 분석 중...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">데이터를 불러오지 못했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-3 gap-4 max-sm:gap-3">
            <SummaryCard label="참여자" value={data.summary.totalStudents} subtitle={`${data.summary.totalQuestions}개 질문`} />
            <SummaryCard label="평균 참여율" value={`${data.summary.avgEngagement}%`} progress={data.summary.avgEngagement} />
            <SummaryCard label="완주율" value={`${data.summary.completionRate}%`} subtitle={`${data.summary.fullParticipation}명 전 문항 응답`} />
          </motion.div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">학생별 참여 현황</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" role="table" aria-label="학생별 참여 현황">
              <div className={`${GRID} px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider`} role="row">
                <span role="columnheader">학생</span>
                <span role="columnheader" className="text-right">참여율</span>
                <span role="columnheader" className="text-right max-sm:hidden">정답률</span>
                <span role="columnheader" className="text-right">점수</span>
              </div>

              <div role="rowgroup">
                {data.students.map((student) => (
                  <div
                    key={student.id}
                    role="row"
                    className={`${GRID} items-center px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={student.nickname} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{student.nickname}</p>
                        <div className="mt-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-600 dark:bg-slate-400 rounded-full transition-all"
                            style={{ width: `${student.engagementRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold text-right tabular-nums ${
                      student.engagementRate === 100 ? 'text-slate-900 dark:text-slate-100' :
                      student.engagementRate === 0 ? 'text-slate-300 dark:text-slate-600' :
                      'text-slate-600 dark:text-slate-300'
                    }`}>
                      {student.engagementRate}%
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums max-sm:hidden">
                      {student.correctRate !== null ? `${student.correctRate}%` : '—'}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-right tabular-nums">
                      {student.totalScore > 0 ? student.totalScore : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {data.students.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  참여자가 없습니다
                </div>
              )}
            </div>
          </div>

          {data.summary.zeroParticipation > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{data.summary.zeroParticipation}명</span>의 학생이 한 번도 응답하지 않았습니다.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
