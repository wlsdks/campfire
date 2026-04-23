import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Send, Sparkles, Trophy, Trash2, Edit3, AlertCircle, Image as ImageIcon, Code2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getParticipantId, getSessionNickname } from '@/lib/participant';
import { useMySubmission, useSubmitLive, useLiveJudgeResults } from '../api/useLiveJudging';
import LiveResultHero from './LiveResultHero';

/**
 * AiJudgeSubmitter — 학생용 AI 심사 제출 폼.
 * 질문 활성화 중: 이미지/제목/설명 제출 (재제출 허용).
 * 심사 완료 시: 본인 결과 + TOP 3 확인.
 */
export default memo(function AiJudgeSubmitter({ sessionId, questionId, disabled }) {
  const participantId = getParticipantId();
  const nickname = getSessionNickname(sessionId) || '익명';
  const submission = useMySubmission(sessionId, questionId, participantId);
  const { submit, withdraw } = useSubmitLive(sessionId, questionId);
  const { top3, judgeState, results } = useLiveJudgeResults(sessionId, questionId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [code, setCode] = useState('');
  const [submitTab, setSubmitTab] = useState('image'); // 'image' | 'code'
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  useEffect(() => {
    if (submission && !editing) {
      setTitle(submission.title || '');
      setDescription(submission.description || '');
      setImageUrl(submission.imageUrl || '');
      setCode(submission.code || '');
      // 기존 제출물 형태에 맞춰 탭 자동 선택
      if (submission.code && !submission.imageUrl) setSubmitTab('code');
    }
  }, [submission, editing]);

  const hasSubmitted = !!submission;
  const isJudging = judgeState?.status === 'judging';
  const isDone = judgeState?.status === 'done';
  const myResult = results?.[participantId];
  const submissionLocked = isJudging || isDone;

  // 이미지 또는 코드 중 하나라도 있으면 제출 가능
  const hasContent = !!imageUrl || !!code.trim();
  const canSubmit = hasContent && !submitting && !disabled && !submissionLocked;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submit(participantId, {
        name: nickname,
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        code: code.trim(),
      });
      setEditing(false);
    } catch (err) {
      setSubmitError(err?.message || '제출에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setSubmitError(null), 3500);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdrawConfirmed() {
    setWithdrawConfirmOpen(false);
    await withdraw(participantId);
    setTitle(''); setDescription(''); setImageUrl(''); setCode('');
    setEditing(false);
  }

  // 심사 완료 후: 결과 화면 (TOP 공개는 강사 제어에 따라 단계적)
  if (isDone && top3) {
    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <LiveResultHero
          top3={top3}
          myParticipantId={participantId}
          myResult={myResult}
          mySubmission={submission}
          revealedUpTo={judgeState?.revealedUpTo ?? 0}
        />
      </motion.div>
    );
  }

  // 심사 중
  if (isJudging) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
      >
        {submission?.imageUrl && (
          <img src={submission.imageUrl} alt="" className="w-full max-h-40 object-cover opacity-80" />
        )}
        <div className="p-6 text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-100 mx-auto flex items-center justify-center"
          >
            <Sparkles size={24} className="text-white dark:text-slate-900" />
          </motion.div>
          <div>
            <p className="text-slate-900 dark:text-slate-100 text-lg font-bold">AI 심사 진행 중</p>
            <p className="text-slate-400 text-sm mt-1">
              {judgeState?.current && judgeState?.total
                ? `${judgeState.current} / ${judgeState.total}명 심사 중`
                : '곧 결과가 공개됩니다'}
            </p>
          </div>
          {submission?.title && (
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
              내 제출: {submission.title}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 제출 완료 상태 (편집 아님)
  if (hasSubmitted && !editing) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
      >
        {submission.imageUrl && (
          <img src={submission.imageUrl} alt="" className="w-full max-h-60 object-cover" />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Check size={13} className="text-white dark:text-slate-900" />
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-semibold">제출 완료</p>
            {submission.code && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                <Code2 size={10} /> 코드 포함
              </span>
            )}
          </div>
          {submission.title && (
            <p className="text-slate-700 dark:text-slate-200 text-base font-medium">{submission.title}</p>
          )}
          {submission.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm whitespace-pre-wrap leading-relaxed">{submission.description}</p>
          )}
          {submission.code && !submission.imageUrl && (
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                제출한 코드 보기 ({submission.code.length.toLocaleString()}자)
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                {submission.code.slice(0, 2000)}{submission.code.length > 2000 && '\n...'}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={() => setEditing(true)} variant="secondary" size="md" className="flex-1 min-h-[44px]">
              <Edit3 size={15} /> 수정
            </Button>
            <button
              onClick={() => setWithdrawConfirmOpen(true)}
              aria-label="제출 취소"
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              <Trash2 size={14} /> 취소
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center pt-1">심사 시작 전까지 수정 가능</p>
        </div>
      </motion.div>
    );
  }

  // 제출 폼
  return (
    <>
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">내 작품 제출</p>
        <span className="ml-auto text-[11px] text-slate-400">이미지 또는 코드 중 하나</span>
      </div>

      {/* 제출 방식 탭 — 이미지 | 코드 */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={submitTab === 'image'}
          onClick={() => setSubmitTab('image')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
            submitTab === 'image'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ImageIcon size={13} /> 이미지
          {imageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-label="첨부됨" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={submitTab === 'code'}
          onClick={() => setSubmitTab('code')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
            submitTab === 'code'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Code2 size={13} /> HTML 코드
          {code.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-label="입력됨" />}
        </button>
      </div>

      {submitTab === 'image' ? (
        <div>
          <ImageUpload value={imageUrl} onChange={setImageUrl} folder="ai-judge" />
          {!hasContent && (
            <p className="text-[11px] text-slate-400 mt-1.5">작품 스크린샷이나 사진을 첨부해주세요</p>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`<!DOCTYPE html>\n<html>\n  <body>\n    <!-- 여기에 HTML/CSS/JS를 붙여넣으세요 -->\n  </body>\n</html>`}
            aria-label="HTML 코드"
            rows={10}
            maxLength={50000}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-[13px] font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
            <span>HTML/CSS/JavaScript 통째로 붙여넣기</span>
            <span className="tabular-nums">{code.length.toLocaleString()}/50,000</span>
          </div>
        </div>
      )}

      <div>
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
          제목 <span className="text-slate-300 font-normal">선택</span>
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="작품 제목"
          aria-label="작품 제목"
          maxLength={40}
          className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      <div>
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
          설명 <span className="text-slate-300 font-normal">선택</span>
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 작품이 어떤 건지 짧게 설명해주세요"
          aria-label="작품 설명"
          rows={3}
          maxLength={300}
          className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
        />
      </div>

      {title.trim() === '' && imageUrl && (
        <p className="text-xs text-slate-400 text-center">제목·설명을 적으면 AI가 더 구체적인 심사평을 줘요</p>
      )}

      <AnimatePresence>
        {submitError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="alert"
            className="text-red-500 text-xs flex items-center gap-1.5"
          >
            <AlertCircle size={13} /> {submitError}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {editing && (
          <Button type="button" onClick={() => setEditing(false)} variant="secondary" size="md" className="flex-1">
            취소
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" disabled={!canSubmit} className="flex-[2]">
          {submitting ? '제출 중...' : editing ? <><Check size={16} /> 수정 저장</> : <><Send size={16} /> 제출하기</>}
        </Button>
      </div>
    </motion.form>

    <ConfirmModal
      open={withdrawConfirmOpen}
      onCancel={() => setWithdrawConfirmOpen(false)}
      onConfirm={handleWithdrawConfirmed}
      title="제출을 취소할까요?"
      description="업로드한 이미지와 내용이 모두 삭제됩니다."
      confirmLabel="제출 취소"
      variant="danger"
    />
    </>
  );
});
