import { useState, useEffect } from 'react';
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
  const { sendReaction, canSend } = useReactions(sessionId);
  const [lastSent, setLastSent] = useState(null);

  useEffect(() => {
    if (canSend) setLastSent(null);
  }, [canSend]);

  async function handleReaction(type) {
    if (!canSend) return;
    const sent = await sendReaction(type);
    if (sent) {
      setLastSent(type);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon, label }) => {
        const isActive = lastSent === type && !canSend;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleReaction(type)}
            disabled={!canSend}
            aria-label={label}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive
                ? 'bg-indigo-100 text-indigo-600'
                : !canSend
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
