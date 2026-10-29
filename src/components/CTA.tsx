import { ArrowRight } from 'lucide-react';
import SparkMark from './SparkMark';

export default function CTA() {
  return (
    <section id="join" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-10 text-center sm:p-16">
          {/* glows */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-spark-500/30 blur-3xl animate-glow" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-rose-500/25 blur-3xl animate-glow [animation-delay:1.5s]" />
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)] opacity-40" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <SparkMark className="h-12 w-12" animate />
            </div>
            <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Зажги свою <span className="text-gradient-spark">искру</span> уже сегодня
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Создай профиль за минуту, найди друзей по интересам и начни
              общение, которое по-настоящему греет.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#top"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-spark-500 via-rose-500 to-ember-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-spark-500/30 transition-transform duration-300 hover:scale-[1.04]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                Начать бесплатно
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white/85 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Узнать больше
              </a>
            </div>

            <p className="mt-6 text-xs text-white/45">
              Без телефона · без школы · без геолокации
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
