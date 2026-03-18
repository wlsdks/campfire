import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Flame, Heart, Laugh, HandMetal } from 'lucide-react';
import { useReactions } from '@/features/reactions/api/useReactions';

const REACTIONS = [
  { type: 'thumbsup', icon: ThumbsUp, label: '좋아요' },
  { type: 'fire', icon: Flame, label: '불꽃' },
  { type: 'heart', icon: Heart, label: '하트' },
  { type: 'laugh', icon: Laugh, label: '웃음' },
  { type: 'clap', icon: HandMetal, label: '박수' },
];

export default function ReactionBar({ sessionId }) {
  const { sendReaction } = useReactions(sessionId);
  const [cooldown, setCooldown] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  async function handleReaction(type) {
    if (cooldown) return;
    const sent = await sendReaction(type);
    if (sent) {
      setLastSent(type);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon }) => {
        const isActive = lastSent === type && cooldown;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleReaction(type)}
            disabled={cooldown}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive
                ? 'bg-indigo-100 text-indigo-600'
                : cooldown
                  ? 'bg-slate-50 text-slate-300'
                  : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500'
            }`}
          >
            <Icon size={18} />
          </motion.button>
        );
      })}
    </div>
  );
}
