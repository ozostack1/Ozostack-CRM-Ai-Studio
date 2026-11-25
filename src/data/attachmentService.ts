import { TaskAttachment } from '../types/crm';

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(att: Pick<TaskAttachment, 'mimeType' | 'name'>): boolean {
  if (att.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(att.name || '');
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(blob);
  });
}

// Optimize large screenshots client-side so HD clarity stays crisp while keeping storage tiny
async function optimizeImageIfNeeded(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  const originalDataUrl = await readAsDataUrl(file);
  if (file.type === 'image/gif' || file.size <= 420 * 1024) {
    return { dataUrl: originalDataUrl, mimeType: file.type };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUrl: originalDataUrl, mimeType: file.type });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outMime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
      const compressed = canvas.toDataURL(outMime, 0.84);
      if (compressed.length < originalDataUrl.length) {
        resolve({ dataUrl: compressed, mimeType: outMime });
      } else {
        resolve({ dataUrl: originalDataUrl, mimeType: file.type });
      }
    };
    img.onerror = () => resolve({ dataUrl: originalDataUrl, mimeType: file.type });
    img.src = originalDataUrl;
  });
}

export async function uploadTaskAttachment(
  file: File,
  uploadedBy?: string,
  issueNote?: string
): Promise<TaskAttachment> {
  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_MIMES.has(mime)) {
    throw new Error('Only PNG, JPG, WEBP, GIF screenshots and PDF files are supported.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is larger than 6 MB. Please upload a smaller file.');
  }

  let dataUrl = '';
  let finalMime = mime;
  if (mime.startsWith('image/')) {
    const opt = await optimizeImageIfNeeded(file);
    dataUrl = opt.dataUrl;
    finalMime = opt.mimeType;
  } else {
    dataUrl = await readAsDataUrl(file);
  }

  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const resp = await fetch('/api/attachments/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: file.name || (finalMime === 'application/pdf' ? 'document.pdf' : 'screenshot.png'),
      mimeType: finalMime,
      dataBase64: base64,
      uploadedBy: uploadedBy || 'Staff',
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.ok || !data?.attachment) {
    throw new Error(data?.error || 'Upload failed. Please try again.');
  }

  return {
    ...data.attachment,
    issueNote: issueNote?.trim() || undefined,
  };
}

export async function deleteTaskAttachment(id: string): Promise<void> {
  if (!id) return;
  try {
    await fetch(`/api/attachments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    /* ignore cleanup failure */
  }
}
