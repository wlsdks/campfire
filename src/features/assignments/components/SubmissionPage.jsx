import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, Search, FileCode2, FileText, Link, ExternalLink, Trash2, Pencil, Send, Scale } from 'lucide-react';
import { useAssignment } from '@/features/assignments/api/useAssignments';
import { ASSIGNMENT_STATUS } from '@/features/assignments/api/useAssignments';
import { submitWork, lookupSubmission, withdrawSubmission, useSubmissionResults } from '@/features/assignments/api/useSubmissions';
import { useAwards } from '@/features/assignments/api/useAwards';
import SubmissionForm from './SubmissionForm';
import SubmissionResult from './SubmissionResult';
import PickMascot from '@/components/ui/PickMascot';
import Button from '@/components/ui/Button';

// ─── MySubmissionView ──────────────────────────────
function MySubmissionView({ submission, assignmentId, onBack, onEdit, isOpen }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleWithdraw() {
    setDeleting(true);
    try {
      await withdrawSubmission(assignmentId, submission.id);
      onBack();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <p className="text-sm text-slate-400">{submission.name}님의 제출물</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {submission.projectUrl && (
          <div className="flex items-center gap-3 px-5 py-4">
            <Link size={15} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">프로젝트 URL</p>
              <a href={submission.projectUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-slate-900 dark:text-slate-100 truncate block hover:underline">
                {submission.projectUrl}
              </a>
            </div>
            <ExternalLink size={14} className="text-slate-300 shrink-0" />
          </div>
        )}
        {submission.fileName && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FileCode2 size={15} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">코드 파일</p>
              <p className="text-sm text-slate-900 dark:text-slate-100 truncate">{submission.fileName}</p>
            </div>
          </div>
        )}
        {submission.prdFileName && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FileText size={15} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">PRD / 기획서 / 문서</p>
              <p className="text-sm text-slate-900 dark:text-slate-100 truncate">{submission.prdFileName}</p>
            </div>
          </div>
        )}
        {submission.description && (
          <div className="px-5 py-4">
            <p className="text-xs text-slate-400 mb-1">프로젝트 설명</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {submission.description}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-300 dark:text-slate-500 text-center">
        {submission.updatedAt ? '수정됨' : '제출됨'}
        {' · '}
        {new Date(submission.updatedAt || submission.submittedAt).toLocaleDateString('ko-KR', {
          month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {isOpen && (
        <div className="space-y-2 pt-2">
          <Button onClick={onEdit} variant="primary" size="lg" className="w-full">
            <Pencil size={16} />
            수정하기
          </Button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full text-center py-3 text-sm text-slate-400 hover:text-red-500 transition-colors">
              제출 취소
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">정말 제출을 취소하시겠어요?</p>
              <div className="flex gap-2">
                <Button onClick={() => setConfirmDelete(false)} variant="ghost" size="sm" className="flex-1">아니요</Button>
                <Button onClick={handleWithdraw} variant="danger" size="sm" disabled={deleting} className="flex-1">
                  <Trash2 size={14} />
                  {deleting ? '취소 중...' : '네, 취소할게요'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LookupForm ────────────────────────────────────
function LookupForm({ assignmentId, onFound }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!name.trim() || pin.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const result = await lookupSubmission(assignmentId, name.trim(), pin);
      if (result.error === 'NOT_FOUND') setError('해당 이름의 제출물을 찾을 수 없습니다');
      else if (result.error === 'PIN_MISMATCH') setError('비밀번호가 일치하지 않습니다');
      else onFound(result.submission);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">이름</p>
        <input type="text" value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="제출 시 입력한 이름"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          autoFocus
        />
      </div>
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">비밀번호</p>
        <input type="password" inputMode="numeric" pattern="[0-9]*" value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          placeholder="••••" maxLength={4}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all tracking-[0.3em] ${
            error ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button onClick={handleLookup} variant="primary" size="lg" disabled={!name.trim() || pin.length !== 4 || loading} className="w-full">
        {loading ? '조회 중...' : '조회하기'}
      </Button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────
export default function SubmissionPage({ assignmentId }) {
  const { assignment, loading } = useAssignment(assignmentId);
  const { awards } = useAwards(assignmentId);
  // 'landing' | 'submit' | 'lookup' | 'mySubmission' | 'edit' | 'result'
  const [view, setView] = useState('landing');
  const [foundSubmission, setFoundSubmission] = useState(null);
  const [lookupName, setLookupName] = useState('');
  const [lookupPin, setLookupPin] = useState('');
  const [resultLookupLoading, setResultLookupLoading] = useState(false);
  const [resultLookupError, setResultLookupError] = useState('');

  const { results } = useSubmissionResults(
    view === 'result' ? assignmentId : null,
    foundSubmission?.id
  );

  const handleSubmit = useCallback(async (data) => {
    await submitWork(assignmentId, data);
  }, [assignmentId]);

  const handleResultLookup = useCallback(async () => {
    if (!lookupName.trim() || lookupPin.length !== 4) return;
    setResultLookupLoading(true);
    setResultLookupError('');
    try {
      const result = await lookupSubmission(assignmentId, lookupName.trim(), lookupPin);
      if (result.error === 'NOT_FOUND') {
        setResultLookupError('해당 이름의 제출물을 찾을 수 없습니다');
      } else if (result.error === 'PIN_MISMATCH') {
        setResultLookupError('비밀번호가 일치하지 않습니다');
      } else {
        setFoundSubmission(result.submission);
        setView('result');
      }
    } finally {
      setResultLookupLoading(false);
    }
  }, [assignmentId, lookupName, lookupPin]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <PickMascot size="lg" mood="waiting" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-6">과제를 찾을 수 없습니다</h2>
        <p className="text-slate-400 text-sm mt-2">링크가 올바른지 확인해주세요</p>
      </div>
    );
  }

  const isJudged = assignment.status === 'judged';
  const isOpen = assignment.status === 'open';
  const isJudging = assignment.status === 'judging';
  const isClosed = assignment.status === 'closed';
  const statusLabel = ASSIGNMENT_STATUS[assignment.status] || assignment.status;
  const showBackButton = view !== 'landing';

  function handleBack() {
    if (view === 'edit') setView('mySubmission');
    else { setView('landing'); setFoundSubmission(null); }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          {showBackButton && (
            <button onClick={handleBack}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {assignment.courseName}{assignment.roundNumber ? ` · ${assignment.roundNumber}차` : ''}
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
            isJudged ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            : isOpen ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            : isJudging ? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
          }`}>
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8">
        <AnimatePresence mode="wait">

          {/* ── 랜딩: 선택 화면 ── */}
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Open: 제출 or 조회 */}
              {isOpen && (
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100dvh - 160px)' }}>
                  <div className="w-full space-y-6">
                    {/* 마스코트 + 과제 안내 */}
                    <div className="flex flex-col items-center">
                      <PickMascot size="md" mood="happy" />
                      {assignment.description && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mt-5 w-full">
                          <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {assignment.description}
                          </p>
                          {assignment.hasJudging !== false && (
                            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                              <Scale size={11} />
                              제출 후 AI 심사위원 7명이 평가합니다
                            </p>
                          )}
                        </div>
                      )}
                      {!assignment.description && assignment.hasJudging !== false && (
                        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                          <Scale size={11} />
                          제출 후 AI 심사위원 7명이 평가합니다
                        </p>
                      )}
                    </div>

                    {/* CTA 버튼 */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => setView('submit')}
                        variant="primary"
                        size="lg"
                        className="w-full"
                      >
                        <Send size={16} />
                        과제 제출하기
                      </Button>
                      <Button
                        onClick={() => setView('lookup')}
                        variant="secondary"
                        size="lg"
                        className="w-full"
                      >
                        <Search size={16} />
                        내 제출물 조회
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Judged: 결과 확인 */}
              {isJudged && (
                <div className="flex flex-col justify-center" style={{ minHeight: 'calc(100dvh - 160px)' }}>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-white dark:text-slate-900" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-5">심사 결과 확인</h2>
                    <p className="text-sm text-slate-400 mt-1.5">제출할 때 입력한 이름과 비밀번호를 입력하세요</p>
                  </div>
                  <div className="space-y-3 mt-8">
                    <input type="text" value={lookupName}
                      onChange={(e) => { setLookupName(e.target.value); setResultLookupError(''); }}
                      placeholder="이름"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      autoFocus
                    />
                    <input type="password" inputMode="numeric" pattern="[0-9]*" value={lookupPin}
                      onChange={(e) => { setLookupPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setResultLookupError(''); }}
                      placeholder="비밀번호 (숫자 4자리)"
                      maxLength={4}
                      onKeyDown={(e) => e.key === 'Enter' && handleResultLookup()}
                      className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all tracking-[0.3em] ${
                        resultLookupError ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    {resultLookupError && <p className="text-xs text-red-500">{resultLookupError}</p>}
                    <Button onClick={handleResultLookup} variant="primary" size="lg" disabled={!lookupName.trim() || lookupPin.length !== 4 || resultLookupLoading} className="w-full">
                      {resultLookupLoading ? '조회 중...' : '결과 확인'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Judging: 심사 중 */}
              {isJudging && (
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100dvh - 160px)' }}>
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock size={24} className="text-slate-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-5">심사가 진행 중입니다</h2>
                  <p className="text-sm text-slate-400 mt-1.5 text-center leading-relaxed">
                    심사가 완료되면<br />이 페이지에서 결과를 확인할 수 있어요
                  </p>
                </div>
              )}

              {/* Closed: 마감 */}
              {isClosed && (
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100dvh - 160px)' }}>
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock size={24} className="text-slate-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-5">과제가 마감되었습니다</h2>
                  <p className="text-sm text-slate-400 mt-1.5 text-center leading-relaxed">
                    심사 결과가 나오면<br />이 페이지에서 확인할 수 있어요
                  </p>
                  <button onClick={() => setView('lookup')}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-6 underline underline-offset-2">
                    내 제출물 조회
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── 제출 폼 ── */}
          {view === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SubmissionForm onSubmit={handleSubmit} />
            </motion.div>
          )}

          {/* ── 내 제출물 조회 ── */}
          {view === 'lookup' && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Search size={20} className="text-slate-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-4">내 제출물 조회</h2>
                <p className="text-sm text-slate-400 mt-1">제출 시 입력한 이름과 비밀번호를 입력하세요</p>
              </div>
              <LookupForm
                assignmentId={assignmentId}
                onFound={(sub) => { setFoundSubmission(sub); setView('mySubmission'); }}
              />
            </motion.div>
          )}

          {/* ── 내 제출물 확인 ── */}
          {view === 'mySubmission' && foundSubmission && (
            <motion.div
              key="mySubmission"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MySubmissionView
                submission={foundSubmission}
                assignmentId={assignmentId}
                isOpen={isOpen}
                onBack={() => { setView('landing'); setFoundSubmission(null); }}
                onEdit={() => setView('edit')}
              />
            </motion.div>
          )}

          {/* ── 수정 모드 ── */}
          {view === 'edit' && foundSubmission && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SubmissionForm onSubmit={handleSubmit} existingSubmission={foundSubmission} />
            </motion.div>
          )}

          {/* ── 심사 결과 ── */}
          {view === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SubmissionResult submission={foundSubmission} results={results} awards={awards} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
