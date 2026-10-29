/*
# Публичные и частные группы

1. Изменения схемы
- groups: новый столбец `is_public` (boolean NOT NULL DEFAULT true).
  true = публичная группа (видна в поиске, любой может вступить).
  false = частная группа (только по приглашению админа).
  DEFAULT true сохраняет обратную совместимость: все существующие
  группы становятся публичными.

2. Новые RPC
- search_public_groups(p_query text, p_limit int) — поиск публичных
  групп по названию/описанию. Возвращает группы с member_count и
  is_member. Исключает заблокированные. SECURITY DEFINER.
- join_group(p_group_id uuid) — вступить в публичную группу.
  Проверяет публичность, отсутствие членства, отсутствие блокировок.
  SECURITY DEFINER.

3. Обновлённые RPC
- create_group: добавлен параметр p_is_public boolean (DEFAULT true).
- list_my_groups: добавлен is_public в возвращаемые колонки.
  (Требуется DROP FUNCTION first — меняется тип возврата.)

4. Безопасность
- RLS: новая политика groups_select_public разрешает SELECT для
  публичных групп всем authenticated.
- join_group — SECURITY DEFINER с проверками внутри.
- EXECUTE: REVOKE FROM PUBLIC, anon; GRANT TO authenticated.

5. Существующие данные
- Все существующие группы получают is_public = true (DEFAULT).
- Ни одна строка не удаляется.
*/

-- 1. Добавляем колонку is_public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN is_public boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 2. Обновляем create_group — добавляем параметр p_is_public
CREATE OR REPLACE FUNCTION public.create_group(p_name text, p_description text, p_is_public boolean DEFAULT true)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_group public.groups%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Не авторизован';
  END IF;
  IF btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Введите название группы';
  END IF;

  INSERT INTO public.groups (name, description, created_by, is_public)
  VALUES (btrim(p_name), btrim(COALESCE(p_description, '')), v_user, COALESCE(p_is_public, true))
  RETURNING * INTO v_group;

  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES (v_group.id, v_user, true);

  RETURN v_group;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_group(text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group(text, text, boolean) TO authenticated;

-- 3. search_public_groups — поиск публичных групп
CREATE OR REPLACE FUNCTION public.search_public_groups(p_query text, p_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  avatar_url text,
  created_by uuid,
  created_at timestamptz,
  member_count bigint,
  is_member boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Не авторизован';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.avatar_url,
    g.created_by,
    g.created_at,
    mc.cnt AS member_count,
    COALESCE(mb.is_mem, false) AS is_member
  FROM public.groups g
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS cnt
    FROM public.group_members x WHERE x.group_id = g.id
  ) mc ON true
  LEFT JOIN LATERAL (
    SELECT true AS is_mem
    FROM public.group_members x WHERE x.group_id = g.id AND x.user_id = v_me
  ) mb ON true
  WHERE g.is_public = true
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = v_me AND b.blocked_id = g.created_by)
         OR (b.blocker_id = g.created_by AND b.blocked_id = v_me)
    )
    AND (
      p_query IS NULL
      OR btrim(p_query) = ''
      OR g.name ILIKE '%' || btrim(p_query) || '%'
      OR g.description ILIKE '%' || btrim(p_query) || '%'
    )
  ORDER BY
    mc.cnt DESC,
    g.name ASC
  LIMIT p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_public_groups(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_public_groups(text, integer) TO authenticated;

-- 4. join_group — вступить в публичную группу
CREATE OR REPLACE FUNCTION public.join_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_is_public boolean;
  v_already_member boolean;
  v_blocked boolean;
  v_creator uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Не авторизован';
  END IF;

  SELECT g.is_public, g.created_by INTO v_is_public, v_creator
  FROM public.groups g WHERE g.id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Группа не найдена';
  END IF;

  IF v_is_public IS NOT TRUE THEN
    RAISE EXCEPTION 'Эта группа закрытая. Вступить можно только по приглашению.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = v_me
  ) INTO v_already_member;

  IF v_already_member THEN
    RAISE EXCEPTION 'Ты уже состоишь в этой группе';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = v_me AND b.blocked_id = v_creator)
       OR (b.blocker_id = v_creator AND b.blocked_id = v_me)
  ) INTO v_blocked;

  IF v_blocked THEN
    RAISE EXCEPTION 'Невозможно вступить в эту группу';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES (p_group_id, v_me, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_group(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_group(uuid) TO authenticated;

-- 5. Обновляем list_my_groups — добавляем is_public (DROP first: меняется RETURN TYPE)
DROP FUNCTION IF EXISTS public.list_my_groups(uuid);
CREATE FUNCTION public.list_my_groups(me_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  description text,
  created_by uuid,
  created_at timestamptz,
  member_count bigint,
  is_public boolean
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
    mc.cnt AS member_count,
    g.is_public
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

-- 6. RLS: разрешаем SELECT публичных групп для всех authenticated
DROP POLICY IF EXISTS "groups_select_public" ON public.groups;
CREATE POLICY "groups_select_public"
ON public.groups FOR SELECT
TO authenticated
USING (is_public = true);
