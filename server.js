const express = require("express");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");

const app = express();

// CORS AYARI
app.use(cors({
    origin: "https://telegramtestinbots1.github.io",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://telegramtestinbots1.github.io");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Ürün oku
app.get("/product", (req, res) => {
    try {
        const data = fs.readFileSync("product.json", "utf8");
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Ürün okuma hatası:", err);
        res.status(500).json({ error: "Ürün okunamadı" });
    }
});

// Ürün güncelle
app.post("/update-product", (req, res) => {
    try {
        fs.writeFileSync(
            "product.json",
            JSON.stringify(req.body, null, 2)
        );
        res.send("Ürün güncellendi");
    } catch (err) {
        console.error("Ürün güncelleme hatası:", err);
        res.status(500).send("Hata oluştu");
    }
});

// İmza gönder
app.post("/submit", (req, res) => {
    try {
        console.log("Yeni sözleşme geldi");

        const { signature, product } = req.body;

        bot.sendPhoto(chatIdFixed, signature, {
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

// SERVER
app.listen(process.env.PORT || 3000, () => {
    console.log("Server çalışıyor");
});

// TELEGRAM BOT
const token = "8741427596:AAGokUoGuYMbFW-6IVFvQYWx7I8ktdWu8xw";
const chatIdFixed = 8741427596;

const bot = new TelegramBot(token, {
    polling: true
});

console.log("Bot çalışıyor...");

bot.onText(/\/urun (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    try {
        if (chatId !== chatIdFixed) {
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

        fs.writeFileSync(
            "product.json",
            JSON.stringify(product, null, 2)
        );

        bot.sendMessage(chatId, "✅ Ürün güncellendi!");
        console.log("Yeni ürün:", product);

    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "❌ Hata oluştu");
    }
});
