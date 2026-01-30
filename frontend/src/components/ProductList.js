// src/components/ProductList.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ProductForm from "./ProductForm";
import "./ProductList.css";
import { FaPlus, FaTimes, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";

/* ---------- helpers ---------- */
const calcDerived = (p = {}) => {
  const sub = Array.isArray(p.subItems) ? p.subItems : [];
  let totalQty = 0;
  let totalPrice = 0;

  if (sub.length > 0) {
    totalQty = sub.reduce((s, it) => s + Number(it.quantity || 0), 0);
    totalPrice = sub.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
  } else {
    totalQty = Number(p.packQty || 0);
    totalPrice = totalQty * Number(p.retail || 0);
  }

  const stock = Number(p.stock || 0);
  const balance = stock - totalQty;

  return {
    ...p,
    totalQty,
    totalPrice: Number.isFinite(totalPrice) ? totalPrice : 0,
    stock,
    balance,
  };
};

const asMoney = (n) =>
  Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "0.00";

export default function ProductList() {
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [importing, setImporting] = useState(false); // used in UI

  const fileRef = useRef(null);

  /* ---------- load ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/products");
        const withDerived = (Array.isArray(data) ? data : []).map(calcDerived);
        setAllProducts(withDerived);
        setProducts(withDerived);
      } catch (err) {
        console.error("❌ Failed to fetch products", err?.message || err);
      }
    })();
  }, []);

  const refresh = async () => {
    const { data } = await api.get("/products");
    const withDerived = (Array.isArray(data) ? data : []).map(calcDerived);
    setAllProducts(withDerived);
    setProducts(withDerived);
  };

  /* ---------- search ---------- */
  const handleSearch = () => {
    const codeQ = searchCode.trim().toLowerCase();
    const nameQ = searchName.trim().toLowerCase();

    if (!codeQ && !nameQ) {
      setProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter((p) => {
      const code = (p.code || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const nameAr = (p.nameAr || "").toLowerCase();

      const codeOk = !codeQ || code.includes(codeQ);
      const nameOk = !nameQ || name.includes(nameQ) || nameAr.includes(nameQ);

      return codeOk && nameOk; // both when provided
    });

    setProducts(filtered);
  };

  /* ---------- CRUD ---------- */
  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleEdit = (p) => {
    setEditProduct(p);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await refresh();
    } catch (err) {
      console.error("❌ Delete failed", err?.message || err);
    }
  };

  /* ---------- export ---------- */
  const handleExport = () => {
    const rows = products.map((p, i) => ({
      No: i + 1,
      Barcode: p.barcode || "",
      "Item Code": p.code || "",
      "Name (EN / AR)": `${p.name || ""} / ${p.nameAr || ""}`.trim(),
      Unit: p.unit || "",
      "Total Qty": p.totalQty || 0,
      Stock: p.stock || 0,
      Balance: p.balance || 0,
      "Total Price": asMoney(p.totalPrice),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Product_List.xlsx");
  };

  /* ---------- import (xlsx/csv) ---------- */
  const openImport = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Expected columns (case-insensitive):
      // Barcode, Code, Name, NameAr, Unit, PackQty, Retail, Stock
      let ok = 0;
      let dup = 0;
      let fail = 0;

      for (const r of rows) {
        const payload = {
          barcode: (r.Barcode || r.barcode || "").toString().trim(),
          code: (r.Code || r.code || "").toString().trim(),
          name: (r.Name || r.name || "").toString().trim(),
          nameAr:
            (r.NameAr || r.nameAr || r["Name (AR)"] || "").toString().trim(),
          unit: (r.Unit || r.unit || "").toString().trim(),
          packQty: Number(r.PackQty || r.packQty || 0),
          retail: Number(r.Retail || r.retail || 0),
          stock: Number(r.Stock || r.stock || 0),
        };

        if (!payload.code || !payload.name) {
          fail++;
          continue;
        }

        try {
          await api.post("/products", payload);
          ok++;
        } catch (err) {
          if (err?.response?.status === 409) dup++;
          else fail++;
        }
      }

      await refresh();
      alert(`Import finished.\nAdded: ${ok}\nDuplicates: ${dup}\nFailed: ${fail}`);
    } catch (err) {
      console.error("❌ Import failed", err);
      alert("Import failed. Please check your file format.");
    } finally {
      setImporting(false);
    }
  };

  /* ---------- totals ---------- */
  const totals = useMemo(
    () => ({
      qty: products.reduce((s, p) => s + (p.totalQty || 0), 0),
      stock: products.reduce((s, p) => s + (p.stock || 0), 0),
      balance: products.reduce((s, p) => s + (p.balance || 0), 0),
      price: products.reduce((s, p) => s + (p.totalPrice || 0), 0),
    }),
    [products]
  );

  return (
    <div className="product-list-container">
      {/* Header */}
      <div className="header">
        <div className="left">
          <h2>📦 Product</h2>
        </div>
        <div className="right">
          {/* hidden file input for Import */}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFile}
          />

          {/* use `importing` so no ESLint warning */}
          <button
            title="Import Excel/CSV"
            onClick={openImport}
            className="icon-btn"
            disabled={importing}
          >
            {importing ? "⏳" : "📥"}
          </button>

          <button title="Export Excel" onClick={handleExport} className="icon-btn">
            📄
          </button>

          <button
            title="Dashboard"
            onClick={() => navigate("/dashboard")}
            className="icon-btn"
          >
            🏠
          </button>

          <button
            className="close-btn"
            title="x"
            onClick={() => navigate("/dashboard")}
          >
            <FaTimes color="#b70e0eff" size={16} />
            
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Item Code"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <input
          type="text"
          placeholder="Item Name (EN/AR)"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>
          <FaSearch /> Search
        </button>
        <button className="add-btn" onClick={handleAdd}>
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="table-scroll-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Barcode</th>
              <th>Item Code</th>
              <th>Name (EN / AR)</th>
              <th>Total Qty</th>
              <th>Stock</th>
              <th>Balance</th>
              <th>Unit</th>
              <th>Total Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id || p._id || p.code || i}>
                <td>{i + 1}</td>
                <td>{p.barcode}</td>
                <td>{p.code}</td>
                <td>{`${p.name || ""} / ${p.nameAr || ""}`}</td>
                <td>{p.totalQty}</td>
                <td>{p.stock}</td>
                <td>{p.balance}</td>
                <td>{p.unit}</td>
                <td>{asMoney(p.totalPrice)}</td>
                <td>
                  <button
                    className="edit-btn"
                    title="Edit"
                    onClick={() => handleEdit(p)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="delete-btn"
                    title="Delete"
                    onClick={() => handleDelete(p.id || p._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", background: "#f8f9fa" }}>
              <td colSpan={4} style={{ textAlign: "right" }}>
                Total
              </td>
              <td>{totals.qty}</td>
              <td>{totals.stock}</td>
              <td>{totals.balance}</td>
              <td />
              <td>{asMoney(totals.price)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <ProductForm
          onClose={() => setShowForm(false)}
          onSave={refresh}
          editData={editProduct}
          mode={editProduct ? "edit" : "add"}
        />
      )}
    </div>
  );
}
