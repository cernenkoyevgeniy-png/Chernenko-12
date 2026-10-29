import { useState } from 'react';
import { Search, MessageCircle, Sparkles, X, Check } from 'lucide-react';
import SparkMark from './SparkMark';
import { INTEREST_CATEGORIES } from '@/lib/types';

export default function Demo() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const toggle = (k: string) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const mockPeople = [
    { nick: 'миша', interests: ['музыка', 'игры'], match: 2 },
    { nick: 'лена', interests: ['музыка', 'аниме'], match: 1 },
    { nick: 'костя', interests: ['программирование', 'игры'], match: 1 },
    { nick: 'софия', interests: ['музыка', 'книги'], match: 1 },
  ];

  const filtered = mockPeople.filter(
    (p) =>
      p.nick.toLowerCase().includes(query.toLowerCase()) &&
      (picked.length === 0 || p.interests.some((i) => picked.includes(i))),
  );

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-spark-300">
            Демонстрация
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Как Искра <span className="text-gradient-spark">зажигает</span> общение
          </h2>
          <p className="mt-5 text-lg text-white/65">
            Три коротких шага — выбери интересы, найди людей, начни переписку.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          {/* Stepper */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step ? 'w-10 bg-spark-500' : i < step ? 'w-6 bg-spark-500/50' : 'w-6 bg-white/15'
                }`}
              />
            ))}
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8">
            {step === 0 && (
              <div className="animate-rise">
                <div className="flex items-center gap-2 text-sm font-semibold text-spark-200">
                  <Sparkles className="h-4 w-4" /> Шаг 1 · Выбери интересы
                </div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {INTEREST_CATEGORIES.map((c) => {
                    const on = picked.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        onClick={() => toggle(c.key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          on
                            ? 'border-spark-500/60 bg-spark-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {on && <Check className="h-3.5 w-3.5 text-spark-300" />}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-white/45">Выбрано: {picked.length}</span>
                  <button
                    onClick={() => setStep(1)}
                    disabled={picked.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Дальше
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-rise">
                <div className="flex items-center gap-2 text-sm font-semibold text-spark-200">
                  <Search className="h-4 w-4" /> Шаг 2 · Найди людей
                </div>
                <div className="relative mt-5">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по нику..."
                    className="w-full rounded-xl border border-white/10 bg-ink-900/60 py-3 pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-spark-500/60"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-sm text-white/45">Никого не найдено</p>
                  )}
                  {filtered.map((p) => (
                    <div
                      key={p.nick}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-spark-500/40 to-rose-500/30 font-display text-sm font-bold uppercase text-white">
                        {p.nick[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{p.nick}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.interests.map((i) => (
                            <span
                              key={i}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70"
                            >
                              #{i}
                            </span>
                          ))}
                        </div>
                      </div>
                      {p.match > 0 && (
                        <span className="shrink-0 rounded-full bg-spark-500/20 px-2 py-1 text-[11px] font-semibold text-spark-200">
                          {p.match} общих
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setStep(0)}
                    className="text-sm text-white/55 transition-colors hover:text-white"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
                  >
                    Дальше
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-rise">
                <div className="flex items-center gap-2 text-sm font-semibold text-spark-200">
                  <MessageCircle className="h-4 w-4" /> Шаг 3 · Начни переписку
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-ink-900/60 p-4">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-spark-500 to-rose-500 font-display text-sm font-bold text-white">
                      М
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">миша</p>
                      <p className="text-xs text-emerald-300">в сети</p>
                    </div>
                    <SparkMark className="ml-auto h-5 w-5" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm text-white">
                      привет! вижу, ты тоже в музыку и игры 🎸
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-spark-500 to-rose-500 px-3.5 py-2.5 text-sm text-white">
                      да! что сейчас играешь?
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-white/55 transition-colors hover:text-white"
                  >
                    Назад
                  </button>
                  <a
                    href="#join"
                    onClick={() => { setStep(0); setPicked([]); setQuery(''); }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
                  >
                    <X className="hidden h-3 w-3" /> Попробовать
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
