import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 300, damping: 30 };

/**
 * ImageSlidePresenter — 이미지 슬라이드 뷰.
 * 프레젠터/라이브/학생 공용.
 * 좌우 화살표로 이미지 전환, 하단에 인디케이터.
 */
export default memo(function ImageSlidePresenter({ images = [] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Image area */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`슬라이드 ${current + 1}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={SPRING}
            className="w-full h-full object-contain"
          />
        </AnimatePresence>

        {/* 좌우 화살표 */}
        {hasPrev && (
          <button
            onClick={() => setCurrent(c => c - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="이전 이미지"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="다음 이미지"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* 페이지 카운터 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* 인디케이터 dots */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current
                  ? 'bg-slate-900 dark:bg-slate-100'
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
