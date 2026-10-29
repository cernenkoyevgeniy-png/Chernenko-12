/*
# Профили пользователей и блокировки

1. Новые таблицы
- `profiles` — публичный профиль каждого пользователя:
  - id (uuid, PK → auth.users, ON DELETE CASCADE)
  - nickname (text, UNIQUE, NOT NULL) — никнейм
  - avatar_url (text) — URL аватара
  - bio (text, default '') — описание о себе
  - interests (text[], default '{}') — интересы
  - hidden_from_search (bool, default false) — скрывать из поиска
  - created_at, updated_at (timestamptz)
- `blocks` — блокировка одного пользователя другим:
  - blocker_id (uuid) — кто блокирует
  - blocked_id (uuid) — кого блокируют
  - created_at (timestamptz)
  - PRIMARY KEY (blocker_id, blocked_id)

2. Триггер
- handle_new_user() (SECURITY DEFINER): автоматически создаёт профиль при
  регистрации. Берёт никнейм из raw_user_meta_data, либо запасной user_<id>.

3. Безопасность
- RLS включён на profiles и blocks.
- profiles: GRANT SELECT для authenticated; GRANT UPDATE своих полей;
  GRANT INSERT своего профиля.
- profiles SELECT-политика: можно читать любой профиль, кроме тех, кто
  заблокировал тебя.
- profiles UPDATE/INSERT: только свой профиль.
- blocks: GRANT SELECT/INSERT/DELETE для authenticated.
- blocks SELECT: видишь свои блокировки (blocker_id = auth.uid()).
- blocks INSERT: создаёшь только свои блокировки (blocker_id = auth.uid()).
- blocks DELETE: удаляешь только свои блокировки.
- Email остаётся в auth.users и не exposed.

4. Замечания
- Уникальность никнейма обеспечивает UNIQUE; при коллизии регистрация
  завершится ошибкой, которую покажет фронтенд.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text UNIQUE NOT NULL,
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  interests text[] NOT NULL DEFAULT '{}',
  hidden_from_search boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON public.profiles (nickname);
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON public.profiles USING GIN (interests);

CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (nickname, avatar_url, bio, interests, hidden_from_search, updated_at) ON public.profiles TO authenticated;
GRANT INSERT (id, nickname, avatar_url, bio, interests) ON public.profiles TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;

-- profiles SELECT: любой профиль, кроме заблокировавших меня
DROP POLICY IF EXISTS "profiles_select_visible" ON public.profiles;
CREATE POLICY "profiles_select_visible"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = public.profiles.id AND b.blocked_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- blocks: только свои блокировки
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
CREATE POLICY "blocks_select_own"
ON public.blocks FOR SELECT
TO authenticated
USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_insert_own" ON public.blocks;
CREATE POLICY "blocks_insert_own"
ON public.blocks FOR INSERT
TO authenticated
WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_delete_own" ON public.blocks;
CREATE POLICY "blocks_delete_own"
ON public.blocks FOR DELETE
TO authenticated
USING (blocker_id = auth.uid());

-- Триггер создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nick text;
BEGIN
  nick := NEW.raw_user_meta_data->>'nickname';
  IF nick IS NULL OR btrim(nick) = '' THEN
    nick := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, nick);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
