import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, X, Copy, Check, Hand, MessageSquare, ChevronDown, Trophy, Medal, Ticket, Coffee, Award, HelpCircle, UserPlus } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import QRCode from '@/components/ui/QRCode';
import Badge from '@/components/ui/Badge';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';

/**
 * PresentationView의 순수 표시 컴포넌트 모음 — 컨테이너에서 분리(632→~390줄).
 * 외부 importer가 없고 로직 결합이 적은 leaf만 추출. 키보드/슬라이드/reveal 로직은 컨테이너에 유지.
 */

export function PresentEmptyState({ sessionId, studentUrl, count }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 md:gap-6 px-2">
      {/* 프로젝터 뒷자리에서도 스캔 가능하도록 크게 — QHD(2560)에서 더 확대 */}
      <QRCode url={studentUrl} size={260} />
      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg break-all max-w-md md:max-w-xl text-center">{studentUrl}</p>
      <p className="text-slate-500 dark:text-slate-300 text-sm md:text-lg font-medium text-center">학생들이 QR코드를 스캔하여 참여할 수 있습니다</p>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
        <Badge variant="neutral"><Users size={14} className="mr-1" />{count}명 접속 중</Badge>
        <Badge variant="neutral">{sessionId}</Badge>
      </div>
    </div>
  );
}

export function PresentQROverlay({ sessionId, studentUrl, count }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function toggle(e) {
    e.stopPropagation();
    setExpanded((v) => !v);
  }

  return (
    <div className="fixed bottom-3 right-3 md:bottom-5 md:right-5 z-20" onClick={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 md:p-5 w-56 md:w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">참여 QR코드</span>
              <button
                onClick={toggle}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                aria-label="QR 닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex justify-center">
              <QRCode url={studentUrl} size={160} />
            </div>
            <div className="mt-3 text-center">
              <span className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-wider">{sessionId}</span>
            </div>
            <button
              onClick={handleCopy}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '복사됨' : '링크 복사'}
            </button>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 dark:text-slate-500 text-xs">{count}명 접속 중</span>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={toggle}
            className="flex items-center gap-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 hover:shadow-lg transition-shadow group"
            aria-label="QR코드 열기"
          >
            <div className="bg-slate-900 rounded-lg p-1.5">
              <QrCode size={16} className="text-white" />
            </div>
            <div className="text-left">
              <span className="text-slate-900 dark:text-slate-100 text-sm font-bold tracking-wider block leading-tight">{sessionId}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {count}명
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export const GameFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
      <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
      <span className="text-sm">준비 중...</span>
    </div>
  </div>
);

/** Collapsible panel for HandRaiseList + UrgentQuestionList — always toggleable. */
// 손든 학생·긴급질문 알림 개수 배지 (0이면 숨김)
function NotifBadge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums shadow ring-2 ring-white dark:ring-slate-900 animate-pulse">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function SideNoticesPanel({ sessionId }) {
  const [open, setOpen] = useState(false);
  const { count: handCount } = useHandRaises(sessionId);
  const { unreadCount: urgentCount } = useUrgentQuestions(sessionId);
  const notifCount = (handCount || 0) + (urgentCount || 0);
  return (
    <>
      {/* Desktop: toggleable top-left panel */}
      <div className="hidden md:block fixed top-5 left-5 z-10">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.94 }}
          className="relative flex items-center gap-1.5 bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-medium shadow-lg mb-2"
          aria-label={`알림 패널 열기/닫기${notifCount ? ` (${notifCount}건)` : ''}`}
        >
          <Hand size={13} />
          <MessageSquare size={13} />
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          {!open && <NotifBadge count={notifCount} />}
        </motion.button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="w-72 space-y-3"
            >
              <HandRaiseList sessionId={sessionId} />
              <UrgentQuestionList sessionId={sessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: pill toggle at top-left + slide-down sheet */}
      <div className="md:hidden fixed top-3 left-3 z-20">
        <motion.button
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          whileTap={{ scale: 0.94 }}
          className="relative flex items-center gap-1.5 bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-medium shadow-lg"
          aria-label={`알림 패널 열기${notifCount ? ` (${notifCount}건)` : ''}`}
        >
          <Hand size={13} />
          <MessageSquare size={13} />
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          {!open && <NotifBadge count={notifCount} />}
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-[min(calc(100vw-24px),288px)] space-y-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3"
            >
              <HandRaiseList sessionId={sessionId} />
              <UrgentQuestionList sessionId={sessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/** Exit hint + button — ESC on desktop, explicit button on all. */
export function ExitHint({ onExit }) {
  return (
    <button
      onClick={onExit}
      className="fixed top-3 right-3 md:top-5 md:right-5 bg-slate-900/80 dark:bg-slate-700/80 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-150 z-20 flex items-center gap-1.5 shadow-lg hover:shadow-xl active:scale-95"
    >
      <X size={14} />
      <span className="hidden sm:inline">나가기</span>
      <span className="hidden md:inline text-white/50 ml-1">ESC</span>
    </button>
  );
}

const PRESENT_MODES = [
  { mode: 'joinShow', label: '접속 현황', icon: UserPlus },
  { mode: 'combinedRanking', label: '합산 랭킹', icon: Medal },
  { mode: 'leaderboard', label: '리더보드', icon: Trophy },
  { mode: 'qaBoard', label: 'Q&A 보드', icon: MessageSquare },
  { mode: 'qaRanking', label: 'Q&A 랭킹', icon: HelpCircle },
  { mode: 'lottery', label: '추첨', icon: Ticket },
  { mode: 'breakTime', label: '쉬는 시간', icon: Coffee },
  { mode: 'awards', label: '시상식', icon: Award },
];

export function PresentModeMenu({ sessionId, currentMode }) {
  const [open, setOpen] = useState(false);

  async function switchMode(mode) {
    await update(ref(db, `sessions/${sessionId}`), { currentMode: mode, currentQuestion: null });
    setOpen(false);
  }

  async function backToQuestion() {
    await update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting' });
    setOpen(false);
  }

  return (
    <div className="fixed bottom-24 right-3 md:bottom-28 md:right-5 z-20">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm shadow-lg active:scale-95 ${
            open ? 'bg-white text-slate-900 shadow-xl' : 'bg-slate-900/70 hover:bg-slate-900/95 hover:shadow-xl text-white ring-1 ring-white/20 hover:ring-white/40'
          }`}
        >
          ⚡ 모드
        </button>

        {open && (
          <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 overflow-hidden">
            {PRESENT_MODES.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  currentMode === mode
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
            <button
              onClick={backToQuestion}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <X size={14} />
              질문으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
