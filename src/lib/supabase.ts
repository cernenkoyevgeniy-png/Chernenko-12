import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Не падаем при сборке; ошибка проявится в рантайме, если env отсутствуют.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are missing');
}

export const supabase = createClient(
  url ?? 'http://localhost',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
