# ACIS POS v2.4 — Retail Pro Operations

## 1. Promo & Loyalty
- Promo persen dan nominal.
- Kode voucher, minimum belanja, periode aktif, promo khusus member.
- Poin pelanggan: aturan earning, nilai redeem, minimum redeem, ledger aktivitas poin.
- Promo dan redeem poin langsung tersedia di layar Kasir.

## 2. Retur & Void
- Retur parsial per item/qty.
- Void transaksi penuh dengan alasan wajib.
- Stok otomatis kembali ke outlet.
- Transaksi void tetap disimpan untuk audit.
- Riwayat Retur & Void terpisah.

## 3. Hutang & Piutang
- Penjualan kurang bayar/pembayaran kredit otomatis menjadi piutang customer.
- Pembelian berstatus hutang otomatis menjadi hutang supplier.
- Jatuh tempo, saldo, pembayaran/cicilan, status lunas.
- Laporan Hutang/Piutang menggunakan ledger AR/AP baru.

## 4. Split Payment
- Beberapa metode bayar dalam satu transaksi.
- Metode: Tunai, QRIS, Transfer, Kartu.
- Laporan Penjualan/Penerimaan per Metode Bayar membaca rincian split payment.

## 5. Offline / PWA
- Manifest dan Service Worker untuk cache shell aplikasi.
- Checkout yang gagal karena koneksi internet dapat diantrikan lokal.
- Sinkronisasi otomatis/manual saat koneksi kembali.
- `client_ref` unik mencegah duplikasi checkout saat retry.

Catatan: offline v2.4 berfokus pada shell aplikasi dan antrean checkout. Master data yang belum pernah dimuat tetap membutuhkan koneksi; konflik stok saat sinkronisasi ditahan sebagai pending untuk pemeriksaan.

## 6. Printer & Barcode
- Pengaturan kertas 58/80 mm.
- Test print dan cetak struk via dialog printer browser/OS.
- Scanner USB sebagai keyboard input.
- Scanner kamera memakai BarcodeDetector pada browser yang mendukung.
- Cetak label barcode produk.
