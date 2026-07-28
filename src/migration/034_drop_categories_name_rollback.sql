-- Rollback 034: restore categories.name from id locale translations
BEGIN;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(255);

UPDATE categories c
SET name = ct.name
FROM category_translations ct
WHERE ct.category_id = c.id
  AND ct.locale = 'id'
  AND (c.name IS NULL OR c.name = '');

-- Fallback for any remaining nulls
UPDATE categories
SET name = 'Category ' || id::text
WHERE name IS NULL OR name = '';

ALTER TABLE categories ALTER COLUMN name SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON categories (name);

COMMIT;
