// fta-decode.js
// Simple FTA QR TLV decoder server on http://localhost:4000

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Decode TLV from Base64 string
 *  [TAG][LEN][VALUE...]
 */
function decodeFtaTlv(base64) {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("base64 string required");
  }

  const buf = Buffer.from(base64, "base64");
  const fields = [];
  let i = 0;

  while (i < buf.length) {
    const tag = buf[i];
    const len = buf[i + 1];

    if (i + 2 + len > buf.length) {
      throw new Error("Invalid TLV length");
    }

    const valueBytes = buf.slice(i + 2, i + 2 + len);
    const value = valueBytes.toString("utf8");

    // Optional: map known tags
    let name;
    switch (tag) {
      case 1:
        name = "sellerName";
        break;
      case 2:
        name = "trn";
        break;
      case 3:
        name = "timestamp";
        break;
      case 4:
        name = "totalWithVat";
        break;
      case 5:
        name = "vatAmount";
        break;
      default:
        name = `tag_${tag}`;
    }

    fields.push({ tag, name, value });
    i += 2 + len;
  }

  return fields;
}

// POST /decode-fta-qr  { "base64": "..." }
app.post("/decode-fta-qr", (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Missing 'base64' in body" });
    }

    const fields = decodeFtaTlv(base64);
    return res.json({ decoded: fields });
  } catch (err) {
    console.error("Decode error:", err.message);
    return res
      .status(500)
      .json({ error: "Invalid Base64 or TLV format", details: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`FTA QR Decoder running on http://localhost:${PORT}`);
});
