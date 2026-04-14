import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2, FileText, Send, Check, X, Upload } from 'lucide-react';
import JSZip from 'jszip';
import Button from '@/components/ui/Button';
import SubmissionPreview from './SubmissionPreview';

const TEXT_EXTS = /\.(html?|css|js|jsx|ts|tsx|json|md|txt|svg|xml|vue)$/i;

async function extractZipAsText(file) {
  const zip = await JSZip.loadAsync(file);
  const entries = [];
  const promises = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (path.startsWith('__MACOSX/') || path.includes('/.DS_Store')) return;
    if (!TEXT_EXTS.test(path)) return;
    promises.push(
      entry.async('string').then((content) => {
        entries.push({ path, content });
      })
    );
  });
  await Promise.all(promises);
  entries.sort((a, b) => {
    const aIsHtml = /\.html?$/i.test(a.path) ? 0 : 1;
    const bIsHtml = /\.html?$/i.test(b.path) ? 0 : 1;
    if (aIsHtml !== bIsHtml) return aIsHtml - bIsHtml;
    return a.path.localeCompare(b.path);
  });
  if (!entries.length) throw new Error('ZIP 안에 텍스트 파일이 없습니다 (HTML/CSS/JS 등).');
  return entries.map(e => `// === ${e.path} ===\n${e.content}`).join('\n\n');
}

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
  const MAX_ZIP_SIZE = 5 * 1024 * 1024; // 5MB

  const handleCodeFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isZip = /\.zip$/i.test(file.name);
    const limit = isZip ? MAX_ZIP_SIZE : MAX_FILE_SIZE;
    if (file.size > limit) {
      alert(`파일 크기가 ${isZip ? '5MB' : '1MB'}를 초과합니다.`);
      e.target.value = '';
      return;
    }
    if (isZip) {
      try {
        const combined = await extractZipAsText(file);
        setFileName(file.name);
        setFileContent(combined);
      } catch (err) {
        alert(`ZIP 파일 처리 실패: ${err.message}`);
        e.target.value = '';
      }
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
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [nameError, setNameError] = useState('');
  const hasContent = !!fileContent;
  const pinMatch = isEditMode || (pin.length === 4 && pin === pinConfirm);
  const canSubmit = name.trim() && (isEditMode || pin.length === 4) && pinMatch && hasContent && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setPinError('');
    setNameError('');
    try {
      await onSubmit({
        name: name.trim(),
        pin,
        fileContent: fileContent || null,
        fileName: fileName || null,
        prdContent: prdContent || null,
        prdFileName: prdFileName || null,
        description: description.trim() || null,
      }, { isEdit: isEditMode });
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'PIN_MISMATCH') {
        setPinError('비밀번호가 일치하지 않습니다');
      } else if (err.message === 'NAME_TAKEN') {
        setNameError('이미 사용 중인 이름입니다. 다른 이름을 쓰거나, 본인 제출물 수정이라면 "내 제출물 조회"를 이용하세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
    {submitted ? (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
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
        <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-4 py-3 text-center">
          <p className="text-xs text-slate-400 mb-1">결과 확인 방법</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">이 페이지에 다시 방문해서<br /><span className="font-semibold text-slate-900 dark:text-slate-100">이름 + 비밀번호</span>로 조회하세요</p>
        </div>
        <Button onClick={() => setSubmitted(false)} variant="secondary" size="md">수정하기</Button>
      </motion.div>
    ) : (
      <motion.div
        key="form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.15 }}
      >
      <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* 비밀번호 확인 — 신규 제출 시만 */}
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
            비밀번호 확인
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
            <p className="text-xs text-red-500 mt-1.5">비밀번호가 일치하지 않습니다</p>
          )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 파일 업로드 — 2칸 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FileField
          label="코드 파일"
          icon={FileCode2}
          fileName={fileName}
          onFileChange={handleCodeFile}
          onClear={() => { setFileName(''); setFileContent(''); }}
          accept=".html,.htm,.css,.js,.jsx,.ts,.tsx,.txt,.zip"
          hint="HTML, JS, ZIP 등"
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
        <p className="text-xs text-slate-400 px-1">코드 파일을 업로드해주세요</p>
      )}

      {/* AI 예심 */}
      {hasContent && (
        <SubmissionPreview
          submission={{
            name: name.trim() || '익명',
            fileContent,
            prdContent,
            description,
          }}
          disabled={!hasContent}
        />
      )}

      {/* Submit — sticky bottom */}
      <div className="sticky bottom-0 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] -mx-5 px-5 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/95 dark:via-slate-900/95 to-transparent">
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
          {submitting ? '제출 중...' : existingSubmission ? '수정 제출' : <><Send size={16} /> 제출하기</>}
        </Button>
      </div>
    </form>
      </motion.div>
    )}
    </AnimatePresence>
  );
}
