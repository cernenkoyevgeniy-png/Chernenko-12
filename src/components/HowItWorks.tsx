import { UserPlus, Search, MessageCircle, Sparkles } from 'lucide-react';

const steps = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Создай профиль',
    desc: 'Придумай ник и выбери интересы. Без телефона и личных данных — за минуту.',
  },
  {
    n: '02',
    icon: Search,
    title: 'Найди своих',
    desc: 'Ищи людей по увлечениям: музыка, игры, наука, книги. Смотри карточки и откликайся.',
  },
  {
    n: '03',
    icon: MessageCircle,
    title: 'Начни диалог',
    desc: 'Напиши в личные сообщения. Переписка видна только вам двоим — без посторонних.',
  },
  {
    n: '04',
    icon: Sparkles,
    title: 'Поддерживай искру',
    desc: 'Общайся, обменивайся идеями и находи новых друзей на общей волне.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-ink-900/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-spark-300">
            Как это работает
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Четыре шага до <span className="text-gradient-spark">нового друга</span>
          </h2>
        </div>

        <div className="relative mt-16">
          {/* connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-[88px] hidden h-px bg-gradient-to-r from-transparent via-spark-500/40 to-transparent lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="card-hover group relative rounded-3xl border border-white/10 bg-ink-900/60 p-7 text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-spark-500/20 to-rose-500/10">
                  <s.icon className="h-7 w-7 text-spark-300" />
                  <span className="absolute -right-2 -top-2 rounded-full bg-ink-800 px-2 py-0.5 text-[11px] font-bold text-spark-200 ring-1 ring-white/10">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
