#!/usr/bin/env node
/**
 * Seed / refresh worker & recruiter dummy data.
 *
 * What it does:
 *  1. Deletes ALL existing worker (role_id=1) and recruiter (role_id=2) users.
 *     Cascades remove workers/recruiters and related rows (applications, job posts, etc.).
 *     Admin / super_admin / moderator accounts are preserved.
 *  2. Inserts professional dummy workers (real portrait URLs) + profile children.
 *  3. Inserts professional dummy recruiters for the approved company domain list,
 *     with Clearbit logos: https://logo.clearbit.com/{domain}
 *
 * Prerequisites:
 *  - POSTGRESQL_URL set in .env
 *  - ENCRYPTION_KEY matches the running API (sensitive columns are encrypted)
 *  - Base schema + lookups (roles, industries, genders, currencies, skills, …) exist
 *
 * Usage:
 *   node scripts/seed_workers_recruiters.js
 *   npm run seed:workers-recruiters
 *
 * Default login password for all seeded accounts: Password123!
 */

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { encrypt } = require("../src/helpers/utils/crypto_helper");

const PASSWORD_PLAIN = "Password123!";
const WORKER_ROLE_ID = 1;
const RECRUITER_ROLE_ID = 2;

const COMPANY_DOMAINS = [
  {
    domain: "egiresources.com",
    company_name: "EGI Resources",
    industry: "Environmental & Energy",
    employee_count: "51-200",
    description:
      "EGI Resources menyediakan solusi energi dan sumber daya berkelanjutan untuk klien korporat di Asia Tenggara, dengan fokus pada efisiensi operasional dan kepatuhan lingkungan.",
    address: "Jl. TB Simatupang Kav. 88, Jakarta Selatan 12560",
    contact_phone: "+62-21-5098-1101",
  },
  {
    domain: "agat-netcentric.com",
    company_name: "AGAT Netcentric",
    industry: "Information Technology",
    employee_count: "11-50",
    description:
      "AGAT Netcentric adalah konsultan teknologi yang membantu perusahaan membangun arsitektur cloud-native, integrasi sistem, dan keamanan jaringan enterprise.",
    address: "Jl. Gatot Subroto No. 42, Jakarta Selatan 12950",
    contact_phone: "+62-21-5098-2202",
  },
  {
    domain: "nexinotechsolutions.com",
    company_name: "Nexino Tech Solutions",
    industry: "Information Technology",
    employee_count: "51-200",
    description:
      "Nexino Tech Solutions menghadirkan produk SaaS dan layanan custom software development untuk fintech, logistik, dan retail digital.",
    address: "SCBD Lot 28, Jl. Jend. Sudirman, Jakarta Selatan 12190",
    contact_phone: "+62-21-5098-3303",
  },
  {
    domain: "mecca-hotel.com",
    company_name: "Mecca Hotel",
    industry: "Tourism & Hospitality",
    employee_count: "201-500",
    description:
      "Mecca Hotel adalah jaringan perhotelan premium yang menekankan layanan tamu kelas dunia, F&B signature, dan pengalaman menginap berbasis budaya lokal.",
    address: "Jl. Asia Afrika No. 8, Bandung 40111",
    contact_phone: "+62-22-4201-4404",
  },
  {
    domain: "hadith-hotel.com",
    company_name: "Hadith Hotel",
    industry: "Tourism & Hospitality",
    employee_count: "51-200",
    description:
      "Hadith Hotel menggabungkan desain kontemporer dengan keramahtamahan Indonesia untuk wisatawan bisnis maupun leisure di destinasi utama Nusantara.",
    address: "Jl. Merdeka No. 17, Yogyakarta 55211",
    contact_phone: "+62-274-5601-5505",
  },
  {
    domain: "hotel-kampoengindonesia.com",
    company_name: "Hotel Kampoeng Indonesia",
    industry: "Tourism & Hospitality",
    employee_count: "51-200",
    description:
      "Hotel Kampoeng Indonesia menawarkan konsep resort budaya dengan akomodasi, kuliner nusantara, dan aktivitas pengalaman lokal yang autentik.",
    address: "Jl. Raya Ubud No. 88, Gianyar, Bali 80571",
    contact_phone: "+62-361-9751-6606",
  },
  {
    domain: "egi-optics.com",
    company_name: "EGI Optics",
    industry: "Manufacturing & Production",
    employee_count: "11-50",
    description:
      "EGI Optics memproduksi dan mendistribusikan komponen optik presisi serta solusi imaging untuk industri manufaktur, medis, dan riset.",
    address: "Kawasan Industri MM2100 Blok T-12, Cikarang Barat, Bekasi 17520",
    contact_phone: "+62-21-8998-7707",
  },
];

const WORKER_SEEDS = [
  {
    key: "andika",
    username: "andika.prasetyo",
    email: "andika.prasetyo@gmail.com",
    name: "Andika Prasetyo",
    gender: "male",
    portrait: "https://randomuser.me/api/portraits/men/32.jpg",
    telephone: "081234567801",
    date_of_birth: "1994-03-18",
    religion: "Islam",
    marriage: "not married",
    address: "Jl. Kemang Raya No. 45, Jakarta Selatan 12730",
    profile_summary:
      "Senior Backend Engineer dengan 8+ tahun pengalaman membangun sistem distribusi skala tinggi menggunakan Node.js, Go, dan PostgreSQL. Terbiasa merancang event-driven architecture, observability, dan praktik DevOps di lingkungan produk B2B.",
    current_salary: 28000000,
    expected_salary: 35000000,
    skills: ["Node.js", "Go", "PostgreSQL", "Docker", "Kubernetes", "AWS", "REST API"],
    education: [
      {
        institution_name: "Universitas Indonesia",
        degree: "S1",
        major: "Ilmu Komputer",
        start_date: "2012-08-01",
        end_date: "2016-07-15",
      },
    ],
    experiences: [
      {
        company_name: "PT Traveloka Indonesia",
        job_title: "Backend Engineer",
        start_date: "2017-01-10",
        end_date: "2020-06-30",
        is_current: false,
        description:
          "Mengembangkan layanan booking dan payment orchestration; mengurangi p99 latency API sebesar 35%.",
      },
      {
        company_name: "PT Xendit Indonesia",
        job_title: "Senior Backend Engineer",
        start_date: "2020-07-15",
        end_date: null,
        is_current: true,
        description:
          "Memimpin domain settlement & reconciliation; mentorship 4 mid-level engineer.",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        issue_date: "2023-02-10",
        expiry_date: "2026-02-10",
        credential_id: "AWS-SAA-2023-7781",
      },
    ],
    portfolio: {
      title: "Open-source rate limiter middleware",
      description: "Express middleware rate limiting berbasis Redis token bucket.",
      link: "https://github.com/andika-prasetyo/rate-limiter",
    },
  },
  {
    key: "nabila",
    username: "nabila.rahman",
    email: "nabila.rahman@gmail.com",
    name: "Nabila Rahman",
    gender: "female",
    portrait: "https://randomuser.me/api/portraits/women/44.jpg",
    telephone: "081234567802",
    date_of_birth: "1996-11-02",
    religion: "Islam",
    marriage: "not married",
    address: "Jl. Dago Atas No. 12, Bandung 40135",
    profile_summary:
      "Product Designer (UI/UX) berpengalaman 6 tahun. Mahir riset pengguna, design system, dan prototyping di Figma. Fokus pada aksesibilitas dan conversion-driven design untuk produk fintech & edtech.",
    current_salary: 18000000,
    expected_salary: 24000000,
    skills: ["Figma", "UI/UX Design", "JavaScript", "React"],
    education: [
      {
        institution_name: "Institut Teknologi Bandung",
        degree: "S1",
        major: "Desain Komunikasi Visual",
        start_date: "2014-08-01",
        end_date: "2018-07-20",
      },
    ],
    experiences: [
      {
        company_name: "PT Ruangguru",
        job_title: "UI/UX Designer",
        start_date: "2019-03-01",
        end_date: "2022-01-31",
        is_current: false,
        description: "Merancang ulang alur onboarding siswa; meningkatkan completion rate 22%.",
      },
      {
        company_name: "PT Bank Jago",
        job_title: "Product Designer",
        start_date: "2022-02-14",
        end_date: null,
        is_current: true,
        description: "Owner design system mobile banking; kolaborasi erat dengan product & engineering.",
      },
    ],
    certifications: [
      {
        name: "Google UX Design Professional Certificate",
        issuer: "Google / Coursera",
        issue_date: "2021-08-01",
        expiry_date: null,
        credential_id: "GOOG-UX-21-9912",
      },
    ],
    portfolio: {
      title: "Case study: Mobile banking redesign",
      description: "Dokumentasi end-to-end redesign transfer flow.",
      link: "https://www.behance.net/nabila-rahman",
    },
  },
  {
    key: "farhan",
    username: "farhan.wijaya",
    email: "farhan.wijaya@gmail.com",
    name: "Farhan Wijaya",
    gender: "male",
    portrait: "https://randomuser.me/api/portraits/men/75.jpg",
    telephone: "081234567803",
    date_of_birth: "1992-07-25",
    religion: "Christianity",
    marriage: "married",
    address: "Jl. Darmo Permai Selatan No. 9, Surabaya 60187",
    profile_summary:
      "Data Scientist dengan latar belakang statistika dan 9 tahun pengalaman. Spesialis forecasting, NLP bahasa Indonesia, dan MLOps di industri retail & asuransi.",
    current_salary: 32000000,
    expected_salary: 40000000,
    skills: ["Python", "SQL", "Machine Learning", "Data Analysis", "Docker", "AWS"],
    education: [
      {
        institution_name: "Institut Teknologi Sepuluh Nopember",
        degree: "S1",
        major: "Statistika",
        start_date: "2010-08-01",
        end_date: "2014-07-10",
      },
      {
        institution_name: "Universitas Gadjah Mada",
        degree: "S2",
        major: "Ilmu Komputer (Data Science)",
        start_date: "2015-08-01",
        end_date: "2017-07-30",
      },
    ],
    experiences: [
      {
        company_name: "PT Asuransi Astra",
        job_title: "Data Analyst",
        start_date: "2017-09-01",
        end_date: "2020-12-31",
        is_current: false,
        description: "Membangun dashboard risiko klaim dan model churn pelanggan.",
      },
      {
        company_name: "PT Shopee Indonesia",
        job_title: "Senior Data Scientist",
        start_date: "2021-01-15",
        end_date: null,
        is_current: true,
        description: "Lead ranking model untuk search & recommendation marketplace.",
      },
    ],
    certifications: [
      {
        name: "Google Professional Data Engineer",
        issuer: "Google Cloud",
        issue_date: "2022-05-20",
        expiry_date: "2025-05-20",
        credential_id: "GCP-DE-2022-4410",
      },
    ],
    portfolio: {
      title: "IndoBERT fine-tune for sentiment",
      description: "Pipeline fine-tuning model sentimen ulasan e-commerce.",
      link: "https://github.com/farhan-wijaya/indobert-sentiment",
    },
  },
  {
    key: "salsabila",
    username: "salsabila.nuraini",
    email: "salsabila.nuraini@gmail.com",
    name: "Salsabila Nuraini",
    gender: "female",
    portrait: "https://randomuser.me/api/portraits/women/68.jpg",
    telephone: "081234567804",
    date_of_birth: "1997-01-14",
    religion: "Islam",
    marriage: "not married",
    address: "Jl. Kaliurang KM 7, Sleman, Yogyakarta 55281",
    profile_summary:
      "Frontend Engineer (React/TypeScript) 5 tahun pengalaman. Passionate terhadap Web Vitals, component architecture, dan kolaborasi design-to-code yang mulus.",
    current_salary: 16000000,
    expected_salary: 22000000,
    skills: ["React", "TypeScript", "Next.js", "JavaScript", "Git", "REST API"],
    education: [
      {
        institution_name: "Universitas Gadjah Mada",
        degree: "S1",
        major: "Teknik Informatika",
        start_date: "2015-08-01",
        end_date: "2019-07-25",
      },
    ],
    experiences: [
      {
        company_name: "PT Kata.ai",
        job_title: "Frontend Developer",
        start_date: "2019-10-01",
        end_date: "2022-08-31",
        is_current: false,
        description: "Membangun dashboard conversational AI dengan React dan GraphQL.",
      },
      {
        company_name: "PT Kredivo Finance",
        job_title: "Frontend Engineer",
        start_date: "2022-09-12",
        end_date: null,
        is_current: true,
        description: "Menjaga performa SPA pinjaman konsumen; rollout design system.",
      },
    ],
    certifications: [
      {
        name: "Meta Front-End Developer Certificate",
        issuer: "Meta / Coursera",
        issue_date: "2023-01-05",
        expiry_date: null,
        credential_id: "META-FE-23-2201",
      },
    ],
    portfolio: {
      title: "Personal finance dashboard",
      description: "Next.js app dengan charting dan PWA offline mode.",
      link: "https://github.com/salsabila-nuraini/finance-dashboard",
    },
  },
  {
    key: "reza",
    username: "reza.maulana",
    email: "reza.maulana@gmail.com",
    name: "Reza Maulana",
    gender: "male",
    portrait: "https://randomuser.me/api/portraits/men/11.jpg",
    telephone: "081234567805",
    date_of_birth: "1995-09-08",
    religion: "Islam",
    marriage: "married",
    address: "Jl. Ahmad Yani No. 210, Medan 20111",
    profile_summary:
      "DevOps / Platform Engineer dengan spesialisasi Kubernetes, CI/CD, dan cost optimization cloud. Berpengalaman mendukung 30+ microservices di production.",
    current_salary: 24000000,
    expected_salary: 30000000,
    skills: ["Docker", "Kubernetes", "AWS", "Git", "Redis", "PostgreSQL", "DevOps"],
    education: [
      {
        institution_name: "Universitas Sumatera Utara",
        degree: "S1",
        major: "Teknik Informatika",
        start_date: "2013-08-01",
        end_date: "2017-07-18",
      },
    ],
    experiences: [
      {
        company_name: "PT Telkom Indonesia",
        job_title: "System Engineer",
        start_date: "2018-01-08",
        end_date: "2021-04-30",
        is_current: false,
        description: "Operasional infrastruktur on-prem dan migrasi awal ke cloud.",
      },
      {
        company_name: "PT Tokopedia",
        job_title: "DevOps Engineer",
        start_date: "2021-05-17",
        end_date: null,
        is_current: true,
        description: "Membangun GitOps pipeline dan platform observability.",
      },
    ],
    certifications: [
      {
        name: "Certified Kubernetes Administrator (CKA)",
        issuer: "CNCF",
        issue_date: "2022-11-01",
        expiry_date: "2025-11-01",
        credential_id: "CKA-2022-8833",
      },
    ],
    portfolio: {
      title: "Terraform modules for EKS",
      description: "Reusable IaC modules untuk cluster EKS multi-AZ.",
      link: "https://github.com/reza-maulana/eks-terraform",
    },
  },
  {
    key: "intan",
    username: "intan.permata",
    email: "intan.permata@gmail.com",
    name: "Intan Permata Sari",
    gender: "female",
    portrait: "https://randomuser.me/api/portraits/women/21.jpg",
    telephone: "081234567806",
    date_of_birth: "1998-05-30",
    religion: "Hinduism",
    marriage: "not married",
    address: "Jl. Teuku Umar No. 55, Denpasar 80114",
    profile_summary:
      "Digital Marketing Specialist dengan fokus performance marketing, SEO teknis, dan content strategy. Terbiasa mengelola budget iklan bulanan > Rp500 juta.",
    current_salary: 12000000,
    expected_salary: 17000000,
    skills: ["Data Analysis", "SQL", "Figma"],
    education: [
      {
        institution_name: "Universitas Udayana",
        degree: "S1",
        major: "Ilmu Komunikasi",
        start_date: "2016-08-01",
        end_date: "2020-07-12",
      },
    ],
    experiences: [
      {
        company_name: "PT Tiket.com",
        job_title: "Performance Marketing Executive",
        start_date: "2020-09-01",
        end_date: "2023-03-31",
        is_current: false,
        description: "Mengelola kampanye Meta & Google Ads untuk funnel akomodasi.",
      },
      {
        company_name: "PT Blibli.com",
        job_title: "Senior Digital Marketing Specialist",
        start_date: "2023-04-10",
        end_date: null,
        is_current: true,
        description: "Owner growth channel marketplace campaign & CRM retention.",
      },
    ],
    certifications: [
      {
        name: "Google Ads Search Certification",
        issuer: "Google",
        issue_date: "2023-06-01",
        expiry_date: "2024-06-01",
        credential_id: "GADS-2023-1120",
      },
    ],
    portfolio: {
      title: "Campaign playbook Q4 GMV uplift",
      description: "Ringkasan eksperimen creative & bidding strategy.",
      link: "https://www.notion.so/intan-permata/campaign-playbook",
    },
  },
  {
    key: "dimas",
    username: "dimas.kurniawan",
    email: "dimas.kurniawan@gmail.com",
    name: "Dimas Kurniawan",
    gender: "male",
    portrait: "https://randomuser.me/api/portraits/men/52.jpg",
    telephone: "081234567807",
    date_of_birth: "1993-12-11",
    religion: "Islam",
    marriage: "married",
    address: "Jl. Diponegoro No. 77, Semarang 50241",
    profile_summary:
      "Full Stack Engineer (Laravel / Vue / Node) 7 tahun. Berpengalaman membangun ERP, HRIS, dan portal B2B untuk manufaktur.",
    current_salary: 20000000,
    expected_salary: 26000000,
    skills: ["PHP", "Laravel", "Vue.js", "MySQL", "Node.js", "Git", "REST API"],
    education: [
      {
        institution_name: "Universitas Diponegoro",
        degree: "S1",
        major: "Teknik Informatika",
        start_date: "2011-08-01",
        end_date: "2015-07-22",
      },
    ],
    experiences: [
      {
        company_name: "PT Astra Graphia",
        job_title: "Software Developer",
        start_date: "2016-02-01",
        end_date: "2019-11-30",
        is_current: false,
        description: "Pengembangan modul inventory & procurement ERP.",
      },
      {
        company_name: "PT HashMicro",
        job_title: "Full Stack Developer",
        start_date: "2020-01-06",
        end_date: null,
        is_current: true,
        description: "Customisasi ERP Odoo/Laravel untuk klien manufaktur.",
      },
    ],
    certifications: [
      {
        name: "Zend Certified PHP Engineer",
        issuer: "Zend",
        issue_date: "2021-03-15",
        expiry_date: null,
        credential_id: "ZEND-PHP-21-440",
      },
    ],
    portfolio: {
      title: "Open HRIS starter kit",
      description: "Boilerplate HRIS dengan role-based access control.",
      link: "https://github.com/dimas-kurniawan/hris-starter",
    },
  },
  {
    key: "meira",
    username: "meira.angelina",
    email: "meira.angelina@gmail.com",
    name: "Meira Angelina",
    gender: "female",
    portrait: "https://randomuser.me/api/portraits/women/33.jpg",
    telephone: "081234567808",
    date_of_birth: "1995-04-19",
    religion: "Christianity",
    marriage: "not married",
    address: "Jl. Pahlawan No. 3, Makassar 90111",
    profile_summary:
      "HR Business Partner dengan spesialisasi talent acquisition tech & hospitality. Mahir structuring interview loop, employer branding, dan retention program.",
    current_salary: 14000000,
    expected_salary: 19000000,
    skills: ["Data Analysis", "Figma"],
    education: [
      {
        institution_name: "Universitas Hasanuddin",
        degree: "S1",
        major: "Psikologi",
        start_date: "2013-08-01",
        end_date: "2017-07-28",
      },
    ],
    experiences: [
      {
        company_name: "PT Amartha Mikro Fintek",
        job_title: "Talent Acquisition Specialist",
        start_date: "2018-04-02",
        end_date: "2021-09-30",
        is_current: false,
        description: "Merekrut 120+ talent engineering & operations di wilayah Indonesia Timur.",
      },
      {
        company_name: "PT Traveloka",
        job_title: "HR Business Partner",
        start_date: "2021-10-11",
        end_date: null,
        is_current: true,
        description: "Partner untuk organization design & performance cycle produk hospitality.",
      },
    ],
    certifications: [
      {
        name: "SHRM Certified Professional (SHRM-CP)",
        issuer: "SHRM",
        issue_date: "2022-09-01",
        expiry_date: "2025-09-01",
        credential_id: "SHRM-CP-22-771",
      },
    ],
    portfolio: {
      title: "Hiring scorecard template",
      description: "Template rubrik wawancara berbasis kompetensi.",
      link: "https://www.notion.so/meira-angelina/hiring-scorecard",
    },
  },
];

const RECRUITER_CONTACTS = [
  { name: "Putri Ayudya", gender: "women", portraitIdx: 12, phone: "081311100101", username: "putri.ayudya" },
  { name: "Bagas Santoso", gender: "men", portraitIdx: 22, phone: "081311100102", username: "bagas.santoso" },
  { name: "Clara Wijaya", gender: "women", portraitIdx: 47, phone: "081311100103", username: "clara.wijaya" },
  { name: "Hendra Saputra", gender: "men", portraitIdx: 36, phone: "081311100104", username: "hendra.saputra" },
  { name: "Larasati Dewi", gender: "women", portraitIdx: 65, phone: "081311100105", username: "larasati.dewi" },
  { name: "Yusuf Ramadhan", gender: "men", portraitIdx: 41, phone: "081311100106", username: "yusuf.ramadhan" },
  { name: "Nadia Kartika", gender: "women", portraitIdx: 29, phone: "081311100107", username: "nadia.kartika" },
];

const pool = new Pool({ connectionString: process.env.POSTGRESQL_URL });

const enc = (value) => (value == null || value === "" ? value : encrypt(String(value)));

async function lookupId(client, sql, params) {
  const res = await client.query(sql, params);
  return res.rows[0]?.id ?? null;
}

async function clearWorkersAndRecruiters(client) {
  console.log("→ Deleting existing worker & recruiter users (cascades profiles & related data)...");
  const del = await client.query(
    `DELETE FROM users
     WHERE role_id IN ($1, $2)
     RETURNING id, role_id`,
    [WORKER_ROLE_ID, RECRUITER_ROLE_ID],
  );
  console.log(`  Removed ${del.rowCount} user(s).`);
}

async function seedWorkers(client, passwordHash, idrCurrencyId, nationalityId) {
  console.log("→ Seeding workers...");
  const genderMap = Object.fromEntries(
    (await client.query(`SELECT id, gender_name FROM genders`)).rows.map((r) => [
      r.gender_name,
      r.id,
    ]),
  );
  const religionMap = Object.fromEntries(
    (await client.query(`SELECT id, religion_name FROM religions`)).rows.map((r) => [
      r.religion_name,
      r.id,
    ]),
  );
  const marriageMap = Object.fromEntries(
    (await client.query(`SELECT id, status_name FROM marriage_statuses`)).rows.map((r) => [
      r.status_name,
      r.id,
    ]),
  );
  const skillRows = (await client.query(`SELECT id, skill_name FROM skills`)).rows;
  const skillByName = Object.fromEntries(skillRows.map((s) => [s.skill_name, s.id]));

  let langIdId = await lookupId(
    client,
    `SELECT id FROM languages WHERE LOWER(name) IN ('bahasa indonesia', 'indonesian') LIMIT 1`,
  );
  let langEn = await lookupId(
    client,
    `SELECT id FROM languages WHERE LOWER(name) = 'english' LIMIT 1`,
  );
  if (!langIdId) {
    const ins = await client.query(
      `INSERT INTO languages (name) VALUES ('Bahasa Indonesia') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    );
    langIdId = ins.rows[0].id;
  }
  if (!langEn) {
    const ins = await client.query(
      `INSERT INTO languages (name) VALUES ('English') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    );
    langEn = ins.rows[0].id;
  }

  const proficiencyFluent = await lookupId(
    client,
    `SELECT id FROM proficiency_levels WHERE LOWER(name) LIKE '%fluent%' OR LOWER(name) LIKE '%mahir%' LIMIT 1`,
  );
  const proficiencyNative = await lookupId(
    client,
    `SELECT id FROM proficiency_levels WHERE LOWER(name) LIKE '%native%' OR LOWER(name) LIKE '%ibu%' LIMIT 1`,
  );

  for (const w of WORKER_SEEDS) {
    const userId = uuidv4();
    const workerId = uuidv4();

    await client.query(
      `INSERT INTO users (id, username, email, hashed_password, login_provider, role_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'local', $5, NOW(), NOW())`,
      [userId, enc(w.username), enc(w.email), passwordHash, WORKER_ROLE_ID],
    );

    await client.query(
      `INSERT INTO workers (
          id, user_id, name, avatar_url, telephone, date_of_birth,
          gender_id, nationality_id, religion_id, marriage_status_id,
          address, profile_summary,
          current_salary, expected_salary,
          current_salary_currency_id, expected_salary_currency_id,
          created_at, updated_at
       ) VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,
          $11,$12,
          $13,$14,
          $15,$16,
          NOW(), NOW()
       )`,
      [
        workerId,
        userId,
        enc(w.name),
        w.portrait,
        enc(w.telephone),
        w.date_of_birth,
        genderMap[w.gender],
        nationalityId,
        religionMap[w.religion],
        marriageMap[w.marriage],
        enc(w.address),
        w.profile_summary,
        w.current_salary,
        w.expected_salary,
        idrCurrencyId,
        idrCurrencyId,
      ],
    );

    for (const edu of w.education) {
      await client.query(
        `INSERT INTO educations (
            id, worker_id, institution_name, degree, major, start_date, end_date, is_current, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,false,NOW(),NOW())`,
        [
          uuidv4(),
          workerId,
          edu.institution_name,
          edu.degree,
          edu.major,
          edu.start_date,
          edu.end_date,
        ],
      );
    }

    for (const exp of w.experiences) {
      await client.query(
        `INSERT INTO work_experiences (
            id, worker_id, company_name, job_title, start_date, end_date, is_current, description, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
        [
          uuidv4(),
          workerId,
          enc(exp.company_name),
          exp.job_title,
          exp.start_date,
          exp.end_date,
          exp.is_current,
          exp.description,
        ],
      );
    }

    for (const skillName of w.skills) {
      const skillId = skillByName[skillName];
      if (!skillId) continue;
      await client.query(
        `INSERT INTO worker_skills (worker_id, skill_id, created_at)
         VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
        [workerId, skillId],
      );
    }

    for (const cert of w.certifications) {
      await client.query(
        `INSERT INTO certifications (
            id, worker_id, name, issuer, issue_date, expiry_date, credential_id, is_active, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW())`,
        [
          uuidv4(),
          workerId,
          cert.name,
          cert.issuer,
          cert.issue_date,
          cert.expiry_date,
          cert.credential_id,
        ],
      );
    }

    if (w.portfolio) {
      await client.query(
        `INSERT INTO portfolios (
            id, worker_id, title, description, link, is_public, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())`,
        [uuidv4(), workerId, w.portfolio.title, w.portfolio.description, w.portfolio.link],
      );
    }

    // Prefer worker_languages schema (post-017); fallback silently if table missing
    try {
      const nativeId = proficiencyNative || proficiencyFluent || 4;
      const fluentId = proficiencyFluent || proficiencyNative || 3;
      await client.query(
        `INSERT INTO worker_languages (worker_id, language_name, language_id, proficiency_level_id, is_primary)
         VALUES
           ($1, 'Bahasa Indonesia', $2, $3, true),
           ($1, 'English', $4, $5, false)`,
        [workerId, langIdId, nativeId, langEn, fluentId],
      );
    } catch (err) {
      console.warn(`  ! Skipping languages for ${w.email}: ${err.message}`);
    }

    console.log(`  + worker ${w.email}`);
  }
}

async function seedRecruiters(client, passwordHash) {
  console.log("→ Seeding recruiters (approved company domains + Clearbit logos)...");

  const industryMap = Object.fromEntries(
    (await client.query(`SELECT id, name FROM industries`)).rows.map((r) => [r.name, r.id]),
  );

  for (let i = 0; i < COMPANY_DOMAINS.length; i += 1) {
    const company = COMPANY_DOMAINS[i];
    const contact = RECRUITER_CONTACTS[i % RECRUITER_CONTACTS.length];
    const userId = uuidv4();
    const recruiterId = uuidv4();
    const email = `hr@${company.domain}`;
    const website = `https://${company.domain}`;
    const logoUrl = `https://logo.clearbit.com/${company.domain}`;
    const contactAvatar = `https://randomuser.me/api/portraits/${contact.gender}/${contact.portraitIdx}.jpg`;

    await client.query(
      `INSERT INTO users (id, username, email, hashed_password, login_provider, role_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'local',$5,NOW(),NOW())`,
      [userId, enc(contact.username), enc(email), passwordHash, RECRUITER_ROLE_ID],
    );

    const industryId = industryMap[company.industry] || industryMap["Information Technology"];

    // avatar_url = company logo (Clearbit); personal portrait kept in description metadata via contact
    await client.query(
      `INSERT INTO recruiters (
          id, user_id, company_name, avatar_url, company_website,
          contact_name, contact_phone, address, industry_id, description,
          is_vip, is_verified, employee_count, instagram_url, tiktok_url,
          created_at, updated_at
       ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          false, true, $11, $12, $13,
          NOW(), NOW()
       )`,
      [
        recruiterId,
        userId,
        enc(company.company_name),
        logoUrl,
        website,
        enc(contact.name),
        enc(company.contact_phone || contact.phone),
        enc(company.address),
        industryId,
        `${company.description}\n\nContact photo: ${contactAvatar}`,
        company.employee_count,
        `https://instagram.com/${company.domain.split(".")[0]}`,
        null,
      ],
    );

    console.log(`  + recruiter ${email} | logo ${logoUrl}`);
  }
}

async function main() {
  if (!process.env.POSTGRESQL_URL) {
    console.error("POSTGRESQL_URL is required in .env");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    console.log("Generating password hash...");
    const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    const idrCurrencyId =
      (await lookupId(client, `SELECT id FROM currencies WHERE code = 'IDR' LIMIT 1`)) || 1;
    const nationalityId =
      (await lookupId(
        client,
        `SELECT id FROM nationalities WHERE iso_alpha2 = 'ID' LIMIT 1`,
      )) || 1;

    await client.query("BEGIN");
    await clearWorkersAndRecruiters(client);
    await seedWorkers(client, passwordHash, idrCurrencyId, nationalityId);
    await seedRecruiters(client, passwordHash);
    await client.query("COMMIT");

    console.log("\n✅ Seed completed.");
    console.log(`   Password for all seeded accounts: ${PASSWORD_PLAIN}`);
    console.log("   Example worker login : andika.prasetyo@gmail.com");
    console.log("   Example recruiter    : hr@mecca-hotel.com");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seed failed:", err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
