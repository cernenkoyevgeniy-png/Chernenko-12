import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Нужен ли телефон для регистрации?',
    a: 'Нет. Для профиля достаточно придумать ник и выбрать интересы. Телефон, школа, дата рождения и геолокация не требуются.',
  },
  {
    q: 'Кто видит мои сообщения?',
    a: 'Личная переписка видна только двум её участникам. Публичных лент с чужими комментариями в Искре нет.',
  },
  {
    q: 'Как найти друзей по интересам?',
    a: 'В поиске можно искать людей по нику или по тегам — музыка, игры, наука, книги и другим увлечениям. Находишь карточку — пишешь в личку.',
  },
  {
    q: 'Это правда бесплатно?',
    a: 'Да, Искра бесплатна для школьников. Никаких подписок и платных функций для базового общения.',
  },
  {
    q: 'Что делать, если кто-то нарушает правила?',
    a: 'На профиль или сообщение можно пожаловаться. Модерация и сообщество следят, чтобы в Искре было комфортно и безопасно.',
  },
  {
    q: 'Можно ли скрыть свой профиль?',
    a: 'Да. В настройках можно выключить видимость в поиске и решить, кто имеет право писать тебе первым — в любой момент.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-spark-300">
            Вопросы
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Частые <span className="text-gradient-spark">вопросы</span>
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  isOpen ? 'border-spark-500/40 bg-ink-900/70' : 'border-white/10 bg-ink-900/40'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base font-semibold text-white sm:text-lg">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-spark-300 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-400 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[15px] leading-relaxed text-white/65">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
