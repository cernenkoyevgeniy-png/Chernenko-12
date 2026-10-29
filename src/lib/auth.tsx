import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  recovery: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  clearRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  const loadProfile = async (uid: string) => {
    // Используем SECURITY DEFINER RPC, чтобы получить school/grade/show_school
    // (они не входят в публичный GRANT SELECT на profiles).
    const { data, error } = await supabase.rpc('get_profile_visible', { target_id: uid });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('profile load error', error.message);
      return;
    }
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      const uid = data.session?.user?.id;
      const done = () => setLoading(false);
      if (uid) {
        loadProfile(uid).finally(done);
      } else {
        setProfile(null);
        done();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        // PASSWORD_RECOVERY: пользователь кликнул по ссылке сброса пароля.
        // Сессия есть, но мы показываем форму установки нового пароля
        // вместо перехода в приложение.
        if (event === 'PASSWORD_RECOVERY') {
          setRecovery(true);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          return;
        }
        setSession(newSession);
        setUser(newSession?.user ?? null);
        const uid = newSession?.user?.id;
        if (uid) {
          await loadProfile(uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRecovery(false);
  };

  const clearRecovery = () => setRecovery(false);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, profile, loading, recovery, refreshProfile, signOut, clearRecovery }),
    [session, user, profile, loading, recovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
