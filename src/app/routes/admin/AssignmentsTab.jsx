import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Check, ChevronRight, ChevronDown, X } from 'lucide-react';
import { useAssignmentList, useAssignmentActions, ASSIGNMENT_STATUS } from '@/features/assignments/api/useAssignments';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AssignmentDetail from '@/features/assignments/components/AssignmentDetail';
import PickMascot from '@/components/ui/PickMascot';

function AssignmentCard({ assignment, onClick }) {
  const { count } = useSubmissionList(assignment.id);
  const [copied, setCopied] = useState(false);

  const submitUrl = `${window.location.origin}/submit?a=${assignment.id}`;
  const statusLabel = ASSIGNMENT_STATUS[assignment.status] || assignment.status;
  const isJudged = assignment.status === 'judged';

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              isJudged
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {statusLabel}
            </span>
            <span className="text-xs text-slate-400">
              {assignment.courseName}{assignment.roundNumber ? ` ${assignment.roundNumber}차` : ''}
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-400">{count}건 제출</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors duration-150"
            title="제출 링크 복사"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </div>
    </motion.div>
  );
}

function CreateAssignmentContent({ sessions, onClose }) {
  const { createAssignment } = useAssignmentActions();
  const [step, setStep] = useState('class'); // 'class' → 'round' → 'form'
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedRound, setSelectedRound] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const courseNames = useMemo(() => {
    const names = new Set();
    sessions.forEach(s => { if (s.courseName) names.add(s.courseName); });
    return [...names].sort();
  }, [sessions]);

  // 선택된 클래스의 차수 목록 (roundNumber 기준 정렬)
  const rounds = useMemo(() => {
    if (!selectedCourse) return [];
    return sessions
      .filter(s => s.courseName === selectedCourse && s.roundNumber)
      .map(s => s.roundNumber)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [sessions, selectedCourse]);

  async function handleCreate() {
    if (!title.trim() || !selectedCourse) return;
    setCreating(true);
    try {
      await createAssignment(selectedCourse, {
        title: title.trim(),
        description: description.trim(),
        roundNumber: selectedRound,
      });
      onClose();
    } finally {
      setCreating(false);
    }
  }

  function handleSelectCourse(name) {
    setSelectedCourse(name);
    const courseRounds = sessions
      .filter(s => s.courseName === name && s.roundNumber)
      .map(s => s.roundNumber)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    // 차수가 1개 이하면 바로 폼으로
    if (courseRounds.length <= 1) {
      setSelectedRound(courseRounds[0] || null);
      setStep('form');
    } else {
      setStep('round');
    }
  }

  function handleBack() {
    if (step === 'form' && rounds.length > 1) {
      setStep('round');
    } else {
      setStep('class');
      setSelectedCourse('');
      setSelectedRound(null);
    }
  }

  const stepTitle = { class: '클래스 선택', round: '차수 선택', form: '과제 등록' }[step];
  const breadcrumb = step === 'form'
    ? `${selectedCourse}${selectedRound ? ` · ${selectedRound}차` : ''}`
    : step === 'round'
    ? selectedCourse
    : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {stepTitle}
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'class' && (
          <motion.div
            key="class"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">과제를 등록할 클래스를 선택하세요</p>
            {courseNames.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">등록된 클래스가 없습니다</p>
            ) : (
              courseNames.map(name => (
                <button
                  key={name}
                  onClick={() => handleSelectCourse(name)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-150 text-left"
                >
                  <span className="text-[15px] font-medium text-slate-900 dark:text-slate-100">{name}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))
            )}
          </motion.div>
        )}

        {step === 'round' && (
          <motion.div
            key="round"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <button
              onClick={() => { setStep('class'); setSelectedCourse(''); }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-2"
            >
              <ChevronDown size={14} className="rotate-90" />
              {selectedCourse}
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">몇 차수에 등록할까요?</p>
            <div className="grid grid-cols-3 gap-2">
              {rounds.map(r => (
                <button
                  key={r}
                  onClick={() => { setSelectedRound(r); setStep('form'); }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-center"
                >
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{r}</span>
                  <span className="text-xs text-slate-400 ml-0.5">차</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <ChevronDown size={14} className="rotate-90" />
              {breadcrumb}
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목"
              maxLength={50}
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제 설명 (선택)"
              rows={3}
              maxLength={300}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
            />
            <div className="flex gap-2 pt-1">
              <Button onClick={onClose} variant="ghost" size="md" className="flex-1">취소</Button>
              <Button onClick={handleCreate} variant="primary" size="md" disabled={!title.trim() || creating} className="flex-1">
                {creating ? '생성 중...' : '과제 생성'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * AssignmentsTab — 과제 관리 탭.
 */
export default function AssignmentsTab({ sessions }) {
  const { assignments, loading } = useAssignmentList();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignmentId={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
      />
    );
  }

  return (
    <motion.div
      key="assignments"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">과제</h2>
          {assignments.length > 0 && (
            <p className="text-sm text-slate-400 mt-0.5">{assignments.length}개</p>
          )}
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
          <Plus size={16} />
          과제 등록
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">불러오는 중...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="py-16">
          <PickMascot size="lg" mood="waiting" className="mx-auto" />
          <div className="text-center mt-6 space-y-2">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">아직 등록된 과제가 없습니다</p>
            <p className="text-slate-400 text-sm">과제를 등록하고 학생들의 제출물을 AI로 심사해보세요</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onClick={() => setSelectedAssignment(a.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        ariaLabel="과제 등록"
      >
        <CreateAssignmentContent
          sessions={sessions}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>
    </motion.div>
  );
}
