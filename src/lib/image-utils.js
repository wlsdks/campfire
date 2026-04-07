const MAX_WIDTH = 1200;
const MAX_HEIGHT = 900;
const QUALITY = 0.8;

/**
 * 브라우저에서 이미지를 리사이즈 + JPEG 압축.
 * Canvas API 사용, 네트워크/서버 불필요.
 * @param {File} file
 * @returns {Promise<Blob>} 압축된 이미지 Blob
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    // GIF는 압축하지 않음 (애니메이션 유지)
    if (file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 리사이즈 (비율 유지)
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
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file); // fallback
          }
        },
        'image/jpeg',
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}
