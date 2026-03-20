import { motion } from 'framer-motion';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import SessionSummaryCard from '@/features/session/components/SessionSummaryCard';

export default function SessionEndedPage({ sessionId, session, reviewing = false }) {
  return (
    <div className={`min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pt-16 ${reviewing ? 'pb-36' : 'pb-8'}`}>
      <StudentHeader sessionId={sessionId} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        <SessionSummaryCard session={session} sessionId={sessionId} reviewing={reviewing} />
      </motion.div>

      {reviewing && <StudentBottomBar sessionId={sessionId} />}
    </div>
  );
}
