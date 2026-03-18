import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateQuestionId } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Circle, Cloud, MessageSquare, Plus, Trash2, Play, Square } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
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
    if (type === 'choice') questionData.options = options.filter(o => o.trim());
    await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
    setTitle(''); setOptions(['', '']); setShowForm(false);
  }

  async function activateQuestion(qId) {
    await update(ref(db, `sessions/${sessionId}`), { currentQuestion: qId, currentMode: 'poll' });
  }

  async function clearActive() {
    await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
  }

  async function deleteQuestion(qId) {
    await remove(ref(db, `sessions/${sessionId}/questions/${qId}`));
    if (currentQuestion === qId) await clearActive();
  }

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">질문 목록</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'primary'} size="sm">
          {showForm ? '취소' : <><Plus size={14} /> 추가</>}
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
              {type === 'choice' && options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                    placeholder={`선택지 ${i + 1}`}
                    className={`flex-1 ${inputClass}`}
                  />
                  {i === options.length - 1 && options.length < 5 && (
                    <button onClick={() => setOptions([...options, ''])} className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all text-sm">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              ))}
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
                  </div>
                  <span className="text-slate-700 text-sm leading-snug">{q.title}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!isActive ? (
                    <button onClick={() => activateQuestion(qId)} className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all" title="활성화">
                      <Play size={12} />
                    </button>
                  ) : (
                    <button onClick={clearActive} className="p-1.5 rounded-md bg-slate-200 text-slate-500 hover:bg-slate-300 transition-all" title="중지">
                      <Square size={12} />
                    </button>
                  )}
                  <button onClick={() => deleteQuestion(qId)} className="p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all" title="삭제">
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
