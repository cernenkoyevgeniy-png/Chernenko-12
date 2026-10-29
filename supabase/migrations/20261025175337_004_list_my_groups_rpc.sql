/*
# RPC: list_my_groups

1. Новые функции
- public.list_my_groups(me_id uuid) — список групп, в которых состоит
  пользователь, с числом участников.
  Колонки: id, name, avatar_url, description, created_by, created_at, member_count.

2. Безопасность
- SECURITY DEFINER. REVOKE от PUBLIC/anon; GRANT для authenticated.
*/

CREATE OR REPLACE FUNCTION public.list_my_groups(me_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  description text,
  created_by uuid,
  created_at timestamptz,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.avatar_url,
    g.description,
    g.created_by,
    g.created_at,
    mc.cnt AS member_count
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = me_id
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS cnt
    FROM public.group_members x WHERE x.group_id = g.id
  ) mc ON true
  ORDER BY g.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_my_groups(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_groups(uuid) TO authenticated;
