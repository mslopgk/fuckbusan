/**
 * Compress an image file using Canvas API before upload.
 * Non-image files are rejected. Corrupted images are rejected.
 */
export async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = {}) {
  if (!file) throw new Error('파일이 없습니다.');
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축에 실패했습니다.'));
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], newName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('손상되었거나 지원하지 않는 이미지 형식입니다.'));
    };

    img.src = objectUrl;
  });
}
