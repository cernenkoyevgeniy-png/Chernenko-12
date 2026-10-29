import { supabase } from '@/lib/supabase';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_DIM = 512;
export const AVATAR_MAX_INPUT_BYTES = 20 * 1024 * 1024;

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === 'image/heic' || t === 'image/heif') return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'heic' || ext === 'heif';
}

async function convertHeic(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  return Array.isArray(result) ? result[0] : result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Изображение пустое'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    img.src = src;
  });
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function imageToJpegBlob(img: HTMLImageElement, dim = AVATAR_DIM): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать изображение');
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(0, 0, dim, dim);
  const scale = Math.max(dim / img.naturalWidth, dim / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  ctx.drawImage(img, (dim - sw) / 2, (dim - sh) / 2, sw, sh);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b && b.size > 0 ? resolve(b) : reject(new Error('Не удалось обработать изображение'))),
      'image/jpeg',
      0.9,
    );
  });
  return blob;
}

/**
 * Нормализует выбранный файл в JPEG Blob размером 512×512.
 * Конвертирует HEIC/HEIF и неизвестные форматы через canvas.
 * Бросает понятную ошибку, если браузер не может декодировать файл.
 */
export async function normalizeImageFile(
  file: File,
): Promise<{ blob: Blob; mime: string; ext: string }> {
  if (!file.type.startsWith('image/') && !isHeic(file)) {
    throw new Error('Можно загружать только изображения');
  }
  if (file.size > AVATAR_MAX_INPUT_BYTES) {
    throw new Error('Файл слишком большой. Выбери изображение до 20 МБ.');
  }

  let workFile: File = file;

  if (isHeic(file)) {
    try {
      const jpgBlob = await convertHeic(file);
      workFile = new File([jpgBlob], 'photo.jpg', { type: 'image/jpeg' });
    } catch {
      throw new Error(
        'Не удалось обработать HEIC-фото. Попробуй сделать снимок прямо в приложении или сохрани фото как JPG.',
      );
    }
  }

  try {
    const img = await fileToImage(workFile);
    const blob = await imageToJpegBlob(img);
    return { blob, mime: 'image/jpeg', ext: 'jpg' };
  } catch (firstErr) {
    if (isHeic(file)) {
      throw new Error(
        'Не удалось обработать HEIC-фото. Попробуй сделать снимок прямо в приложении или сохрани фото как JPG.',
      );
    }
    throw firstErr;
  }
}

/**
 * Обрезает выбранный файл в квадрат 512×512 (cover-crop по центру).
 */
export async function cropToSquareBlob(file: File, dim = AVATAR_DIM): Promise<Blob> {
  const { blob } = await normalizeImageFile(file);
  return blob;
}

/**
 * Загружает обработанный аватар в storage bucket 'avatars' и возвращает
 * публичный URL с параметром кеш-бастинга.
 */
export async function uploadAvatarBlob(userId: string, blob: Blob, ext = 'jpg'): Promise<string> {
  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error('Размер файла не должен превышать 2 МБ');
  }
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { cacheControl: '3600', upsert: true, contentType: 'image/jpeg' });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * Удаляет файл аватара из storage по URL (если это наш bucket).
 */
export async function removeAvatarFromStorage(url: string): Promise<void> {
  try {
    const marker = '/storage/v1/object/public/avatars/';
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
    if (!path) return;
    await supabase.storage.from('avatars').remove([path]);
  } catch {
    // best effort
  }
}
