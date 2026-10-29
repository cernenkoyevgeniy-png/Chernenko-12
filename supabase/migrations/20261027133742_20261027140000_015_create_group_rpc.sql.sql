/*
# Atomic group creation RPC

1. Problem
- The client creates a group in two separate calls: INSERT into `groups`,
  then INSERT into `group_members` (creator as admin). If the second call
  fails for any reason (network, RLS, race), the group is orphaned — it
  exists in the database with 0 members, the creator can't see it in
  `list_my_groups`, and the user sees an error with "0 участников".

2. Solution
- `create_group(p_name text, p_description text)` — SECURITY DEFINER RPC
  that atomically creates the group AND adds the creator as admin member
  in a single transaction. Returns the full group row.
- SECURITY DEFINER bypasses RLS, so both inserts succeed regardless of
  policy ordering. The function validates `auth.uid()` internally — only
  the authenticated caller becomes the creator/admin.

3. Security
- SECURITY DEFINER runs as the table owner (postgres), bypassing RLS.
  This is safe because:
  * The function only uses `auth.uid()` for created_by and user_id —
    no caller-supplied user IDs are accepted.
  * `p_name` and `p_description` are text inputs trimmed and validated;
    they don't affect authorization.
  * EXECUTE is revoked from PUBLIC/anon and granted only to authenticated.
- The existing RLS policies remain intact — direct client inserts into
  `groups` and `group_members` still work (for backward compatibility),
  but the client will now use the RPC instead.

4. Existing data
- No data is modified or deleted. The function only creates new rows.
*/

CREATE OR REPLACE FUNCTION public.create_group(p_name text, p_description text)
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

  INSERT INTO public.groups (name, description, created_by)
  VALUES (btrim(p_name), btrim(COALESCE(p_description, '')), v_user)
  RETURNING * INTO v_group;

  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES (v_group.id, v_user, true);

  RETURN v_group;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_group(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group(text, text) TO authenticated;
