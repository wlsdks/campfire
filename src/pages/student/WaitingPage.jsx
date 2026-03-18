import { motion } from 'framer-motion';
import ConnectionDot from '../../components/ui/ConnectionDot';
import StudentBottomBar from '../../components/student/StudentBottomBar';

export default function WaitingPage({ sessionId }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-4 gap-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="text-5xl"
      >
        🏓
      </motion.div>
      <div className="text-center space-y-2">
        <p className="text-gray-500 text-lg font-medium">다음 질문을 기다리는 중...</p>
        <p className="text-gray-300 text-sm">선생님이 질문을 활성화하면 표시됩니다</p>
      </div>
      <ConnectionDot />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
