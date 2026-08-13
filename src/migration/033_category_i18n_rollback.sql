-- Rollback 033 category i18n (does not restore wiped legacy categories)
DROP INDEX IF EXISTS idx_category_translations_category_id;
DROP INDEX IF EXISTS uq_category_translations_locale_name;
DROP TABLE IF EXISTS category_translations;
