import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import JoinPage from '@/app/routes/student/JoinPage';
import VotePage from '@/app/routes/student/VotePage';
import AdminPage from '@/app/routes/admin/AdminPage';

function StudentRouter() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('s');
  const [joined, setJoined] = useState(false);

  if (!sessionId) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto">
            <Sparkles size={24} className="text-indigo-600" />
          </div>
          <p className="text-slate-400 text-base">세션 링크를 통해 접속해주세요</p>
        </div>
      </div>
    );
  }

  if (!joined) {
    return <JoinPage sessionId={sessionId} onJoin={() => setJoined(true)} />;
  }

  return <VotePage sessionId={sessionId} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentRouter />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
