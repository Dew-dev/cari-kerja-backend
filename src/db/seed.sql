-- =================================================================
-- SEED DATA - CariKerja Website
-- Password semua users: Password123!
-- Jalankan SETELAH semua migration (query.sql + add_*.sql) sudah dieksekusi
-- =================================================================

BEGIN;

-- =================================================================
-- 1. CATEGORIES
-- =================================================================
INSERT INTO categories (name) VALUES
  ('Teknologi Informasi'),
  ('Keuangan & Perbankan'),
  ('Kesehatan & Kedokteran'),
  ('Pendidikan & Pelatihan'),
  ('Manufaktur & Produksi'),
  ('E-Commerce & Retail'),
  ('Transportasi & Logistik'),
  ('Konstruksi & Properti'),
  ('Pariwisata & Perhotelan'),
  ('Pemasaran & Iklan'),
  ('Desain & Kreatif'),
  ('Sumber Daya Manusia')
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- 2. SKILLS
-- =================================================================
INSERT INTO skills (id, skill_name) VALUES
  ('cccccccc-cccc-cccc-cccc-000000000001', 'JavaScript'),
  ('cccccccc-cccc-cccc-cccc-000000000002', 'TypeScript'),
  ('cccccccc-cccc-cccc-cccc-000000000003', 'React'),
  ('cccccccc-cccc-cccc-cccc-000000000004', 'Vue.js'),
  ('cccccccc-cccc-cccc-cccc-000000000005', 'Node.js'),
  ('cccccccc-cccc-cccc-cccc-000000000006', 'Python'),
  ('cccccccc-cccc-cccc-cccc-000000000007', 'Java'),
  ('cccccccc-cccc-cccc-cccc-000000000008', 'Go'),
  ('cccccccc-cccc-cccc-cccc-000000000009', 'PostgreSQL'),
  ('cccccccc-cccc-cccc-cccc-000000000010', 'MySQL'),
  ('cccccccc-cccc-cccc-cccc-000000000011', 'MongoDB'),
  ('cccccccc-cccc-cccc-cccc-000000000012', 'Redis'),
  ('cccccccc-cccc-cccc-cccc-000000000013', 'Docker'),
  ('cccccccc-cccc-cccc-cccc-000000000014', 'Kubernetes'),
  ('cccccccc-cccc-cccc-cccc-000000000015', 'Git'),
  ('cccccccc-cccc-cccc-cccc-000000000016', 'AWS'),
  ('cccccccc-cccc-cccc-cccc-000000000017', 'Google Cloud Platform'),
  ('cccccccc-cccc-cccc-cccc-000000000018', 'Figma'),
  ('cccccccc-cccc-cccc-cccc-000000000019', 'UI/UX Design'),
  ('cccccccc-cccc-cccc-cccc-000000000020', 'Data Analysis'),
  ('cccccccc-cccc-cccc-cccc-000000000021', 'Machine Learning'),
  ('cccccccc-cccc-cccc-cccc-000000000022', 'SQL'),
  ('cccccccc-cccc-cccc-cccc-000000000023', 'PHP'),
  ('cccccccc-cccc-cccc-cccc-000000000024', 'Laravel'),
  ('cccccccc-cccc-cccc-cccc-000000000025', 'Next.js'),
  ('cccccccc-cccc-cccc-cccc-000000000026', 'REST API'),
  ('cccccccc-cccc-cccc-cccc-000000000027', 'GraphQL'),
  ('cccccccc-cccc-cccc-cccc-000000000028', 'Spring Boot'),
  ('cccccccc-cccc-cccc-cccc-000000000029', 'Express.js'),
  ('cccccccc-cccc-cccc-cccc-000000000030', 'DevOps')
ON CONFLICT (skill_name) DO NOTHING;

-- =================================================================
-- 3. JOB TAGS
-- =================================================================
INSERT INTO job_tags (id, name) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000001', 'Remote'),
  ('eeeeeeee-eeee-eeee-eeee-000000000002', 'Startup'),
  ('eeeeeeee-eeee-eeee-eeee-000000000003', 'Senior Level'),
  ('eeeeeeee-eeee-eeee-eeee-000000000004', 'Fresh Graduate'),
  ('eeeeeeee-eeee-eeee-eeee-000000000005', 'Tech'),
  ('eeeeeeee-eeee-eeee-eeee-000000000006', 'Hybrid'),
  ('eeeeeeee-eeee-eeee-eeee-000000000007', 'Work From Home'),
  ('eeeeeeee-eeee-eeee-eeee-000000000008', 'Fast Growing'),
  ('eeeeeeee-eeee-eeee-eeee-000000000009', 'Internship'),
  ('eeeeeeee-eeee-eeee-eeee-000000000010', 'Corporate')
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- 4. USERS
--   role_id 1 = worker, 2 = recruiter
--   login_provider = 'local'
--   password hash = 'Password123!'
-- =================================================================
INSERT INTO users (id, username, email, hashed_password, login_provider, role_id) VALUES
  -- Workers
  ('11111111-1111-1111-1111-000000000001', 'budi_santoso',     'budi.santoso@gmail.com',     '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 1),
  ('11111111-1111-1111-1111-000000000002', 'siti_rahayu',      'siti.rahayu@gmail.com',      '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 1),
  ('11111111-1111-1111-1111-000000000003', 'ahmad_fauzi',      'ahmad.fauzi@gmail.com',      '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 1),
  ('11111111-1111-1111-1111-000000000004', 'dewi_kurniawati',  'dewi.kurniawati@gmail.com',  '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 1),
  ('11111111-1111-1111-1111-000000000005', 'rizky_pratama',    'rizky.pratama@gmail.com',    '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 1),
  -- Recruiters
  ('22222222-2222-2222-2222-000000000001', 'hr_tokopedia',     'hr@tokopedia.com',           '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 2),
  ('22222222-2222-2222-2222-000000000002', 'hr_gojek',         'hr@gojek.com',               '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 2),
  ('22222222-2222-2222-2222-000000000003', 'hr_bca',           'hr@bca.co.id',               '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 2),
  ('22222222-2222-2222-2222-000000000004', 'hr_astra',         'hr@astra.co.id',             '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 2),
  ('22222222-2222-2222-2222-000000000005', 'hr_ruangguru',     'hr@ruangguru.com',           '$2b$10$cxMiKT36.YjYIsTOYB0QH.zVwAvpLS0qU1tGKBXveDNclz.kIRnRa', 'local', 2);

-- =================================================================
-- 5. WORKERS
--   gender_id:            1=male, 2=female, 3=other
--   religion_id:          1=Islam, 2=Christianity, 3=Judaism, 4=Hinduism, 5=Buddhism
--   marriage_status_id:   1=married, 2=not married, 3=divorced, 4=widowed
-- =================================================================
INSERT INTO workers (
  id, user_id, name, telephone, date_of_birth,
  gender_id, nationality_id, religion_id, marriage_status_id,
  address, profile_summary,
  current_salary, current_salary_currency_id,
  expected_salary, expected_salary_currency_id
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
    '11111111-1111-1111-1111-000000000001',
    'Budi Santoso', '081234567001', '1995-06-15',
    1, (SELECT id FROM nationalities WHERE iso_alpha2 = 'ID'), 1, 2,
    'Jl. Sudirman No. 12, Jakarta Pusat',
    'Backend developer berpengalaman 5+ tahun dengan keahlian Node.js, Go, dan arsitektur microservices. Berpengalaman di industri e-commerce dan fintech skala besar.',
    18000000, (SELECT id FROM currencies WHERE code = 'IDR'),
    25000000, (SELECT id FROM currencies WHERE code = 'IDR')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    '11111111-1111-1111-1111-000000000002',
    'Siti Rahayu', '081234567002', '1997-03-22',
    2, (SELECT id FROM nationalities WHERE iso_alpha2 = 'ID'), 1, 2,
    'Jl. Dago No. 45, Bandung',
    'Frontend developer dengan 3 tahun pengalaman menggunakan React dan TypeScript. Passionate terhadap UX dan web performance optimization.',
    12000000, (SELECT id FROM currencies WHERE code = 'IDR'),
    18000000, (SELECT id FROM currencies WHERE code = 'IDR')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    '11111111-1111-1111-1111-000000000003',
    'Ahmad Fauzi', '081234567003', '1993-11-08',
    1, (SELECT id FROM nationalities WHERE iso_alpha2 = 'ID'), 1, 1,
    'Jl. Pemuda No. 88, Surabaya',
    'Data Scientist & Analyst dengan pengalaman 6+ tahun. Mahir Python, SQL, dan machine learning. Berpengalaman di perbankan dan retail.',
    22000000, (SELECT id FROM currencies WHERE code = 'IDR'),
    32000000, (SELECT id FROM currencies WHERE code = 'IDR')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    '11111111-1111-1111-1111-000000000004',
    'Dewi Kurniawati', '081234567004', '1998-07-30',
    2, (SELECT id FROM nationalities WHERE iso_alpha2 = 'ID'), 2, 2,
    'Jl. Malioboro No. 21, Yogyakarta',
    'UI/UX Designer dengan 4 tahun pengalaman. Menguasai Figma, Adobe XD, dan user research. Fokus pada desain yang berpusat pada pengguna.',
    14000000, (SELECT id FROM currencies WHERE code = 'IDR'),
    20000000, (SELECT id FROM currencies WHERE code = 'IDR')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000005',
    '11111111-1111-1111-1111-000000000005',
    'Rizky Pratama', '081234567005', '1996-01-12',
    1, (SELECT id FROM nationalities WHERE iso_alpha2 = 'ID'), 1, 2,
    'Jl. Merdeka No. 5, Medan',
    'Full stack developer 4 tahun pengalaman di React, Node.js, dan PostgreSQL. Aktif berkontribusi pada open source projects.',
    16000000, (SELECT id FROM currencies WHERE code = 'IDR'),
    22000000, (SELECT id FROM currencies WHERE code = 'IDR')
  )
ON CONFLICT (user_id) DO NOTHING;

-- =================================================================
-- 6. EDUCATIONS
-- =================================================================
INSERT INTO educations (worker_id, institution_name, degree, major, start_date, end_date, is_current) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Universitas Indonesia',             'S1', 'Ilmu Komputer',           '2013-08-01', '2017-07-01', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'Institut Teknologi Bandung',         'S1', 'Teknik Informatika',      '2015-08-01', '2019-07-01', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Institut Teknologi Sepuluh Nopember','S1', 'Statistika',             '2011-08-01', '2015-07-01', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Universitas Gadjah Mada',            'S2', 'Data Science',           '2016-08-01', '2018-07-01', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Universitas Gadjah Mada',            'S1', 'Desain Komunikasi Visual','2016-08-01', '2020-07-01', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Universitas Sumatera Utara',         'S1', 'Teknik Informatika',      '2014-08-01', '2018-07-01', false);

-- =================================================================
-- 7. WORK EXPERIENCES
-- =================================================================
INSERT INTO work_experiences (worker_id, company_name, job_title, start_date, end_date, is_current, description) VALUES
  -- Budi
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'PT Bukalapak',        'Junior Backend Developer',  '2017-08-01', '2019-12-31', false, 'Mengembangkan REST API untuk platform marketplace menggunakan Node.js dan PostgreSQL.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'PT Tokopedia',        'Backend Developer',         '2020-01-01', '2022-06-30', false, 'Membangun microservices untuk sistem pembayaran dengan Go dan Kafka.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'PT Shopee Indonesia', 'Senior Backend Engineer',   '2022-07-01', NULL,         true,  'Lead developer untuk tim order management system yang menangani jutaan transaksi per hari.'),
  -- Siti
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'CV Digital Studio',   'Junior Frontend Developer', '2019-09-01', '2021-05-31', false, 'Membangun komponen UI dengan React dan mengintegrasikan REST API.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'PT Kudo Indonesia',   'Frontend Developer',        '2021-06-01', NULL,         true,  'Mengembangkan dan memaintain aplikasi web e-commerce dengan React dan TypeScript.'),
  -- Ahmad
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'PT Bank Mandiri',     'Data Analyst',              '2015-08-01', '2018-12-31', false, 'Menganalisis data transaksi nasabah untuk deteksi fraud menggunakan Python dan SQL.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'PT Datascrip',        'Senior Data Scientist',     '2019-01-01', NULL,         true,  'Membangun model machine learning untuk prediksi churn pelanggan dan rekomendasi produk.'),
  -- Dewi
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Freelance',           'UI/UX Designer',            '2020-07-01', '2021-12-31', false, 'Mengerjakan berbagai proyek desain aplikasi mobile dan web untuk klien lokal.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'PT Kreasi Digital',   'UI/UX Designer',            '2022-01-01', NULL,         true,  'Merancang pengalaman pengguna untuk platform edukasi online dengan 500K+ pengguna aktif.'),
  -- Rizky
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'PT Inovasi Teknologi','Web Developer',             '2018-10-01', '2021-03-31', false, 'Full stack development menggunakan Laravel dan Vue.js untuk sistem ERP perusahaan.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'PT Zetta Media',      'Full Stack Developer',      '2021-04-01', NULL,         true,  'Mengembangkan platform SaaS menggunakan Next.js, Node.js, dan PostgreSQL.');

-- =================================================================
-- 8. CERTIFICATIONS
-- =================================================================
INSERT INTO certifications (worker_id, name, issuer, issue_date, expiry_date, credential_id, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'AWS Certified Developer – Associate',    'Amazon Web Services', '2022-03-15', '2025-03-15', 'AWS-DEV-2022-001',  true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Node.js Application Development (LFW212)','Linux Foundation',   '2021-06-10', NULL,         'LF-NODE-21001',     true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Google Professional Data Engineer',       'Google Cloud',       '2023-01-20', '2026-01-20', 'GCP-DE-2023-055',   true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'TensorFlow Developer Certificate',        'Google',             '2022-09-05', NULL,         'TF-DEV-2022-099',   true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Google UX Design Certificate',            'Google / Coursera',  '2021-04-18', NULL,         'GOOG-UX-21-234',    true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Meta Back-End Developer Certificate',     'Meta / Coursera',    '2022-11-30', NULL,         'META-BE-22-789',    true);

-- =================================================================
-- 9. LANGUAGES
--   proficiency_level_id: 1=Beginner, 2=Intermediate, 3=Fluent, 4=Native
-- =================================================================
INSERT INTO languages (worker_id, language_name, proficiency_level_id, is_primary) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Bahasa Indonesia', 4, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'English',          3, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'Bahasa Indonesia', 4, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'English',          3, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Bahasa Indonesia', 4, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'English',          3, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Japanese',         2, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Bahasa Indonesia', 4, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'English',          3, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Bahasa Indonesia', 4, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'English',          2, false);

-- =================================================================
-- 10. WORKER SKILLS
-- =================================================================
INSERT INTO worker_skills (worker_id, skill_id) VALUES
  -- Budi (Backend)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001'), -- JavaScript
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000005'), -- Node.js
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000008'), -- Go
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000009'), -- PostgreSQL
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000012'), -- Redis
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000013'), -- Docker
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000015'), -- Git
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000016'), -- AWS
  -- Siti (Frontend)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000001'), -- JavaScript
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000002'), -- TypeScript
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000003'), -- React
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000015'), -- Git
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000025'), -- Next.js
  -- Ahmad (Data)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000006'), -- Python
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000020'), -- Data Analysis
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000021'), -- Machine Learning
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000022'), -- SQL
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000017'), -- Google Cloud Platform
  -- Dewi (Designer)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'cccccccc-cccc-cccc-cccc-000000000018'), -- Figma
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'cccccccc-cccc-cccc-cccc-000000000019'), -- UI/UX Design
  -- Rizky (Full Stack)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000001'), -- JavaScript
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000002'), -- TypeScript
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000003'), -- React
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000005'), -- Node.js
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000009'), -- PostgreSQL
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000025') -- Next.js
ON CONFLICT (worker_id, skill_id) DO NOTHING;

-- =================================================================
-- 11. PORTFOLIOS
-- =================================================================
INSERT INTO portfolios (worker_id, title, description, link, is_public) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Open Source REST API Framework',  'Framework Node.js ringan untuk membangun REST API dengan clean architecture.',                      'https://github.com/budisantoso/node-clean-api',            true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'E-Commerce Frontend Template',    'Template React untuk halaman produk e-commerce dengan fitur filter dan search.',                    'https://github.com/sitirahayu/ecommerce-ui',               true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Customer Churn Predictor',        'Model machine learning untuk prediksi churn telekomunikasi dengan akurasi 89%.',                   'https://github.com/ahmadfauzi/churn-predictor',            true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Mobile Banking UI Design',        'Desain UI/UX aplikasi mobile banking modern dengan dark mode dan aksesibilitas penuh.',            'https://www.figma.com/file/dewikurniawati/mobile-banking',  true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'CariKerja Clone App',             'Aplikasi pencarian kerja full stack menggunakan Next.js, Node.js, dan PostgreSQL.',               'https://github.com/rizkypratama/carikerja-clone',          true);

-- =================================================================
-- 12. RESUMES
-- =================================================================
INSERT INTO resumes (id, worker_id, resume_url, title, is_default) VALUES
  ('ffffffff-ffff-ffff-ffff-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'https://storage.example.com/resumes/budi_santoso_2025.pdf',     'CV Budi Santoso - Backend Developer',    true),
  ('ffffffff-ffff-ffff-ffff-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'https://storage.example.com/resumes/siti_rahayu_2025.pdf',      'CV Siti Rahayu - Frontend Developer',    true),
  ('ffffffff-ffff-ffff-ffff-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'https://storage.example.com/resumes/ahmad_fauzi_2025.pdf',      'CV Ahmad Fauzi - Data Scientist',        true),
  ('ffffffff-ffff-ffff-ffff-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'https://storage.example.com/resumes/dewi_kurniawati_2025.pdf',  'CV Dewi Kurniawati - UI/UX Designer',    true),
  ('ffffffff-ffff-ffff-ffff-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'https://storage.example.com/resumes/rizky_pratama_2025.pdf',    'CV Rizky Pratama - Full Stack Developer', true);

-- =================================================================
-- 13. RECRUITERS
-- =================================================================
INSERT INTO recruiters (id, user_id, company_name, company_website, contact_name, contact_phone, address, industry_id, description, is_vip) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
    '22222222-2222-2222-2222-000000000001',
    'PT Tokopedia Indonesia', 'https://www.tokopedia.com',
    'HR Tokopedia', '02129850000',
    'Tokopedia Tower, Jl. Prof. Dr. Satrio Kav. 11, Jakarta Selatan',
    (SELECT id FROM industries WHERE name = 'E-Commerce & Retail'),
    'Tokopedia adalah perusahaan teknologi Indonesia yang memungkinkan jutaan pedagang dan konsumen berpartisipasi dalam ekosistem perdagangan digital.',
    true
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    '22222222-2222-2222-2222-000000000002',
    'PT Gojek Technology', 'https://www.gojek.com',
    'HR Gojek', '02150251000',
    'Pasaraya Blok M Office Tower, Jl. Iskandarsyah II No. 2, Jakarta Selatan',
    (SELECT id FROM industries WHERE name = 'Information Technology'),
    'Gojek adalah perusahaan teknologi terkemuka Asia Tenggara yang menawarkan berbagai layanan on-demand termasuk transportasi, pesan antar makanan, dan layanan keuangan digital.',
    true
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
    '22222222-2222-2222-2222-000000000003',
    'PT Bank Central Asia Tbk', 'https://www.bca.co.id',
    'HR BCA', '02123500000',
    'Menara BCA, Grand Indonesia, Jl. MH Thamrin No. 1, Jakarta Pusat',
    (SELECT id FROM industries WHERE name = 'Finance & Banking'),
    'BCA adalah bank swasta terbesar di Indonesia yang melayani jutaan nasabah dengan berbagai produk perbankan digital dan konvensional.',
    false
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000004',
    '22222222-2222-2222-2222-000000000004',
    'PT Astra International Tbk', 'https://www.astra.co.id',
    'HR Astra', '02165100000',
    'Jl. Gaya Motor Raya No.8, Sunter II, Jakarta Utara',
    (SELECT id FROM industries WHERE name = 'Manufacturing & Production'),
    'Astra International adalah konglomerat Indonesia terkemuka dengan bisnis di otomotif, jasa keuangan, alat berat, agrobisnis, infrastruktur, dan teknologi informasi.',
    false
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000005',
    '22222222-2222-2222-2222-000000000005',
    'PT Ruangguru', 'https://www.ruangguru.com',
    'HR Ruangguru', '02129785900',
    'Jl. Hayam Wuruk No. 98, Jakarta Barat',
    (SELECT id FROM industries WHERE name = 'Education & Training'),
    'Ruangguru adalah platform edukasi terbesar di Indonesia dengan lebih dari 22 juta pengguna, menyediakan layanan bimbingan belajar online untuk pelajar.',
    false
  );

-- =================================================================
-- 14. JOB POSTS
--   employment_type_id:   1=Full-time, 2=Part-time, 3=Contract, 4=Internship, 5=Freelance
--   experience_level_id:  1=Fresh Graduate, 2=Junior, 3=Middle, 4=Senior
--   salary_type_id:       1=daily, 2=weekly, 3=monthly, 4=yearly
--   status_id:            1=OPEN, 2=CLOSED, 3=DRAFT
-- =================================================================
INSERT INTO job_posts (
  id, recruiter_id, title, description,
  location, province, city,
  employment_type_id, experience_level_id,
  salary_min, salary_max, salary_type_id, currency_id,
  status_id, category_id,
  is_remote, is_vip, deadline
) VALUES
  -- JP1: Senior Backend Engineer — Tokopedia
  (
    'dddddddd-dddd-dddd-dddd-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
    'Senior Backend Engineer (Node.js / Go)',
    'Kami mencari Senior Backend Engineer berpengalaman untuk bergabung dengan tim kami dalam membangun infrastruktur backend yang skalabel untuk layanan marketplace. Kamu akan bertanggung jawab merancang, mengembangkan, dan memaintain sistem backend berkinerja tinggi yang menangani jutaan transaksi setiap hari.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 4, 25000000, 40000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    false, true, '2026-05-31'
  ),
  -- JP2: Frontend Developer — Tokopedia
  (
    'dddddddd-dddd-dddd-dddd-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
    'Frontend Developer (React / TypeScript)',
    'Bergabunglah dengan tim Product Engineering Tokopedia untuk membangun pengalaman belanja online yang luar biasa bagi jutaan pengguna. Kamu akan bekerja dalam tim lintas fungsi untuk mengembangkan fitur-fitur baru yang inovatif pada platform web Tokopedia.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 2, 10000000, 18000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    true, true, '2026-05-15'
  ),
  -- JP3: Data Engineer — Gojek
  (
    'dddddddd-dddd-dddd-dddd-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    'Data Engineer',
    'Gojek sedang mencari Data Engineer berpengalaman untuk membangun dan memelihara pipeline data yang mendukung operasional bisnis kami di seluruh Asia Tenggara. Kamu akan bekerja dengan dataset yang sangat besar dan sistem data real-time yang kritikal.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 3, 18000000, 28000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    false, true, '2026-06-30'
  ),
  -- JP4: Android Developer — Gojek
  (
    'dddddddd-dddd-dddd-dddd-000000000004',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    'Android Developer (Kotlin)',
    'Kami mencari Android Developer berbakat untuk membangun dan meningkatkan aplikasi Gojek yang digunakan oleh jutaan pengguna setiap harinya. Kamu akan bekerja dengan teknologi mobile terkini dan berkolaborasi dengan tim engineering kelas dunia.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 3, 20000000, 32000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    false, false, '2026-05-20'
  ),
  -- JP5: Software Engineer Java — BCA
  (
    'dddddddd-dddd-dddd-dddd-000000000005',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
    'Software Engineer (Java / Spring Boot)',
    'BCA Digital mencari Software Engineer untuk bergabung dalam transformasi digital perbankan. Kamu akan mengembangkan layanan perbankan digital yang aman dan handal menggunakan teknologi Java ekosistem terkini.',
    'Jakarta Pusat', 'DKI Jakarta', 'Jakarta Pusat',
    1, 2, 12000000, 20000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Keuangan & Perbankan'),
    false, false, '2026-06-15'
  ),
  -- JP6: IT Security Analyst — BCA
  (
    'dddddddd-dddd-dddd-dddd-000000000006',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
    'IT Security Analyst',
    'BCA mencari IT Security Analyst untuk memperkuat keamanan sistem informasi dan melindungi aset digital bank. Kamu akan menganalisis ancaman siber, melakukan security assessment, dan mengembangkan strategi keamanan yang komprehensif.',
    'Jakarta Pusat', 'DKI Jakarta', 'Jakarta Pusat',
    1, 3, 18000000, 28000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Keuangan & Perbankan'),
    false, false, '2026-05-30'
  ),
  -- JP7: UI/UX Designer — Tokopedia
  (
    'dddddddd-dddd-dddd-dddd-000000000007',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
    'Senior UI/UX Designer',
    'Tokopedia mencari Senior UI/UX Designer untuk memimpin inisiatif desain yang berpusat pada pengguna. Kamu akan berkolaborasi dengan tim product, engineering, dan bisnis untuk menciptakan pengalaman belanja yang lebih baik bagi jutaan pengguna.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 4, 22000000, 35000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Desain & Kreatif'),
    true, true, '2026-06-01'
  ),
  -- JP8: Full Stack Engineer — Ruangguru
  (
    'dddddddd-dddd-dddd-dddd-000000000008',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000005',
    'Full Stack Engineer (Node.js + React)',
    'Ruangguru mencari Full Stack Engineer yang bersemangat untuk membangun platform edukasi masa depan. Bergabunglah dengan kami untuk menciptakan teknologi yang membantu jutaan pelajar Indonesia meraih impian mereka.',
    'Jakarta Barat', 'DKI Jakarta', 'Jakarta Barat',
    1, 3, 15000000, 25000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    true, false, '2026-07-01'
  ),
  -- JP9: DevOps/SRE — Gojek
  (
    'dddddddd-dddd-dddd-dddd-000000000009',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    'DevOps / SRE Engineer',
    'Tim Infrastructure Gojek mencari DevOps/SRE Engineer berpengalaman. Kamu akan bertanggung jawab memastikan ketersediaan, performa, dan keandalan platform Gojek yang melayani jutaan pengguna di Asia Tenggara.',
    'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    1, 4, 30000000, 50000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    false, true, '2026-05-31'
  ),
  -- JP10: Software Engineering Intern — Ruangguru
  (
    'dddddddd-dddd-dddd-dddd-000000000010',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000005',
    'Software Engineering Intern',
    'Ruangguru membuka kesempatan magang untuk mahasiswa atau fresh graduate yang ingin berkembang di bidang software engineering. Kamu akan bekerja langsung bersama senior engineer dan mendapatkan pengalaman nyata dalam pengembangan produk.',
    'Jakarta Barat', 'DKI Jakarta', 'Jakarta Barat',
    4, 1, 3000000, 5000000, 3,
    (SELECT id FROM currencies WHERE code = 'IDR'),
    1, (SELECT id FROM categories WHERE name = 'Teknologi Informasi'),
    true, false, '2026-04-30'
  );

-- =================================================================
-- 15. JOB POST REQUIREMENTS
-- =================================================================
INSERT INTO job_post_requirements (id,job_post_id, requirement, order_index) VALUES
  -- JP1: Senior Backend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Minimal 4 tahun pengalaman sebagai Backend Developer', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Menguasai Node.js atau Go untuk pengembangan backend', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Berpengalaman dengan PostgreSQL dan Redis', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Memahami arsitektur microservices dan message queue (Kafka/RabbitMQ)', 4),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Berpengalaman dengan Docker dan Kubernetes', 5),
  -- JP2: Frontend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Minimal 1 tahun pengalaman sebagai Frontend Developer', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Menguasai React dan TypeScript', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Memahami HTML5, CSS3, dan responsive design', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Familiar dengan state management (Redux / Zustand)', 4),
  -- JP3: Data Engineer
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Minimal 2 tahun pengalaman di bidang data engineering', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Menguasai Python dan SQL', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Berpengalaman dengan platform cloud (GCP / AWS)', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Familiar dengan Apache Spark atau BigQuery', 4),
  -- JP5: Java/Spring Boot BCA
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Pendidikan minimal S1 Teknik Informatika / Ilmu Komputer atau relevan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Menguasai Java dan Spring Boot', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Memahami konsep OOP, design patterns, dan SOLID principles', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Berpengalaman dengan database relasional (Oracle / MySQL / PostgreSQL)', 4),
  -- JP7: UI/UX Designer
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'Minimal 3 tahun pengalaman sebagai UI/UX Designer', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'Menguasai Figma sebagai tools desain utama', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'Memahami prinsip desain berbasis data dan A/B testing', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'Portfolio yang menunjukkan pengalaman pada produk digital skala besar', 4),
  -- JP8: Full Stack Ruangguru
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Minimal 2 tahun pengalaman full stack development', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Menguasai Node.js (Express / NestJS) dan React', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Berpengalaman dengan PostgreSQL', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Memahami RESTful API design dan best practices', 4),
  -- JP9: DevOps
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Minimal 4 tahun pengalaman di bidang DevOps / SRE / Infrastructure', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Menguasai Kubernetes dan Docker di skala produksi', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Berpengalaman dengan cloud platform (GCP / AWS)', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Menguasai Infrastructure as Code (Terraform / Ansible)', 4),
  -- JP10: Intern
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Mahasiswa aktif semester akhir atau fresh graduate maksimal 1 tahun', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Memiliki pemahaman dasar tentang web development', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Familiar dengan salah satu bahasa pemrograman (JavaScript / Python / Java)', 3);

-- =================================================================
-- 16. JOB POST BENEFITS
-- =================================================================
INSERT INTO job_post_benefits (id, job_post_id, benefit, order_index) VALUES
  -- Tokopedia JP1
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'BPJS Kesehatan dan Ketenagakerjaan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Tunjangan makan dan transportasi', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Budget learning & development Rp 5 juta/tahun', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Flexible working hours', 4),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Employee Stock Option Plan (ESOP)', 5),
  -- Tokopedia JP2
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'BPJS Kesehatan dan Ketenagakerjaan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Remote work full / hybrid', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Budget learning & development', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'MacBook Pro untuk kerja', 4),
  -- Gojek JP3
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'BPJS Kesehatan dan Ketenagakerjaan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Asuransi jiwa dan kesehatan swasta', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Saldo GoPay bulanan', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Hybrid working arrangement', 4),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'Global work opportunities', 5),
  -- BCA JP5
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'BPJS + Asuransi kesehatan tambahan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Tunjangan hari raya (THR)', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Fasilitas perbankan berbunga rendah untuk karyawan', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005',  'Program pelatihan dan sertifikasi', 4),
  -- Ruangguru JP8
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'BPJS Kesehatan dan Ketenagakerjaan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Akses gratis ke seluruh kursus Ruangguru', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Remote-first culture', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'Budget laptop dan peralatan kerja', 4),
  -- Gojek JP9
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'BPJS Kesehatan dan Ketenagakerjaan', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Kompensasi kompetitif + equity', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Saldo GoPay bulanan', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Budget conference internasional', 4);

-- =================================================================
-- 17. JOB POST RESPONSIBILITIES
-- =================================================================
INSERT INTO job_post_responsibilities (id, job_post_id, responsibility, order_index) VALUES
  -- JP1: Senior Backend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001',  'Merancang dan mengembangkan REST API dan microservices yang skalabel', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001',  'Melakukan code review dan mentoring junior developer', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001',  'Berkolaborasi dengan tim frontend, product, dan QA dalam sprint delivery', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001',  'Mengoptimalkan query database dan performa aplikasi', 4),
  -- JP2: Frontend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002',  'Mengembangkan komponen UI yang reusable dan dapat diuji (unit tested)', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002',  'Mengintegrasikan REST API backend dengan tampilan frontend', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002',  'Memastikan responsivitas dan performa halaman web (Core Web Vitals)', 3),
  -- JP3: Data Engineer
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003',  'Membangun dan memelihara ETL/ELT pipeline data dalam skala besar', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003',  'Berkolaborasi dengan Data Scientist dan Analyst untuk memastikan kualitas data', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003',  'Merancang dan mengoptimalkan skema data warehouse', 3),
  -- JP9: DevOps
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009',  'Mengelola dan mengoptimalkan infrastruktur Kubernetes di Google Cloud', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009',  'Membangun dan memelihara CI/CD pipeline', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009',  'On-call rotation untuk incident response dan monitoring produksi', 3),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009',  'Meningkatkan reliability dan uptime platform (target SLA 99.9%+)', 4);

-- =================================================================
-- 18. JOB POST SKILLS
-- =================================================================
INSERT INTO job_post_skills (job_post_id, skill_id) VALUES
  -- JP1: Senior Backend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'cccccccc-cccc-cccc-cccc-000000000005'), -- Node.js
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'cccccccc-cccc-cccc-cccc-000000000008'), -- Go
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'cccccccc-cccc-cccc-cccc-000000000009'), -- PostgreSQL
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'cccccccc-cccc-cccc-cccc-000000000012'), -- Redis
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'cccccccc-cccc-cccc-cccc-000000000013'), -- Docker
  -- JP2: Frontend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'cccccccc-cccc-cccc-cccc-000000000001'), -- JavaScript
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'cccccccc-cccc-cccc-cccc-000000000002'), -- TypeScript
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'cccccccc-cccc-cccc-cccc-000000000003'), -- React
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'cccccccc-cccc-cccc-cccc-000000000025'); -- Next.js
  -- JP3: Data Engineer
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'cccccccc-cccc-cccc-cccc-000000000006'), -- Python
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'cccccccc-cccc-cccc-cccc-000000000022'), -- SQL
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'cccccccc-cccc-cccc-cccc-000000000017'), -- Google Cloud Platform
  -- JP5: Java Spring Boot
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005', 'cccccccc-cccc-cccc-cccc-000000000007'), -- Java
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005', 'cccccccc-cccc-cccc-cccc-000000000028'), -- Spring Boot
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005', 'cccccccc-cccc-cccc-cccc-000000000009'), -- PostgreSQL
  -- JP7: UI/UX
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'cccccccc-cccc-cccc-cccc-000000000018'), -- Figma
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'cccccccc-cccc-cccc-cccc-000000000019'), -- UI/UX Design
  -- JP8: Full Stack Ruangguru
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'cccccccc-cccc-cccc-cccc-000000000005'), -- Node.js
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'cccccccc-cccc-cccc-cccc-000000000003'), -- React
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'cccccccc-cccc-cccc-cccc-000000000009'), -- PostgreSQL
  -- JP9: DevOps
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'cccccccc-cccc-cccc-cccc-000000000013'), -- Docker
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'cccccccc-cccc-cccc-cccc-000000000014'), -- Kubernetes
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'cccccccc-cccc-cccc-cccc-000000000016'), -- AWS
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'cccccccc-cccc-cccc-cccc-000000000017'); -- Google Cloud Platform

-- =================================================================
-- 19. JOB POST TAGS
-- =================================================================
INSERT INTO job_post_tags (job_post_id, tag_id) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'eeeeeeee-eeee-eeee-eeee-000000000003'), -- Senior Level
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000003', 'eeeeeeee-eeee-eeee-eeee-000000000008'), -- Fast Growing
  (gen_random_uuid(), 'ddddddddxz -dddd-dddd-dddd-000000000004', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000004', 'eeeeeeee-eeee-eeee-eeee-000000000008'), -- Fast Growing
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000005', 'eeeeeeee-eeee-eeee-eeee-000000000010'), -- Corporate
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000006', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000006', 'eeeeeeee-eeee-eeee-eeee-000000000010'), -- Corporate
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'eeeeeeee-eeee-eeee-eeee-000000000006'), -- Hybrid
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000007', 'eeeeeeee-eeee-eeee-eeee-000000000003'), -- Senior Level
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'eeeeeeee-eeee-eeee-eeee-000000000007'), -- Work From Home
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000008', 'eeeeeeee-eeee-eeee-eeee-000000000002'), -- Startup
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'eeeeeeee-eeee-eeee-eeee-000000000003'), -- Senior Level
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'eeeeeeee-eeee-eeee-eeee-000000000005'), -- Tech
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'eeeeeeee-eeee-eeee-eeee-000000000004'), -- Fresh Graduate
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'eeeeeeee-eeee-eeee-eeee-000000000009'); -- Internship

-- =================================================================
-- 20. JOB POST QUESTIONS
--   question_type_id: 1=TEXT, 2=RATING, 3=MULTIPLE_CHOICE, 4=BOOLEAN 
-- =================================================================
INSERT INTO job_post_questions (id, job_post_id, question_text, question_type_id, options, is_required, order_index) VALUES
  -- JP1: Senior Backend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Berapa tahun pengalaman kamu dengan Node.js atau Go?',                     1, NULL,                                                                  true,  1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Apakah kamu berpengalaman dengan Kubernetes di lingkungan produksi?',       4, NULL,                                                                  true,  2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000001', 'Seberapa nyaman kamu bekerja dengan arsitektur microservices? (1-5)',        2, NULL,                                                                  false, 3),
  -- JP2: Frontend
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Selain CRA/Vite, framework React apa yang pernah kamu gunakan?',             3, '{"options": ["Next.js", "Remix", "Gatsby", "Lainnya"]}',               false, 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000002', 'Apakah kamu bisa mulai bekerja dalam waktu 2 minggu?',                       4, NULL,                                                                  true,  2),
  -- JP9: DevOps
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Cloud provider apa yang paling kamu kuasai?',                               3, '{"options": ["GCP", "AWS", "Azure", "Lebih dari satu"]}',              true,  1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000009', 'Berapa besar cluster Kubernetes yang pernah kamu kelola (node count)?',     1, NULL,                                                                  false, 2),
  -- JP10: Intern
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Ceritakan proyek atau tugas akhir yang sedang atau pernah kamu kerjakan.',   1, NULL,                                                                  true,  1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Apakah kamu bisa magang full-time (Senin–Jumat)?',                           4, NULL,                                                                  true,  2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-000000000010', 'Bahasa / teknologi apa yang paling kamu minati?',                            3, '{"options": ["JavaScript", "Python", "Java", "Kotlin", "Lainnya"]}',  false, 3);

-- =================================================================
-- 21. JOB APPLICATIONS
--   application_status_id: 1=APPLIED, 2=IN_REVIEW, 3=SHORTLISTED, 4=REJECTED, 5=HIRED
-- =================================================================
INSERT INTO job_applications (id, job_post_id, worker_id, resume_id, cover_letter, application_status_id) VALUES
  -- Budi → JP1 Senior Backend Tokopedia (SHORTLISTED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
    'ffffffff-ffff-ffff-ffff-000000000001',
    'Saya sangat tertarik dengan posisi Senior Backend Engineer di Tokopedia. Dengan pengalaman 5+ tahun di backend development menggunakan Node.js, Go, dan PostgreSQL serta pengalaman membangun microservices yang menangani jutaan transaksi, saya yakin dapat langsung berkontribusi bagi tim.',
    3
  ),
  -- Budi → JP3 Data Engineer Gojek (IN_REVIEW)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
    'ffffffff-ffff-ffff-ffff-000000000001',
    'Saya memiliki pengalaman kuat dalam membangun data pipeline skalabel dengan Node.js dan PostgreSQL. Saya tertarik untuk memperluas skill data engineering di Gojek.',
    2
  ),
  -- Siti → JP2 Frontend Tokopedia (APPLIED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    'ffffffff-ffff-ffff-ffff-000000000002',
    'Sebagai frontend developer dengan keahlian utama React dan TypeScript, saya sangat antusias dengan kesempatan ini di Tokopedia. Saya terbiasa membangun komponen performant menggunakan code splitting, lazy loading, dan optimasi render.',
    1
  ),
  -- Siti → JP8 Full Stack Ruangguru (HIRED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000008',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    'ffffffff-ffff-ffff-ffff-000000000002',
    'Saya tertarik bergabung dengan Ruangguru karena misi mereka dalam meningkatkan kualitas pendidikan Indonesia. Keahlian saya di React dan pengalaman mengintegrasikan berbagai API sangat relevan dengan kebutuhan tim.',
    5
  ),
  -- Ahmad → JP3 Data Engineer Gojek (SHORTLISTED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    'ffffffff-ffff-ffff-ffff-000000000003',
    'Dengan 6+ tahun pengalaman di data engineering dan data science, saya siap membawa nilai tambah bagi tim data Gojek. Saya berpengalaman membangun pipeline data yang memproses terabyte data menggunakan Python, Apache Spark, dan Google Cloud Platform.',
    3
  ),
  -- Dewi → JP7 UI/UX Tokopedia (IN_REVIEW)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000007',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    'ffffffff-ffff-ffff-ffff-000000000004',
    'Saya adalah UI/UX Designer dengan passion kuat terhadap desain yang berpusat pada pengguna. Portfolio saya mencakup redesign aplikasi mobile banking dengan peningkatan konversi 35% dan penurunan bounce rate 20%.',
    2
  ),
  -- Rizky → JP8 Full Stack Ruangguru (REJECTED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000008',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000005',
    'ffffffff-ffff-ffff-ffff-000000000005',
    'Saya sangat tertarik dengan posisi Full Stack Engineer di Ruangguru karena visi mereka yang sejalan dengan keinginan saya untuk berkontribusi pada dunia pendidikan Indonesia.',
    4
  ),
  -- Rizky → JP1 Senior Backend Tokopedia (APPLIED)
  (
    gen_random_uuid(),
    'dddddddd-dddd-dddd-dddd-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000005',
    'ffffffff-ffff-ffff-ffff-000000000005',
    'Sebagai full stack developer dengan keahlian Node.js dan PostgreSQL, saya memiliki fondasi backend yang kuat dan siap berkontribusi lebih jauh di Tokopedia.',
    1
  );

-- =================================================================
-- 22. JOB APPLICATION ANSWERS
-- =================================================================
INSERT INTO job_post_answers (job_application_id, question_id, answer) VALUES
  -- Budi's answers to JP1
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000001', 'gggggggg-gggg-gggg-gggg-000000000001', '"5 tahun, menggunakan Node.js secara profesional sejak 2019 dan Go sejak 2021."'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000001', 'gggggggg-gggg-gggg-gggg-000000000002', 'true'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000001', 'gggggggg-gggg-gggg-gggg-000000000003', '4'),
  -- Rizky's answers to JP1
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000008', 'gggggggg-gggg-gggg-gggg-000000000001', '"4 tahun menggunakan Node.js untuk backend services dan API development."'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000008', 'gggggggg-gggg-gggg-gggg-000000000002', 'false'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000008', 'gggggggg-gggg-gggg-gggg-000000000003', '3'),
  -- Siti's answers to JP2
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000003', 'gggggggg-gggg-gggg-gggg-000000000004', '"Next.js"'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-000000000003', 'gggggggg-gggg-gggg-gggg-000000000005', 'true');

-- =================================================================
-- 23. SAVED JOBS
-- =================================================================
INSERT INTO saved_jobs (job_post_id, worker_id) VALUES
  ('dddddddd-dddd-dddd-dddd-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002'), -- Siti saves JP1
  ('dddddddd-dddd-dddd-dddd-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'), -- Dewi saves JP2
  ('dddddddd-dddd-dddd-dddd-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'), -- Budi saves JP3
  ('dddddddd-dddd-dddd-dddd-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'), -- Rizky saves JP5
  ('dddddddd-dddd-dddd-dddd-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'), -- Rizky saves JP7
  ('dddddddd-dddd-dddd-dddd-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'), -- Budi saves JP9
  ('dddddddd-dddd-dddd-dddd-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'), -- Ahmad saves JP9
  ('dddddddd-dddd-dddd-dddd-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'); -- Dewi saves JP10

COMMIT;
