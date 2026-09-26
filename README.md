# ACIS POS v2.1 SaaS Business & Reporting Update

**Solusi Kasir Cerdas untuk Bisnis Bertumbuh**

ACIS POS v2.1 melanjutkan fondasi SaaS **PostgreSQL**, **multi-tenant**, dan **multi-outlet** dengan penyempurnaan kasir, master data, pengaturan struk, pusat laporan, dan fondasi integrasi Accurate Online.

## Yang sudah tersedia

- PostgreSQL sebagai database utama.
- `tenant_id` pada seluruh data bisnis penting.
- Stok dan transaksi per outlet dengan `outlet_id`.
- Login tenant-aware dan outlet-aware.
- Owner/user dapat terhubung ke tenant melalui `tenant_users`.
- Role & permission foundation.
- Paket `STARTER`, `BUSINESS`, dan `PRO`.
- Trial otomatis 14 hari (dapat diubah lewat `DEFAULT_TRIAL_DAYS`).
- Subscription guard untuk operasi yang mengubah data.
- Batas jumlah user mengikuti paket.
- Onboarding tenant baru melalui API.
- Platform Admin untuk melihat tenant, user, outlet, MRR, dan suspend/aktifkan tenant.
- Audit log tenant-aware.
- Edit/hapus penjualan, pembelian, dan biaya tetap tersedia.
- Penghapusan transaksi membalik mutasi stok secara aman.
- Migration dan seed otomatis saat Railway start.
- Dokumen pola PostgreSQL RLS di `docs/RLS.md`.


## Update v2.1

- Foto produk dapat diunggah dari menu Produk dan tampil pada kartu item Kasir (POS). Untuk MVP foto disimpan sebagai data URI di PostgreSQL; untuk produksi skala besar disarankan pindah ke object storage/CDN.
- Tombol **Edit** dan **Hapus** tersedia pada Produk, Pelanggan, dan Supplier. Penghapusan produk menggunakan soft-delete agar histori transaksi tetap aman.
- Tab **Struk** di Pengaturan sudah aktif: header, footer, lebar kertas 58/80 mm, tampilkan logo, dan preview struk.
- Pusat laporan baru: Penjualan per Barang, Metode Bayar, Shift (ringkasan tanggal+kasir), Pelanggan, Pembelian per Barang, Pemasok, Hutang, Piutang, Penerimaan Uang per Metode Bayar, Buku Besar, Laba Rugi, dan Neraca.
- Buku Besar dan Neraca pada v2.1 adalah **laporan manajerial/estimasi** yang diturunkan dari transaksi POS, pembelian, biaya, saldo stok, hutang, dan piutang. Untuk akuntansi formal penuh, tahap berikutnya adalah jurnal double-entry otomatis dan Chart of Accounts.
- Menu **Integrasi Accurate Online** ditambahkan. Konfigurasi tenant, pilihan objek sinkron, dan tabel penyimpanan integrasi sudah tersedia. OAuth dan sinkronisasi API penuh perlu kredensial aplikasi Accurate Online yang resmi sebelum diaktifkan ke produksi. Accurate Online menggunakan OAuth 2.0 untuk aplikasi komersial.

## Struktur SaaS

```text
ACIS POS App
├─ Tenant A
│  ├─ Outlet A1
│  └─ Outlet A2
├─ Tenant B
│  └─ Outlet B1
└─ Platform Admin

PostgreSQL
├─ tenants / outlets
├─ users / tenant_users / roles
├─ subscription_plans / subscriptions
├─ products / stock_balances / stock_ledger
├─ sales / sale_items
├─ purchases / purchase_items
├─ partners / expenses
└─ audit_logs
```

## Deploy Railway

1. Upload isi folder repository ini ke GitHub.
2. Buat project Railway dari GitHub repo.
3. Tambahkan service **PostgreSQL** di project Railway.
4. Railway biasanya menyediakan `DATABASE_URL` ke service aplikasi melalui variable reference. Pastikan variable tersebut tersedia di service ACIS POS.
5. Tambahkan `JWT_SECRET` yang panjang dan acak.
6. Opsional: `DEFAULT_TRIAL_DAYS=14` dan `DATABASE_SSL=false` untuk koneksi private Railway.
7. Deploy. Start command akan menjalankan `npm run migrate`, `npm run seed`, lalu server.

`railway.json` sudah memakai `/api/health` sebagai healthcheck.

## Demo awal

- Username: `admin`
- Password: `admin123`

Akun seed ini juga memiliki flag Platform Admin agar menu **Platform Admin** dapat diuji. Ganti password setelah deploy produksi.

## Onboarding tenant baru

Endpoint publik foundation:

```http
POST /api/onboarding/register
Content-Type: application/json
```

Contoh body:

```json
{
  "businessName": "Toko Maju Jaya",
  "outletName": "Cabang Utama",
  "name": "Owner Toko",
  "username": "owner.majujaya",
  "password": "password-kuat",
  "email": "owner@example.com",
  "planCode": "STARTER"
}
```

Endpoint membuat tenant, outlet utama, owner Administrator, role default, master kategori/satuan, pelanggan/supplier default, dan subscription trial.

## Catatan keamanan penting

- `tenant_id` tidak diambil dari query string/body browser untuk scoping data. Tenant aktif berasal dari JWT yang dibuat server.
- Semua SKU unik di dalam satu tenant (`UNIQUE(tenant_id, sku)`), bukan global.
- Semua query transaksi menggunakan `tenant_id`, dan transaksi stok juga menggunakan `outlet_id`.
- Untuk hardening berikutnya, aktifkan PostgreSQL RLS menggunakan pola di `docs/RLS.md` dan gunakan role database aplikasi khusus.
- Tambahkan rate limiting, CSRF strategy bila beralih ke cookie auth, email verification, reset password, MFA untuk platform admin, dan secret rotation sebelum go-live skala besar.

## Billing berikutnya

Tabel subscription sudah siap untuk dihubungkan ke payment gateway. Tahap lanjutan yang disarankan: invoice SaaS, webhook pembayaran, grace period otomatis, notifikasi jatuh tempo, serta upgrade/downgrade paket.
