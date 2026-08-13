# Frontend: Multi-recruiter Company

Source: backend plan multi-recruiter company flow.
Copy this document to the frontend agent. Do not change backend from the FE side.

---

## Instruksi untuk Agen Frontend (LENGKAP — copy-paste)

Repo: `cari-kerja-frontend` (Vue 3 + Pinia + Vue Router + Axios).  
Backend akan mendukung **1 company = banyak akun recruiter** dengan role `owner` | `admin` | `recruiter`, invitation email, dan pemisahan **company settings** vs **profil personal**. Monetisasi & VIP jadi **company-scoped**; billing hanya **owner**.

Jangan ubah backend. Kerjakan FE saja; sync dengan kontrak API di bawah (prefix tetap `/api/v1` sesuai axios base).

### Konteks baseline FE sekarang (yang harus diganti asumsinya)

- 1 akun recruiter = 1 company; company fields di `EditProfile.vue` via `GET /users/{id}/recruiters` + `PUT /users/recruiters`.
- Tidak ada UI team / invite / company role.
- Auth: `src/stores/authStore.js` — `role_id===2` → `role: "recruiter"`; `auth.user.id` = profile/recruiter id; tidak ada `company_id` / `company_role`.
- Register: `/register-recruiter` → `RegisterRecruiter.vue` → `POST /users/register-recruiter` (company + contact sekaligus).
- Login: `/recruiter-login`; OAuth recruiter UI tidak ada (biarkan begitu kecuali backend expose invite+OAuth).
- Jobs: `/recruiter/jobs*`; create kadang kirim `recruiter_id` yang undefined — ownership dari JWT.
- Payments: `/recruiter/pricing|checkout|orders|payment/*` — semua role recruiter bisa bayar.
- KYC: `/recruiter/verification`.
- Public company: `/recruiters/:id`.
- Nav: `RecruiterHeader.vue`.

### Model produk yang harus diikuti FE

| Konsep | UI |
|--------|-----|
| Company | Nama, logo, website, alamat, industri, deskripsi, employee_count, social, VIP badge, verification status |
| Member | User di company dengan `company_role`: `owner` \| `admin` \| `recruiter` |
| Profil personal | Nama PIC, phone, avatar personal (bukan logo company) |
| Invite | Owner/admin undang email + role; link → register/accept |

Permission matrix (mirror backend):

| Aksi | owner | admin | recruiter |
|------|-------|-------|-----------|
| Edit company settings | yes | yes | no (read) |
| Invite / resend / revoke / change role / remove member | yes | yes (role ≤ admin) | no |
| Transfer ownership | yes | no | no |
| Jobs / applicants / pipeline / search workers | yes | yes | yes |
| Billing (pricing, checkout, create-invoice, orders) | yes | no (opsional view-only orders) | no |
| Consume quota / apply single-post / boost job | yes | yes | yes |
| Employer verification (KYC) | yes | yes | no (opsional read status) |
| Edit own personal profile | yes | yes | yes |
| Leave company | no (harus transfer dulu) | yes | yes |

v1: **1 active company per user** — tidak perlu company switcher.

---

### 1) Auth store & JWT

File utama: [`src/stores/authStore.js`](../cari-kerja-frontend/src/stores/authStore.js), [`src/utils/jwt.js`](../cari-kerja-frontend/src/utils/jwt.js), [`src/utils/chatIdentity.js`](../cari-kerja-frontend/src/utils/chatIdentity.js), router guards di [`src/router/index.js`](../cari-kerja-frontend/src/router/index.js).

Setelah login/refresh, simpan di `auth.user` (dan localStorage `user`):

- `user_id` — users.id (untuk chat / beberapa endpoint)
- `id` — tetap **recruiter profile id** (`recruiter_id`) agar URL publik/chat legacy tidak pecah, ATAU pisahkan jelas: `recruiter_id` + `company_id` dan update semua pemakaian `auth.user.id` yang berarti company/public profile
- **Baru wajib:** `company_id`, `company_role` (`owner`|`admin`|`recruiter`), `recruiter_id`
- Tetap: `email`, `name`/`contact_name`, `avatar_url`, `role` (`"recruiter"`), `role_id` (2), `login_provider`, `restrictedVerification`

Tambah getters:

- `companyRole`, `companyId`, `isCompanyOwner`, `isCompanyAdmin` (owner atau admin), `canManageBilling`, `canManageTeam`, `canEditCompany`, `canManageVerification`

Router:

- Gate `/recruiter/pricing`, `/recruiter/checkout`, `/recruiter/orders` → `canManageBilling` (owner). Non-owner → redirect `/recruiter/jobs` + toast “Hanya owner yang mengelola billing”.
- Gate halaman team/company edit write → `canEditCompany` / `canManageTeam`.
- Soft KYC (`restrictedVerification`) tetap; status KYC dari **company**, bukan profil personal.

Jangan kirim `recruiter_id` palsu di create job; biarkan BE ambil dari JWT/`company_id`. Jika payload masih butuh field, kirim `company_id` dari auth.

---

### 2) Split settings: Company vs Profil saya

**Ganti** asumsi “Edit Profile = company”.

Rute baru (sarankan):

| Route | Halaman | Siapa |
|-------|---------|--------|
| `/recruiter/company` | Company settings (read semua member; write owner/admin) | all / write admin+ |
| `/recruiter/company/team` | Members + invitations | `canManageTeam` untuk mutate; member lain boleh list read-only opsional |
| `/recruiter/profile` | Profil personal (nama, phone, avatar) | semua member |
| `/recruiter/profile/edit` | **Deprecated** → redirect ke `/recruiter/company` atau `/recruiter/profile` sesuai konteks lama |

API client baru, mis. `src/services/companies.api.js`:

- `GET /companies/me` → company profile + verification/vip summary
- `PATCH /companies/me` (atau PUT + multipart logo) — field: `company_name`, `company_website`, `address`, `industry_id`, `description`, `employee_count`, `instagram_url`, `tiktok_url`, `avatar_url`/logo
- `GET /recruiters/me` + `PATCH /recruiters/me` — personal: `contact_name`, `contact_phone`, avatar personal

Pindahkan field company keluar dari `EditProfile.vue`; buat `CompanySettings.vue` + `RecruiterPersonalProfile.vue` (atau rename jelas).

Header (`RecruiterHeader.vue` + avatar menu):

- Link “Perusahaan” → `/recruiter/company`
- Link “Profil saya” → `/recruiter/profile`
- Link “Tim” → `/recruiter/company/team` (tampil jika `canManageTeam`, atau selalu tampil read-only)
- Public company page: jangan pakai `/recruiters/${auth.user.id}` jika id itu personal recruiter — pakai **`/companies/:companyId`** (lihat §7) atau slug yang BE sediakan.

---

### 3) Team & invitation UI

Halaman `/recruiter/company/team`:

**Members list**

- Tampilkan: nama, email, `company_role`, status, joined_at
- Aksi (permissioned): ubah role (dropdown; tidak bisa promote ke atas role sendiri; tidak bisa ubah owner kecuali transfer), remove/deactivate, transfer ownership (owner only, pilih member lain)

**Invitations**

- Form: email + role (`admin`|`recruiter` — owner biasanya tidak di-invite; transfer terpisah)
- List pending: email, role, invited_by, expires_at, aksi resend / revoke
- Handle error seat limit / already member / worker email dengan pesan BE

API (sesuaikan exact path saat BE merge; asumsi):

- `GET /companies/me/members`
- `PATCH /companies/me/members/:userId` `{ role }`
- `DELETE /companies/me/members/:userId`
- `POST /companies/me/transfer-ownership` `{ new_owner_user_id }`
- `GET /companies/me/invitations`
- `POST /companies/me/invitations` `{ email, role }`
- `POST /companies/me/invitations/:id/resend`
- `DELETE /companies/me/invitations/:id`

**Accept / register via invite**

Rute baru:

- `/invite/accept?token=...` → page `AcceptInvite.vue`
  1. `GET /companies/invitations/preview?token=` → company name, role, email, expiry validity
  2. Jika belum login / belum akun: redirect `/register-recruiter?invite_token=...` (email prefilled + **disabled/locked**)
  3. Jika sudah login recruiter tanpa company / matching email: `POST /companies/invitations/accept` `{ token }` lalu refresh session
  4. Token invalid/expired → error state + CTA hubungi admin

Update `RegisterRecruiter.vue`:

- Mode A (default): buat company baru — form company_name + personal fields (seperti sekarang, tapi setelah BE split, company fields tetap di register create-company).
- Mode B (`invite_token` query): **jangan** minta `company_name` / data company; email locked dari preview; kirim `invite_token` ke BE (`POST /users/register-recruiter` dengan token **atau** endpoint khusus `POST /companies/invitations/register` — ikuti BE final).
- Setelah sukses: ke verify-email / recruiter-login → landing jobs.

Email template link (dari BE) harus mengarah ke origin FE `/invite/accept?token=`.

---

### 4) Register company baru (non-invite)

`RegisterRecruiter.vue` tetap ada untuk **owner pertama**:

- Fields: username, email, password, captcha, **company_name**, contact_name, contact_phone (minimal).
- Setelah BE: response/login mengembalikan `company_id` + `company_role: "owner"`.
- Jangan duplicate company fields di personal profile edit.

---

### 5) Billing / VIP / monetisasi (RBAC + company scope)

Files: `Pricing.vue`, `PaymentCheckout.vue`, `PaymentOrders.vue`, `ActivePlanBanner.vue`, `BoostJobModal.vue`, `SinglePostModal.vue`, `src/services/payments.api.js`.

- Endpoint payments **tetap** dipakai, tapi entitlement = **company** (active plan shared).
- Hanya **owner** yang boleh:
  - buka pricing/checkout
  - `POST /payments/create-invoice`
  - idealnya lihat full order history
- **Semua member** boleh:
  - lihat banner active plan / sisa quota (read `GET /payments/active-plan`)
  - apply single-post slot & boost pada job company (kalau BE izinkan)
- Non-owner di pricing: hide CTA bayar atau tampilkan “Hubungi owner untuk upgrade”.
- Copy UI: ganti “paket Anda” → “paket perusahaan” bila perlu.
- VIP badge di company settings / public company page dari field company (`is_vip`), bukan profil personal.

---

### 6) Jobs, pipeline, applicants, search workers

Tidak perlu company switcher. List/create otomatis company-scoped via JWT.

- Hapus/abaikan client `recruiter_id` yang salah di `CreateJob.vue` / `EditJob.vue` kecuali BE masih dokumentasikan; prefer tanpa field ownership dari client.
- Optional UX: tampilkan “Posted by {member name}” jika API mengembalikan `created_by_*`.
- Quota error messages: sebut “kuota perusahaan”.
- `getJobPostsSelf` / pipeline / applicants: tidak ada perubahan UX besar selain permission errors jika member di-remove.

---

### 7) Public company page & directory

- Ganti publik `/recruiters/:id` → **`/companies/:id`** (atau keep alias redirect dari legacy recruiter id → company id jika BE sediakan mapping).
- API: `GET /companies/:id` (public), directory `GET /companies` (pengganti `/recruiters/companies` bila BE rename).
- Update links dari job cards, search, header “lihat profil perusahaan”.
- Jangan expose personal phone anggota di public page kecuali produk memang mau PIC company (biasanya contact company-level).

---

### 8) Employer verification (KYC)

- Tetap `/recruiter/verification`.
- Data & status = **company**.
- Hanya `owner`/`admin` yang submit/edit dokumen; member `recruiter` lihat status read-only atau diarahkan ke company page.
- Update `employerVerificationStore` bila response shape menambah `company_id`.

---

### 9) Nav & copy

`RecruiterHeader.vue` (+ mobile menu):

- Jobs, (Search workers), Perusahaan, Tim (permission), Profil saya, Pricing (**owner only** atau semua lihat tapi CTA locked), Verification (admin+), Orders (owner).

Empty/error states:

- Invite expired, bukan recruiter email, sudah member, seat penuh, forbidden billing, must transfer before leave.

---

### 10) Services & files checklist (implementasi)

Buat/ubah kurang lebih:

- `src/services/companies.api.js` (baru)
- `src/services/auth.api.js` — register dengan `invite_token`; parse user session baru
- `src/services/recruiters.api.js` — personal me; public list mungkin pindah ke companies
- `src/services/payments.api.js` — no breaking path; handle 403 billing
- `src/stores/authStore.js` — claims + getters permission
- `src/router/index.js` — rute company/team/profile/invite + guards billing/team
- Pages: `CompanySettings.vue`, `CompanyTeam.vue`, `RecruiterPersonalProfile.vue`, `AcceptInvite.vue`
- Update: `RegisterRecruiter.vue`, `EditProfile.vue` (split/redirect), `RecruiterHeader.vue`, payment pages, public profile, job create
- Utils: `recruiterLanding.js` — setelah invite register tetap ke jobs/verification sesuai company KYC

---

### 11) Kontrak API ringkas (FE harus consume)

Asumsi path final BE (sesuaikan bila beda tipis saat implementasi):

```
# Auth session (login/refresh response user / JWT)
company_id, company_role, recruiter_id, user_id, role_id=2

# Company
GET    /companies/me
PATCH  /companies/me
GET    /companies/:id                    # public
GET    /companies                        # directory (paginated)

# Personal recruiter profile
GET    /recruiters/me
PATCH  /recruiters/me

# Team
GET    /companies/me/members
PATCH  /companies/me/members/:userId     # { role }
DELETE /companies/me/members/:userId
POST   /companies/me/transfer-ownership  # { new_owner_user_id }

# Invites
GET    /companies/me/invitations
POST   /companies/me/invitations         # { email, role }
POST   /companies/me/invitations/:id/resend
DELETE /companies/me/invitations/:id
GET    /companies/invitations/preview?token=
POST   /companies/invitations/accept     # { token }

# Register
POST   /users/register-recruiter         # create company (owner) OR with invite_token

# Payments (company-scoped; create-invoice = owner)
GET    /payments/plans
GET    /payments/active-plan
POST   /payments/create-invoice
GET    /payments/orders
POST   /payments/single-post/apply
```

Jobs/pipeline/verification: path lama boleh tetap; scope company di server. FE handle 403 dengan toast + redirect.

---

### 12) Acceptance criteria FE

1. Owner register → dapat company + `company_role=owner`; edit company & billing OK.
2. Owner invite admin/recruiter → email link → `/invite/accept` → register email locked → join **tanpa** buat company baru.
3. Admin bisa edit company + invite role ≤ admin; tidak bisa billing / transfer ownership.
4. Recruiter member: jobs/pipeline OK; company settings read-only; tidak lihat CTA bayar.
5. Active plan/quota/boost berlaku untuk semua member company yang sama.
6. Header memisahkan Perusahaan vs Profil saya.
7. Public page menampilkan company (bukan profil orang).
8. Legacy `/recruiter/profile/edit` tidak merusak UX (redirect jelas).
9. Guard billing & team tidak mengandalkan hide-only (route guard + API 403 handling).
10. Tidak ada regresi login worker; recruiter soft KYC lock tetap jalan di level company.

### 13) Out of scope FE v1

- Multi-company switcher
- Custom roles
- OAuth tombol di register recruiter (kecuali BE + produk minta)
- Seat upgrade UX rumit (cukup tampilkan error seat limit dari API)

Kerjakan bertahap: (1) auth claims + getters, (2) split company/personal pages, (3) team+invite+accept, (4) billing guards, (5) public routes, (6) polish nav/copy/errors.
