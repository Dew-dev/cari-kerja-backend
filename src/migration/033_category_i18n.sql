-- ============================================================
-- Job categories i18n: category_translations (id, en, ru, uz)
-- Keeps categories.name as denormalized default (id) for BC
-- ============================================================

CREATE TABLE IF NOT EXISTS category_translations (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_category_translations_locale UNIQUE (category_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_category_translations_locale_name
    ON category_translations (locale, lower(name));

CREATE INDEX IF NOT EXISTS idx_category_translations_category_id
    ON category_translations (category_id);

-- Backfill Indonesian from existing categories.name
INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
SELECT c.id, 'id', c.name, NOW(), NOW()
FROM categories c
WHERE NOT EXISTS (
  SELECT 1 FROM category_translations ct
  WHERE ct.category_id = c.id AND ct.locale = 'id'
);

-- Seed en / ru / uz for known seed categories (match by Indonesian name)
WITH map(name_id, name_en, name_ru, name_uz) AS (
  VALUES
    ('Teknologi Informasi', 'Information Technology', 'Информационные технологии', 'Axborot texnologiyalari'),
    ('Keuangan & Perbankan', 'Finance & Banking', 'Финансы и банковское дело', 'Moliya va bank ishi'),
    ('Kesehatan & Kedokteran', 'Healthcare & Medicine', 'Здравоохранение и медицина', 'Sog''liqni saqlash va tibbiyot'),
    ('Pendidikan & Pelatihan', 'Education & Training', 'Образование и обучение', 'Ta''lim va trening'),
    ('Manufaktur & Produksi', 'Manufacturing & Production', 'Производство', 'Ishlab chiqarish'),
    ('E-Commerce & Retail', 'E-Commerce & Retail', 'Электронная коммерция и ритейл', 'Elektron tijorat va chakana savdo'),
    ('Transportasi & Logistik', 'Transportation & Logistics', 'Транспорт и логистика', 'Transport va logistika'),
    ('Konstruksi & Properti', 'Construction & Property', 'Строительство и недвижимость', 'Qurilish va ko''chmas mulk'),
    ('Pariwisata & Perhotelan', 'Tourism & Hospitality', 'Туризм и гостиничный бизнес', 'Turizm va mehmonxona biznesi'),
    ('Pemasaran & Iklan', 'Marketing & Advertising', 'Маркетинг и реклама', 'Marketing va reklama'),
    ('Desain & Kreatif', 'Design & Creative', 'Дизайн и творчество', 'Dizayn va ijod'),
    ('Sumber Daya Manusia', 'Human Resources', 'Управление персоналом', 'Inson resurslari')
)
INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
SELECT c.id, v.locale, v.name, NOW(), NOW()
FROM categories c
JOIN map m ON m.name_id = c.name
CROSS JOIN LATERAL (
  VALUES
    ('en', m.name_en),
    ('ru', m.name_ru),
    ('uz', m.name_uz)
) AS v(locale, name)
WHERE NOT EXISTS (
  SELECT 1 FROM category_translations ct
  WHERE ct.category_id = c.id AND ct.locale = v.locale
);
