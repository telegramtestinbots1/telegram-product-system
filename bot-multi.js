const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN tanımlı değil");
}

if (!PUBLIC_BASE_URL) {
  throw new Error("PUBLIC_BASE_URL tanımlı değil");
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const PRODUCTS_FILE = path.join(__dirname, "products.json");

function ensureProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "{}", "utf8");
  }
}

function readProducts() {
  ensureProductsFile();
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeProducts(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function generateId(len = 12) {
  return crypto.randomBytes(24).toString("hex").slice(0, len);
}

console.log("Multi bot çalışıyor...");

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Kullanım:\n/urun Ürün|Fiyat|ResimURL|Satıcı|Telefon\n\nÖrnek:\n/urun iPhone 13|25000|https://site.com/1.jpg|Ahmet|05550000000"
  );
});

bot.onText(/\/urun (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const parts = match[1].split("|").map(v => v.trim());

    if (parts.length < 5) {
      return bot.sendMessage(
        chatId,
        "❌ Format hatalı.\n\nDoğru kullanım:\n/urun Ürün|Fiyat|ResimURL|Satıcı|Telefon"
      );
    }

    const [name, price, image, seller, phone] = parts;

    const id = generateId(10);
    const token = generateId(24);

    const products = readProducts();

    products[id] = {
      id,
      token,
      name,
      price,
      image,
      seller,
      phone,
      createdAt: new Date().toISOString()
    };

    writeProducts(products);

    const link = `${PUBLIC_BASE_URL}/contract.html?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

    bot.sendMessage(
      chatId,
      `✅ İlan oluşturuldu.\n\nİlan ID: ${id}\nÖzel link:\n${link}`
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      "❌ Bir hata oluştu.\n\nDoğru kullanım:\n/urun Ürün|Fiyat|ResimURL|Satıcı|Telefon"
    );
  }
});