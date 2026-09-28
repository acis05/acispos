# ACIS POS v2.7.0

- Quick cash buttons di layar pembayaran: Rp10.000, Rp20.000, Rp50.000, Rp100.000, dan Uang Pas.
- Menu baru Resep & Grouping di modul Persediaan.
- Produk grouping dapat memiliki beberapa komponen bahan dengan kuantitas per 1 produk jadi.
- Saat produk grouping terjual, stok yang berkurang adalah stok komponen bahan, bukan stok semu produk grouping.
- Ketersediaan produk grouping dihitung otomatis dari komponen yang stoknya paling membatasi.
- HPP produk grouping dihitung dari total average cost komponen sesuai resep.
- Pembelian produk standar sekarang memperbarui HPP dengan metode moving average.
- Snapshot komposisi disimpan pada item penjualan untuk mendukung retur, void, dan reversal stok dengan benar walau resep kemudian berubah.
- Mode offline ikut mengurangi stok komponen lokal untuk produk grouping dan melakukan sinkronisasi saat koneksi kembali.
