-- Rollback 029 news i18n (restore monolingual columns from locale 'id')

ALTER TABLE news_categories
  ADD COLUMN IF NOT EXISTS name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(160);

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(280),
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500);

UPDATE news_categories c
SET name = t.name,
    slug = t.slug
FROM news_category_translations t
WHERE t.category_id = c.id AND t.locale = 'id';

UPDATE news n
SET title = t.title,
    slug = t.slug,
    excerpt = t.excerpt,
    body = t.body,
    meta_title = t.meta_title,
    meta_description = t.meta_description
FROM news_translations t
WHERE t.news_id = n.id AND t.locale = 'id';

-- Enforce NOT NULL where possible for restored rows
ALTER TABLE news_categories
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE news
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN body SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_news_categories_slug_active
    ON news_categories (slug)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_news_slug_active
    ON news (slug)
    WHERE deleted_at IS NULL;

DROP TABLE IF EXISTS news_translations;
DROP TABLE IF EXISTS news_category_translations;
