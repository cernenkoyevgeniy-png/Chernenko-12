import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getMatchCards, recordSwipe, listMyMatches, type MatchCard, type MyMatch } from '@/lib/match';
import {
  Loader2, AlertCircle, Heart, X, MessageCircle, Sparkles, School, Users, RotateCcw,
} from 'lucide-react';
import SparkMark from './SparkMark';
import Avatar from './Avatar';
import UserProfileModal from './UserProfileModal';

type View = 'cards' | 'matches';

export default function MatchPage({ onOpenChat }: { onOpenChat: (userId: string) => void }) {
  const { profile } = useAuth();
  const [view, setView] = useState<View>('cards');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [matches, setMatches] = useState<MyMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchPartner, setMatchPartner] = useState<MatchCard | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileFallback, setProfileFallback] = useState<Partial<{ nickname: string; avatar_url: string | null; bio: string; interests: string[]; school: string | null; grade: string | null }> | undefined>(undefined);

  const loadCards = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await getMatchCards(20);
      setCards(list);
      setIndex(0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка загрузки карточек');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      setMatches(await listMyMatches());
    } catch {
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'cards' && cards.length === 0) loadCards();
    if (view === 'matches') loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleAction = async (action: 'like' | 'skip') => {
    const card = cards[index];
    if (!card || acting) return;
    setActing(true);
    setErr(null);
    try {
      const res = await recordSwipe(card.id, action);
      if (action === 'like' && res.matched) {
        setMatchPartner(card);
        setToast('Взаимное совпадение! Можно начать переписку.');
        await loadMatches();
      }
      setIndex((i) => i + 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить выбор');
    } finally {
      setActing(false);
    }
  };

  const current = cards[index];
  const empty = !loading && index >= cards.length && cards.length >= 0;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <SparkMark className="h-7 w-7" animate />
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Искра Match</h1>
      </div>
      <p className="mt-1 text-sm text-white/55">Находи друзей с похожими интересами</p>

      {/* Вкладки */}
      <div className="mt-5 inline-flex rounded-full border border-white/10 bg-ink-900/60 p-1">
        <button
          onClick={() => setView('cards')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            view === 'cards' ? 'bg-gradient-to-r from-spark-500 to-rose-500 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Карточки
        </button>
        <button
          onClick={() => setView('matches')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            view === 'matches' ? 'bg-gradient-to-r from-spark-500 to-rose-500 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <Heart className="h-4 w-4" /> Совпадения
          {matches.length > 0 && (
            <span className="ml-0.5 rounded-full bg-spark-500/30 px-1.5 text-[11px] font-bold">{matches.length}</span>
          )}
        </button>
      </div>

      {err && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {toast && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-200">
          <Heart className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}

      {view === 'cards' && (
        <CardsView
          loading={loading}
          current={current}
          empty={!!empty}
          hasInterests={(profile?.interests.length ?? 0) > 0}
          acting={acting}
          onLike={() => handleAction('like')}
          onSkip={() => handleAction('skip')}
          onReset={loadCards}
          onOpenProfile={(card) => {
            setProfileUserId(card.id);
            setProfileFallback({
              nickname: card.nickname,
              avatar_url: card.avatar_url,
              bio: card.bio,
              interests: card.interests,
              school: card.school,
              grade: card.grade,
            });
          }}
        />
      )}

      {view === 'matches' && (
        <MatchesView
          loading={matchesLoading}
          matches={matches}
          onOpenChat={onOpenChat}
          onOpenProfile={(m) => {
            setProfileUserId(m.id);
            setProfileFallback({
              nickname: m.nickname,
              avatar_url: m.avatar_url,
              bio: m.bio,
              interests: m.interests,
            });
          }}
        />
      )}

      {matchPartner && (
        <MatchToast
          card={matchPartner}
          onChat={() => {
            onOpenChat(matchPartner.id);
            setMatchPartner(null);
            setToast(null);
          }}
          onClose={() => {
            setMatchPartner(null);
            setToast(null);
          }}
        />
      )}

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          fallback={profileFallback}
          showLike
          onClose={() => { setProfileUserId(null); setProfileFallback(undefined); }}
          onOpenChat={onOpenChat}
          onLiked={(matched) => {
            if (matched) {
              setToast('Взаимное совпадение! Можно начать переписку.');
              loadMatches();
            }
          }}
        />
      )}
    </div>
  );
}

function AvatarLarge({ url, name }: { url: string | null; name: string }) {
  return <Avatar url={url} name={name} size="xl" className="!h-32 !w-32 !text-3xl" />;
}

function CardsView({
  loading, current, empty, hasInterests, acting, onLike, onSkip, onReset, onOpenProfile,
}: {
  loading: boolean;
  current: MatchCard | undefined;
  empty: boolean;
  hasInterests: boolean;
  acting: boolean;
  onLike: () => void;
  onSkip: () => void;
  onReset: () => void;
  onOpenProfile: (card: MatchCard) => void;
}) {
  if (loading) {
    return (
      <div className="mt-10 flex justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-white/40" />
      </div>
    );
  }

  if (empty || !current) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-ink-900/50 p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-white/25" />
        <p className="mt-3 font-display text-lg font-bold">Карточки закончились</p>
        <p className="mt-1 text-sm text-white/55">
          {hasInterests
            ? 'Ты посмотрел все доступные карточки. Загрузи ещё или зайди позже — могут появиться новые люди.'
            : 'Укажи интересы в профиле — тогда здесь появятся подходящие люди.'}
        </p>
        <button
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" /> Загрузить ещё
        </button>
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, Math.round(current.match_percent ?? 0)));

  return (
    <div className="mt-6">
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl">
        <div className="flex flex-col items-center p-6">
          <button onClick={() => onOpenProfile(current)} className="transition-transform hover:scale-105">
            <AvatarLarge url={current.avatar_url} name={current.nickname} />
          </button>
          <button
            onClick={() => onOpenProfile(current)}
            className="mt-4 font-display text-xl font-bold transition-colors hover:text-spark-300"
          >
            {current.nickname}
          </button>
          <button
            onClick={() => onOpenProfile(current)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-spark-300 transition-colors hover:text-spark-200"
          >
            <School className="h-3 w-3" /> Смотреть профиль
          </button>
          {current.bio && <p className="mt-1 text-center text-sm text-white/65">{current.bio}</p>}
          {(current.school || current.grade) && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-white/45">
              <School className="h-3 w-3" />
              {[current.school, current.grade].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Процент совпадения */}
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Совпадение интересов</span>
              <span className="font-semibold text-spark-300">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-spark-500 to-rose-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">
              {current.common_interests} общих из общего числа интересов
            </p>
          </div>

          {current.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {current.interests.slice(0, 8).map((i) => {
                const shared = current.recommended_reason.includes(i);
                return (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      shared ? 'bg-spark-500/25 text-spark-200' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    #{i}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки */}
      <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-4">
        <button
          onClick={onSkip}
          disabled={acting}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-ink-900 text-white/80 shadow-lg transition-all hover:scale-110 disabled:opacity-50"
          title="Пропустить"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          onClick={onLike}
          disabled={acting}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-spark-500 to-rose-500 text-white shadow-xl transition-all hover:scale-110 disabled:opacity-50"
          title="Хочу общаться"
        >
          {acting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Heart className="h-7 w-7" fill="currentColor" />}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-white/40">
        <Heart className="mr-1 inline h-3 w-3 text-spark-300" /> Хочу общаться
        <span className="mx-2">·</span>
        <X className="mr-1 inline h-3 w-3" /> Пропустить
      </p>
    </div>
  );
}

function MatchesView({
  loading, matches, onOpenChat, onOpenProfile,
}: { loading: boolean; matches: MyMatch[]; onOpenChat: (id: string) => void; onOpenProfile: (m: MyMatch) => void }) {
  if (loading) {
    return (
      <div className="mt-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-ink-900/50 p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-white/25" />
        <p className="mt-3 font-display text-lg font-bold">Пока нет совпадений</p>
        <p className="mt-1 text-sm text-white/55">
          Отмечай «Хочу общаться» в карточках — когда оба выразят желание, вы появитесь здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {matches.map((m) => (
        <div key={m.match_id} className="card-hover rounded-2xl border border-white/10 bg-ink-900/50 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenProfile(m)}>
              <Avatar url={m.avatar_url} name={m.nickname} size="lg" />
            </button>
            <button onClick={() => onOpenProfile(m)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-display text-base font-bold">{m.nickname}</p>
              <p className="text-[11px] text-white/45">
                Совпадение с {new Date(m.matched_at).toLocaleDateString('ru-RU')}
              </p>
            </button>
            {m.common_interests > 0 && (
              <span className="rounded-full bg-spark-500/20 px-2.5 py-1 text-[11px] font-semibold text-spark-200">
                {m.common_interests} общих
              </span>
            )}
          </div>
          {m.bio && <p className="mt-2 truncate text-xs text-white/55">{m.bio}</p>}
          {m.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.interests.slice(0, 5).map((i) => (
                <span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">#{i}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onOpenChat(m.id)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" /> Написать
            </button>
            <button
              onClick={() => onOpenProfile(m)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              Профиль
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchToast({ card, onChat, onClose }: { card: MatchCard; onChat: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-spark-500/30 bg-ink-900 p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-spark-500 to-rose-500">
          <Heart className="h-8 w-8 text-white" fill="currentColor" />
        </div>
        <p className="mt-4 font-display text-xl font-extrabold">Это совпадение!</p>
        <p className="mt-1 text-sm text-white/65">
          Ты и <span className="font-semibold text-spark-300">{card.nickname}</span> хотите общаться.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/15 py-2.5 text-sm text-white/70">
            Позже
          </button>
          <button
            onClick={onChat}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" /> Написать
          </button>
        </div>
      </div>
    </div>
  );
}
