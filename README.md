# ACIS POS v2.4.1 — SaaS Business Edition

**Tagline:** Solusi Kasir Cerdas untuk Bisnis Bertumbuh.

Versi 2.3 mempertahankan PostgreSQL multi-tenant dan memperbarui pengalaman customer serta kontrol internal ACIS.


## Update utama v2.4.1

- Admin ACIS dapat mengganti password sendiri dari halaman `/admin` melalui tombol **Ganti Password**.
- Perubahan password memverifikasi password lama dan menyimpan hash bcrypt baru.


- Registrasi akun mandiri dari halaman login dengan **trial otomatis 7 hari**.
- Halaman login customer tidak lagi menampilkan istilah teknis database/arsitektur.
- Laporan **Penjualan per Metode Bayar** menampilkan jumlah transaksi sekaligus **nilai penjualan** per metode.
- Dashboard menambahkan grafik **Barang Terlaris Bulan Ini** berdasarkan kuantitas terjual dan omzet.
- Setelah trial berakhir, aktivasi paket tetap dikontrol manual oleh Admin ACIS melalui `/admin`.

## Update utama v2.2

- **Integrasi Accurate Online satu arah**: customer hanya melihat tombol **Hubungkan ke Accurate Online**, memilih Data Usaha, lalu **Kirim Data Sekarang**. Client ID/Client Secret tidak pernah ditampilkan di halaman customer. Data yang dikirim adalah Faktur Penjualan dan Penerimaan Penjualan yang belum pernah tersinkron.
- **Laporan keuangan profesional**: Buku Besar, Laba Rugi bertingkat, dan Laporan Posisi Keuangan/Neraca dengan pengelompokan aset, liabilitas dan ekuitas. Struktur penyajian dibuat bergaya laporan keuangan PSAK; penerapan PSAK penuh tetap bergantung pada kebijakan akuntansi, COA, saldo awal, penyesuaian, pajak dan closing perusahaan.
- **Semua laporan dapat diekspor ke Excel (.xlsx) dan PDF.**
- **Shift Kasir**: buka shift, modal awal, transaksi/penjualan per shift, kas tunai, tutup shift dan kas fisik akhir.
- **Menu Langganan customer disederhanakan**; tidak ada lagi penjelasan arsitektur SaaS.
- **Platform Admin dipisahkan dari POS**. Buka `/admin` untuk mengelola customer, paket, periode aktif, suspend/aktifkan tenant, user aktif, dan reset password.
- Paket yang tersedia: **Bulanan Rp100.000/bulan** dan **Tahunan Rp1.000.000/tahun**.

## Deploy Railway

1. Push folder ini ke GitHub.
2. Buat project Railway dan tambahkan PostgreSQL.
3. Hubungkan repository GitHub ke service aplikasi.
4. Pastikan `DATABASE_URL` tersedia pada service aplikasi.
5. Set `JWT_SECRET` dengan string acak minimal 32 karakter.
6. Untuk Accurate Online, isi variabel `ACCURATE_CLIENT_ID`, `ACCURATE_CLIENT_SECRET`, `ACCURATE_REDIRECT_URI`, dan scope sesuai aplikasi ACIS yang terdaftar pada Area Developer Accurate.
7. Deploy. Start command otomatis menjalankan migration, seed, lalu server.

## Accurate Online

OAuth Accurate menggunakan authorization-code flow. Callback default aplikasi adalah:

`/api/integrations/accurate/oauth/callback`

Set callback URL penuh tersebut pada Area Developer Accurate, misalnya:

`https://acis-pos-production.up.railway.app/api/integrations/accurate/oauth/callback`

Setelah otorisasi, customer memilih Data Usaha Accurate yang akan menerima transaksi. ACIS POS kemudian membuka database tersebut dan menyimpan session/host server-side.

Tombol **Kirim Data Sekarang** mengirim maksimal 100 transaksi penjualan yang belum tersinkron pada sekali proses. Sinkronisasi diberi jeda agar tidak agresif terhadap rate limit API Accurate. Status per transaksi dicatat di `accurate_sync_logs` dan transaksi sukses diberi `accurate_synced_at` supaya tidak dikirim dua kali.

> Catatan implementasi: dokumentasi endpoint dan parameter API Accurate dapat berubah/berbeda sesuai scope aplikasi. Default adapter memakai `sales-invoice/save.do` dan `sales-receipt/save.do`, dengan path yang dapat dioverride melalui environment variable tanpa mengekspos konfigurasi teknis ke customer. Sebelum produksi, cocokkan field payload dengan API Docs pada Area Developer Accurate milik ACIS.

## Admin ACIS

Halaman internal tersedia pada:

`/admin`

Akun demo seed:

- Username: `admin`
- Password: `admin123`

Ganti password untuk produksi. Admin ACIS dapat:

- melihat seluruh customer/tenant;
- memilih Paket Bulanan atau Tahunan;
- mengatur tanggal mulai dan berakhir langganan;
- mengaktifkan atau suspend customer;
- melihat jumlah user aktif;
- aktif/nonaktifkan user customer;
- reset password administrator customer.

## Catatan akuntansi

ACIS POS menyediakan struktur COA dasar dan laporan keuangan operasional. Untuk implementasi akuntansi PSAK penuh, lanjutkan dengan saldo awal, jurnal penyesuaian, kas/bank terpisah, pembayaran hutang/piutang, pajak, periode akuntansi, closing, aset tetap, dan rekonsiliasi.

## Fitur baru v2.4
- Promo & Loyalty: voucher/diskon, promo khusus member, aturan perolehan dan redeem poin.
- Retur & Void: retur parsial/full, alasan wajib, pengembalian stok, audit trail.
- Hutang & Piutang: transaksi kredit, jatuh tempo, cicilan penerimaan/pembayaran, saldo terbuka.
- Split Payment: satu transaksi dapat dibayar dengan beberapa metode.
- Offline/PWA: shell aplikasi dicache dan transaksi checkout dapat diantrikan lokal saat internet putus lalu disinkronkan kembali.
- Printer & Barcode: pengaturan 58/80mm, test print, scanner kamera via BarcodeDetector jika didukung browser, scanner USB/keyboard, dan cetak label produk.

> Catatan offline: mode PWA v2.4 menjaga shell aplikasi dan antrean transaksi POS. Master data yang belum pernah dimuat tetap memerlukan koneksi; konflik stok saat sinkronisasi akan ditahan sebagai transaksi pending untuk diperiksa.
