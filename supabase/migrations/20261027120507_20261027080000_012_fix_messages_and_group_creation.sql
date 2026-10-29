/*
# Исправление: создание групп, отправка сообщений, загрузка аватаров

1. Проблемы
- Личные и групповые сообщения не отправлялись: frontend делает
  .insert({ recipient_id, body }) / .insert({ group_id, body }), не передавая
  sender_id. Колонка sender_id NOT NULL без DEFAULT — insert падает с
  ошибкой NOT NULL.
- Создание группы падало: .insert({...}).select('*') не мог прочитать
  только что созданную группу, потому что политика groups_select_member
  требует существующего членства, а создатель ещё не член в момент insert.

2. Исправления
- direct_messages.sender_id: DEFAULT auth.uid() — отправитель подставляется
  автоматически из сессии. INSERT-политика dm_insert_own (sender_id = auth.uid())
  продолжает выполняться.
- group_messages.sender_id: DEFAULT auth.uid() — аналогично.
- groups: новая SELECT-политика groups_select_creator — создатель видит свою
  группу сразу после создания (created_by = auth.uid()), до того как станет
  участником. Это безопасно: created_by проверяется политикой groups_insert_own.

3. Безопасность
- DEFAULT auth.uid() не даёт подделать отправителя: значение берётся из JWT.
- groups_select_creator не раскрывает чужие группы: условие created_by = auth.uid().
- Существующие данные не затронуты (DEFAULT влияет только на новые INSERT).
*/

ALTER TABLE public.direct_messages
  ALTER COLUMN sender_id SET DEFAULT auth.uid();

ALTER TABLE public.group_messages
  ALTER COLUMN sender_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "groups_select_creator" ON public.groups;
CREATE POLICY "groups_select_creator"
ON public.groups FOR SELECT
TO authenticated
USING (created_by = auth.uid());
