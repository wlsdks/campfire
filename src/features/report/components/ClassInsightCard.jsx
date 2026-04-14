import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, TrendingUp, Target, Info, RefreshCw } from 'lucide-react';
import { generateClassInsight, isInsightReady } from '@/features/report/api/generateClassInsight';

const SEVERITY_STYLES = {
  high: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  medium: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  low: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

export default function ClassInsightCard({ session, participantCount, insights, topStudent, avgCorrectRate, activityRate }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isInsightReady()) return null;
  if (!insights || insights.length < 2 || participantCount < 3) return null;

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const r = await generateClassInsight({ session, participantCount, insights, topStudent, avgCorrectRate, activityRate });
      setResult(r);
    } catch (err) {
      setError(err.message || '인사이트 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-slate-500 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">AI 수업 인사이트</p>
          <p className="text-[12px] text-slate-400">오늘 데이터로 다음 수업 개선점 추천</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
            loading
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
          }`}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : result ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {loading ? '분석 중' : result ? '다시 분석' : '분석하기'}
        </button>
      </div>

      {error && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {!result.canAnalyze ? (
              <div className="px-5 pb-5 pt-1">
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 px-3 py-2.5">
                  <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    {result.reason || '의미 있는 인사이트를 도출하기에 데이터가 부족해요.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700 space-y-4">
                {result.overallSummary && (
                  <div className="pt-3">
                    <p className="text-[14px] text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                      {result.overallSummary}
                    </p>
                  </div>
                )}

                {result.keyFindings?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={13} className="text-slate-500 dark:text-slate-400" />
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">핵심 발견</p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.keyFindings.map((f, i) => (
                        <li key={i} className={`rounded-lg border px-3 py-2 text-[13px] leading-relaxed ${SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.medium}`}>
                          {f.finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.nextClassActions?.length > 0 && (
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target size={13} className="text-indigo-600 dark:text-indigo-400" />
                      <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">다음 수업 액션 추천</p>
                    </div>
                    <ol className="space-y-1.5">
                      {result.nextClassActions.map((a, i) => (
                        <li key={i} className="text-[13px] text-indigo-900 dark:text-indigo-100 leading-relaxed pl-5 relative">
                          <span className="absolute left-0 top-0 font-semibold">{i + 1}.</span>{a}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.participationPattern && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">참여 패턴</p>
                    <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">{result.participationPattern}</p>
                  </div>
                )}

                {result.caveats && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2">
                    <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{result.caveats}</p>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 italic">AI가 통계 데이터만 근거로 작성한 참고용 해석입니다</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
