# PostgreSQL Row Level Security (opsional, direkomendasikan setelah role database produksi dipisah)

ACIS POS v2 sudah memfilter setiap query bisnis dengan `tenant_id` dan `outlet_id` dari JWT server-side. Jangan pernah menerima `tenant_id` mentah dari browser untuk menentukan cakupan data.

Untuk lapisan pertahanan tambahan, aktifkan RLS saat Anda memakai role database aplikasi khusus (bukan owner/superuser). Pola policy:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_tenant_isolation ON products
USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Terapkan pola yang sama ke `partners`, `sales`, `sale_items`, `purchases`, `purchase_items`, `stock_balances`, `stock_ledger`, `expenses`, `tenant_settings`, dan tabel bisnis lain.

Sebelum query dalam transaction, backend harus menjalankan:

```sql
SET LOCAL app.tenant_id = '<uuid tenant dari JWT>';
```

Jangan aktifkan policy ini tanpa menyiapkan session variable tersebut karena query aplikasi akan tertolak.
