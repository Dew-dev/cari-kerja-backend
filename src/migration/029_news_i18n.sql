-- ============================================================
-- News i18n: translation child tables (id + en, extensible)
-- Requires: 027_add_news.sql (and ideally 028 seed already applied)
-- ============================================================

CREATE TABLE IF NOT EXISTS news_category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_news_category_translations_locale UNIQUE (category_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_news_category_translations_locale_slug
    ON news_category_translations (locale, slug);

CREATE TABLE IF NOT EXISTS news_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL,
    excerpt TEXT,
    body TEXT NOT NULL,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_news_translations_locale UNIQUE (news_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_news_translations_locale_slug
    ON news_translations (locale, slug);

-- Move existing monolingual content → locale 'id'
INSERT INTO news_category_translations (category_id, locale, name, slug, created_at, updated_at)
SELECT id, 'id', name, slug, created_at, updated_at
FROM news_categories
WHERE deleted_at IS NULL
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO news_translations (
  news_id, locale, title, slug, excerpt, body, meta_title, meta_description, created_at, updated_at
)
SELECT id, 'id', title, slug, excerpt, body, meta_title, meta_description, created_at, updated_at
FROM news
WHERE deleted_at IS NULL
ON CONFLICT (news_id, locale) DO NOTHING;

-- Drop old indexes that depend on text columns
DROP INDEX IF EXISTS uq_news_categories_slug_active;
DROP INDEX IF EXISTS uq_news_slug_active;

-- Drop monolingual text columns from parent tables
ALTER TABLE news_categories
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS slug;

ALTER TABLE news
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS excerpt,
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS meta_title,
  DROP COLUMN IF EXISTS meta_description;

-- ── English category translations (seed IDs from 028; skip if missing) ────
INSERT INTO news_category_translations (category_id, locale, name, slug, created_at, updated_at)
SELECT v.category_id::uuid, 'en', v.name, v.slug, NOW(), NOW()
FROM (
  VALUES
    ('a1000001-0001-4000-8000-000000000001', 'Career Tips', 'career-tips'),
    ('a1000001-0001-4000-8000-000000000002', 'Interview Tips', 'interview-tips'),
    ('a1000001-0001-4000-8000-000000000003', 'CV & Resume', 'cv-and-resume'),
    ('a1000001-0001-4000-8000-000000000004', 'Industry Trends', 'industry-trends'),
    ('a1000001-0001-4000-8000-000000000005', 'Salary & Compensation', 'salary-and-compensation'),
    ('a1000001-0001-4000-8000-000000000006', 'Remote & Hybrid', 'remote-and-hybrid'),
    ('a1000001-0001-4000-8000-000000000007', 'Technology & Digital', 'technology-and-digital'),
    ('a1000001-0001-4000-8000-000000000008', 'SOE Recruitment', 'soe-recruitment'),
    ('a1000001-0001-4000-8000-000000000009', 'Fresh Graduates', 'fresh-graduates'),
    ('a1000001-0001-4000-8000-000000000010', 'Soft Skills', 'soft-skills'),
    ('a1000001-0001-4000-8000-000000000011', 'HR & Leadership', 'hr-and-leadership'),
    ('a1000001-0001-4000-8000-000000000012', 'Entrepreneurship', 'entrepreneurship'),
    ('a1000001-0001-4000-8000-000000000013', 'Workplace Wellness', 'workplace-wellness'),
    ('a1000001-0001-4000-8000-000000000014', 'Financial Industry', 'financial-industry'),
    ('a1000001-0001-4000-8000-000000000015', 'Manufacturing Industry', 'manufacturing-industry'),
    ('a1000001-0001-4000-8000-000000000016', 'Healthcare Industry', 'healthcare-industry'),
    ('a1000001-0001-4000-8000-000000000017', 'Education Industry', 'education-industry'),
    ('a1000001-0001-4000-8000-000000000018', 'Green Jobs', 'green-jobs'),
    ('a1000001-0001-4000-8000-000000000019', 'Internships & Trainee', 'internships-and-trainee'),
    ('a1000001-0001-4000-8000-000000000020', 'Global Opportunities', 'global-opportunities')
) AS v(category_id, name, slug)
INNER JOIN news_categories c ON c.id = v.category_id::uuid AND c.deleted_at IS NULL
ON CONFLICT (category_id, locale) DO NOTHING;

-- ── English article translations (seed IDs from 028; skip if missing) ─────
INSERT INTO news_translations (
  news_id, locale, title, slug, excerpt, body, meta_title, meta_description, created_at, updated_at
)
SELECT v.news_id, v.locale, v.title, v.slug, v.excerpt, v.body, v.meta_title, v.meta_description, v.created_at, v.updated_at
FROM (VALUES
  (
    'b2000001-0001-4000-8000-000000000001'::uuid,
    'en',
    'Indonesia Salary Outlook 2026: 5.8% Rise According to Mercer',
    'indonesia-salary-outlook-2026-mercer',
    'Mercer projects average employee salary increases in Indonesia of around 5.8% in 2026, with pay equity and total rewards as competitiveness drivers.',
    $enbody0$<p>According to Mercer Indonesia Total Remuneration Survey (TRS), average salary increases in 2026 are projected at about <strong>5.8 percent</strong>. The figure is slightly lower than the prior-year projection, yet nearly all surveyed companies still plan to raise pay.</p>
<p>Key drivers include individual performance, salary ranges, and company performance. Chemicals is among the more optimistic industries, while sectors such as automotive tend to be more moderate.</p>
<p>Other findings: many companies are revisiting remote/hybrid policies for collaboration and culture, and adjusting WFH-era benefits toward alternatives such as transportation support.</p>
<p><em>Editorial summary based on publicly reported survey coverage.</em></p>$enbody0$,
    'Indonesia Salary Outlook 2026 | Mercer TRS',
    'Summary of Mercer projected 5.8% salary increase in Indonesia for 2026.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000002'::uuid,
    'en',
    '5 Resume Tips for the AI Era to Pass ATS Screens',
    '5-resume-tips-ai-era-pass-ats',
    'Most recruiters use ATS. Lead with core skills, show measurable impact, and prioritize the last 7–10 years of experience.',
    $enbody1$<p>In the age of AI and automated hiring, a resume is more than a work history list. Around <strong>76% of recruiters</strong> are reported to use an Applicant Tracking System (ATS) to filter candidates by skills.</p>
<ol>
<li><strong>Lead with skills, not only job titles</strong> — list 6–8 core skills near the top.</li>
<li><strong>Show impact with numbers</strong> — each bullet should answer what outcome you delivered.</li>
<li><strong>Drop irrelevant points</strong> — prioritize the last 7–10 years.</li>
<li><strong>Avoid empty clichés</strong> — soft claims need concrete examples.</li>
<li><strong>Align with the job description</strong> — keywords help you pass ATS filters.</li>
</ol>
<p><em>Editorial summary for Cari Kerja readers.</em></p>$enbody1$,
    'Resume Tips for AI & ATS',
    'Five tips to build an ATS-friendly resume in the AI era.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000003'::uuid,
    'en',
    'Software Engineer and Programmer Salaries in Indonesia 2026',
    'software-engineer-programmer-salaries-indonesia-2026',
    'Indicative junior-to-senior salary ranges for programmers and software engineers in Indonesia in 2026, plus factors that raise offers.',
    $enbody2$<p>Tech roles remain attractive thanks to broad opportunities, remote options, and competitive pay bands. Indicative Indonesia market ranges around 2026:</p>
<ul>
<li><strong>Junior (0–2 years)</strong> — Programmer ~IDR 5–9M; Software Engineer ~IDR 7–12M.</li>
<li><strong>Mid (3–5 years)</strong> — Programmer ~IDR 10–18M; Software Engineer ~IDR 12–25M.</li>
<li><strong>Senior (5+ years)</strong> — Programmer ~IDR 20–30M; Software Engineer ~IDR 30–50M+.</li>
</ul>
<p>Beyond coding, pay premiums often come from business understanding, architecture quality, and clear communication with non-technical stakeholders.</p>
<p><em>Editorial summary; figures are market estimates cited in media.</em></p>$enbody2$,
    'Software Engineer & Programmer Salaries 2026',
    'Indicative salary ranges for programmers and software engineers in Indonesia 2026.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000004'::uuid,
    'en',
    '20 In-Demand Remote Jobs: The Remote Work Trend',
    '20-in-demand-remote-jobs-remote-work-trend',
    'Remote demand remains strong. Engineering, business development, data entry, and customer service rank among the most needed fields.',
    $enbody3$<p>Remote work remains popular after the pandemic. Flexibility continues to matter for many professionals, with remote openings growing year over year.</p>
<p>High-growth remote areas include engineering, business development, data entry, communications, client services, sales, product, plus administrative and creative roles.</p>
<p>For job seekers in Indonesia, this means more hybrid/remote options—while some companies rebalance toward on-site collaboration needs.</p>
<p><em>Editorial summary based on publicly reported coverage.</em></p>$enbody3$,
    'Most In-Demand Remote Jobs',
    'Remote fields in high demand and the flexibility trend at work.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000005'::uuid,
    'en',
    'Job Hunting in 2026: Platforms, ATS CVs, and Interview Strategy',
    'job-hunting-2026-platforms-ats-cv-interview',
    'Job platforms are increasingly AI-driven. Optimize JobStreet, Glints, and LinkedIn; prepare an ATS-friendly CV; and differentiate HR vs hiring-manager interviews.',
    $enbody4$<p>Job search in 2026 leans more on algorithm fit and professional networks:</p>
<ul>
<li><strong>JobStreet</strong> — large volume; complete your profile and use salary filters.</li>
<li><strong>Glints</strong> — strong in startup/tech, often more transparent on pay.</li>
<li><strong>LinkedIn</strong> — optimize headline, Open to Work, and content so headhunters find you.</li>
</ul>
<p>Separate HR interviews from user interviews. Prepare answers with real examples and measurable results.</p>
<p><em>Editorial career tips summary.</em></p>$enbody4$,
    'Job Hunting Guide 2026',
    'A practical guide to platforms, ATS CVs, and interview tips for 2026.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000006'::uuid,
    'en',
    'Joint SOE Recruitment (RBB) 2026: Timeline, Requirements, and Tips',
    'joint-soe-recruitment-rbb-2026-timeline-tips',
    'Watch the FHCI portal for RBB batches. Prepare documents, practice aptitude/AKHLAK material, and use STAR for interviews.',
    $enbody5$<p>Joint SOE Recruitment (RBB) managed via FHCI is a common pathway into many state-owned enterprises.</p>
<ol>
<li>Monitor the official site rekrutmenbersama.fhcibumn.id.</li>
<li>Prepare an ATS-friendly CV and documents.</li>
<li>Practice aptitude tests and AKHLAK core values.</li>
<li>Interview with STAR stories and research your target SOE.</li>
</ol>
<p><em>Schedules are historical patterns only; always verify official announcements.</em></p>$enbody5$,
    'RBB SOE 2026: Tips & Timeline',
    'Guide to Indonesia joint SOE recruitment 2026: official portal, selection, and tips.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000007'::uuid,
    'en',
    'Effective Job Applications: Networks, Multi-Platform, and Job Fairs',
    'effective-job-applications-networks-multi-platform-job-fairs',
    'Many roles are never posted publicly. Expand your network, apply across platforms, and use job fairs and walk-in interviews.',
    $enbody6$<p>Applying is more than a polished CV. Some opportunities circulate only through referrals or professional networks.</p>
<ul>
<li>Strengthen networks (LinkedIn, industry communities, alumni).</li>
<li>Do not rely on one portal — combine multiple job channels.</li>
<li>Attend job fairs / walk-ins to meet HR and learn culture firsthand.</li>
<li>Research reputation and career paths before accepting offers.</li>
</ul>
<p><em>Editorial summary of practical application tips.</em></p>$enbody6$,
    'Effective Job Application Tips',
    'Strategies for applying via networks, multiple platforms, and job fairs.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000008'::uuid,
    'en',
    'Soft Skills Recruiters Want: Communication, Adaptability, Problem Solving',
    'soft-skills-recruiters-want-communication-adaptability-problem-solving',
    'Beyond hard skills, recruiters assess collaboration, cross-functional communication, and problem solving with real examples.',
    $enbody7$<p>In a fast-changing job market, soft skills often differentiate candidates with similar hard skills.</p>
<ul>
<li><strong>Communication</strong> — explain ideas to technical and non-technical teammates.</li>
<li><strong>Adaptability</strong> — learn new tools and adjust to hybrid/remote ways of working.</li>
<li><strong>Problem solving</strong> — describe situation, action, and result (STAR).</li>
</ul>
<p>List soft skills on your CV with brief proof, not adjectives alone.</p>
<p><em>Cari Kerja editorial article.</em></p>$enbody7$,
    'Soft Skills to Pass Screening',
    'Soft skills recruiters look for and how to show them on a CV.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000009'::uuid,
    'en',
    'Fresh Graduates 2026: Building a Portfolio Before Formal Work Experience',
    'fresh-graduates-2026-portfolio-before-work-experience',
    'Without formal experience, project portfolios, internships, and community contributions can still convince recruiters.',
    $enbody8$<p>Fresh graduates often worry about lacking work experience. Recruiters still value proof of capability:</p>
<ul>
<li>Finished coursework / bootcamp projects you can demo.</li>
<li>Internships, small freelance, or volunteer work with clear ownership.</li>
<li>Relevant certifications (selective, role-aligned).</li>
<li>Achievements summarized with simple metrics.</li>
</ul>
<p>Pair this with an ATS-friendly CV and a consistent LinkedIn profile.</p>
<p><em>Cari Kerja editorial for fresh graduates.</em></p>$enbody8$,
    'Fresh Graduate Tips 2026',
    'How fresh graduates can build a portfolio and competitiveness before formal experience.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000010'::uuid,
    'en',
    'Workplace Trends: AI, Pay Equity, and Hybrid Adjustments',
    'workplace-trends-ai-pay-equity-hybrid',
    'Companies balance pay competitiveness, compensation fairness, and on-site collaboration needs after prolonged WFH.',
    $enbody9$<p>Trends appearing in industry and remuneration surveys:</p>
<ul>
<li><strong>AI in hiring &amp; productivity</strong> — ATS and AI tools speed screening.</li>
<li><strong>Pay equity</strong> — fairness audits matter more for retention.</li>
<li><strong>More deliberate hybrid</strong> — organizations revisit fully remote setups without removing flexibility entirely.</li>
<li><strong>Total rewards</strong> — mental health, financial wellness, and career paths differentiate employers.</li>
</ul>
<p><em>Editorial trend summary.</em></p>$enbody9$,
    'Workplace & HR Trends',
    'AI, pay equity, and hybrid adjustments as workplace trends.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000011'::uuid,
    'en',
    'Green Jobs 2026: Energy Transition Opens Millions of Career Paths',
    'green-jobs-2026-energy-transition-career-paths',
    'The low-carbon energy transition is projected to create millions of green jobs. Roles like energy auditor, carbon analyst, and ESG specialist are in rising demand.',
    $enbody10$<p>Industry coverage has cited potential for around <strong>16.6 million</strong> green jobs globally by 2026 as economies move toward lower carbon.</p>
<ul>
<li>Energy Auditor</li>
<li>Carbon Analyst &amp; ESG Specialist</li>
<li>Renewable Energy Engineer</li>
<li>REC / Carbon Market Trader</li>
<li>Sustainability Consultant</li>
<li>Green Data Center Engineer</li>
</ul>
<p>Relevant certifications and energy-sector internships can differentiate candidates.</p>
<p><em>Editorial summary based on energy-industry coverage.</em></p>$enbody10$,
    'Green Jobs & Energy Transition 2026',
    'Green job opportunities from the energy transition: auditors, ESG, renewable engineers.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000012'::uuid,
    'en',
    'National Internship 2026: Pertamina & BRIN Openings for Fresh Graduates',
    'national-internship-2026-pertamina-brin-fresh-graduates',
    'The National Internship Program via Magang Hub / SIAPkerja offers incentivized experience pathways at Pertamina, BRIN, and partners.',
    $enbody11$<p>National Internship Program (PMN) 2026 again opens incentivized placements at strategic organizations including <strong>Pertamina</strong> and <strong>BRIN</strong>.</p>
<ol>
<li>Create/complete an account on <strong>SIAPkerja</strong>.</li>
<li>Apply via <strong>Magang Hub</strong> for open formations.</li>
<li>Prepare documents and confirm graduation-window eligibility.</li>
</ol>
<p>Common benefits: stipend, social security, mentors, and competency certification. Always verify official schedules and quotas.</p>
<p><em>Editorial internship summary.</em></p>$enbody11$,
    'National Internship 2026 Pertamina & BRIN',
    'Short guide to National Internship 2026: SIAPkerja, Magang Hub, Pertamina, and BRIN.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000013'::uuid,
    'en',
    'AI Talent Career Paths: Kemkomdigi & BP BUMN Build a Talent Pool',
    'ai-talent-career-paths-kemkomdigi-bp-bumn',
    'AI Talent Factory is being integrated with an SOE talent pool so training graduates can join digital transformation projects.',
    $enbody12$<p>Kemkomdigi and the SOE managing body are designing AI career pathways by integrating <strong>AI Talent Factory</strong> with an SOE talent pool.</p>
<p>The model aims to move AI training beyond the classroom into real SOE projects by sector need.</p>
<p>For tech job seekers: AI talent programs, project portfolios, and applying AI to business use cases matter as much as basic coding.</p>
<p><em>Editorial summary of national AI career opportunities.</em></p>$enbody12$,
    'AI Talent Careers in Indonesia',
    'Kemkomdigi–BP BUMN collaboration for AI talent pathways and absorption.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000014'::uuid,
    'en',
    'Fresh Graduates on LinkedIn: Most Open Entry-Level Roles',
    'fresh-graduates-linkedin-most-open-entry-level-roles',
    'Admin, customer service, sales, IT support, and digital marketing dominate entry-level openings for new graduates on LinkedIn Indonesia.',
    $enbody13$<p>Based on LinkedIn Jobs Indonesia trends, common entry-level openings for fresh graduates include:</p>
<ul>
<li><strong>Administration</strong> — daily operations.</li>
<li><strong>Customer service</strong> — strong in e-commerce and startups.</li>
<li><strong>Sales / sales associate</strong> — target-oriented with commission.</li>
<li><strong>IT support</strong> — demand grows with digitalization.</li>
<li><strong>Digital marketing / content</strong> — brand expansion on digital channels.</li>
</ul>
<p>Tips: complete your LinkedIn profile, enable Open to Work, and align CV keywords with job posts.</p>
<p><em>Editorial summary of entry-level hiring trends.</em></p>$enbody13$,
    'Fresh Graduate Roles on LinkedIn',
    'Entry-level roles frequently opened for fresh graduates on LinkedIn.',
    NOW(),
    NOW()
  ),
  (
    'b2000001-0001-4000-8000-000000000015'::uuid,
    'en',
    'Careers in Financial Services: Banking Growth and Digital Talent Demand',
    'careers-financial-services-banking-digital-talent',
    'Credit growth and digital financial services drive demand for talent in risk, compliance, data, and digital banking product roles.',
    $enbody14$<p>Financial services remain a major employer. Credit growth and digital channel expansion drive demand beyond traditional teller roles:</p>
<ul>
<li>Risk and compliance analysts</li>
<li>Data analysts / engineers for scoring and fraud</li>
<li>Product and UX for mobile banking</li>
<li>Relationship managers for retail/corporate segments</li>
</ul>
<p>For non-finance backgrounds, basic regulatory literacy, relevant certifications, and data/tool skills often open doors faster.</p>
<p><em>Cari Kerja editorial.</em></p>$enbody14$,
    'Careers in Financial Services',
    'Career paths in banking and digital finance: risk, data, product, and RM.',
    NOW(),
    NOW()
  )
) AS v(news_id, locale, title, slug, excerpt, body, meta_title, meta_description, created_at, updated_at)
INNER JOIN news n ON n.id = v.news_id AND n.deleted_at IS NULL
ON CONFLICT (news_id, locale) DO NOTHING;
