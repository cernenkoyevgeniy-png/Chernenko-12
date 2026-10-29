import { useEffect, useRef, useState } from 'react';
import SparkMark from './SparkMark';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
  { href: '#safety', label: 'Безопасность' },
  { href: '#faq', label: 'Вопросы' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <SparkMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[18deg]" animate />
          <span className="font-display text-xl font-extrabold tracking-tight">
            Искра
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-white/70 transition-colors hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-spark-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#join"
            className="text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            Войти
          </a>
          <a
            href="#join"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-spark-500/30 transition-transform duration-300 hover:scale-[1.04]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Начать
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 md:hidden"
          aria-label="Меню"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass mx-5 mb-4 rounded-2xl p-5">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-white/80 transition-colors hover:text-spark-300"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#join"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Начать
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
