# ACIS POS

### Update v1.3
- Login awal diperbarui: logo tampil lebih jernih dan dilengkapi preview mini dashboard fitur unggulan.
- Daftar transaksi Penjualan, Pembelian, dan Biaya Operasional kini memiliki tombol **Edit** dan **Hapus**.
- Penghapusan penjualan mengembalikan stok; penghapusan pembelian membalik stok jika stok masih mencukupi.
- Edit transaksi penjualan dibatasi pada pelanggan, metode pembayaran, diskon, dan nominal bayar agar histori stok tetap konsisten.


## Brand UI v1.3

Versi ini menggunakan identitas final ACIS POS dengan palet oranye-hijau dan tagline **“Solusi Kasir Cerdas untuk Bisnis Bertumbuh”**. Asset utama berada di `public/assets/acis-pos-logo.png` dan icon ringkas di `public/assets/acis-pos-icon.png`. Seluruh UI utama sudah diselaraskan dengan palet tersebut.

ACIS POS adalah aplikasi POS berbasis web dengan modul kasir, produk, stok ledger, pembelian, penjualan, pelanggan/supplier, biaya, laporan, user/role, audit log, dan pengaturan usaha.

Proyek ini dibuat sebagai implementasi baru dengan UI dan identitas ACIS POS yang berbeda dari aplikasi referensi yang dilampirkan.

## Fitur utama

- Dashboard omzet, transaksi, stok menipis, tren 7 hari
- Kasir/POS: keranjang, diskon, pelanggan, pembayaran tunai/transfer/QRIS/kartu, cetak struk
- Hold transaction
- Master produk: SKU, barcode, kategori, satuan, harga pokok, harga jual, stok minimum
- Stok ledger otomatis dari penjualan, pembelian, stok awal, dan penyesuaian
- Pembelian dan penerimaan stok
- Riwayat penjualan
- Pelanggan dan supplier + poin pelanggan
- Biaya operasional
- Laporan omzet, HPP, laba kotor, biaya, laba bersih, produk terlaris
- User & role dasar
- Audit log
- Pengaturan profil usaha dan footer struk
- Responsive desktop/mobile
- Logo final ACIS POS sudah termasuk di `public/assets/acis-pos-logo.png`
- Ikon aplikasi/favicon ada di `public/assets/acis-pos-icon.png`
- Tagline brand: **Solusi Kasir Cerdas untuk Bisnis Bertumbuh**
- Palet UI utama diselaraskan dengan identitas ACIS: hijau dan oranye

## Login awal

- Username: `admin`
- Password: `admin123`

**Segera ganti implementasi password/default user untuk penggunaan produksi.** Versi starter ini menyediakan alur admin awal agar deployment langsung bisa diuji.

## Jalankan lokal

```bash
cp .env.example .env
npm install
npm start
```

Buka `http://localhost:3000`.

## Deploy ke Railway

1. Buat repository baru di GitHub.
2. Upload seluruh isi folder proyek ini ke repository tersebut.
3. Di Railway, pilih **New Project → Deploy from GitHub Repo**.
4. Pilih repository ACIS POS.
5. Tambahkan environment variable:
   - `JWT_SECRET` = string acak panjang
   - `APP_NAME` = `ACIS POS`
   - `DATA_DIR` = `/data` bila menggunakan Railway Volume
6. Untuk data persisten, tambahkan **Railway Volume** dan mount ke `/data`.
7. Railway akan menjalankan `npm start` otomatis. Healthcheck tersedia di `/api/health`.

### Catatan penyimpanan

Starter ini memakai file JSON lokal supaya sangat mudah di-deploy tanpa database eksternal. Untuk produksi multi-cabang/high concurrency, disarankan migrasi data layer ke PostgreSQL Railway. Struktur API/frontend sudah dipisah agar migrasi itu mudah dilakukan.

## Struktur

```text
acis-pos/
├─ public/
│  ├─ assets/acis-pos-logo.png
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ data/.gitkeep
├─ server.js
├─ package.json
├─ railway.json
├─ Dockerfile
├─ .env.example
└─ README.md
```

## Railway persistence

Tanpa Volume, filesystem deployment Railway dapat bersifat ephemeral. Untuk data transaksi yang harus bertahan, gunakan Railway Volume pada `/data` atau pindahkan repository penyimpanan ke PostgreSQL.

## Cakupan dibanding referensi StokLedger

Cakupan yang sudah diimplementasikan sebagai alur aktif: Dashboard, POS, produk, stok ledger, penyesuaian stok, pembelian/penerimaan stok, riwayat penjualan, pelanggan & supplier, poin pelanggan dasar, biaya operasional, laporan laba sederhana, user/role dasar, audit log, dan pengaturan usaha/struk.

Referensi yang teridentifikasi tetapi **belum diimplementasikan penuh pada starter v1.0**: akuntansi double-entry/COA & jurnal umum lengkap, piutang/hutang & aging, fixed assets/depresiasi, project costing, sales order/purchase order workflow lengkap, retur lengkap, import Excel/PDF bank, document designer, promo engine bertingkat, multi-warehouse transfer, serta role permission granular per aksi. Modul-modul ini sebaiknya menjadi fase berikutnya bila ACIS POS akan mengejar paritas penuh dengan referensi.
