/*
# Дополнение к этапу 3: RPC search_profiles

Проблема: после ограничения GRANT SELECT на profiles (убраны school/grade/show_school),
обычный клиентский select('*') не возвращает school/grade даже для профилей с
show_school=true. Нужен RPC, который уважает приватность.

- search_profiles(nick_query text, interest_filter text[], limit_count int):
  Возвращает профили по нику и/или интересам. school/grade включаются только
  при show_school=true. Исключает заблокированных и hidden_from_search.
  common_interests — число общих интересов с текущим пользователем.
*/

CREATE OR REPLACE FUNCTION public.search_profiles(nick_query text, interest_filter text[], limit_count int DEFAULT 50)
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
  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'interests', p.interests,
      'school', CASE WHEN p.show_school THEN p.school ELSE null END,
      'grade', CASE WHEN p.show_school THEN p.grade ELSE null END,
      'common_interests',
        CASE WHEN me_interests IS NOT NULL THEN
          (SELECT count(*) FROM unnest(me_interests) AS i WHERE i = ANY(p.interests))
        ELSE 0 END
    ) ORDER BY p.created_at DESC), '[]'::jsonb)
    FROM profiles p
    WHERE p.id <> me
      AND p.hidden_from_search = false
      AND (nick_query IS NULL OR nick_query = '' OR p.nickname ILIKE '%' || nick_query || '%')
      AND (interest_filter IS NULL OR array_length(interest_filter, 1) IS NULL OR p.interests && interest_filter)
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = me AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = me)
      )
    LIMIT limit_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_profiles(text, text[], int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profiles(text, text[], int) TO authenticated;
