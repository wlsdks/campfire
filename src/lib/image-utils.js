const MAX_WIDTH = 1200;
const MAX_HEIGHT = 900;
const QUALITY = 0.8;
const TIMEOUT_MS = 8000;

/**
 * 브라우저에서 이미지를 리사이즈 + JPEG 압축.
 * 실패 시 원본 반환 (절대 reject하지 않음).
 */
export function compressImage(file) {
  return new Promise((resolve) => {
    // GIF/SVG는 압축하지 않음
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    // 타임아웃 — 8초 안에 안 되면 원본
    const timeout = setTimeout(() => {
      resolve(file);
    }, TIMEOUT_MS);

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);

        try {
          let { width, height } = img;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            QUALITY,
          );
        } catch {
          resolve(file);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    } catch {
      clearTimeout(timeout);
      resolve(file);
    }
  });
}
