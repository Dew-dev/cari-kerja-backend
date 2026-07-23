-- ============================================================
-- Seed news categories (job-industry related) + initial articles
-- Requires: 027_add_news.sql and at least one admin/super_admin user
-- Articles are original editorial summaries with public source links
-- ============================================================

-- Categories
INSERT INTO news_categories (id, name, slug, created_at, updated_at)
VALUES
  ('a1000001-0001-4000-8000-000000000001', 'Tips Karir', 'tips-karir', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000002', 'Tips Interview', 'tips-interview', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000003', 'CV & Resume', 'cv-dan-resume', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000004', 'Tren Industri', 'tren-industri', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000005', 'Gaji & Kompensasi', 'gaji-dan-kompensasi', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000006', 'Remote & Hybrid', 'remote-dan-hybrid', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000007', 'Teknologi & Digital', 'teknologi-dan-digital', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000008', 'Rekrutmen BUMN', 'rekrutmen-bumn', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000009', 'Fresh Graduate', 'fresh-graduate', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000010', 'Soft Skill', 'soft-skill', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000011', 'HR & Leadership', 'hr-dan-leadership', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000012', 'Kewirausahaan', 'kewirausahaan', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000013', 'Kesehatan Kerja', 'kesehatan-kerja', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000014', 'Industri Keuangan', 'industri-keuangan', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000015', 'Industri Manufaktur', 'industri-manufaktur', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000016', 'Industri Kesehatan', 'industri-kesehatan', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000017', 'Industri Pendidikan', 'industri-pendidikan', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000018', 'Green Jobs', 'green-jobs', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000019', 'Magang & Trainee', 'magang-dan-trainee', NOW(), NOW()),
  ('a1000001-0001-4000-8000-000000000020', 'Peluang Global', 'peluang-global', NOW(), NOW())
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Prefer seed superadmin; fallback to any role 3/4 user
WITH author AS (
  SELECT id
  FROM users
  WHERE deleted_at IS NULL
    AND role_id IN (3, 4)
  ORDER BY CASE WHEN username = 'superadmin' THEN 0 ELSE 1 END, created_at ASC
  LIMIT 1
)
INSERT INTO news (
  id, category_id, title, slug, excerpt, body, cover_url,
  status, is_featured, meta_title, meta_description,
  author_user_id, published_at, created_at, updated_at
)
SELECT
  v.id,
  v.category_id,
  v.title,
  v.slug,
  v.excerpt,
  v.body,
  c.cover_url,
  'published',
  v.is_featured,
  v.meta_title,
  v.meta_description,
  author.id,
  NOW() - (v.days_ago || ' days')::interval,
  NOW() - (v.days_ago || ' days')::interval,
  NOW()
FROM author
CROSS JOIN (
  VALUES
  (
    'b2000001-0001-4000-8000-000000000001'::uuid,
    'a1000001-0001-4000-8000-000000000005'::uuid,
    'Proyeksi Kenaikan Gaji Indonesia 2026: 5,8 Persen menurut Mercer',
    'proyeksi-kenaikan-gaji-indonesia-2026-mercer',
    'Survei Mercer memproyeksikan rata-rata kenaikan gaji karyawan di Indonesia sekitar 5,8 persen pada 2026, dengan pay equity dan total rewards jadi fokus daya saing.',
    $html$
<p>Menurut laporan Total Remuneration Survey (TRS) Mercer Indonesia, rata-rata kenaikan gaji pada 2026 diproyeksikan sekitar <strong>5,8 persen</strong>. Angka ini sedikit lebih rendah dibanding proyeksi tahun sebelumnya, namun hampir seluruh perusahaan yang disurvei tetap berencana menaikkan gaji.</p>
<p>Faktor utama yang memengaruhi kenaikan meliputi kinerja individu, rentang gaji (salary range), dan kinerja perusahaan. Industri kimia termasuk yang paling optimis, sementara beberapa sektor seperti otomotif cenderung lebih moderat.</p>
<p>Temuan lain: banyak perusahaan meninjau ulang kebijakan remote/hybrid demi kolaborasi dan budaya kerja, serta menyesuaikan benefit era WFH (misalnya bantuan internet) ke benefit lain seperti transportasi.</p>
<p><em>Ringkasan editorial berdasarkan laporan yang dikutip media.</em><br/>
Sumber: <a href="https://money.kompas.com/read/2025/12/23/060000426/survei--2026-rata-rata-gaji-karyawan-indonesia-bakal-naik-5-8-persen" target="_blank" rel="noopener noreferrer">Kompas Money</a>,
<a href="https://biz.kompas.com/read/2025/12/23/080000528/mercer-indonesia-proyeksikan-kenaikan-gaji-2026-capai-5-8-persen-pay-equity-dan" target="_blank" rel="noopener noreferrer">Kompas Biz</a></p>
$html$,
    true,
    'Kenaikan Gaji Indonesia 2026 | Mercer TRS',
    'Ringkasan proyeksi kenaikan gaji 5,8% di Indonesia tahun 2026 menurut survei Mercer.',
    2
  ),
  (
    'b2000001-0001-4000-8000-000000000002'::uuid,
    'a1000001-0001-4000-8000-000000000003'::uuid,
    '5 Tips Resume Lamaran Kerja di Era AI agar Lolos ATS',
    '5-tips-resume-lamaran-kerja-era-ai-lolos-ats',
    'Mayoritas perekrut memakai ATS. Mulai resume dari keterampilan inti, tunjukkan dampak terukur, dan prioritaskan pengalaman 7–10 tahun terakhir.',
    $html$
<p>Di era AI dan otomatisasi rekrutmen, resume tidak lagi sekadar daftar riwayat kerja. Sekitar <strong>76% perekrut</strong> dilaporkan memakai Applicant Tracking System (ATS) untuk menyaring kandidat berdasarkan keterampilan.</p>
<ol>
<li><strong>Tinjau keterampilan, bukan hanya jabatan</strong> — cantumkan 6–8 skill inti (teknis + soft skill) di bagian atas.</li>
<li><strong>Ceritakan dampak dengan angka</strong> — setiap poin sebaiknya menjawab “apa hasilnya bagi perusahaan”.</li>
<li><strong>Ganti poin yang tidak relevan</strong> — prioritaskan 7–10 tahun terakhir; pengalaman lebih lama diringkas.</li>
<li><strong>Hindari klise tanpa konteks</strong> — misalnya “komunikator yang baik” harus disertai contoh konkret.</li>
<li><strong>Selaraskan dengan job description</strong> — kata kunci di lowongan membantu lolos filter ATS.</li>
</ol>
<p><em>Ringkasan editorial untuk pembaca Cari Kerja.</em><br/>
Sumber: <a href="https://lestari.kompas.com/read/2026/03/09/112726886/5-tips-membuat-resume-lamaran-kerja-pada-era-ai" target="_blank" rel="noopener noreferrer">Kompas Lestari</a></p>
$html$,
    true,
    'Tips Resume Era AI & ATS',
    'Lima tips membuat resume yang lolos ATS di era AI.',
    5
  ),
  (
    'b2000001-0001-4000-8000-000000000003'::uuid,
    'a1000001-0001-4000-8000-000000000007'::uuid,
    'Berapa Gaji Software Engineer dan Programmer di Indonesia 2026?',
    'gaji-software-engineer-programmer-indonesia-2026',
    'Estimasi kisaran gaji junior hingga senior untuk programmer dan software engineer di pasar Indonesia 2026, plus faktor yang menaikkan tawaran.',
    $html$
<p>Profesi teknologi tetap menarik karena peluang luas, opsi remote, dan rentang kompensasi yang kompetitif. Estimasi pasar Indonesia sekitar 2026 (bersifat indikatif, bervariasi per kota/perusahaan):</p>
<ul>
<li><strong>Junior (0–2 tahun)</strong> — Programmer ± Rp5–9 juta; Software Engineer ± Rp7–12 juta.</li>
<li><strong>Mid (3–5 tahun)</strong> — Programmer ± Rp10–18 juta; Software Engineer ± Rp12–25 juta.</li>
<li><strong>Senior (5+ tahun)</strong> — Programmer ± Rp20–30 juta; Software Engineer ± Rp30–50 juta+.</li>
</ul>
<p>Selain coding, pembeda gaji sering datang dari pemahaman business logic, kualitas arsitektur, dan kemampuan komunikasi teknis ke stakeholder non-teknis. Peluang global (regional/internasional) bisa menaikkan kompensasi secara signifikan.</p>
<p><em>Ringkasan editorial; angka adalah estimasi pasar yang dikutip media.</em><br/>
Sumber: <a href="https://buku.kompas.com/read/6051/berapa-gaji-software-engineer-dan-programmer-2026" target="_blank" rel="noopener noreferrer">Kompas Buku</a></p>
$html$,
    true,
    'Gaji Software Engineer & Programmer 2026',
    'Kisaran gaji programmer dan software engineer di Indonesia 2026.',
    8
  ),
  (
    'b2000001-0001-4000-8000-000000000004'::uuid,
    'a1000001-0001-4000-8000-000000000006'::uuid,
    '20 Pekerjaan Remote yang Paling Dicari: Tren Kerja Jarak Jauh',
    '20-pekerjaan-remote-paling-dicari-tren-kerja-jarak-jauh',
    'Permintaan remote work tetap kuat. Engineering, business development, data entry, hingga customer service masuk daftar bidang paling dibutuhkan.',
    $html$
<p>Kerja jarak jauh tetap populer pasca-pandemi. Survei internasional (FlexJobs) menunjukkan fleksibilitas remote menjadi faktor penting bagi banyak profesional, dengan pertumbuhan lowongan remote yang signifikan dari tahun ke tahun.</p>
<p>Beberapa bidang dengan pertumbuhan permintaan remote yang tinggi mencakup: engineering, pengembangan bisnis, entri data, komunikasi, layanan klien, sales, product, hingga peran administratif dan kreatif.</p>
<p>Bagi pencari kerja di Indonesia, tren ini berarti peluang untuk mencari peran hybrid/remote—sambil tetap memperhatikan bahwa sebagian perusahaan mulai menyeimbangkan kembali kebutuhan kolaborasi on-site.</p>
<p><em>Ringkasan editorial berdasarkan laporan yang dikutip Kompas.</em><br/>
Sumber: <a href="https://money.kompas.com/read/2025/08/26/110800126/20-pekerjaan-remote-paling-dicari-tahun-2025-tren-kerja-jarak-jauh-makin" target="_blank" rel="noopener noreferrer">Kompas Money</a></p>
$html$,
    false,
    'Pekerjaan Remote Paling Dicari',
    'Daftar bidang remote work yang banyak dicari dan tren fleksibilitas kerja.',
    12
  ),
  (
    'b2000001-0001-4000-8000-000000000005'::uuid,
    'a1000001-0001-4000-8000-000000000001'::uuid,
    'Cara Cari Kerja 2026: Platform, CV ATS, dan Strategi Interview',
    'cara-cari-kerja-2026-platform-cv-ats-interview',
    'Platform kerja makin AI-driven. Optimalkan JobStreet, Glints, LinkedIn, siapkan CV ATS-friendly, dan bedakan strategi interview HR vs user.',
    $html$
<p>Pencarian kerja 2026 semakin bergantung pada kecocokan algoritma dan jejaring profesional:</p>
<ul>
<li><strong>JobStreet</strong> — volume lowongan besar; lengkapi profil dan manfaatkan filter gaji.</li>
<li><strong>Glints</strong> — kuat di startup/tech, sering lebih transparan soal kompensasi.</li>
<li><strong>LinkedIn</strong> — optimasi headline, Open to Work, dan aktivitas konten agar ditemukan headhunter.</li>
</ul>
<p>Bedakan interview HR (kultur, motivasi, kelemahan) dengan interview user (STAR method, tools, problem solving). Siapkan jawaban berbasis contoh nyata dan hasil terukur.</p>
<p><em>Ringkasan editorial tips karir.</em><br/>
Sumber: <a href="https://baihaqyizy.com/cara-cari-kerja-2026-platform-cv-tips/" target="_blank" rel="noopener noreferrer">Baihaqyizy</a></p>
$html$,
    true,
    'Cara Cari Kerja 2026',
    'Panduan platform kerja, CV ATS, dan tips interview untuk 2026.',
    3
  ),
  (
    'b2000001-0001-4000-8000-000000000006'::uuid,
    'a1000001-0001-4000-8000-000000000008'::uuid,
    'Rekrutmen Bersama BUMN (RBB) 2026: Jadwal, Syarat, dan Tips Lolos',
    'rekrutmen-bersama-bumn-rbb-2026-jadwal-tips',
    'Pantau portal FHCI untuk batch RBB. Siapkan dokumen, latihan TKD/AKHLAK, dan strategi wawancara STAR.',
    $html$
<p>Rekrutmen Bersama BUMN (RBB) yang dikelola FHCI menjadi jalur masuk ke banyak BUMN (energi, perbankan, telekomunikasi, dan lainnya). Pola tahun-tahun sebelumnya biasanya membuka pengumuman awal tahun lalu dilanjutkan pendaftaran online dan rangkaian tes.</p>
<p>Persiapan yang sering direkomendasikan:</p>
<ol>
<li>Pantau situs resmi <a href="https://rekrutmenbersama.fhcibumn.id" target="_blank" rel="noopener noreferrer">rekrutmenbersama.fhcibumn.id</a>.</li>
<li>Siapkan CV ATS-friendly dan dokumen (KTP, ijazah, transkrip).</li>
<li>Latihan TKD (verbal, numerik, logika) dan pemahaman Core Values AKHLAK.</li>
<li>Wawancara dengan metode STAR dan riset visi BUMN target.</li>
</ol>
<p><em>Informasi jadwal bersifat estimasi pola historis; selalu cek pengumuman resmi.</em><br/>
Sumber: <a href="https://kiakrikil.com/loker-rekrutmen-bersama-bumn-rbb-2026/" target="_blank" rel="noopener noreferrer">Kiakrikil</a></p>
$html$,
    true,
    'RBB BUMN 2026: Tips & Jadwal',
    'Panduan Rekrutmen Bersama BUMN 2026: portal resmi, seleksi, dan tips lolos.',
    4
  ),
  (
    'b2000001-0001-4000-8000-000000000007'::uuid,
    'a1000001-0001-4000-8000-000000000002'::uuid,
    'Tips Ampuh Melamar Kerja: Jaringan, Multi-Platform, dan Job Fair',
    'tips-ampuh-melamar-kerja-jaringan-multi-platform-job-fair',
    'Banyak lowongan tidak diumumkan publik. Perluas jaringan, apply di banyak platform, dan manfaatkan job fair serta walk-in interview.',
    $html$
<p>Melamar kerja tidak cukup mengandalkan CV menarik saja. Sebagian peluang hanya beredar lewat rekomendasi internal atau jaringan profesional.</p>
<p>Praktik yang membantu di 2026:</p>
<ul>
<li>Perkuat jejaring (LinkedIn, komunitas industri, alumni).</li>
<li>Jangan bergantung satu portal — kombinasikan JobStreet, Kalibrr, LinkedIn Jobs, dan kanal perusahaan.</li>
<li>Hadiri job fair / walk-in untuk bertemu HRD langsung dan memahami budaya perusahaan.</li>
<li>Riset reputasi dan jalur karier sebelum menerima tawaran.</li>
</ul>
<p><em>Ringkasan editorial tips melamar kerja.</em><br/>
Sumber referensi industri: artikel karir perusahaan (contoh praktik di portal karier Astra/SERA dan platform lowongan umum).</p>
$html$,
    false,
    'Tips Melamar Kerja Efektif',
    'Strategi melamar kerja lewat jaringan, multi-platform, dan job fair.',
    10
  ),
  (
    'b2000001-0001-4000-8000-000000000008'::uuid,
    'a1000001-0001-4000-8000-000000000010'::uuid,
    'Soft Skill yang Dicari Perekrut: Komunikasi, Adaptasi, dan Problem Solving',
    'soft-skill-dicari-perekrut-komunikasi-adaptasi-problem-solving',
    'Selain hard skill, perekrut menilai kemampuan kolaborasi, komunikasi lintas fungsi, dan penyelesaian masalah berbasis contoh nyata.',
    $html$
<p>Di pasar kerja yang cepat berubah, soft skill sering jadi pembeda kandidat dengan hard skill setara.</p>
<p>Tiga area yang kerap muncul di deskripsi lowongan dan wawancara:</p>
<ul>
<li><strong>Komunikasi</strong> — menyampaikan ide ke tim teknis maupun non-teknis.</li>
<li><strong>Adaptasi</strong> — belajar tools baru dan menyesuaikan cara kerja hybrid/remote.</li>
<li><strong>Problem solving</strong> — menjelaskan situasi, tindakan, dan hasil (STAR).</li>
</ul>
<p>Cantumkan soft skill di CV bersama bukti singkat (proyek, angka, atau tanggung jawab), bukan sekadar daftar kata sifat.</p>
<p><em>Artikel editorial Cari Kerja untuk melengkapi konten tips karir.</em></p>
$html$,
    false,
    'Soft Skill untuk Lolos Seleksi',
    'Soft skill yang paling sering dicari perekrut dan cara menunjukkannya di CV.',
    15
  ),
  (
    'b2000001-0001-4000-8000-000000000009'::uuid,
    'a1000001-0001-4000-8000-000000000009'::uuid,
    'Fresh Graduate 2026: Cara Membangun Portofolio sebelum Pengalaman Kerja',
    'fresh-graduate-2026-portofolio-sebelum-pengalaman-kerja',
    'Tanpa pengalaman formal, portofolio proyek, magang, dan kontribusi komunitas tetap bisa meyakinkan perekrut.',
    $html$
<p>Fresh graduate sering khawatir belum punya “pengalaman kerja”. Perekrut tetap menghargai bukti kemampuan:</p>
<ul>
<li>Proyek kuliah / bootcamp yang selesai dan bisa didemo.</li>
<li>Magang, freelance kecil, atau volunteer dengan tanggung jawab jelas.</li>
<li>Sertifikasi relevan (jangan berlebihan; pilih yang terkait peran target).</li>
<li>Ringkas pencapaian dengan metrik sederhana (waktu, jumlah, kualitas).</li>
</ul>
<p>Gabungkan dengan CV ATS-friendly dan profil LinkedIn yang konsisten agar mudah ditemukan.</p>
<p><em>Artikel editorial Cari Kerja untuk fresh graduate.</em></p>
$html$,
    false,
    'Tips Fresh Graduate 2026',
    'Cara fresh graduate membangun portofolio dan daya saing sebelum pengalaman formal.',
    18
  ),
  (
    'b2000001-0001-4000-8000-000000000010'::uuid,
    'a1000001-0001-4000-8000-000000000004'::uuid,
    'Tren Industri Kerja: AI, Pay Equity, dan Penyesuaian Model Hybrid',
    'tren-industri-kerja-ai-pay-equity-hybrid',
    'Perusahaan menyeimbangkan daya saing gaji, keadilan kompensasi, dan kebutuhan kolaborasi on-site setelah era WFH panjang.',
    $html$
<p>Beberapa tren yang muncul di diskusi industri dan survei remunerasi:</p>
<ul>
<li><strong>AI di rekrutmen & produktivitas</strong> — ATS dan tools AI mempercepat screening, sehingga kandidat perlu lebih strategis di CV dan skill.</li>
<li><strong>Pay equity</strong> — audit kesetaraan gaji makin penting untuk retensi dan employer branding.</li>
<li><strong>Hybrid yang lebih terukur</strong> — banyak organisasi meninjau ulang remote murni demi onboarding dan kolaborasi, tanpa menghilangkan fleksibilitas sepenuhnya.</li>
<li><strong>Total rewards</strong> — di luar gaji pokok, kesehatan mental, financial wellness, dan jalur karier jadi diferensiator.</li>
</ul>
<p><em>Ringkasan tren berdasarkan isu yang banyak diliput media bisnis/HR Indonesia.</em><br/>
Sumber terkait: liputan Mercer/TRS di <a href="https://biz.kompas.com/read/2025/12/23/080000528/mercer-indonesia-proyeksikan-kenaikan-gaji-2026-capai-5-8-persen-pay-equity-dan" target="_blank" rel="noopener noreferrer">Kompas Biz</a></p>
$html$,
    false,
    'Tren Industri Kerja & HR',
    'AI, pay equity, dan penyesuaian hybrid sebagai tren industri kerja.',
    20
  ),
  (
    'b2000001-0001-4000-8000-000000000011'::uuid,
    'a1000001-0001-4000-8000-000000000018'::uuid,
    'Green Jobs 2026: Transisi Energi Buka Jutaan Peluang Karier Baru',
    'green-jobs-2026-transisi-energi-peluang-karier',
    'Transisi energi rendah karbon diproyeksikan menciptakan jutaan green jobs. Profesi seperti energy auditor, carbon analyst, dan ESG specialist makin dicari.',
    $html$
<p>Direktur Utama PT PLN Energy Management Indonesia (EMI) menyebutkan potensi sekitar <strong>16,6 juta</strong> lowongan pekerjaan hijau di tingkat global pada 2026 seiring transisi energi menuju ekonomi rendah karbon.</p>
<p>Profesi yang diperkirakan semakin dibutuhkan antara lain:</p>
<ul>
<li>Energy Auditor</li>
<li>Carbon Analyst &amp; ESG Specialist</li>
<li>Renewable Energy Engineer</li>
<li>REC / Carbon Market Trader</li>
<li>Sustainability Consultant</li>
<li>Green Data Center Engineer</li>
</ul>
<p>Bagi pencari kerja, sertifikasi terkait (misalnya auditor energi), pemahaman standar seperti GHG Protocol / ISO 50001 / GRI, serta magang di sektor energi bersih bisa jadi diferensiator.</p>
<p><em>Ringkasan editorial berdasarkan liputan industri energi.</em><br/>
Sumber: <a href="https://listrikindonesia.com/detail/20461/transisi-energi-buka-16-juta-lowongan-pekerjaan-ini-profesi-yang-paling-dicari" target="_blank" rel="noopener noreferrer">Listrik Indonesia</a></p>
$html$,
    true,
    'Green Jobs & Transisi Energi 2026',
    'Peluang green jobs dari transisi energi: auditor energi, ESG, hingga renewable engineer.',
    1
  ),
  (
    'b2000001-0001-4000-8000-000000000012'::uuid,
    'a1000001-0001-4000-8000-000000000019'::uuid,
    'Magang Nasional 2026: Pertamina & BRIN Buka Kesempatan Fresh Graduate',
    'magang-nasional-2026-pertamina-brin-fresh-graduate',
    'Program Magang Nasional via Magang Hub / SIAPkerja memberi jalur pengalaman berinsentif di Pertamina, BRIN, dan mitra lainnya.',
    $html$
<p>Program Magang Nasional (PMN) 2026 kembali membuka kesempatan bagi lulusan baru untuk magang berinsentif di perusahaan dan lembaga strategis, termasuk <strong>Pertamina</strong> dan <strong>BRIN</strong>.</p>
<p>Pola pendaftaran yang umum:</p>
<ol>
<li>Buat/lengkapi akun di platform <strong>SIAPkerja</strong>.</li>
<li>Lamar posisi melalui <strong>Magang Hub</strong> sesuai formasi yang dibuka.</li>
<li>Siapkan dokumen (ijazah, KTP, CV) dan pastikan masa kelulusan sesuai syarat batch.</li>
</ol>
<p>Manfaat yang sering ditawarkan: uang saku (setara UMK pada beberapa program), jaminan sosial, mentor, hingga sertifikasi kompetensi. Selalu cek pengumuman resmi untuk jadwal dan kuota terkini.</p>
<p><em>Ringkasan editorial peluang magang; verifikasi detail di kanal resmi Kemnaker/Magang Hub.</em><br/>
Sumber: <a href="https://www.tribunnews.com/nasional/7856193/pertamina-buka-magang-nasional-2026-untuk-fresh-graduate-cek-syarat-dan-cara-daftarnya" target="_blank" rel="noopener noreferrer">Tribunnews</a>,
<a href="https://www.medcom.id/pendidikan/jobseeker/ob3yLVXK-brin-buka-magang-nasional-kemnaker-2026-untuk-fresh-graduate-d4-s1-cek-formasi-dan-cara-daftarnya" target="_blank" rel="noopener noreferrer">Medcom</a></p>
$html$,
    true,
    'Magang Nasional 2026 Pertamina & BRIN',
    'Panduan singkat Magang Nasional 2026: SIAPkerja, Magang Hub, Pertamina, dan BRIN.',
    0
  ),
  (
    'b2000001-0001-4000-8000-000000000013'::uuid,
    'a1000001-0001-4000-8000-000000000007'::uuid,
    'Jalur Karier Talenta AI: Kemkomdigi & BP BUMN Siapkan Talent Pool',
    'jalur-karier-talenta-ai-kemkomdigi-bp-bumn',
    'AI Talent Factory diintegrasikan dengan talent pool BUMN agar lulusan pelatihan AI bisa langsung terserap ke proyek transformasi digital.',
    $html$
<p>Kemkomdigi bersama Badan Pengelola BUMN merancang jalur karier talenta AI dengan mengintegrasikan <strong>AI Talent Factory</strong> dan talent pool BUMN.</p>
<p>Model ini bertujuan agar pelatihan AI (LLM, perancangan model, problem solving industri) tidak berhenti di kelas, melainkan berlanjut ke proyek nyata di BUMN sesuai kebutuhan sektor.</p>
<p>Bagi pencari kerja di bidang teknologi: sertifikasi/program talenta AI, portofolio proyek, dan kemampuan menerapkan AI ke use-case bisnis menjadi bekal penting selain skill coding dasar.</p>
<p><em>Ringkasan editorial peluang karier AI nasional.</em><br/>
Sumber: <a href="https://umum.energika.id/detail/54090/kemkomdigi-bp-bumn-siapkan-jalur-karier-talenta-ai-indonesia" target="_blank" rel="noopener noreferrer">Energika</a></p>
$html$,
    false,
    'Karier Talenta AI Indonesia',
    'Kolaborasi Kemkomdigi–BP BUMN untuk jalur karier dan penyerapan talenta AI.',
    6
  ),
  (
    'b2000001-0001-4000-8000-000000000014'::uuid,
    'a1000001-0001-4000-8000-000000000009'::uuid,
    'Fresh Graduate di LinkedIn: Posisi Entry-Level yang Paling Banyak Dibuka',
    'fresh-graduate-linkedin-posisi-entry-level-banyak-dibuka',
    'Admin, customer service, sales, IT support, dan digital marketing mendominasi lowongan entry-level untuk lulusan baru di LinkedIn Indonesia.',
    $html$
<p>Berdasarkan tren lowongan LinkedIn Jobs Indonesia, posisi entry-level yang sering dibuka untuk fresh graduate mencakup:</p>
<ul>
<li><strong>Administrasi</strong> — operasional harian; cocok manajemen/administrasi/akutansi.</li>
<li><strong>Customer service</strong> — banyak di e-commerce &amp; startup; soft skill krusial.</li>
<li><strong>Sales / sales associate</strong> — target-oriented dengan komisi.</li>
<li><strong>IT support</strong> — permintaan digitalisasi terus tumbuh.</li>
<li><strong>Digital marketing / content</strong> — ekspansi brand di kanal digital.</li>
</ul>
<p>Tips: lengkapi profil LinkedIn (foto, headline, About), aktifkan Open to Work, dan sesuaikan kata kunci CV dengan deskripsi lowongan.</p>
<p><em>Ringkasan editorial berdasarkan analisis lowongan entry-level.</em><br/>
Sumber: <a href="https://kiakrikil.com/fresh-graduate-posisi-paling-banyak-dibuka-linkedin/" target="_blank" rel="noopener noreferrer">Kiakrikil</a></p>
$html$,
    false,
    'Posisi Fresh Graduate di LinkedIn',
    'Daftar posisi entry-level yang banyak dibuka untuk fresh graduate di LinkedIn.',
    7
  ),
  (
    'b2000001-0001-4000-8000-000000000015'::uuid,
    'a1000001-0001-4000-8000-000000000014'::uuid,
    'Industri Keuangan & Karier: Perbankan Tumbuh, Talenta Digital Makin Dibutuhkan',
    'industri-keuangan-karier-perbankan-talenta-digital',
    'Pertumbuhan kredit dan digitalisasi layanan keuangan mendorong kebutuhan talenta di risk, compliance, data, dan product digital banking.',
    $html$
<p>Sektor keuangan tetap menjadi penyerap tenaga kerja penting. Pertumbuhan kredit perbankan dan ekspansi layanan digital mendorong kebutuhan peran di luar teller tradisional:</p>
<ul>
<li>Analis risiko &amp; compliance</li>
<li>Data analyst / data engineer untuk scoring dan fraud</li>
<li>Product &amp; UX untuk mobile banking</li>
<li>Relationship manager untuk segmen retail/korporasi</li>
</ul>
<p>Bagi kandidat non-keuangan, literasi regulasi dasar, sertifikasi relevan, dan kemampuan data/tools sering membuka pintu masuk lebih cepat.</p>
<p><em>Artikel editorial Cari Kerja; konteks industri mengacu liputan ekbis terkini.</em><br/>
Contoh konteks: liputan pertumbuhan kredit perbankan di <a href="https://money.kompas.com/read/2026/07/23/125119926/kredit-perbankan-tumbuh-121-persen-pada-juni-2026-korporasi-jadi-penopang" target="_blank" rel="noopener noreferrer">Kompas Money</a></p>
$html$,
    false,
    'Karier di Industri Keuangan',
    'Peluang karier di perbankan dan keuangan digital: risk, data, product, dan RM.',
    9
  )
) AS v(id, category_id, title, slug, excerpt, body, is_featured, meta_title, meta_description, days_ago)
INNER JOIN (
  VALUES
    ('b2000001-0001-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000006'::uuid, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000007'::uuid, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000008'::uuid, 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000009'::uuid, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000010'::uuid, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000011'::uuid, 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000012'::uuid, 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000013'::uuid, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000014'::uuid, 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000015'::uuid, 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80')
) AS c(id, cover_url) ON c.id = v.id
WHERE EXISTS (SELECT 1 FROM author)
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Idempotent cover backfill (for DBs that already ran the seed without images)
UPDATE news AS n
SET cover_url = c.cover_url,
    updated_at = NOW()
FROM (
  VALUES
    ('b2000001-0001-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000006'::uuid, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000007'::uuid, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000008'::uuid, 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000009'::uuid, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000010'::uuid, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000011'::uuid, 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000012'::uuid, 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000013'::uuid, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000014'::uuid, 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?auto=format&fit=crop&w=1200&q=80'),
    ('b2000001-0001-4000-8000-000000000015'::uuid, 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80')
) AS c(id, cover_url)
WHERE n.id = c.id
  AND n.deleted_at IS NULL
  AND (n.cover_url IS NULL OR n.cover_url = '');
