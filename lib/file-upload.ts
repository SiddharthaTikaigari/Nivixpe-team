export const MAX_UPLOAD_BYTES = Math.floor(1.5 * 1024 * 1024); // 1.5 MB
export const MAX_UPLOAD_LABEL = '1.5 MB';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateFileSize(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${MAX_UPLOAD_LABEL} per document.`;
  }
  return null;
}
