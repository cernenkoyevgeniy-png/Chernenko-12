/*
# Storage bucket для аватаров

1. Новый bucket
- storage.buckets: 'avatars' (public).
  Аватары хранятся по пути avatars/<user_id>/<filename>.

2. Политики доступа (storage.objects использует path_tokens и metadata)
- SELECT: любому авторизованному (аватары публичные).
- INSERT: только в свой путь (path_tokens[1] = auth.uid()::text),
  только изображения (metadata->>'mimetype' LIKE 'image/%'), до 2 МБ
  ((metadata->>'size')::bigint <= 2097152).
- UPDATE/DELETE: только свой путь.

3. Замечания
- Публичный URL: <SUPABASE_URL>/storage/v1/object/public/avatars/<user_id>/<file>.
- Путь привязан к auth.uid(), email не фигурирует.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_read_authenticated" ON storage.objects;
CREATE POLICY "avatars_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND path_tokens[1] = auth.uid()::text
  AND (metadata->>'mimetype') LIKE 'image/%'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 2097152
);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND path_tokens[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND path_tokens[1] = auth.uid()::text
  AND (metadata->>'mimetype') LIKE 'image/%'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 2097152
);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND path_tokens[1] = auth.uid()::text
);
