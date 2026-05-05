/**
 * PRD 텍스트 입력 필드 — 학생 과제 제출 폼의 PRD 작성 영역.
 * 50자 이상이면 hasPrd=true (validation은 부모가 담당).
 */
export default function PrdField({ value, onChange, maxChars }) {
  const trimmedLen = value.trim().length;
  return (
    <div>
      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
        PRD 작성
        <span className="text-red-500 ml-1.5 font-normal">필수</span>
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        placeholder={`어떤 문제를 풀려고 했는지 / 누구를 위한 건지 / 어떤 기능을 만들었는지 자유롭게 작성해주세요.\n\n예) 우리 팀 회의록을 짧게 요약해주는 도구를 만들었습니다. 회의 끝나고 정리하는 게 너무 오래 걸려서…`}
        rows={8}
        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y transition-all leading-relaxed"
      />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-slate-300 dark:text-slate-500">
          {trimmedLen < 50 && trimmedLen > 0 && `조금 더 길게 작성해주세요 (50자 이상, 현재 ${trimmedLen}자)`}
        </p>
        <p className="text-xs text-slate-300 dark:text-slate-500 tabular-nums">
          {value.length.toLocaleString()}/{maxChars.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
