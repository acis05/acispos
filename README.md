# ACIS POS v2.0 SaaS Foundation

**Solusi Kasir Cerdas untuk Bisnis Bertumbuh**

ACIS POS v2 mengubah fondasi v1.x menjadi SaaS berbasis **PostgreSQL**, **multi-tenant**, dan **multi-outlet**. UI kasir, produk, stok ledger, pembelian, penjualan, pelanggan/supplier, laporan, biaya, user, pengaturan, dan audit tetap dipertahankan, tetapi data tidak lagi disimpan sebagai file JSON lokal.

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
