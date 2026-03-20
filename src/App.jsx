import { onDisconnect, ref, set, serverTimestamp } from 'firebase/database';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import JoinPage from '@/app/routes/student/JoinPage';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import InstallPrompt from '@/components/ui/InstallPrompt';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import { db } from '@/lib/firebase';
import { getNickname, getParticipantId, hasJoinedSession, markSessionJoined } from '@/lib/participant';
import { useTheme } from '@/hooks/useTheme';

const VotePage = lazy(() => import('@/app/routes/student/VotePage'));
const AdminPage = lazy(() => import('@/app/routes/admin/AdminPage'));

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
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex justify-center"><Radio size={28} className="text-indigo-500" /></div>
          <p className="text-slate-400 text-base">세션 링크를 통해 접속해주세요</p>
        </div>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
