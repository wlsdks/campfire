import { useState, useRef, memo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage } from '@/lib/image-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, GripVertical } from 'lucide-react';

const MAX_SIZE_MB = 5;
const MAX_IMAGES = 10;
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp';

export default memo(function MultiImageUpload({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) {
      setError(`최대 ${MAX_IMAGES}장까지 가능합니다`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const oversized = toUpload.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`${MAX_SIZE_MB}MB 이하 이미지만 가능합니다`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(toUpload.map(async (file) => {
        const compressed = await compressImage(file);
        const path = `questions/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
        return getDownloadURL(storageRef);
      }));
      onChange([...images, ...urls]);
    } catch {
      setError('업로드 실패. 다시 시도해주세요.');
      setTimeout(() => setError(null), 3000);
    }
    setUploading(false);
  }

  function removeImage(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {images.map((url, i) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group"
              >
                <img src={url} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="absolute top-1 left-1 w-5 h-5 rounded bg-black/50 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => removeImage(i)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center transition-opacity"
                    aria-label="이미지 삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full py-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> 업로드 중...</>
          ) : (
            <><ImagePlus size={16} /> 이미지 추가 ({images.length}/{MAX_IMAGES})</>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
});
