import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import axios from "../api/axios";
import "./PoleScaleLabel.css";
import { translateProductName } from "../utils/translateProductName";

const PoleScaleLabel = () => {
  const navigate = useNavigate();

  const [store, setStore] = useState({ shopName: "", shopNameAr: "" });
  const [form, setForm] = useState({
    itemNameEn: "",
    itemNameAr: "",
    weight: "",
    unitPrice: "",
    totalPrice: "",
    barcode: "",
    packedDate: new Date().toISOString().split("T")[0],
    expiryDate: ""
  });

  const [saleTime, setSaleTime] = useState("");

  // Load store details
  useEffect(() => {
    axios.get("/developer")
      .then(res => {
        setStore({
          shopName: res.data.shopName || "",
          shopNameAr: res.data.shopNameAr || ""
        });
      })
      .catch(err => console.error("Failed to load store info", err));

    setSaleTime(new Date().toLocaleTimeString("en-GB")); // HH:mm:ss
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    if (name === "itemNameEn") {
      updatedForm.itemNameAr = translateProductName(value) || "";
    }

    if (name === "weight" || name === "unitPrice") {
      const weight = parseFloat(updatedForm.weight) || 0;
      const unitPrice = parseFloat(updatedForm.unitPrice) || 0;
      updatedForm.totalPrice = (weight * unitPrice).toFixed(2);

      const priceInFils = Math.round(weight * unitPrice * 100)
        .toString()
        .padStart(5, "0");
      updatedForm.barcode = `28${priceInFils}01`;
    }

    setForm(updatedForm);
  };

  // ✅ Print exactly as shown on screen without raw-loader
  const handlePrint = () => {
  const printContents = document.querySelector(".label-preview").outerHTML;

  const style = `
    <style>
      ${document.querySelector("#label-styles")?.innerHTML || ""}
      body { margin: 0; padding: 0; }
      .label-preview {
        width: 50mm;
        padding: 6px;
        border: 2px solid black;
        font-family: Arial, sans-serif;
      }
      .label-header h2 { font-size: 14px; margin: 0; }
      .product-names strong { font-size: 14px; }
      .label-table { border-collapse: collapse; width: 100%; }
      .label-table td { font-size: 12px; padding: 2px 4px; border: 1px solid black; }
      .barcode-area { text-align: center; margin: 4px 0; }
      .total-price { text-align: right; font-weight: bold; font-size: 14px; }
    </style>
  `;

  const printWindow = window.open("", "_blank", "width=800,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Label</title>
        ${style}
      </head>
      <body>${printContents}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};


  return (
    <div className="pole-container">
      {/* Top bar */}
      <div className="top-bar">
        <button className="home-btn" onClick={() => navigate("/dashboard")}>🏠</button>
        <button className="close-btn" onClick={() => navigate(-1)}>✖</button>
      </div>

      {/* Form */}
      <div className="form-section">
        <label>Item Name (EN):</label>
        <input type="text" name="itemNameEn" value={form.itemNameEn} onChange={handleChange} />

        <label>Weight (kg):</label>
        <input type="number" step="0.001" name="weight" value={form.weight} onChange={handleChange} />

        <label>Unit Price (AED/kg):</label>
        <input type="number" step="0.01" name="unitPrice" value={form.unitPrice} onChange={handleChange} />

        <label>Packed Date:</label>
        <input type="date" name="packedDate" value={form.packedDate} onChange={handleChange} />

        <label>Expiry Date:</label>
        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
      </div>

      {/* Label Preview */}
      <div className="label-preview" id="printArea">
        <div className="label-header">
          <h2>{store.shopName}</h2>
          <h3>{store.shopNameAr}</h3>
        </div>

        <div className="product-names">
          <strong>{form.itemNameEn}</strong>
          <div>{form.itemNameAr}</div>
        </div>

        <table className="label-table">
          <tbody>
            <tr>
              <td>Sale Date</td>
              <td>{form.packedDate}</td>
              <td>{saleTime}</td>
            </tr>
            <tr>
              <td>unit Price</td>
              <td colSpan="2">{form.unitPrice} AED</td>
            </tr>
            <tr>
              <td>Net Wt (kg)</td>
              <td colSpan="2">{form.weight}</td>
            </tr>
            {form.expiryDate && (
              <tr>
                <td>Expiry</td>
                <td colSpan="2">{form.expiryDate}</td>
              </tr>
            )}
          </tbody>
        </table>

        {form.barcode && (
  <div className="barcode-area">
    <Barcode
      value={form.barcode}
      format="CODE128"
      height={40}
      displayValue={true}
      width={1.5} // moderate bar width
    />
  </div>
)}


        <div className="total-price">{form.totalPrice} AED</div>
      </div>

      <button className="print-btn" onClick={handlePrint}>🖨 Print Label</button>
    </div>
  );
};

export default PoleScaleLabel;
