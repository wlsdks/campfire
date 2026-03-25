import { Search, X } from 'lucide-react';
import { QUESTION_TYPES } from '@/lib/question-types';

const TYPE_FILTERS = [
  { value: 'all', label: '전체' },
  ...QUESTION_TYPES,
];

export default function LibrarySearchFilter({ searchQuery, onSearchChange, typeFilter, onTypeChange }) {
  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="질문 검색..."
          aria-label="질문 검색"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors duration-150"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150"
            aria-label="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type filter — horizontally scrollable */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {TYPE_FILTERS.map((f) => {
          const isSelected = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => onTypeChange(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
