import { useState, useMemo } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Users, ChevronDown, AlertTriangle, Radio } from 'lucide-react';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { QUESTION_TYPE_MAP } from '@/lib/question-types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function Accordion({ title, icon: Icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
          {count > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 tabular-nums">
              {count}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CurrentQuestionStatus({ session }) {
  const currentQId = session?.currentQuestion;
  const questions = session?.questions;
  if (!currentQId || !questions?.[currentQId]) return null;

  const q = questions[currentQId];
  const typeInfo = QUESTION_TYPE_MAP[q.type];
  const typeLabel = typeInfo?.label || q.type;
  const voteCount = q.votes ? Object.keys(q.votes).length : 0;

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-1.5 mb-2">
        <Radio size={12} className="text-indigo-500 animate-pulse" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          진행 중인 질문
        </p>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
        {q.title}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge variant="primary">{typeLabel}</Badge>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{voteCount}명 응답</span>
      </div>
    </div>
  );
}

function UrgentQuestionSection({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);

  return (
    <Accordion title="긴급 질문" icon={AlertTriangle} count={unreadCount} defaultOpen={unreadCount > 0}>
      {questionList.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          긴급 질문이 없습니다
        </p>
      ) : (
        <div className="space-y-1.5">
          {questionList.map((q) => (
            <div
              key={q.id}
              className={`p-2.5 rounded-lg text-sm ${
                q.read
                  ? 'bg-slate-50 dark:bg-slate-800 opacity-50'
                  : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
              <span className="text-slate-400 text-xs mt-1 block">익명</span>
            </div>
          ))}
        </div>
      )}
    </Accordion>
  );
}

function HandRaiseSection({ sessionId }) {
  const { raisedList, count } = useHandRaises(sessionId);

  async function dismissOne(participantId) {
    try {
      await set(ref(db, `sessions/${sessionId}/handRaises/${participantId}/raised`), false);
    } catch (err) {
      console.error('손들기 해제 실패:', err);
    }
  }

  return (
    <Accordion title="손들기" icon={Hand} count={count} defaultOpen>
      {count === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          손든 학생이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {raisedList.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3"
              >
                <Avatar name={p.nickname} size="sm" />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {p.nickname}
                </span>
                <Button variant="secondary" size="sm" onClick={() => dismissOne(p.id)}>
                  도움 완료
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Accordion>
  );
}

function ParticipantSection({ sessionId }) {
  const { onlineList } = useParticipants(sessionId);

  return (
    <Accordion title="참여자" icon={Users} count={onlineList.length} defaultOpen>
      {onlineList.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          접속 중인 참여자가 없습니다
        </p>
      ) : (
        <div className="space-y-0.5">
          {onlineList.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg">
              <Avatar name={p.nickname} size="sm" />
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
                {p.nickname}
              </span>
            </div>
          ))}
        </div>
      )}
    </Accordion>
  );
}

export default function StaffRightPanel({ sessionId, session }) {
  return (
    <div className="flex flex-col h-full">
      <CurrentQuestionStatus session={session} />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <UrgentQuestionSection sessionId={sessionId} />
        <HandRaiseSection sessionId={sessionId} />
        <ParticipantSection sessionId={sessionId} />
      </div>
    </div>
  );
}
