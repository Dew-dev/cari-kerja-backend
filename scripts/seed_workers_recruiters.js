#!/usr/bin/env node
/**
 * Seed / refresh worker, recruiter, and job-post dummy data.
 *
 * What it does:
 *  1. Hard-deletes ALL job_posts (clears stale listings that 404 on detail).
 *  2. Deletes ALL existing worker (role_id=1) and recruiter (role_id=2) users.
 *     Cascades remove workers/recruiters and related rows.
 *     Admin / super_admin / moderator accounts are preserved.
 *  3. Downloads free portraits (randomuser.me) into uploads/avatars/worker and
 *     inserts workers with relative avatar_url paths (FE-compatible).
 *  4. Downloads company logos into uploads/avatars/recruiter (Clearbit → Google
 *     favicon → ui-avatars fallback) and inserts recruiters with clean About text
 *     (no "Contact photo" junk) + relative avatar_url.
 *  5. Inserts 3 OPEN job posts per recruiter (1 Hot Job via boost_type='hot' + 2 regular),
 *     aligned to each company field, with skills / requirements / benefits / responsibilities.
 *
 * Prerequisites:
 *  - POSTGRESQL_URL set in .env
 *  - ENCRYPTION_KEY matches the running API (sensitive columns are encrypted)
 *  - Base schema + lookups (roles, industries, genders, currencies, skills, categories, …) exist
 *  - Run migration 026_widen_encrypted_recruiter_columns.sql before seeding
 *    (encrypted contact_phone / company_name exceed old VARCHAR lengths)
 *  - Migration 020 (email_verified_at) should already be applied for login
 *  - Network access to download portraits/logos (or fallbacks write a local PNG)
 *
 * Usage:
 *   # 1) apply migration 026 (psql / your migration runner)
 *   # 2) seed
 *   node scripts/seed_workers_recruiters.js
 *   npm run seed:workers-recruiters
 *
 * Default login password for all seeded accounts: Password123!
 * Seeded accounts are email-verified so local login works immediately.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { encrypt } = require("../src/helpers/utils/crypto_helper");
const JOB_SEEDS_BY_DOMAIN = require("./data/dummy_job_posts");

/** 1x1 PNG used only if every remote logo/portrait source fails */
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function getUploadsRoot() {
  return process.env.UPLOADS_PATH
    ? path.resolve(process.env.UPLOADS_PATH)
    : path.join(__dirname, "../src/uploads");
}

async function downloadToFile(url, destPath) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 300,
    headers: { "User-Agent": "cari-kerja-seed/1.0" },
  });
  const buf = Buffer.from(res.data);
  if (buf.length < 32) {
    throw new Error(`download too small (${buf.length} bytes): ${url}`);
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return destPath;
}

function writePlaceholder(destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, PLACEHOLDER_PNG);
  return destPath;
}

/**
 * Download remote image into uploads and return public relative path
 * e.g. /uploads/avatars/worker/seed-andika.jpg
 */
async function materializeAvatar({ subDir, fileName, urls, label }) {
  const absPath = path.join(getUploadsRoot(), subDir, fileName);
  const publicPath = `/uploads/${subDir.replace(/\\/g, "/")}/${fileName}`;

  for (const url of urls) {
    try {
      await downloadToFile(url, absPath);
      console.log(`    ↓ ${label}: ${url}`);
      return publicPath;
    } catch (err) {
      console.warn(`    ! ${label} failed (${url}): ${err.message}`);
    }
  }

  writePlaceholder(absPath);
  console.warn(`    ! ${label}: using local placeholder PNG`);
  return publicPath;
}

async function resolveWorkerAvatar(worker) {
  const ext = ".jpg";
  return materializeAvatar({
    subDir: path.join("avatars", "worker"),
    fileName: `seed-${worker.key}${ext}`,
    urls: [worker.portrait],
    label: `worker ${worker.key}`,
  });
}

async function resolveCompanyLogo(company) {
  const domain = company.domain;
  const nameParam = encodeURIComponent(company.company_name);
  return materializeAvatar({
    subDir: path.join("avatars", "recruiter"),
    fileName: `seed-${domain.replace(/\./g, "-")}.png`,
    urls: [
      `https://logo.clearbit.com/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`,
      `https://ui-avatars.com/api/?name=${nameParam}&size=256&background=0D8ABC&color=fff&format=png`,
    ],
    label: `logo ${domain}`,
  });
}

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

/**
 * Run SQL inside a SAVEPOINT. Missing relations (42P01) are ignored so the
 * outer transaction stays usable; other errors are rethrown.
 */
async function tryOptionalQuery(client, sql, params) {
  await client.query("SAVEPOINT seed_optional");
  try {
    await client.query(sql, params);
    await client.query("RELEASE SAVEPOINT seed_optional");
    return true;
  } catch (err) {
    await client.query("ROLLBACK TO SAVEPOINT seed_optional");
    if (err.code === "42P01") return false;
    throw err;
  }
}

/**
 * Like tryOptionalQuery but swallows any error (used for best-effort inserts).
 */
async function tryBestEffortQuery(client, sql, params) {
  await client.query("SAVEPOINT seed_best_effort");
  try {
    await client.query(sql, params);
    await client.query("RELEASE SAVEPOINT seed_best_effort");
    return null;
  } catch (err) {
    await client.query("ROLLBACK TO SAVEPOINT seed_best_effort");
    return err;
  }
}

async function clearAllJobPosts(client) {
  console.log("→ Deleting all existing job posts...");
  const del = await client.query(`DELETE FROM job_posts RETURNING id`);
  console.log(`  Removed ${del.rowCount} job post(s).`);
}

async function ensureSkillId(client, skillByName, skillName) {
  if (skillByName[skillName]) return skillByName[skillName];
  const inserted = await client.query(
    `INSERT INTO skills (id, skill_name)
     VALUES ($1, $2)
     ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name
     RETURNING id`,
    [uuidv4(), skillName],
  );
  const id = inserted.rows[0].id;
  skillByName[skillName] = id;
  return id;
}

async function clearWorkersAndRecruiters(client) {
  console.log("→ Clearing FK blockers, then deleting worker & recruiter users...");

  // saved_jobs.worker_id is ON DELETE RESTRICT
  await tryOptionalQuery(
    client,
    `DELETE FROM saved_jobs
     WHERE worker_id IN (
       SELECT w.id FROM workers w
       JOIN users u ON u.id = w.user_id
       WHERE u.role_id = $1
     )`,
    [WORKER_ROLE_ID],
  );

  // application_stage_history.changed_by_recruiter_id has no ON DELETE CASCADE
  await tryOptionalQuery(
    client,
    `UPDATE application_stage_history
     SET changed_by_recruiter_id = NULL
     WHERE changed_by_recruiter_id IN (
       SELECT r.id FROM recruiters r
       JOIN users u ON u.id = r.user_id
       WHERE u.role_id = $1
     )`,
    [RECRUITER_ROLE_ID],
  );

  // Optional: job_alerts may not exist in older DBs
  await tryOptionalQuery(
    client,
    `DELETE FROM job_alerts WHERE worker_id IN (
       SELECT w.id FROM workers w JOIN users u ON u.id = w.user_id WHERE u.role_id = $1
     )`,
    [WORKER_ROLE_ID],
  );

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

  // Post-017: master `languages(name)` + child `worker_languages`
  // Pre-017: only per-worker `languages` table (no master name column)
  let hasLanguageMaster = false;
  let langIdId = null;
  let langEn = null;
  try {
    const probe = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'languages' AND column_name = 'name'
       LIMIT 1`,
    );
    hasLanguageMaster = probe.rowCount > 0;
  } catch {
    hasLanguageMaster = false;
  }

  if (hasLanguageMaster) {
    langIdId = await lookupId(
      client,
      `SELECT id FROM languages WHERE LOWER(name) IN ('bahasa indonesia', 'indonesian') LIMIT 1`,
    );
    langEn = await lookupId(
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
    const avatarUrl = await resolveWorkerAvatar(w);

    await client.query(
      `INSERT INTO users (
          id, username, email, hashed_password, login_provider, role_id,
          email_verified_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, 'local', $5, NOW(), NOW(), NOW())`,
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
        avatarUrl,
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
          enc(cert.name),
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
    {
      const nativeId = proficiencyNative || proficiencyFluent || 4;
      const fluentId = proficiencyFluent || proficiencyNative || 3;
      let langErr = null;
      if (hasLanguageMaster && langIdId && langEn) {
        langErr = await tryBestEffortQuery(
          client,
          `INSERT INTO worker_languages (worker_id, language_name, language_id, proficiency_level_id, is_primary)
           VALUES
             ($1, 'Bahasa Indonesia', $2, $3, true),
             ($1, 'English', $4, $5, false)`,
          [workerId, langIdId, nativeId, langEn, fluentId],
        );
      } else {
        langErr = await tryBestEffortQuery(
          client,
          `INSERT INTO languages (worker_id, language_name, proficiency_level_id, is_primary)
           VALUES
             ($1, 'Bahasa Indonesia', $2, true),
             ($1, 'English', $3, false)`,
          [workerId, nativeId, fluentId],
        );
      }
      if (langErr) {
        console.warn(`  ! Skipping languages for ${w.email}: ${langErr.message}`);
      }
    }

    console.log(`  + worker ${w.email}`);
  }
}

async function seedRecruiters(client, passwordHash) {
  console.log("→ Seeding recruiters (approved company domains + local logo files)...");

  const industryMap = Object.fromEntries(
    (await client.query(`SELECT id, name FROM industries`)).rows.map((r) => [r.name, r.id]),
  );

  /** @type {Record<string, { recruiterId: string, companyName: string, email: string }>} */
  const recruiterByDomain = {};

  for (let i = 0; i < COMPANY_DOMAINS.length; i += 1) {
    const company = COMPANY_DOMAINS[i];
    const contact = RECRUITER_CONTACTS[i % RECRUITER_CONTACTS.length];
    const userId = uuidv4();
    const recruiterId = uuidv4();
    const email = `hr@${company.domain}`;
    const website = `https://${company.domain}`;
    const logoUrl = await resolveCompanyLogo(company);

    await client.query(
      `INSERT INTO users (
          id, username, email, hashed_password, login_provider, role_id,
          email_verified_at, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,'local',$5,NOW(),NOW(),NOW())`,
      [userId, enc(contact.username), enc(email), passwordHash, RECRUITER_ROLE_ID],
    );

    const industryId = industryMap[company.industry] || industryMap["Information Technology"];

    // avatar_url = relative /uploads/... path so FE storage prefix works
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
        company.description,
        company.employee_count,
        `https://instagram.com/${company.domain.split(".")[0]}`,
        null,
      ],
    );

    recruiterByDomain[company.domain] = {
      recruiterId,
      companyName: company.company_name,
      email,
    };

    console.log(`  + recruiter ${email} | logo ${logoUrl}`);
  }

  return recruiterByDomain;
}

async function seedJobPosts(client, recruiterByDomain, currencyId) {
  console.log("→ Seeding job posts (3 per recruiter: 1 hot + 2 regular)...");

  const categoryRows = (await client.query(`SELECT id, name FROM categories`)).rows;
  const categoryByName = Object.fromEntries(categoryRows.map((r) => [r.name, r.id]));
  const skillRows = (await client.query(`SELECT id, skill_name FROM skills`)).rows;
  const skillByName = Object.fromEntries(skillRows.map((s) => [s.skill_name, s.id]));

  const fallbackCategoryId =
    categoryByName["Teknologi Informasi"] || categoryRows[0]?.id || 1;

  let hotCount = 0;
  let regularCount = 0;

  for (const [domain, jobs] of Object.entries(JOB_SEEDS_BY_DOMAIN)) {
    const recruiter = recruiterByDomain[domain];
    if (!recruiter) {
      console.warn(`  ! Skipping jobs for ${domain}: recruiter not seeded`);
      continue;
    }
    if (!Array.isArray(jobs) || jobs.length !== 3) {
      console.warn(`  ! Expected 3 jobs for ${domain}, got ${jobs?.length ?? 0}`);
    }

    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i];
      const jobId = uuidv4();
      const isHot = Boolean(job.isHot) || i === 0;
      const categoryId = categoryByName[job.category] || fallbackCategoryId;

      await client.query(
        `INSERT INTO job_posts (
            id, recruiter_id, title, description,
            location, province, city,
            employment_type_id, experience_level_id,
            salary_min, salary_max, salary_type_id, currency_id,
            status_id, category_id, is_remote, deadline,
            published_at, boost_type, boost_expires_at, is_hot,
            deleted_at, created_at, updated_at
         ) VALUES (
            $1,$2,$3,$4,
            $5,$6,$7,
            $8,$9,
            $10,$11,3,$12,
            1,$13,$14,$15::date,
            NOW(),
            $16::varchar,
            $17::timestamptz,
            $18::boolean,
            NULL, NOW(), NOW()
         )`,
        [
          jobId,
          recruiter.recruiterId,
          job.title,
          job.description,
          job.location,
          job.province,
          job.city,
          job.employment_type_id,
          job.experience_level_id,
          job.salary_min,
          job.salary_max,
          currencyId,
          categoryId,
          Boolean(job.is_remote),
          "2026-12-31",
          isHot ? "hot" : null,
          isHot ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          isHot,
        ],
      );

      for (const skillName of job.skills || []) {
        const skillId = await ensureSkillId(client, skillByName, skillName);
        await client.query(
          `INSERT INTO job_post_skills (job_post_id, skill_id, created_at)
           VALUES ($1,$2,NOW())
           ON CONFLICT DO NOTHING`,
          [jobId, skillId],
        );
      }

      for (let r = 0; r < (job.requirements || []).length; r += 1) {
        await tryBestEffortQuery(
          client,
          `INSERT INTO job_post_requirements (id, job_post_id, requirement, order_index)
           VALUES ($1,$2,$3,$4)`,
          [uuidv4(), jobId, job.requirements[r], r + 1],
        );
      }

      for (let b = 0; b < (job.benefits || []).length; b += 1) {
        await tryBestEffortQuery(
          client,
          `INSERT INTO job_post_benefits (id, job_post_id, benefit, order_index)
           VALUES ($1,$2,$3,$4)`,
          [uuidv4(), jobId, job.benefits[b], b + 1],
        );
      }

      for (let p = 0; p < (job.responsibilities || []).length; p += 1) {
        await tryBestEffortQuery(
          client,
          `INSERT INTO job_post_responsibilities (id, job_post_id, responsibility, order_index)
           VALUES ($1,$2,$3,$4)`,
          [uuidv4(), jobId, job.responsibilities[p], p + 1],
        );
      }

      if (isHot) hotCount += 1;
      else regularCount += 1;

      console.log(
        `  + [${isHot ? "HOT" : "REG"}] ${recruiter.companyName}: ${job.title}`,
      );
    }
  }

  console.log(`  Seeded ${hotCount} hot + ${regularCount} regular job post(s).`);
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
    await clearAllJobPosts(client);
    await clearWorkersAndRecruiters(client);
    await seedWorkers(client, passwordHash, idrCurrencyId, nationalityId);
    const recruiterByDomain = await seedRecruiters(client, passwordHash);
    await seedJobPosts(client, recruiterByDomain, idrCurrencyId);
    await client.query("COMMIT");

    console.log("\n✅ Seed completed.");
    console.log(`   Password for all seeded accounts: ${PASSWORD_PLAIN}`);
    console.log("   Example worker login : andika.prasetyo@gmail.com");
    console.log("   Example recruiter    : hr@mecca-hotel.com");
    console.log("   Job posts            : 3 per recruiter (1 hot + 2 regular)");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("\n❌ Seed failed:", err.message || err);
    if (err.code) console.error(`   code: ${err.code}`);
    if (err.detail) console.error(`   detail: ${err.detail}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
