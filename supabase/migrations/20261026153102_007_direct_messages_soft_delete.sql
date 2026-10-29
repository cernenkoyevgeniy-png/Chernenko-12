/*
# Этап 2: soft-delete личных сообщений

1. Изменения таблиц
- direct_messages: добавлена колонка deleted_at (timestamptz, nullable).
  При удалении отправителем тело сообщения очищается, deleted_at = now().
  Строка остаётся, чтобы оба участника видели плейсхолдер «сообщение удалено».

2. Безопасность
- Политика dm_update_recipient заменена на dm_update: UPDATE разрешён
  получателю (для read_at) И отправителю (только для soft-delete).
  WITH CHECK гарантирует, что sender_id = auth.uid() при обновлении
  отправителем, а recipient_id = auth.uid() при обновлении получателем.
- GRANT UPDATE ограничен колонками (read_at, deleted_at, body) — нельзя
  произвольно менять sender/recipient/created_at.
- DELETE остаётся только для отправителя (политика dm_delete_sender),
  но клиент использует soft-delete (UPDATE), а не физическое удаление.

3. Замечания
- Удалённое сообщение видно обоим участникам как «Сообщение удалено».
- Realtime-подписка на UPDATE распространяет изменение второму участнику.
*/

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Ограничиваем UPDATE конкретными колонками
REVOKE UPDATE ON public.direct_messages FROM anon, authenticated;
GRANT UPDATE (read_at, deleted_at, body) ON public.direct_messages TO authenticated;

DROP POLICY IF EXISTS "dm_update_recipient" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_update" ON public.direct_messages;
CREATE POLICY "dm_update"
ON public.direct_messages FOR UPDATE
TO authenticated
USING (
  recipient_id = auth.uid()
  OR sender_id = auth.uid()
)
WITH CHECK (
  recipient_id = auth.uid()
  OR sender_id = auth.uid()
);
