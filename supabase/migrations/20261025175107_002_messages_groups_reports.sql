/*
# Личные сообщения, групповые чаты и жалобы

1. Новые таблицы
- direct_messages — личные сообщения (sender_id, recipient_id, body, read_at, created_at).
- groups — групповые чаты (name, avatar_url, description, created_by, created_at).
- group_members — участники группы (group_id, user_id, is_admin, joined_at).
- group_messages — сообщения группы (group_id, sender_id, body, created_at).
- group_message_reads — отметки прочтения групповых сообщений (message_id, user_id, read_at).
- reports — жалобы (reporter_id, reported_id, reason, status, created_at).

2. Безопасность
- RLS на всех таблицах.
- direct_messages: видишь сообщения где ты участник; шлёшь от своего имени
  и не заблокирован получателем; получатель отмечает read_at; удаляешь свои.
- groups: видишь группы где состоишь; создаёшь от своего имени; обновляет/
  удаляет админ (через group_members).
- group_members: видишь участников своих групп; админ добавляет (не заблокированных)
  и меняет is_admin; сам покидаешь или админ удаляет.
- group_messages: видишь сообщения своих групп; шлёшь от своего имени; удаляешь свои.
- group_message_reads: свои отметки; вставляешь от своего имени.
- reports: подаёшь от своего имени; видишь только свои.

3. Замечания
- Личные сообщения доступны только двум участникам.
- Email нигде не exposed.
- Сквозное шифрование НЕ реализовано и не заявляется.
*/

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS dm_recipient_idx ON public.direct_messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_sender_idx ON public.direct_messages (sender_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gm_group_idx ON public.group_messages (group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.group_message_reads (
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_messages TO authenticated;
GRANT SELECT, INSERT ON public.group_message_reads TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;

-- direct_messages
DROP POLICY IF EXISTS "dm_select_participants" ON public.direct_messages;
CREATE POLICY "dm_select_participants"
ON public.direct_messages FOR SELECT
TO authenticated
USING (
  (sender_id = auth.uid() OR recipient_id = auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = auth.uid()
      AND b.blocked_id IN (public.direct_messages.sender_id, public.direct_messages.recipient_id)
  )
);

DROP POLICY IF EXISTS "dm_insert_own" ON public.direct_messages;
CREATE POLICY "dm_insert_own"
ON public.direct_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = public.direct_messages.recipient_id AND b.blocked_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "dm_update_recipient" ON public.direct_messages;
CREATE POLICY "dm_update_recipient"
ON public.direct_messages FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "dm_delete_sender" ON public.direct_messages;
CREATE POLICY "dm_delete_sender"
ON public.direct_messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- groups
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member"
ON public.groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "groups_insert_own" ON public.groups;
CREATE POLICY "groups_insert_own"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "groups_update_admin" ON public.groups;
CREATE POLICY "groups_update_admin"
ON public.groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.is_admin = true
  )
);

DROP POLICY IF EXISTS "groups_delete_admin" ON public.groups;
CREATE POLICY "groups_delete_admin"
ON public.groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.is_admin = true
  )
);

-- group_members
DROP POLICY IF EXISTS "gm_select_member" ON public.group_members;
CREATE POLICY "gm_select_member"
ON public.group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members x
    WHERE x.group_id = public.group_members.group_id AND x.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "gm_insert_admin" ON public.group_members;
CREATE POLICY "gm_insert_admin"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members a
    WHERE a.group_id = public.group_members.group_id AND a.user_id = auth.uid() AND a.is_admin = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = public.group_members.user_id)
       OR (b.blocker_id = public.group_members.user_id AND b.blocked_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "gm_update_admin" ON public.group_members;
CREATE POLICY "gm_update_admin"
ON public.group_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members a
    WHERE a.group_id = public.group_members.group_id AND a.user_id = auth.uid() AND a.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members a
    WHERE a.group_id = public.group_members.group_id AND a.user_id = auth.uid() AND a.is_admin = true
  )
);

DROP POLICY IF EXISTS "gm_delete_self_or_admin" ON public.group_members;
CREATE POLICY "gm_delete_self_or_admin"
ON public.group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members a
    WHERE a.group_id = public.group_members.group_id AND a.user_id = auth.uid() AND a.is_admin = true
  )
);

-- group_messages
DROP POLICY IF EXISTS "gmsg_select_member" ON public.group_messages;
CREATE POLICY "gmsg_select_member"
ON public.group_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.group_messages.group_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "gmsg_insert_member" ON public.group_messages;
CREATE POLICY "gmsg_insert_member"
ON public.group_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = public.group_messages.group_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "gmsg_delete_sender" ON public.group_messages;
CREATE POLICY "gmsg_delete_sender"
ON public.group_messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- group_message_reads
DROP POLICY IF EXISTS "gmr_select_own" ON public.group_message_reads;
CREATE POLICY "gmr_select_own"
ON public.group_message_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "gmr_insert_own" ON public.group_message_reads;
CREATE POLICY "gmr_insert_own"
ON public.group_message_reads FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.group_messages m ON m.group_id = gm.group_id
    WHERE m.id = public.group_message_reads.message_id
      AND gm.user_id = auth.uid()
  )
);

-- reports
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());
