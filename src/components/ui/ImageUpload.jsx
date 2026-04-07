import { useState, useRef, memo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2 } from 'lucide-react';

const MAX_SIZE_MB = 5;
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp';

/**
 * ImageUpload — 이미지 업로드 + 미리보기.
 * Firebase Storage에 저장하고 URL을 반환.
 */
export default memo(function ImageUpload({ value, onChange, folder = 'questions' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`${MAX_SIZE_MB}MB 이하 이미지만 가능합니다`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch {
      setError('업로드 실패. 다시 시도해주세요.');
      setTimeout(() => setError(null), 3000);
    }
    setUploading(false);
  }

  function handleRemove() {
    onChange('');
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <img
              src={value}
              alt="업로드된 이미지"
              className="w-full max-h-48 object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
              aria-label="이미지 삭제"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <ImagePlus size={16} />
                이미지 첨부 (선택)
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
});
