import { useState, useRef, memo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage } from '@/lib/image-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_SIZE_MB = 20; // 압축 전 원본 허용 (압축 후 1-2MB)
const MAX_IMAGES = 10;
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg';

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

    // 5MB 초과 파일 제외 (나머지는 진행)
    const valid = toUpload.filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024);
    if (valid.length < toUpload.length) {
      setError(`${toUpload.length - valid.length}개 파일이 ${MAX_SIZE_MB}MB 초과하여 제외됨`);
      setTimeout(() => setError(null), 3000);
    }
    if (valid.length === 0) return;

    setUploading(true);
    // 순차 업로드 — 개별 실패해도 나머지 계속 진행
    const urls = [];
    let failCount = 0;
    for (let i = 0; i < valid.length; i++) {
      try {
        const file = valid[i];
        // 2MB 이하면 압축 생략 (Edge 호환성)
        const blob = file.size < 2 * 1024 * 1024 ? file : await compressImage(file);
        const ext = (blob.type || '').includes('jpeg') ? 'jpg' : file.name.split('.').pop() || 'jpg';
        const path = `questions/${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob, { contentType: blob.type || file.type || 'image/jpeg' });
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      } catch (err) {
        console.error('Image upload failed:', valid[i].name, err);
        failCount++;
      }
    }
    if (urls.length > 0) onChange([...images, ...urls]);
    if (failCount > 0) {
      setError(`${failCount}개 이미지 업로드 실패`);
      setTimeout(() => setError(null), 3000);
    }
    setUploading(false);
  }

  function removeImage(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(index, direction) {
    const next = [...images];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    onChange(next);
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1">
                  <span className="absolute top-1 left-1 w-5 h-5 rounded bg-black/50 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {i > 0 && (
                    <button onClick={() => moveImage(i, -1)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white/80 text-slate-700 flex items-center justify-center transition-opacity"
                      aria-label="앞으로"><ChevronLeft size={14} /></button>
                  )}
                  <button onClick={() => removeImage(i)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center transition-opacity"
                    aria-label="삭제"><X size={12} /></button>
                  {i < images.length - 1 && (
                    <button onClick={() => moveImage(i, 1)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white/80 text-slate-700 flex items-center justify-center transition-opacity"
                      aria-label="뒤로"><ChevronRight size={14} /></button>
                  )}
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
