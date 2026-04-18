const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "8741427596:AAGokUoGuYMbFW-6IVFvQYWx7I8ktdWu8xw";

const bot = new TelegramBot(token, {
    polling: true
});

console.log("Bot çalışıyor...");

bot.onText(/\/urun (.+)/, (msg, match) => {

    const chatId = msg.chat.id;

    try {

        const data = match[1].split("|");

        const product = {

            name: data[0],
            price: data[1],
            image: data[2]

        };

        fs.writeFileSync(
            "product.json",
            JSON.stringify(product, null, 2)
        );

        bot.sendMessage(
            chatId,
            "✅ Ürün güncellendi!"
        );

    } catch (err) {

        bot.sendMessage(
            chatId,
            "❌ Format hatalı!\n\n/urun Ürün|Fiyat|ResimURL"
        );

    }

});