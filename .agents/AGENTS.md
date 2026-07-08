# Aturan Ruang Kerja (Workspace Rules)

## 1. Git Workflow
Aturan ini mewajibkan setiap perubahan kode atau penambahan fitur agar mematuhi standar Git Workflow untuk menjaga kerapian histori repositori.

1. **Selalu Buat Branch Baru**: Sebelum menulis atau mengubah kode, pastikan untuk selalu membuat branch baru dari branch utama (`main` / `master` / `develop`) menggunakan format yang jelas.
   - Contoh format: `feature/nama-fitur`, `fix/nama-perbaikan`, `chore/nama-task`.
2. **Commit Granular**: Lakukan commit secara berkala (granular) untuk setiap perubahan fungsional yang sudah selesai, bukan satu commit raksasa di akhir.
3. **Conventional Commits**: Penamaan pesan commit harus menggunakan standar Conventional Commits:
   - `feat:` untuk penambahan fitur baru.
   - `fix:` untuk perbaikan bug.
   - `docs:` untuk perubahan pada dokumentasi.
   - `style:` untuk perubahan formatting (spasi, titik koma, dsb) yang tidak mengubah logika kode.
   - `refactor:` untuk perubahan kode yang tidak menambah fitur atau memperbaiki bug.
   - `chore:` untuk pembaruan pada proses build atau alat bantu lainnya.
4. **Tidak Mendorong Langsung ke Main**: Agen tidak boleh melakukan push langsung ke branch utama (`main` atau `master`). Push hanya dilakukan pada branch fitur, kemudian berikan instruksi kepada user (atau buatkan pull request jika diinstruksikan) untuk melakukan merge/review.

## 2. Akses Lintas Repositori (Cross-Repository Access)
Aturan ini mencegah agen melakukan modifikasi pada repositori yang bukan merupakan fokus utamanya, demi menghindari kerusakan atau perubahan yang tidak disengaja.

1. **Akses Read-Only Frontend ke Backend**: Agen frontend hanya memiliki akses baca (*read-only*) ke repositori backend (`C:\Users\Hakim\Documents\Freelance\job-portal\cari-kerja-backend`). Dilarang keras melakukan penulisan atau modifikasi file backend dari percakapan frontend. Jika diperlukan perubahan, buatlah rencana implementasi (*implementation plan*) untuk dieksekusi oleh agen backend.
2. **Akses Read-Only Backend ke Frontend**: Agen backend hanya memiliki akses baca (*read-only*) ke repositori frontend (`C:\Users\Hakim\Documents\Freelance\job-portal\cari-kerja-frontend`). Dilarang keras melakukan penulisan atau modifikasi file frontend dari percakapan backend. Jika diperlukan perubahan, buatlah rencana implementasi (*implementation plan*) untuk dieksekusi oleh agen frontend.
