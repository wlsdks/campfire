import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QUIZ_DEFAULTS } from '@/lib/quiz';
import { QUESTION_TYPES } from '@/lib/question-types';
import {
  ChoiceOptionsSection,
  CorrectAnswerSection,
  RankingOptionsSection,
  FillBlankSection,
  OXAnswerSection,
  QuizSettingsSection,
  MysteryBoxSection,
  HintQuizSection,
} from './QuestionFormSections';

const INPUT = 'w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150';

export default function QuestionForm({ onSubmit, onCancel, error, initialData }) {
  const isEdit = !!initialData;
  const [type, setType] = useState(initialData?.type || 'choice');
  const [title, setTitle] = useState(initialData?.title || '');
  const [options, setOptions] = useState(
    initialData?.options?.length ? [...initialData.options] : ['', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correctAnswer || '');
  const [points, setPoints] = useState(initialData?.points || QUIZ_DEFAULTS.points);
  const [event, setEvent] = useState(initialData?.event || null);
  const [betting, setBetting] = useState(initialData?.betting || false);
  const [hints, setHints] = useState(initialData?.hints?.length ? [...initialData.hints] : ['', '']);
  const [mysteryItems, setMysteryItems] = useState(initialData?.mysteryItems?.join('\n') || '');
  const [answerReasons, setAnswerReasons] = useState(initialData?.answerReasons?.length ? [...initialData.answerReasons] : []);
  const [acceptableAnswers, setAcceptableAnswers] = useState(initialData?.acceptableAnswers?.length ? [...initialData.acceptableAnswers] : []);
  const [winners, setWinners] = useState(initialData?.winners?.length ? [...initialData.winners] : []);
  const [localError, setLocalError] = useState(null);

  const isChoiceLike = type === 'choice' || type === 'quiz';
  const isRanking = type === 'ranking';
  const isFillInBlank = type === 'fillinblank';
  const isMysteryBox = type === 'mysteryBox';
  const isHintQuiz = type === 'hintQuiz';

  async function handleAdd() {
    if (!title.trim()) { setLocalError('질문 내용을 입력해주세요.'); return; }
    const cleanOptions = options.filter((o) => o.trim());
    if (isChoiceLike && cleanOptions.length < 2) { setLocalError('최소 2개의 선택지가 필요합니다.'); return; }
    if (isRanking && cleanOptions.length < 3) { setLocalError('순위 맞추기는 최소 3개 항목이 필요합니다.'); return; }
    if (isFillInBlank && !title.includes('___')) { setLocalError('빈칸 위치를 ___ (밑줄 3개)로 표시해주세요.'); return; }
    if (isFillInBlank && !correctAnswer.trim()) { setLocalError('정답을 입력해주세요.'); return; }
    if ((type === 'quiz' || type === 'choice') && !correctAnswer) { setLocalError('정답을 선택해주세요.'); return; }
    if (type === 'ox' && !correctAnswer) { setLocalError('정답을 선택해주세요.'); return; }
    if (isMysteryBox && !correctAnswer.trim()) { setLocalError('정답을 입력해주세요.'); return; }
    if (isHintQuiz && !correctAnswer.trim()) { setLocalError('정답을 입력해주세요.'); return; }
    if (isHintQuiz && hints.filter(h => h.trim()).length === 0) { setLocalError('최소 1개의 힌트가 필요합니다.'); return; }
    setLocalError(null);
    const submitData = { type, title, options: cleanOptions, correctAnswer, points, event, betting };
    if (isMysteryBox) {
      submitData.mysteryItems = mysteryItems.split('\n').map(s => s.trim()).filter(Boolean);
      const validReasons = answerReasons.filter(r => r.trim());
      if (validReasons.length > 0) submitData.answerReasons = validReasons;
    }
    if (isHintQuiz) {
      submitData.hints = hints.filter(h => h.trim());
      const validAcceptable = acceptableAnswers.filter(a => a.trim());
      if (validAcceptable.length > 0) submitData.acceptableAnswers = validAcceptable;
    }
    if (isMysteryBox || isHintQuiz) {
      const validWinners = winners.filter(w => w.trim());
      if (validWinners.length > 0) submitData.winners = validWinners;
    }
    const success = await onSubmit(submitData);
    if (success) {
      setTitle(''); setOptions(['', '']); setCorrectAnswer('');
      setPoints(QUIZ_DEFAULTS.points); setEvent(null); setBetting(false);
      onCancel();
    }
  }

  const displayError = localError || error;

  return (
    <div>
      {/* 질문 유형 */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">질문 유형</p>
        <div className="grid grid-cols-5 max-sm:grid-cols-4 gap-1.5">
          {QUESTION_TYPES.map((t) => {
            const Icon = t.icon;
            const selected = type === t.value;
            return (
              <motion.button key={t.value}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  setType(t.value); setLocalError(null);
                  if (t.value === 'ranking' && options.length < 3) setOptions(['', '', '']);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-colors duration-150 ${
                  selected ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-400 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <Icon size={20} strokeWidth={selected ? 2 : 1.6} />
                <span className="text-[11px] font-medium leading-tight">{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 질문 내용 */}
      <div className="pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">질문 내용</p>
        <textarea value={title}
          onChange={(e) => { setTitle(e.target.value); setLocalError(null); }}
          placeholder={isFillInBlank ? 'HTTP 상태코드 ___는 페이지를 찾을 수 없음을 의미한다' : type === 'check' ? '실습을 완료하셨으면 체크해주세요' : '학생들에게 보여줄 질문을 입력하세요'}
          aria-label="질문 내용" rows={3}
          className={`${INPUT} resize-none text-base leading-relaxed`} autoFocus />
      </div>

      {/* Type-specific sections */}
      <AnimatePresence>
        {isChoiceLike && <ChoiceOptionsSection options={options} setOptions={setOptions}
          correctAnswer={correctAnswer} setCorrectAnswer={setCorrectAnswer} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {isRanking && <RankingOptionsSection options={options} setOptions={setOptions} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {isFillInBlank && <FillBlankSection title={title} correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {isChoiceLike && <CorrectAnswerSection options={options} correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {type === 'quiz' && <QuizSettingsSection points={points} setPoints={setPoints}
          event={event} setEvent={setEvent} betting={betting} setBetting={setBetting} />}
      </AnimatePresence>
      <AnimatePresence>
        {type === 'ox' && <OXAnswerSection correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {isMysteryBox && <MysteryBoxSection correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer} mysteryItems={mysteryItems}
          setMysteryItems={setMysteryItems} answerReasons={answerReasons}
          setAnswerReasons={setAnswerReasons} winners={winners}
          setWinners={setWinners} setLocalError={setLocalError} />}
      </AnimatePresence>
      <AnimatePresence>
        {isHintQuiz && <HintQuizSection correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer} hints={hints}
          setHints={setHints} acceptableAnswers={acceptableAnswers}
          setAcceptableAnswers={setAcceptableAnswers} winners={winners}
          setWinners={setWinners} setLocalError={setLocalError} />}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {displayError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} role="alert"
            className="text-red-500 text-sm flex items-center gap-1.5 pt-3">
            <AlertCircle size={14} />{displayError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="secondary" size="md" className="flex-1">취소</Button>
        <Button onClick={handleAdd} variant="primary" size="md" className="flex-[2]">{isEdit ? '수정하기' : '추가하기'}</Button>
      </div>
    </div>
  );
}
