import { DRAW_DISPLAY } from '@/lib/draw-display';

const OPTIONS = [
  { value: DRAW_DISPLAY.NAME, label: '이름 보기' },
  { value: DRAW_DISPLAY.EMPLOYEE_ID, label: '사번 보기' },
];

/**
 * 추첨 화면에서 이름을 앞세울지 사번을 앞세울지 고르는 스위치.
 * 사번이 등록된 명단에서만 의미가 있어, 호출부에서 그 조건을 판단해 렌더한다.
 */
export default function DrawDisplayToggle({ mode, onChange, presenter = false }) {
  return (
    <div
      role="radiogroup"
      aria-label="추첨 표시 기준"
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 p-1"
    >
      {OPTIONS.map((option) => {
        const on = mode === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={`rounded-full font-medium transition-colors duration-150 ${
              presenter ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-xs'
            } ${
              on
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
