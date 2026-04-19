const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PRODUCTS_FILE = path.join(__dirname, "products.json");
const SIGNATURES_DIR = path.join(__dirname, "signatures");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

function ensureProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "{}", "utf8");
  }
}

function ensureSignaturesDir() {
  if (!fs.existsSync(SIGNATURES_DIR)) {
    fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
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

app.get("/multi/product/:id", (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const products = readProducts();
  const product = products[id];

  if (!product) {
    return res.status(404).json({ success: false, message: "İlan bulunamadı" });
  }

  if (!token || token !== product.token) {
    return res.status(403).json({ success: false, message: "Yetkisiz erişim" });
  }

  return res.json({
    success: true,
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    seller: product.seller,
    phone: product.phone
  });
});

app.post("/multi/submit", (req, res) => {
  try {
    const { id, token, signature } = req.body;
    const products = readProducts();
    const product = products[id];

    if (!product) {
      return res.status(404).json({ success: false, message: "İlan bulunamadı" });
    }

    if (!token || token !== product.token) {
      return res.status(403).json({ success: false, message: "Yetkisiz işlem" });
    }

    ensureSignaturesDir();

    fs.writeFileSync(
      path.join(SIGNATURES_DIR, `${id}.json`),
      JSON.stringify(
        {
          id,
          signedAt: new Date().toISOString(),
          product: {
            name: product.name,
            price: product.price,
            seller: product.seller,
            phone: product.phone
          },
          signature
        },
        null,
        2
      ),
      "utf8"
    );

    return res.json({ success: true, message: "İmza kaydedildi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Multi server çalışıyor: ${PORT}`);
});