import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateSessionId, generateQuestionId } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight, Loader2, AlertCircle, Copy } from 'lucide-react';

export default function CreateSessionModal({ open, onClose, onCreated, sessions }) {
  const [step, setStep] = useState('course'); // 'course' | 'new-course' | 'confirm'
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Duplication state
  const [duplicateEnabled, setDuplicateEnabled] = useState(false);
  const [duplicateSourceId, setDuplicateSourceId] = useState('');

  const courses = useMemo(() => {
    const courseMap = {};
    sessions.forEach((s) => {
      if (!s.courseName) return;
      if (!courseMap[s.courseName]) {
        courseMap[s.courseName] = { name: s.courseName, count: 0, maxRound: 0 };
      }
      courseMap[s.courseName].count++;
      if (s.roundNumber > courseMap[s.courseName].maxRound) {
        courseMap[s.courseName].maxRound = s.roundNumber;
      }
    });
    return Object.values(courseMap).sort((a, b) => b.count - a.count);
  }, [sessions]);

  // Previous rounds for the selected course
  const previousRounds = useMemo(() => {
    if (!selectedCourse) return [];
    return sessions
      .filter((s) => s.courseName === selectedCourse && s.questionCount > 0)
      .sort((a, b) => (b.roundNumber || 0) - (a.roundNumber || 0));
  }, [sessions, selectedCourse]);

  function handleSelectCourse(course) {
    setSelectedCourse(course.name);
    setRoundNumber(course.maxRound + 1);
    setDuplicateEnabled(false);
    setDuplicateSourceId('');
    setStep('confirm');
  }

  function handleNewCourse() {
    setStep('new-course');
    setNewCourseName('');
  }

  function handleNewCourseSubmit() {
    if (!newCourseName.trim()) return;
    setSelectedCourse(newCourseName.trim());
    setRoundNumber(1);
    setDuplicateEnabled(false);
    setDuplicateSourceId('');
    setStep('confirm');
  }

  function handleReset() {
    setStep('course');
    setSelectedCourse('');
    setNewCourseName('');
    setRoundNumber(1);
    setError(null);
    setDuplicateEnabled(false);
    setDuplicateSourceId('');
  }

  async function handleCreate() {
    try {
      setError(null);
      setCreating(true);
      const newId = generateSessionId();

      const sessionData = {
        status: 'setting',
        currentQuestion: null,
        currentMode: 'waiting',
        createdAt: serverTimestamp(),
        courseName: selectedCourse,
        roundNumber,
      };

      // If duplicating, fetch source questions and copy them
      if (duplicateEnabled && duplicateSourceId) {
        const sourceSnap = await get(ref(db, `sessions/${duplicateSourceId}/questions`));
        const sourceQuestions = sourceSnap.val();

        if (sourceQuestions) {
          const newQuestions = {};
          Object.values(sourceQuestions)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach((q, i) => {
              const newQId = generateQuestionId();
              // Copy question data, strip runtime/vote data
              const {
                votes: _votes,
                activatedAt: _activatedAt,
                revealedAt: _revealedAt,
                awardedAt: _awardedAt,
                event: _event,
                ...rest
              } = q;
              newQuestions[newQId] = { ...rest, order: i + 1 };
            });
          sessionData.questions = newQuestions;
        }
      }

      await set(ref(db, `sessions/${newId}`), sessionData);
      onCreated(newId);
      handleReset();
      onClose();
    } catch {
      setError('클래스 등록에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <AnimatePresence mode="wait">
        {step === 'course' && (
          <motion.div
            key="course"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">새 클래스 등록</h2>
              <p className="text-slate-400 text-sm mt-1">강의를 선택하세요</p>
            </div>

            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.name}
                  onClick={() => handleSelectCourse(course)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.98] text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <BookOpen size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{course.name}</p>
                      <p className="text-slate-400 text-xs">{course.count}개 차수 진행</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}

              <button
                onClick={handleNewCourse}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Plus size={18} className="text-slate-400" />
                </div>
                <p className="font-medium text-slate-500 text-sm">새 강의 만들기</p>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'new-course' && (
          <motion.div
            key="new-course"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">새 강의</h2>
              <p className="text-slate-400 text-sm mt-1">강의 이름을 입력하세요</p>
            </div>

            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewCourseSubmit()}
              placeholder="예: 바이브 코딩 기초편"
              aria-label="강의 이름"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
              autoFocus
            />

            <div className="flex gap-2">
              <Button onClick={() => setStep('course')} variant="secondary" size="md" className="flex-1">
                뒤로
              </Button>
              <Button
                onClick={handleNewCourseSubmit}
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!newCourseName.trim()}
              >
                다음
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">클래스 확인</h2>
              <p className="text-slate-400 text-sm mt-1">정보를 확인하고 등록하세요</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">강의</span>
                <span className="font-medium text-slate-900 text-sm">{selectedCourse}</span>
              </div>
              <div className="border-t border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">차수</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRoundNumber(Math.max(1, roundNumber - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all active:scale-90 text-sm font-medium"
                  >
                    -
                  </button>
                  <span className="font-bold text-slate-900 text-lg w-10 text-center">{roundNumber}</span>
                  <button
                    onClick={() => setRoundNumber(roundNumber + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all active:scale-90 text-sm font-medium"
                  >
                    +
                  </button>
                  <span className="text-slate-400 text-sm">차</span>
                </div>
              </div>
            </div>

            {/* Duplicate from previous round */}
            {previousRounds.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const next = !duplicateEnabled;
                    setDuplicateEnabled(next);
                    if (next && previousRounds.length > 0) {
                      setDuplicateSourceId(previousRounds[0].id);
                    } else {
                      setDuplicateSourceId('');
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left ${
                    duplicateEnabled
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <Copy size={16} className={duplicateEnabled ? 'text-slate-700' : 'text-slate-400'} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${duplicateEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                      이전 차수 복제
                    </p>
                    <p className="text-xs text-slate-400">질문 목록을 복사하여 새 클래스에 추가합니다</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${duplicateEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${duplicateEnabled ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {duplicateEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        {previousRounds.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setDuplicateSourceId(s.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all active:scale-[0.98] text-sm ${
                              duplicateSourceId === s.id
                                ? 'border-slate-300 bg-white shadow-sm'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <span className={`font-medium ${duplicateSourceId === s.id ? 'text-slate-900' : 'text-slate-500'}`}>
                              {s.roundNumber ? `${s.roundNumber}차` : s.id}
                            </span>
                            <span className="text-xs text-slate-400">{s.questionCount}개 질문</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-sm flex items-center gap-1.5"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="secondary" size="md" className="flex-1">
                뒤로
              </Button>
              <Button
                onClick={handleCreate}
                variant="primary"
                size="md"
                className="flex-1"
                disabled={creating}
              >
                {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {creating ? '등록 중...' : '클래스 등록'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
