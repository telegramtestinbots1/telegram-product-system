const express = require("express");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

const ALLOWED_ORIGIN = "https://telegramtestinbots1.github.io";
const token = "8741427596:AAGokUoGuYMbFW-6IVFvQYWx7I8ktdWu8xw";

const ALLOWED_USERS = [
  8741427596,
  0,
  0,
  0
];

const MAIN_ADMIN_ID = 8741427596;

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

function isAllowedUser(msg) {
  return ALLOWED_USERS.includes(Number(msg.from.id));
}

function readProduct() {
  const data = fs.readFileSync("product.json", "utf8");
  return JSON.parse(data);
}

function writeProduct(product) {
  fs.writeFileSync("product.json", JSON.stringify(product, null, 2));
}

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

async function fetchSahibindenData(ilanUrl) {
  const response = await axios.get(ilanUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);

  let title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim();

  let image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content") ||
    "";

  title = (title || "").trim();
  image = normalizeImageUrl((image || "").trim());

  if (!title) throw new Error("İlan başlığı alınamadı");

  return { title, image };
}

app.get("/product", (req, res) => {
  try {
    res.json(readProduct());
  } catch (err) {
    res.status(500).json({ error: "Ürün okunamadı" });
  }
});

app.post("/update-product", (req, res) => {
  try {
    writeProduct(req.body);
    res.send("Ürün güncellendi");
  } catch (err) {
    res.status(500).send("Hata oluştu");
  }
});

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

app.get("/ping", (req, res) => {
  res.send("ok");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server çalışıyor");
});

const bot = new TelegramBot(token, { polling: true });

console.log("Bot çalışıyor...");

bot.onText(/\/id/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `userId: ${Number(msg.from.id)}\nchatId: ${Number(msg.chat.id)}`
  );
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Merhaba\nuserId: ${Number(msg.from.id)}\nYetkili: ${isAllowedUser(msg) ? "evet" : "hayır"}`
  );
});

bot.onText(/\/urun (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  try {
    if (!isAllowedUser(msg)) {
      bot.sendMessage(chatId, `⛔️ Yetkisiz kullanım\nuserId: ${Number(msg.from.id)}`);
      return;
    }

    const data = match[1].split("|");

    if (data.length < 3) {
      bot.sendMessage(chatId, "❌ Kullanım:\n/urun Ürün|Fiyat|ResimURL");
      return;
    }

    const product = {
      name: data[0].trim(),
      price: data[1].trim(),
      image: data[2].trim()
    };

    writeProduct(product);
    bot.sendMessage(chatId, "✅ Ürün güncellendi!");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Hata oluştu");
  }
});

bot.onText(/\/ilan (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    if (!isAllowedUser(msg)) {
      bot.sendMessage(chatId, `⛔️ Yetkisiz kullanım\nuserId: ${Number(msg.from.id)}`);
      return;
    }

    const data = match[1].split("|");

    if (data.length < 2) {
      bot.sendMessage(chatId, "❌ Kullanım:\n/ilan Fiyat|İlanLinki");
      return;
    }

    const price = data[0].trim();
    const ilanUrl = data[1].trim();

    bot.sendMessage(chatId, "⏳ İlan bilgileri çekiliyor...");

    const ilanData = await fetchSahibindenData(ilanUrl);

    const product = {
      name: ilanData.title,
      price,
      image: ilanData.image
    };

    writeProduct(product);

    bot.sendMessage(
      chatId,
      `✅ İlan eklendi!\n\nBaşlık: ${product.name}\nFiyat: ${product.price}`
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ İlan bilgileri alınamadı");
  }
});
