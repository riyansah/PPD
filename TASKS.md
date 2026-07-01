# Tasks

## Status Awal

- [x] Validasi keputusan ambigu fase 0.
- [x] Siapkan fondasi proyek.
- [x] Implementasi autentikasi.
- [x] Implementasi modul pekerjaan.
- [ ] Implementasi modul aktivitas.
- [ ] Implementasi modul rutinitas dan riwayat.
- [ ] Implementasi dashboard dan grafik.
- [ ] Implementasi laporan dan ekspor.
- [ ] Implementasi pengaturan, notifikasi, backup, restore, dan hapus data.
- [ ] Hardening, pengujian, dan kesiapan rilis.

## Fase 0. Klarifikasi dan Desain Teknis

- [x] Tetapkan timeout sesi.
- [x] Tetapkan rate limiting login.
- [x] Tetapkan formula final persentase pekerjaan.
- [x] Tetapkan format backup dan restore.
- [x] Tetapkan format ekspor CSV multi-data.
- [x] Tetapkan strategi scheduler untuk notifikasi dan rutinitas terlewat.
- [x] Tetapkan kebijakan soft delete vs hard delete operasional.
- [x] Tetapkan kontrak respons API dan format error.
- [x] Tetapkan default pagination dan perilaku pencarian.
- [x] Tetapkan keputusan apakah browser notification masuk MVP atau pasca-MVP awal.

Acceptance:

- [x] Semua keputusan ambigu utama terdokumentasi.
- [x] Skema data awal dan kontrak API dasar siap diimplementasikan.

## Fase 1. Fondasi Proyek

- [x] Inisialisasi struktur folder frontend dan backend.
- [x] Tambahkan konfigurasi environment dasar.
- [x] Setup server Node.js dan Express.js.
- [x] Setup SQLite dan mekanisme migrasi.
- [x] Buat skema dasar tabel sesuai PRD.
- [x] Tambahkan middleware error handling dasar.
- [x] Tambahkan logging error dasar.
- [x] Bangun layout dasar: shell aplikasi, sidebar desktop, navigasi mobile.
- [x] Siapkan utilitas waktu `Asia/Jakarta` dan sinkronisasi waktu server.

Acceptance:

- [x] Server dapat berjalan lokal dan terkoneksi ke database.
- [x] Migrasi awal berhasil.
- [x] Layout dasar responsif tersedia.

## Fase 2. Autentikasi dan Sesi

- [x] Implementasi setup akun awal.
- [x] Implementasi `POST /api/auth/login`.
- [x] Implementasi `POST /api/auth/logout`.
- [x] Implementasi `GET /api/auth/session`.
- [x] Implementasi `PUT /api/auth/password`.
- [x] Tambahkan hashing password aman.
- [x] Tambahkan session cookie aman.
- [x] Tambahkan middleware proteksi endpoint.
- [x] Tambahkan rate limiting login.
- [x] Tambahkan halaman login dan redirect auth flow.

Acceptance:

- [x] Login/logout berfungsi.
- [x] Endpoint privat terproteksi.
- [x] Password tidak pernah tersimpan plaintext.
- [x] Session timeout dan rate limit aktif.

## Fase 3. Modul Pekerjaan

- [x] Buat tabel/query CRUD pekerjaan.
- [x] Implementasi endpoint daftar, detail, create, update, delete.
- [x] Implementasi endpoint ubah status.
- [x] Tambahkan validasi field dan aturan deadline.
- [x] Tambahkan search, filter, sort, pagination.
- [x] Tambahkan kalkulasi kondisi terlambat.
- [x] Simpan `completed_at` saat status selesai.
- [x] Bangun UI daftar pekerjaan.
- [x] Bangun UI form dan detail pekerjaan.

Acceptance:

- [x] Seluruh CRUD pekerjaan berjalan.
- [x] Filter, sort, search, pagination berjalan.
- [x] Kondisi terlambat dan `completed_at` akurat.

## Fase 4. Modul Aktivitas

- [x] Buat tabel/query CRUD aktivitas.
- [x] Implementasi endpoint daftar, detail, create, update, delete.
- [x] Implementasi endpoint ubah status.
- [x] Tambahkan kategori tetap.
- [x] Tambahkan validasi tanggal dan jam.
- [x] Tambahkan deteksi benturan aktivitas-aktivitas.
- [x] Tambahkan deteksi benturan aktivitas-rutinitas.
- [x] Implementasi status turunan untuk dashboard.
- [x] Implementasi konfirmasi aktivitas yang sudah lewat waktu.
- [x] Bangun UI daftar, form, dan detail aktivitas.

Acceptance:

- [x] CRUD aktivitas berjalan.
- [x] Benturan terdeteksi sebagai peringatan.
- [x] Aktivitas lewat waktu tetap tampil sampai dikonfirmasi.

## Fase 5. Modul Rutinitas dan Riwayat

- [x] Buat tabel/query rutinitas, hari aktif, dan riwayat.
- [x] Implementasi endpoint daftar, detail, create, update, delete.
- [x] Implementasi endpoint toggle aktif/nonaktif.
- [x] Implementasi endpoint konfirmasi rutinitas.
- [x] Tambahkan validasi jam dan hari aktif.
- [x] Tambahkan deteksi benturan rutinitas-rutinitas.
- [x] Tambahkan deteksi benturan rutinitas-aktivitas.
- [x] Implementasi generator kemunculan riwayat rutinitas.
- [x] Implementasi auto-mark rutinitas terlewat.
- [x] Pastikan snapshot judul/jadwal tersimpan di riwayat.
- [x] Bangun UI daftar, form, detail, dan riwayat rutinitas.

Acceptance:

- [x] CRUD rutinitas berjalan.
- [x] Riwayat rutinitas tercipta dan konsisten.
- [x] Rutinitas terlewat tercatat otomatis.

## Fase 6. Dashboard dan Grafik

- [ ] Implementasi `GET /api/dashboard/summary`.
- [ ] Implementasi `GET /api/dashboard/today`.
- [ ] Implementasi `GET /api/dashboard/deadlines`.
- [ ] Implementasi `GET /api/dashboard/charts`.
- [ ] Bangun kartu ringkasan dashboard.
- [ ] Bangun daftar deadline terdekat.
- [ ] Bangun agenda hari ini gabungan aktivitas dan rutinitas.
- [ ] Bangun grafik mingguan dan bulanan.
- [ ] Implementasi countdown berbasis waktu server.
- [ ] Tambahkan empty state dan loading state.

Acceptance:

- [ ] Dashboard menampilkan data inti yang benar.
- [ ] Countdown tampil dengan format PRD dan memakai waktu server.
- [ ] Agenda hari ini membedakan aktivitas dan rutinitas.

## Fase 7. Laporan dan Ekspor

- [ ] Implementasi `GET /api/reports/summary`.
- [ ] Implementasi `GET /api/reports/tasks`.
- [ ] Implementasi `GET /api/reports/activities`.
- [ ] Implementasi `GET /api/reports/routines`.
- [ ] Bangun halaman laporan dengan filter periode.
- [ ] Implementasi statistik pekerjaan, aktivitas, dan rutinitas.
- [ ] Implementasi ringkasan otomatis berbasis aturan.
- [ ] Implementasi ekspor PDF.
- [ ] Implementasi ekspor CSV.
- [ ] Tambahkan validasi kesesuaian data tampilan vs data ekspor.

Acceptance:

- [ ] Laporan tampil sesuai periode.
- [ ] PDF dan CSV dapat diunduh dan sesuai data yang difilter.

## Fase 8. Pengaturan, Notifikasi, dan Data Safety

- [ ] Implementasi `GET /api/settings`.
- [ ] Implementasi `PUT /api/settings`.
- [ ] Implementasi `POST /api/settings/backup`.
- [ ] Implementasi `POST /api/settings/restore`.
- [ ] Implementasi `DELETE /api/settings/all-data`.
- [ ] Bangun halaman pengaturan profil.
- [ ] Bangun pengaturan tema dan sinkronisasi tema akun.
- [ ] Bangun pengaturan notifikasi.
- [ ] Implementasi pusat notifikasi in-app.
- [ ] Implementasi browser notification bila disetujui fase 0.
- [ ] Implementasi backup data.
- [ ] Implementasi restore dengan backup otomatis sebelum proses.
- [ ] Implementasi hapus seluruh data dengan password dan frasa konfirmasi.

Acceptance:

- [ ] Pengaturan akun dan tema tersimpan.
- [ ] Notifikasi in-app berjalan tanpa duplikasi.
- [ ] Backup/restore/hapus data aman dan tervalidasi.

## Fase 9. Hardening dan Rilis

- [ ] Uji responsif desktop dan smartphone.
- [ ] Uji aksesibilitas form, warna, dan navigasi keyboard.
- [ ] Uji validasi backend pada semua endpoint utama.
- [ ] Uji proteksi auth dan session.
- [ ] Uji performa query dashboard dan daftar.
- [ ] Tambahkan index database yang diperlukan.
- [ ] Uji backup berkala dan pemulihan.
- [ ] Siapkan konfigurasi HTTPS untuk produksi.
- [ ] Rapikan error message dan empty state.
- [ ] Review akhir terhadap acceptance criteria PRD.

Acceptance:

- [ ] Tidak ada blocker kritis pada alur utama.
- [ ] Sistem siap untuk MVP sesuai prioritas PRD.
