import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';

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

function SessionRow({ session, onClick, onDelete, onDuplicate, index }) {
  const isSetting = session.status === 'setting';
  const isActive = session.status === 'active';
  const isReviewing = session.status === 'reviewing';

  function handleDelete(e) {
    e.stopPropagation();
    onDelete?.(session);
  }

  function handleDuplicate(e) {
    e.stopPropagation();
    onDuplicate?.(session);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="w-full flex items-center gap-4 max-sm:gap-3 px-5 max-sm:px-3.5 py-3.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 group cursor-pointer"
      onClick={onClick}
    >
      <span className={`text-sm font-bold w-8 shrink-0 ${isSetting ? 'text-slate-500' : isActive || isReviewing ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
        {session.roundNumber ? `${session.roundNumber}차` : '—'}
      </span>
      <span className="text-sm text-slate-500 dark:text-slate-400 w-32 max-sm:w-auto shrink-0">{formatDate(session.createdAt)}</span>
      <div className="flex items-center gap-1 flex-1 text-xs text-slate-400 min-w-0 max-sm:hidden">
        <span className="font-medium text-slate-500 dark:text-slate-400">{session.participantCount}</span>명 접속
        <span className="mx-1">·</span>
        <span className="font-medium text-slate-500 dark:text-slate-400">{session.activeCount || 0}</span>명 참여
        <span className="mx-1">·</span>
        <span className="font-medium text-slate-500 dark:text-slate-400">{session.questionCount}</span>개 질문
      </div>
      <span className="hidden max-sm:inline text-xs text-slate-400 flex-1 text-right">{session.participantCount}명</span>
      {isSetting ? (
        <span className="text-xs font-semibold text-slate-500 shrink-0">세팅중</span>
      ) : isActive ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          진행 중
        </span>
      ) : isReviewing ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
          질문 받기
        </span>
      ) : (
        <span className="text-xs text-slate-400 shrink-0">완료</span>
      )}
      <div className="flex items-center gap-0.5 shrink-0">
        {session.questionCount > 0 && (
          <button
            onClick={handleDuplicate}
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-90 max-sm:opacity-60"
            aria-label="세션 복제"
          >
            <Copy size={14} />
          </button>
        )}
        {!isActive && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90 max-sm:opacity-60"
            aria-label="세션 삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function CourseGroup({ name, sessions, onSelect, onDelete, onDuplicate, startIndex }) {
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
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left px-5 py-5 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-700/30 active:bg-slate-100/50 dark:active:bg-slate-700/50"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{name}</h3>
          {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.rounds}</span>
            <span className="text-xs text-slate-400 ml-1">차수</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalParticipants}</span>
            <span className="text-xs text-slate-400 ml-1">명</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">평균 참여율</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{stats.avgActivity}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-500"
                style={{ width: `${stats.avgActivity}%` }} />
            </div>
          </div>
        </div>
      </button>

      {!collapsed && sessions.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50">
          {sessions.map((session, i) => (
            <SessionRow key={session.id} session={session} onClick={() => onSelect(session)} onDelete={onDelete} onDuplicate={onDuplicate} index={startIndex + i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function UngroupedSessions({ sessions, onSelect, onDelete, onDuplicate, startIndex }) {
  if (sessions.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">미분류 클래스</span>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-700/50">
          {sessions.map((session, i) => (
            <SessionRow key={session.id} session={session} onClick={() => onSelect(session)} onDelete={onDelete} onDuplicate={onDuplicate} index={startIndex + i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
