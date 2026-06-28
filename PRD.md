# PRODUCT REQUIREMENTS DOCUMENT

## Personal Productivity Dashboard

**Versi:** 1.0
**Tanggal:** 28 Juni 2026
**Status:** Draft Awal
**Jenis Produk:** Website produktivitas pribadi
**Target Platform:** Desktop dan smartphone
**Zona Waktu Utama:** Asia/Jakarta (WIB)

---

# 1. Ringkasan Produk

Personal Productivity Dashboard adalah website pribadi yang digunakan untuk mencatat, mengatur, memantau, dan mengevaluasi pekerjaan, aktivitas harian, serta rutinitas pengguna.

Website menyediakan dashboard terpadu yang menampilkan ringkasan seluruh kegiatan, pekerjaan yang mendekati deadline, aktivitas hari ini, rutinitas terjadwal, grafik progres, dan statistik penyelesaian.

Website dapat diakses dari desktop maupun smartphone melalui sistem login. Semua data disimpan dalam database SQLite pada server sehingga pengguna dapat mengakses data yang sama dari perangkat dan lokasi yang berbeda.

---

# 2. Latar Belakang

Pengguna memiliki beberapa jenis kegiatan yang perlu dikelola secara terpisah, yaitu:

1. Pekerjaan yang memiliki tanggal mulai dan deadline.
2. Aktivitas tambahan yang dilakukan pada tanggal dan jam tertentu.
3. Rutinitas berulang yang aktif pada hari-hari tertentu.
4. Laporan produktivitas berdasarkan data pekerjaan dan kegiatan.

Tanpa sistem yang terintegrasi, pengguna dapat mengalami kesulitan dalam mengetahui pekerjaan yang paling mendesak, kegiatan yang akan dimulai, rutinitas yang terlewat, dan tingkat penyelesaian kegiatan dalam periode tertentu.

Website ini dibangun untuk menyatukan seluruh informasi tersebut ke dalam satu dashboard pribadi.

---

# 3. Tujuan Produk

Website ini bertujuan untuk:

1. Membantu pengguna mengelola pekerjaan berdasarkan deadline dan prioritas.
2. Membantu pengguna mencatat aktivitas tambahan di luar rutinitas.
3. Membantu pengguna membuat rutinitas berulang berdasarkan hari aktif.
4. Menampilkan agenda hari ini secara otomatis.
5. Memberikan pengingat terhadap kegiatan dan pekerjaan penting.
6. Menyediakan laporan produktivitas harian, mingguan, bulanan, dan berdasarkan rentang tanggal.
7. Membantu pengguna mengevaluasi konsistensi dan progres penyelesaian kegiatan.
8. Menyediakan sistem yang dapat digunakan melalui desktop dan smartphone.

---

# 4. Target Pengguna

Website digunakan oleh satu pengguna pribadi.

Pada versi awal, sistem tidak ditujukan sebagai aplikasi multi-user publik. Namun, sistem tetap menggunakan autentikasi agar data hanya dapat diakses oleh pemilik akun.

---

# 5. Ruang Lingkup Produk

## 5.1 Fitur yang Termasuk

Fitur utama yang termasuk dalam pengembangan:

1. Login dan logout.
2. Dashboard.
3. Pengelolaan pekerjaan.
4. Pengelolaan aktivitas harian.
5. Pengelolaan rutinitas.
6. Riwayat rutinitas.
7. Laporan produktivitas.
8. Grafik pekerjaan dan aktivitas.
9. Ekspor laporan PDF dan CSV.
10. Notifikasi di dalam website.
11. Notifikasi browser apabila diizinkan.
12. Tema terang dan gelap.
13. Backup dan restore data.
14. Penghapusan seluruh data.
15. Tampilan responsif untuk desktop dan smartphone.

## 5.2 Fitur yang Belum Termasuk

Fitur berikut tidak menjadi bagian versi awal:

1. Kolaborasi dengan pengguna lain.
2. Pembagian pekerjaan kepada anggota tim.
3. Integrasi Google Calendar.
4. Integrasi WhatsApp atau Telegram.
5. Aplikasi Android atau iOS native.
6. Sinkronisasi dengan layanan manajemen proyek eksternal.
7. Pembuatan kategori aktivitas oleh pengguna.
8. Sistem langganan atau pembayaran.

---

# 6. Arsitektur Sistem

## 6.1 Arsitektur yang Digunakan

Walaupun tampilan website menggunakan HTML, CSS, dan JavaScript, penggunaan SQLite, login, serta akses lintas perangkat membutuhkan backend atau server aplikasi.

Arsitektur yang direkomendasikan:

### Frontend

* HTML5.
* CSS3.
* Vanilla JavaScript.
* Responsive design.
* Komunikasi ke server menggunakan REST API dan format JSON.

### Backend

* JavaScript dengan Node.js.
* Framework server ringan, seperti Express.js.
* Bertanggung jawab atas autentikasi, pengolahan data, validasi, laporan, dan akses database.

### Database

* SQLite.
* Database disimpan pada server.
* Sistem harus menyediakan mekanisme backup berkala.

### Deployment

* Website dijalankan pada VPS atau server pribadi.
* Website diakses menggunakan domain atau alamat server.
* Koneksi produksi wajib menggunakan HTTPS.

## 6.2 Alur Sistem

1. Pengguna membuka website.
2. Pengguna melakukan login.
3. Frontend mengirimkan permintaan ke backend.
4. Backend memvalidasi sesi pengguna.
5. Backend mengambil atau menyimpan data ke SQLite.
6. Backend mengirim respons JSON.
7. Frontend memperbarui tampilan berdasarkan respons tersebut.

---

# 7. Struktur Navigasi

Website memiliki menu utama:

1. Dashboard.
2. Pekerjaan.
3. Aktivitas.
4. Rutinitas.
5. Laporan.
6. Pengaturan.
7. Logout.

Pada desktop, menu ditampilkan melalui sidebar.

Pada smartphone, menu ditampilkan menggunakan sidebar yang dapat dibuka-tutup atau navigasi bawah yang responsif.

---

# 8. Kebutuhan Fungsional

## 8.1 Autentikasi

### Deskripsi

Sistem harus menyediakan halaman login agar website hanya dapat digunakan oleh pengguna yang memiliki akun.

### Data Login

* Username atau email.
* Password.

### Kebutuhan

1. Pengguna dapat melakukan login.
2. Pengguna dapat melakukan logout.
3. Password tidak boleh disimpan dalam bentuk teks biasa.
4. Password harus disimpan dalam bentuk hash.
5. Sistem membuat sesi login yang aman.
6. Sesi dapat berakhir otomatis setelah periode tidak aktif.
7. Pengguna yang belum login tidak dapat membuka halaman utama.
8. Pengguna dapat mengubah password melalui menu Pengaturan.
9. Sistem memberikan pesan jika username atau password salah.
10. Sistem membatasi percobaan login berulang dalam waktu singkat.

### Asumsi Versi Awal

Akun pengguna dibuat pada saat instalasi atau melalui proses setup pertama. Pendaftaran akun publik tidak diperlukan.

---

# 9. Dashboard

## 9.1 Tujuan

Dashboard berfungsi sebagai halaman utama yang memberikan gambaran menyeluruh mengenai pekerjaan, aktivitas, dan rutinitas pengguna.

## 9.2 Kartu Ringkasan

Dashboard menampilkan:

1. Total pekerjaan.
2. Pekerjaan sedang berjalan.
3. Pekerjaan selesai.
4. Pekerjaan tertunda.
5. Aktivitas hari ini.
6. Rutinitas hari ini.
7. Pekerjaan melewati deadline.
8. Persentase pekerjaan selesai.

## 9.3 Grafik Dashboard

Dashboard menampilkan:

### Grafik Aktivitas

Menampilkan jumlah aktivitas berdasarkan:

* Selesai.
* Dibatalkan.
* Belum dikonfirmasi.
* Kategori aktivitas.

### Grafik Pekerjaan

Menampilkan jumlah pekerjaan berdasarkan:

* Sedang berjalan.
* Selesai.
* Tertunda.
* Dibatalkan.
* Melewati deadline.

### Filter Periode

Pengguna dapat memilih:

* Mingguan.
* Bulanan.

Periode bawaan adalah mingguan.

## 9.4 Daftar Pekerjaan Deadline Terdekat

Daftar menampilkan pekerjaan aktif yang memiliki deadline paling dekat.

Informasi yang ditampilkan:

* Judul pekerjaan.
* Prioritas.
* Deadline.
* Status.
* Hitung mundur.
* Tombol lihat detail.

Format hitung mundur:

`DD:HH:MM:SS`

Keterangan:

* `DD`: hari.
* `HH`: jam.
* `MM`: menit.
* `SS`: detik.

Contoh:

`02:14:30:45`

Artinya deadline tersisa 2 hari, 14 jam, 30 menit, dan 45 detik.

### Aturan Hitung Mundur

1. Hitung mundur diperbarui setiap detik.
2. Hitung mundur menggunakan waktu server sebagai acuan.
3. Ketika deadline terlewati, hitung mundur berhenti.
4. Sistem menampilkan label **Terlambat**.
5. Warna indikator berubah berdasarkan kedekatan deadline.
6. Pekerjaan selesai dan dibatalkan tidak ditampilkan dalam daftar deadline terdekat.
7. Pekerjaan tertunda tetap dapat ditampilkan jika deadline belum diubah.

## 9.5 Daftar Kegiatan Hari Ini

Daftar kegiatan hari ini menggabungkan:

* Aktivitas harian.
* Rutinitas.

Setiap item harus memiliki label jenis:

* Aktivitas.
* Rutinitas.

Informasi yang ditampilkan:

* Judul.
* Jenis kegiatan.
* Kategori untuk aktivitas.
* Jam mulai.
* Jam selesai.
* Prioritas.
* Status.
* Tombol tindakan.

Daftar diurutkan berdasarkan jam mulai terdekat.

## 9.6 Perilaku Aktivitas di Dashboard

1. Aktivitas ditampilkan berdasarkan tanggal hari ini.
2. Aktivitas yang belum mencapai jam mulai memiliki status **Akan datang**.
3. Aktivitas yang sedang berada dalam rentang waktunya memiliki status **Sedang berlangsung**.
4. Aktivitas yang sudah melewati jam selesai tidak langsung hilang.
5. Aktivitas tersebut berubah menjadi **Menunggu konfirmasi**.
6. Pengguna harus memilih:

   * Selesai.
   * Dibatalkan.
7. Aktivitas baru hilang dari daftar aktif setelah dikonfirmasi.
8. Riwayat aktivitas tetap disimpan untuk laporan.

## 9.7 Perilaku Rutinitas di Dashboard

1. Rutinitas muncul otomatis berdasarkan hari aktif.
2. Rutinitas ditampilkan sesuai jam mulai dan jam selesai.
3. Rutinitas yang telah selesai dapat ditandai selesai.
4. Rutinitas yang melewati jam selesai tanpa konfirmasi dicatat sebagai **Terlewat**.
5. Setelah rutinitas lewat, sistem menampilkan rutinitas berikutnya.
6. Semua hasil rutinitas disimpan sebagai riwayat.
7. Riwayat digunakan dalam perhitungan laporan.

---

# 10. Modul Pekerjaan

## 10.1 Form Pekerjaan

Form penambahan pekerjaan berisi:

1. Judul.
2. Deskripsi.
3. Status.
4. Prioritas.
5. Tanggal mulai.
6. Deadline.

## 10.2 Status Pekerjaan

Status yang dapat dipilih:

* Sedang berjalan.
* Selesai.
* Tertunda.
* Dibatalkan.

Status bawaan ketika pekerjaan dibuat adalah **Sedang berjalan**.

## 10.3 Prioritas Pekerjaan

Prioritas terdiri dari:

* Rendah.
* Sedang.
* Tinggi.
* Mendesak.

## 10.4 Daftar Pekerjaan

Daftar pekerjaan menampilkan:

* Judul.
* Status.
* Prioritas.
* Tanggal mulai.
* Deadline.
* Indikator terlambat.
* Aksi.

## 10.5 Fitur Pengelolaan

Pengguna dapat:

1. Menambahkan pekerjaan.
2. Melihat detail pekerjaan.
3. Mengedit pekerjaan.
4. Menghapus pekerjaan.
5. Mengubah status.
6. Menandai pekerjaan selesai.
7. Mencari pekerjaan.
8. Memfilter pekerjaan.
9. Mengurutkan pekerjaan.
10. Menggunakan pagination.

## 10.6 Filter Pekerjaan

Pekerjaan dapat difilter berdasarkan:

* Status.
* Prioritas.
* Tanggal mulai.
* Deadline.
* Pekerjaan terlambat.
* Rentang tanggal.

## 10.7 Pengurutan Pekerjaan

Pekerjaan dapat diurutkan berdasarkan:

* Deadline terdekat.
* Deadline terjauh.
* Prioritas tertinggi.
* Prioritas terendah.
* Terbaru dibuat.
* Terlama dibuat.
* Judul.

## 10.8 Aturan Deadline

1. Deadline harus lebih besar atau sama dengan tanggal mulai.
2. Pekerjaan dianggap melewati deadline jika:

   * Waktu deadline sudah terlewati.
   * Status belum selesai.
   * Status belum dibatalkan.
3. **Terlambat** bukan status yang dipilih pengguna.
4. Terlambat merupakan kondisi otomatis yang dihitung sistem.
5. Pekerjaan yang selesai setelah deadline tetap dicatat sebagai pernah terlambat.
6. Waktu penyelesaian harus disimpan ketika status diubah menjadi selesai.

---

# 11. Modul Aktivitas Harian

## 11.1 Form Aktivitas

Form aktivitas berisi:

1. Judul.
2. Kategori.
3. Tanggal.
4. Status.
5. Jam mulai.
6. Jam selesai.
7. Catatan.

## 11.2 Kategori Aktivitas

Kategori bersifat tetap:

* Pekerjaan.
* Belajar.
* Olahraga.
* Sosial.
* Pribadi.

Pengguna tidak dapat menambahkan, mengubah, atau menghapus kategori.

## 11.3 Status Aktivitas

Status aktivitas terdiri dari:

* Terjadwal.
* Selesai.
* Dibatalkan.

Sistem juga dapat menampilkan status turunan:

* Akan datang.
* Sedang berlangsung.
* Menunggu konfirmasi.

Status turunan dihitung otomatis dan tidak disimpan sebagai status utama.

## 11.4 Daftar Aktivitas

Daftar aktivitas menampilkan:

* Judul.
* Kategori.
* Tanggal.
* Jam mulai.
* Jam selesai.
* Status.
* Catatan singkat.
* Aksi.

## 11.5 Fitur Pengelolaan

Pengguna dapat:

1. Menambahkan aktivitas.
2. Melihat detail.
3. Mengedit aktivitas.
4. Menghapus aktivitas.
5. Menandai selesai.
6. Membatalkan aktivitas.
7. Mencari aktivitas.
8. Memfilter aktivitas.
9. Mengurutkan aktivitas.
10. Menggunakan pagination.

## 11.6 Filter Aktivitas

Aktivitas dapat difilter berdasarkan:

* Kategori.
* Status.
* Tanggal.
* Rentang tanggal.
* Jam mulai.
* Jam selesai.

## 11.7 Validasi Aktivitas

1. Judul wajib diisi.
2. Kategori wajib dipilih.
3. Tanggal wajib diisi.
4. Jam mulai wajib diisi.
5. Jam selesai wajib diisi.
6. Jam selesai harus lebih besar dari jam mulai.
7. Jika jadwal bertabrakan, sistem memberikan peringatan.
8. Pengguna tetap dapat menyimpan aktivitas meskipun jadwal bertabrakan.

---

# 12. Modul Rutinitas

## 12.1 Form Rutinitas

Form rutinitas berisi:

1. Judul.
2. Hari aktif.
3. Jam mulai.
4. Jam selesai.
5. Prioritas.
6. Catatan.

## 12.2 Hari Aktif

Pengguna dapat memilih satu atau beberapa hari:

* Senin.
* Selasa.
* Rabu.
* Kamis.
* Jumat.
* Sabtu.
* Minggu.

## 12.3 Prioritas Rutinitas

Prioritas terdiri dari:

* Rendah.
* Sedang.
* Tinggi.
* Mendesak.

## 12.4 Daftar Rutinitas

Daftar rutinitas menampilkan:

* Judul.
* Hari aktif.
* Jam mulai.
* Jam selesai.
* Prioritas.
* Status aktif.
* Aksi.

## 12.5 Fitur Pengelolaan

Pengguna dapat:

1. Menambahkan rutinitas.
2. Melihat detail.
3. Mengedit rutinitas.
4. Menghapus rutinitas.
5. Mengaktifkan rutinitas.
6. Menonaktifkan rutinitas.
7. Menandai rutinitas hari ini selesai.
8. Mencari rutinitas.
9. Memfilter rutinitas.
10. Mengurutkan rutinitas.
11. Menggunakan pagination.

## 12.6 Riwayat Rutinitas

Setiap kemunculan rutinitas menghasilkan satu data riwayat.

Riwayat rutinitas menyimpan:

* Rutinitas.
* Tanggal pelaksanaan.
* Jadwal mulai.
* Jadwal selesai.
* Status pelaksanaan.
* Waktu konfirmasi.
* Catatan tambahan.

Status riwayat:

* Selesai.
* Terlewat.
* Dibatalkan.

## 12.7 Aturan Rutinitas

1. Rutinitas muncul otomatis berdasarkan hari aktif.
2. Rutinitas yang dinonaktifkan tidak muncul di dashboard.
3. Rutinitas yang belum dikonfirmasi sampai melewati jam selesai dicatat sebagai terlewat.
4. Riwayat tidak boleh hilang ketika rutinitas utama diedit.
5. Penghapusan rutinitas tidak secara otomatis menghapus riwayat.
6. Sistem harus meminta konfirmasi sebelum menghapus rutinitas.
7. Rutinitas yang bertabrakan dengan aktivitas atau rutinitas lain tetap dapat disimpan setelah peringatan ditampilkan.

---

# 13. Deteksi Benturan Jadwal

## 13.1 Jenis Benturan

Sistem mendeteksi benturan antara:

* Aktivitas dengan aktivitas.
* Aktivitas dengan rutinitas.
* Rutinitas dengan rutinitas.

## 13.2 Perilaku Sistem

Ketika benturan ditemukan, sistem menampilkan:

* Nama kegiatan yang bertabrakan.
* Tanggal atau hari.
* Rentang waktu benturan.
* Jenis kegiatan.

Pesan contoh:

> Jadwal ini bertabrakan dengan rutinitas “Olahraga Pagi” pukul 06.00–07.00.

Pengguna dapat memilih:

* Kembali dan mengubah jadwal.
* Tetap simpan.

Benturan jadwal tidak menggagalkan penyimpanan data.

---

# 14. Modul Laporan

## 14.1 Periode Laporan

Pengguna dapat memilih:

* Harian.
* Mingguan.
* Bulanan.
* Rentang tanggal khusus.

## 14.2 Informasi Laporan

Laporan memuat:

1. Total pekerjaan.
2. Total pekerjaan selesai.
3. Total pekerjaan sedang berjalan.
4. Total pekerjaan tertunda.
5. Total pekerjaan dibatalkan.
6. Total pekerjaan melewati deadline.
7. Persentase pekerjaan selesai.
8. Total aktivitas.
9. Total aktivitas selesai.
10. Total aktivitas dibatalkan.
11. Aktivitas paling sering dilakukan.
12. Distribusi kategori aktivitas.
13. Total rutinitas terjadwal.
14. Total rutinitas selesai.
15. Total rutinitas terlewat.
16. Persentase penyelesaian rutinitas.
17. Grafik pekerjaan.
18. Grafik aktivitas.
19. Grafik rutinitas.
20. Ringkasan produktivitas.

## 14.3 Perhitungan Persentase

### Persentase Pekerjaan Selesai

`Jumlah pekerjaan selesai ÷ total pekerjaan × 100%`

Pekerjaan dibatalkan dapat dikeluarkan dari pembagi agar persentase mencerminkan pekerjaan yang benar-benar dijalankan.

### Persentase Rutinitas Selesai

`Jumlah rutinitas selesai ÷ total riwayat rutinitas × 100%`

### Aktivitas Paling Sering

Sistem menghitung:

* Judul aktivitas yang paling sering dibuat.
* Kategori aktivitas yang paling sering digunakan.

## 14.4 Ringkasan Otomatis

Sistem menghasilkan ringkasan berbasis data, misalnya:

> Pada minggu ini, Anda menyelesaikan 8 dari 10 pekerjaan aktif. Kategori aktivitas yang paling sering dilakukan adalah belajar. Terdapat 2 pekerjaan yang melewati deadline dan 3 rutinitas yang terlewat.

Ringkasan dibuat berdasarkan aturan perhitungan dan tidak membutuhkan kecerdasan buatan.

---

# 15. Ekspor Laporan

## 15.1 Ekspor PDF

PDF memiliki format formal dan memuat:

1. Judul laporan.
2. Nama pengguna.
3. Periode laporan.
4. Tanggal dan waktu cetak.
5. Ringkasan.
6. Statistik utama.
7. Grafik.
8. Tabel pekerjaan.
9. Tabel aktivitas.
10. Tabel rutinitas.
11. Nomor halaman.

Nama file contoh:

`laporan-produktivitas-2026-06.pdf`

## 15.2 Ekspor CSV

Pengguna dapat mengekspor:

* Data pekerjaan.
* Data aktivitas.
* Riwayat rutinitas.
* Ringkasan laporan.

Jika beberapa jenis data diekspor sekaligus, sistem dapat menghasilkan beberapa file CSV atau satu file ZIP.

## 15.3 Aturan Ekspor

1. Data ekspor mengikuti filter periode.
2. Waktu ekspor menggunakan Asia/Jakarta.
3. Isi file harus sama dengan data yang ditampilkan.
4. Karakter khusus harus tetap terbaca.
5. File CSV menggunakan encoding UTF-8.

---

# 16. Notifikasi

## 16.1 Jenis Notifikasi

Sistem memberikan notifikasi untuk:

1. Pekerjaan mendekati deadline.
2. Aktivitas akan dimulai.
3. Rutinitas akan dimulai.
4. Pekerjaan melewati deadline.

## 16.2 Media Notifikasi

Notifikasi dapat ditampilkan melalui:

* Pusat notifikasi di dalam website.
* Toast atau pop-up di dalam website.
* Notifikasi browser jika pengguna memberikan izin.

## 16.3 Pengaturan Notifikasi

Pengguna dapat:

* Mengaktifkan atau menonaktifkan semua notifikasi.
* Mengaktifkan atau menonaktifkan notifikasi pekerjaan.
* Mengaktifkan atau menonaktifkan notifikasi aktivitas.
* Mengaktifkan atau menonaktifkan notifikasi rutinitas.
* Menentukan waktu pengingat.

Pilihan awal waktu pengingat:

* Saat dimulai.
* 5 menit sebelumnya.
* 15 menit sebelumnya.
* 30 menit sebelumnya.
* 1 jam sebelumnya.
* 1 hari sebelum deadline untuk pekerjaan.

## 16.4 Aturan Notifikasi

1. Notifikasi tidak dikirim berulang kali untuk kejadian yang sama.
2. Status pengiriman notifikasi disimpan.
3. Browser notification hanya bekerja setelah pengguna memberikan izin.
4. Notifikasi dalam website tetap tersedia walaupun izin browser ditolak.
5. Pekerjaan selesai atau dibatalkan tidak menghasilkan notifikasi deadline baru.

---

# 17. Menu Pengaturan

Menu Pengaturan terdiri dari:

## 17.1 Profil

* Nama pengguna.
* Username atau email.
* Ubah password.

## 17.2 Tampilan

* Tema terang.
* Tema gelap.
* Tema mengikuti sistem perangkat.

Pilihan tema harus disimpan pada akun pengguna.

## 17.3 Notifikasi

* Aktif/nonaktif notifikasi.
* Jenis notifikasi.
* Waktu pengingat.
* Izin browser notification.

## 17.4 Backup Data

Pengguna dapat mengunduh backup seluruh data.

Backup minimal berisi:

* Data akun yang aman.
* Pekerjaan.
* Aktivitas.
* Rutinitas.
* Riwayat rutinitas.
* Pengaturan.
* Data notifikasi yang relevan.

Format backup disarankan menggunakan JSON atau salinan database yang telah diamankan.

## 17.5 Restore Data

1. Pengguna dapat memilih file backup.
2. Sistem memvalidasi format file.
3. Sistem menampilkan ringkasan isi backup.
4. Sistem meminta konfirmasi.
5. Sistem membuat backup otomatis sebelum restore.
6. Sistem menolak file yang rusak atau tidak sesuai format.
7. Sistem menampilkan hasil restore.

## 17.6 Hapus Seluruh Data

Pengguna dapat menghapus seluruh:

* Pekerjaan.
* Aktivitas.
* Rutinitas.
* Riwayat.
* Notifikasi.
* Laporan tersimpan.

Sistem wajib:

1. Menampilkan peringatan.
2. Meminta password.
3. Meminta pengguna mengetik kalimat konfirmasi.
4. Menjelaskan bahwa tindakan tidak dapat dibatalkan.
5. Tidak menghapus akun login kecuali dipilih secara khusus.

---

# 18. Aturan Waktu dan Zona Waktu

1. Zona waktu utama adalah Asia/Jakarta atau WIB.
2. Data waktu sebaiknya disimpan dalam format UTC di database.
3. Data ditampilkan dalam zona Asia/Jakarta.
4. Waktu server menjadi sumber utama untuk deadline dan status.
5. Waktu perangkat digunakan untuk membantu tampilan antarmuka.
6. Sistem tidak boleh hanya mengandalkan waktu perangkat karena waktu perangkat dapat diubah.
7. Frontend melakukan sinkronisasi waktu dengan server.
8. Semua perhitungan countdown menggunakan waktu server.
9. Format tanggal yang digunakan adalah `DD/MM/YYYY`.
10. Format jam yang digunakan adalah 24 jam, yaitu `HH:mm`.

---

# 19. Aturan Bisnis Utama

1. Pengguna harus login untuk mengakses data.
2. Pekerjaan memiliki satu status utama.
3. Kondisi terlambat dihitung otomatis.
4. Aktivitas yang melewati jam selesai tetap tampil sampai dikonfirmasi.
5. Rutinitas yang melewati jam selesai dapat otomatis dicatat sebagai terlewat.
6. Rutinitas menghasilkan riwayat berdasarkan hari aktif.
7. Benturan jadwal hanya menghasilkan peringatan.
8. Data yang bertabrakan tetap dapat disimpan.
9. Aktivitas dan rutinitas harus memiliki label berbeda di dashboard.
10. Penghapusan data memerlukan konfirmasi.
11. Semua perubahan penting menyimpan waktu dibuat dan waktu diperbarui.
12. Data riwayat tidak berubah ketika template rutinitas diedit.
13. Pekerjaan selesai menyimpan waktu penyelesaian.
14. Notifikasi yang sama tidak boleh dikirim lebih dari sekali.
15. Semua laporan mengikuti periode yang dipilih pengguna.

---

# 20. Model Data Konseptual

## 20.1 Tabel Users

Field utama:

* id.
* username.
* email.
* password_hash.
* display_name.
* theme.
* timezone.
* created_at.
* updated_at.
* last_login_at.

## 20.2 Tabel Tasks

Field utama:

* id.
* user_id.
* title.
* description.
* status.
* priority.
* start_at.
* deadline_at.
* completed_at.
* created_at.
* updated_at.
* deleted_at.

## 20.3 Tabel Activities

Field utama:

* id.
* user_id.
* title.
* category.
* activity_date.
* start_time.
* end_time.
* status.
* notes.
* confirmed_at.
* created_at.
* updated_at.
* deleted_at.

## 20.4 Tabel Routines

Field utama:

* id.
* user_id.
* title.
* start_time.
* end_time.
* priority.
* notes.
* is_active.
* created_at.
* updated_at.
* deleted_at.

## 20.5 Tabel Routine Days

Field utama:

* id.
* routine_id.
* day_of_week.

## 20.6 Tabel Routine Histories

Field utama:

* id.
* routine_id.
* user_id.
* routine_title_snapshot.
* scheduled_date.
* scheduled_start.
* scheduled_end.
* status.
* confirmed_at.
* notes.
* created_at.

Judul dan jadwal disimpan sebagai snapshot agar riwayat lama tidak berubah ketika rutinitas utama diedit.

## 20.7 Tabel Notifications

Field utama:

* id.
* user_id.
* entity_type.
* entity_id.
* notification_type.
* title.
* message.
* scheduled_at.
* sent_at.
* read_at.
* status.
* created_at.

## 20.8 Tabel Settings

Field utama:

* id.
* user_id.
* notification_enabled.
* task_notification_enabled.
* activity_notification_enabled.
* routine_notification_enabled.
* task_reminder_minutes.
* activity_reminder_minutes.
* routine_reminder_minutes.
* created_at.
* updated_at.

---

# 21. API Utama

Endpoint awal yang dibutuhkan:

## Autentikasi

* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/session`
* `PUT /api/auth/password`

## Dashboard

* `GET /api/dashboard/summary`
* `GET /api/dashboard/today`
* `GET /api/dashboard/deadlines`
* `GET /api/dashboard/charts`

## Pekerjaan

* `GET /api/tasks`
* `POST /api/tasks`
* `GET /api/tasks/:id`
* `PUT /api/tasks/:id`
* `DELETE /api/tasks/:id`
* `PATCH /api/tasks/:id/status`

## Aktivitas

* `GET /api/activities`
* `POST /api/activities`
* `GET /api/activities/:id`
* `PUT /api/activities/:id`
* `DELETE /api/activities/:id`
* `PATCH /api/activities/:id/status`

## Rutinitas

* `GET /api/routines`
* `POST /api/routines`
* `GET /api/routines/:id`
* `PUT /api/routines/:id`
* `DELETE /api/routines/:id`
* `PATCH /api/routines/:id/toggle`
* `POST /api/routines/:id/confirm`

## Laporan

* `GET /api/reports/summary`
* `GET /api/reports/tasks`
* `GET /api/reports/activities`
* `GET /api/reports/routines`
* `GET /api/reports/export/pdf`
* `GET /api/reports/export/csv`

## Pengaturan

* `GET /api/settings`
* `PUT /api/settings`
* `POST /api/settings/backup`
* `POST /api/settings/restore`
* `DELETE /api/settings/all-data`

---

# 22. Desain Antarmuka

## 22.1 Gaya Visual

Tampilan menggunakan gaya dashboard modern dengan karakteristik:

* Bersih.
* Minimalis.
* Profesional.
* Informasi mudah dipindai.
* Menggunakan kartu statistik.
* Menggunakan ikon yang konsisten.
* Memiliki jarak antar elemen yang nyaman.
* Mendukung tema terang dan gelap.

## 22.2 Warna Status

Warna harus konsisten, misalnya:

* Hijau untuk selesai.
* Biru untuk sedang berjalan.
* Kuning atau oranye untuk tertunda.
* Merah untuk terlambat dan mendesak.
* Abu-abu untuk dibatalkan.
* Ungu atau warna khusus untuk rutinitas.

Warna tidak boleh menjadi satu-satunya pembeda. Setiap status tetap harus memiliki teks atau ikon.

## 22.3 Responsive Design

### Desktop

* Sidebar permanen.
* Grafik dapat ditampilkan berdampingan.
* Tabel menggunakan beberapa kolom.
* Form dapat menggunakan tata letak dua kolom.

### Smartphone

* Sidebar dapat dibuka-tutup.
* Kartu statistik dapat digeser atau ditumpuk.
* Grafik memenuhi lebar layar.
* Tabel dapat berubah menjadi card list.
* Tombol utama mudah dijangkau.
* Ukuran target sentuh minimal nyaman digunakan.

---

# 23. Kebutuhan Nonfungsional

## 23.1 Performa

1. Halaman dashboard sebaiknya tampil dalam waktu maksimal 3 detik pada koneksi normal.
2. Interaksi umum harus memberikan respons visual kurang dari 1 detik.
3. Daftar menggunakan pagination agar tidak memuat seluruh data sekaligus.
4. Query database harus menggunakan index pada kolom tanggal, deadline, status, dan user.

## 23.2 Keamanan

1. Website produksi wajib menggunakan HTTPS.
2. Password disimpan menggunakan hash yang aman.
3. Cookie sesi menggunakan `HttpOnly`, `Secure`, dan pengaturan `SameSite`.
4. Semua input divalidasi di frontend dan backend.
5. Sistem menggunakan parameterized query untuk mencegah SQL injection.
6. Login memiliki rate limiting.
7. Endpoint hanya dapat diakses setelah autentikasi.
8. File restore harus divalidasi.
9. Pesan kesalahan tidak boleh menampilkan detail database.
10. Backup yang berisi data sensitif harus dilindungi.

## 23.3 Keandalan

1. Sistem melakukan backup database secara berkala.
2. Operasi restore harus menggunakan transaksi database.
3. Penghapusan massal harus menggunakan transaksi.
4. Jika proses gagal, perubahan harus dibatalkan.
5. Sistem harus memiliki pencatatan error.

## 23.4 Kompatibilitas

Website minimal mendukung versi terbaru dari:

* Google Chrome.
* Microsoft Edge.
* Mozilla Firefox.
* Safari.
* Browser Android.
* Browser iOS.

## 23.5 Aksesibilitas

1. Form memiliki label yang jelas.
2. Kontras teks mencukupi.
3. Navigasi dapat digunakan dengan keyboard.
4. Tombol memiliki nama yang dapat dibaca screen reader.
5. Grafik memiliki ringkasan teks.
6. Kesalahan form dijelaskan dengan teks.

---

# 24. Kriteria Penerimaan Utama

Produk dianggap memenuhi versi awal apabila:

1. Pengguna dapat login dan logout.
2. Pengguna dapat mengakses data yang sama melalui desktop dan smartphone.
3. Pengguna dapat membuat, mengedit, menghapus, mencari, memfilter, dan mengurutkan pekerjaan.
4. Pengguna dapat membuat dan mengelola aktivitas.
5. Pengguna dapat membuat rutinitas berulang berdasarkan hari aktif.
6. Dashboard menampilkan statistik pekerjaan, aktivitas, dan rutinitas.
7. Countdown deadline tampil dalam format `DD:HH:MM:SS`.
8. Countdown menggunakan waktu server.
9. Aktivitas yang melewati waktunya tetap tampil sampai dikonfirmasi.
10. Rutinitas yang lewat dicatat dalam riwayat.
11. Sistem menampilkan peringatan ketika terjadi benturan jadwal.
12. Jadwal tetap dapat disimpan meskipun bertabrakan.
13. Dashboard membedakan aktivitas dan rutinitas.
14. Grafik dapat ditampilkan dalam periode mingguan dan bulanan.
15. Laporan dapat difilter berdasarkan periode.
16. Laporan dapat diekspor ke PDF.
17. Data dapat diekspor ke CSV.
18. Pengguna dapat mengganti tema.
19. Pengguna dapat melakukan backup dan restore.
20. Pengguna dapat menghapus seluruh data melalui konfirmasi berlapis.
21. Tampilan dapat digunakan dengan nyaman pada smartphone.
22. Notifikasi pekerjaan, aktivitas, dan rutinitas dapat dikonfigurasi.

---

# 25. Tahapan Pengembangan

## Tahap 1 — Fondasi

* Struktur frontend.
* Backend Node.js.
* Database SQLite.
* Sistem login.
* Layout dashboard.
* Responsive navigation.

## Tahap 2 — Pekerjaan

* CRUD pekerjaan.
* Status dan prioritas.
* Filter dan pencarian.
* Countdown deadline.
* Deteksi pekerjaan terlambat.

## Tahap 3 — Aktivitas

* CRUD aktivitas.
* Kategori tetap.
* Status aktivitas.
* Konfirmasi aktivitas lewat waktu.
* Deteksi benturan jadwal.

## Tahap 4 — Rutinitas

* CRUD rutinitas.
* Pemilihan hari aktif.
* Kemunculan rutinitas otomatis.
* Riwayat rutinitas.
* Status selesai dan terlewat.

## Tahap 5 — Dashboard dan Grafik

* Kartu ringkasan.
* Daftar deadline terdekat.
* Daftar kegiatan hari ini.
* Grafik mingguan.
* Grafik bulanan.

## Tahap 6 — Laporan

* Filter periode.
* Statistik.
* Ringkasan otomatis.
* Ekspor PDF.
* Ekspor CSV.

## Tahap 7 — Pengaturan

* Profil pengguna.
* Tema.
* Notifikasi.
* Backup.
* Restore.
* Hapus seluruh data.

## Tahap 8 — Penyempurnaan

* Pengujian responsif.
* Pengujian keamanan.
* Pengujian performa.
* Perbaikan antarmuka.
* Deployment ke server.
* Konfigurasi HTTPS.
* Backup otomatis.

---

# 26. Prioritas MVP

Fitur yang wajib tersedia pada MVP:

1. Login.
2. Dashboard dasar.
3. CRUD pekerjaan.
4. CRUD aktivitas.
5. CRUD rutinitas.
6. Riwayat rutinitas.
7. Countdown deadline.
8. Kegiatan hari ini.
9. Deteksi jadwal bertabrakan.
10. Grafik mingguan dan bulanan.
11. Laporan dasar.
12. Ekspor PDF dan CSV.
13. Responsive design.
14. Tema terang dan gelap.
15. Backup dan restore.

Notifikasi browser dapat dikembangkan setelah notifikasi di dalam website berjalan dengan stabil.

---

# 27. Risiko Pengembangan

## SQLite pada Server

SQLite cocok untuk aplikasi pribadi dengan jumlah pengguna dan transaksi rendah. Namun, akses database harus tetap dilakukan melalui backend. File SQLite tidak boleh diakses langsung oleh browser.

## Notifikasi Browser

Notifikasi browser bergantung pada:

* Izin pengguna.
* Dukungan browser.
* Status website.
* Penggunaan HTTPS.

Notifikasi di dalam website tetap diperlukan sebagai mekanisme utama.

## Ketepatan Waktu

Waktu perangkat dapat berbeda dari waktu server. Karena itu, deadline dan status harus dihitung menggunakan waktu server.

## Backup

Kerusakan atau kehilangan server dapat menghilangkan database. Backup otomatis harus disimpan di lokasi yang berbeda dari database utama.

## Rutinitas Terlewat

Proses penandaan rutinitas sebagai terlewat harus dijalankan secara konsisten. Sistem dapat memeriksa rutinitas terlewat ketika dashboard dibuka dan melalui scheduler pada server.

---

# 28. Definisi Selesai

Sebuah fitur dianggap selesai apabila:

1. Antarmuka sudah dibuat.
2. Validasi frontend tersedia.
3. Validasi backend tersedia.
4. Data tersimpan di SQLite.
5. Fitur dapat digunakan pada desktop.
6. Fitur dapat digunakan pada smartphone.
7. Kondisi berhasil dan gagal sudah ditangani.
8. Pesan kesalahan mudah dipahami.
9. Fitur telah melalui pengujian.
10. Tidak terdapat kesalahan kritis.
11. Kriteria penerimaan fitur telah terpenuhi.

---

# 29. Kesimpulan

Personal Productivity Dashboard akan menjadi pusat pengelolaan pekerjaan, aktivitas, dan rutinitas pribadi. Website dibangun menggunakan HTML, CSS, dan JavaScript pada frontend, serta JavaScript pada backend dengan database SQLite.

Sistem memprioritaskan kemudahan penggunaan, tampilan dashboard modern, akses lintas perangkat, pengelolaan deadline, pencatatan riwayat, laporan produktivitas, dan keamanan data pribadi.

Dokumen ini menjadi acuan utama dalam proses desain, pengembangan, pengujian, dan penerimaan produk.
