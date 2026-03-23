import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useAssignmentList, useAssignmentActions } from '@/features/assignments/api/useAssignments';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import Button from '@/components/ui/Button';
import AssignmentDetail from '@/features/assignments/components/AssignmentDetail';
import PickMascot from '@/components/ui/PickMascot';

function AssignmentCard({ assignment, onClick }) {
  const { count } = useSubmissionList(assignment.id);
  const [copied, setCopied] = useState(false);

  const submitUrl = `${window.location.origin}/submit?a=${assignment.id}`;
  const statusLabel = { open: '제출 중', closed: '마감', judging: '심사 중', judged: '심사 완료' }[assignment.status] || assignment.status;
  const statusStyle = assignment.status === 'judged'
    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle}`}>
              {statusLabel}
            </span>
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
    </div>
  );
}

function CourseAssignments({ courseName, onSelectAssignment }) {
  const { assignments } = useAssignmentList(courseName);
  const { createAssignment } = useAssignmentActions();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(assignments.length > 0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function handleCreate() {
    if (!title.trim()) return;
    await createAssignment(courseName, { title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setShowForm(false);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity duration-150"
        >
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{courseName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{assignments.length}개 과제</p>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-slate-400" />
          </motion.div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); setShowForm(true); }}
          className="ml-3 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
          title="새 과제 추가"
        >
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {assignments.map(a => (
                <AssignmentCard key={a.id} assignment={a} onClick={() => onSelectAssignment(a.id)} />
              ))}

              {/* Create form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 space-y-3">
                      <input
                        type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="과제 제목" maxLength={50} autoFocus
                        className="w-full bg-white dark:bg-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <textarea
                        value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="과제 설명 (선택)" rows={2} maxLength={300}
                        className="w-full bg-white dark:bg-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="flex-1">취소</Button>
                        <Button onClick={handleCreate} variant="primary" size="sm" disabled={!title.trim()} className="flex-1">생성</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * AssignmentsTab — 과제 관리 탭. 클래스별로 과제를 그룹핑.
 */
export default function AssignmentsTab({ sessions }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Get unique course names from sessions
  const courseNames = useMemo(() => {
    const names = new Set();
    sessions.forEach(s => { if (s.courseName) names.add(s.courseName); });
    return [...names].sort();
  }, [sessions]);

  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignmentId={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
      />
    );
  }

  if (courseNames.length === 0) {
    return (
      <div className="py-16">
        <PickMascot size="lg" mood="waiting" className="mx-auto" />
        <div className="text-center mt-6 space-y-2">
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">클래스가 없습니다</p>
          <p className="text-slate-400 text-sm">내 클래스 탭에서 클래스를 먼저 만들어주세요</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="assignments"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {courseNames.map(name => (
        <CourseAssignments
          key={name}
          courseName={name}
          onSelectAssignment={setSelectedAssignment}
        />
      ))}
    </motion.div>
  );
}
