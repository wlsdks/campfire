import { motion } from 'framer-motion';

export default function VoteConfirm() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-3 py-8"
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="text-5xl"
      >
        ✅
      </motion.div>
      <p className="text-white text-lg font-medium">제출 완료!</p>
    </motion.div>
  );
}
