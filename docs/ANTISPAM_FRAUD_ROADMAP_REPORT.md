# Laporan Implementasi — Antispam & Fraud Roadmap

**Proyek:** Cari Kerja (Backend)  
**Stack terkait:** `cari-kerja-backend` · `cari-kerja-frontend` · `super-admin-cari-kerja`  
**Periode:** Juli 2026  
**Status:** Roadmap P0 → P2 + polish + opsional **selesai di backend**

---

## 1. Ringkasan Eksekutif

Sebelum roadmap, fondasi auth/roles/Joi/quota/admin CRUD sudah ada, tetapi platform **belum fraud-hardened**: hampir tidak ada rate limit, tidak ada CAPTCHA, `is_suspended` / `is_verified` hampir tidak ditegakkan di runtime, OAuth mempercayai `role_id` dari client, dan tidak ada antrean Trust & Safety.

Implementasi ini menutup celah tersebut secara bertahap:

| Tahap | Fokus | Hasil utama |
|-------|--------|-------------|
| **P0** | Containment keamanan | OAuth role allow-list, enforce suspend, kunci `update-user`, quota duplicate, harden webhook, contact RL+CAPTCHA+honeypot |
| **P1** | Velocity & trust gates | Rate limits, Turnstile, verify-before-publish/boost, velocity apply/chat/invoice, chat gate/block/report, search-workers auth (FE) |
| **P2** | Ops maturity | `fraud_events`, heuristics job, helmet/trust-proxy, maintenance, disposable email/phone, magic-byte upload, session anomaly, risk badges, trust KPIs |
| **Polish** | Kontrak & UX abuse | Apply CAPTCHA (new user), `reject_reason`, error codes standar, worker badges, socket length/maintenance |
| **Opsional** | Scale & moderasi | Redis rate-limit store, archive/bulk chat admin, webhook replay guard |

---

## 2. Latar Belakang & Tujuan

### 2.1 Masalah yang diatasi

1. **Spam publik** — contact form & register tanpa RL/CAPTCHA  
2. **Account abuse** — farm akun, suspended masih login, privilege escalation OAuth  
3. **Spam lowongan** — unverified publish, duplicate bypass quota, konten scam  
4. **Flood apply/chat/payment** — tanpa velocity / pending invoice cap  
5. **Chat abuse** — start chat bebas, tanpa block/report  
6. **Ops buta** — tidak ada queue flag / KPI trust untuk superadmin  

### 2.2 Prinsip arsitektur

```
Request
  → abuse middleware (RL, CAPTCHA, maintenance)
  → auth (Basic | JWT + notSuspended | role)
  → Joi validation
  → domain fraud rules (verify, velocity, score, gate)
  → optional fraud_events upsert
```

- **Middleware** = kontrol horizontal (IP/user burst, CAPTCHA, maintenance)  
- **Domain** = aturan bisnis (verify gate, velocity, content score, chat gate)  
- **Superadmin** = konsumsi `risk_score` / `needs_review` tanpa mengubah CRUD inti  

Modul baru utama: `src/helpers/fraud/`, `src/helpers/captcha/`, `src/helpers/audit/`.

---

## 3. Inventaris Deliverable Backend

### 3.1 Migrasi database

| File | Isi |
|------|-----|
| `022_fraud_events.sql` | Tabel antrian Trust & Safety (`job_post`, `user`, `chat_message`, `payment_order`) |
| `023_chat_blocks_reports.sql` | `chat_blocks`, `chat_reports` |
| `024_job_reject_reason.sql` | Kolom `job_posts.reject_reason` |

**Wajib dijalankan di environment** sebelum fitur terkait dipakai penuh.

### 3.2 Helper fraud / keamanan

| Modul | Fungsi |
|-------|--------|
| `helpers/captcha/turnstile.js` | Verifikasi Cloudflare Turnstile |
| `helpers/fraud/velocity.js` | Batas apply/chat/invoice + pending invoice |
| `helpers/fraud/employer_verification.js` | Gate `is_verified` sebelum publish/boost |
| `helpers/fraud/score_job_post.js` | Heuristik konten → PENDING + flags |
| `helpers/fraud/fraud_events.js` | Upsert event open di queue |
| `helpers/fraud/chat_guards.js` | Gate start chat + block check |
| `helpers/fraud/disposable_email.js` | Tolak email disposable di register |
| `helpers/fraud/disposable_phone.js` | Tolak nomor palsu/disposable recruiter |
| `helpers/fraud/magic_bytes.js` | Validasi tipe file upload (bukan hanya extension) |
| `helpers/fraud/login_failures.js` | Counter gagal login (Redis) → CAPTCHA |
| `helpers/fraud/apply_captcha.js` | Gate CAPTCHA apply untuk akun baru |
| `helpers/fraud/session_anomaly.js` | Soft-flag IP/UA mismatch saat bayar |
| `helpers/fraud/rate_limit_store.js` | Redis store multi-instance untuk RL |
| `helpers/fraud/rate_limit_response.js` | Body 429 + `retry_after_seconds` |
| `helpers/fraud/webhook_replay.js` | Dedup webhook Xendit (Redis NX) |
| `helpers/auth/account_guards.js` | OAuth role allow-list + suspend |
| `helpers/audit/actions.js` | Taksonomi audit bertitik (`auth.login.success`, …) |
| `middlewares/maintenanceMode.js` | Blok non-admin saat maintenance |
| Helmet + `trust proxy` | Header security & IP benar di belakang proxy |

### 3.3 Rate limiters (middleware)

Semua memakai Redis store (prefix unik) + `passOnStoreError` (fail-open jika Redis error):

| Middleware | Endpoint tipikal | Window | Max |
|------------|------------------|--------|-----|
| `rateLimitContactUs` | `POST /contact-us` | 15m | 5 |
| `rateLimitRegister` | register worker/recruiter | 15m | 5 |
| `rateLimitLogin` | `POST /users/login` | 15m | 30 |
| `rateLimitApply` | apply job | 15m | 30 |
| `rateLimitChat` | kirim pesan REST | 15m | 90 |
| `rateLimitInvoice` | create invoice | 15m | 20 |
| `rateLimitCvParse` | CV parse | 15m | 20 |
| `rateLimitVerifyEmailResend` | resend verify | 15m | 5 |
| `rateLimitForgotPassword` | forgot password | 15m | 10 |
| `rateLimitBulkCommunication` | bulk comm | 15m | 10 |

### 3.4 Velocity domain (di atas middleware)

| Aksi | Batas |
|------|-------|
| Apply | 20 / jam / worker |
| Chat message | 60 / jam / sender |
| Create invoice | 10 / jam / recruiter |
| Pending invoices | maks 3 aktif |

### 3.5 Pull request / cabang utama (urutan)

1. `#80` P0 — OAuth, suspend, update-user, quota, webhook  
2. `#81/#83` P1 — RL + CAPTCHA + verify-before-publish  
3. `#84` Velocity + submit locks + search-workers auth (FE)  
4. `#85` fraud_events + heuristics + Trust & Safety API  
5. `#86` `needs_review` Jobs  
6. `#87` Chat report/block/gating  
7. `#88` Helmet, maintenance, disposable, magic-byte, trust KPIs  
8. `#89` Session anomaly, risk badges Users/Employers/Payments, login CAPTCHA progressive  
9. `#90` Polish — apply CAPTCHA, reject_reason, error contracts, worker badges  
10. `feature/antispam-optional-redis-rl-chat-moderation` — Redis RL, chat archive/bulk, webhook replay  

---

## 4. Kontrak Error Standar

Frontend/Superadmin mem-parse **prefix** di `message`:

| Kode | HTTP tipikal | Arti |
|------|--------------|------|
| `CAPTCHA_REQUIRED` | 400 | Token Turnstile wajib |
| `CAPTCHA_INVALID` | 400 | Token gagal / expired |
| `RATE_LIMITED:` | 429 | Terlalu banyak request |
| `VERIFICATION_REQUIRED:` | 403 | Employer belum diverifikasi |
| `CONTENT_FLAGGED:` | — | Job ditahan review (PENDING) |
| `CONTENT_REJECTED:` | 400 | Konten/upload/email/phone ditolak |
| `DUPLICATE_SUBMISSION:` | 409 | Sudah apply / duplikat |
| `ACCOUNT_RESTRICTED:` | 403 | Akun suspended |
| `CHAT_GATE:` | 403 | Worker belum apply ke job terkait |
| `CHAT_BLOCKED:` | 403 | Ada block antar user |
| `CHAT_ARCHIVED:` | 403 | Conversation diarsipkan |
| `MAINTENANCE_MODE:` | 503 | Platform maintenance |

**429 body (middleware & velocity):**

```json
{
  "success": false,
  "data": { "retry_after_seconds": 900 },
  "message": "RATE_LIMITED: ...",
  "code": 429
}
```

Header `Retry-After` juga di-set bila tersedia.

---

## 5. Detail Fitur per Area + Use Case / Guide

### 5.1 P0 — Containment

#### A. OAuth role allow-list

**Apa:** Google/Telegram signup hanya boleh `role_id` 1 (worker) atau 2 (recruiter). Role admin (3/4) ditolak.

**Use case:** Attacker mengubah query OAuth `role_id=3` → backend menormalisasi/menolak → tidak bisa jadi superadmin via OAuth.

#### B. Enforce `is_suspended`

**Di mana:** login lokal, OAuth, refresh token, `verifyToken`, Socket.IO handshake.

**Use case:** Admin suspend user di SA → user tidak bisa login, refresh, atau connect socket. Error: `ACCOUNT_RESTRICTED: ...`.

#### C. Lock `PUT /users/update-user/:id`

**Apa:** Wajib JWT; hanya self atau admin — tidak lagi Basic Auth saja.

**Use case:** Tanpa token / token orang lain → 403. Mencegah mutasi kredensial massal.

#### D. Quota pada `duplicateJobPost` + fail-closed

**Apa:** Duplikasi lowongan memakai cek kuota yang sama; error DB/kuota tidak fail-open.

**Use case:** Recruiter free plan dengan 1 slot aktif mencoba duplicate → ditolak, bukan bypass spam.

#### E. Webhook Xendit hardened

**Apa:** `timingSafeEqual` pada callback token; jaga status terminal (paid tidak di-downgrade); soft replay Redis (`external_id` + `status`, TTL 24 jam).

**Use case:**  
1. Token palsu → 401.  
2. Webhook `PAID` diputar ulang → claim Redis gagal → diabaikan (log tetap ada).  
3. `EXPIRED` setelah `paid` → diabaikan.

#### F. Contact: RL + CAPTCHA + honeypot

**Endpoint:** `POST /api/v1/contact-us`  
**Body:** `name`, `email`, `subject`, `message`, `captcha_token`, `website` (honeypot, harus kosong).

**Use case bot:** Field `website` terisi → response 201 palsu, **tidak** disimpan.  
**Use case manusia:** CAPTCHA valid + `website=""` → tersimpan + email ke support.

---

### 5.2 P1 — Velocity & trust gates

#### A. CAPTCHA Turnstile

| Surface | Kapan |
|---------|--------|
| Contact | Selalu (jika secret di-set) |
| Register worker/recruiter | Selalu |
| Login | Setelah **≥ 3** gagal (Redis, TTL 15 menit) |
| Apply | Akun **&lt; 7 hari** ATAU **&lt; 3** lamaran lifetime |

**Dev note:** Jika `TURNSTILE_SECRET_KEY` kosong, verifikasi di-skip (lingkungan lokal).

**Guide FE login:**  
1. Submit email/password.  
2. Jika gagal berulang → tampilkan widget Turnstile.  
3. Kirim ulang dengan `captcha_token`.  
4. Sukses → counter gagal di-clear.

**Guide FE apply:**  
1. Worker baru apply → BE minta CAPTCHA jika gate aktif.  
2. Tangani `CAPTCHA_REQUIRED` / `CAPTCHA_INVALID`.  
3. Worker lama dengan banyak apply → biasanya tanpa CAPTCHA.

#### B. Verify-before-publish / boost

**Apa:** Recruiter `is_verified = false` tidak boleh publish OPEN / boost berbayar.

**Error:** `VERIFICATION_REQUIRED: Company must be verified before publishing jobs`

**Use case:** Recruiter baru isi draft OK; klik publish OPEN → 403 sampai admin verify di SA.

#### C. Velocity apply / chat / invoice

**Use case apply flood:** Worker script apply 25 job dalam 1 jam → request ke-21+ kena `RATE_LIMITED` (domain) meski middleware belum.

**Use case pending invoice:** Recruiter buka 3 invoice pending → create ke-4 ditolak sampai bayar/expire.

#### D. Chat gating + block + report

| Endpoint | Fungsi |
|----------|--------|
| Start conversation | Worker hanya jika sudah apply ke job employer terkait (`CHAT_GATE`) |
| `POST /chat/block` | Block user |
| `DELETE /chat/block/:userId` | Unblock |
| `GET /chat/blocks` | Daftar block |
| `POST /chat/:conversationId/report` | Report → `chat_reports` + mirror `fraud_events` |

**Use case:**  
1. Worker belum apply coba start chat recruiter → `CHAT_GATE`.  
2. User A block B → kirim pesan gagal `CHAT_BLOCKED`.  
3. Report spam → muncul di Trust & Safety SA.

Pesan maks **5000** karakter (REST Joi + domain; berlaku juga socket).

#### E. Search workers auth (FE)

Route publik pencarian worker dilindungi auth di frontend agar resume/PII tidak di-scrape tanpa login.

---

### 5.3 P2 — Ops maturity & Trust & Safety

#### A. Job content heuristics

**File:** `score_job_post.js`  
**Threshold review:** risk_score ≥ **40** → status **PENDING** + `fraud_events`.

Contoh flag: `WHATSAPP_CONTACT`, `TELEGRAM_CONTACT`, `PAYMENT_ASK`, `SHORTLINK`, dll.

**Use case:** Lowongan berisi “bayar dulu biaya admin” + WA → di-hold PENDING, recruiter dapat `CONTENT_FLAGGED`, admin review di Trust & Safety.

#### B. Trust & Safety queue (Admin API)

| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/admin/fraud-events` | List + filter status/entity/source |
| GET | `/admin/fraud-events/:id` | Detail |
| POST | `/admin/fraud-events/:id/resolve` | Resolve |

**Aksi resolve:**

| `action` | Efek |
|----------|------|
| `mark_clean` | Tutup bersih |
| `approve_job` | Job → OPEN, clear `reject_reason` |
| `reject_job` | Job → REJECTED, `note` → `reject_reason` |
| `suspend_user` | Suspend user terkait (+ reject job bila dari job_post) |

**Guide SA:** Buka `/trust-safety` → pilih event → Approve / Reject (+ alasan) / Suspend / Mark clean.

#### C. Risk badges (`needs_review`)

Tersedia di list (dan sebagian detail):

- Jobs  
- Users  
- Employers  
- Payments  
- Workers  

Field: `needs_review` (bool), `open_fraud_event_id`.  
Filter: `?needs_review=true`.

**Guide SA:** Filter “Needs review” di Users/Employers/Jobs/Payments/Workers → klik badge → buka fraud event.

#### D. Dashboard trust KPIs

`GET /admin/dashboard/trust` — volume open flags, resolve rate, dsb. (dikonsumsi widget SA).

#### E. Disposable email / phone

Register dengan email disposable atau nomor tidak valid → `CONTENT_REJECTED: ...`.

#### F. Magic-byte upload

Upload CV/avatar dengan extension palsu (mis. `.pdf` yang isinya executable) → `CONTENT_REJECTED`.

#### G. Maintenance mode

`system_settings.maintenance_mode = true` → non-admin HTTP 503 `MAINTENANCE_MODE`; socket non-admin ditolak.  
Admin/settings/webhook/login tetap bisa sesuai exempt path.

#### H. Session anomaly (payment)

Saat `createInvoice`, bandingkan IP/UA request vs audit login terakhir.

- **Tidak memblokir** pembayaran.  
- Soft-flag `fraud_events` entity `payment_order` + metadata `session_anomaly`.

**Use case:** Rekening diretas, login dari IP A, bayar dari IP B → muncul di Payments `needs_review`.

#### I. Audit taxonomy

Contoh action: `auth.login.success`, `auth.login.failed`, `fraud.event.resolve.reject_job`, `admin.chat.conversation.archive`, `payment.session.anomaly`.

---

### 5.4 Polish

#### A. `reject_reason`

- `PUT /admin/jobs/:id/status` dengan `status: "REJECTED"` + `reject_reason`  
- Resolve fraud `reject_job` memakai `note` sebagai reason  
- Ditampilkan di admin job detail/list  

**Guide SA:** Reject job → isi alasan → recruiter/admin melihat `reject_reason`. Approve → reason di-clear.

#### B. Worker risk badge

Sama pola Users: open fraud pada `user` atau `chat_message` yang dikirim worker.

---

### 5.5 Opsional (scale & moderasi)

#### A. Redis rate-limit store

Counter RL shared antar instance Node. Prefix per limiter (`rl:login:`, `rl:apply:`, …).  
`passOnStoreError: true` → Redis down tidak mengunci seluruh traffic.

#### B. Admin chat moderation lanjutan

| Method | Path | Body |
|--------|------|------|
| PUT | `/admin/conversations/:id/status` | `{ "status": "ARCHIVED"\|"ACTIVE", "reason?" }` |
| DELETE | `/admin/conversations/:id/messages` | `{ "message_ids": [...] }` opsional; kosong = purge semua |
| DELETE | `/admin/conversations/:id/messages/:message_id` | Hapus satu (lama) |

**Use case archive:** Admin arsipkan thread scam → user dapat `CHAT_ARCHIVED` saat kirim.  
**Use case purge:** Hapus seluruh pesan spam, sync `last_message`.

#### C. Webhook replay guard

Sudah dijelaskan di §5.1.E.

---

## 6. Alur End-to-End (Scenario Guide)

### Scenario 1 — Spammer contact form

1. Bot POST contact tanpa CAPTCHA → `CAPTCHA_REQUIRED`.  
2. Bot isi honeypot `website` → 201 palsu, DB kosong.  
3. Bot flood IP → 429 `RATE_LIMITED` + `retry_after_seconds`.

### Scenario 2 — Farm akun recruiter

1. Register massal → RL 5/15m.  
2. Email disposable → `CONTENT_REJECTED`.  
3. Publish OPEN sebelum verify → `VERIFICATION_REQUIRED`.  
4. Konten scam lolos verify → heuristics → PENDING + fraud event.

### Scenario 3 — Suspended user

1. SA suspend user.  
2. Login / refresh / socket → `ACCOUNT_RESTRICTED`.  
3. Token lama ditolak di middleware.

### Scenario 4 — Apply abuse

1. Worker baru apply → wajib CAPTCHA.  
2. Apply ganda job sama → `DUPLICATE_SUBMISSION`.  
3. 20+ apply/jam → `RATE_LIMITED` velocity.

### Scenario 5 — Chat spam

1. Start tanpa apply → `CHAT_GATE`.  
2. Flood pesan → RL + velocity.  
3. Lawan block → `CHAT_BLOCKED`.  
4. Report → muncul Trust & Safety.  
5. Admin archive / purge.

### Scenario 6 — Payment anomaly

1. Login kantor (IP A).  
2. Create invoice dari IP B → order tetap dibuat.  
3. SA lihat Payments `needs_review` / fraud `session_anomaly`.

### Scenario 7 — Moderator Trust & Safety

1. Dashboard trust KPIs naik (open flags).  
2. Buka event job PENDING.  
3a. Approve → OPEN.  
3b. Reject + note → REJECTED + `reject_reason`.  
3c. Suspend → user terkunci.

### Scenario 8 — Maintenance window

1. SA set `maintenance_mode=true`.  
2. Pengunjung umum → 503.  
3. Admin masih kelola settings; webhook Xendit tetap masuk.

---

## 7. Dampak per Stakeholder

### Backend

Kontrol runtime di middleware + domain; antrean `fraud_events`; migrasi 022–024; audit lebih kaya; RL multi-instance.

### Frontend (portal)

- Turnstile: contact, register, login (progressive), apply (conditional)  
- Honeypot `website` di contact  
- Parse error prefix standar + `retry_after_seconds`  
- Chat: block/report, gate, archived  
- Submit locks / auth search-workers (tahap velocity)

### Superadmin

- Halaman Trust & Safety + resolve actions  
- Badge/filter `needs_review` di Users, Employers, Jobs, Payments, Workers  
- Trust KPIs dashboard  
- Job reject reason  
- Chat: delete satu / bulk / archive-restore  

---

## 8. Operasional & Konfigurasi

| Env / setting | Kegunaan |
|---------------|----------|
| `TURNSTILE_SECRET_KEY` | Aktifkan verifikasi CAPTCHA di BE |
| Site key Turnstile (FE) | Widget FE |
| `REDIS_URL` | RL store, login failure, webhook replay |
| `system_settings.maintenance_mode` | Mode maintenance |
| Xendit callback token | Webhook auth |

**Checklist deploy:**

1. Jalankan migrasi `022`, `023`, `024`.  
2. Set Turnstile + Redis di staging/production.  
3. Merge/PR opsional Redis RL bila belum ke `develop`.  
4. Verifikasi SA Trust & Safety + badge list.  
5. Smoke: contact CAPTCHA, register, login gagal → CAPTCHA, apply new user, publish unverified, chat gate, webhook token invalid.

---

## 9. Batasan & Non-Goals

Yang **sengaja tidak** menjadi scope roadmap inti:

- Machine learning fraud scoring real-time  
- Device fingerprinting penuh  
- Mute permanen terpisah dari block/archive (block + archive sudah menutup use case utama)  
- Velocity berbasis Redis murni (saat ini SQL window; RL HTTP sudah Redis)

Perbaikan di luar roadmap tetap bisa ditambah sebagai fitur baru, bukan “sisa checklist”.

---

## 10. Kesimpulan

Antispam & Fraud Roadmap telah diimplementasikan secara menyeluruh di backend: dari containment P0, velocity/trust P1, ops & queue P2, hingga polish kontrak error dan opsi scale (Redis RL, moderasi chat massal, webhook replay).

Dengan FE dan Superadmin yang sudah mengeksekusi instruksi integrasi, platform memiliki:

- **Pencegahan** (RL, CAPTCHA, honeypot, disposable, magic-byte)  
- **Pembatasan** (suspend, verify gate, velocity, chat gate/block)  
- **Deteksi** (heuristics, session anomaly)  
- **Respons ops** (Trust & Safety queue, badges, reject reason, archive/purge)

Dokumen ini menjadi acuan teknis dan panduan use case untuk QA, onboarding, dan audit kepatuhan keamanan produk.

---

*Dokumen dihasilkan sebagai laporan penutupan roadmap · Cari Kerja Backend · Juli 2026*
