# ACIS POS v2.6.0 — Offline-First Cashier

- IndexedDB cache untuk session terverifikasi, master produk, harga, foto, stok ringkas, pelanggan, loyalty, dan promo.
- POS dapat dibuka dan dipakai saat internet terputus setelah minimal satu kali sinkronisasi online.
- Pre-warm cache otomatis setelah login online, jadi kasir tidak perlu membuka menu POS terlebih dahulu.
- Checkout offline tersimpan persisten di perangkat dengan `clientRef` unik dan nomor lokal `OFF-*`.
- Stok lokal langsung berkurang untuk menjaga pengalaman kasir selama offline.
- Struk transaksi offline dapat langsung dicetak dan diberi penanda belum tersinkron.
- Sinkronisasi otomatis saat koneksi kembali; duplikasi dicegah oleh `clientRef` di server.
- Transaksi yang ditolak server (mis. konflik stok) ditandai `Perlu Review`, bukan hilang.
- Promo yang sudah tersimpan dapat divalidasi secara offline untuk aturan periode, minimum belanja, member, persen/nominal.
- Badge ONLINE / OFFLINE / SYNC / PERLU REVIEW ditampilkan di topbar.
- Service worker diperbarui untuk app-shell offline yang lebih stabil.
- Offline session grace 72 jam sejak verifikasi online terakhir; setelah itu aplikasi meminta koneksi untuk verifikasi ulang langganan/akun.
