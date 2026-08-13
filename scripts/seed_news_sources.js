/**
 * Optional helper: refresh editorial news seeds from curated public sources.
 * Prefer running SQL migration 028 for deterministic seeding.
 *
 * Usage (after 027+028 schema):
 *   node scripts/seed_news_sources.js
 *
 * This script does NOT copy full copyrighted articles; it only verifies that
 * curated source URLs in migration 028 are still reachable (HEAD/GET check).
 */
require("dotenv").config();
const axios = require("axios");

const SOURCES = [
  "https://money.kompas.com/read/2025/12/23/060000426/survei--2026-rata-rata-gaji-karyawan-indonesia-bakal-naik-5-8-persen",
  "https://lestari.kompas.com/read/2026/03/09/112726886/5-tips-membuat-resume-lamaran-kerja-pada-era-ai",
  "https://buku.kompas.com/read/6051/berapa-gaji-software-engineer-dan-programmer-2026",
  "https://money.kompas.com/read/2025/08/26/110800126/20-pekerjaan-remote-paling-dicari-tahun-2025-tren-kerja-jarak-jauh-makin",
  "https://baihaqyizy.com/cara-cari-kerja-2026-platform-cv-tips/",
  "https://kiakrikil.com/loker-rekrutmen-bersama-bumn-rbb-2026/",
  "https://biz.kompas.com/read/2025/12/23/080000528/mercer-indonesia-proyeksikan-kenaikan-gaji-2026-capai-5-8-persen-pay-equity-dan",
  "https://listrikindonesia.com/detail/20461/transisi-energi-buka-16-juta-lowongan-pekerjaan-ini-profesi-yang-paling-dicari",
  "https://www.tribunnews.com/nasional/7856193/pertamina-buka-magang-nasional-2026-untuk-fresh-graduate-cek-syarat-dan-cara-daftarnya",
  "https://www.medcom.id/pendidikan/jobseeker/ob3yLVXK-brin-buka-magang-nasional-kemnaker-2026-untuk-fresh-graduate-d4-s1-cek-formasi-dan-cara-daftarnya",
  "https://umum.energika.id/detail/54090/kemkomdigi-bp-bumn-siapkan-jalur-karier-talenta-ai-indonesia",
  "https://kiakrikil.com/fresh-graduate-posisi-paling-banyak-dibuka-linkedin/",
];

async function check(url) {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { "User-Agent": "cari-kerja-news-seed-check/1.0" },
    });
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return { url, status: 0, ok: false, error: err.message };
  }
}

(async () => {
  console.log("Checking curated news source URLs (editorial seed references)...\n");
  const results = [];
  for (const url of SOURCES) {
    const r = await check(url);
    results.push(r);
    console.log(`${r.ok ? "OK " : "FAIL"} ${r.status || "ERR"} ${url}${r.error ? " — " + r.error : ""}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} reachable`);
  if (failed.length) {
    console.log("Some sources failed — seed SQL still valid as historical editorial summaries.");
    process.exitCode = 0;
  }
})();
