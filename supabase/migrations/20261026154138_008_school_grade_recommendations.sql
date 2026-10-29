/*
# Этап 3: школа/класс + умные рекомендации

1. Изменения таблиц
- profiles: добавлены колонки school (text), grade (text), show_school (boolean, default false).
  show_school — согласие показывать школу/класс другим. Пока false — school/grade
  не возвращаются чужим пользователям.

2. Приватность
- GRANT SELECT на profiles ограничен публичными колонками (без school/grade/show_school).
- school/grade/show_school доступны владельцу и чужим (при show_school=true) только
  через SECURITY DEFINER RPC, которые выбирают колонки условно.

3. Новые функции
- get_profile_visible(target_id): профиль с school/grade, раскрытыми только если
  show_school=true или это собственный профиль. Исключает заблокировавших меня.
- list_recommended(limit): профили с общими интересами, отсортированные по числу
  общих (убывание). common_interests + recommended_reason (массив общих интересов).
  Исключает себя, заблокированных, hidden_from_search. school/grade при show_school=true.
- search_by_school(school, grade, limit): поиск по школе/классу. Только профили с
  show_school=true. Исключает заблокированных.

4. Безопасность
- Все RPC — SECURITY DEFINER, search_path=public, EXECUTE только authenticated.
- Блокировки учитываются в обоих направлениях.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS show_school boolean NOT NULL DEFAULT false;

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, nickname, avatar_url, bio, interests, hidden_from_search, created_at, updated_at)
  ON public.profiles TO authenticated;

REVOKE INSERT ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, nickname, avatar_url, bio, interests, hidden_from_search, school, grade, show_school, created_at, updated_at)
  ON public.profiles TO authenticated;

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (nickname, avatar_url, bio, interests, hidden_from_search, school, grade, show_school, updated_at)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profile_visible(target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  p record;
  can_see boolean;
BEGIN
  SELECT * INTO p FROM profiles WHERE id = target_id;
  IF NOT FOUND THEN RETURN null; END IF;

  IF EXISTS (SELECT 1 FROM blocks WHERE blocker_id = target_id AND blocked_id = me) THEN
    RETURN null;
  END IF;

  can_see := (target_id = me) OR p.show_school;

  RETURN jsonb_build_object(
    'id', p.id,
    'nickname', p.nickname,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'interests', p.interests,
    'school', CASE WHEN can_see THEN p.school ELSE null END,
    'grade', CASE WHEN can_see THEN p.grade ELSE null END,
    'show_school', p.show_school,
    'hidden_from_search', p.hidden_from_search,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_visible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_visible(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_recommended(limit_count int DEFAULT 20)
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
  IF me_interests IS NULL OR array_length(me_interests, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'interests', p.interests,
      'school', CASE WHEN p.show_school THEN p.school ELSE null END,
      'grade', CASE WHEN p.show_school THEN p.grade ELSE null END,
      'common_interests', common.cnt,
      'recommended_reason', common.shared
    ) ORDER BY common.cnt DESC, p.nickname), '[]'::jsonb)
    FROM profiles p
    JOIN LATERAL (
      SELECT
        count(*) AS cnt,
        array_agg(i) AS shared
      FROM unnest(me_interests) AS i
      WHERE i = ANY(p.interests)
    ) AS common ON common.cnt > 0
    WHERE p.id <> me
      AND p.hidden_from_search = false
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = me AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = me)
      )
    LIMIT limit_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_recommended(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_recommended(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_by_school(school_query text, grade_query text, limit_count int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'interests', p.interests,
      'school', p.school,
      'grade', p.grade,
      'common_interests',
        (SELECT count(*) FROM unnest(
          (SELECT interests FROM profiles WHERE id = me)
        ) AS i WHERE i = ANY(p.interests))
    ) ORDER BY p.nickname), '[]'::jsonb)
    FROM profiles p
    WHERE p.id <> me
      AND p.show_school = true
      AND p.hidden_from_search = false
      AND (school_query IS NULL OR school_query = '' OR p.school ILIKE '%' || school_query || '%')
      AND (grade_query IS NULL OR grade_query = '' OR p.grade ILIKE '%' || grade_query || '%')
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = me AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = me)
      )
    LIMIT limit_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_by_school(text, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_by_school(text, text, int) TO authenticated;
