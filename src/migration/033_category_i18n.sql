-- ============================================================
-- Job categories i18n: reset categories + seed id/en/ru/uz
-- WARNING: replaces ALL rows in categories.
-- Existing job_posts.category_id are remapped to id=1 (IT) after reset.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS category_translations (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_category_translations_locale UNIQUE (category_id, locale)
);

DROP INDEX IF EXISTS uq_category_translations_locale_name;
DROP INDEX IF EXISTS idx_category_translations_category_id;

-- Allow temporary NULL so we can wipe categories under FK
ALTER TABLE job_posts ALTER COLUMN category_id DROP NOT NULL;

UPDATE job_posts SET category_id = NULL WHERE category_id IS NOT NULL;

TRUNCATE TABLE category_translations RESTART IDENTITY;
DELETE FROM categories;

-- Reset identity (serial / identity)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'categories_id_seq'
  ) THEN
    PERFORM setval('categories_id_seq', 1, false);
  END IF;
END $$;

INSERT INTO categories (id, name) VALUES
  (1,  'Teknologi Informasi'),
  (2,  'Keuangan & Perbankan'),
  (3,  'Kesehatan & Kedokteran'),
  (4,  'Pendidikan & Pelatihan'),
  (5,  'Manufaktur & Produksi'),
  (6,  'E-Commerce & Retail'),
  (7,  'Transportasi & Logistik'),
  (8,  'Konstruksi & Properti'),
  (9,  'Pariwisata & Perhotelan'),
  (10, 'Pemasaran & Iklan'),
  (11, 'Desain & Kreatif'),
  (12, 'Sumber Daya Manusia');

SELECT setval(
  'categories_id_seq',
  COALESCE((SELECT MAX(id) FROM categories), 1),
  true
);

INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
VALUES
  -- 1 Teknologi Informasi
  (1, 'id', 'Teknologi Informasi', NOW(), NOW()),
  (1, 'en', 'Information Technology', NOW(), NOW()),
  (1, 'ru', 'Информационные технологии', NOW(), NOW()),
  (1, 'uz', 'Axborot texnologiyalari', NOW(), NOW()),
  -- 2 Keuangan & Perbankan
  (2, 'id', 'Keuangan & Perbankan', NOW(), NOW()),
  (2, 'en', 'Finance & Banking', NOW(), NOW()),
  (2, 'ru', 'Финансы и банковское дело', NOW(), NOW()),
  (2, 'uz', 'Moliya va bank ishi', NOW(), NOW()),
  -- 3 Kesehatan & Kedokteran
  (3, 'id', 'Kesehatan & Kedokteran', NOW(), NOW()),
  (3, 'en', 'Healthcare & Medicine', NOW(), NOW()),
  (3, 'ru', 'Здравоохранение и медицина', NOW(), NOW()),
  (3, 'uz', 'Sog''liqni saqlash va tibbiyot', NOW(), NOW()),
  -- 4 Pendidikan & Pelatihan
  (4, 'id', 'Pendidikan & Pelatihan', NOW(), NOW()),
  (4, 'en', 'Education & Training', NOW(), NOW()),
  (4, 'ru', 'Образование и обучение', NOW(), NOW()),
  (4, 'uz', 'Ta''lim va trening', NOW(), NOW()),
  -- 5 Manufaktur & Produksi
  (5, 'id', 'Manufaktur & Produksi', NOW(), NOW()),
  (5, 'en', 'Manufacturing & Production', NOW(), NOW()),
  (5, 'ru', 'Производство', NOW(), NOW()),
  (5, 'uz', 'Ishlab chiqarish', NOW(), NOW()),
  -- 6 E-Commerce & Retail
  (6, 'id', 'E-Commerce & Retail', NOW(), NOW()),
  (6, 'en', 'E-Commerce & Retail', NOW(), NOW()),
  (6, 'ru', 'Электронная коммерция и ритейл', NOW(), NOW()),
  (6, 'uz', 'Elektron tijorat va chakana savdo', NOW(), NOW()),
  -- 7 Transportasi & Logistik
  (7, 'id', 'Transportasi & Logistik', NOW(), NOW()),
  (7, 'en', 'Transportation & Logistics', NOW(), NOW()),
  (7, 'ru', 'Транспорт и логистика', NOW(), NOW()),
  (7, 'uz', 'Transport va logistika', NOW(), NOW()),
  -- 8 Konstruksi & Properti
  (8, 'id', 'Konstruksi & Properti', NOW(), NOW()),
  (8, 'en', 'Construction & Property', NOW(), NOW()),
  (8, 'ru', 'Строительство и недвижимость', NOW(), NOW()),
  (8, 'uz', 'Qurilish va ko''chmas mulk', NOW(), NOW()),
  -- 9 Pariwisata & Perhotelan
  (9, 'id', 'Pariwisata & Perhotelan', NOW(), NOW()),
  (9, 'en', 'Tourism & Hospitality', NOW(), NOW()),
  (9, 'ru', 'Туризм и гостиничный бизнес', NOW(), NOW()),
  (9, 'uz', 'Turizm va mehmonxona biznesi', NOW(), NOW()),
  -- 10 Pemasaran & Iklan
  (10, 'id', 'Pemasaran & Iklan', NOW(), NOW()),
  (10, 'en', 'Marketing & Advertising', NOW(), NOW()),
  (10, 'ru', 'Маркетинг и реклама', NOW(), NOW()),
  (10, 'uz', 'Marketing va reklama', NOW(), NOW()),
  -- 11 Desain & Kreatif
  (11, 'id', 'Desain & Kreatif', NOW(), NOW()),
  (11, 'en', 'Design & Creative', NOW(), NOW()),
  (11, 'ru', 'Дизайн и творчество', NOW(), NOW()),
  (11, 'uz', 'Dizayn va ijod', NOW(), NOW()),
  -- 12 Sumber Daya Manusia
  (12, 'id', 'Sumber Daya Manusia', NOW(), NOW()),
  (12, 'en', 'Human Resources', NOW(), NOW()),
  (12, 'ru', 'Управление персоналом', NOW(), NOW()),
  (12, 'uz', 'Inson resurslari', NOW(), NOW());

CREATE UNIQUE INDEX IF NOT EXISTS uq_category_translations_locale_name
    ON category_translations (locale, lower(name));

CREATE INDEX IF NOT EXISTS idx_category_translations_category_id
    ON category_translations (category_id);

-- Remap all job posts to default category (Information Technology)
UPDATE job_posts SET category_id = 1 WHERE category_id IS NULL;

COMMIT;
