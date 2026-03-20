import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
      className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all hover:bg-slate-50 active:bg-slate-100 group"
    >
      <span className={`text-sm font-bold w-8 shrink-0 ${isSetting ? 'text-slate-500' : isActive ? 'text-slate-900' : 'text-slate-400'}`}>
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
        <span className="text-xs font-semibold text-slate-500 shrink-0">세팅중</span>
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

export function CourseGroup({ name, sessions, onSelect, startIndex }) {
  const [collapsed, setCollapsed] = useState(false);

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
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left px-5 py-5 transition-all hover:bg-slate-50/50 active:bg-slate-100/50"
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
              <div className="h-full bg-slate-700 rounded-full transition-all duration-500"
                style={{ width: `${stats.avgActivity}%` }} />
            </div>
          </div>
        </div>
      </button>

      {!collapsed && sessions.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {sessions.map((session, i) => (
            <SessionRow key={session.id} session={session} onClick={() => onSelect(session)} index={startIndex + i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function UngroupedSessions({ sessions, onSelect, startIndex }) {
  if (sessions.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-500">미분류 클래스</span>
        </div>
        <div className="bg-slate-50/50 divide-y divide-slate-100">
          {sessions.map((session, i) => (
            <SessionRow key={session.id} session={session} onClick={() => onSelect(session)} index={startIndex + i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
