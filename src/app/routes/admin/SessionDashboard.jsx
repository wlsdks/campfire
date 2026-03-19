import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSessionList } from '@/features/session/api/useSessionList';
import CreateSessionModal from './CreateSessionModal';
import AdminApproval from './AdminApproval';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Plus, Loader2, Users, MessageSquare, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

function PinggoMascotSmall() {
  return (
    <motion.svg
      width="48"
      height="48"
      viewBox="0 0 120 120"
      fill="none"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.circle cx="60" cy="68" r="32" fill="#4F46E5" />
      <motion.ellipse cx="60" cy="62" rx="24" ry="20" fill="#818CF8" opacity="0.3" />
      <motion.ellipse
        cx="50" cy="65" rx="4" ry="4.5" fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <motion.ellipse
        cx="70" cy="65" rx="4" ry="4.5" fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <motion.path d="M52 76 Q60 82 68 76" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <motion.line x1="60" y1="36" x2="60" y2="24" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
      <motion.circle
        cx="60" cy="21" r="5" fill="#06B6D4"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours < 12 ? '오전' : '오후';
  const h12 = hours % 12 || 12;
  return `${month}/${day} ${ampm} ${h12}:${minutes}`;
}

function SessionRow({ session, onClick, index }) {
  const isSetting = session.status === 'setting';
  const isActive = session.status === 'active';

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all hover:bg-indigo-50/40 group"
    >
      <span className={`text-sm font-bold w-8 shrink-0 ${isSetting ? 'text-amber-500' : isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
        {session.roundNumber ? `${session.roundNumber}차` : '—'}
      </span>
      <span className="text-sm text-slate-500 w-32 shrink-0">{formatDate(session.createdAt)}</span>
      <div className="flex items-center gap-1 flex-1 text-xs text-slate-400">
        <span className="font-medium text-slate-500">{session.participantCount}</span>명 접속
        <span className="mx-1">·</span>
        <span className="font-medium text-slate-500">{session.activeCount || 0}</span>명 참여
        <span className="mx-1">·</span>
        <span className="font-medium text-slate-500">{session.questionCount}</span>개 질문
      </div>
      {isSetting ? (
        <span className="text-xs font-semibold text-amber-600 shrink-0">세팅중</span>
      ) : isActive ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          진행 중
        </span>
      ) : (
        <span className="text-xs text-slate-400 shrink-0">완료</span>
      )}
    </motion.button>
  );
}

function CourseGroup({ name, sessions, onSelect, startIndex }) {
  const [collapsed, setCollapsed] = useState(false);

  // Find the courseTemplateId from any session in this group
  const courseTemplateId = useMemo(() => {
    for (const s of sessions) {
      if (s.courseTemplateId) return s.courseTemplateId;
    }
    return null;
  }, [sessions]);

  const stats = useMemo(() => {
    const totalParticipants = sessions.reduce((s, x) => s + x.participantCount, 0);
    const avgActivity = sessions.length > 0
      ? Math.round(sessions.reduce((s, x) => s + x.activityRate, 0) / sessions.length)
      : 0;
    return { totalParticipants, avgActivity, rounds: sessions.length };
  }, [sessions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
    >
      {/* Course header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left px-5 py-5 transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900">{name}</h3>
          {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-2xl font-bold text-slate-900">{stats.rounds}</span>
            <span className="text-xs text-slate-400 ml-1">차수</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{stats.totalParticipants}</span>
            <span className="text-xs text-slate-400 ml-1">명</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">평균 참여율</span>
              <span className="text-sm font-bold text-slate-700">{stats.avgActivity}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.avgActivity}%` }}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Session list */}
      {!collapsed && sessions.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {sessions.map((session, i) => (
            <SessionRow
              key={session.id}
              session={session}
              onClick={() => onSelect(session)}
              index={startIndex + i}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function UngroupedSessions({ sessions, onSelect, startIndex }) {
  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-500">미분류 클래스</span>
        </div>
        <div className="bg-slate-50/50 divide-y divide-slate-100">
        {sessions.map((session, i) => (
          <SessionRow
            key={session.id}
            session={session}
            onClick={() => onSelect(session)}
            index={startIndex + i}
          />
        ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SessionDashboard({ onSelectSession, onLogout, adminUser, isMaster, pendingAdmins, pendingCount, approveAdmin, rejectAdmin }) {
  const { sessions, loading, refresh } = useSessionList();
  const [modalOpen, setModalOpen] = useState(false);

  // Group sessions by course
  const { courseGroups, ungrouped } = useMemo(() => {
    const groups = {};
    const noGroup = [];

    sessions.forEach((s) => {
      if (s.courseName) {
        if (!groups[s.courseName]) groups[s.courseName] = [];
        groups[s.courseName].push(s);
      } else {
        noGroup.push(s);
      }
    });

    // Sort rounds within each course
    Object.values(groups).forEach((list) => {
      list.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
    });

    return {
      courseGroups: Object.entries(groups).sort((a, b) => {
        // Most recently used course first
        const latestA = Math.max(...a[1].map((s) => s.createdAt || 0));
        const latestB = Math.max(...b[1].map((s) => s.createdAt || 0));
        return latestB - latestA;
      }),
      ungrouped: noGroup,
    };
  }, [sessions]);

  function handleSelect(session) {
    const readOnly = session.status !== 'active';
    onSelectSession(session.id, readOnly);
  }

  function handleCreated(sessionId) {
    refresh();
    onSelectSession(sessionId, false);
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PinggoMascotSmall />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pinggo</h1>
            <p className="text-slate-400 text-xs">내 클래스</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {adminUser && (
            <span className="text-sm text-slate-500 font-medium">
              {adminUser.displayName}
            </span>
          )}
          {isMaster && (
            <AdminApproval
              pendingAdmins={pendingAdmins}
              pendingCount={pendingCount}
              approveAdmin={approveAdmin}
              rejectAdmin={rejectAdmin}
            />
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 space-y-3">
        {/* Create button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Plus size={20} />
            새 클래스 만들기
          </Button>
        </motion.div>

        {/* Session list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">아직 클래스가 없습니다</p>
            <p className="text-slate-300 text-xs mt-1">첫 번째 클래스를 만들어보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courseGroups.map(([name, list], gi) => (
              <CourseGroup
                key={name}
                name={name}
                sessions={list}
                onSelect={handleSelect}
                startIndex={gi * 10}
              />
            ))}
            <UngroupedSessions
              sessions={ungrouped}
              onSelect={handleSelect}
              startIndex={courseGroups.length * 10}
            />
          </div>
        )}
      </div>

      <CreateSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        sessions={sessions}
      />
    </div>
  );
}
