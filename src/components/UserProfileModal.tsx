import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getProfileVisible, isBlocked, blockUser, unblockUser, reportUser } from '@/lib/profiles';
import { recordSwipe } from '@/lib/match';
import type { Profile } from '@/lib/types';
import { REPORT_REASONS } from '@/lib/types';
import Avatar from './Avatar';
import {
  X, MessageCircle, Heart, Ban, Flag, Check, Loader2, Lock, School, AlertCircle,
} from 'lucide-react';

type Props = {
  userId: string;
  onClose: () => void;
  onOpenChat: (id: string) => void;
  /** Дополнительные данные для отображения, пока грузится полный профиль. */
  fallback?: Partial<Profile>;
  /** Показывать кнопку «Хочу общаться» (для Искра Match). */
  showLike?: boolean;
  /** Вызывается после успешного «Хочу общаться». */
  onLiked?: (matched: boolean) => void;
};

export default function UserProfileModal({
  userId, onClose, onOpenChat, fallback, showLike = false, onLiked,
}: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [likeResult, setLikeResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const full = await getProfileVisible(userId);
        if (alive) setProfile(full);
      } catch {
        if (alive) setErr('Не удалось загрузить профиль');
      } finally {
        if (alive) setLoading(false);
      }
      try {
        const bl = await isBlocked(userId);
        if (alive) setBlocked(bl);
      } catch { /* best effort */ }
    })();
    return () => { alive = false; };
  }, [userId]);

  const isSelf = user?.id === userId;

  const handleBlock = async () => {
    setBlocking(true);
    try {
      if (blocked) await unblockUser(userId);
      else await blockUser(userId);
      setBlocked((v) => !v);
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!reason) return;
    setReporting(true);
    setMsg(null);
    try {
      await reportUser(userId, reason);
      setMsg('Жалоба отправлена модераторам');
      setReportOpen(false);
      setReason('');
    } finally {
      setReporting(false);
    }
  };

  const handleLike = async () => {
    setLiking(true);
    setLikeResult(null);
    try {
      const res = await recordSwipe(userId, 'like');
      if (res.matched) {
        setLikeResult('Взаимное совпадение! Можно начать переписку.');
      } else {
        setLikeResult('Отмечено! Если человек тоже отметит тебя — появится в совпадениях.');
      }
      onLiked?.(res.matched);
    } catch {
      setLikeResult('Не удалось сохранить выбор. Попробуй ещё раз.');
    } finally {
      setLiking(false);
    }
  };

  const nickname = profile?.nickname ?? fallback?.nickname ?? '...';
  const avatarUrl = profile?.avatar_url ?? fallback?.avatar_url ?? null;
  const bio = profile?.bio ?? fallback?.bio ?? '';
  const interests = profile?.interests ?? fallback?.interests ?? [];
  const school = profile?.school ?? fallback?.school ?? null;
  const grade = profile?.grade ?? fallback?.grade ?? null;
  const createdAt = profile?.created_at ?? '';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar url={avatarUrl} name={nickname} size="lg" className="!h-16 !w-16 !text-2xl" />
            <div>
              <p className="font-display text-lg font-bold">{nickname}</p>
              {createdAt && (
                <p className="text-xs text-white/45">В Искре с {new Date(createdAt).toLocaleDateString('ru-RU')}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        )}

        {err && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4" /> {err}
          </div>
        )}

        {!loading && !err && (
          <>
            {bio && <p className="mt-4 text-sm text-white/75">{bio}</p>}

            {(school || grade) && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
                <School className="h-3.5 w-3.5 text-spark-300" />
                {[school, grade].filter(Boolean).join(', ')}
              </div>
            )}

            {interests.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Интересы</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <span key={i} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">#{i}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {msg && <p className="mt-4 text-sm text-emerald-300">{msg}</p>}
        {likeResult && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-spark-500/30 bg-spark-500/10 px-3.5 py-2.5 text-sm text-spark-200">
            <Heart className="h-4 w-4 shrink-0" /> {likeResult}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2">
          {!isSelf && (
            <button
              onClick={() => onOpenChat(userId)}
              disabled={blocked}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {blocked ? <><Lock className="h-4 w-4" /> Пользователь заблокирован</> : <><MessageCircle className="h-4 w-4" /> Написать</>}
            </button>
          )}

          {showLike && !isSelf && !blocked && (
            <button
              onClick={handleLike}
              disabled={liking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-spark-500/40 px-5 py-3 text-sm font-semibold text-spark-200 transition-colors hover:bg-spark-500/10 disabled:opacity-50"
            >
              {liking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              Хочу общаться
            </button>
          )}

          {!isSelf && (
            <>
              {!reportOpen ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleBlock}
                    disabled={blocking}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
                  >
                    <Ban className="h-4 w-4" /> {blocked ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
                  >
                    <Flag className="h-4 w-4" /> Пожаловаться
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">Причина жалобы</p>
                  <div className="mt-3 space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
                          reason === r ? 'border-spark-500/60 bg-spark-500/15 text-white' : 'border-white/10 text-white/75 hover:text-white'
                        }`}
                      >
                        {r}
                        {reason === r && <Check className="h-4 w-4 text-spark-300" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { setReportOpen(false); setReason(''); }} className="flex-1 rounded-full border border-white/15 py-2 text-sm text-white/70">
                      Отмена
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={!reason || reporting}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-500/80 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Отправить
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isSelf && (
            <p className="text-center text-sm text-white/45">Это твой профиль</p>
          )}
        </div>
      </div>
    </div>
  );
}
