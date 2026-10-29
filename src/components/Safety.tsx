import { ShieldCheck, Lock, EyeOff, UserX, Check } from 'lucide-react';

const guarantees = [
  'Никаких телефонов, школ и геолокации',
  'Переписка видна только двум участникам',
  'Спам и буллинг модерируются сообществом',
  'Можно скрыть профиль из поиска в один тап',
];

const cards = [
  {
    icon: Lock,
    title: 'Минимум данных',
    desc: 'Только ник и интересы. Мы не спрашиваем того, что не нужно для дружбы.',
  },
  {
    icon: EyeOff,
    title: 'Приватные диалоги',
    desc: 'Личные сообщения не попадают в публичные ленты и не индексируются.',
  },
  {
    icon: UserX,
    title: 'Контроль видимости',
    desc: 'Решаешь сам, кто может найти тебя и написать первым. В любой момент.',
  },
];

export default function Safety() {
  return (
    <section id="safety" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Безопасность
            </span>
            <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Дружба должна быть <span className="text-gradient-spark">безопасной</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg text-white/65">
              Искра создана для школьников и продумана так, чтобы общение
              приносило радость, а не тревогу.
            </p>

            <ul className="mt-8 space-y-3">
              {guarantees.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-spark-500 to-rose-500">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="text-[15px] text-white/85">{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {cards.map((c) => (
              <article
                key={c.title}
                className="card-hover group flex gap-5 rounded-3xl border border-white/10 bg-ink-900/60 p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <c.icon className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{c.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
