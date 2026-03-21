import { motion } from 'framer-motion';
import { MessageCircle, HelpCircle, ThumbsUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function StaffQuestionDetail({ question, onAction, loading }) {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="왼쪽에서 질문을 선택하세요"
          description="질문을 클릭하면 상세 내용이 표시됩니다"
          mascotSize="sm"
          mood="waiting"
        />
      </div>
    );
  }

  const isUrgent = question._type === 'urgent';
  const isDone = isUrgent ? question.read : question.answered;
  const Icon = isUrgent ? MessageCircle : HelpCircle;

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
          {isUrgent ? '익명' : question.nickname || '익명'}
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
          <Button
            variant="primary"
            size="lg"
            onClick={() => onAction(question)}
            disabled={loading}
            className="w-full"
          >
            {isUrgent ? '확인 (삭제)' : '답변 완료'}
          </Button>
        )}
        {isDone && (
          <div className="text-center text-sm text-slate-400 py-3">
            {isUrgent ? '확인됨' : '답변 완료'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
