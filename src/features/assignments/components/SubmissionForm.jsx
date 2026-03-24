import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileCode2, FileText, Send, Check, X, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';

function FileField({ label, icon: Icon, fileName, onFileChange, onClear, accept, hint }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      {fileName ? (
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
          <Icon size={15} className="text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">{fileName}</span>
          <button type="button" onClick={onClear} className="p-1 rounded text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="group flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all">
          <Upload size={18} className="text-slate-300 dark:text-slate-500 group-hover:text-slate-400 transition-colors" />
          <span className="text-xs text-slate-400">{hint}</span>
          <input type="file" onChange={onFileChange} className="hidden" accept={accept} />
        </label>
      )}
    </div>
  );
}

/**
 * SubmissionForm — 학생 과제 제출 폼.
 */
export default function SubmissionForm({ onSubmit, existingSubmission }) {
  const [name, setName] = useState(existingSubmission?.name || '');
  const [pin, setPin] = useState('');
  const [projectUrl, setProjectUrl] = useState(existingSubmission?.projectUrl || '');
  const [fileContent, setFileContent] = useState(existingSubmission?.fileContent || '');
  const [fileName, setFileName] = useState(existingSubmission?.fileName || '');
  const [prdContent, setPrdContent] = useState(existingSubmission?.prdContent || '');
  const [prdFileName, setPrdFileName] = useState(existingSubmission?.prdFileName || '');
  const [description, setDescription] = useState(existingSubmission?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const readFile = useCallback((file, setContent, setName) => {
    setName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target.result);
    reader.readAsText(file);
  }, []);

  const MAX_FILE_SIZE = 1024 * 1024; // 1MB

  const handleCodeFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기가 1MB를 초과합니다. 더 작은 파일을 선택해주세요.');
      e.target.value = '';
      return;
    }
    readFile(file, setFileContent, setFileName);
  }, [readFile]);

  const handlePrdFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기가 1MB를 초과합니다. 더 작은 파일을 선택해주세요.');
      e.target.value = '';
      return;
    }
    readFile(file, setPrdContent, setPrdFileName);
  }, [readFile]);

  const isEditMode = !!existingSubmission;
  const [pinError, setPinError] = useState('');
  const hasContent = projectUrl.trim() || fileContent;
  const canSubmit = name.trim() && (isEditMode || pin.length === 4) && hasContent && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setPinError('');
    try {
      await onSubmit({
        name: name.trim(),
        pin,
        projectUrl: projectUrl.trim() || null,
        fileContent: fileContent || null,
        fileName: fileName || null,
        prdContent: prdContent || null,
        prdFileName: prdFileName || null,
        description: description.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'PIN_MISMATCH') {
        setPinError('비밀번호가 일치하지 않습니다');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center py-16 space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center"
        >
          <Check size={28} className="text-white dark:text-slate-900" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">제출 완료!</h3>
        <p className="text-sm text-slate-400">심사 결과는 이 링크에서 확인할 수 있어요</p>
        <Button onClick={() => setSubmitted(false)} variant="secondary" size="md">수정하기</Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이름 */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">이름</p>
        <input
          type="text"
          value={name}
          onChange={(e) => !isEditMode && setName(e.target.value)}
          placeholder="이름을 입력하세요"
          maxLength={20}
          readOnly={isEditMode}
          className={`w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
            isEditMode ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800'
          }`}
          autoFocus={!isEditMode}
        />
      </div>

      {/* 비밀번호 4자리 — 수정 모드에서는 숨김 */}
      {!isEditMode && (
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            비밀번호
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
          <p className="text-xs text-slate-300 dark:text-slate-500 mt-1.5">나중에 제출물 조회·수정·취소 시 필요해요</p>
        </div>
      )}

      {/* 프로젝트 URL */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">프로젝트 URL</p>
        <input
          type="url"
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://github.com/... 또는 배포 URL"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* 파일 업로드 — 2칸 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FileField
          label="코드 파일"
          icon={FileCode2}
          fileName={fileName}
          onFileChange={handleCodeFile}
          onClear={() => { setFileName(''); setFileContent(''); }}
          accept=".html,.htm,.css,.js,.jsx,.ts,.tsx,.txt"
          hint="HTML, JS, TXT 등"
        />
        <FileField
          label="PRD / 기획서 / 문서"
          icon={FileText}
          fileName={prdFileName}
          onFileChange={handlePrdFile}
          onClear={() => { setPrdFileName(''); setPrdContent(''); }}
          accept=".md,.txt"
          hint="MD, TXT"
        />
      </div>

      {/* 프로젝트 설명 */}
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
          프로젝트 설명
          <span className="text-slate-300 dark:text-slate-500 ml-1.5 font-normal">선택</span>
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 문제를 해결하는 프로젝트인지 간단히 설명해주세요"
          rows={3}
          maxLength={1000}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all leading-relaxed"
        />
      </div>

      {/* Validation hint */}
      {!hasContent && name.trim() && (
        <p className="text-xs text-slate-400 px-1">URL 또는 코드 파일 중 하나 이상 입력해주세요</p>
      )}

      {/* Submit — sticky bottom */}
      <div className="sticky bottom-0 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] -mx-5 px-5 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/95 dark:via-slate-900/95 to-transparent">
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
          {submitting ? '제출 중...' : existingSubmission ? '수정 제출' : <><Send size={16} /> 제출하기</>}
        </Button>
      </div>
    </form>
  );
}
