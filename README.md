# MSQ Quranic Hub

Prompt untuk Lovable.dev — ERP Ma'had Sabilul Qur'an (MSQ)

Salin seluruh isi di bawah ini dan tempel ke Lovable.dev sebagai prompt awal project.

PROMPT

Bangun aplikasi web ERP (Enterprise Resource Planning) untuk pesantren tahfizh Qur'an bernama Ma'had Sabilul Qur'an (MSQ), skala 100-300 santri. Gunakan React + Supabase sebagai backend (auth, database, storage).

Konsep dasar

Satu database induk santri menjadi pusat data. Empat modul utama menarik dan menulis ke data induk yang sama: Akademik & Tahfizh, Keuangan & SPP, SDM/Kepegawaian, dan Donasi/Wakaf & Unit Usaha. Sistem menggunakan role-based access control dengan 4 peran: Admin/TU, Ustadz/Musyrif, Wali Santri, dan Santri.

1. Autentikasi & Role

Login dengan email/password (Supabase Auth).

4 role: admin, ustadz, wali, santri.

Setiap role punya dashboard dan menu berbeda sesuai hak akses.

Admin bisa membuat/mengelola akun user lain dan assign role.

Wali santri hanya bisa melihat data anak yang terhubung dengan akunnya (relasi wali-santri many-to-many untuk kasus wali dengan beberapa anak).

Santri hanya bisa melihat data dirinya sendiri (read-only untuk sebagian besar data).

2. Data Induk Santri (Core)

Tabel santri dengan field: nama lengkap, NIS, tanggal lahir, alamat, kelas/halaqah, angkatan, status (aktif/lulus/keluar), foto, data wali (nama, no HP, hubungan), tanggal masuk.

3. Modul Akademik & Tahfizh

Pencatatan setoran hafalan harian: santri, juz, halaman/ayat, tanggal, kualitas (lancar/perlu ulang), catatan ustadz, nama ustadz penguji.

Dashboard progres hafalan per santri (visual: juz yang sudah selesai vs target, progress bar).

Jadwal & hasil munaqasyah (ujian tahfizh) per juz.

Rapor otomatis per semester: rekap hafalan, nilai akademik umum (jika ada pelajaran tambahan), catatan akhlak dari musyrif.

Ustadz input dari halaman "kelas saya" — hanya bisa input untuk santri di halaqah yang diampu.

Wali & santri bisa lihat progres secara real-time.

4. Modul Keuangan & SPP

Tagihan bulanan otomatis per santri (generate tiap awal bulan berdasarkan kelas/paket biaya).

Riwayat pembayaran & status (lunas/belum/menunggak).

Wali bisa lihat tagihan anaknya dan tanda upload bukti transfer (manual dulu, tidak perlu payment gateway di versi awal — cukup field upload bukti + status verifikasi admin).

Admin verifikasi pembayaran manual.

Laporan kas: pemasukan SPP per bulan, grafik tren, breakdown per kelas.

Riwayat tunggakan dengan reminder otomatis (badge/notifikasi visual, bukan perlu WA gateway dulu).

5. Modul SDM & Kepegawaian

Data ustadz/staff: nama, jabatan, no rekening, tanggal mulai kerja.

Presensi harian (check-in manual oleh admin atau self check-in ustadz).

Rekap kehadiran bulanan untuk dasar payroll.

Pengajuan & approval cuti/izin sederhana (form + status pending/approved/rejected).

Payroll sederhana: gaji pokok + potongan/tambahan manual, generate slip gaji (bisa PDF).

6. Modul Donasi, Wakaf & Unit Usaha

Pencatatan donasi masuk: nama donatur (atau anonim), jumlah, tanggal, jenis (donasi umum/wakaf/zakat), metode.

Laporan transparansi publik: total donasi masuk vs penggunaan dana, ditampilkan sebagai halaman publik (tanpa login) untuk kepercayaan donatur.

Pencatatan unit usaha (kantin, percetakan, dll) sebagai kategori terpisah tapi tetap terhubung ke laporan keuangan induk (modul 4).

7. Dashboard per Role

Admin/TU: ringkasan seluruh modul — jumlah santri aktif, total tunggakan SPP, progres hafalan rata-rata, donasi bulan ini.

Ustadz: daftar santri di halaqah-nya, input cepat setoran hafalan hari ini, presensi diri.

Wali Santri: progres hafalan anak, status tagihan SPP, upload bukti bayar, rapor.

Santri: progres hafalan sendiri (read-only), jadwal, pengumuman.

8. Desain & UX

Bahasa Indonesia, nuansa islami yang bersih dan profesional (bukan norak) — palet warna hijau tua/emerald dan putih, tipografi jelas dan mudah dibaca, cocok untuk pengguna dari berbagai usia (ustadz senior sampai santri).

Mobile-responsive karena wali santri kemungkinan besar akses dari HP.

Sidebar navigasi berbeda per role.

Gunakan komponen shadcn/ui untuk konsistensi.

9. Struktur database yang disarankan (Supabase)

Buatkan tabel: profiles (user + role), santri, wali_santri (relasi), halaqah, setoran_hafalan, munaqasyah, tagihan_spp, pembayaran_spp, pegawai, presensi_pegawai, payroll, donasi, unit_usaha_transaksi. Terapkan Row Level Security (RLS) di Supabase sesuai role masing-masing.

Urutan pembangunan (mulai dari MVP)

Auth + role + data induk santri

Modul Akademik & Tahfizh (paling sering dipakai harian)

Modul Keuangan & SPP

Dashboard per role

Modul SDM & Kepegawaian

Modul Donasi/Wakaf & Unit Usaha + halaman publik transparansi

Mulai dengan poin 1 dan 2 dulu sebagai fondasi, lalu lanjutkan ke poin berikutnya setelah saya konfirmasi.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b699453-977b-4402-8ee0-2b99b7351680).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
