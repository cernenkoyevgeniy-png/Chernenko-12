/*
# RPC: list_conversations

1. Новые функции
- public.list_conversations(me_id uuid) — список личных диалогов пользователя
  с последним сообщением и числом непрочитанных.
  Колонки: other_user_id, other_nickname, other_avatar, last_body, last_at, unread.

2. Безопасность
- SECURITY DEFINER. REVOKE от PUBLIC/anon; GRANT для authenticated.
- Не раскрывает email; фильтрует собеседников, заблокировавших меня.
*/

CREATE OR REPLACE FUNCTION public.list_conversations(me_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_nickname text,
  other_avatar text,
  last_body text,
  last_at timestamptz,
  unread bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ranked.other_id AS other_user_id,
    p.nickname AS other_nickname,
    p.avatar_url AS other_avatar,
    ranked.last_body,
    ranked.last_at,
    ranked.unread
  FROM (
    SELECT * FROM (
      SELECT
        CASE WHEN dm.sender_id = me_id THEN dm.recipient_id ELSE dm.sender_id END AS other_id,
        last_msg.body AS last_body,
        last_msg.created_at AS last_at,
        COALESCE(unread.cnt, 0) AS unread,
        ROW_NUMBER() OVER (
          PARTITION BY CASE WHEN dm.sender_id = me_id THEN dm.recipient_id ELSE dm.sender_id END
          ORDER BY dm.created_at DESC
        ) AS rn
      FROM public.direct_messages dm
      JOIN LATERAL (
        SELECT m.body, m.created_at
        FROM public.direct_messages m
        WHERE (m.sender_id = me_id AND m.recipient_id = dm.recipient_id)
           OR (m.sender_id = dm.recipient_id AND m.recipient_id = me_id)
        ORDER BY m.created_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::bigint AS cnt
        FROM public.direct_messages u
        WHERE u.recipient_id = me_id
          AND u.sender_id = CASE WHEN dm.sender_id = me_id THEN dm.recipient_id ELSE dm.sender_id END
          AND u.read_at IS NULL
      ) unread ON true
      WHERE dm.sender_id = me_id OR dm.recipient_id = me_id
    ) sub
    WHERE sub.rn = 1
  ) ranked
  JOIN public.profiles p ON p.id = ranked.other_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = ranked.other_id AND b.blocked_id = me_id
  )
  ORDER BY ranked.last_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_conversations(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_conversations(uuid) TO authenticated;
