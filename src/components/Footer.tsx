import SparkMark from './SparkMark';

const cols = [
  {
    title: 'Искра',
    links: ['Возможности', 'Как это работает', 'Безопасность', 'Вопросы'],
  },
  {
    title: 'Сообщество',
    links: ['Правила', 'Модерация', 'Помощь', 'Контакты'],
  },
  {
    title: 'Правовое',
    links: ['Условия', 'Конфиденциальность', 'Cookie', 'Возраст'],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <SparkMark className="h-8 w-8" />
              <span className="font-display text-xl font-extrabold tracking-tight">Искра</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Сообщество для школьников, где легко находить друзей по интересам
              и безопасно переписываться.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      className="text-sm text-white/55 transition-colors hover:text-spark-300"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Искра. Сделано с теплом для школьников.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Все системы работают
          </div>
        </div>
      </div>
    </footer>
  );
}
