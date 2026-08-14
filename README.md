# Telkomsel Says Telegram Bot

**Telkomsel Says** adalah bot Telegram berbasis Node.js yang berfungsi sebagai kamus istilah interaktif dan pengumpul data usulan istilah dari pengguna.

---

## 📖 Panduan Lengkap

Panduan lengkap operasional dan teknis telah tersedia di file **[PANDUAN_BOT.md](file:///d:/Magang/TelkomSays/PANDUAN_BOT.md)**, yang mencakup:
1. **Panduan Pengguna Umum (Awam)**: Cara akses, mencari istilah, dan mengusulkan kata baru.
2. **Panduan Admin**: Perintah `/listusulan`, `/acc`, `/reject`, `/listdb`, cara tambah admin baru (`ADMIN_ID`), dan hapus kata.
3. **Panduan Pengembang (Developer)**: Struktur proyek, dependency, dan alur data.
4. **Panduan Deployment 24 Jam di Mini PC**: Konfigurasi **PM2**, auto-restart saat reboot, dan dukungan multi-aplikasi.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Siapkan file .env (isi BOT_TOKEN dan ADMIN_ID)

# 3. Jalankan bot secara lokal
node script.js

# 4. Jalankan bot di PM2 (24 Jam)
pm2 start script.js --name "telkomsel_says_bot"
```

## License

This project is licensed under the [MIT License](./LICENSE).