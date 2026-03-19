import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateQuestionId } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Check, Circle, Cloud, Copy, MessageSquare, Play, Plus, Square, Trash2, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import QuizEventBanner from '@/features/quiz/components/QuizEventBanner';
import {
  QUIZ_DEFAULTS,
  QUIZ_EVENT_PRESETS,
  getQuestionMode,
  getQuizReward,
  isQuizQuestion,
  normalizeQuizEvent,
} from '@/lib/quiz';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

function getNow() {
  return Date.now();
}

export default function QuestionManager({
  sessionId,
  questions,
  currentQuestion,
  scores = {},
  participants = {},
  pendingEvent = null,
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('choice');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState('');

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  const activeIndex = questionList.findIndex(([qId]) => qId === currentQuestion);
  const currentEntry = activeIndex >= 0 ? questionList[activeIndex] : null;
  const nextEntry = activeIndex >= 0 ? questionList[activeIndex + 1] : questionList[0];
  const nextQuizEvent = normalizeQuizEvent(pendingEvent);
  const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';

  async function handleAdd() {
    if (!title.trim()) return;

    const cleanOptions = options.filter((option) => option.trim());
    const isChoiceLike = type === 'choice' || type === 'quiz';

    if (isChoiceLike && cleanOptions.length < 2) {
      setError('선택형 질문은 최소 2개의 선택지가 필요합니다.');
      return;
    }

    if (type === 'quiz' && !correctAnswer) {
      setError('퀴즈의 정답 선택지를 지정해주세요.');
      return;
    }

    try {
      setError(null);
      const qId = generateQuestionId();
      const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
      if (isChoiceLike) {
        questionData.options = cleanOptions;
      }
      if (type === 'quiz') {
        questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
        questionData.points = QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
      }
      await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
      setTitle('');
      setOptions(['', '']);
      setCorrectAnswer('');
      setShowForm(false);
    } catch {
      setError('질문 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function activateQuestion(qId) {
    const question = questions?.[qId];
    if (!question) return;

    try {
      const updates = {
        currentQuestion: qId,
        currentMode: getQuestionMode(question),
      };

      if (isQuizQuestion(question)) {
        updates[`questions/${qId}/activatedAt`] = getNow();
        updates[`questions/${qId}/revealedAt`] = null;
        updates[`questions/${qId}/awardedAt`] = null;
        if (nextQuizEvent) {
          updates[`questions/${qId}/event`] = nextQuizEvent;
          updates.pendingEvent = null;
        }
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function clearActive() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function deleteQuestion(qId) {
    try {
      await remove(ref(db, `sessions/${sessionId}/questions/${qId}`));
      if (currentQuestion === qId) await clearActive();
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function duplicateQuestion(qId) {
    const source = questions?.[qId];
    if (!source) return;

    try {
      setError(null);
      const newId = generateQuestionId();
      const nextOrder = questionList.length + 1;
      const {
        votes: _votes,
        activatedAt: _activatedAt,
        revealedAt: _revealedAt,
        awardedAt: _awardedAt,
        event: _event,
        ...rest
      } = source;
      await set(ref(db, `sessions/${sessionId}/questions/${newId}`), {
        ...rest,
        title: `${source.title} (복사)`,
        order: nextOrder,
      });
    } catch {
      setError('질문 복제에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function revealQuiz(qId) {
    const question = questions?.[qId];
    if (!isQuizQuestion(question)) return;

    try {
      const now = getNow();
      const voteEntries = Object.entries(question.votes || {});
      const updates = {
        currentMode: 'quiz',
        [`questions/${qId}/revealedAt`]: now,
      };

      if (!question.awardedAt) {
        updates[`questions/${qId}/awardedAt`] = now;

        voteEntries.forEach(([participantId, vote]) => {
          const reward = getQuizReward(question, vote);
          const existingScore = scores[participantId] || {};
          const nextStreak = reward.isCorrect ? (existingScore.streak || 0) + 1 : 0;
          const nickname = participants[participantId]?.nickname || vote.nickname || existingScore.nickname || `참여자 ${participantId.slice(0, 4)}`;

          updates[`scores/${participantId}`] = {
            nickname,
            total: (existingScore.total || 0) + reward.points,
            tickets: (existingScore.tickets || 0) + reward.tickets,
            lastPoints: reward.points,
            lastTickets: reward.tickets,
            streak: nextStreak,
            bestStreak: Math.max(existingScore.bestStreak || 0, nextStreak),
            lastQuestionId: qId,
            updatedAt: now,
          };
        });
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
    } catch {
      setError('정답 공개와 점수 반영에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function showLeaderboard() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentMode: 'leaderboard' });
    } catch {
      setError('리더보드 전환에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function armEvent(eventPreset) {
    try {
      setError(null);
      await set(ref(db, `sessions/${sessionId}/pendingEvent`), eventPreset);
    } catch {
      setError('이벤트 예약에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function clearPendingEvent() {
    try {
      setError(null);
      await remove(ref(db, `sessions/${sessionId}/pendingEvent`));
    } catch {
      setError('이벤트 해제에 실패했습니다. 다시 시도해주세요.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">질문 목록</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'primary'} size="sm">
          {showForm ? '취소' : <><Plus size={14} /> 추가</>}
        </Button>
      </div>

      {questionList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">빠른 진행</p>
            <p className="text-slate-900 text-sm font-medium">
              {currentEntry
                ? `${activeIndex + 1}/${questionList.length}번째 질문 진행 중`
                : `질문 ${questionList.length}개 준비됨`}
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              {currentEntry
                ? currentEntry[1].title
                : '아직 활성화된 질문이 없습니다. 첫 질문을 바로 시작할 수 있습니다.'}
            </p>
            {currentEntry?.[1]?.type === 'quiz' && (
              <p className="text-amber-600 text-xs font-medium">
                {currentEntry[1].revealedAt ? '정답 공개가 완료되었습니다. 리더보드로 이어서 보여줄 수 있습니다.' : '정답 공개 전까지 답안을 모으는 중입니다.'}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => nextEntry && activateQuestion(nextEntry[0])}
              variant="primary"
              size="sm"
              disabled={!nextEntry}
            >
              <Play size={14} />
              {currentEntry ? '다음 질문' : '첫 질문 시작'}
            </Button>
            <Button
              onClick={clearActive}
              variant="secondary"
              size="sm"
              disabled={!currentEntry}
            >
              <Square size={14} />
              대기 화면
            </Button>
          </div>
          {nextEntry && currentEntry && (
            <p className="text-slate-400 text-xs">
              다음 예정: <span className="text-slate-600">{nextEntry[1].title}</span>
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">이벤트 부스터</p>
            <Badge variant={nextQuizEvent ? 'warning' : 'neutral'}>
              {nextQuizEvent ? '예약됨' : '없음'}
            </Badge>
          </div>
          <p className="text-slate-900 text-sm font-medium">다음 퀴즈에 즉시 적용</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            강의 중 깜짝 보너스 라운드를 열어 참여를 끌어올릴 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {QUIZ_EVENT_PRESETS.map((eventPreset) => {
            const isSelected = nextQuizEvent?.id === eventPreset.id;
            return (
              <button
                key={eventPreset.id}
                onClick={() => armEvent(eventPreset)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{eventPreset.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{eventPreset.description}</p>
              </button>
            );
          })}
        </div>

        {nextQuizEvent && (
          <QuizEventBanner event={nextQuizEvent} state="pending" compact />
        )}

        <Button
          onClick={clearPendingEvent}
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!nextQuizEvent}
        >
          이벤트 해제
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {QUESTION_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      aria-label={`${t.label} 유형 선택`}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        type === t.value
                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="질문 내용을 입력하세요" className={inputClass} autoFocus />
              {(type === 'choice' || type === 'quiz') && options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const nextOptions = [...options];
                      nextOptions[i] = e.target.value;
                      setOptions(nextOptions);
                      if (correctAnswer && !nextOptions.includes(correctAnswer)) {
                        setCorrectAnswer('');
                      }
                    }}
                    placeholder={`선택지 ${i + 1}`}
                    className={`flex-1 ${inputClass}`}
                  />
                  {i === options.length - 1 && options.length < 5 && (
                    <button onClick={() => setOptions([...options, ''])} className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all text-sm" aria-label="선택지 추가">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              ))}
              {type === 'quiz' && (
                <div className="space-y-2 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">정답 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {options.filter((option) => option.trim()).map((option) => (
                      <button
                        key={option}
                        onClick={() => setCorrectAnswer(option)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          correctAnswer === option
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700">
                    정답자: 기본 {QUIZ_DEFAULTS.points}점 + 속도 보너스, 참여자 전원 티켓 {QUIZ_DEFAULTS.participationTickets}장, 정답자 추가 티켓 {QUIZ_DEFAULTS.correctBonusTickets}장
                  </p>
                </div>
              )}
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1.5">
                  {error}
                </p>
              )}
              <Button onClick={handleAdd} variant="primary" size="md" className="w-full">추가하기</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        {questionList.map(([qId, q]) => {
          const qType = QUESTION_TYPES.find(t => t.value === q.type);
          const Icon = qType?.icon || MessageSquare;
          const isActive = currentQuestion === qId;
          const isQuiz = isQuizQuestion(q);
          return (
            <motion.div
              key={qId}
              layout
              className={`p-3 rounded-lg transition-all ${
                isActive ? 'bg-indigo-50 border-l-3 border-indigo-500' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={12} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{qType?.label}</span>
                    {isActive && <Badge variant="primary">LIVE</Badge>}
                    {isQuiz && q.event && <Badge variant="warning">{q.event.label || '이벤트'}</Badge>}
                    {isQuiz && q.revealedAt && <Badge variant="success">정답 공개</Badge>}
                  </div>
                  <span className="text-slate-700 text-sm leading-snug">{q.title}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!isActive ? (
                    <button onClick={() => activateQuestion(qId)} className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all" title="활성화" aria-label="질문 활성화">
                      <Play size={12} />
                    </button>
                  ) : (
                    <>
                      {isQuiz && !q.revealedAt && (
                        <button onClick={() => revealQuiz(qId)} className="p-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-all" title="정답 공개" aria-label="정답 공개">
                          <Check size={12} />
                        </button>
                      )}
                      {isQuiz && q.revealedAt && (
                        <button onClick={showLeaderboard} className="p-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-all" title="리더보드 보기" aria-label="리더보드 보기">
                          <Trophy size={12} />
                        </button>
                      )}
                      <button onClick={clearActive} className="p-1.5 rounded-md bg-slate-200 text-slate-500 hover:bg-slate-300 transition-all" title="중지" aria-label="질문 중지">
                        <Square size={12} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => duplicateQuestion(qId)}
                    className="p-1.5 rounded-md text-slate-300 hover:bg-slate-200 hover:text-slate-600 transition-all"
                    title="복제"
                    aria-label="질문 복제"
                  >
                    <Copy size={12} />
                  </button>
                  <button onClick={() => deleteQuestion(qId)} className="p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all" title="삭제" aria-label="질문 삭제">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {questionList.length === 0 && (
          <div className="text-center py-8 text-slate-300 text-sm">
            아직 질문이 없습니다<br />위의 + 추가 버튼으로 질문을 만드세요
          </div>
        )}
      </div>
    </div>
  );
}
