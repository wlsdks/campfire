import { useState, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSessionList } from '@/features/session/api/useSessionList';
import CreateSessionModal from './CreateSessionModal';
import DeleteSessionModal from './DeleteSessionModal';
import AdminApproval from './AdminApproval';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import PinggoMascot from '@/components/ui/PinggoMascot';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { CourseGroup, UngroupedSessions } from './SessionList';
import SessionSearchFilter from './SessionSearchFilter';
import { Plus, Loader2, LogOut } from 'lucide-react';

const StatsView = lazy(() => import('./StatsView'));
const QuestionLibraryView = lazy(() => import('./QuestionLibraryView'));
const MoreView = lazy(() => import('./MoreView'));

const TABS = [
  { key: 'classes', label: '내 클래스' },
  { key: 'history', label: '수업 기록' },
  { key: 'library', label: '질문 보관함' },
  { key: 'more', label: '더보기' },
];

export default function SessionDashboard({ onSelectSession, onLogout, adminUser, isMaster, pendingAdmins, pendingCount, approveAdmin, rejectAdmin }) {
  const { sessions, loading, refresh, deleteSession, duplicateSession } = useSessionList();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['classes', 'history', 'library', 'more'].includes(hash) ? hash : 'classes';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [duplicating, setDuplicating] = useState(false);
  const { toast, showToast } = useToast();
  const contentRef = useRef(null);

  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    window.location.hash = key;
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0 });
    }
  }, []);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => (s.courseName || '').toLowerCase().includes(q));
    }
    return result;
  }, [sessions, searchQuery, statusFilter]);

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
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PinggoMascot size="sm" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pinggo</h1>
            <p className="text-slate-400 text-xs">{TABS.find((t) => t.key === activeTab)?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {adminUser && <span className="text-sm text-slate-500 font-medium">{adminUser.displayName}</span>}
          {isMaster && <AdminApproval pendingAdmins={pendingAdmins} pendingCount={pendingCount} approveAdmin={approveAdmin} rejectAdmin={rejectAdmin} />}
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-all active:scale-[0.97]">
            <LogOut size={16} />로그아웃
          </button>
        </div>
      </div>


      {/* Content */}
      <div ref={contentRef} className="flex-1 max-w-2xl mx-auto w-full px-6 max-sm:px-4 py-6 space-y-3 overflow-y-auto">
        {/* Tab bar */}
        <LayoutGroup>
          <div className="flex gap-1 mb-3 relative">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`relative px-4 max-sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 active:scale-[0.97] whitespace-nowrap ${
                  activeTab === tab.key ? 'text-white dark:text-slate-900' : 'text-slate-500 border border-slate-200 dark:border-slate-700 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}>
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-orange-600 dark:bg-orange-500 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

          {activeTab === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-3">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Button onClick={() => setModalOpen(true)} variant="primary" size="lg" className="w-full">
                  <Plus size={20} />새 클래스 만들기
                </Button>
              </motion.div>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" />불러오는 중...</div>
              ) : sessions.length === 0 ? (
                <EmptyState title="첫 클래스를 만들어보세요" description="Pinggo와 함께 학생 참여를 이끌어보세요"
                  steps={['위의 버튼으로 클래스를 만드세요', '객관식, 퀴즈, 워드클라우드 등 질문을 추가하세요', 'QR코드를 공유하면 학생들이 바로 참여합니다']}
                  mascotSize="lg" mood="happy" className="py-12" />
              ) : (
                <>
                  {sessions.length >= 3 && (
                    <SessionSearchFilter
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      statusFilter={statusFilter}
                      onStatusChange={setStatusFilter}
                    />
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
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                    <div className="space-y-2">
                      {courseGroups.map(([name, list], gi) => (
                        <CourseGroup key={name} name={name} sessions={list} onSelect={handleSelect} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} startIndex={gi * 10} groupIndex={gi} />
                      ))}
                      <UngroupedSessions sessions={ungrouped} onSelect={handleSelect} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} startIndex={courseGroups.length * 10} groupIndex={courseGroups.length} />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" />불러오는 중...</div>
              ) : (
                <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                  <StatsView sessions={sessions} />
                </Suspense>
              )}
            </motion.div>
          )}
          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <QuestionLibraryView adminUid={adminUser?.uid} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'more' && (
            <motion.div key="more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <MoreView adminUser={adminUser} sessions={sessions} />
              </Suspense>
            </motion.div>
          )}
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
