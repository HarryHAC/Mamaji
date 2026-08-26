/*
 * Helpers to turn an uploaded file or a live camera frame into a compact
 * data-URL suitable for storing in localStorage (downscaled + JPEG-compressed
 * so a phone photo doesn't overflow the storage quota).
 */

function drawScaled(source, srcW, srcH, maxDim, quality) {
  let w = srcW;
  let h = srcH;
  if (w > h && w > maxDim) {
    h = Math.round((h * maxDim) / w);
    w = maxDim;
  } else if (h >= w && h > maxDim) {
    w = Math.round((w * maxDim) / h);
    h = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w || maxDim;
  canvas.height = h || maxDim;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Read an <input type=file> image into a scaled data URL.
export function fileToDataURL(file, maxDim = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('not-an-image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(drawScaled(img, img.naturalWidth, img.naturalHeight, maxDim, quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('decode-failed'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

// Capture the current frame of a live <video> element into a scaled data URL.
export function videoFrameToDataURL(video, maxDim = 800, quality = 0.82) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) throw new Error('camera-not-ready');
  return drawScaled(video, w, h, maxDim, quality);
}
