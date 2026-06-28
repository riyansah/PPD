# Technical Decisions

## Scope

Dokumen ini mengunci keputusan teknis untuk Phase 0 berdasarkan `PRD.md` dan `IMPLEMENTATION_PLAN.md`. Keputusan di sini menjadi acuan implementasi berikutnya sampai ada perubahan eksplisit.

## 1. Stack dan Struktur Aplikasi

- Backend menggunakan `Node.js` dan `Express.js`.
- Frontend menggunakan `HTML`, `CSS`, dan `Vanilla JavaScript` modular.
- Database menggunakan `SQLite`.
- Arsitektur aplikasi memakai static frontend + REST API JSON.
- Struktur backend dibagi menjadi `routes`, `controllers`, `services`, `repositories`, `middleware`, `jobs`, dan `utils`.

## 2. Zona Waktu dan Penyimpanan Waktu

- Zona waktu bisnis utama adalah `Asia/Jakarta`.
- Semua datetime absolut disimpan dalam UTC ISO 8601, misalnya `2026-06-28T09:00:00Z`.
- Data tampilan selalu dirender ke `Asia/Jakarta`.
- `tasks.start_at`, `tasks.deadline_at`, `tasks.completed_at`, `notifications.scheduled_at`, `notifications.sent_at`, dan timestamp lain disimpan sebagai UTC.
- `activities.activity_date` disimpan sebagai tanggal lokal `Asia/Jakarta` dalam format `YYYY-MM-DD`.
- `activities.start_time` dan `activities.end_time` disimpan sebagai jam lokal `HH:mm`.
- `routines.start_time` dan `routines.end_time` disimpan sebagai jam lokal `HH:mm`, karena rutinitas berulang mengikuti WIB.
- Semua perhitungan countdown, keterlambatan, status waktu, dan notifikasi memakai waktu server.
- Semua respons JSON menyertakan `meta.server_time` dalam UTC untuk sinkronisasi frontend.

## 3. Sesi, Login, dan Setup Akun Awal

- Tidak ada registrasi publik.
- Akun awal dibuat saat instalasi melalui one-time CLI setup command yang membaca environment variable atau prompt lokal.
- Session timeout absolut adalah `7 hari`.
- Idle timeout adalah `24 jam` sejak aktivitas terakhir.
- Login rate limit adalah `5 percobaan gagal dalam 15 menit` per kombinasi IP dan identifier login.
- Session disimpan server-side pada tabel `sessions` di SQLite.
- Cookie sesi wajib `HttpOnly`.
- Cookie sesi wajib `SameSite=Lax`.
- Cookie sesi memakai `Secure=true` di produksi HTTPS dan `Secure=false` hanya untuk local development.
- Logout menghapus sesi server-side dan mengosongkan cookie.

## 4. Search, Filter, Sort, dan Pagination

- Semua endpoint daftar memakai pagination berbasis `page` dan `page_size`.
- Default `page_size` adalah `20`.
- Nilai maksimum `page_size` adalah `100`.
- Semua filter daftar dikombinasikan dengan operator `AND`.
- Pencarian menggunakan case-insensitive partial match.
- Pencarian pekerjaan memeriksa `title` dan `description`.
- Pencarian aktivitas memeriksa `title` dan `notes`.
- Pencarian rutinitas memeriksa `title` dan `notes`.
- Sort hanya menerima satu primary field per request.
- Semua sort memiliki tie-breaker `id DESC` agar hasil stabil.
- Dashboard `deadlines` default mengembalikan `5` item.
- Dashboard `today` default mengembalikan seluruh item hari ini yang aktif dan relevan.

## 5. Status, Lifecycle, dan Business Rules yang Dikunci

### 5.1 Tasks

- Status utama tugas adalah `in_progress`, `completed`, `paused`, dan `cancelled`.
- Label UI masing-masing adalah `Sedang berjalan`, `Selesai`, `Tertunda`, dan `Dibatalkan`.
- Kondisi `overdue` bukan status tersimpan.
- `overdue` dihitung jika `deadline_at < server_time` dan status bukan `completed` atau `cancelled`.
- Saat status berubah ke `completed`, `completed_at` wajib diisi waktu server.

### 5.2 Activities

- Status utama aktivitas adalah `scheduled`, `completed`, dan `cancelled`.
- Status turunan tidak disimpan sebagai status utama.
- API mengembalikan field turunan `computed_status` dengan nilai:
  - `upcoming`
  - `in_progress`
  - `pending_confirmation`
  - `completed`
  - `cancelled`
- Aktivitas yang sudah melewati `end_time` tetap berstatus utama `scheduled` sampai pengguna mengonfirmasi selesai atau batal.

### 5.3 Routines

- Rutinitas utama disimpan sebagai template berulang.
- Setiap kemunculan hari aktif menghasilkan satu baris `routine_histories`.
- Status riwayat adalah `completed`, `missed`, dan `cancelled`.
- Snapshot `routine_title_snapshot`, `scheduled_start`, dan `scheduled_end` wajib disimpan di riwayat agar perubahan template tidak mengubah histori lama.

## 6. Benturan Jadwal

- Benturan jadwal tidak memblokir penyimpanan.
- Backend tetap menghitung benturan saat create/update aktivitas dan rutinitas.
- Respons create/update yang menemukan benturan mengembalikan `warnings`.
- Untuk aktivitas, benturan diperiksa terhadap:
  - aktivitas lain pada `activity_date` yang sama
  - rutinitas aktif yang berjalan di hari terkait
- Untuk rutinitas, benturan diperiksa terhadap:
  - rutinitas aktif lain pada hari aktif yang sama
  - aktivitas pada tanggal yang cocok dengan hari aktif hanya untuk tampilan peringatan kontekstual di dashboard, bukan sebagai larangan data permanen

## 7. Scheduler dan Proses Latar

- Scheduler server-side berjalan setiap `1 menit`.
- Scheduler bertugas:
  - membuat riwayat rutinitas harian yang belum terbentuk
  - menandai `routine_histories` sebagai `missed` jika sudah lewat dan belum dikonfirmasi
  - membuat notifikasi terjadwal yang belum diantrekan
  - menandai notifikasi yang sudah dikirim
- Selain scheduler, dashboard juga boleh menjalankan rekonsiliasi ringan saat dibuka untuk memastikan rutinitas terlewat tetap konsisten.

## 8. Backup, Restore, dan Retensi

- Format backup utama adalah `JSON` terstruktur.
- File backup berisi metadata versi, timestamp ekspor, checksum, dan seluruh tabel data yang didukung.
- Password hash tetap ikut backup karena termasuk data akun aman yang diperlukan untuk restore.
- Session aktif tidak ikut backup.
- Ekspor backup disimpan sebagai file unduhan dan boleh juga disalin ke direktori backup server.
- Lokasi backup server diatur lewat environment variable, berada di luar direktori database utama.
- Retensi backup otomatis adalah `14 backup harian` dan `8 backup mingguan`.
- Restore wajib berjalan dalam satu transaksi database.
- Sebelum restore, sistem membuat backup otomatis baru dari kondisi saat ini.
- File restore yang tidak memiliki metadata valid, checksum valid, atau struktur schema yang cocok harus ditolak.

## 9. Ekspor CSV dan PDF

- Jika pengguna mengekspor lebih dari satu jenis data sekaligus, sistem menghasilkan satu file `ZIP` berisi beberapa file CSV.
- Jika hanya satu jenis data dipilih, sistem boleh mengembalikan satu file CSV langsung.
- CSV memakai UTF-8 dan header kolom eksplisit.
- PDF dibangkitkan di server dan mengikuti periode/filter laporan aktif.

## 9A. Formula Laporan yang Dikunci

- Persentase pekerjaan selesai dihitung dengan formula:
  - `completed_tasks / active_tasks * 100`
- `active_tasks` adalah jumlah tugas dengan status selain `cancelled`.
- Jika `active_tasks = 0`, persentase pekerjaan selesai dikembalikan sebagai `0`.
- Persentase rutinitas selesai dihitung dengan formula:
  - `completed_routine_histories / total_routine_histories * 100`
- Jika `total_routine_histories = 0`, persentase rutinitas selesai dikembalikan sebagai `0`.

## 10. Notifikasi

- MVP notifikasi yang wajib adalah notifikasi di dalam website.
- Browser notification tetap dalam ruang lingkup versi awal, tetapi bukan blocker MVP awal.
- Browser notification hanya diaktifkan jika:
  - user mengaktifkan preferensi browser notification
  - browser permission saat runtime bernilai `granted`
- Satu event hanya boleh menghasilkan satu notifikasi per `notification_type`.
- Notifikasi pekerjaan untuk deadline tidak dibuat lagi bila tugas sudah `completed` atau `cancelled`.

## 11. Delete Policy

- `tasks`, `activities`, dan `routines` memakai soft delete melalui `deleted_at`.
- `routine_histories` tidak dihapus ketika template rutinitas dihapus.
- `notifications` boleh di-hard-delete saat operasi hapus seluruh data.
- `sessions` boleh di-hard-delete saat logout, restore, dan hapus seluruh data.
- `settings` tetap dipertahankan untuk user aktif, kecuali operasi hapus seluruh data memang meresetnya ke default.

## 12. Saved Reports

- Tidak ada tabel `saved_reports` pada MVP awal.
- Frasa `laporan tersimpan` pada PRD ditafsirkan sebagai artefak ekspor atau cache laporan bila fitur tersebut ditambahkan kemudian.
- Operasi `DELETE /api/settings/all-data` pada MVP membersihkan data laporan turunan bila ada, tetapi tidak membutuhkan tabel khusus sejak Phase 0.

## 13. API Response Contract

- Semua endpoint JSON memakai envelope:
  - `data`: payload utama atau `null`
  - `meta`: metadata respons
  - `errors`: daftar error, default array kosong
  - `warnings`: daftar warning, default array kosong
- `meta` minimal memuat:
  - `server_time`
  - `request_id`
- Endpoint daftar juga memuat `meta.pagination`.
- Error validasi memakai HTTP `422`.
- Tidak ditemukan memakai HTTP `404`.
- Tidak terautentikasi memakai HTTP `401`.
- Tidak diizinkan memakai HTTP `403`.
- Rate limit login memakai HTTP `429`.

## 14. Empty State, Unauthorized State, dan Logging

- Frontend wajib menyediakan empty state untuk dashboard kosong dan daftar kosong.
- Akses tanpa sesi ke halaman privat harus diarahkan ke halaman login.
- Akses tanpa sesi ke endpoint privat mengembalikan `401`.
- Logging minimum mencakup:
  - login gagal
  - login berhasil
  - ubah password
  - restore dimulai dan selesai
  - hapus seluruh data dimulai dan selesai
  - error aplikasi yang tidak tertangani
- Audit log penuh bukan bagian MVP awal.
