/*
# Исправление: рекурсия RLS в group_messages и group_message_reads

1. Проблема
- gmsg_select_member и gmsg_insert_member ссылаются на group_members через
  EXISTS-подзапрос → та же бесконечная рекурсия RLS.
- gmr_insert_own также подзапрашивает group_members.

2. Решение
- Заменяем подзапросы на is_group_member() (SECURITY DEFINER, без RLS).

3. Безопасность
- is_group_member уже ограничена EXECUTE для authenticated и проверяет auth.uid().
*/

DROP POLICY IF EXISTS "gmsg_select_member" ON public.group_messages;
CREATE POLICY "gmsg_select_member"
ON public.group_messages FOR SELECT
TO authenticated
USING (public.is_group_member(group_messages.group_id));

DROP POLICY IF EXISTS "gmsg_insert_member" ON public.group_messages;
CREATE POLICY "gmsg_insert_member"
ON public.group_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_group_member(group_messages.group_id));

-- gmsg_delete_sender не ссылается на group_members — оставляем как есть.

DROP POLICY IF EXISTS "gmr_insert_own" ON public.group_message_reads;
CREATE POLICY "gmr_insert_own"
ON public.group_message_reads FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_messages m
    WHERE m.id = group_message_reads.message_id
      AND public.is_group_member(m.group_id)
  )
);
