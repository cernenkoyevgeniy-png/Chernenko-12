import { useEffect, useState } from 'react';
import { searchProfiles, listRecommended, searchBySchool } from '@/lib/profiles';
import type { Profile } from '@/lib/types';
import { INTEREST_CATEGORIES } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import {
  Search, MessageCircle, Ban, Info, AlertCircle, Loader2,
  Sparkles, School,
} from 'lucide-react';
import Avatar from './Avatar';
import UserProfileModal from './UserProfileModal';

type Tab = 'search' | 'recommended';

export default function PeoplePage({ onOpenChat }: { onOpenChat: (userId: string) => void }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('recommended');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [gradeQuery, setGradeQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [recommended, setRecommended] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileFallback, setProfileFallback] = useState<Partial<Profile> | undefined>(undefined);
  const [reasonFor, setReasonFor] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await searchProfiles({ query, interests: picked });
      setResults(list.filter((p) => p.id !== user?.id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const runSchoolSearch = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await searchBySchool(schoolQuery, gradeQuery);
      setResults(list as unknown as Profile[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка поиска по школе');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await listRecommended(24);
      setRecommended(list as unknown as Profile[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка загрузки рекомендаций');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'recommended') loadRecommended();
    else if (results.length === 0) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleInterest = (k: string) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const openProfile = (p: Profile) => {
    setProfileFallback({ nickname: p.nickname, avatar_url: p.avatar_url, bio: p.bio, interests: p.interests, school: p.school, grade: p.grade, created_at: p.created_at });
    setProfileUserId(p.id);
  };

  const list = tab === 'recommended' ? recommended : results;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Люди</h1>
      <p className="mt-1 text-sm text-white/55">Найди друзей по интересам</p>

      {/* Вкладки */}
      <div className="mt-5 inline-flex rounded-full border border-white/10 bg-ink-900/60 p-1">
        <button
          onClick={() => setTab('recommended')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            tab === 'recommended' ? 'bg-gradient-to-r from-spark-500 to-rose-500 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Рекомендации
        </button>
        <button
          onClick={() => setTab('search')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            tab === 'search' ? 'bg-gradient-to-r from-spark-500 to-rose-500 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <Search className="h-4 w-4" /> Поиск
        </button>
      </div>

      {/* Фильтры поиска */}
      {tab === 'search' && (
        <div className="mt-5 rounded-3xl border border-white/10 bg-ink-900/50 p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Поиск по нику..."
              className="w-full rounded-xl border border-white/10 bg-ink-900/60 py-3 pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-spark-500/60"
            />
          </div>

          {/* Фильтр интересов */}
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map((c) => {
              const on = picked.includes(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleInterest(c.key)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    on ? 'border-spark-500/60 bg-spark-500/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Фильтр школы/класса */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSchoolSearch()}
                placeholder="Школа..."
                className="w-full rounded-xl border border-white/10 bg-ink-900/60 py-3 pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-spark-500/60"
              />
            </div>
            <input
              value={gradeQuery}
              onChange={(e) => setGradeQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSchoolSearch()}
              placeholder="Класс (напр. 7А)..."
              className="flex-1 rounded-xl border border-white/10 bg-ink-900/60 py-3 px-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-spark-500/60"
            />
            <button
              onClick={runSchoolSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5"
            >
              <School className="h-4 w-4" /> По школе
            </button>
          </div>

          <button
            onClick={runSearch}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            <Search className="h-4 w-4" /> Найти
          </button>
        </div>
      )}

      {/* Заголовок рекомендаций */}
      {tab === 'recommended' && (
        <div className="mt-5 mb-2 flex items-center gap-2 text-sm text-white/55">
          <Sparkles className="h-4 w-4 text-spark-300" />
          {profile && profile.interests.length > 0
            ? 'Подобрано по твоим интересам'
            : 'Укажи интересы в профиле — и здесь появятся рекомендации'}
        </div>
      )}

      {err && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4" /> {err}
        </div>
      )}

      {/* Список карточек */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {loading && list.length === 0 && (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/10 bg-ink-900/50 p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-white/25" />
            <p className="mt-3 text-sm text-white/55">
              {tab === 'recommended' ? 'Пока некого рекомендовать' : 'Никого не найдено'}
            </p>
            <p className="mt-1 text-xs text-white/40">
              {tab === 'recommended'
                ? 'Заполни интересы в профиле, чтобы получить рекомендации'
                : 'Попробуй изменить запрос или фильтры'}
            </p>
          </div>
        )}
        {list.map((p) => {
          const common = profile
            ? p.interests.filter((i) => profile.interests.includes(i)).length
            : (p as unknown as { common_interests?: number }).common_interests ?? 0;
          const reason = (p as unknown as { recommended_reason?: string[] }).recommended_reason;
          return (
            <div key={p.id} className="card-hover rounded-2xl border border-white/10 bg-ink-900/50 p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => openProfile(p)}>
                  <Avatar url={p.avatar_url} name={p.nickname} size="lg" />
                </button>
                <button onClick={() => openProfile(p)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-display text-base font-bold text-white">{p.nickname}</p>
                  {p.bio && <p className="truncate text-xs text-white/55">{p.bio}</p>}
                  {(p.school || p.grade) && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/45">
                      <School className="h-3 w-3" />
                      {[p.school, p.grade].filter(Boolean).join(', ')}
                    </p>
                  )}
                </button>
              </div>
              {p.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.interests.slice(0, 5).map((i) => {
                    const shared = profile?.interests.includes(i);
                    return (
                      <span
                        key={i}
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          shared ? 'bg-spark-500/25 text-spark-200' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        #{i}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onOpenChat(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Написать
                </button>
                {common > 0 && (
                  <span className="rounded-full bg-spark-500/20 px-2.5 py-1 text-[11px] font-semibold text-spark-200">
                    {common} общих
                  </span>
                )}
                {tab === 'recommended' && reason && reason.length > 0 && (
                  <button
                    onClick={() => setReasonFor(reasonFor === p.id ? null : p.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/60 transition-colors hover:text-white"
                  >
                    <Info className="h-3 w-3" /> Почему?
                  </button>
                )}
                <button
                  onClick={() => openProfile(p)}
                  className="ml-auto text-xs text-white/45 transition-colors hover:text-white"
                >
                  Профиль
                </button>
              </div>
              {reasonFor === p.id && reason && reason.length > 0 && (
                <div className="mt-2 rounded-xl border border-spark-500/20 bg-spark-500/10 px-3 py-2 text-xs text-white/75">
                  <span className="font-semibold text-spark-200">Общие интересы:</span>{' '}
                  {reason.map((r) => `#${r}`).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          fallback={profileFallback}
          onClose={() => { setProfileUserId(null); setProfileFallback(undefined); }}
          onOpenChat={onOpenChat}
        />
      )}
    </div>
  );
}
