# Git Workflow Rule

## Deskripsi
Aturan ini mewajibkan setiap perubahan kode atau penambahan fitur agar mematuhi standar Git Workflow untuk menjaga kerapian histori repositori.

## Aturan
1. **Selalu Buat Branch Baru**: Sebelum menulis atau mengubah kode, pastikan untuk selalu membuat branch baru dari branch utama (`develop`) menggunakan format yang jelas.
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
