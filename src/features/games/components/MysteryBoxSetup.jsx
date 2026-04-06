import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Play } from 'lucide-react';
import Button from '@/components/ui/Button';
import MysteryBox from './MysteryBox';

/**
 * MysteryBoxSetup — 설정 화면 + 실행 화면을 한 컴포넌트에서 관리.
 * 프레젠터 화면 전용 (Firebase 저장 없이 로컬 상태).
 */
export default function MysteryBoxSetup() {
  const [started, setStarted] = useState(false);
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [itemsText, setItemsText] = useState('');

  if (started && answer.trim()) {
    const items = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
    return <MysteryBox items={items} answer={answer.trim()} title={title.trim()} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
      >
        <HelpCircle size={32} className="text-slate-400" />
      </motion.div>

      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">미스터리 박스</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center">? 박스에서 텍스트가 빠르게 돌다가<br />정답 보기를 누르면 멈춥니다</p>

      <div className="w-full space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">타이틀 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="이것은 무엇일까요?"
            maxLength={50}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">정답 (필수)</label>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="정답을 입력하세요"
            maxLength={50}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">돌아갈 텍스트 (줄바꿈 구분, 비우면 ? 표시)</label>
          <textarea
            value={itemsText}
            onChange={e => setItemsText(e.target.value)}
            placeholder={"사과\n바나나\n딸기\n포도"}
            rows={4}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors duration-150"
          />
        </div>
      </div>

      <Button onClick={() => setStarted(true)} variant="primary" size="lg" disabled={!answer.trim()}>
        <Play size={18} />
        시작
      </Button>
    </div>
  );
}
