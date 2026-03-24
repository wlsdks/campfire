import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Check, ChevronRight, ChevronDown, X, Scale } from 'lucide-react';
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
      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-150 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.title}</p>
          <p className="text-xs text-slate-400 mt-1 truncate">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mr-1.5 align-middle ${
              isJudged
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {statusLabel}
            </span>
            {assignment.courseName}{assignment.roundNumber ? ` ${assignment.roundNumber}차` : ''}
            {' · '}{count}건 제출
            {assignment.hasJudging !== false && (
              <span className="inline-flex items-center gap-0.5 ml-1 align-middle text-slate-500 dark:text-slate-400">
                <Scale size={10} />
              </span>
            )}
          </p>
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
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasJudging, setHasJudging] = useState(true);
  const [creating, setCreating] = useState(false);

  const courseNames = useMemo(() => {
    const names = new Set();
    sessions.forEach(s => { if (s.courseName) names.add(s.courseName); });
    return [...names].sort();
  }, [sessions]);

  const rounds = useMemo(() => {
    if (!selectedCourse) return [];
    return sessions
      .filter(s => s.courseName === selectedCourse && s.roundNumber)
      .map(s => s.roundNumber)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [sessions, selectedCourse]);

  const canCreate = title.trim() && selectedCourse;

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    try {
      await createAssignment(selectedCourse, {
        title: title.trim(),
        description: description.trim(),
        roundNumber: selectedRound ? Number(selectedRound) : null,
        hasJudging,
      });
      onClose();
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">과제 등록</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {/* 클래스 + 차수 — 한 줄 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">클래스</p>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedRound(''); }}
              className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="">선택</option>
              {courseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          {rounds.length > 0 && (
            <div className="w-24">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">차수</p>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">전체</option>
                {rounds.map(r => (
                  <option key={r} value={r}>{r}차</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 과제 제목 */}
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">과제 제목</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="과제 제목을 입력하세요"
            maxLength={50}
            autoFocus
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* 과제 설명 */}
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            과제 설명
            <span className="text-slate-300 dark:text-slate-500 ml-1.5 font-normal">선택</span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="학생들에게 보여줄 과제 설명"
            rows={2}
            maxLength={300}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
          />
        </div>

        {/* AI 심사 토글 */}
        <button
          type="button"
          onClick={() => setHasJudging(!hasJudging)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div>
            <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100 text-left">AI 심사</p>
            <p className="text-xs text-slate-400 mt-0.5 text-left">7명의 AI 심사위원이 제출물을 평가합니다</p>
          </div>
          <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${hasJudging ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-transform ${hasJudging ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* 생성 버튼 */}
        <div className="flex gap-2 pt-1">
          <Button onClick={onClose} variant="ghost" size="md" className="flex-1">취소</Button>
          <Button onClick={handleCreate} variant="primary" size="md" disabled={!canCreate || creating} className="flex-1">
            {creating ? '생성 중...' : '과제 생성'}
          </Button>
        </div>
      </div>
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
