import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import TimerControls from '@/features/timer/components/TimerControls';
import TimerRing from '@/features/timer/components/TimerRing';
import { ArrowLeft, Clock, MessageCircle, Users, Monitor, Play, Square, Layers, List, PanelRight, Zap, Swords, MessageSquareDot, XCircle } from 'lucide-react';

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${mins}분 경과`;
  return `${mins}분 경과`;
}

function ElapsedTime({ startedAt, createdAt, status }) {
  const [now, setNow] = useState(Date.now());
  const origin = startedAt || createdAt;

  useEffect(() => {
    if (!origin || status !== 'active') return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [origin, status]);

  if (!origin || status !== 'active') return null;

  const elapsed = Math.max(0, now - origin);
  if (elapsed < 60_000) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <span className="text-slate-200">&middot;</span>
      <Clock size={12} className="text-slate-300" />
      <span>{formatElapsed(elapsed)}</span>
    </span>
  );
}

function ReviewingCountdown({ reviewingUntil }) {
  const remaining = Math.max(0, reviewingUntil - Date.now());
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  if (days <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <span className="text-slate-200">&middot;</span>
      <MessageSquareDot size={12} className="text-slate-300" />
      <span>{days}일 후 자동 종료</span>
    </span>
  );
}

export default memo(function AdminSessionHeader({
  session,
  sessionId,
  effectiveReadOnly,
  isSetting,
  questionProgress,
  count,
  totalTickets,
  chatOpen,
  onChatToggle,
  timerRunning,
  endTime,
  duration,
  onTimerStart,
  onTimerStop,
  onBack,
  onStartSession,
  onEndSession,
  onPresentMode,
  isTablet = false,
  onLeftDrawer,
  onRightDrawer,
  speedQuizActive = false,
  teamBattleActive = false,
  isReviewing = false,
  onFullEndSession,
}) {
  const [timerOpen, setTimerOpen] = useState(false);
  const timerRef = useRef(null);

  // Close timer popup on outside click
  useEffect(() => {
    if (!timerOpen) return;
    function handleClick(e) {
      if (timerRef.current && !timerRef.current.contains(e.target)) setTimerOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [timerOpen]);

  return (
    <div className={`bg-white border-b border-slate-200 flex items-center justify-between shrink-0 ${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        {/* Tablet: questions drawer toggle */}
        {isTablet && onLeftDrawer && (
          <button
            onClick={onLeftDrawer}
            className="p-2 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-90"
            aria-label="질문 목록 열기"
          >
            <List size={22} />
          </button>
        )}
        <button
          onClick={onBack}
          className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-90 ${isTablet ? '' : '-ml-2'}`}
          aria-label="클래스 목록으로"
        >
          <ArrowLeft size={isTablet ? 20 : 22} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 truncate">
              {session?.courseName || 'Pinggo'}
            </span>
            {session?.roundNumber && (
              <span className="text-sm font-medium text-slate-500 shrink-0">{session.roundNumber}차</span>
            )}
            {isReviewing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-white rounded text-[11px] font-bold"
              >
                <MessageSquareDot size={10} />
                질문 받기 중
              </motion.div>
            )}
            {effectiveReadOnly && !isReviewing && <Badge variant="neutral">클래스 확인</Badge>}
            {isSetting && <Badge variant="warning" className="py-1 px-2.5 text-xs font-semibold">세팅중</Badge>}
            {speedQuizActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-bold"
              >
                <Zap size={10} />
                스피드
              </motion.div>
            )}
            {teamBattleActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-white rounded text-[11px] font-bold"
              >
                <Swords size={10} />
                팀전
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isTablet && (
              <span className="text-xs text-slate-400">세션 <span className="font-mono">{sessionId}</span></span>
            )}
            {questionProgress && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                {!isTablet && <span className="text-slate-200">&middot;</span>}
                <Layers size={12} className="text-slate-300" />
                {questionProgress.current ? (
                  <span>
                    <span className="font-semibold text-slate-600">{questionProgress.current}</span>
                    <span className="text-slate-300">/{questionProgress.total}</span>
                  </span>
                ) : (
                  <span>{questionProgress.total}개</span>
                )}
              </span>
            )}
            {!isTablet && !isReviewing && (
              <ElapsedTime startedAt={session?.startedAt} createdAt={session?.createdAt} status={session?.status} />
            )}
            {isReviewing && session?.reviewingUntil && (
              <ReviewingCountdown reviewingUntil={session.reviewingUntil} />
            )}
          </div>
        </div>
      </div>
      <div className={`flex items-center shrink-0 ${isTablet ? 'gap-1' : 'gap-3'}`}>
        {/* Chat button */}
        {!effectiveReadOnly && (
          <button
            onClick={onChatToggle}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
            aria-label={chatOpen ? '채팅 닫기' : '채팅 열기'}
            aria-pressed={chatOpen}
          >
            <MessageCircle size={20} />
            {!isTablet && <span className="text-[10px] font-medium">채팅</span>}
          </button>
        )}
        {/* Timer button */}
        {!effectiveReadOnly && (
          <div className="relative" ref={timerRef}>
            <button
              onClick={() => setTimerOpen(!timerOpen)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
                timerRunning ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              aria-label={timerRunning ? '타이머 진행 중 - 설정 열기' : '타이머 설정'}
              aria-expanded={timerOpen}
            >
              {timerRunning ? (
                <TimerRing endTime={endTime} duration={duration} onExpire={onTimerStop} size="sm" />
              ) : (
                <>
                  <Clock size={20} />
                  {!isTablet && <span className="text-[10px] font-medium">타이머</span>}
                </>
              )}
            </button>
            <AnimatePresence>
              {timerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 w-72"
                >
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">타이머 설정</p>
                  <TimerControls isRunning={timerRunning} onStart={(s) => { onTimerStart(s); setTimerOpen(false); }} onStop={onTimerStop} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {/* Tablet: participants drawer toggle (replaces count badge) */}
        {isTablet && onRightDrawer ? (
          <button
            onClick={onRightDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
            aria-label="참여자 패널 열기"
          >
            <Users size={18} />
            <span className="text-sm font-semibold text-slate-600">{count}</span>
          </button>
        ) : (
          <Badge variant="neutral" className="py-2 px-3.5 text-sm">
            <Users size={16} className="mr-1.5" />
            {count}명
          </Badge>
        )}
        {!isTablet && totalTickets > 0 && <Badge variant="neutral" className="py-2 px-3.5 text-sm">{totalTickets}장 티켓</Badge>}
        {!effectiveReadOnly && isSetting && (
          <Button onClick={onStartSession} variant="primary" size="sm">
            <Play size={isTablet ? 16 : 18} />
            {isTablet ? '시작' : '시작하기'}
          </Button>
        )}
        {!effectiveReadOnly && !isSetting && (
          <>
            <Button onClick={onPresentMode} variant="primary" size="sm">
              <Monitor size={isTablet ? 16 : 18} />
              {isTablet ? '발표' : '발표 모드'}
            </Button>
            <Button onClick={onEndSession} variant="secondary" size="sm">
              <Square size={isTablet ? 16 : 18} />
              종료
            </Button>
          </>
        )}
        {isReviewing && (
          <>
            <Button onClick={onPresentMode} variant="primary" size="sm">
              <Monitor size={isTablet ? 16 : 18} />
              {isTablet ? '결과' : '결과 보기'}
            </Button>
            <Button onClick={onFullEndSession} variant="secondary" size="sm">
              <XCircle size={isTablet ? 16 : 18} />
              {isTablet ? '종료' : '완전 종료'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
});
