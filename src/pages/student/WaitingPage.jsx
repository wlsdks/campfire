import { motion } from 'framer-motion';
import ConnectionDot from '../../components/ui/ConnectionDot';
import StudentBottomBar from '../../components/student/StudentBottomBar';

export default function WaitingPage({ sessionId }) {
  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col items-center justify-center p-4 gap-4">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-4xl"
      >
        ⏳
      </motion.div>
      <p className="text-white/70 text-lg">다음 질문을 기다리는 중...</p>
      <ConnectionDot />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
