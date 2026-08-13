/**
 * Remap existing job_posts.category_id from title heuristics.
 * Does NOT delete any job posts.
 *
 * Usage: DATABASE_URL=... node scripts/remap_job_post_categories.js
 */
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Seeded category ids from 033_category_i18n.sql
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

const RULES = [
  {
    id: CAT.MARKETING,
    patterns: [/\bmarketing\b/i, /\bsales executive\b/i, /\badvertising\b/i],
  },
  {
    id: CAT.HOSPITALITY,
    patterns: [
      /\bhotel\b/i,
      /\bresort\b/i,
      /\bhousekeeping\b/i,
      /\bfront office\b/i,
      /\bguest experience\b/i,
      /\bchef\b/i,
      /\bcultural experience\b/i,
      /\bmice\b/i,
      /\bhospitality\b/i,
    ],
  },
  {
    id: CAT.DESIGN,
    patterns: [/\bproduct designer\b/i, /\bui\/?ux\b/i, /\bgraphic designer\b/i],
  },
  {
    id: CAT.MANUFACTURING,
    patterns: [
      /\bmanufacturing\b/i,
      /\bproduction planner\b/i,
      /\boptical\b/i,
      /\boptics\b/i,
      /\benergy project\b/i,
      /\benvironmental compliance\b/i,
      /\bsustainability\b/i,
    ],
  },
  {
    id: CAT.IT,
    patterns: [
      /\bengineer\b/i,
      /\bdeveloper\b/i,
      /\bdevops\b/i,
      /\bcloud\b/i,
      /\bqa\b/i,
      /\bcybersecurity\b/i,
      /\bbackend\b/i,
      /\bfrontend\b/i,
      /\bfull stack\b/i,
      /\barchitect\b/i,
    ],
  },
  {
    id: CAT.HR,
    patterns: [/\bhr\b/i, /\bhuman resources?\b/i, /\brecruiter\b/i],
  },
  {
    id: CAT.FINANCE,
    patterns: [/\bfinance\b/i, /\baccount\b/i, /\bbank\b/i],
  },
  {
    id: CAT.HEALTH,
    patterns: [/\bnurse\b/i, /\bdoctor\b/i, /\bmedical\b/i, /\bpharmacy\b/i],
  },
  {
    id: CAT.EDUCATION,
    patterns: [/\bteacher\b/i, /\blecturer\b/i, /\btrainer\b/i],
  },
  {
    id: CAT.LOGISTICS,
    patterns: [/\blogistics\b/i, /\bwarehouse\b/i, /\bshipping\b/i],
  },
  {
    id: CAT.CONSTRUCTION,
    patterns: [/\bconstruction\b/i, /\bcivil engineer\b/i],
  },
  {
    id: CAT.RETAIL,
    patterns: [/\be-?commerce\b/i, /\bretail\b/i, /\bstore manager\b/i],
  },
];

function inferCategoryId(title) {
  const text = String(title || "");
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) return rule.id;
  }
  return CAT.IT;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });
  await client.connect();
  try {
    const posts = await client.query(
      `SELECT id, title, category_id FROM job_posts ORDER BY created_at DESC`
    );

    let changed = 0;
    for (const post of posts.rows) {
      const nextId = inferCategoryId(post.title);
      if (Number(post.category_id) === nextId) {
        console.log(`KEEP  [${post.category_id}] ${post.title}`);
        continue;
      }
      await client.query(
        `UPDATE job_posts SET category_id = $1, updated_at = NOW() WHERE id = $2`,
        [nextId, post.id]
      );
      changed += 1;
      console.log(`MAP   [${post.category_id} -> ${nextId}] ${post.title}`);
    }

    const summary = await client.query(`
      SELECT
        j.category_id,
        ct.name AS category_name,
        COUNT(*)::int AS n
      FROM job_posts j
      LEFT JOIN category_translations ct
        ON ct.category_id = j.category_id AND ct.locale = 'id'
      GROUP BY j.category_id, ct.name
      ORDER BY j.category_id
    `);

    console.log(`Updated ${changed}/${posts.rows.length} job posts`);
    console.log("Distribution:", summary.rows);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
