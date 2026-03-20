import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

/**
 * Floating team badge shown on student vote page.
 * Shows team name and member count.
 */
export default memo(function TeamBadge({ teamName, teamColors, memberCount }) {
  if (!teamName || !teamColors) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${teamColors.bg} ${teamColors.text}`}
    >
      <Users size={12} />
      <span>{teamName} 팀</span>
      <span className="opacity-60">({memberCount}명)</span>
    </motion.div>
  );
});
