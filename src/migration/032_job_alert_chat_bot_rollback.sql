-- Rollback: remove job-alert chat bot (only if no conversations reference it)
DELETE FROM recruiters
WHERE id = 'a0000000-0000-4000-8000-000000000002'
   OR user_id = 'a0000000-0000-4000-8000-000000000001';

DELETE FROM users
WHERE id = 'a0000000-0000-4000-8000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM conversations WHERE recruiter_id = 'a0000000-0000-4000-8000-000000000001'
  )
  AND NOT EXISTS (
    SELECT 1 FROM messages WHERE sender_id = 'a0000000-0000-4000-8000-000000000001'
  );
