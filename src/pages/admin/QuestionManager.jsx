import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { generateQuestionId } from '../../lib/utils';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식' },
  { value: 'ox', label: 'O/X' },
  { value: 'wordcloud', label: '워드클라우드' },
  { value: 'qna', label: 'Q&A' },
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
        <h2 className="text-lg font-bold text-white">질문 목록</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">
          + 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white">
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="질문 내용"
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-white/30"
          />
          {type === 'choice' && options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={(e) => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }}
                placeholder={`선택지 ${i + 1}`}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-white/30"
              />
              {i === options.length - 1 && options.length < 5 && (
                <button onClick={() => setOptions([...options, ''])} className="px-3 py-2 rounded-lg bg-gray-600 text-white text-sm">+</button>
              )}
            </div>
          ))}
          <button onClick={handleAdd} className="w-full py-2 rounded-lg bg-emerald-600 text-white font-semibold">추가</button>
        </div>
      )}

      <div className="space-y-2">
        {questionList.map(([qId, q]) => (
          <div key={qId} className={`flex items-center justify-between p-3 rounded-xl ${currentQuestion === qId ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'bg-gray-800'}`}>
            <div>
              <span className="text-xs text-white/40 mr-2">{QUESTION_TYPES.find(t => t.value === q.type)?.label}</span>
              <span className="text-white">{q.title}</span>
            </div>
            <div className="flex gap-2">
              {currentQuestion !== qId ? (
                <button onClick={() => activateQuestion(qId)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs">활성화</button>
              ) : (
                <button onClick={clearActive} className="px-3 py-1 rounded-lg bg-gray-600 text-white text-xs">비활성화</button>
              )}
              <button onClick={() => deleteQuestion(qId)} className="px-3 py-1 rounded-lg bg-red-600/50 text-white text-xs">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
