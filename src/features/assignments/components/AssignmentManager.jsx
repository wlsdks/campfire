import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Copy, Check, ChevronRight, Trash2 } from 'lucide-react';
import { useAssignmentList, useAssignmentActions } from '@/features/assignments/api/useAssignments';
import { useSubmissionList } from '@/features/assignments/api/useSubmissions';
import Button from '@/components/ui/Button';
import AssignmentDetail from './AssignmentDetail';

function AssignmentCard({ assignment, onClick }) {
  const { count } = useSubmissionList(assignment.id);
  const [copied, setCopied] = useState(false);

  const submitUrl = `${window.location.origin}/submit?a=${assignment.id}`;

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusLabel = { open: '제출 중', closed: '마감', judging: '심사 중', judged: '심사 완료' }[assignment.status] || assignment.status;
  const statusStyle = assignment.status === 'judged'
    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.title}</p>
          <div className="flex items-center gap-2">
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
    </motion.button>
  );
}

/**
 * AssignmentManager — 강사용 과제 목록/생성/상세 관리.
 */
export default function AssignmentManager({ courseName }) {
  const { assignments, loading } = useAssignmentList(courseName);
  const { createAssignment, deleteAssignment } = useAssignmentActions();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    await createAssignment(courseName, { title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setShowForm(false);
  }, [courseName, title, description, createAssignment]);

  // Detail view
  if (selectedId) {
    return (
      <AssignmentDetail
        assignmentId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">과제</h3>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'primary'} size="sm">
          {showForm ? '취소' : <><Plus size={14} /> 새 과제</>}
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="과제 제목"
                maxLength={50}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="과제 설명 (선택)"
                rows={2}
                maxLength={300}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
              <Button onClick={handleCreate} variant="primary" size="sm" disabled={!title.trim()} className="w-full">
                과제 생성
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment list */}
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <FileText size={24} className="mx-auto text-slate-300" />
          <p className="text-sm text-slate-400">아직 과제가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} onClick={() => setSelectedId(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
