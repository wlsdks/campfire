import { useState, useMemo, useCallback, memo } from 'react';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';
import { MessageCircle, HelpCircle, ThumbsUp, Radio, Send, MessageSquare } from 'lucide-react';
import { QUESTION_TYPE_MAP } from '@/lib/question-types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import StaffDMChat from '@/features/dm/components/StaffDMChat';
import { useStaffDMs } from '@/features/dm/api/useDM';
import { timeAgo } from '@/lib/utils';

function ActiveQuestionBanner({ session }) {
  const currentQId = session?.currentQuestion;
  const questions = session?.questions;
  if (!currentQId || !questions?.[currentQId]) return null;

  const q = questions[currentQId];
  const typeInfo = QUESTION_TYPE_MAP[q.type];
  const typeLabel = typeInfo?.label || q.type;
  const voteCount = q.votes ? Object.keys(q.votes).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 max-w-md w-full"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Radio size={14} className="text-indigo-500 animate-pulse" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          현재 진행 중
        </span>
      </div>
      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {q.title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="primary">{typeLabel}</Badge>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{voteCount}명 응답</span>
      </div>
    </motion.div>
  );
}

function ChatReplyInput({ sessionId, senderName }) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handleReply = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed || !sessionId) return;

    setSending(true);
    try {
      const chatRef = ref(db, `sessions/${sessionId}/chat`);
      await push(chatRef, {
        text: trimmed,
        sender: senderName || '스태프',
        senderType: 'staff',
        timestamp: serverTimestamp(),
      });
      setReplyText('');
    } catch (err) {
      logger.error('채팅 답변 전송 실패:', err);
    }
    setSending(false);
  }, [replyText, sessionId, senderName]);

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">채팅으로 답변</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleReply()}
          placeholder="답변을 입력하세요..."
          className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <Button
          onClick={handleReply}
          variant="primary"
          size="sm"
          disabled={!replyText.trim() || sending}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

export default memo(function StaffQuestionDetail({ question, onAction, loading, session, sessionId, senderName, staffId }) {
  const [openDM, setOpenDM] = useState(null);
  const { activeDMs, resolveDM, sendMessage } = useStaffDMs(sessionId);

  const liveDM = openDM ? (activeDMs.find((d) => d.id === openDM.id) || openDM) : null;

  const handleDirectReply = useCallback(async (q) => {
    if (!sessionId || !q) return;
    try {
      const dmRef = push(ref(db, `sessions/${sessionId}/dm`));
      await set(dmRef, {
        studentId: q.participantId || q.id,
        studentName: q.nickname || '학생',
        staffId: staffId,
        staffName: senderName,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      await push(ref(db, `sessions/${sessionId}/dm/${dmRef.key}/messages`), {
        text: `📋 수업 질문: ${q.text}`,
        sender: q.nickname || '학생',
        senderType: 'student',
        timestamp: serverTimestamp(),
      });
      setOpenDM({ id: dmRef.key, studentName: q.nickname || '학생', status: 'active', staffName: senderName });
    } catch (err) {
      logger.error('1:1 답변 생성 실패:', err);
    }
  }, [sessionId, staffId, senderName]);

  const isUrgent = question?._type === 'urgent';
  const isDone = isUrgent ? question?.read : question?.answered;
  const Icon = isUrgent ? MessageCircle : HelpCircle;

  const answeredLabel = useMemo(() => {
    if (!question) return '';
    if (isUrgent) return '확인됨';
    if (question.answeredByRole === 'staff') return '스태프 답변 완료';
    return '강사 답변 완료';
  }, [question, isUrgent]);

  if (!question) {
    const hasActiveQuestion = session?.currentQuestion && session?.questions?.[session.currentQuestion];
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        {hasActiveQuestion && <ActiveQuestionBanner session={session} />}
        <EmptyState
          title="왼쪽에서 질문을 선택하세요"
          description="질문을 클릭하면 상세 내용이 표시됩니다"
          mascotSize="sm"
          mood="waiting"
        />
      </div>
    );
  }

  return (
    <motion.div
      key={question._key}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-col items-center justify-center h-full max-w-lg mx-auto"
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-6">
        <Icon size={18} className="text-slate-400" />
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isUrgent
              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {isUrgent ? '긴급 질문' : '수업 질문'}
        </span>
      </div>

      {/* Question text */}
      <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed text-center">
        {question.text}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-3 mt-4">
        <span className="text-sm text-slate-400">
          {isUrgent && question.anonymous !== false ? '익명' : question.nickname || '익명'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span className="text-sm text-slate-400">{timeAgo(question.timestamp)}</span>
        {!isUrgent && question.upvoteCount > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 text-sm text-slate-400">
              <ThumbsUp size={12} />
              {question.upvoteCount}
            </span>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-10 w-full max-w-xs space-y-3">
        {!isDone && (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={() => onAction(question)}
              disabled={loading}
              className="w-full"
            >
              {isUrgent ? '확인 (삭제)' : '답변 완료'}
            </Button>
            {!isUrgent && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleDirectReply(question)}
                className="w-full"
              >
                <MessageSquare size={16} className="mr-1.5" />
                1:1 답변
              </Button>
            )}
          </>
        )}
        {isDone && (
          <div className="text-center text-sm text-slate-400 py-3">
            {answeredLabel}
          </div>
        )}
      </div>

      {/* Quick chat reply */}
      <div className="w-full max-w-xs">
        <ChatReplyInput
          sessionId={sessionId}
          senderName={senderName}
          questionText={question.text}
        />
      </div>

      {/* DM Chat modal */}
      <StaffDMChat
        dm={liveDM}
        open={!!liveDM}
        onClose={() => setOpenDM(null)}
        onResolve={resolveDM}
        onSendMessage={sendMessage}
        staffName={senderName}
        senderType="staff"
        allActiveDMs={activeDMs}
        onSwitchDM={setOpenDM}
      />
    </motion.div>
  );
});
