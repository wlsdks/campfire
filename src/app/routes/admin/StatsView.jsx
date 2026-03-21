import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { QUESTION_TYPE_MAP } from '@/lib/question-types';
import { useRecentQuestions } from '@/hooks/useRecentQuestions';
import { useCountUp } from '@/hooks/useCountUp';
import { TrendIndicator, MiniTrendLine, DifficultQuestions } from './StatsInsights';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04 } } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  },
};

const SUB_TABS = [
  { key: 'overview', label: '개요' },
  { key: 'questions', label: '질문 분석' },
];

function OverviewCards({ totalClasses, totalParticipants, avgActivity, courseCount }) {
  const animClasses = useCountUp(totalClasses, 800);
  const animParticipants = useCountUp(totalParticipants, 1000);
  const animActivity = useCountUp(avgActivity, 1000);

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-3 gap-4 max-sm:gap-3">
      <motion.div variants={stagger.item} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-sm:p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-3">총 클래스</p>
        <p className="text-3xl max-sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{animClasses}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{courseCount}개 강의</p>
      </motion.div>
      <motion.div variants={stagger.item} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-sm:p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-3">총 참여자</p>
        <p className="text-3xl max-sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{animParticipants}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">누적 접속 수</p>
      </motion.div>
      <motion.div variants={stagger.item} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-sm:p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-3">평균 참여율</p>
        <p className="text-3xl max-sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{animActivity}%</p>
        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${avgActivity}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function CoursePerformance({ courseData }) {
  if (courseData.length === 0) {
    return <EmptyState title="강의 데이터가 없습니다" description="강의를 진행하면 참여율 추이가 표시됩니다" mascotSize="sm" mood="thinking" className="py-8" />;
  }
  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      {courseData.map((course) => (
        <motion.div key={course.name} variants={stagger.item} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">{course.name}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <TrendIndicator roundDetails={course.roundDetails} />
              <span><span className="font-semibold text-slate-600 dark:text-slate-300">{course.conductedRounds}</span>차수</span>
              <span className="max-sm:hidden"><span className="font-semibold text-slate-600 dark:text-slate-300">{course.totalParticipants}</span>명</span>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              {course.roundDetails.map((round, idx) => (
                <div key={`${round.roundNumber}-${idx}`} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-8 shrink-0 font-medium">{round.roundNumber}차</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${round.activityRate}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.15 }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-right">{round.activityRate}%</span>
                </div>
              ))}
            </div>
            <MiniTrendLine roundDetails={course.roundDetails} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function RecentQuestions({ questions, loading, courseFilter }) {
  const filtered = courseFilter === 'all'
    ? questions
    : questions.filter((q) => (q.courseName || '미분류') === courseFilter);

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 size={16} className="animate-spin mr-2" /><span className="text-sm">질문 불러오는 중...</span></div>;
  }
  if (filtered.length === 0) {
    return <EmptyState title="최근 질문이 없습니다" description="질문을 만들고 수업을 진행해보세요" mascotSize="sm" mood="thinking" className="py-8" />;
  }
  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-1">
      {filtered.map((q, i) => {
        const typeInfo = QUESTION_TYPE_MAP[q.type] || { label: q.type, icon: MessageSquare };
        const Icon = typeInfo.icon;
        const noResponses = q.responseCount === 0;
        return (
          <motion.div key={`${q.sessionId}-${q.qId}`} variants={stagger.item} className={`flex items-center gap-3 py-2.5 ${noResponses ? 'opacity-40' : ''}`}>
            <Icon size={16} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{q.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{q.courseName || '미분류'}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <Users size={12} />
              <span className="font-medium text-slate-500 dark:text-slate-400">{q.responseCount}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function OverviewTab({ stats }) {
  return (
    <div className="space-y-8">
      <OverviewCards
        totalClasses={stats.totalClasses}
        totalParticipants={stats.totalParticipants}
        avgActivity={stats.avgActivity}
        courseCount={stats.courseCount}
      />
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">강의별 참여율 추이</h3>
        <CoursePerformance courseData={stats.courseData} />
      </div>
    </div>
  );
}

function QuestionsTab({ questions, difficultQuestions, questionsLoading, courseNames }) {
  const [courseFilter, setCourseFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Course filter */}
      {courseNames.length > 1 && (
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          <button
            onClick={() => setCourseFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.96] whitespace-nowrap shrink-0 ${
              courseFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            전체
          </button>
          {courseNames.map((name) => (
            <button
              key={name}
              onClick={() => setCourseFilter(name)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.96] whitespace-nowrap shrink-0 ${
                courseFilter === name
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">가장 어려웠던 질문</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <DifficultQuestions questions={courseFilter === 'all' ? difficultQuestions : difficultQuestions.filter((q) => (q.courseName || '미분류') === courseFilter)} loading={questionsLoading} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">최근 질문</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <RecentQuestions questions={questions} loading={questionsLoading} courseFilter={courseFilter} />
        </div>
      </div>
    </div>
  );
}

export default function StatsView({ sessions }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { totalClasses: 0, totalParticipants: 0, avgActivity: 0, courseCount: 0, courseData: [] };
    }
    const totalClasses = sessions.length;
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participantCount, 0);
    const totalActive = sessions.reduce((sum, s) => sum + s.activeCount, 0);
    const avgActivity = totalParticipants > 0 ? Math.round((totalActive / totalParticipants) * 100) : 0;
    const courseNames = new Set(sessions.filter((s) => s.courseName).map((s) => s.courseName));
    const courseCount = courseNames.size || (sessions.length > 0 ? 1 : 0);
    const courseMap = {};
    sessions.forEach((s) => {
      const name = s.courseName || '미분류';
      if (!courseMap[name]) courseMap[name] = [];
      courseMap[name].push(s);
    });
    const courseData = Object.entries(courseMap)
      .map(([name, list]) => {
        list.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
        const conducted = list.filter((s) => s.status !== 'setting');
        return {
          name,
          rounds: list.length,
          conductedRounds: conducted.length,
          totalParticipants: list.reduce((sum, s) => sum + s.participantCount, 0),
          roundDetails: conducted
            .map((s) => ({ roundNumber: s.roundNumber || '\u2014', activityRate: s.activityRate, participantCount: s.participantCount })),
        };
      })
      .filter((c) => c.conductedRounds > 0)
      .sort((a, b) => b.totalParticipants - a.totalParticipants);
    return { totalClasses, totalParticipants, avgActivity, courseCount, courseData };
  }, [sessions]);

  const courseNames = useMemo(() => {
    if (!sessions) return [];
    const names = new Set();
    sessions.forEach((s) => names.add(s.courseName || '미분류'));
    return [...names].sort();
  }, [sessions]);

  const { questions, difficultQuestions, loading: questionsLoading } = useRecentQuestions(sessions);

  if (!sessions || sessions.length === 0) {
    return <EmptyState title="아직 수업 기록이 없습니다" description="클래스를 진행하면 참여율, 질문 통계가 여기에 표시됩니다" mascotSize="md" mood="thinking" className="py-12" />;
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-1 pb-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeSubTab === tab.key
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeSubTab === 'overview' && <OverviewTab stats={stats} />}
      {activeSubTab === 'questions' && (
        <QuestionsTab
          questions={questions}
          difficultQuestions={difficultQuestions}
          questionsLoading={questionsLoading}
          courseNames={courseNames}
        />
      )}
    </div>
  );
}
