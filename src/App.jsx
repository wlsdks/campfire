import { onDisconnect, ref, set, serverTimestamp } from 'firebase/database';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PickMascot from '@/components/ui/PickMascot';
import JoinPage from '@/app/routes/student/JoinPage';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import InstallPrompt from '@/components/ui/InstallPrompt';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import { db } from '@/lib/firebase';
import { getNickname, getParticipantId, hasJoinedSession, markSessionJoined } from '@/lib/participant';
import { useTheme } from '@/hooks/useTheme';

const VotePage = lazy(() => import('@/app/routes/student/VotePage'));
const AdminPage = lazy(() => import('@/app/routes/admin/AdminPage'));
const LivePage = lazy(() => import('@/app/routes/live/LivePage'));

function StudentRouter() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('s');
  const [joined, setJoined] = useState(() => hasJoinedSession(sessionId));

  useEffect(() => {
    setJoined(hasJoinedSession(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!joined || !sessionId) return;

    const nickname = getNickname().trim();
    if (!nickname) return;

    const participantId = getParticipantId();
    const participantRef = ref(db, `sessions/${sessionId}/participants/${participantId}`);
    const onlineRef = ref(db, `sessions/${sessionId}/participants/${participantId}/online`);

    set(participantRef, {
      nickname,
      joinedAt: serverTimestamp(),
      online: true,
    }).catch(() => {
      // Keep the current screen even if presence sync fails.
    });

    onDisconnect(onlineRef).set(false).catch(() => {
      // Ignore disconnect setup failures in the client.
    });
  }, [joined, sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center space-y-5 max-w-xs"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="flex justify-center"
          >
            <PickMascot size="lg" mood="waiting" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              강사가 공유한 링크 또는 QR코드를<br />통해 접속해주세요
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-xs text-slate-400 dark:text-slate-500">실시간 강의 참여 플랫폼</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!joined) {
    return (
      <JoinPage
        key={sessionId}
        sessionId={sessionId}
        onJoin={(participantId) => {
          markSessionJoined(sessionId, participantId);
          setJoined(true);
        }}
      />
    );
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <VotePage key={sessionId} sessionId={sessionId} />
    </Suspense>
  );
}

function App() {
  // Apply theme at app root so it's always active (not just on MoreView mount)
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ErrorBoundary scope="student">
            <StudentRouter />
            <InstallPrompt />
          </ErrorBoundary>
        } />
        <Route path="/admin" element={
          <ErrorBoundary scope="admin">
            <Suspense fallback={<SuspenseFallback />}>
              <AdminPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/live" element={
          <ErrorBoundary scope="live">
            <Suspense fallback={<SuspenseFallback />}>
              <LivePage />
            </Suspense>
          </ErrorBoundary>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
