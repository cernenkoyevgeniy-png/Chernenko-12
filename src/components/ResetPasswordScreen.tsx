import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import SparkMark from '@/components/SparkMark';
import { Loader2, AlertCircle, Lock, ArrowRight, Check } from 'lucide-react';

export default function ResetPasswordScreen() {
  const { clearRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="absolute inset-0 -z-10 bg-radial-spark" />
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
      <div className="absolute -left-24 top-32 -z-10 h-72 w-72 rounded-full bg-spark-500/20 blur-3xl animate-glow" />
      <div className="absolute right-0 top-20 -z-10 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl animate-glow [animation-delay:1.5s]" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center">
            <SparkMark className="h-12 w-12" animate />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Новый пароль</h1>
          <p className="mt-1 text-sm text-white/55">Придумай новый пароль для аккаунта</p>
        </div>

        <div className="glass rounded-3xl p-7 shadow-2xl">
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
                <Check className="h-6 w-6 text-emerald-300" />
              </div>
              <p className="mt-4 font-display text-lg font-bold">Пароль изменён</p>
              <p className="mt-2 text-sm text-white/60">Теперь входи с новым паролем.</p>
              <button
                onClick={async () => { await signOut(); clearRecovery(); }}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spark-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                Перейти ко входу <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                icon={<Lock className="h-4 w-4" />}
                label="Новый пароль"
                type="password"
                value={password}
                onChange={(v) => setPassword(v)}
                placeholder="минимум 6 символов"
                autoComplete="new-password"
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                label="Повторите пароль"
                type="password"
                value={confirm}
                onChange={(v) => setConfirm(v)}
                placeholder="ещё раз"
                autoComplete="new-password"
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-spark-500 via-rose-500 to-ember-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-spark-500/30 transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Сохранить новый пароль'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {!done && (
            <button
              onClick={async () => { await signOut(); clearRecovery(); }}
              className="mt-5 block w-full text-center text-sm text-white/45 transition-colors hover:text-white/70"
            >
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-white/10 bg-ink-900/60 py-3 pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-spark-500/60 focus:bg-ink-900/80"
        />
      </div>
    </label>
  );
}
