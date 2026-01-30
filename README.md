# POSBAQALA - Offline POS System 🇦🇪

A complete bilingual (English + Arabic) **offline-capable Point of Sale (POS)** system for Baqala stores, flour mills, and supermarkets in the UAE.

## 🧩 Tech Stack

| Layer     | Technology                 |
|-----------|----------------------------|
| Frontend  | React (Node.js 22+)        |
| Backend   | Java Spring Boot (3.5.2)   |
| Database  | MongoDB Atlas              |
| Language  | English & Arabic (Offline) |

---

## 📦 Project Structure

```
pos-offline-service/
├── frontend/               # React POS UI (touch-optimized)
├── backend/                # Java Spring Boot (REST APIs)
├── database/               # MongoDB collections (export JSON)
```

---

## 🚀 Getting Started

### ✅ 1. Start Backend (Spring Boot)

```bash
cd backend/pos
mvn spring-boot:run
```

Runs at: `http://localhost:8080`

### ✅ 2. Start Frontend (React)

```bash
cd frontend
npm install
npm start
```

Runs at: `http://localhost:3000`

---

## 🌐 API URL

Frontend uses this base URL in `frontend/src/api/axios.js`:

```js
export default axios.create({
  baseURL: 'http://localhost:8080/api',
});
```

---

## 🌍 Arabic Translation (Offline)

### ✅ Pre-Built Dictionary Logic

`src/utils/arabicTranslator.js`

```js
const dictionary = {
  "Milk": "حليب",
  "Rice 5kg": "أرز ٥ كيلو",
  "500ml": "٥٠٠ مل",
  "Can": "علبة"
};

export function translateProductName(text) {
  if (dictionary[text]) return dictionary[text];
  return text
    .replace(/\b(\d+)ml\b/g, (_, n) => `${n} مل`)
    .replace(/\bCan\b/g, "علبة");
}
```

This enables **offline auto-translation** from English to Arabic for product names.

---

## ✨ Features

- ✅ Touch-friendly POS billing with F1–F12 keys
- ✅ Product Master with bilingual names
- ✅ Customer entry & reports
- ✅ Auto-translate English → Arabic offline
- ✅ Barcode/Item Code/Product Code support
- ✅ Subitems for bulk packaging
- ✅ Pole display & scale (configurable)
- ✅ Z/X Reports & Shift control
- ✅ Print invoices (POS & A4 format)

---

## 🛡️ Secure Login

- **Admin**: Full access, Forgot Password via Email
- **Cashier**: Limited access, no password recovery

---

## 📤 Email Recovery

SMTP via Gmail configured for admin password recovery in `application.properties`.

---

## 🧠 Developer Notes

- Java version: `21.0.7`
- Node.js version: `22.16`
- MongoDB Atlas used with cluster URI
- CORS enabled on backend for localhost:3000

---

## 📸 Screenshots

📷 POS Billing | 📦 Product Form | 📊 Reports | 🧾 Invoice | 🌐 Arabic Names

---

## 📬 Contact

**TechFlux Software UAE**  
Email: techfluxsoftware@gmail.com

---