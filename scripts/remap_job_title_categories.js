/**
 * Re-classify job_titles.category_id using the seed catalog sections
 * (authoritative role → category map) + domain management titles.
 *
 * Fixes common failures of the first heuristic pass:
 * - Software/Cloud Architect wrongly → Construction
 * - QA Engineer wrongly → Manufacturing
 * - Unmatched titles dumped into IT (Account Manager, Kurir, Lawyer, …)
 *
 * Usage:
 *   node scripts/remap_job_title_categories.js
 *   node scripts/remap_job_title_categories.js --dry-run
 */
require("dotenv").config();
const { Client } = require("pg");

const DATABASE_URL = process.env.POSTGRESQL_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("POSTGRESQL_URL / DATABASE_URL is required");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

const CAT = {
  IT: 1,
  FINANCE: 2,
  HEALTH: 3,
  EDUCATION: 4,
  MANUFACTURING: 5,
  RETAIL: 6,
  LOGISTICS: 7,
  CONSTRUCTION: 8,
  HOSPITALITY: 9,
  MARKETING: 10,
  DESIGN: 11,
  HR: 12,
};

/** Seniority prefixes from the seed catalog (Staff handled separately). */
const SENIORITY_RE =
  /^(Junior|Senior|Lead|Principal|Associate|Mid-Level|Entry-Level)\s+/i;

const INTERN_FREELANCE_RE = /\s+(Intern|Internship|Freelance)$/i;

const CXO_CATEGORY = {
  ceo: CAT.HR,
  "chief executive officer": CAT.HR,
  cfo: CAT.FINANCE,
  "chief financial officer": CAT.FINANCE,
  cto: CAT.IT,
  "chief technology officer": CAT.IT,
  cio: CAT.IT,
  "chief information officer": CAT.IT,
  ciso: CAT.IT,
  "chief information security officer": CAT.IT,
  cpo: CAT.IT,
  "chief product officer": CAT.IT,
  cmo: CAT.MARKETING,
  "chief marketing officer": CAT.MARKETING,
  coo: CAT.LOGISTICS,
  "chief operating officer": CAT.LOGISTICS,
  chro: CAT.HR,
  "chief human resources officer": CAT.HR,
  "chief people officer": CAT.HR,
  "chief design officer": CAT.DESIGN,
  "chief growth officer": CAT.MARKETING,
  "chief revenue officer": CAT.MARKETING,
  "chief commercial officer": CAT.MARKETING,
};

/**
 * Base roles from scripts/seed_job_titles_catalog.js, grouped by product category.
 * Keep in sync with seed sections when catalog changes.
 */
const ROLE_GROUPS = [
  {
    id: CAT.IT,
    roles: [
      "Software Engineer", "Software Developer", "Backend Engineer", "Backend Developer",
      "Frontend Engineer", "Frontend Developer", "Full Stack Engineer", "Full Stack Developer",
      "Mobile Engineer", "Mobile Developer", "iOS Developer", "Android Developer",
      "Flutter Developer", "React Native Developer", "Web Developer", "DevOps Engineer",
      "Site Reliability Engineer", "Cloud Engineer", "Cloud Architect", "Solutions Architect",
      "Software Architect", "System Architect", "Platform Engineer", "Infrastructure Engineer",
      "Network Engineer", "Security Engineer", "Cybersecurity Analyst",
      "Information Security Analyst", "Penetration Tester", "QA Engineer",
      "QA Automation Engineer", "Quality Assurance Engineer", "Test Engineer", "SDET",
      "Data Engineer", "Data Scientist", "Data Analyst", "Business Intelligence Analyst",
      "Machine Learning Engineer", "AI Engineer", "MLOps Engineer", "Analytics Engineer",
      "Database Administrator", "System Administrator", "System Engineer",
      "IT Support Specialist", "IT Support Engineer", "Help Desk Technician",
      "Technical Support Specialist", "Application Support Analyst", "ERP Consultant",
      "SAP Consultant", "Salesforce Developer", "Salesforce Administrator",
      "Business Analyst", "System Analyst", "Technical Analyst", "Product Engineer",
      "Embedded Software Engineer", "Firmware Engineer", "Game Developer", "Unity Developer",
      "Blockchain Developer", "Smart Contract Developer", "Scrum Master", "Agile Coach",
      "Release Manager", "Build Engineer", "Automation Engineer", "RPA Developer",
      "Integration Engineer", "API Developer", "Golang Developer", "Java Developer",
      "Python Developer", "PHP Developer", "Node.js Developer", ".NET Developer",
      "C# Developer", "C++ Developer", "Ruby Developer", "Kotlin Developer",
      "Swift Developer", "TypeScript Developer", "React Developer", "Vue.js Developer",
      "Angular Developer", "Laravel Developer", "Spring Boot Developer",
      "Wordpress Developer", "Product Manager", "Product Owner",
      "Associate Product Manager", "Technical Product Manager", "Growth Product Manager",
      "Fintech Product Manager", "Research Analyst", "Quantitative Analyst",
      "Statistician", "Research Scientist", "Operations Research Analyst",
      "Pengembang Perangkat Lunak", "Programmer", "Programmer Web", "Programmer Mobile",
      "Konsultan IT", "Teknisi IT", "Staff IT", "Analis Data", "Analis Bisnis",
    ],
  },
  {
    id: CAT.DESIGN,
    roles: [
      "Product Designer", "UI Designer", "UX Designer", "UI/UX Designer", "UX Researcher",
      "UX Writer", "Interaction Designer", "Visual Designer", "Graphic Designer",
      "Motion Designer", "Brand Designer", "Web Designer", "Service Designer",
      "Design System Designer", "Creative Director", "Art Director", "Interior Designer",
      "CAD Designer", "Drafter", "Animator", "Illustrator", "3D Artist", "Photographer",
      "Videographer", "Video Editor", "Sound Engineer", "Broadcast Technician",
      "Desainer Grafis", "Desainer UI/UX", "Producer", "Podcast Producer",
    ],
  },
  {
    id: CAT.MARKETING,
    roles: [
      "Digital Marketing Specialist", "Digital Marketing Executive",
      "Performance Marketing Specialist", "Performance Marketing Executive",
      "Growth Marketing Manager", "Growth Hacker", "SEO Specialist", "SEM Specialist",
      "Content Marketing Specialist", "Content Writer", "Copywriter",
      "Social Media Specialist", "Social Media Manager", "Community Manager",
      "Brand Manager", "Brand Specialist", "Marketing Specialist", "Marketing Executive",
      "Marketing Coordinator", "Email Marketing Specialist", "Affiliate Marketing Specialist",
      "Influencer Marketing Specialist", "Public Relations Specialist", "PR Executive",
      "Communications Specialist", "Corporate Communications", "Event Marketing Specialist",
      "Campaign Manager", "Media Planner", "Media Buyer", "Marketing Analyst",
      "Market Research Analyst", "Sales Executive", "Sales Specialist",
      "Sales Representative", "Account Executive", "Account Manager",
      "Key Account Manager", "Business Development Executive",
      "Business Development Manager", "Partnership Manager", "Channel Sales Manager",
      "Inside Sales Representative", "Field Sales Representative", "Sales Engineer",
      "Pre-Sales Consultant", "Solution Consultant", "Commercial Manager",
      "Spesialis Digital Marketing", "Spesialis SEO", "Staff Marketing", "Staff Sales",
      "Staff Content", "Manajer Pemasaran", "Manajer Penjualan", "Social Media Officer",
      "Content Creator", "Credit Marketing Officer", "Journalist", "Editor",
      "Grant Writer", "Translator", "Penerjemah", "Supervisor Sales",
      "Sales Counter", "Sales Canvassing",
    ],
  },
  {
    id: CAT.HR,
    roles: [
      "Human Resources Specialist", "HR Generalist", "HR Executive", "HR Business Partner",
      "Talent Acquisition Specialist", "Recruiter", "Technical Recruiter",
      "People Operations Specialist", "Compensation and Benefits Specialist",
      "Learning and Development Specialist", "Organization Development Specialist",
      "Employee Relations Specialist", "Payroll Specialist", "HRIS Analyst",
      "Training Specialist", "Staff HR", "Manajer SDM", "Administrative Assistant",
      "Executive Assistant", "Office Administrator", "Office Manager", "Secretary",
      "Receptionist", "Document Controller", "General Affairs Staff", "GA Staff",
      "Staff Administrasi", "Asisten Manajer", "Asisten Administrasi", "Asisten Eksekutif",
      "Sekretaris", "Resepsionis", "Office Boy", "Security", "Social Worker",
      "Community Development Officer", "Program Officer", "Public Affairs Specialist",
      "Policy Analyst",
    ],
  },
  {
    id: CAT.FINANCE,
    roles: [
      "Accountant", "Junior Accountant", "Senior Accountant", "Financial Analyst",
      "Finance Executive", "Finance Specialist", "Controller", "Tax Specialist",
      "Tax Consultant", "Audit Associate", "Internal Auditor", "External Auditor",
      "Accounts Payable Specialist", "Accounts Receivable Specialist", "Bookkeeper",
      "Treasury Analyst", "Investment Analyst", "Credit Analyst", "Risk Analyst",
      "Compliance Officer", "AML Analyst", "FP&A Analyst", "Billing Specialist",
      "Cost Accountant", "Management Accountant", "Legal Counsel", "Corporate Lawyer",
      "Legal Officer", "Legal Specialist", "Paralegal", "Contract Specialist",
      "Compliance Specialist", "Company Secretary", "Staff Accounting", "Staff Finance",
      "Manajer Keuangan", "Analis Keuangan", "Akuntan", "Auditor", "Konsultan Pajak",
      "Konsultan Bisnis", "Relationship Manager", "Bank Teller", "Loan Officer",
      "Credit Officer", "Underwriter", "Claims Specialist", "Insurance Agent",
      "Wealth Manager", "Financial Advisor", "Branch Manager", "Collection Officer",
      "Fraud Analyst", "Payment Specialist", "Account Officer", "Collection Staff",
      "Teller Bank", "Customer Service Bank", "Kepala Cabang",
    ],
  },
  {
    id: CAT.LOGISTICS,
    roles: [
      "Supply Chain Specialist", "Supply Chain Analyst", "Procurement Specialist",
      "Purchasing Officer", "Buyer", "Inventory Specialist", "Warehouse Supervisor",
      "Warehouse Staff", "Logistics Coordinator", "Logistics Specialist",
      "Import Export Specialist", "Freight Forwarder", "Shipping Officer",
      "Demand Planner", "Operations Specialist", "Operations Executive",
      "Operations Analyst", "Business Operations Specialist",
      "Process Improvement Specialist", "Project Coordinator", "Project Manager",
      "Program Manager", "PMO Analyst", "Implementation Specialist",
      "Onboarding Specialist", "Staff Gudang", "Staff Operasional", "Staff Purchasing",
      "Staff Logistik", "Manajer Operasional", "Manajer Proyek", "Kepala Gudang",
      "Supervisor Gudang", "Driver", "Kurir", "Teknisi",
    ],
  },
  {
    id: CAT.MANUFACTURING,
    roles: [
      "Mechanical Engineer", "Electrical Engineer", "Chemical Engineer",
      "Industrial Engineer", "Process Engineer", "Quality Control Inspector",
      "Quality Control Engineer", "Production Supervisor", "Production Operator",
      "Maintenance Engineer", "Maintenance Technician", "HSE Officer",
      "Health and Safety Officer", "Environmental Engineer", "Technician",
      "Field Engineer", "Production Planner", "Staff Produksi", "Kepala Produksi",
      "Supervisor Produksi", "Operator Produksi", "Operator Mesin", "Teknisi Mesin",
      "Quality Control", "Quality Assurance", "Environmental Compliance Specialist",
      "Junior Sustainability Analyst", "Sustainability Analyst",
    ],
  },
  {
    id: CAT.CONSTRUCTION,
    roles: [
      "Civil Engineer", "Site Engineer", "Project Engineer", "Construction Manager",
      "Quantity Surveyor", "Architect", "Property Agent", "Real Estate Agent",
      "Property Manager", "Leasing Consultant", "Facility Manager", "Building Manager",
    ],
  },
  {
    id: CAT.HEALTH,
    roles: [
      "Doctor", "General Practitioner", "Nurse", "Registered Nurse", "Pharmacist",
      "Medical Representative", "Clinical Research Associate", "Laboratory Technician",
      "Radiographer", "Physiotherapist", "Dentist", "Veterinarian", "Nutritionist",
      "Midwife", "Healthcare Administrator", "Medical Coder", "Perawat", "Apoteker",
    ],
  },
  {
    id: CAT.EDUCATION,
    roles: [
      "Teacher", "Lecturer", "Tutor", "Instructor", "Curriculum Developer",
      "Academic Coordinator", "School Principal", "Education Consultant",
      "Corporate Trainer", "Instructional Designer", "Guru", "Dosen",
    ],
  },
  {
    id: CAT.HOSPITALITY,
    roles: [
      "Hotel Manager", "Front Desk Agent", "Housekeeping Supervisor", "Chef",
      "Sous Chef", "Cook", "Barista", "Bartender", "Waiter", "Waitress",
      "Restaurant Manager", "Flight Attendant", "Travel Consultant", "Tour Guide",
      "Event Organizer", "Event Coordinator",
    ],
  },
  {
    id: CAT.RETAIL,
    roles: [
      "Retail Sales Associate", "Customer Success Manager", "Customer Success Specialist",
      "Customer Service Representative", "Customer Support Specialist",
      "Customer Care Officer", "Call Center Agent", "Contact Center Agent",
      "Store Manager", "Store Supervisor", "Cashier", "Merchandiser",
      "Visual Merchandiser", "E-commerce Specialist", "E-commerce Manager",
      "Marketplace Specialist", "Category Manager", "Inventory Planner",
      "Staff Customer Service", "Kasir", "Pramuniaga", "Kepala Toko",
      "Admin Toko", "Admin Marketplace", "Admin Online Shop",
    ],
  },
];

/** "Assistant Manager of Marketing" / "Marketing Manager" domain → category */
const DOMAIN_CATEGORY = {
  technology: CAT.IT,
  product: CAT.IT,
  engineering: CAT.IT,
  it: CAT.IT,
  data: CAT.IT,
  digital: CAT.IT,
  design: CAT.DESIGN,
  marketing: CAT.MARKETING,
  growth: CAT.MARKETING,
  sales: CAT.MARKETING,
  "business development": CAT.MARKETING,
  commercial: CAT.MARKETING,
  strategy: CAT.MARKETING,
  finance: CAT.FINANCE,
  legal: CAT.FINANCE,
  "human resources": CAT.HR,
  people: CAT.HR,
  operations: CAT.LOGISTICS,
  "supply chain": CAT.LOGISTICS,
  "customer success": CAT.RETAIL,
};

const MANAGEMENT_OF_RE =
  /^(Assistant Manager|Senior Manager|Manager|Director|Senior Director|Head|VP|Vice President|Chief|Coordinator|Supervisor|Team Lead)\s+of\s+(.+)$/i;

const DOMAIN_THEN_MGMT_RE =
  /^(.+?)\s+(Assistant Manager|Senior Manager|Manager|Director|Senior Director|Coordinator|Supervisor|Team Lead)$/i;

const CHIEF_DOMAIN_RE = /^Chief\s+(.+)$/i;
const HEAD_OF_RE = /^Head of\s+(.+)$/i;
const VP_OF_RE = /^(?:VP|Vice President)\s+(?:of\s+)?(.+)$/i;

function normalize(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

function stripSeniority(name) {
  let n = normalize(name);
  // Drop marketing suffixes: "QA Engineer (Manual & Automation)"
  n = n.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  n = n.replace(INTERN_FREELANCE_RE, "");
  // Leading "Intern X"
  n = n.replace(/^Intern\s+/i, "");
  for (let i = 0; i < 3; i += 1) {
    const next = n.replace(SENIORITY_RE, "");
    if (next === n) break;
    n = next;
  }
  // "Staff Software Engineer" → base role; keep "Staff IT" intact for domain map
  const staffM = n.match(/^Staff\s+(.+)$/i);
  if (staffM && matchBaseRole(staffM[1])) {
    n = staffM[1];
  }
  return n;
}

/** Longest base-role match (exact or as suffix after strip). */
function buildRoleIndex(groups) {
  const entries = [];
  for (const g of groups) {
    for (const role of g.roles) {
      entries.push({ role, lower: role.toLowerCase(), id: g.id });
    }
  }
  entries.sort((a, b) => b.lower.length - a.lower.length);
  return entries;
}

const ROLE_INDEX = buildRoleIndex(ROLE_GROUPS);

function matchBaseRole(coreName) {
  const lower = coreName.toLowerCase();
  for (const e of ROLE_INDEX) {
    if (lower === e.lower) return e.id;
    // "Senior Software Engineer" already stripped; also allow trailing match
    if (lower.endsWith(" " + e.lower)) return e.id;
  }
  return null;
}

function matchDomain(domainRaw) {
  const d = normalize(domainRaw).toLowerCase();
  if (DOMAIN_CATEGORY[d] !== undefined) return DOMAIN_CATEGORY[d];
  // partial
  for (const [key, id] of Object.entries(DOMAIN_CATEGORY)) {
    if (d.includes(key) || key.includes(d)) return id;
  }
  return null;
}

function matchManagementTitle(coreName) {
  let m = coreName.match(MANAGEMENT_OF_RE);
  if (m) return matchDomain(m[2]);

  m = coreName.match(HEAD_OF_RE);
  if (m) return matchDomain(m[1]);

  m = coreName.match(VP_OF_RE);
  if (m) return matchDomain(m[1]);

  m = coreName.match(CHIEF_DOMAIN_RE);
  if (m) return matchDomain(m[1]);

  m = coreName.match(DOMAIN_THEN_MGMT_RE);
  if (m) return matchDomain(m[1]);

  return null;
}

/** Last-resort keyword rules — ordered carefully; no IT dump. */
const FALLBACK_RULES = [
  { id: CAT.IT, patterns: [/\b(software|devops|backend|frontend|full[- ]?stack|cyber|saas|api)\b/i, /\b(developer|programmer|sdet)\b/i, /\b(cloud|solutions|system)\s+architect\b/i, /\bqa\s+engineer\b/i, /\bproduct\s+manager\b/i, /\bcybersecurity\b/i] },
  { id: CAT.HOSPITALITY, patterns: [/\b(hotel|chef|barista|bartender|flight attendant|housekeeping|restaurant|guest experience|cultural experience)\b/i] },
  { id: CAT.CONSTRUCTION, patterns: [/\b(civil engineer|quantity surveyor|construction|real estate|property|site engineer)\b/i, /^architect$/i] },
  { id: CAT.MANUFACTURING, patterns: [/\b(mechanical|electrical|chemical|industrial|process)\s+engineer\b/i, /\b(production|manufactur|quality control|hse|maintenance technician|operator produksi)\b/i] },
  { id: CAT.DESIGN, patterns: [/\b(ui\/?ux|ux designer|ui designer|graphic design|product designer|motion design|3d artist|illustrat)\b/i] },
  { id: CAT.MARKETING, patterns: [/\b(marketing|seo|sem|brand manager|sales executive|business development|account executive)\b/i] },
  { id: CAT.HR, patterns: [/\b(human resources|\bhr\b|recruiter|payroll|talent acquisition|personalia|general manager|founder|co-founder|country manager)\b/i] },
  { id: CAT.FINANCE, patterns: [/\b(accountan|finance|auditor|tax |banking|teller|credit officer|insurance)\b/i] },
  { id: CAT.HEALTH, patterns: [/\b(nurse|doctor|pharmacist|apoteker|perawat|dentist|midwife|physician)\b/i] },
  { id: CAT.EDUCATION, patterns: [/\b(teacher|lecturer|tutor|dosen|guru|instructor|curriculum)\b/i] },
  { id: CAT.RETAIL, patterns: [/\b(cashier|kasir|store manager|e-?commerce|marketplace|pramuniaga|merchandis)\b/i] },
  { id: CAT.LOGISTICS, patterns: [/\b(logistics?|warehouse|gudang|procurement|purchasing|kurir|driver|supply chain)\b/i] },
];

function matchFallback(coreName) {
  for (const rule of FALLBACK_RULES) {
    if (rule.patterns.some((re) => re.test(coreName))) return rule.id;
  }
  return null;
}

function classify(name) {
  const core = stripSeniority(name);
  const coreLower = core.toLowerCase();

  if (CXO_CATEGORY[coreLower] !== undefined) {
    return { category_id: CXO_CATEGORY[coreLower], via: "cxo" };
  }

  // "Staff IT", "Staff Marketing", etc. after stripping Associate/Entry-Level
  const staffDomain = core.match(/^Staff\s+(.+)$/i);
  if (staffDomain) {
    const domainMap = {
      it: CAT.IT,
      accounting: CAT.FINANCE,
      finance: CAT.FINANCE,
      marketing: CAT.MARKETING,
      sales: CAT.MARKETING,
      content: CAT.MARKETING,
      hr: CAT.HR,
      administrasi: CAT.HR,
      "customer service": CAT.RETAIL,
      gudang: CAT.LOGISTICS,
      logistik: CAT.LOGISTICS,
      operasional: CAT.LOGISTICS,
      purchasing: CAT.LOGISTICS,
      produksi: CAT.MANUFACTURING,
    };
    const key = staffDomain[1].toLowerCase();
    if (domainMap[key] !== undefined) {
      return { category_id: domainMap[key], via: "staff_domain" };
    }
  }

  // Indonesian management titles: Manajer Produk, Manajer SDM, …
  const idMgr = core.match(/^Manajer\s+(.+)$/i);
  if (idMgr) {
    const idMap = {
      produk: CAT.IT,
      operasional: CAT.LOGISTICS,
      pemasaran: CAT.MARKETING,
      penjualan: CAT.MARKETING,
      keuangan: CAT.FINANCE,
      sdm: CAT.HR,
      proyek: CAT.LOGISTICS,
    };
    const key = idMgr[1].toLowerCase();
    if (idMap[key] !== undefined) {
      return { category_id: idMap[key], via: "id_manager" };
    }
  }

  const fromRole = matchBaseRole(core);
  if (fromRole) return { category_id: fromRole, via: "base_role" };

  const fromMgmt = matchManagementTitle(core);
  if (fromMgmt) return { category_id: fromMgmt, via: "domain_mgmt" };

  const fromFb = matchFallback(core);
  if (fromFb) return { category_id: fromFb, via: "fallback" };

  // Truly unknown — Operations/admin-ish default is better than IT dump
  return { category_id: CAT.LOGISTICS, via: "default_ops" };
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT id, name, category_id
      FROM job_titles
      WHERE deleted_at IS NULL
      ORDER BY name
    `);

    const viaCounts = {};
    const dist = {};
    const updates = new Map();
    let changed = 0;

    const samplesByVia = { default_ops: [], fallback: [] };

    for (const row of rows) {
      const { category_id, via } = classify(row.name);
      viaCounts[via] = (viaCounts[via] || 0) + 1;
      dist[category_id] = (dist[category_id] || 0) + 1;
      if ((via === "default_ops" || via === "fallback") && samplesByVia[via].length < 25) {
        samplesByVia[via].push(row.name);
      }
      if (Number(row.category_id) === category_id) continue;
      changed += 1;
      if (!updates.has(category_id)) updates.set(category_id, []);
      updates.get(category_id).push(row.id);
    }

    console.log({
      total: rows.length,
      to_update: changed,
      dry_run: DRY_RUN,
      via: viaCounts,
      projected_distribution: dist,
      sample_default_ops: samplesByVia.default_ops,
      sample_fallback: samplesByVia.fallback.slice(0, 15),
    });

    // Spot-check known bug cases
    const checks = [
      "Software Architect",
      "Cloud Architect",
      "Architect",
      "QA Engineer",
      "Quality Assurance",
      "Account Manager",
      "Flight Attendant",
      "Kurir",
      "Assistant Manager of Design",
      "Assistant Manager of Legal",
      "Copywriter",
      "Civil Engineer",
    ];
    console.log(
      "spot checks:",
      checks.map((n) => {
        const r = classify(n);
        return `${n} → ${r.category_id} (${r.via})`;
      })
    );

    if (DRY_RUN) {
      console.log("Dry run — no writes.");
      return;
    }

    await client.query("BEGIN");
    for (const [categoryId, ids] of updates.entries()) {
      const chunkSize = 500;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await client.query(
          `UPDATE job_titles
           SET category_id = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[])`,
          [categoryId, chunk]
        );
      }
      console.log(`updated ${ids.length} → category_id=${categoryId}`);
    }
    await client.query("COMMIT");

    const stats = await client.query(`
      SELECT category_id, COUNT(*)::int AS n
      FROM job_titles
      WHERE deleted_at IS NULL
      GROUP BY category_id
      ORDER BY category_id NULLS FIRST
    `);
    console.log("final distribution:", stats.rows);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
