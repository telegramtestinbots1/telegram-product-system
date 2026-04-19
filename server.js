const express = require("express");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

const ALLOWED_ORIGIN = "https://telegramtestinbots1.github.io";
const token = "8741427596:AAGokUoGuYMbFW-6IVFvQYWx7I8ktdWu8xw";

// Yetkili kullanıcılar
const ALLOWED_USERS = [
  8741427596,   // sen
  00000000000,  // 2. kullanıcı
  00000000000,  // 3. kullanıcı
  00000000000   // 4. kullanıcı
];

// Telegram'a imza/sözleşme bildirimlerinin gideceği ana ID
const MAIN_ADMIN_ID = 8741427596;

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// JSON oku
function readProduct() {
  const data = fs.readFileSync("product.json", "utf8");
  return JSON.parse(data);
}

// JSON yaz
function writeProduct(product) {
  fs.writeFileSync("product.json", JSON.stringify(product, null, 2));
}

// Resim URL düzelt
function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

// Sahibinden verisi çek
async function fetchSahibindenData(ilanUrl) {
  const response = await axios.get(ilanUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
    },
    timeout: 15000
  });

  const html = response.data;
  const $ = cheerio.load(html);

  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim();

  let image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content") ||
    "";

  title = (title || "").trim();
  image = normalizeImageUrl((image || "").trim());

  if (!title) {
    throw new Error("İlan başlığı alınamadı");
  }

  return { title, image };
}

// Ürün oku
app.get("/product", (req, res) => {
  try {
    const product = readProduct();
    res.json(product);
  } catch (err) {
    console.error("Ürün okuma hatası:", err);
    res.status(500).json({ error: "Ürün okunamadı" });
  }
});

// Ürün güncelle
app.post("/update-product", (req, res) => {
  try {
    writeProduct(req.body);
    res.send("Ürün güncellendi");
  } catch (err) {
    console.error("Ürün güncelleme hatası:", err);
    res.status(500).send("Hata oluştu");
  }
});

// İmza gönder
app.post("/submit", async (req, res) => {
  try {
    const { signature, product } = req.body;

    await bot.sendPhoto(MAIN_ADMIN_ID, signature, {
      caption:
        "Yeni sözleşme\n" +
        (product?.name || "") + "\n" +
        (product?.price || "")
    });

    res.send("ok");
  } catch (err) {
    console.error("Submit hatası:", err);
    res.status(500).send("Gönderim hatası");
  }
});

// Uptime için
app.get("/ping", (req, res) => {
  res.send("ok");
});

// Server başlat
app.listen(process.env.PORT || 3000, () => {
  console.log("Server çalışıyor");
});

// Telegram bot
const bot = new TelegramBot(token, {
  polling: true
});

console.log("Bot çalışıyor...");

// Manuel ürün ekleme
bot.onText(/\/urun (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    if (!ALLOWED_USERS.includes(userId)) {
      bot.sendMessage(chatId, "⛔ Yetkisiz kullanım");
      return;
    }

    const data = match[1].split("|");

    if (data.length < 3) {
      bot.sendMessage(
        chatId,
        "❌ Format hatalı!\n\nKullanım:\n/urun Ürün|Fiyat|ResimURL"
      );
      return;
    }

    const product = {
      name: data[0].trim(),
      price: data[1].trim(),
      image: data[2].trim()
    };

    writeProduct(product);

    bot.sendMessage(chatId, "✅ Ürün güncellendi!");
    console.log("Manuel ürün:", product);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Hata oluştu");
  }
});

// Sahibinden linkinden ürün çekme
bot.onText(/\/ilan (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    if (!ALLOWED_USERS.includes(userId)) {
      bot.sendMessage(chatId, "⛔ Yetkisiz kullanım");
      return;
    }

    const data = match[1].split("|");

    if (data.length < 2) {
      bot.sendMessage(
        chatId,
        "❌ Format hatalı!\n\nKullanım:\n/ilan Fiyat|İlanLinki"
      );
      return;
    }

    const price = data[0].trim();
    const ilanUrl = data[1].trim();

    bot.sendMessage(chatId, "⏳ İlan bilgileri çekiliyor...");

    const ilanData = await fetchSahibindenData(ilanUrl);

    const product = {
      name: ilanData.title,
      price: price,
      image: ilanData.image
    };

    writeProduct(product);

    let resultMessage =
      "✅ İlan eklendi!\n\n" +
      "Başlık: " + product.name + "\n" +
      "Fiyat: " + product.price;

    if (!product.image) {
      resultMessage += "\n\n⚠️ Resim alınamadı. Gerekirse /urun komutuyla manuel resim gir.";
    }

    bot.sendMessage(chatId, resultMessage);
    console.log("İlandan ürün:", product);
  } catch (err) {
    console.error("İlan çekme hatası:", err);
    bot.sendMessage(
      chatId,
      "❌ İlan bilgileri alınamadı.\n\nGerekirse /urun komutuyla manuel gir."
    );
  }
});
