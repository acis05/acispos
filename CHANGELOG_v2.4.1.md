# ACIS POS v2.4.1

## Admin security update
- Menambahkan tombol **Ganti Password** pada halaman `/admin`.
- Verifikasi password lama sebelum perubahan.
- Password baru minimal 10 karakter dan wajib dikonfirmasi.
- Password disimpan menggunakan bcrypt cost 12.
- Session admin yang sedang aktif tetap dapat digunakan setelah password berhasil diubah.
