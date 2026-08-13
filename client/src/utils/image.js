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
