import { Search, MessageCircle, ShieldCheck, Users, Bell, Heart } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Люди по интересам',
    desc: 'Ищи по нику или увлечениям — музыка, игры, наука. Находи тех, кто на одной волне.',
    accent: 'from-spark-500/30 to-spark-500/0',
    iconColor: 'text-spark-300',
  },
  {
    icon: MessageCircle,
    title: 'Личные сообщения',
    desc: 'Переписка видна только вам двоим. Никаких публичных лент и чужих комментариев.',
    accent: 'from-rose-500/30 to-rose-500/0',
    iconColor: 'text-rose-300',
  },
  {
    icon: ShieldCheck,
    title: 'Приватность',
    desc: 'Не нужны телефон, школа, дата рождения и геолокация. Только ник и интересы.',
    accent: 'from-ember-500/30 to-ember-500/0',
    iconColor: 'text-ember-400',
  },
  {
    icon: Users,
    title: 'Сообщества по темам',
    desc: 'Объединяйся в группы по любимым играм, группам и хобби. Общее — в одно касание.',
    accent: 'from-spark-500/30 to-rose-500/0',
    iconColor: 'text-spark-300',
  },
  {
    icon: Bell,
    title: 'Тихие уведомления',
    desc: 'Ты сам решаешь, что важно. Никаких шумных пушей — только то, что ты выбрал.',
    accent: 'from-ember-500/30 to-spark-500/0',
    iconColor: 'text-ember-400',
  },
  {
    icon: Heart,
    title: 'Дружба, а не лайки',
    desc: 'Здесь нет гонки за охватами. Главная метрика — живое общение и тёплые диалоги.',
    accent: 'from-rose-500/30 to-spark-500/0',
    iconColor: 'text-rose-300',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-spark-300">
            Возможности
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Всё, чтобы <span className="text-gradient-spark">загореться</span> общением
          </h2>
          <p className="mt-5 text-lg text-white/65">
            Искра собрала главное для дружбы по интересам — без лишнего шума
            и публичного давления.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="card-hover group relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 p-7"
            >
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${f.accent} blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/65">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
