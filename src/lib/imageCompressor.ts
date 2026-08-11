/**
 * Automatically compresses and resizes images in the browser before uploading to Firebase Storage.
 * Preserves high visual quality for promotional posters and banners while drastically
 * reducing payload size (e.g., converting 8-15MB raw images down to 150-350KB).
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // If not an image or if SVG, return original file as-is
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  // If file size is already very modest (< 300KB), return original file
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate proportional scaling if dimensions exceed maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original if canvas context is unavailable
        return;
      }

      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format (prefer WebP or JPEG)
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression did not decrease size, use original
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: blob.type || outputType,
            lastModified: Date.now(),
          });

          console.log(
            `[ImageCompressor] Optimized "${file.name}": ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB (${width}x${height}px)`
          );

          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback on image loading error
    };

    img.src = objectUrl;
  });
}
