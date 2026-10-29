/*
# Обновить RPC get_profile_visible и list_recommended под hidden_from_match

1. Изменения
- get_profile_visible: возвращает hidden_from_match.
- list_recommended: исключает профили с hidden_from_match = true.
*/

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
    'hidden_from_match', p.hidden_from_match,
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
      SELECT count(*) AS cnt, array_agg(i) AS shared
      FROM unnest(me_interests) AS i
      WHERE i = ANY(p.interests)
    ) AS common ON common.cnt > 0
    WHERE p.id <> me
      AND p.hidden_from_search = false
      AND p.hidden_from_match = false
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
