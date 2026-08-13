-- ============================================================
-- Drop denormalized categories.name — translations are source of truth
-- Requires: 033_category_i18n.sql
-- ============================================================

BEGIN;

-- Ensure every category has at least default-locale translation before drop
INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
SELECT c.id, 'id', c.name, NOW(), NOW()
FROM categories c
WHERE c.name IS NOT NULL
  AND length(trim(c.name)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM category_translations ct
    WHERE ct.category_id = c.id AND ct.locale = 'id'
  )
ON CONFLICT (category_id, locale) DO NOTHING;

ALTER TABLE categories DROP COLUMN IF EXISTS name;

COMMIT;
