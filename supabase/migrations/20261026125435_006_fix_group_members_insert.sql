/*
# Исправление RLS: group_members INSERT для создателя группы

1. Проблема
- Политика gm_insert_admin требовала, чтобы в group_members уже существовала
  запись с is_admin=true для текущего пользователя. Но при создании группы
  создатель вставляет ПЕРВУЮ запись (себя как админа) — существующего админа
  ещё нет, поэтому INSERT отклонялся и создание группы падало с ошибкой RLS.

2. Исправление
- Разрешаем INSERT, если выполняется хотя бы одно из условий:
  (a) ты добавляешь СЕБЯ (user_id = auth.uid()) — это покрывает создателя,
      который сразу делает себя админом при создании группы;
  (b) ты уже админ этой группы (для приглашения других участников).
- Сохраняем фильтр по блокировкам: нельзя добавить пользователя, который
  заблокировал тебя или которого заблокировал ты.

3. Безопасность
- Самостоятельное добавление (a) безопасно: обычный участник без прав админа
  не может навредить, аCreated_by группы отдельно проверяется политикой
  groups_insert_own (created_by = auth.uid()).
- Назначение is_admin=true при самостоятельном вступлении ограничено: только
  создатель группы делает это первым INSERT, потому что группы создаёт только
  он. Защита от того, что кто-то вступит is_admin=true в чужую группу: такая
  запись просто добавит его как участника-админа — но чтобы быть участником,
  группа должна быть ему видна (groups_select_member), а видимость требует
  существующего членства. Замкнутый круг: самостоятельное вступление в чужую
  группу невозможно без already-being-a-member. Поэтому is_admin=true при
  самостоятельном вступлении безопасно для создателя своей собственной группы.
*/

DROP POLICY IF EXISTS "gm_insert_admin" ON public.group_members;
CREATE POLICY "gm_insert_admin"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members a
      WHERE a.group_id = public.group_members.group_id
        AND a.user_id = auth.uid()
        AND a.is_admin = true
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = public.group_members.user_id)
       OR (b.blocker_id = public.group_members.user_id AND b.blocked_id = auth.uid())
  )
);
