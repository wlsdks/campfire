import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, Check, X, Upload, Plus, Loader2, Code2, AlertCircle, Info } from 'lucide-react';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import SubmissionPreview from './SubmissionPreview';
import SubmissionSuccessView from './SubmissionSuccessView';

const MAX_SCREENSHOTS = 10;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB per image
const MAX_PRD_CHARS = 10000;
const MAX_CODE_CHARS = 50000; // HTML 코드 길이 제한 (라이브 AI 심사와 동일)

function ScreenshotThumb({ shot, onRemove, idx }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative group rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900 aspect-square"
    >
      {shot.uploading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="text-slate-400 animate-spin" />
        </div>
      ) : shot.error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-center">
          <X size={16} className="text-red-400" />
          <p className="text-[10px] text-red-500 leading-tight line-clamp-2">{shot.error}</p>
        </div>
      ) : (
        <img src={shot.url} alt={shot.name || `스크린샷 ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
      )}
      {!shot.uploading && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          aria-label="이미지 삭제"
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
        >
          <X size={12} />
        </button>
      )}
      <span className="absolute bottom-1 left-1.5 text-[10px] text-white bg-slate-900/60 rounded px-1.5 py-0.5 font-medium">
        {idx + 1}
      </span>
    </motion.div>
  );
}

/**
 * SubmissionForm — 학생 과제 제출 폼.
 * PRD 텍스트(필수) + HTML 코드(필수) + 결과물 스크린샷 다중(선택).
 */
export default function SubmissionForm({ onSubmit, existingSubmission, assignmentId }) {
  const [name, setName] = useState(existingSubmission?.name || '');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [prdContent, setPrdContent] = useState(existingSubmission?.prdContent || '');
  const [screenshots, setScreenshots] = useState(
    Array.isArray(existingSubmission?.screenshots) ? existingSubmission.screenshots : []
  );
  const [code, setCode] = useState(existingSubmission?.code || '');
  const [codeFileName, setCodeFileName] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pinError, setPinError] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);
  const htmlInputRef = useRef(null);

  const isEditMode = !!existingSubmission;

  const handleAddScreenshots = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // 같은 파일 재선택 가능하게
    if (!files.length) return;

    const remaining = MAX_SCREENSHOTS - screenshots.length;
    if (remaining <= 0) {
      alert(`최대 ${MAX_SCREENSHOTS}장까지 업로드 가능합니다.`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      alert(`최대 ${MAX_SCREENSHOTS}장까지 가능합니다. ${remaining}장만 업로드합니다.`);
    }

    // 1) placeholder 추가 (uploading 상태)
    const placeholders = toUpload.map((f) => ({
      tempId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      uploading: true,
    }));
    setScreenshots((prev) => [...prev, ...placeholders]);

    // 2) 병렬 업로드
    await Promise.all(
      toUpload.map(async (file, i) => {
        const placeholder = placeholders[i];
        try {
          if (!file.type.startsWith('image/')) {
            throw new Error('이미지 파일만 업로드 가능');
          }
          if (file.size > MAX_IMAGE_SIZE) {
            throw new Error(`15MB 초과 (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
          }
          if (!assignmentId) {
            throw new Error('assignmentId 없음');
          }
          const dotIdx = file.name.lastIndexOf('.');
          const ext = (dotIdx > 0 ? file.name.slice(dotIdx + 1) : 'png').toLowerCase();
          const stem = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
          const safeStem = (stem.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)) || 'img';
          const path = `assignments/${assignmentId}/screenshots/${placeholder.tempId}_${safeStem}.${ext}`;
          const ref = sRef(storage, path);
          await uploadBytes(ref, file, { contentType: file.type });
          const url = await getDownloadURL(ref);
          setScreenshots((prev) =>
            prev.map((s) =>
              s.tempId === placeholder.tempId
                ? { url, name: file.name, size: file.size, path }
                : s
            )
          );
        } catch (err) {
          setScreenshots((prev) =>
            prev.map((s) =>
              s.tempId === placeholder.tempId
                ? { ...s, uploading: false, error: err.message || '업로드 실패' }
                : s
            )
          );
        }
      })
    );
  }, [screenshots.length, assignmentId]);

  const removeScreenshot = useCallback((idx) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // HTML 파일 업로드 — .html/.htm만 허용. 크기 초과 시 앞부분만 사용.
  const handleHtmlFile = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const isHtml = /\.(html|htm)$/i.test(file.name);
    if (!isHtml) {
      setCodeError('HTML 파일(.html, .htm)만 업로드할 수 있어요');
      setTimeout(() => setCodeError(''), 3500);
      if (htmlInputRef.current) htmlInputRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      const truncated = text.slice(0, MAX_CODE_CHARS);
      setCode(truncated);
      setCodeFileName(file.name);
      if (text.length > MAX_CODE_CHARS) {
        setCodeError(`파일이 50KB를 초과해 앞부분만 사용됩니다 (${Math.round(text.length / 1024)}KB)`);
        setTimeout(() => setCodeError(''), 4000);
      }
    } catch (err) {
      setCodeError(err?.message || '파일 읽기 실패');
      setTimeout(() => setCodeError(''), 3500);
    } finally {
      if (htmlInputRef.current) htmlInputRef.current.value = '';
    }
  }, []);

  const validShots = screenshots.filter((s) => s.url && !s.error);
  const anyUploading = screenshots.some((s) => s.uploading);
  const hasPrd = prdContent.trim().length >= 50;
  const hasCode = code.trim().length > 0;
  const pinMatch = isEditMode || (pin.length === 4 && pin === pinConfirm);
  const canSubmit = name.trim() && (isEditMode || pin.length === 4) && pinMatch
    && hasPrd && hasCode && !anyUploading && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setPinError('');
    setNameError('');
    setSubmitError('');
    try {
      await onSubmit({
        name: name.trim(),
        pin,
        prdContent: prdContent.trim() || null,
        screenshots: validShots.map((s) => ({ url: s.url, name: s.name, size: s.size, path: s.path })),
        code: code.trim() || null,
      }, { isEdit: isEditMode });
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'PIN_MISMATCH') {
        setPinError('조회용 비밀번호가 일치하지 않습니다');
      } else if (err.message === 'NAME_TAKEN') {
        setNameError('이미 사용 중인 이름입니다. 다른 이름을 쓰거나, 본인 제출물 수정이라면 "내 제출물 조회"를 이용하세요.');
      } else {
        console.error('[submission] failed', err);
        setSubmitError('제출에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
    {submitted ? (
      <SubmissionSuccessView onEdit={() => setSubmitted(false)} />
    ) : (
      <motion.div
        key="form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.15 }}
      >
      <form onSubmit={handleSubmit} className="space-y-5 pb-4">
      {/* 이름 */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">이름</p>
        <input
          type="text"
          value={name}
          onChange={(e) => { if (!isEditMode) { setName(e.target.value); setNameError(''); } }}
          placeholder="이름을 입력하세요"
          maxLength={20}
          readOnly={isEditMode}
          className={`w-full border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
            nameError
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-white dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
          } ${isEditMode ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800'}`}
          autoFocus={!isEditMode}
        />
        {nameError && <p className="text-xs text-red-500 mt-1.5 leading-relaxed">{nameError}</p>}
      </div>

      {/* 조회용 비밀번호 4자리 — 수정 모드에서는 숨김 */}
      {!isEditMode && (
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            조회용 비밀번호
            <span className="text-slate-300 dark:text-slate-500 ml-1.5 font-normal">숫자 4자리</span>
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(v);
              setPinError('');
            }}
            placeholder="••••"
            maxLength={4}
            className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all tracking-[0.3em] ${
              pinError
                ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
            }`}
          />
          {pinError && <p className="text-xs text-red-500 mt-1.5">{pinError}</p>}
          <p className="text-xs text-slate-300 dark:text-slate-500 mt-1.5">나중에 본인 제출물 조회·수정·취소 시 필요해요</p>
        </div>
      )}

      {/* 조회용 비밀번호 확인 — 신규 제출 시만 */}
      <AnimatePresence>
      {!isEditMode && pin.length === 4 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="overflow-hidden"
        >
          <div className="pt-1">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            조회용 비밀번호 확인
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            maxLength={4}
            className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all tracking-[0.3em] ${
              pinConfirm.length === 4 && pin !== pinConfirm
                ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
            }`}
          />
          {pinConfirm.length === 4 && pin !== pinConfirm && (
            <p className="text-xs text-red-500 mt-1.5">조회용 비밀번호가 일치하지 않습니다</p>
          )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* PRD 작성 — 필수 */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
          PRD 작성
          <span className="text-red-500 ml-1.5 font-normal">필수</span>
        </p>
        <textarea
          value={prdContent}
          onChange={(e) => setPrdContent(e.target.value.slice(0, MAX_PRD_CHARS))}
          placeholder={`어떤 문제를 풀려고 했는지 / 누구를 위한 건지 / 어떤 기능을 만들었는지 자유롭게 작성해주세요.\n\n예) 우리 팀 회의록을 짧게 요약해주는 도구를 만들었습니다. 회의 끝나고 정리하는 게 너무 오래 걸려서…`}
          rows={8}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y transition-all leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-slate-300 dark:text-slate-500">
            {prdContent.trim().length < 50 && prdContent.trim().length > 0 && `조금 더 길게 작성해주세요 (50자 이상, 현재 ${prdContent.trim().length}자)`}
          </p>
          <p className="text-xs text-slate-300 dark:text-slate-500 tabular-nums">{prdContent.length.toLocaleString()}/{MAX_PRD_CHARS.toLocaleString()}</p>
        </div>
      </div>

      {/* HTML 코드 / 파일 — 필수 */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Code2 size={13} className="text-slate-400" />
          결과물 HTML 코드
          <span className="text-red-500 ml-1 font-normal">필수</span>
          <Tooltip
            multiline
            label={`HTML 코드 확인하는 법\n\n1) 만든 결과물(웹페이지)에서 마우스 우클릭 → "페이지 소스 보기"\n2) 전체 선택(Ctrl/Cmd + A) → 복사 → 아래 칸에 붙여넣기\n\n또는 .html 파일이 있다면 "HTML 파일 선택" 버튼으로 첨부할 수 있어요.\n\nAI 심사위원이 코드를 보고 평가합니다.`}
          >
            <button
              type="button"
              aria-label="HTML 코드 확인 방법 안내"
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Info size={13} />
            </button>
          </Tooltip>
        </p>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); htmlInputRef.current?.click(); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-[12px] font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <Upload size={13} /> HTML 파일 선택
          </button>
          {codeFileName && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <Check size={12} className="text-emerald-500 shrink-0" />
              <span className="truncate">{codeFileName}</span>
            </span>
          )}
          <input
            ref={htmlInputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleHtmlFile}
            className="sr-only"
            aria-label="HTML 파일 업로드"
          />
        </div>
        <textarea
          value={code}
          onChange={(e) => { setCode(e.target.value.slice(0, MAX_CODE_CHARS)); if (codeFileName) setCodeFileName(''); }}
          placeholder="파일을 선택하거나 HTML 코드를 직접 붙여넣으세요"
          aria-label="HTML 코드"
          rows={8}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-[13px] font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y transition-all leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <AnimatePresence>
            {codeError ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                role="alert"
                className="text-[11px] text-red-500 flex items-center gap-1"
              >
                <AlertCircle size={11} /> {codeError}
              </motion.p>
            ) : (
              <p className="text-xs text-slate-300 dark:text-slate-500">파일 업로드 또는 직접 붙여넣기</p>
            )}
          </AnimatePresence>
          <p className="text-xs text-slate-300 dark:text-slate-500 tabular-nums">{code.length.toLocaleString()}/{MAX_CODE_CHARS.toLocaleString()}</p>
        </div>
      </div>

      {/* 결과물 스크린샷 — 다중 업로드 (선택) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            결과물 스크린샷
            <span className="text-slate-300 dark:text-slate-500 ml-0.5 font-normal">선택</span>
            <Tooltip
              multiline
              label={`전체 화면을 캡쳐해서 첨부하면 더 정확한 평가를 받을 수 있어요.\n\n[Windows]\n• Windows + PrtSc — 전체 화면을 자동으로 "사진 > 스크린샷" 폴더에 저장\n• 또는 캡쳐 도구(Snipping Tool) 사용\n\n[Mac]\n• Command + Shift + 3 — 전체 화면을 바탕화면에 자동 저장\n• Command + Shift + 4 — 영역 지정 캡쳐`}
            >
              <button
                type="button"
                aria-label="스크린샷 캡쳐 방법 안내"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Info size={13} />
              </button>
            </Tooltip>
          </p>
          <p className="text-[11px] text-slate-300 dark:text-slate-500">
            {validShots.length}/{MAX_SCREENSHOTS}장
          </p>
        </div>

        {screenshots.length === 0 ? (
          <label className="group flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all">
            <Upload size={20} className="text-slate-300 dark:text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">스크린샷 선택</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">PNG · JPG · 최대 {MAX_SCREENSHOTS}장 · 장당 15MB</span>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleAddScreenshots}
              className="hidden"
              accept="image/*"
              multiple
            />
          </label>
        ) : (
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <AnimatePresence>
                {screenshots.map((shot, i) => (
                  <ScreenshotThumb
                    key={shot.url || shot.tempId || i}
                    shot={shot}
                    onRemove={removeScreenshot}
                    idx={i}
                  />
                ))}
              </AnimatePresence>

              {validShots.length < MAX_SCREENSHOTS && (
                <label className="group flex flex-col items-center justify-center gap-1 aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all">
                  <Plus size={18} className="text-slate-300 dark:text-slate-500 group-hover:text-slate-400" />
                  <span className="text-[10px] text-slate-400">추가</span>
                  <input
                    type="file"
                    onChange={handleAddScreenshots}
                    className="hidden"
                    accept="image/*"
                    multiple
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-500 mt-2 flex items-center gap-1.5">
              <ImageIcon size={11} />
              결과물을 보여줄 화면이 있으면 첨부하세요. 여러 장 한 번에 선택 가능합니다.
            </p>
          </div>
        )}
      </div>

      {/* Validation hint — 제출 가로막는 모든 사유 표시 */}
      {!canSubmit && !submitting && (name.trim() || prdContent.trim() || code.trim()) && (
        <div className="text-xs text-slate-400 px-1 space-y-0.5">
          {!name.trim() && <p>· 이름을 입력해주세요</p>}
          {!isEditMode && pin.length !== 4 && <p>· 조회용 비밀번호 4자리를 입력해주세요</p>}
          {!isEditMode && pin.length === 4 && pin !== pinConfirm && <p>· 조회용 비밀번호 확인이 일치하지 않습니다</p>}
          {!hasPrd && <p>· PRD를 작성해주세요 (50자 이상)</p>}
          {!hasCode && <p>· 결과물 HTML 코드를 입력하거나 파일을 첨부해주세요</p>}
          {anyUploading && <p>· 이미지 업로드가 끝날 때까지 기다려주세요</p>}
        </div>
      )}

      {/* AI 예심 */}
      {hasPrd && hasCode && (
        <SubmissionPreview
          submission={{
            name: name.trim() || '익명',
            prdContent,
            screenshots: validShots,
            code,
          }}
          disabled={!hasPrd || !hasCode}
        />
      )}

      {submitError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-100 dark:ring-red-900/40 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit — sticky bottom */}
      <div className="sticky bottom-0 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] -mx-5 px-5 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/95 dark:via-slate-900/95 to-transparent">
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
          {submitting ? '제출 중...'
            : anyUploading ? '업로드 중...'
            : existingSubmission ? '수정 제출'
            : <><Send size={16} /> 제출하기</>}
        </Button>
      </div>
    </form>
      </motion.div>
    )}
    </AnimatePresence>
  );
}
