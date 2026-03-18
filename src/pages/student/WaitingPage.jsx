import { motion } from 'framer-motion';
import ConnectionDot from '../../components/ui/ConnectionDot';
import StudentBottomBar from '../../components/student/StudentBottomBar';

export default function WaitingPage({ sessionId }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex flex-col items-center justify-center p-4 gap-6 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl animate-float-delay" />
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="text-5xl"
      >
        🏓
      </motion.div>
      <div className="text-center space-y-2 relative z-10">
        <p className="text-white/60 text-lg font-medium">다음 질문을 기다리는 중...</p>
        <p className="text-white/25 text-sm">선생님이 질문을 활성화하면 표시됩니다</p>
      </div>
      <ConnectionDot />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
