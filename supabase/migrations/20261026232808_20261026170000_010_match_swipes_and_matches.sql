/*
# Искра Match: свайпы и взаимные совпадения

1. Новые таблицы
- `match_swipes` — однонаправленное «хочу общаться» от пользователя к другому.
  - swiper_id (uuid) — кто свайпает
  - target_id (uuid) — кого отметили
  - action (text: 'like' | 'skip')
  - created_at (timestamptz)
  - PRIMARY KEY (swiper_id, target_id) — повторный свайп обновляет действие
- `matches` — взаимное совпадение (оба отметили like).
  - user_a, user_b — упорядоченная пара (user_a < user_b), UNIQUE

2. Приватность
- profiles.hidden_from_match (boolean, default false): при true пользователь
  не появляется в карточках Искра Match. Обновляется только владельцем.

3. RPC
- get_match_cards(limit): карточки для свайпов (исключает себя, заблокированных,
  hidden_from_search/hidden_from_match, уже свайпнутых). match_percent =
  round(common / max(me_count, them_count) * 100).
- record_swipe(p_target_id, p_action): upsert свайпа; при встречном like
  атомарно создаёт match (без дублей). Возвращает {matched, match_id}.
- list_my_matches(): совпадения текущего пользователя.

4. Безопасность
- RLS на обеих таблицах. match_swipes: только свои. matches: только участник SELECT;
  INSERT только через SECURITY DEFINER record_swipe. Блокировки учитываются.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hidden_from_match boolean NOT NULL DEFAULT false;

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (nickname, avatar_url, bio, interests, hidden_from_search, hidden_from_match, school, grade, show_school, updated_at)
  ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.match_swipes (
  swiper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('like','skip')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (swiper_id, target_id),
  CHECK (swiper_id <> target_id)
);

CREATE INDEX IF NOT EXISTS match_swipes_target_idx
  ON public.match_swipes (target_id, action);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a <> user_b)
);

CREATE INDEX IF NOT EXISTS matches_user_a_idx ON public.matches (user_a, created_at DESC);
CREATE INDEX IF NOT EXISTS matches_user_b_idx ON public.matches (user_b, created_at DESC);

ALTER TABLE public.match_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.match_swipes TO authenticated;
GRANT SELECT ON public.matches TO authenticated;

DROP POLICY IF EXISTS "msw_select_own" ON public.match_swipes;
CREATE POLICY "msw_select_own"
ON public.match_swipes FOR SELECT
TO authenticated
USING (swiper_id = auth.uid());

DROP POLICY IF EXISTS "msw_insert_own" ON public.match_swipes;
CREATE POLICY "msw_insert_own"
ON public.match_swipes FOR INSERT
TO authenticated
WITH CHECK (swiper_id = auth.uid());

DROP POLICY IF EXISTS "msw_update_own" ON public.match_swipes;
CREATE POLICY "msw_update_own"
ON public.match_swipes FOR UPDATE
TO authenticated
USING (swiper_id = auth.uid())
WITH CHECK (swiper_id = auth.uid());

DROP POLICY IF EXISTS "matches_select_participant" ON public.matches;
CREATE POLICY "matches_select_participant"
ON public.matches FOR SELECT
TO authenticated
USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE OR REPLACE FUNCTION public.get_match_cards(limit_count int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  me_interests text[];
BEGIN
  SELECT interests INTO me_interests FROM profiles WHERE id = me;
  IF me_interests IS NULL THEN me_interests := '{}'::text[]; END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'interests', p.interests,
      'school', CASE WHEN p.show_school THEN p.school ELSE null END,
      'grade', CASE WHEN p.show_school THEN p.grade ELSE null END,
      'common_interests', COALESCE(common.cnt, 0),
      'recommended_reason', COALESCE(common.shared, '{}'::text[]),
      'match_percent', CASE
        WHEN COALESCE(array_length(me_interests, 1), 0) = 0
          AND COALESCE(array_length(p.interests, 1), 0) = 0 THEN 0
        ELSE round(
          COALESCE(common.cnt, 0)::numeric /
          GREATEST(
            COALESCE(array_length(me_interests, 1), 0),
            COALESCE(array_length(p.interests, 1), 0)
          ) * 100
        )
      END
    ) ORDER BY (CASE WHEN common.cnt IS NULL THEN 0 ELSE common.cnt END) DESC, p.nickname), '[]'::jsonb)
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt, array_agg(i) AS shared
      FROM unnest(me_interests) AS i
      WHERE i = ANY(p.interests)
    ) AS common ON true
    WHERE p.id <> me
      AND p.hidden_from_search = false
      AND p.hidden_from_match = false
      AND NOT EXISTS (
        SELECT 1 FROM public.match_swipes s
        WHERE s.swiper_id = me AND s.target_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = me AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = me)
      )
    LIMIT limit_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_match_cards(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_match_cards(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_swipe(p_target_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  recip_action text;
  new_match_id uuid;
  a uuid;
  b uuid;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'error', 'not authenticated');
  END IF;
  IF me = p_target_id THEN
    RETURN jsonb_build_object('matched', false, 'error', 'cannot swipe self');
  END IF;
  IF p_action NOT IN ('like','skip') THEN
    RETURN jsonb_build_object('matched', false, 'error', 'invalid action');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = me AND b.blocked_id = p_target_id)
       OR (b.blocker_id = p_target_id AND b.blocked_id = me)
  ) THEN
    RETURN jsonb_build_object('matched', false, 'error', 'blocked');
  END IF;

  INSERT INTO public.match_swipes (swiper_id, target_id, action)
  VALUES (me, p_target_id, p_action)
  ON CONFLICT (swiper_id, target_id) DO UPDATE
    SET action = excluded.action, created_at = now();

  IF p_action <> 'like' THEN
    RETURN jsonb_build_object('matched', false, 'match_id', null);
  END IF;

  SELECT ms.action INTO recip_action
  FROM public.match_swipes ms
  WHERE ms.swiper_id = p_target_id AND ms.target_id = me;

  IF recip_action = 'like' THEN
    -- упорядоченная пара для UNIQUE
    IF me < p_target_id THEN a := me; b := p_target_id;
    ELSE a := p_target_id; b := me; END IF;

    INSERT INTO public.matches (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING
    RETURNING id INTO new_match_id;

    RETURN jsonb_build_object('matched', true, 'match_id', new_match_id);
  END IF;

  RETURN jsonb_build_object('matched', false, 'match_id', null);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_swipe(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_swipe(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_matches()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  me_interests text[];
BEGIN
  SELECT interests INTO me_interests FROM profiles WHERE id = me;
  IF me_interests IS NULL THEN me_interests := '{}'::text[]; END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'match_id', m.id,
      'matched_at', m.created_at,
      'id', p.id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'interests', p.interests,
      'common_interests',
        (SELECT count(*) FROM unnest(me_interests) AS i WHERE i = ANY(p.interests))
    ) ORDER BY m.created_at DESC), '[]'::jsonb)
    FROM public.matches m
    JOIN public.profiles p ON p.id = (CASE WHEN m.user_a = me THEN m.user_b ELSE m.user_a END)
    WHERE m.user_a = me OR m.user_b = me
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_my_matches() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_matches() TO authenticated;
