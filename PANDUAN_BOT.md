# 📖 Panduan Lengkap Bot Telegram "Telkom Says"

Dokumen ini berisi panduan operasional lengkap untuk bot Telegram **Telkom Says**, mencakup panduan penggunaan untuk pengguna awam, panduan administratif untuk pengelola bot, panduan teknis pengembang (*developer*), serta panduan migrasi & hosting 24 jam di Mini PC.

---

## 📌 Bagian 1: Panduan Pengguna Umum (Orang Awam)

### 1.1 Cara Mengakses Bot
1. Buka aplikasi **Telegram** di HP atau Desktop.
2. Cari username bot yang telah dibuat di kolom pencarian Telegram (misalnya: `@telkom_says_bot`).
3. Klik tombol **Start** di bagian bawah layar atau ketik perintah `/start`.

### 1.2 Perintah Pengguna (*User Commands*)
* **`/start`**  
  Menampilkan salam pembuka dan tombol navigasi cepat (*Inline Menu*) untuk mencari atau menambah istilah.
* **`/myid`**  
  Menampilkan ID unik akun Telegram Anda. (Berguna jika Anda ingin didaftarkan sebagai Admin).
* **`/add [Istilah]: [Penjelasan]`**  
  Mengusulkan istilah baru beserta penjelasannya ke antrean bot.  
  *Contoh:* `/add FYP: For You Page`

### 1.3 Cara Mencari Istilah (Kamus Bot)
Anda tidak perlu mengetikkan garis miring (`/`) untuk mencari istilah. Cukup ketik kata yang ingin dicari di kolom obrolan bot.

**Contoh:**
* Ketik: `grapari` ➡️ Bot akan membalas dengan penjelasan tentang GraPARI.
* Ketik: `indihome` ➡️ Bot akan membalas dengan penjelasan tentang IndiHome.

> **Sistem Pencarian Pintar (Smart Search):**
> 1. **Pencarian Persis (*Exact Match*):** Cocok penuh dengan kunci kata.
> 2. **Pencarian Singkatan/Kurung (*Bracket Match*):** Mendukung pencarian istilah yang mengandung kata dalam tanda kurung.
> 3. **Pencarian Sebagian Kata (*Substring Match*):** Jika kata kunci terkandung di dalam salah satu istilah yang ada.

---

## 👑 Bagian 2: Panduan Lengkap untuk Admin

Akses admin dibatasi secara otomatis oleh bot. Hanya pengguna dengan Telegram ID yang terdaftar sebagai `ADMIN_ID` di file `.env` yang dapat menjalankan perintah-perintah khusus berikut.

### 2.1 Perintah Khusus Admin
| Perintah | Contoh Penggunaan | Fungsi |
| :--- | :--- | :--- |
| `/listusulan` | `/listusulan` | Menampilkan seluruh daftar istilah yang diusulkan oleh pengguna dan belum disetujui. |
| `/acc [istilah]` | `/acc gatra` | Menyetujui istilah usulan. Istilah tersebut otomatis dipindahkan dari antrean usulan ke **database utama**. |
| `/reject [istilah]` | `/reject gatra` | Menolak istilah usulan. Istilah tersebut dihapus dari antrean usulan tanpa dimasukkan ke database utama. |
| `/listdb [halaman]` | `/listdb 1` | Menampilkan daftar seluruh istilah yang ada di database utama secara urut abjad A-Z (50 kata per halaman). |

---

### 2.2 Alur Kerja Pengelolaan Usulan Istilah

```text
 Pengguna (/add) ---> [usulan_user.json] ---> Admin (/listusulan)
                                                   |
                                 +-----------------+-----------------+
                                 |                                   |
                      Setuju (/acc [istilah])            Tolak (/reject [istilah])
                                 |                                   |
                                 v                                   v
                      [database_utama.json]              [Dihapus dari Antrean]
```

---

### 2.3 Cara Menjadikan Seseorang sebagai Admin Baru
1. Minta calon admin baru membuka aplikasi Telegram dan mencari bot **Telkom Says**.
2. Minta admin baru tersebut mengetik perintah `/myid`.
3. Bot akan membalas pesan berisi kode angkanya, contoh: `ID Telegram kamu adalah: 123456789`.
4. Salin angka ID tersebut.
5. Buka file `.env` di folder proyek tempat bot dijalankan.
6. Ubah variabel `ADMIN_ID` dengan angka ID baru:
   ```env
   BOT_TOKEN=789123456:AAFx... (Token Bot Telegram)
   ADMIN_ID=123456789
   ```
7. *Restart* bot (matikan terminal dan jalankan kembali `node script.js` atau `pm2 restart telkomsays-bot`). Sekarang admin baru tersebut sudah memiliki akses penuh.

---

### 2.4 Cara Menghapus Kata yang Sudah Ada di Database Utama
Untuk menghapus kata yang **sudah resmi masuk** di database utama dapat dilakukan dengan 2 cara:

#### Cara 1: Manual melalui File Data
1. Buka file `database_utama.json` pada server/folder proyek.
2. Cari nama istilah yang ingin dihapus.
3. Hapus baris istilah dan penjelasannya.
4. Simpan file `database_utama.json`.

#### Cara 2: Menambahkan Perintah `/del` di Kode (Untuk Pengembang)
Jika ingin bisa menghapus kata langsung dari Telegram tanpa membuka file, pengembang dapat menambahkan logika berikut ke file `script.js`:
```javascript
// Perintah Hapus Kata dari Database Utama (Khusus Admin)
if (text.startsWith('/del')) {
  if (msg.from.id !== ADMIN_ID) {
    bot.sendMessage(chatId, "⛔ Maaf, perintah ini khusus untuk Admin.");
    return;
  }
  const istilahHapus = text.substring(4).trim().toLowerCase();
  try {
    const dbUtama = JSON.parse(fs.readFileSync(DB_UTAMA_PATH, 'utf-8'));
    if (dbUtama[istilahHapus]) {
      delete dbUtama[istilahHapus];
      fs.writeFileSync(DB_UTAMA_PATH, JSON.stringify(dbUtama, null, 2));
      bot.sendMessage(chatId, `🗑️ Berhasil menghapus *${istilahHapus}* dari database utama.`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ Istilah *${istilahHapus}* tidak ditemukan di database utama.`, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    bot.sendMessage(chatId, "❌ Gagal memperbarui database.");
  }
  return;
}
```

---

## 💻 Bagian 3: Panduan Pengembang (Developer Guide)

### 3.1 Struktur Direktori Proyek
```text
TelkomSays/
├── script.js             # File logika utama program Node.js & Bot Telegram
├── database_utama.json   # Penyimpanan data istilah publik (JSON format)
├── usulan_user.json      # Antrean sementara usulan istilah dari pengguna
├── PANDUAN_BOT.md        # Dokumen panduan lengkap (User, Admin, PM2, Hosting)
├── .env                  # Konfigurasi kunci rahasia (Token & ID Admin)
├── .env.example          # Template contoh file .env
└── package.json          # Manifest dependency Node.js
```

### 3.2 Persyaratan Sistem & Instalasi
* **Node.js**: versi 14 atau yang lebih baru.
* **Modul yang Digunakan**:
  * `node-telegram-bot-api`: Library utama interaksi Telegram Bot API.
  * `dotenv`: Untuk membaca file variabel lingkungan `.env`.
  * `csv-writer`: Library pembantu penulisan file CSV.

**Langkah Jalankan Proyek:**
```bash
# 1. Install dependency
npm install

# 2. Siapkan file .env (isi BOT_TOKEN dan ADMIN_ID)

# 3. Jalankan bot
node script.js
```

---

## 🖥️ Bagian 4: Panduan Migrasi & Deployment 24 Jam di Mini PC

Panduan ini menjelaskan langkah-langkah memindahkan bot dari laptop/komputer pengembang ke **Mini PC** agar bot dapat beroperasi **24/7 tanpa henti**, serta dapat menyala kembali secara otomatis jika Mini PC mengalami mati listrik atau *restart*.

### 4.1 Persiapan Mini PC
1. **Daya & Jaringan**: Hubungkan Mini PC ke Listrik dan Internet (menggunakan kabel LAN disarankan agar lebih stabil dibanding Wi-Fi).
2. **Matikan Fitur Sleep**: Pastikan fitur *Sleep / Standby / Hibernate* di sistem operasi Mini PC (Windows maupun Linux Ubuntu) **dimatikan**, agar Mini PC tidak masuk mode tidur saat tidak ada aktivitas layar.
3. **Install Node.js & Git**:
   * Download dan install **Node.js (LTS Version)** di Mini PC dari [nodejs.org](https://nodejs.org/).
   * Verify via terminal/cmd: `node -v` dan `npm -v`.

---

### 4.2 Memindahkan File Proyek ke Mini PC
Salin folder proyek `TelkomSays` dari PC lama ke Mini PC (bisa menggunakan Flashdisk, Git Clone, atau transfer jaringan).

**Pastikan file-file berikut lengkap di Mini PC:**
* `script.js`
* `package.json`
* `.env` (berisi `BOT_TOKEN` dan `ADMIN_ID`)
* `database_utama.json` & `usulan_user.json` (agar database istilah yang sudah terkumpul tidak hilang)

---

### 4.3 Menginstall Dependency di Mini PC
Buka **Terminal** (di Linux) atau **Command Prompt / PowerShell** (di Windows) pada Mini PC, masuk ke folder proyek `TelkomSays`, lalu jalankan:

```bash
npm install
```

---

### 4.4 Menjalankan Bot 24 Jam Menggunakan PM2 (Process Manager)
Jika Anda hanya menjalankan bot dengan `node script.js`, bot akan mati begitu terminal ditutup atau komputer di-restart. Untuk menjalankan 24 jam secara otomatis di latar belakang (*background*), gunakan **PM2**.

#### Langkah 1: Install PM2 secara Global
```bash
npm install -g pm2
```

#### Langkah 2: Jalankan Bot dengan PM2
```bash
pm2 start script.js --name "telkomsays-bot"
```
*Bot sekarang sudah berjalan di latar belakang!*

> **💡 Catatan Multi-Aplikasi PM2:**  
> Jika Anda sudah menggunakan PM2 untuk menjalankan aplikasi lain (seperti *website* atau *backend API*), **PM2 tetap bisa digunakan bersamaan secara aman**. PM2 dirancang untuk mengelola banyak proses sekaligus. Bot `telkomsays-bot` akan berjalan berdampingan dengan aplikasi web Anda tanpa saling mengganggu.

#### Langkah 3: Konfigurasi Auto-Start saat Mini PC Menyala / Restart

* **Untuk Mini PC Berbasis Linux (Ubuntu / Debian):**
  ```bash
  pm2 startup
  # Salin & jalankan perintah yang ditampilkan di terminal oleh PM2 (jika ada)
  pm2 save
  ```

* **Untuk Mini PC Berbasis Windows:**
  ```bash
  npm install -g pm2-windows-startup
  pm2-startup install
  pm2 save
  ```

---

### 4.5 Perintah Penting PM2 untuk Pemeliharaan (*Maintenance*)

| Perintah | Fungsi |
| :--- | :--- |
| `pm2 status` | Melihat status bot (apakah statusnya `online` atau `errored`). |
| `pm2 logs telkomsays-bot` | Melihat log pesan / error bot secara langsung (*real-time*). |
| `pm2 restart telkomsays-bot` | Mengulang (*restart*) bot (misal setelah mengubah isi `.env` atau `script.js`). |
| `pm2 stop telkomsays-bot` | Menghentikan bot sementara. |
| `pm2 delete telkomsays-bot` | Menghapus bot dari daftar jalannya PM2. |

---

## 💡 Ringkasan Perintah Penting (Quick Reference)

| Pengguna | Perintah | Deskripsi |
| :--- | :--- | :--- |
| Semua | `/start` | Menampilkan menu awal |
| Semua | `/myid` | Cek Telegram ID pengguna |
| Semua | `/add [kata]: [isi]` | Mengusulkan istilah baru |
| Semua | *(langsung ketik kata)* | Mencari definisi istilah |
| **Admin** | `/listusulan` | Cek antrean usulan kata |
| **Admin** | `/acc [kata]` | Menyetujui usulan kata |
| **Admin** | `/reject [kata]` | Menolak usulan kata |
| **Admin** | `/listdb [halaman]` | Lihat daftar istilah yang aktif |
