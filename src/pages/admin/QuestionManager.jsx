import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { generateQuestionId } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: '📊', color: 'bg-blue-500' },
  { value: 'ox', label: 'O/X', icon: '⭕', color: 'bg-rose-500' },
  { value: 'wordcloud', label: '워드클라우드', icon: '💬', color: 'bg-emerald-500' },
  { value: 'qna', label: 'Q&A', icon: '💡', color: 'bg-amber-500' },
];

export default function QuestionManager({ sessionId, questions, currentQuestion }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('choice');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);

  async function handleAdd() {
    if (!title.trim()) return;
    const qId = generateQuestionId();
    const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
    if (type === 'choice') {
      questionData.options = options.filter(o => o.trim());
    }
    await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
    setTitle('');
    setOptions(['', '']);
    setShowForm(false);
  }

  async function activateQuestion(qId) {
    await update(ref(db, `sessions/${sessionId}`), {
      currentQuestion: qId,
      currentMode: 'poll',
    });
  }

  async function clearActive() {
    await update(ref(db, `sessions/${sessionId}`), {
      currentQuestion: null,
      currentMode: 'waiting',
    });
  }

  async function deleteQuestion(qId) {
    await remove(ref(db, `sessions/${sessionId}/questions/${qId}`));
    if (currentQuestion === qId) await clearActive();
  }

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">질문 목록</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all"
        >
          {showForm ? '취소' : '+ 추가'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {QUESTION_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      type === t.value
                        ? `${t.color} text-white shadow-sm`
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="질문 내용을 입력하세요"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {type === 'choice' && options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }}
                    placeholder={`선택지 ${i + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {i === options.length - 1 && options.length < 5 && (
                    <button onClick={() => setOptions([...options, ''])} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">+</button>
                  )}
                </div>
              ))}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm transition-all"
              >
                추가하기
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {questionList.map(([qId, q]) => {
          const qType = QUESTION_TYPES.find(t => t.value === q.type);
          const isActive = currentQuestion === qId;
          return (
            <motion.div
              key={qId}
              layout
              className={`p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{qType?.icon}</span>
                    <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {qType?.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="text-gray-700 text-sm leading-tight">{q.title}</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!isActive ? (
                    <button
                      onClick={() => activateQuestion(qId)}
                      className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      활성화
                    </button>
                  ) : (
                    <button
                      onClick={clearActive}
                      className="px-3 py-1 rounded-lg bg-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-300 transition-all"
                    >
                      중지
                    </button>
                  )}
                  <button
                    onClick={() => deleteQuestion(qId)}
                    className="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {questionList.length === 0 && (
          <div className="text-center py-8 text-gray-300 text-sm">
            아직 질문이 없습니다<br />위의 + 추가 버튼으로 질문을 만드세요
          </div>
        )}
      </div>
    </div>
  );
}
