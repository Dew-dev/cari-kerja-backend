# Login by Google — Setup Guide

Panduan step-by-step menyiapkan **Google OAuth 2.0** untuk Cari Kerja (backend + yang perlu di Google Cloud Console).

## Ringkasan alur

1. Frontend / user membuka:  
   `GET {APP_HOST}/api/v1/users/google?role_id=1&origin={FE_URL}`
2. Backend redirect ke Google consent screen.
3. Google callback ke:  
   `{APP_HOST}/api/v1/users/google/callback`
4. Backend issue JWT, lalu redirect ke FE:  
   `{origin}/auth/callback?token=...&refreshToken=...`  
   (atau ke `/login?error=...` jika gagal, mis. email sudah terdaftar local).

Callback URL di kode di-build dari `APP_HOST`:

```text
{APP_HOST}/api/v1/users/google/callback
```

---

## 1. Google Cloud Console

### 1.1 Buat / pilih project

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project baru atau pilih project existing (mis. `cari-kerja-prod` / `cari-kerja-stage`).

### 1.2 Aktifkan Google+ / People API (jika diminta)

Untuk OAuth profil+email biasanya cukup OAuth consent + credentials. Jika console meminta API:

1. **APIs & Services → Library**
2. Cari dan enable **Google People API** (opsional, tergantung kebijakan project).

### 1.3 Konfigurasi OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type:
   - **External** untuk production publik, atau
   - **Internal** hanya jika Google Workspace organisasi.
3. Isi:
   - App name: `Cari Kerja`
   - User support email
   - Developer contact email
4. **Scopes** — minimal:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid` (jika tersedia)
5. **Test users** (jika status masih *Testing*):
   - Tambahkan email Google yang boleh login selama development.
6. Publish app ke **In production** bila sudah siap publik (ikuti review Google jika diminta).

### 1.4 Buat OAuth Client ID

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: mis. `cari-kerja-backend`
4. **Authorized JavaScript origins** (sesuaikan env):

   | Environment | Origin contoh |
   |-------------|----------------|
   | Local FE | `http://localhost:5173` |
   | Stage FE | `https://fe-stage.cari-kerja.co.id` |
   | Prod FE | `https://cari-kerja.co.id` (atau domain final) |

5. **Authorized redirect URIs** — **wajib** sama persis dengan backend:

   | Environment | Redirect URI |
   |-------------|--------------|
   | Local | `http://localhost:5001/api/v1/users/google/callback` |
   | Stage | `https://be-stage.cari-kerja.co.id/api/v1/users/google/callback` |
   | Prod | `https://<BE_HOST>/api/v1/users/google/callback` |

   Catatan:
   - Port / path harus cocok dengan `APP_HOST` + path di atas.
   - Jangan pakai trailing slash ekstra.
   - Local boleh `http://`; stage/prod harus `https://`.

6. Simpan → salin:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client secret** → `GOOGLE_SECRET_KEY`

---

## 2. Environment backend (`.env`)

```env
APP_HOST=https://be-stage.cari-kerja.co.id
FE_URL=https://fe-stage.cari-kerja.co.id

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_SECRET_KEY=GOCSPX-xxxxx
```

| Variable | Keterangan |
|----------|------------|
| `APP_HOST` | Base URL API (dipakai sebagai prefix callback Google) |
| `FE_URL` | Default frontend bila `origin` tidak dikirim |
| `GOOGLE_CLIENT_ID` | Dari Google Console |
| `GOOGLE_SECRET_KEY` | Dari Google Console |

Mapping di `src/config/global_config.js` → `googleAuth.clientId` / `googleAuth.secretKey`.

Restart backend setelah mengubah `.env`.

---

## 3. Endpoint yang dipakai

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/api/v1/users/google` | Mulai OAuth (`role_id`, `origin` query) |
| `GET` | `/api/v1/users/google/callback` | Callback dari Google |

Contoh start (worker):

```text
GET {APP_HOST}/api/v1/users/google?role_id=1&origin=https://fe-stage.cari-kerja.co.id
```

Recruiter: `role_id=2`.

---

## 4. Checklist verifikasi

- [ ] Redirect URI di Console = `{APP_HOST}/api/v1/users/google/callback`
- [ ] `APP_HOST` di `.env` tanpa typo (scheme + host + port)
- [ ] Consent screen punya scope email + profile
- [ ] Test user ditambahkan jika app masih *Testing*
- [ ] Login sukses → redirect FE `/auth/callback?token&refreshToken`
- [ ] Email yang sudah terdaftar **local** → redirect FE login dengan `error=provider_conflict` (bukan JSON mentah di browser)

---

## 5. Troubleshooting

| Gejala | Penyebab umum | Perbaikan |
|--------|----------------|-----------|
| `redirect_uri_mismatch` | URI di Console ≠ `APP_HOST` + path callback | Samakan persis di Console |
| `access_denied` / blocked | App Testing, email tidak di test users | Tambah test user atau publish app |
| Callback JSON error di browser | Error domain tidak redirect | Pastikan BE versi terbaru (OAuth error → FE login) |
| Cookie / session FE | Cross-origin | FE simpan token dari query; refresh pakai Basic + body `refreshToken` |

---

## 6. Keamanan

- Jangan commit `GOOGLE_SECRET_KEY` ke git.
- Pisahkan Client ID/Secret stage vs production.
- Rotasi secret jika bocor.
- Batasi Authorized origins hanya domain resmi.
