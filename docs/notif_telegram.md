# Notifikasi Telegram — Setup Guide

Panduan step-by-step menyiapkan **Telegram sebagai channel notifikasi** di Cari Kerja.

Ada **dua komponen terpisah**:

| Komponen | Fungsi | Credential |
|----------|--------|------------|
| **Telegram OIDC Login** | User login dengan akun Telegram | `TELEGRAM_CLIENT_ID` / `SECRET` / `REDIRECT_URI` |
| **Telegram Bot** | Kirim notifikasi (job alert, bulk, status) | `TELEGRAM_BOT_TOKEN` / `USERNAME` / `WEBHOOK_SECRET` |

Login OIDC **tidak otomatis** mengaktifkan notifikasi. User harus menekan **Start** pada bot (deep-link dari FE) agar `telegram_chat_id` tersimpan.

---

## Ringkasan alur notifikasi

```text
Login Telegram (OIDC)
  → GET /workers/me → telegram_bot_start_url
  → User buka t.me/Bot?start=<signed_payload>
  → User tekan Start
  → Telegram POST /api/v1/telegram/webhook
  → BE simpan telegram_chat_id
  → Job alert / bulk / status → NotificationService → queue telegram → Bot API sendMessage
```

Email tetap jalan terpisah (channel independen).

---

## Bagian A — Bot Telegram (wajib untuk notifikasi)

### A.1 Buat bot di BotFather

1. Buka Telegram, chat [@BotFather](https://t.me/BotFather).
2. Kirim `/newbot` (atau pakai bot existing).
3. Ikuti prompt: nama display + username (harus berakhiran `bot`).
4. Simpan:
   - **HTTP API token** → `TELEGRAM_BOT_TOKEN`
   - **Username bot** (tanpa `@`) → `TELEGRAM_BOT_USERNAME`  
     Contoh: `CariKerjaNotifyBot`

Perintah berguna:

```text
/mybots → pilih bot → API Token
/setdescription
/setabouttext
/setuserpic
```

Webhook **bukan** di-set lewat menu BotFather. Pakai Bot API `setWebhook` (langkah A.3).

### A.2 Environment backend

Tambahkan ke `.env` (lihat juga `.env-example`):

```env
TELEGRAM_BOT_TOKEN=123456789:AA...your_bot_token
TELEGRAM_BOT_USERNAME=CariKerjaNotifyBot
TELEGRAM_WEBHOOK_SECRET=generate_random_long_string_here

# Opsional
# TELEGRAM_API_BASE=https://api.telegram.org
# TELEGRAM_RATE_LIMIT_MAX=25
# TELEGRAM_RATE_LIMIT_DURATION_MS=1000
# TELEGRAM_START_PAYLOAD_TTL_SEC=3600
```

| Variable | Keterangan |
|----------|------------|
| `TELEGRAM_BOT_TOKEN` | Token dari BotFather |
| `TELEGRAM_BOT_USERNAME` | Username bot tanpa `@` (untuk `t.me/...` deep-link) |
| `TELEGRAM_WEBHOOK_SECRET` | String acak kuat; harus sama dengan `secret_token` saat `setWebhook` |

Generate secret (contoh):

```bash
openssl rand -hex 32
```

Jalankan migration:

```text
src/migration/030_telegram_notifications.sql
```

Restart backend setelah `.env` berubah.

### A.3 Set webhook (HTTPS publik)

Telegram **hanya** memanggil URL HTTPS publik (bukan `http://localhost`).

**Staging / production:**

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://be-stage.cari-kerja.co.id/api/v1/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

**Penting:** nilai `url` harus lengkap dengan `https://`.  
Salah: `be-stage.cari-kerja.co.id/api/v1/telegram/webhook`  
Benar: `https://be-stage.cari-kerja.co.id/api/v1/telegram/webhook`  

Tanpa `https://`, Telegram tidak mengirim event Start ke server (profil tetap `telegram_available: false`).

Ganti host sesuai `APP_HOST`. Path endpoint BE:

```text
POST /api/v1/telegram/webhook
```

**Cek status:**

```text
https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Hapus webhook (debug / ganti URL):**

```text
https://api.telegram.org/bot<TOKEN>/deleteWebhook
```

Header yang dicek BE: `X-Telegram-Bot-Api-Secret-Token` = `TELEGRAM_WEBHOOK_SECRET`.

### A.4 Local development

Webhook & OIDC butuh HTTPS. Opsi:

1. **Tunnel** (ngrok / cloudflared) ke `localhost:APP_PORT`, lalu `setWebhook` ke URL tunnel + `/api/v1/telegram/webhook`.
2. **Bypass E2E login:** isi manual di DB untuk user Telegram:

```sql
UPDATE users
SET telegram_chat_id = '<chat_id>',
    telegram_notify_username = 'username_tanpa_at',
    telegram_bot_linked_at = NOW()
WHERE id = '<user_uuid>'
  AND login_provider = 'telegram';
```

`chat_id` didapat setelah user `/start` bot, atau dari bot seperti `@userinfobot`.

Unit test lokal (tanpa HTTPS):

```bash
npm test -- --testPathPatterns="telegram_profile|NotificationService|telegram_templates|telegram/webhook"
```

### A.5 Aktivasi notifikasi oleh user

1. User **login ulang dengan Telegram** (setelah deploy yang menyimpan OIDC claim `id` → `users.telegram_user_id`).
2. FE baca `GET /api/v1/users/workers/me`:
   - `telegram_connected: true`
   - `telegram_available: false` (belum Start)
   - `telegram_bot_start_url: https://t.me/<BOT>?start=<signed_payload>`
3. User buka URL itu → tekan **START**.
4. Webhook menyimpan `telegram_chat_id`:
   - Prefer: signed deep-link payload
   - Fallback: chat private — match `users.telegram_user_id` (= OIDC claim `id`) dengan `chat.id`  
     (**bukan** OIDC `sub` / `provider_id`; keduanya berbeda)
5. `telegram_available: true`. User bisa `/stop` untuk memutus link.

Scope OAuth login: `openid profile telegram:bot_access` (bot_access agar bot boleh DM setelah login).

Payload `start` di-sign HMAC (expiry ~1 jam), **maks. 64 karakter** (batas Telegram deep-link); regenerate dari `/me`. Jangan Start bot tanpa membuka tombol dari aplikasi.

### A.6 Apa yang dikirim lewat Telegram

| Event | Type internal |
|-------|----------------|
| Job alert harian | `job_alert` |
| Bulk communication recruiter | `bulk_communication` |
| Update status lamaran | `application_status` |
| Undangan wawancara | `interview_invitation` |

Pengiriman lewat BullMQ queue `telegram` (retry 3x, rate limit ~25 msg/detik).  
Gagal Telegram **tidak** menggagalkan Email.

---

## Bagian B — Telegram OIDC Login (opsional untuk panduan notif, wajib jika login Telegram)

Bot notifikasi **berbeda** dari aplikasi OIDC login.

### B.1 Daftar OIDC di Telegram

1. Ikuti dokumentasi resmi Telegram OIDC / portal developer Telegram (Oauth).
2. Daftarkan redirect URI **HTTPS** (Telegram biasanya menolak HTTP kecuali aturan khusus).

Redirect yang dipakai BE:

```text
{TELEGRAM_REDIRECT_URI}
```

Contoh stage:

```text
https://be-stage.cari-kerja.co.id/api/v1/users/telegram/callback
```

### B.2 Environment OIDC

```env
TELEGRAM_CLIENT_ID=your_telegram_client_id
TELEGRAM_CLIENT_SECRET=your_telegram_client_secret
TELEGRAM_REDIRECT_URI=https://be-stage.cari-kerja.co.id/api/v1/users/telegram/callback
```

Endpoint:

| Method | Path |
|--------|------|
| `GET` | `/api/v1/users/telegram?role_id=1&origin={FE}` |
| `GET` | `/api/v1/users/telegram/callback` |

Identitas login disimpan di `users.login_provider = 'telegram'` + `users.provider_id` (sub OIDC).  
Kolom `telegram_chat_id` **hanya** terisi setelah Start bot (Bagian A).

---

## Bagian C — Frontend (ringkas)

Lihat juga instruksi agen FE di PR / chat implementasi.

- Worker `/me`: jika `telegram_connected && !telegram_available` → tombol buka `telegram_bot_start_url`.
- Setelah kembali dari Telegram → refresh `/me`.
- Recruiter `GET /workers/:id`: jika ada `telegram_chat_url` → tombol “Chat via Telegram”.
- Jangan tampilkan / harapkan `telegram_chat_id` atau `provider_id`.

---

## Checklist go-live

### Bot + notifikasi

- [ ] Bot dibuat di BotFather; token & username di `.env`
- [ ] `TELEGRAM_WEBHOOK_SECRET` kuat & sama dengan `secret_token` webhook
- [ ] Migration `030_telegram_notifications.sql` sudah dijalankan
- [ ] `setWebhook` sukses (`getWebhookInfo` → URL benar, pending update ~0)
- [ ] User Telegram login → Start bot → `telegram_available: true`
- [ ] Ubah status lamaran / bulk / job alert → pesan masuk chat bot
- [ ] Redis + worker telegram running (server start otomatis `telegram.worker`)

### OIDC login

- [ ] Client ID/Secret & redirect URI HTTPS terdaftar
- [ ] `TELEGRAM_REDIRECT_URI` = callback BE
- [ ] Login worker/recruiter redirect ke FE `/auth/callback`

---

## Troubleshooting

| Gejala | Penyebab | Perbaikan |
|--------|----------|-----------|
| Webhook tidak dipanggil | URL bukan HTTPS / salah path | `getWebhookInfo`, perbaiki `setWebhook` |
| 401 di webhook | Secret tidak cocok | Samakan `TELEGRAM_WEBHOOK_SECRET` dengan `secret_token` |
| Start: “link tidak valid” | Payload kedaluwarsa / secret beda antar env | Buka ulang tombol dari `/me` (regenerate URL) |
| Start: “akun tidak ditemukan” | User belum login Telegram OIDC | Login dulu, lalu Start |
| Notif tidak terkirim | `telegram_chat_id` null | User belum Start bot |
| `TELEGRAM_BOT_TOKEN is not configured` | Env kosong | Isi token, restart BE |
| Queue menumpuk | Redis down / worker tidak start | Cek Redis & log `Telegram worker started` |

---

## Keamanan

- Jangan commit bot token / client secret / webhook secret.
- Jangan expose `telegram_chat_id` / `provider_id` ke frontend.
- Webhook secret wajib di production.
- Rotasi token BotFather jika bocor (`/revoke` lalu update `.env` + `setWebhook` ulang).
