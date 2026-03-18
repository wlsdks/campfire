import { motion } from 'framer-motion';

export default function VoteConfirm() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex flex-col items-center gap-4 py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 10 }}
        className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      <div className="text-center space-y-1">
        <p className="text-gray-900 text-xl font-bold">제출 완료!</p>
        <p className="text-gray-400 text-sm">응답이 기록되었어요</p>
      </div>
    </motion.div>
  );
}
