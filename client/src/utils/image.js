const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/** Read a user photo as a data URL, with the validation the README promises. */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!ALLOWED.includes(file.type)) {
      return reject(new Error('Please use a JPG, PNG or WebP image.'));
    }
    if (file.size > MAX_BYTES) {
      return reject(new Error('That image is over 8MB. Try a smaller one.'));
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("MAVIE couldn't read that image."));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a photo and shrink it before upload.
 *
 * Base64 inflates bytes by a third, so a phone photo straight off the camera
 * can land past the server's body limit and fail as a 413 — which reads as the
 * upload silently doing nothing. Closet thumbnails are shown at a couple of
 * hundred pixels, so there is nothing to lose by capping the long edge.
 *
 * Skin analysis and try-on deliberately do NOT use this: those APIs have their
 * own minimum resolutions and should get the photo as taken.
 */
export async function readImageScaled(file, maxEdge = 1200, quality = 0.85) {
  const dataUrl = await readImage(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('decode failed'));
      i.src = dataUrl;
    });

    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    if (scale === 1 && dataUrl.length < 1.5e6) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    // Better to send the original than to lose the photo over a resize.
    return dataUrl;
  }
}
