import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { QUESTION_TYPE_MAP } from '@/lib/question-types';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04 } } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  },
};

function OverviewCards({ totalClasses, totalParticipants, avgActivity, courseCount }) {
  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="grid grid-cols-3 gap-4"
    >
      <motion.div variants={stagger.item} className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">총 클래스</p>
        <p className="text-3xl font-bold text-slate-900">{totalClasses}</p>
        <p className="text-xs text-slate-500 mt-2">{courseCount}개 강의</p>
      </motion.div>

      <motion.div variants={stagger.item} className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">총 참여자</p>
        <p className="text-3xl font-bold text-slate-900">{totalParticipants}</p>
        <p className="text-xs text-slate-500 mt-2">누적 접속 수</p>
      </motion.div>

      <motion.div variants={stagger.item} className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">평균 참여율</p>
        <p className="text-3xl font-bold text-slate-900">{avgActivity}%</p>
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-700 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${avgActivity}%` }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function CoursePerformance({ courseData }) {
  if (courseData.length === 0) {
    return (
      <EmptyState
        title="강의 데이터가 없습니다"
        description="강의를 진행하면 참여율 추이가 표시됩니다"
        mascotSize="sm"
        mood="thinking"
        className="py-8"
      />
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {courseData.map((course) => (
        <motion.div
          key={course.name}
          variants={stagger.item}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900">{course.name}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span><span className="font-semibold text-slate-600">{course.rounds}</span>차수</span>
              <span><span className="font-semibold text-slate-600">{course.totalParticipants}</span>명</span>
            </div>
          </div>
          <div className="space-y-2">
            {course.roundDetails.map((round) => (
              <div key={round.roundNumber} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-8 shrink-0 font-medium">{round.roundNumber}차</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-700 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${round.activityRate}%` }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-10 text-right">{round.activityRate}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function RecentQuestions({ questions, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="text-sm">질문 불러오는 중...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        title="최근 질문이 없습니다"
        description="질문을 만들고 수업을 진행해보세요"
        mascotSize="sm"
        mood="thinking"
        className="py-8"
      />
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="divide-y divide-slate-100"
    >
      {questions.map((q, i) => {
        const typeInfo = QUESTION_TYPE_MAP[q.type] || { label: q.type, icon: MessageSquare };
        const Icon = typeInfo.icon;
        return (
          <motion.div
            key={`${q.sessionId}-${q.qId}-${i}`}
            variants={stagger.item}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <Icon size={16} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{q.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{q.courseName || '미분류'}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <Users size={12} />
              <span className="font-medium text-slate-500">{q.responseCount}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function useRecentQuestions(sessions) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      try {
        // Fetch questions from the 10 most recent sessions
        const recentSessions = sessions.slice(0, 10);
        const allQuestions = [];

        for (const s of recentSessions) {
          const snap = await get(ref(db, `sessions/${s.id}/questions`));
          const data = snap.val();
          if (!data) continue;

          Object.entries(data).forEach(([qId, q]) => {
            const responseCount = q.votes ? Object.keys(q.votes).length : 0;
            allQuestions.push({
              qId,
              sessionId: s.id,
              title: q.title || '제목 없음',
              type: q.type || 'choice',
              courseName: s.courseName,
              responseCount,
              order: q.order || 0,
              createdAt: s.createdAt || 0,
            });
          });
        }

        // Sort by session date (newest first), then by order
        allQuestions.sort((a, b) => b.createdAt - a.createdAt || a.order - b.order);

        if (!cancelled) {
          setQuestions(allQuestions.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch recent questions:', err);
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, [sessions]);

  return { questions, loading };
}

export default function StatsView({ sessions }) {
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { totalClasses: 0, totalParticipants: 0, avgActivity: 0, courseCount: 0, courseData: [] };
    }

    const totalClasses = sessions.length;
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participantCount, 0);

    // Weighted average activity rate (weighted by participant count)
    const totalActive = sessions.reduce((sum, s) => sum + s.activeCount, 0);
    const avgActivity = totalParticipants > 0 ? Math.round((totalActive / totalParticipants) * 100) : 0;

    // Unique courses
    const courseNames = new Set(sessions.filter((s) => s.courseName).map((s) => s.courseName));
    const courseCount = courseNames.size || (sessions.length > 0 ? 1 : 0);

    // Per-course data
    const courseMap = {};
    sessions.forEach((s) => {
      const name = s.courseName || '미분류';
      if (!courseMap[name]) courseMap[name] = [];
      courseMap[name].push(s);
    });

    const courseData = Object.entries(courseMap)
      .map(([name, list]) => {
        list.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
        return {
          name,
          rounds: list.length,
          totalParticipants: list.reduce((sum, s) => sum + s.participantCount, 0),
          roundDetails: list.map((s) => ({
            roundNumber: s.roundNumber || '—',
            activityRate: s.activityRate,
            participantCount: s.participantCount,
          })),
        };
      })
      .sort((a, b) => b.totalParticipants - a.totalParticipants);

    return { totalClasses, totalParticipants, avgActivity, courseCount, courseData };
  }, [sessions]);

  const { questions, loading: questionsLoading } = useRecentQuestions(sessions);

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        title="아직 수업 기록이 없습니다"
        description="클래스를 진행하면 참여율, 질문 통계가 여기에 표시됩니다"
        mascotSize="md"
        mood="thinking"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-8">
      <OverviewCards
        totalClasses={stats.totalClasses}
        totalParticipants={stats.totalParticipants}
        avgActivity={stats.avgActivity}
        courseCount={stats.courseCount}
      />

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">강의별 참여율</h3>
        <CoursePerformance courseData={stats.courseData} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">최근 질문</h3>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <RecentQuestions questions={questions} loading={questionsLoading} />
        </div>
      </div>
    </div>
  );
}
