# AGENTS.md

# AI Engineering Guidelines

Dokumen ini merupakan aturan utama yang harus dipatuhi oleh AI Agent ketika melakukan analisis, implementasi, refactor, maupun perbaikan bug pada project ini.

Seluruh implementasi harus mengikuti aturan berikut.

---

# Technology Stack

* Node.js
* Express.js / Restify.js (sesuaikan dengan project)
* PostgreSQL
* Docker
* Redis
* JWT Authentication

---

# General Rules

## Sebelum Menulis Kode

AI **WAJIB** terlebih dahulu:

1. Menganalisis requirement yang diberikan.
2. Menganalisis codebase yang sudah ada.
3. Memahami struktur project.
4. Mengikuti pola implementasi yang sudah ada.
5. Tidak membuat struktur baru apabila struktur yang sama sudah tersedia.

AI **TIDAK BOLEH** langsung menghasilkan kode tanpa memahami implementasi project terlebih dahulu.

---

# Environment Configuration

Apabila implementasi membutuhkan ENV baru:

* Jangan membaca langsung menggunakan `process.env`.
* Tambahkan ENV baru ke:

```
src/config/global_config
```

Seluruh module wajib mengambil konfigurasi dari `global_config`.

Contoh:

```
process.env.JWT_SECRET
```

Tidak diperbolehkan.

Gunakan:

```
globalConfig.jwt.secret
```

atau mengikuti struktur project yang sudah ada.

---

# New Feature Development Flow

Setiap penambahan fitur WAJIB mengikuti urutan berikut.

## 1. Analisis

* Analisis requirement.
* Analisis codebase.
* Analisis module terkait.
* Identifikasi perubahan yang dibutuhkan.

## 2. Database

Apabila fitur membutuhkan database:

* Buat migration.
* Buat rollback migration.
* Tambahkan contoh data (seed).
* Gunakan foreign key bila diperlukan.

AI tidak boleh membuat tabel tanpa migration.

---

## 3. Module

Buat module baru mengikuti struktur project yang sudah ada.

Struktur module wajib seperti berikut.

```
module_name/

├── handlers
│   └── api_handler.js
│
├── repositories
│
│   ├── commands
│   │
│   ├── command.js
│   ├── command_model.js
│   ├── command_handler.js
│   └── domain.js
│
│   └── queries
│
│       ├── query.js
│       ├── query_model.js
│       ├── query_handler.js
│       └── domain.js
```

---

# Responsibility of Each Layer

## handlers/api_handler.js

Berfungsi untuk:

* menerima request
* membaca req.body
* membaca req.params
* membaca req.query
* memanggil command handler atau query handler
* mengembalikan response

Tidak boleh berisi business logic.

---

## repositories/commands

Digunakan untuk:

* INSERT
* UPDATE
* PATCH
* DELETE

### command.js

Berisi query database.

Tidak boleh ada business logic.

---

### command_model.js

Berisi validasi dan tipe data input.

Contoh:

* req.body
* req.params
* req.query

---

### command_handler.js

Menjadi penghubung antara handler dan domain.

Tidak boleh berisi business logic yang kompleks.

---

### domain.js

Berisi business logic utama.

Seluruh validasi dan proses bisnis dilakukan di sini.

Domain boleh memanggil repository.

---

## repositories/queries

Digunakan untuk:

* Read All
* Read One
* Search
* Filter
* Pagination

---

### query.js

Berisi query SELECT.

Tidak boleh ada business logic.

---

### query_model.js

Berisi tipe data request.

---

### query_handler.js

Berfungsi sebagai penghubung ke domain.

---

### domain.js

Berisi business logic untuk proses query.

---

# Coding Rules

* Gunakan async/await.
* Hindari callback.
* Jangan menggunakan `any`.
* Jangan menggunakan `SELECT *`.
* Gunakan parameterized query.
* Hindari duplicate code.
* Ikuti pola yang sudah ada pada project.

---

# Database Rules

* Selalu gunakan migration.
* Tambahkan rollback migration.
* Tambahkan seed apabila diperlukan.
* Gunakan foreign key.
* Gunakan index untuk kolom yang sering difilter.
* Gunakan transaction apabila mengubah lebih dari satu tabel.
* Jangan menggunakan `SELECT *`.

---

# Security Rules

* Validasi seluruh input.
* Gunakan parameterized query.
* Jangan melakukan string interpolation pada SQL.
* Jangan mengembalikan stack trace ke client.
* Seluruh endpoint private wajib menggunakan authentication.

---

# Git Workflow Rules

## Branch

Sebelum melakukan perubahan kode:

Selalu buat branch baru dari:

```
develop
```

Format branch:

```
feature/nama-fitur
fix/nama-perbaikan
refactor/nama-refactor
docs/nama-dokumentasi
chore/nama-task
```

AI tidak boleh bekerja langsung pada branch `develop`.

---

## Commit

Commit harus dilakukan secara granular.

Satu commit hanya untuk satu perubahan fungsional.

Hindari commit besar yang mencampur banyak perubahan.

---

## Conventional Commits

Gunakan format berikut.

```
feat:
fix:
docs:
style:
refactor:
test:
perf:
build:
ci:
chore:
```

Contoh:

```
feat(auth): add google login

fix(user): validate duplicate email

refactor(job): simplify query handler
```

---

## Push

AI tidak boleh melakukan push ke branch `develop`.

Push hanya dilakukan ke branch feature.

Merge ke `develop` hanya melalui Pull Request setelah proses review.

---

# Backend & Frontend Scope

User memiliki agen terpisah untuk frontend. Batasi ruang lingkup kerja pada backend saja.

## Aturan

1. **Hanya Fokus pada Backend**: Agen tidak diperbolehkan mengubah kode atau file apapun yang berada di direktori frontend. Terhadap direktori `../cari-kerja-frontend` (relatif terhadap root workspace backend), agen hanya diberikan akses **Read-Only** (hanya untuk membaca dan memahami konteks), tanpa izin untuk menambah, memodifikasi, atau menghapus file apa pun.
2. **Berikan Instruksi Khusus**: Jika ada perubahan fitur yang memerlukan penyesuaian di frontend, agen harus mendeskripsikan secara spesifik apa saja yang perlu dilakukan pada sisi frontend, dan menyerahkannya sebagai **Instruksi untuk Agen Frontend** yang dapat disalin oleh pengguna.

---

# Code Quality

Setiap implementasi harus:

* konsisten dengan codebase
* mudah dibaca
* modular
* reusable
* tidak membuat duplicate code
* mengikuti struktur project

Jika terdapat implementasi serupa, AI harus menggunakan pola yang sama.

Jangan membuat pendekatan baru tanpa alasan yang jelas.

---

# Final Checklist

Sebelum menyelesaikan implementasi, AI wajib memastikan:

* Requirement sudah terpenuhi.
* Code mengikuti struktur project.
* Migration dibuat jika diperlukan.
* Seed dibuat jika diperlukan.
* ENV baru ditambahkan ke `src/config/global_config`.
* Handler hanya menerima request.
* Business logic berada di domain.
* Query database berada di repository.
* Query menggunakan parameterized query.
* Tidak ada `SELECT *`.
* Tidak ada duplicate code.
* Mengikuti Git Workflow.
* Menggunakan Conventional Commits.
* Tidak ada perubahan langsung pada branch `develop`.
* Tidak ada perubahan pada direktori frontend (`../cari-kerja-frontend`).
