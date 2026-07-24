require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// ==========================================
// KONFIGURASI
// ==========================================
// Mengambil Token Bot dan ID Admin dari file .env
const token = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

if (!token || !ADMIN_ID) {
  console.error("❌ ERROR: BOT_TOKEN atau ADMIN_ID belum diatur di file .env");
  process.exit(1);
}

// Path ke file database lokal (JSON)
const DB_UTAMA_PATH = path.join(__dirname, 'database_utama.json');
const USULAN_PATH = path.join(__dirname, 'usulan_user.json');

// Jika file database belum ada, buat otomatis saat bot dijalankan
if (!fs.existsSync(DB_UTAMA_PATH)) {
  fs.writeFileSync(DB_UTAMA_PATH, JSON.stringify({
    "grapari": "GraPARI adalah pusat layanan pelanggan Telkomsel.",
    "indihome": "IndiHome adalah layanan digital internet rumah.",
    "orbit": "Telkomsel Orbit adalah layanan internet rumah nirkabel 4G/5G."
  }, null, 2));
  console.log("File database_utama.json berhasil dibuat!");
}

if (!fs.existsSync(USULAN_PATH)) {
  fs.writeFileSync(USULAN_PATH, JSON.stringify([], null, 2));
  console.log("File usulan_user.json berhasil dibuat!");
}

// ==========================================
// BOT LOGIC
// ==========================================
const bot = new TelegramBot(token, { polling: true });

// 1. Menu Utama (Perintah /start)
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = "Halo! Selamat datang di bot *Telkom Says*.\n\n" +
    "Silakan pilih menu di bawah ini atau langsung ketikkan istilah yang ingin dicari:\n" +
    "1️⃣ *Mencari Istilah*: Ketik langsung istilahnya.\n" +
    "2️⃣ *Menambahkan Istilah*: Gunakan format `/add [Istilah]: [Penjelasan]`";

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔍 Mencari Istilah", callback_data: "menu_cari" },
          { text: "✍️ Menambah Istilah", callback_data: "menu_tambah" }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeText, options);
});

// 2. Handle Callback Query (Tombol Inline Keyboard)
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "menu_cari") {
    bot.sendMessage(chatId, "Silakan langsung ketikkan istilah yang ingin kamu cari. Contoh: *GraPARI*", { parse_mode: 'Markdown' });
  } else if (data === "menu_tambah") {
    bot.sendMessage(chatId, "Silakan gunakan format berikut untuk menambah istilah:\n`/add [Istilah]: [Penjelasan]`\n\nContoh:\n`/add FYP: For You Page`", { parse_mode: 'Markdown' });
  }
  bot.answerCallbackQuery(callbackQuery.id);
});

// 3. Handle Pesan Teks
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  // -- CEK ID PENGGUNA (Untuk Admin) --
  if (text === '/myid') {
    bot.sendMessage(chatId, `ID Telegram kamu adalah: \`${msg.from.id}\`\n\nMasukkan angka ini ke variabel \`ADMIN_ID\` di file script.js agar kamu memiliki akses khusus admin.`, { parse_mode: 'Markdown' });
    return;
  }

  if (text.startsWith('/start')) return;

  // -- LOGIKA ADMIN: MELIHAT ISI DATABASE --
  if (text === '/listdb' || text.startsWith('/listdb ')) {
    if (msg.from.id !== ADMIN_ID) {
      bot.sendMessage(chatId, "⛔ Maaf, perintah ini khusus untuk Admin.");
      return;
    }

    const args = text.split(' ');
    let page = 1;
    if (args.length > 1) {
      const parsedPage = parseInt(args[1], 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }
    const ITEMS_PER_PAGE = 50;

    try {
      const dbUtama = JSON.parse(fs.readFileSync(DB_UTAMA_PATH, 'utf-8'));
      const keys = Object.keys(dbUtama);
      if (keys.length === 0) {
        bot.sendMessage(chatId, "📂 Database utama saat ini masih kosong.");
      } else {
        // Mengurutkan dari A ke Z (Alphabetical order)
        const sortedKeys = keys.sort((a, b) => a.localeCompare(b));

        const totalItems = sortedKeys.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (page > totalPages) {
          page = totalPages;
        }

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedKeys = sortedKeys.slice(startIndex, endIndex);

        // Membentuk daftar teks yang rapi dan dikapitalisasi
        const listText = paginatedKeys.map((k, i) => {
          const judul = k.replace(/\b\w/g, l => l.toUpperCase());
          return `${startIndex + i + 1}. ${judul}`;
        }).join("\n");

        bot.sendMessage(chatId, `📂 *Daftar Istilah (Halaman ${page}/${totalPages}):*\n\n${listText}\n\n_Ketik /listdb [angka] untuk melihat halaman lain._`, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      bot.sendMessage(chatId, "❌ Gagal membaca database utama.");
    }
    return;
  }

  // -- LOGIKA ADMIN: MELIHAT ANTREAN USULAN --
  if (text === '/listusulan') {
    if (msg.from.id !== ADMIN_ID) {
      bot.sendMessage(chatId, "⛔ Maaf, perintah ini khusus untuk Admin.");
      return;
    }
    try {
      const usulanData = JSON.parse(fs.readFileSync(USULAN_PATH, 'utf-8'));
      if (usulanData.length === 0) {
        bot.sendMessage(chatId, "📝 Tidak ada antrean usulan saat ini.");
      } else {
        const listText = usulanData.map((u, i) => `${i + 1}. *${u.istilah}* (dari ${u.pengusul})\n   └ ${u.penjelasan}`).join("\n\n");
        bot.sendMessage(chatId, `📝 *Daftar Antrean Usulan:*\n\n${listText}\n\nGunakan \`/acc [istilah]\` untuk menyetujui atau \`/reject [istilah]\` untuk menolak.`, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      bot.sendMessage(chatId, "❌ Gagal membaca database usulan.");
    }
    return;
  }

  // -- LOGIKA ADMIN: MENYETUJUI USULAN --
  if (text.startsWith('/acc')) {
    // Pengecekan apakah yang chat adalah admin
    if (msg.from.id !== ADMIN_ID) {
      bot.sendMessage(chatId, "⛔ Maaf, perintah ini khusus untuk Admin.");
      return;
    }

    const istilahTerima = text.substring(4).trim().toLowerCase();
    if (!istilahTerima) {
      bot.sendMessage(chatId, "⚠️ Format salah. Gunakan: `/acc [istilah]`\n\nContoh: `/acc gatra`", { parse_mode: 'Markdown' });
      return;
    }

    try {
      let usulanData = JSON.parse(fs.readFileSync(USULAN_PATH, 'utf-8'));
      const index = usulanData.findIndex(u => u.istilah.toLowerCase() === istilahTerima);

      if (index !== -1) {
        // Jika ditemukan di usulan, pindahkan ke database utama
        const dataUsulan = usulanData[index];

        const dbUtama = JSON.parse(fs.readFileSync(DB_UTAMA_PATH, 'utf-8'));
        dbUtama[dataUsulan.istilah.toLowerCase()] = dataUsulan.penjelasan;
        fs.writeFileSync(DB_UTAMA_PATH, JSON.stringify(dbUtama, null, 2));

        // Hapus dari file usulan agar tidak menumpuk
        usulanData.splice(index, 1);
        fs.writeFileSync(USULAN_PATH, JSON.stringify(usulanData, null, 2));

        bot.sendMessage(chatId, `✅ Berhasil! Istilah *${dataUsulan.istilah}* telah disetujui dan dipindahkan ke database utama.`, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, `❌ Istilah *${istilahTerima}* tidak ditemukan di antrean usulan.`, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses data.");
    }
    return;
  }

  // -- LOGIKA ADMIN: MENOLAK USULAN --
  if (text.startsWith('/reject')) {
    // Pengecekan apakah yang chat adalah admin
    if (msg.from.id !== ADMIN_ID) {
      bot.sendMessage(chatId, "⛔ Maaf, perintah ini khusus untuk Admin.");
      return;
    }

    const istilahTolak = text.substring(7).trim().toLowerCase();
    if (!istilahTolak) {
      bot.sendMessage(chatId, "⚠️ Format salah. Gunakan: `/reject [istilah]`\n\nContoh: `/reject gatra`", { parse_mode: 'Markdown' });
      return;
    }

    try {
      let usulanData = JSON.parse(fs.readFileSync(USULAN_PATH, 'utf-8'));
      const index = usulanData.findIndex(u => u.istilah.toLowerCase() === istilahTolak);

      if (index !== -1) {
        const dataUsulan = usulanData[index];

        // Hapus dari file usulan
        usulanData.splice(index, 1);
        fs.writeFileSync(USULAN_PATH, JSON.stringify(usulanData, null, 2));

        bot.sendMessage(chatId, `🗑️ Berhasil! Istilah *${dataUsulan.istilah}* telah ditolak dan dihapus dari antrean usulan.`, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, `❌ Istilah *${istilahTolak}* tidak ditemukan di antrean usulan.`, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses data.");
    }
    return;
  }

  // -- LOGIKA MENAMBAH ISTILAH (Mode Tulis) --
  if (text.startsWith('/add')) {
    const content = text.substring(5).trim();
    const separatorIndex = content.indexOf(":");

    if (separatorIndex === -1) {
      bot.sendMessage(chatId, "❌ Format salah. Silakan gunakan format:\n`/add [Istilah]: [Penjelasan]`", { parse_mode: 'Markdown' });
      return;
    }

    const istilah = content.substring(0, separatorIndex).trim();
    const penjelasan = content.substring(separatorIndex + 1).trim();
    const username = msg.from.username || msg.from.first_name || "Unknown";

    // Simpan ke usulan_user.json
    try {
      const usulanData = JSON.parse(fs.readFileSync(USULAN_PATH, 'utf-8'));
      usulanData.push({
        tanggal: new Date().toLocaleString(),
        istilah: istilah,
        penjelasan: penjelasan,
        pengusul: username
      });
      fs.writeFileSync(USULAN_PATH, JSON.stringify(usulanData, null, 2));

      bot.sendMessage(chatId, `✅ Terima kasih! Istilah *${istilah}* berhasil ditambahkan ke database usulan dan menunggu persetujuan admin.`, { parse_mode: 'Markdown' });
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menyimpan usulan ke file lokal.");
    }
    return;
  }

  // -- LOGIKA MENCARI ISTILAH (Mode Baca) --
  const kataKunci = text.toLowerCase().trim();
  let penjelasan = "";
  let istilahDitemukan = text;

  try {
    const dbUtama = JSON.parse(fs.readFileSync(DB_UTAMA_PATH, 'utf-8'));

    // 1. Pencarian persis (Exact match)
    if (dbUtama[kataKunci]) {
      penjelasan = dbUtama[kataKunci];
      istilahDitemukan = kataKunci;
    } else {
      for (const [key, value] of Object.entries(dbUtama)) {
        if (key.toLowerCase() === kataKunci) {
          penjelasan = value;
          istilahDitemukan = key;
          break;
        }
      }
    }

    // 2. Pencarian singkatan/kepanjangan dalam tanda kurung (Partial match)
    if (penjelasan === "") {
      for (const [key, value] of Object.entries(dbUtama)) {
        const lowerKey = key.toLowerCase();
        // Memecah berdasarkan tanda kurung: "isp (internet service provider)" -> ["isp", "internet service provider"]
        const parts = lowerKey.split('(').map(p => p.replace(')', '').trim());
        if (parts.includes(kataKunci)) {
          penjelasan = value;
          istilahDitemukan = key;
          break;
        }
      }
    }

    // 3. Pencarian sebagian kata (Substring match)
    if (penjelasan === "") {
      for (const [key, value] of Object.entries(dbUtama)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes(kataKunci)) {
          penjelasan = value;
          istilahDitemukan = key;
          break;
        }
      }
    }
  } catch (e) {
    console.error("Gagal membaca database utama:", e);
  }

  if (penjelasan !== "") {
    // Mempercantik tampilan judul (Huruf Kapital Tiap Kata)
    const judul = istilahDitemukan.replace(/\b\w/g, l => l.toUpperCase());
    bot.sendMessage(chatId, `📖 *${judul}*\n\n${penjelasan}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, `Mohon maaf, istilah *${text}* belum ditemukan. \n\nKamu bisa mengusulkan istilah ini dengan perintah:\n\`/add ${text}: [Penjelasan]\``, { parse_mode: 'Markdown' });
  }
});

console.log("Bot Telegram lokal sudah berjalan! Menunggu pesan...");