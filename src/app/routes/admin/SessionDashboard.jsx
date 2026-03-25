import { useState, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSessionList } from '@/features/session/api/useSessionList';
import CreateSessionModal from './CreateSessionModal';
import DeleteSessionModal from './DeleteSessionModal';
import AdminApproval from './AdminApproval';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import PickMascot from '@/components/ui/PickMascot';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { CourseGroup, UngroupedSessions } from './SessionList';
import SessionSearchFilter from './SessionSearchFilter';
import { Plus, Loader2, LogOut } from 'lucide-react';

const StatsView = lazy(() => import('./StatsView'));
const QuestionLibraryView = lazy(() => import('./QuestionLibraryView'));
const MoreView = lazy(() => import('./MoreView'));
const AssignmentsTab = lazy(() => import('./AssignmentsTab'));

const TABS = [
  { key: 'classes', label: '내 클래스' },
  { key: 'history', label: '수업 기록' },
  { key: 'library', label: '질문 보관함' },
  { key: 'assignments', label: '과제' },
  { key: 'more', label: '더보기' },
];

export default function SessionDashboard({ onSelectSession, onLogout, adminUser, isMaster, pendingAdmins, pendingCount, approveAdmin, rejectAdmin }) {
  const { sessions, loading, refresh, deleteSession, duplicateSession } = useSessionList();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isStaff = adminUser?.role === 'staff';
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['classes', 'history', 'library', 'assignments', 'more'].includes(hash) ? hash : 'classes';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [duplicating, setDuplicating] = useState(false);
  const { toast, showToast } = useToast();
  const contentRef = useRef(null);

  // Staff only sees active/reviewing sessions
  const displaySessions = useMemo(() => {
    if (isStaff) {
      return sessions.filter(s => s.status === 'active' || s.status === 'reviewing');
    }
    return sessions;
  }, [sessions, isStaff]);

  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    window.location.hash = key;
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0 });
    }
  }, []);

  const filteredSessions = useMemo(() => {
    let result = displaySessions;
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => (s.courseName || '').toLowerCase().includes(q));
    }
    return result;
  }, [displaySessions, searchQuery, statusFilter]);

  const isFiltering = searchQuery.trim() !== '' || statusFilter !== 'all';

  const { courseGroups, ungrouped } = useMemo(() => {
    const groups = {};
    const noGroup = [];
    filteredSessions.forEach((s) => {
      if (s.courseName) {
        if (!groups[s.courseName]) groups[s.courseName] = [];
        groups[s.courseName].push(s);
      } else {
        noGroup.push(s);
      }
    });
    Object.values(groups).forEach((list) => {
      list.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
    });
    return {
      courseGroups: Object.entries(groups).sort((a, b) => {
        const latestA = Math.max(...a[1].map((s) => s.createdAt || 0));
        const latestB = Math.max(...b[1].map((s) => s.createdAt || 0));
        return latestB - latestA;
      }),
      ungrouped: noGroup,
    };
  }, [filteredSessions]);

  function handleSelect(session) {
    onSelectSession(session.id, session.status === 'ended' || session.status === 'reviewing');
  }

  function handleCreated(sessionId) {
    refresh();
    onSelectSession(sessionId, false);
  }

  const handleDeleteRequest = useCallback((session) => {
    setDeleteTarget(session);
  }, []);

  const handleDuplicate = useCallback(async (session) => {
    if (duplicating) return;
    setDuplicating(true);
    try {
      const newId = await duplicateSession(session.id);
      if (newId) {
        const name = session.courseName || '세션';
        showToast(`${name} 복제 완료`);
        onSelectSession(newId, false);
      }
    } finally {
      setDuplicating(false);
    }
  }, [duplicating, duplicateSession, onSelectSession, showToast]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-6 max-sm:px-5 py-5 max-sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PickMascot size="sm" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</h1>
            <p className="text-slate-400 text-xs">{TABS.find((t) => t.key === activeTab)?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {adminUser && <span className="text-sm text-slate-500 font-medium max-sm:hidden">{adminUser.displayName}</span>}
          {isMaster && <AdminApproval pendingAdmins={pendingAdmins} pendingCount={pendingCount} approveAdmin={approveAdmin} rejectAdmin={rejectAdmin} />}
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors duration-150 active:scale-[0.97]">
            <LogOut size={16} /><span className="max-sm:hidden">로그아웃</span>
          </button>
        </div>
      </div>


      {/* Content */}
      <div ref={contentRef} className="flex-1 max-w-2xl mx-auto w-full px-6 max-sm:px-4 py-8 space-y-4 overflow-y-auto">
        {/* Tab bar */}
        <LayoutGroup>
          <div className="flex gap-1 mb-4 relative">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`relative px-4 max-sm:px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 active:scale-[0.97] whitespace-nowrap ${
                  activeTab === tab.key ? 'text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <AnimatePresence mode="wait">
          {activeTab === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-shimmer">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-40" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                      </div>
                      <div className="flex gap-4 mb-3">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded mt-3" />
                      </div>
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displaySessions.length === 0 ? (
                isStaff ? (
                  <EmptyState title="진행 중인 수업이 없습니다" description="강사가 수업을 시작하면 여기에 표시됩니다"
                    mascotSize="lg" className="py-12" />
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button onClick={() => setModalOpen(true)} variant="secondary" size="sm">
                        <Plus size={16} />새 클래스
                      </Button>
                    </div>
                    <EmptyState title="첫 클래스를 만들어보세요" description="Pick과 함께 학생 참여를 이끌어보세요"
                      steps={['위의 버튼으로 클래스를 만드세요', '객관식, 퀴즈, 워드클라우드 등 질문을 추가하세요', 'QR코드를 공유하면 학생들이 바로 참여합니다']}
                      mascotSize="lg" mood="happy" className="py-12" />
                  </>
                )
              ) : (
                <>
                  {!isStaff && sessions.length >= 3 ? (
                    <SessionSearchFilter
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      statusFilter={statusFilter}
                      onStatusChange={setStatusFilter}
                      actionSlot={!isStaff && (
                        <Button onClick={() => setModalOpen(true)} variant="secondary" size="sm" className="shrink-0 !py-2.5">
                          <Plus size={16} />새 클래스
                        </Button>
                      )}
                    />
                  ) : !isStaff && (
                    <div className="flex justify-end">
                      <Button onClick={() => setModalOpen(true)} variant="secondary" size="sm">
                        <Plus size={16} />새 클래스
                      </Button>
                    </div>
                  )}
                  {isFiltering && (
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {filteredSessions.length > 0
                          ? `${filteredSessions.length}개 세션`
                          : '검색 결과 없음'}
                      </p>
                      {isFiltering && (
                        <button
                          onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                  )}
                  {filteredSessions.length === 0 && isFiltering ? (
                    <EmptyState
                      title="검색 결과가 없습니다"
                      description={searchQuery ? `"${searchQuery}"에 해당하는 클래스가 없어요` : '해당 상태의 세션이 없어요'}
                      className="py-8"
                    />
                  ) : (
                    <div className="space-y-4">
                      {courseGroups.map(([name, list], gi) => (
                        <CourseGroup key={name} name={name} sessions={list} onSelect={handleSelect} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} startIndex={gi * 10} groupIndex={gi} hideActions={isStaff} />
                      ))}
                      <UngroupedSessions sessions={ungrouped} onSelect={handleSelect} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} startIndex={courseGroups.length * 10} groupIndex={courseGroups.length} hideActions={isStaff} />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3"><PickMascot size="sm" mood="thinking" /><p className="text-sm text-slate-400">불러오는 중...</p></div>
              ) : (
                <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                  <StatsView sessions={sessions} />
                </Suspense>
              )}
            </motion.div>
          )}
          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <QuestionLibraryView adminUid={adminUser?.uid} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'assignments' && (
            <motion.div key="assignments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <AssignmentsTab sessions={sessions} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'more' && (
            <motion.div key="more" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <MoreView adminUser={adminUser} sessions={sessions} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateSessionModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} sessions={sessions} />
      <DeleteSessionModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} session={deleteTarget} onConfirm={deleteSession} />
      <Toast message={toast} />
      <AnimatePresence>
        {duplicating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">복제 중...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
