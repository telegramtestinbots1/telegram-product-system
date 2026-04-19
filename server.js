const express = require("express");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");

const app = express();

const ALLOWED_ORIGIN = "https://telegramtestinbots1.github.io";
const token = "8741427596:AAGokUoGuYMbFW-6IVFvQYWx7I8ktdWu8xw";

const ALLOWED_USERS = [
  6048463375,   // sen
  0,            // 2. kullanıcı
  0,            // 3. kullanıcı
  0             // 4. kullanıcı
];

const MAIN_ADMIN_ID = 6048463375;

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

app.get("/product", (req, res) => {
  try {
    res.json(readProduct());
  } catch (err) {
    console.error("Ürün okuma hatası:", err);
    res.status(500).json({ error: "Ürün okunamadı" });
  }
});

app.post("/update-product", (req, res) => {
  try {
    writeProduct(req.body);
    res.send("Ürün güncellendi");
  } catch (err) {
    console.error("Ürün güncelleme hatası:", err);
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
        (product?.price || "") + "\n" +
        (product?.seller || "") + "\n" +
        (product?.phone || "")
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

    if (data.length < 5) {
      bot.sendMessage(
        chatId,
        "❌ Kullanım:\n/urun ÜrünAdı|Fiyat|ResimURL|SatıcıAdı|Telefon"
      );
      return;
    }

    const product = {
      name: data[0].trim(),
      price: data[1].trim(),
      image: data[2].trim(),
      seller: data[3].trim(),
      phone: data[4].trim()
    };

    writeProduct(product);
    bot.sendMessage(chatId, "✅ Ürün güncellendi!");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Hata oluştu");
  }
});
