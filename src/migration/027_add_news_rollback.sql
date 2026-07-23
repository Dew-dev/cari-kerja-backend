-- Rollback 027_add_news
DROP INDEX IF EXISTS idx_news_featured;
DROP INDEX IF EXISTS idx_news_category_id;
DROP INDEX IF EXISTS idx_news_status_published_at;
DROP INDEX IF EXISTS uq_news_slug_active;
DROP TABLE IF EXISTS news;
DROP INDEX IF EXISTS uq_news_categories_slug_active;
DROP TABLE IF EXISTS news_categories;
