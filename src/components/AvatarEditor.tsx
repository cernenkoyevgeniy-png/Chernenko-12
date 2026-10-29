import { useRef, useState, useEffect } from 'react';
import { normalizeImageFile, AVATAR_DIM, uploadAvatarBlob } from '@/lib/avatar';
import { Loader2, Camera, Trash2, Check, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

type Props = {
  userId: string;
  currentUrl: string | null;
  onSaved: (url: string) => void;
  onRemoved: () => void;
};

export default function AvatarEditor({ userId, currentUrl, onSaved, onRemoved }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:bg-white/5"
        >
          <Camera className="h-3.5 w-3.5" /> Изменить фото
        </button>
        {currentUrl && (
          <button
            onClick={async () => {
              setBusy(true);
              setErr(null);
              try {
                const { removeAvatar } = await import('@/lib/profiles');
                await removeAvatar(userId, currentUrl);
                onRemoved();
              } catch (e) {
                setErr(e instanceof Error ? e.message : 'Не удалось удалить фото');
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-rose-300 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Удалить фото
          </button>
        )}
        {err && <p className="text-xs text-rose-300">{err}</p>}
      </div>
      {open && (
        <CropModal
          userId={userId}
          onClose={() => setOpen(false)}
          onSaved={(url) => {
            onSaved(url);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function CropModal({
  userId, onClose, onSaved,
}: { userId: string; onClose: () => void; onSaved: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    try {
      const { blob } = await normalizeImageFile(f);
      const u = URL.createObjectURL(blob);
      setImgUrl(u);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Не удалось открыть изображение');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const save = async () => {
    if (!imgUrl) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await renderCroppedBlob(imgUrl, zoom, offset);
      const url = await uploadAvatarBlob(userId, blob, 'jpg');
      onSaved(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить фото');
    } finally {
      setBusy(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onPointerUp = () => setDragging(false);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">Аватар</p>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage */}
        <div className="mt-4 flex flex-col items-center">
          <div
            className="relative h-56 w-56 touch-none select-none overflow-hidden rounded-full border border-white/15 bg-ink-800"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt=""
                draggable={false}
                className="absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/40">
                <Camera className="h-8 w-8" />
                <p className="text-xs">Выбери фото из галереи</p>
              </div>
            )}
          </div>

          {imgUrl && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/5"
                title="Уменьшить"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 accent-spark-500"
              />
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/5"
                title="Увеличить"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/5"
                title="Сбросить"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
            onChange={pickFile}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/5"
          >
            <Camera className="h-4 w-4" /> Выбрать фото
          </button>
          <p className="mt-2 text-[11px] text-white/40">
            Перетаскивай для выбора области, меняй масштаб. JPG, PNG, WebP, HEIC. До 20 МБ.
          </p>
          {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/15 py-2.5 text-sm text-white/70">
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!imgUrl || busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

async function renderCroppedBlob(
  imgUrl: string,
  zoom: number,
  offset: { x: number; y: number },
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      if (im.naturalWidth === 0) {
        reject(new Error('Не удалось загрузить изображение'));
        return;
      }
      resolve(im);
    };
    im.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    im.src = imgUrl;
  });
  const dim = AVATAR_DIM;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать изображение');

  const stage = 224;
  const baseScale = Math.max(stage / img.naturalWidth, stage / img.naturalHeight);
  const totalScale = baseScale * zoom;
  const sw = img.naturalWidth * totalScale;
  const sh = img.naturalHeight * totalScale;
  const dx = (dim - sw) / 2 + (offset.x / stage) * dim;
  const dy = (dim - sh) / 2 + (offset.y / stage) * dim;
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(0, 0, dim, dim);
  ctx.drawImage(img, dx, dy, sw, sh);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b && b.size > 0 ? resolve(b) : reject(new Error('Не удалось обработать изображение'))),
      'image/jpeg',
      0.9,
    );
  });
  return blob;
}
