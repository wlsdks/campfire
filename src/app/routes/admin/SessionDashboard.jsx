import { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionList } from '@/features/session/api/useSessionList';
import CreateSessionModal from './CreateSessionModal';
import AdminApproval from './AdminApproval';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import PinggoMascot from '@/components/ui/PinggoMascot';
import { CourseGroup, UngroupedSessions } from './SessionList';
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
  const { sessions, loading, refresh } = useSessionList();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');

  const { courseGroups, ungrouped } = useMemo(() => {
    const groups = {};
    const noGroup = [];
    sessions.forEach((s) => {
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
  }, [sessions]);

  function handleSelect(session) {
    onSelectSession(session.id, session.status === 'ended' || session.status === 'reviewing');
  }

  function handleCreated(sessionId) {
    refresh();
    onSelectSession(sessionId, false);
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PinggoMascot size="sm" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pinggo</h1>
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
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 space-y-3">
        <div className="flex gap-1 mb-4">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all active:scale-[0.97] ${
                activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
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
                <div className="space-y-2">
                  {courseGroups.map(([name, list], gi) => (
                    <CourseGroup key={name} name={name} sessions={list} onSelect={handleSelect} startIndex={gi * 10} />
                  ))}
                  <UngroupedSessions sessions={ungrouped} onSelect={handleSelect} startIndex={courseGroups.length * 10} />
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
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
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <QuestionLibraryView adminUid={adminUser?.uid} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'more' && (
            <motion.div key="more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Suspense fallback={<SuspenseFallback fullPage={false} />}>
                <MoreView adminUser={adminUser} sessions={sessions} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateSessionModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} sessions={sessions} />
    </div>
  );
}
