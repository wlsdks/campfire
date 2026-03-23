import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Link, FileText, Send, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * SubmissionForm — 학생 과제 제출 폼.
 * 모바일 우선 디자인. 이름 + URL/파일/설명 입력.
 */
export default function SubmissionForm({ onSubmit, existingSubmission }) {
  const [name, setName] = useState(existingSubmission?.name || '');
  const [projectUrl, setProjectUrl] = useState(existingSubmission?.projectUrl || '');
  const [fileContent, setFileContent] = useState(existingSubmission?.fileContent || '');
  const [fileName, setFileName] = useState(existingSubmission?.fileName || '');
  const [description, setDescription] = useState(existingSubmission?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target.result);
    reader.readAsText(file);
  }, []);

  const hasContent = projectUrl.trim() || fileContent;
  const canSubmit = name.trim() && hasContent && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        projectUrl: projectUrl.trim() || null,
        fileContent: fileContent || null,
        fileName: fileName || null,
        description: description.trim() || null,
      });
      setSubmitted(true);
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
        className="text-center py-12 space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center"
        >
          <Check size={28} className="text-white dark:text-slate-900" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">제출 완료!</h3>
        <p className="text-slate-400 text-[15px]">심사 결과는 이 링크에서 확인할 수 있어요</p>
        <Button onClick={() => setSubmitted(false)} variant="secondary" size="md">수정하기</Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이름 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          maxLength={20}
          className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3.5 text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          autoFocus
        />
      </div>

      {/* 프로젝트 URL */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Link size={14} className="text-slate-400" />
          프로젝트 URL
          <span className="text-slate-400 font-normal">선택</span>
        </label>
        <input
          type="url"
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://github.com/... 또는 배포 URL"
          className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3.5 text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* 파일 업로드 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Upload size={14} className="text-slate-400" />
          파일 업로드
          <span className="text-slate-400 font-normal">선택</span>
        </label>
        <label className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-150">
          <FileText size={18} className="text-slate-400 shrink-0" />
          <span className={`text-[16px] flex-1 truncate ${fileName ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
            {fileName || 'HTML, ZIP, PDF 등'}
          </span>
          <input type="file" onChange={handleFileChange} className="hidden" accept=".html,.htm,.zip,.pdf,.md,.txt" />
        </label>
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          프로젝트 설명
          <span className="text-slate-400 font-normal">선택</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 문제를 해결하는 프로젝트인지 간단히 설명해주세요"
          rows={3}
          maxLength={1000}
          className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3.5 text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
        />
      </div>

      {/* Validation hint */}
      {!hasContent && name.trim() && (
        <p className="text-sm text-slate-400">URL 또는 파일 중 하나 이상 입력해주세요</p>
      )}

      {/* Submit */}
      <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
        {submitting ? '제출 중...' : existingSubmission ? '수정 제출' : <><Send size={16} /> 제출하기</>}
      </Button>
    </form>
  );
}
