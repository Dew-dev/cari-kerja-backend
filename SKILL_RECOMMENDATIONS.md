# Job Recommendations by Worker Skills

## Fitur Baru
Fitur ini membuat job recommendation menjadi optional behavior. Secara default rekomendasi **AKTIF** ketika worker sudah memiliki skills, tetapi bisa di-disable jika ingin mencari job lain.

## Parameter Kontrol

**Query Parameter**: `recommendations` (boolean)

- `recommendations=true` (default) - Aktifkan skill-based recommendations jika worker punya skills
- `recommendations=false` - Tampilkan semua job, abaikan skill filter (pencarian umum)

## Bagaimana Cara Kerjanya

### Default Behavior (recommendations=true)
1. **Ketika Worker Memiliki Skills**
   - System otomatis mengambil semua skills dari worker
   - Hanya menampilkan job POST yang memiliki setidaknya 1 skill yang MATCH dengan skills worker
   - Hasil disort berdasarkan `skill_match_count DESC` - job dengan skill match terbanyak muncul paling atas

2. **Ketika Worker TIDAK Memiliki Skills**
   - Perilaku tetap sama - semua job ditampilkan

### Alternative Behavior (recommendations=false)
- Semua job ditampilkan tanpa filter skill
- User bisa mencari job apapun sesuai kriteria lain (lokasi, salary, kategori, dll)
- Sangat berguna untuk explore job diluar expertise mereka

## Implementasi Detail

### Modified Files
- `src/modules/job_posts/repositories/queries/domain.js`

### Perubahan di `domain.js`

#### 1. Import WorkerSkillsQuery
```javascript
const WorkerSkillsQuery = require("../../../worker-skills/repositories/queries/query");
```

#### 2. Inisialisasi di Constructor
```javascript
constructor(db) {
  this.query = new Query(db);
  this.workerSkillsQuery = new WorkerSkillsQuery(db);
}
```

#### 3. Logic Filter di `getJobPostsLogic`
Ketika `user_id` disediakan (worker sudah login):
```javascript
// 🎯 Filter jobs by matching skills (Recommendations) when worker has skills
if (user_id !== undefined && user_id !== null && user_id !== "") {
  try {
    const workerSkillsResult = await this.workerSkillsQuery.getAllByWorkerId(user_id);
    
    if (!workerSkillsResult.err && workerSkillsResult.data && workerSkillsResult.data.length > 0) {
      // Worker has skills, so filter to only show jobs that have at least one matching skill
      const skillIds = workerSkillsResult.data.map(skill => skill.skill_id);
      
      // Build condition to show only jobs that have at least one skill match
      conditions.push(` AND EXISTS (
        SELECT 1 FROM job_post_skills jps_filter
        WHERE jps_filter.job_post_id = j.id 
        AND jps_filter.skill_id = ANY($${idx}::uuid[])
      )`);
      values.push(skillIds);
      idx += 1;
    }
  } catch (error) {
    logger.error(ctx, "getJobPostsLogic", "Error fetching worker skills", error);
  }
}
```

## SQL Query yang Digunakan

Kondisi yang ditambahkan:
```sql
AND EXISTS (
  SELECT 1 FROM job_post_skills jps_filter
  WHERE jps_filter.job_post_id = j.id 
  AND jps_filter.skill_id = ANY($${idx}::uuid[])
)
```

Ini memastikan hanya job yang mengandung setidaknya 1 skill dari worker yang ditampilkan.

## Sorting

Query tetap menggunakan sorting:
```sql
ORDER BY ${user_id ? 'skill_match_count DESC,' : ''} ${orderColumn} ${orderDirection}
```

Sehingga job dengan lebih banyak skill match akan muncul di paling atas (recommendations terbaik).

## API Endpoints yang Terdampak

### `/api/v1/job-posts` (GET)

**Query Parameter Baru**: `recommendations` (default: true)

**Dengan recommendations=true (default)**
```bash
GET /api/v1/job-posts?recommendations=true
Headers: Authorization: Bearer {token_worker}
```
- Jika worker punya skills → tampilkan job recommendations (filtered by skill match)
- Jika worker tanpa skills → tampilkan semua job

**Dengan recommendations=false**
```bash
GET /api/v1/job-posts?recommendations=false
Headers: Authorization: Bearer {token_worker}
```
- Tampilkan SEMUA job, tanpa filter skill
- Cocok untuk mencari job di luar expertise mereka

**Tanpa token (semua parameter diabaikan)**
```bash
GET /api/v1/job-posts
```
- Tetap menampilkan semua job seperti sebelumnya

### Other Endpoints
- `/api/v1/job-posts/:id` - tidak terdampak (fetch single job)
- `/api/v1/recruiters/:recruiter_id/job-posts` - tidak terdampak
- `/api/v1/job-posts/applied/self` - tidak terdampak (lihat applied jobs)

## Contoh Skenario

### Skenario 1: Worker dengan Skills + recommendations=true (REKOMENDASI AKTIF)
**Kondisi:**
- Worker: JavaScript, React, Node.js
- Ada 100 total job posts
- Parameter: `?recommendations=true`

**Hasil:**
- System ambil 3 skill ID dari worker
- Filter job yang memiliki minimal satu dari 3 skill tersebut
- Misal ada 25 job yang match
- Hasil diurutkan berdasarkan jumlah skill match DESC
  - Job dengan 3 skill match muncul pertama (senior/full-stack)
  - Job dengan 2 skill match di tengah 
  - Job dengan 1 skill match di akhir

### Skenario 2: Worker dengan Skills + recommendations=false (PENCARIAN UMUM)
**Kondisi:**
- Worker: JavaScript, React, Node.js
- Ada 100 total job posts
- Parameter: `?recommendations=false`

**Hasil:**
- Semua 100 job ditampilkan
- TIDAK ada filter skill
- Worker bisa lihat job lain seperti: Senior Python Dev, Data Analyst, DevOps Engineer, dll
- Sorted by default (created_at DESC atau sesuai sort_by parameter)
- Helpful untuk: explore karir baru, upskill, atau just browsing

### Skenario 3: Worker Tanpa Skills + recommendations=true
**Kondisi:**
- Worker baru, belum menambah skill apapun
- Ada 100 total job posts
- Parameter: `?recommendations=true`

**Hasil:**
- Tetap menampilkan semua 100 job
- Karena worker tidak punya skills untuk filtering
- Dari halaman ini mereka bisa browse dan add skills

### Skenario 4: Worker Tanpa Login
**Kondisi:**
- No token
- Ada 100 total job posts
- Parameter: `?recommendations=true` (parameter diabaikan)

**Hasil:**
- Tetap menampilkan semua 100 job
- recommendations parameter IGNORED (no authentication)

## Error Handling

Jika terjadi error saat mengambil worker skills:
- System log error
- Query tetap dijalankan TANPA filter skill (graceful degradation)
- User tetap mendapat hasil, hanya tidak ter-filter

## Testing

Untuk test fitur ini:

**1. Test rekomendasi aktif (default):**
```bash
GET /api/v1/job-posts?recommendations=true
Headers: Authorization: Bearer {token_worker_dengan_skills}
```
- Harapan: Hanya job dengan matching skills yang ditampilkan
- Sorted by skill_match_count DESC

**2. Test rekomendasi non-aktif (cari job umum):**
```bash
GET /api/v1/job-posts?recommendations=false
Headers: Authorization: Bearer {token_worker_dengan_skills}
```
- Harapan: SEMUA job ditampilkan
- Tidak ada filter skill
- Worker bisa explore job di luar expertise mereka

**3. Test dengan worker tanpa skills + recommendations=true:**
```bash
GET /api/v1/job-posts?recommendations=true
Headers: Authorization: Bearer {token_worker_baru}
```
- Harapan: Semua job ditampilkan (karena tidak punya skills untuk filter)

**4. Test tanpa token (ignore recommendations parameter):**
```bash
GET /api/v1/job-posts?recommendations=true
```
- Harapan: Semua job ditampilkan (no authentication = no filtering)

**5. Test tanpa parameter (default behavior):**
```bash
GET /api/v1/job-posts
Headers: Authorization: Bearer {token_worker_dengan_skills}
```
- Harapan: Sama seperti `recommendations=true` (default enabled)
- Hanya job dengan matching skills yang ditampilkan

## Performance Considerations

- Fetching worker skills: 1 database query
- Filtering jobs: Menggunakan EXISTS dengan indexed skill relationship
- Total overhead: Minimal, karena hanya menambah 1 query dan 1 condition ke SQL

## Future Improvements

1. **Caching worker skills** - cache di redis untuk performa lebih baik
2. **Recommendation priority** - tambah weight/scoring untuk skills
3. **User preference** - allow user to disable recommendations
4. **Skill level matching** - match berdasarkan skill level (beginner, intermediate, expert)
