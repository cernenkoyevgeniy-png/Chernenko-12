/*
# Исправление: бесконечная рекурсия RLS в group_members и groups

1. Проблема
- Политики на group_members (gm_select_member, gm_insert_admin, gm_update_admin,
  gm_delete_self_or_admin) содержат подзапросы к самой таблице group_members
  (EXISTS SELECT 1 FROM group_members ...). Postgres обнаруживает бесконечную
  рекурсию RLS и отклоняет запрос — создание группы, список участников, отправку
  сообщений и все операции с группами.
- Политики на groups (groups_select_member, groups_delete_admin, groups_update_admin)
  также подзапрашивают group_members — та же рекурсия.

2. Решение
- Две SECURITY DEFINER функции-помощники, которые проверяют членство/админство
  БЕЗ RLS (owner = postgres, SECURITY DEFINER обходит RLS):
  * is_group_member(gid uuid) → boolean
  * is_group_admin(gid uuid) → boolean
- Все политики переписаны: вместо EXISTS(SELECT ... FROM group_members ...)
  используется вызов is_group_member() / is_group_admin().
- Рекурсия устранена: функции не подчиняются RLS на group_members.

3. Безопасность
- Функции только читают (SELECT 1), не модифицируют данные.
- EXECUTE ограничен: REVOKE FROM PUBLIC, anon; GRANT TO authenticated.
- SECURITY DEFINER запускается от имени владельца (postgres) — это необходимо
  для обхода RLS при проверке членства, и безопасно т.к. функции детерминированы
  и не имеют побочных эффектов.
- is_group_member проверяет user_id = auth.uid() — чужое членство не видно.
- is_group_admin проверяет is_admin = true для auth.uid().
*/

CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = gid AND gm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = gid AND gm.user_id = auth.uid() AND gm.is_admin = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;

-- Переписываем политики groups (без подзапросов к group_members)

DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member"
ON public.groups FOR SELECT
TO authenticated
USING (public.is_group_member(groups.id));

DROP POLICY IF EXISTS "groups_delete_admin" ON public.groups;
CREATE POLICY "groups_delete_admin"
ON public.groups FOR DELETE
TO authenticated
USING (public.is_group_admin(groups.id));

DROP POLICY IF EXISTS "groups_update_admin" ON public.groups;
CREATE POLICY "groups_update_admin"
ON public.groups FOR UPDATE
TO authenticated
USING (public.is_group_admin(groups.id))
WITH CHECK (public.is_group_admin(groups.id));

-- groups_select_creator и groups_insert_own остаются без изменений (не ссылаются на group_members)

-- Переписываем политики group_members (без подзапросов к group_members)

DROP POLICY IF EXISTS "gm_select_member" ON public.group_members;
CREATE POLICY "gm_select_member"
ON public.group_members FOR SELECT
TO authenticated
USING (public.is_group_member(group_members.group_id));

DROP POLICY IF EXISTS "gm_insert_admin" ON public.group_members;
CREATE POLICY "gm_insert_admin"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  (
    user_id = auth.uid()
    OR public.is_group_admin(group_members.group_id)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = group_members.user_id)
       OR (b.blocker_id = group_members.user_id AND b.blocked_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "gm_update_admin" ON public.group_members;
CREATE POLICY "gm_update_admin"
ON public.group_members FOR UPDATE
TO authenticated
USING (public.is_group_admin(group_members.group_id))
WITH CHECK (public.is_group_admin(group_members.group_id));

DROP POLICY IF EXISTS "gm_delete_self_or_admin" ON public.group_members;
CREATE POLICY "gm_delete_self_or_admin"
ON public.group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_admin(group_members.group_id)
);
