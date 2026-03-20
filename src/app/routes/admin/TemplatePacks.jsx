import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Check } from 'lucide-react';
import { TEMPLATE_PACKS } from '@/lib/template-packs';
import { QUESTION_TYPES } from '@/lib/question-types';
import Button from '@/components/ui/Button';

function PackQuestionPreview({ question, index }) {
  const qType = QUESTION_TYPES.find((t) => t.value === question.type);
  const Icon = qType?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className="flex items-start gap-2.5 py-2"
    >
      <span className="text-xs font-bold text-slate-300 mt-0.5 w-4 shrink-0 text-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {Icon && <Icon size={11} className="text-slate-400 shrink-0" />}
          <span className="text-[11px] font-medium text-slate-400">{qType?.label}</span>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">{question.title}</p>
      </div>
    </motion.div>
  );
}

function PackCard({ pack, onImport, imported }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabels = [...new Set(pack.questions.map((q) => q.type))];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 active:bg-slate-50 transition-colors"
      >
        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{pack.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 text-sm font-semibold">{pack.name}</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{pack.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {typeLabels.map((t) => {
              const qt = QUESTION_TYPES.find((x) => x.value === t);
              return (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 font-medium">
                  {qt?.label}
                </span>
              );
            })}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400">
              {pack.questions.length}개
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-300 mt-1 shrink-0"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Expanded: question preview + import button */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="divide-y divide-slate-50">
                {pack.questions.map((q, i) => (
                  <PackQuestionPreview key={i} question={q} index={i} />
                ))}
              </div>
              <div className="pt-3">
                {imported ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-sm text-slate-400 font-medium">
                    <Check size={14} />
                    추가 완료
                  </div>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImport(pack);
                    }}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    <Download size={14} />
                    보관함에 추가
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TemplatePacks({ onImportPack }) {
  const [imported, setImported] = useState(new Set());

  function handleImport(pack) {
    onImportPack(pack.questions);
    setImported((prev) => new Set(prev).add(pack.id));
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-600">템플릿 팩</h3>
        <p className="text-slate-400 text-xs mt-0.5">
          바로 사용할 수 있는 질문 모음
        </p>
      </div>
      <div className="space-y-2">
        {TEMPLATE_PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onImport={handleImport}
            imported={imported.has(pack.id)}
          />
        ))}
      </div>
    </div>
  );
}
