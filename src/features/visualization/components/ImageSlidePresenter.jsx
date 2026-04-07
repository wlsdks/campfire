import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 300, damping: 30 };

/**
 * ImageSlidePresenter — 이미지 슬라이드 뷰.
 * currentSlide가 제공되면 Firebase 동기화 (강사 제어).
 * 없으면 로컬 state (호환).
 */
export default memo(function ImageSlidePresenter({ images = [], currentSlide = 0, onSlideChange }) {
  // 다음 슬라이드 미리 로드
  useEffect(() => {
    const next = currentSlide + 1;
    if (next < images.length) {
      const img = new Image();
      img.src = images[next];
    }
  }, [currentSlide, images]);

  if (images.length === 0) return null;

  const current = Math.min(currentSlide, images.length - 1);
  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  function goPrev() { if (hasPrev && onSlideChange) onSlideChange(current - 1); }
  function goNext() { if (hasNext && onSlideChange) onSlideChange(current + 1); }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ aspectRatio: '16/9', maxHeight: '75vh' }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`슬라이드 ${current + 1}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={SPRING}
            loading="eager"
            className="w-full h-full object-contain"
          />
        </AnimatePresence>

        {hasPrev && onSlideChange && (
          <button onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="이전">
            <ChevronLeft size={24} />
          </button>
        )}
        {hasNext && onSlideChange && (
          <button onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="다음">
            <ChevronRight size={24} />
          </button>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button key={i} onClick={() => onSlideChange?.(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`} aria-label={`슬라이드 ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
});
