import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Flame, Heart, Laugh, HandMetal } from 'lucide-react';
import { useReactions } from '@/features/reactions/api/useReactions';

const ICON_MAP = {
  thumbsup: ThumbsUp,
  fire: Flame,
  heart: Heart,
  laugh: Laugh,
  clap: HandMetal,
};

export default function ReactionOverlay({ sessionId }) {
  const { reactions } = useReactions(sessionId);
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (!latest) return;
    const bubble = {
      id: latest.id + Date.now(),
      type: latest.type,
      x: 20 + Math.random() * 60,
    };
    setBubbles(prev => [...prev.slice(-15), bubble]);
    const timer = setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 2000);
    return () => clearTimeout(timer);
  }, [reactions.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {bubbles.map((bubble) => {
          const Icon = ICON_MAP[bubble.type] || ThumbsUp;
          return (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 1, y: '100vh', x: `${bubble.x}vw`, scale: 0.8 }}
              animate={{ opacity: 0, y: '20vh', scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute text-indigo-500"
            >
              <Icon size={28} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
