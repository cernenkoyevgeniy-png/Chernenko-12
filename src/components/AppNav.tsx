import { Users, MessageCircle, User, Heart } from 'lucide-react';
import SparkMark from '@/components/SparkMark';

export type Tab = 'match' | 'people' | 'chats' | 'profile';

export default function AppNav({
  tab, onChange,
}: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'match', label: 'Match', icon: Heart },
    { key: 'people', label: 'Люди', icon: Users },
    { key: 'chats', label: 'Чаты', icon: MessageCircle },
    { key: 'profile', label: 'Профиль', icon: User },
  ];

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-white/10 bg-ink-950/80 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <SparkMark className="h-7 w-7" animate />
            <span className="font-display text-lg font-extrabold tracking-tight">Искра</span>
          </div>
          <nav className="flex items-center gap-1">
            {items.map((it) => (
              <button
                key={it.key}
                onClick={() => onChange(it.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  tab === it.key
                    ? 'bg-gradient-to-r from-spark-500 to-rose-500 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                tab === it.key ? 'text-spark-300' : 'text-white/55'
              }`}
            >
              <it.icon className={`h-5 w-5 ${tab === it.key ? 'scale-110' : ''} transition-transform`} />
              {it.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
