import SparkMark from './SparkMark';
import { Search, MessageCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const SPARK_IMAGE =
  'https://images.pexels.com/photos/10698375/pexels-photo-10698375.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      {/* Backgrounds */}
      <div className="absolute inset-0 -z-10 bg-ink-950" />
      <div className="absolute inset-0 -z-10 bg-radial-spark" />
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
      {/* Floating orbs */}
      <div className="absolute -left-24 top-40 -z-10 h-72 w-72 rounded-full bg-spark-500/20 blur-3xl animate-glow" />
      <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl animate-glow [animation-delay:1.5s]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-32">
        {/* Left: copy */}
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-spark-200">
            <Sparkles className="h-3.5 w-3.5" />
            Для школьников · бесплатно
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Найди своих.
            <br />
            <span className="text-gradient-spark">Зажги общение.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Сообщество для школьников, где легко найти друзей по интересам
            и безопасно переписываться.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="#join"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-spark-500 via-rose-500 to-ember-500 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-spark-500/30 transition-transform duration-300 hover:scale-[1.04]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Создать профиль
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-base font-semibold text-white/85 transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Как это работает
            </a>
          </div>

          {/* Mini feature pills */}
          <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Search, label: 'Люди по интересам' },
              { icon: MessageCircle, label: 'Личные сообщения' },
              { icon: ShieldCheck, label: 'Приватность' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white/80 backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4 shrink-0 text-spark-300" />
                <span className="leading-tight">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: visual */}
        <div className="relative animate-rise [animation-delay:200ms]">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Glowing frame */}
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-spark-500/40 via-rose-500/20 to-ember-500/40 blur-2xl animate-glow" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-ink-900/70 shadow-2xl">
              <img
                src={SPARK_IMAGE}
                alt="Искра — искра общения"
                className="h-[420px] w-full object-cover sm:h-[520px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

              {/* Floating chat card */}
              <div className="absolute bottom-5 left-5 right-5 glass rounded-2xl p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-spark-500 to-rose-500 text-white shadow-lg">
                    <SparkMark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">миша · музыка</p>
                    <p className="truncate text-xs text-white/60">привет! ты тоже слушаешь пост-панк?</p>
                  </div>
                  <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
                </div>
              </div>

              {/* Floating interest tag */}
              <div className="absolute right-4 top-4 animate-float [animation-delay:1s]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-800/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-spark-400" />
                  #игры
                </span>
              </div>
              <div className="absolute left-4 top-16 animate-float [animation-delay:2s]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-800/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  #наука
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
