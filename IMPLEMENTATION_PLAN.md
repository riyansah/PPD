# Implementation Plan

## 1. Tujuan dan Ruang Lingkup

Personal Productivity Dashboard adalah aplikasi web pribadi untuk satu pengguna yang menggabungkan pengelolaan pekerjaan, aktivitas harian, rutinitas berulang, laporan produktivitas, notifikasi, serta pengaturan data dalam satu sistem terautentikasi yang dapat diakses dari desktop dan smartphone.

Ruang lingkup versi awal mencakup:

- Login, logout, sesi aman, dan ubah password.
- Dashboard ringkasan, agenda hari ini, deadline terdekat, dan grafik.
- CRUD pekerjaan dengan prioritas, status, filter, sort, pagination, dan countdown deadline berbasis waktu server.
- CRUD aktivitas dengan kategori tetap, validasi waktu, status turunan, dan peringatan benturan jadwal.
- CRUD rutinitas dengan hari aktif, toggle aktif/nonaktif, riwayat rutinitas, dan status terlewat.
- Laporan produktivitas per periode beserta ekspor PDF dan CSV.
- Pengaturan profil, tema, notifikasi, backup, restore, dan hapus seluruh data.
- Tampilan responsif desktop dan smartphone.

Di luar ruang lingkup versi awal:

- Multi-user publik dan registrasi publik.
- Integrasi pihak ketiga seperti Google Calendar, WhatsApp, Telegram, dan tool manajemen proyek eksternal.
- Aplikasi native Android/iOS.
- Pembayaran dan langganan.

## 2. Kebutuhan Fungsional

### 2.1 Autentikasi dan Sesi

- Sistem menyediakan login dengan username atau email dan password.
- Password disimpan dalam bentuk hash.
- Sistem membuat sesi login aman dan membatasi akses endpoint/hak akses halaman.
- Logout tersedia.
- Password dapat diubah dari pengaturan.
- Sistem menerapkan pembatasan percobaan login.
- Sesi berakhir otomatis setelah periode tidak aktif.

### 2.2 Dashboard

- Menampilkan kartu ringkasan pekerjaan, aktivitas, dan rutinitas.
- Menampilkan grafik aktivitas dan pekerjaan dengan filter mingguan dan bulanan.
- Menampilkan daftar pekerjaan aktif dengan deadline terdekat.
- Countdown deadline menggunakan waktu server, format `DD:HH:MM:SS`, dan berhenti saat terlambat.
- Menampilkan daftar kegiatan hari ini yang menggabungkan aktivitas dan rutinitas dengan label jenis.

### 2.3 Modul Pekerjaan

- Tambah, lihat, ubah, hapus pekerjaan.
- Ubah status dan tandai selesai.
- Cari, filter, sort, dan pagination.
- Validasi deadline terhadap tanggal mulai.
- Status terlambat dihitung otomatis.
- Waktu penyelesaian disimpan saat status menjadi selesai.

### 2.4 Modul Aktivitas

- Tambah, lihat, ubah, hapus aktivitas.
- Tandai selesai atau dibatalkan.
- Cari, filter, sort, dan pagination.
- Kategori aktivitas bersifat tetap.
- Status turunan dihitung otomatis: akan datang, sedang berlangsung, menunggu konfirmasi.
- Aktivitas lewat waktu tetap tampil sampai dikonfirmasi.
- Benturan jadwal hanya memunculkan peringatan, bukan blokir simpan.

### 2.5 Modul Rutinitas

- Tambah, lihat, ubah, hapus rutinitas.
- Aktif/nonaktifkan rutinitas.
- Tandai rutinitas hari ini selesai.
- Cari, filter, sort, dan pagination.
- Rutinitas otomatis muncul berdasarkan hari aktif.
- Setiap kemunculan menghasilkan riwayat.
- Rutinitas lewat waktu tanpa konfirmasi dicatat sebagai terlewat.
- Riwayat tetap konsisten walaupun template rutinitas diubah atau dihapus.

### 2.6 Laporan dan Ekspor

- Laporan dapat difilter harian, mingguan, bulanan, atau rentang tanggal.
- Menampilkan statistik pekerjaan, aktivitas, dan rutinitas.
- Menampilkan grafik dan ringkasan otomatis berbasis aturan.
- Data dapat diekspor ke PDF dan CSV.
- Isi ekspor harus konsisten dengan filter dan tampilan laporan.

### 2.7 Notifikasi

- Sistem mendukung notifikasi dalam website untuk pekerjaan, aktivitas, dan rutinitas.
- Browser notification tersedia jika izin diberikan.
- Pengguna dapat mengatur enable/disable dan waktu pengingat.
- Sistem memastikan satu kejadian tidak dikirim berulang kali.

### 2.8 Pengaturan dan Data

- Pengguna dapat mengubah profil dasar dan password.
- Tema terang, gelap, atau mengikuti sistem disimpan per akun.
- Backup seluruh data dapat diunduh.
- Restore memvalidasi file, membuat backup otomatis sebelum proses, dan menggunakan konfirmasi.
- Hapus seluruh data memerlukan password dan konfirmasi berlapis.

## 3. Kebutuhan Nonfungsional

### 3.1 Performa

- Dashboard idealnya termuat <= 3 detik pada koneksi normal.
- Respons visual interaksi umum < 1 detik.
- Daftar data memakai pagination.
- Query penting memakai indeks pada kolom tanggal, deadline, status, dan user.

### 3.2 Keamanan

- Produksi wajib HTTPS.
- Cookie sesi menggunakan `HttpOnly`, `Secure`, dan `SameSite`.
- Semua input divalidasi di frontend dan backend.
- Query database menggunakan parameterized query.
- Semua endpoint privat memerlukan autentikasi.
- Restore file dan backup sensitif harus divalidasi dan dilindungi.

### 3.3 Keandalan

- Backup berkala tersedia.
- Restore dan hapus massal menggunakan transaksi.
- Sistem memiliki error logging.
- Proses gagal tidak boleh meninggalkan data setengah berubah.

### 3.4 UX dan Aksesibilitas

- Tampilan responsif untuk desktop dan smartphone.
- Status tidak dibedakan hanya dengan warna.
- Form memiliki label jelas dan pesan error berbasis teks.
- Navigasi keyboard dan nama tombol yang ramah screen reader tersedia.
- Grafik memiliki ringkasan teks.

### 3.5 Waktu dan Konsistensi

- Zona waktu utama adalah `Asia/Jakarta`.
- Data waktu disimpan dalam UTC bila memungkinkan, ditampilkan dalam WIB.
- Waktu server menjadi sumber kebenaran untuk deadline, countdown, status, dan notifikasi.

## 4. Persyaratan yang Ambigu, Bertentangan, atau Belum Lengkap

### 4.1 Ambigu

- Durasi timeout sesi tidak ditentukan.
- Batas rate limiting login tidak ditentukan.
- Jumlah item pada daftar dashboard, pagination default, dan batas hasil pencarian belum ditentukan.
- Definisi tepat pencarian belum ditentukan: judul saja atau termasuk deskripsi/catatan.
- Aturan filter dan sort gabungan belum dijelaskan secara rinci.
- Mekanisme setup akun awal belum ditentukan: seed CLI, halaman first-run, atau env vars.
- Format backup final masih opsional antara JSON aman atau salinan database.
- Bentuk ekspor CSV multi-data belum diputuskan: multi-file atau ZIP.
- Mekanisme notifikasi belum lengkap: apakah ada polling, scheduler periodik, atau kombinasi keduanya.
- Penyimpanan "laporan tersimpan" disebut pada hapus data, tetapi model datanya belum didefinisikan di PRD.

### 4.2 Potensi Pertentangan

- PRD menyebut backend ringan seperti Express.js, sementara implementasi teknis detail lain belum mengikat. Ini bukan konflik, tetapi perlu ditegaskan agar stack tidak melebar.
- Aktivitas memiliki status utama `Terjadwal`, `Selesai`, `Dibatalkan`, tetapi dashboard meminta aksi konfirmasi setelah lewat waktu. Perlu batas jelas apakah API status tetap memakai `Terjadwal` sampai user konfirmasi atau ada field tambahan.
- Persentase pekerjaan selesai menyebut pekerjaan dibatalkan "dapat" dikeluarkan dari pembagi. Kata ini ambigu karena acceptance perlu formula tunggal.
- Notifikasi browser masuk ruang lingkup, tetapi prioritas MVP menyarankan fitur itu dikembangkan setelah notifikasi in-app stabil. Perlu keputusan apakah browser notification termasuk MVP atau fase pasca-MVP.

### 4.3 Belum Lengkap

- Belum ada spesifikasi halaman error, empty state, dan unauthorized state.
- Belum ada aturan audit/log aktivitas penting selain error logging.
- Belum ada keputusan retensi backup otomatis dan lokasi penyimpanannya.
- Belum ada detail apakah delete memakai soft delete secara operasional, meski model konseptual memuat `deleted_at`.
- Belum ada spesifikasi format respons API, struktur error, dan kontrak validasi.
- Belum ada spesifikasi strategi scheduler untuk rutinitas terlewat dan notifikasi.

## 5. Usulan Arsitektur dan Teknologi

Usulan ini sengaja mengikuti PRD, meminimalkan kompleksitas, dan cocok untuk aplikasi single-user pribadi.

### 5.1 Stack

- Frontend: HTML, CSS, dan Vanilla JavaScript modular.
- Backend: Node.js + Express.js.
- Database: SQLite.
- Session/auth: session cookie server-side dengan penyimpanan sesi persisten.
- Styling: CSS custom properties untuk tema terang/gelap/system.
- Charting: library ringan chart JS.
- PDF export: library PDF berbasis server.
- CSV export: generator CSV berbasis server.

### 5.2 Arsitektur Aplikasi

- Frontend server-rendered sederhana atau static assets + REST API.
- Backend dipisah per modul: auth, dashboard, tasks, activities, routines, reports, settings, notifications.
- Lapisan backend:
  - `routes/`: definisi endpoint.
  - `controllers/`: parsing request/response.
  - `services/`: logika bisnis.
  - `repositories/`: query SQLite.
  - `middleware/`: auth, rate limit, validation, error handling.
  - `jobs/`: scheduler notifikasi dan rutinitas terlewat.
- Penyimpanan waktu:
  - datetime absolut disimpan UTC ISO atau epoch.
  - jam berulang rutinitas disimpan sebagai local-time WIB plus hari aktif.

### 5.3 Model Data Minimum

- `users`
- `sessions` atau session store yang setara
- `tasks`
- `activities`
- `routines`
- `routine_days`
- `routine_histories`
- `notifications`
- `settings`
- opsional `backups` metadata bila ingin audit file backup

### 5.4 Prinsip Implementasi

- Default ke single-user aman, tetapi seluruh tabel tetap memakai `user_id`.
- Gunakan soft delete untuk entitas utama jika sesuai model PRD; riwayat jangan hilang.
- Scheduler server berjalan periodik untuk:
  - membuat/menyegarkan riwayat rutinitas harian,
  - menandai rutinitas terlewat,
  - menyiapkan notifikasi,
  - menandai notifikasi terkirim.
- Frontend melakukan polling ringan untuk dashboard time-sensitive seperti countdown dan agenda hari ini jika diperlukan.

### 5.5 Struktur Proyek yang Disarankan

```text
/
  frontend/
    assets/
    pages/
    scripts/
    styles/
  backend/
    src/
      routes/
      controllers/
      services/
      repositories/
      middleware/
      jobs/
      utils/
    data/
  shared/
    constants/
    schemas/
```

## 6. Fase Implementasi Kecil

### Fase 0. Klarifikasi dan Desain Teknis

Fokus:

- Menetapkan keputusan untuk area ambigu.
- Menyusun kontrak API, skema data, dan aturan waktu.

### Fase 1. Fondasi Proyek

Fokus:

- Inisialisasi backend Node/Express, frontend dasar, struktur folder, konfigurasi environment, SQLite, migrasi, logging, dan layout responsif awal.

### Fase 2. Autentikasi dan Sesi

Fokus:

- Login, logout, proteksi halaman/API, hash password, session timeout, ubah password, rate limiting login.

### Fase 3. Modul Pekerjaan

Fokus:

- CRUD pekerjaan, validasi, filter, sort, pagination, status, indikator terlambat, `completed_at`, countdown data support.

### Fase 4. Modul Aktivitas

Fokus:

- CRUD aktivitas, kategori tetap, status turunan, konfirmasi lewat waktu, deteksi benturan dengan aktivitas/rutinitas.

### Fase 5. Modul Rutinitas dan Riwayat

Fokus:

- CRUD rutinitas, hari aktif, toggle aktif, pembentukan riwayat, penandaan selesai/terlewat, preservasi snapshot riwayat.

### Fase 6. Dashboard dan Grafik

Fokus:

- Ringkasan, agenda hari ini gabungan, deadline terdekat, grafik mingguan/bulanan, countdown berbasis waktu server.

### Fase 7. Laporan dan Ekspor

Fokus:

- Statistik laporan, ringkasan otomatis, filter periode, ekspor PDF, ekspor CSV.

### Fase 8. Pengaturan, Notifikasi, dan Data Safety

Fokus:

- Profil, tema, pengaturan notifikasi, pusat notifikasi in-app, browser notification, backup, restore, hapus seluruh data.

### Fase 9. Hardening dan Rilis MVP

Fokus:

- Uji responsif, aksesibilitas, keamanan, performa, backup otomatis, deployment, HTTPS, perbaikan akhir.

## 7. Acceptance Criteria per Fase

### Fase 0

- Keputusan untuk timeout sesi, rate limiting, formula persentase, format backup, dan strategi scheduler terdokumentasi.
- Kontrak API dasar dan skema database awal disetujui untuk implementasi.

### Fase 1

- Server Express dapat dijalankan dan terhubung ke SQLite.
- Struktur frontend dan backend terbentuk rapi.
- Migrasi awal dapat membuat skema dasar.
- Layout dasar responsif tersedia untuk desktop dan smartphone.
- Logging error dasar aktif.

### Fase 2

- Login valid membuat sesi aman.
- User tanpa sesi tidak dapat mengakses halaman privat maupun endpoint privat.
- Logout menghapus sesi.
- Password tersimpan hash, bukan plaintext.
- Ubah password hanya berhasil dengan kredensial yang valid.
- Rate limiting login dan session timeout berjalan sesuai keputusan fase 0.

### Fase 3

- User dapat menambah, melihat, mengubah, dan menghapus pekerjaan.
- Filter, sort, search, dan pagination berjalan konsisten.
- Validasi `deadline >= start` diterapkan di backend.
- Kondisi terlambat dihitung otomatis.
- `completed_at` terisi saat pekerjaan diselesaikan.

### Fase 4

- User dapat CRUD aktivitas.
- Aktivitas hanya memakai kategori tetap.
- Validasi rentang waktu berjalan.
- Benturan jadwal terdeteksi dan ditampilkan sebagai peringatan tanpa memblokir simpan.
- Aktivitas yang lewat waktu tetap muncul sampai dikonfirmasi selesai/dibatalkan.

### Fase 5

- User dapat CRUD rutinitas dan memilih satu/banyak hari aktif.
- Rutinitas nonaktif tidak muncul di dashboard.
- Riwayat rutinitas tercipta per kemunculan.
- Rutinitas lewat waktu dapat tercatat terlewat otomatis.
- Riwayat lama tidak berubah saat template rutinitas diubah.

### Fase 6

- Dashboard menampilkan seluruh kartu ringkasan yang diwajibkan PRD.
- Daftar deadline terdekat hanya memuat pekerjaan relevan dan countdown format `DD:HH:MM:SS`.
- Countdown berbasis waktu server.
- Agenda hari ini menggabungkan aktivitas dan rutinitas dengan label jenis.
- Grafik mingguan dan bulanan tampil dan datanya benar.

### Fase 7

- Laporan dapat difilter harian, mingguan, bulanan, dan rentang tanggal.
- Statistik utama, grafik, dan ringkasan otomatis tampil konsisten dengan data.
- PDF dapat diunduh dengan elemen minimum yang diwajibkan PRD.
- CSV dapat diunduh dengan encoding UTF-8 dan isi sesuai filter.

### Fase 8

- User dapat mengubah profil dasar, password, dan tema.
- Pengaturan notifikasi tersimpan per akun.
- Notifikasi in-app berfungsi dan tidak terkirim ganda untuk event yang sama.
- Browser notification bekerja setelah izin diberikan.
- Backup dapat dibuat dan diunduh.
- Restore memvalidasi file, membuat backup otomatis, dan menggunakan transaksi.
- Hapus seluruh data memerlukan password dan frasa konfirmasi.

### Fase 9

- Tampilan nyaman digunakan di desktop dan smartphone.
- Pemeriksaan keamanan dasar lulus: proteksi endpoint, hash password, cookie aman, validasi input.
- Error kritis tidak ditemukan pada alur utama.
- Sistem siap dipasang pada server HTTPS dan backup otomatis terdokumentasi.

## 8. Rekomendasi Urutan Eksekusi

Urutan terbaik untuk implementasi adalah membangun fondasi backend, autentikasi, dan model data lebih dulu; lalu fitur inti yang menghasilkan data; kemudian dashboard/laporan yang mengonsumsi data; terakhir pengaturan, notifikasi, dan hardening. Ini menjaga risiko rendah dan menghindari membangun dashboard/laporan di atas model data yang belum stabil.

## 9. Keputusan Awal yang Disarankan

Untuk mempercepat eksekusi, keputusan default yang aman:

- Session timeout: 7 hari dengan idle timeout 24 jam.
- Rate limit login: 5 percobaan per 15 menit per IP atau identitas login.
- Formula persentase pekerjaan: pembagi mengecualikan status dibatalkan.
- Format backup: JSON terstruktur + checksum metadata.
- CSV multi-data: file ZIP berisi beberapa CSV.
- Soft delete dipakai untuk `tasks`, `activities`, dan `routines`.
- Scheduler: interval server-side tiap 1 menit untuk notifikasi dan rutinitas terlewat.
- Notifikasi browser diposisikan sebagai fase lanjutan setelah in-app notification stabil, meski tetap dalam ruang lingkup versi awal.
