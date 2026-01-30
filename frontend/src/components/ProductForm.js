// src/components/ProductForm.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "../api/axios";
import "./ProductForm.css";
import { translateProductName } from "../utils/translateProductName";
import UnitMasterModal from "./UnitMasterModal";

/* ---------- helpers ---------- */
const numberOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const stringOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/* ---------- tiny inline uploader ---------- */
function ImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(value || "");
  useEffect(() => setPreview(value || ""), [value]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      alert("Please choose PNG/JPG/WEBP image.");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      alert("Image must be ≤ 3MB.");
      return;
    }
    onChange({ file: f });
    const r = new FileReader();
    r.onload = () => setPreview(String(r.result));
    r.readAsDataURL(f);
  };

  const clear = () => {
    setPreview("");
    onChange(null);
  };

  return (
    <div className="img-upload">
      <div className="img-upload-row">
        <input id="productImageFile" type="file" accept="image/*" onChange={onFile} />
        {preview && (
          <button type="button" className="product-btn" onClick={clear}>
            Remove
          </button>
        )}
      </div>
      {preview && (
        <div className="img-upload-preview">
          <img src={preview} alt="Product preview" />
        </div>
      )}
    </div>
  );
}

ImageUpload.propTypes = { value: PropTypes.string, onChange: PropTypes.func.isRequired };
ImageUpload.defaultProps = { value: "" };

/* ---------- grid field labels ---------- */
const FIELD_ROWS = [
  ["baseCost", "costTax", "netCost"],
  ["margin", "retail", "packQty"],
  ["brand", "bin", "size"],
  ["cupSize", "purchaseAcc", "salesAcc"],
  ["prodGroup", "category", "unit"],
];

function ProductForm({ onClose, onSave, mode, editData }) {
  const [form, setForm] = useState({
    id: "",
    barcode: "",
    code: "",
    productCode: "",
    name: "",
    nameAr: "",
    baseCost: "",
    costTax: "",
    netCost: "",
    margin: "",
    retail: "",
    packQty: "",
    stock: "",
    brand: "",
    purchaseAcc: "",
    salesAcc: "",
    prodGroup: "",
    category: "",   // UI string, coerced to number in payload as categoryId
    unit: "",
    wholesale: "",
    credit: "",
    bin: "",
    size: "",
    cupSize: "",
    vatPercent: "",
    directSale: false,
    imageUrl: "",
  });

  const [imageSel, setImageSel] = useState(null);
  const [nameArTouched, setNameArTouched] = useState(false);

  const [subitems, setSubitems] = useState([]);
  const [subitemInput, setSubitemInput] = useState({
    unit: "",
    price: "",
    quantity: "",
    itemBarcode: "",
    productCode: "",
  });

  const [showUnitModal, setShowUnitModal] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => { nameInputRef.current?.focus(); }, []);

  /* populate edit */
  useEffect(() => {
    if (mode === "edit" && editData) {
      setForm((p) => ({
        ...p,
        ...editData,
        id: editData.id || editData._id || "",
        productCode: editData.productCode || "",
        credit: editData.creditPrice ?? "",
        imageUrl: editData.imageUrl || "",
        category: String(editData.category ?? editData.categoryId ?? ""),
      }));

      setSubitems(
        Array.isArray(editData.subItems)
          ? editData.subItems.map((s) => ({
              unit: s.unit || "",
              price: s.retail ?? "",
              quantity: s.factor ?? "",
              itemBarcode: s.barcode || "",
              productCode: s.productCode || "",
            }))
          : []
      );

      setNameArTouched(false);
    }
  }, [mode, editData]);

  /* auto-translate EN → AR (never overwrite typed AR) */
  useEffect(() => {
    const en = (form.name || "").trim();
    const ar = (form.nameAr || "").trim();
    if (en && !ar && !nameArTouched) {
      const guess = translateProductName(en);
      if (guess && guess !== form.nameAr) setForm((prev) => ({ ...prev, nameAr: guess }));
    }
  }, [form.name, form.nameAr, nameArTouched]);

  /* auto-calc margin */
  useEffect(() => {
    const base = Number(form.baseCost);
    const retail = Number(form.retail);
    if (Number.isFinite(base) && Number.isFinite(retail) && base > 0) {
      const m = ((retail - base) / base) * 100;
      setForm((prev) => ({ ...prev, margin: m.toFixed(2) }));
    } else if (!form.baseCost || !form.retail) {
      setForm((prev) => ({ ...prev, margin: "" }));
    }
  }, [form.baseCost, form.retail]);

  /* handlers */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleArabicChange = (e) => {
    setForm((prev) => ({ ...prev, nameAr: e.target.value }));
    setNameArTouched(true);
  };
  const handleSubitemChange = (e) => {
    const { name, value } = e.target;
    setSubitemInput((prev) => ({ ...prev, [name]: value }));
  };

  const addSubitem = () => {
    const { unit, price, quantity } = subitemInput;
    if (!unit || !price || !quantity) return;
    setSubitems((prev) => [...prev, { ...subitemInput }]);
    setSubitemInput({ unit: "", price: "", quantity: "", itemBarcode: "", productCode: "" });
  };
  const removeSubitem = (idx) => setSubitems((prev) => prev.filter((_, i) => i !== idx));

  const subitemTotal = useMemo(
    () => subitems.reduce((sum, s) => sum + Number(s.price || 0) * Number(s.quantity || 0), 0),
    [subitems]
  );

  /* upload (only if needed) */
  const uploadImageIfNeeded = async () => {
    if (!form.directSale) return form.imageUrl || "";
    if (!imageSel?.file) return form.imageUrl || "";

    const fd = new FormData();
    fd.append("file", imageSel.file);

    const { data } = await axios.post("/files/product-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data?.url || "";
  };

  /* payload (map UI -> backend) */
  const buildPayload = (imageUrl) => ({
    barcode: stringOrNull(form.barcode),
    code: stringOrNull(form.code),
    productCode: stringOrNull(form.productCode),

    name: stringOrNull(form.name),
    nameAr: stringOrNull(form.nameAr),

    baseCost: numberOrNull(form.baseCost),
    costTax: numberOrNull(form.costTax),
    netCost: numberOrNull(form.netCost),
    margin: numberOrNull(form.margin),
    retail: numberOrNull(form.retail),
    wholesale: numberOrNull(form.wholesale),
    creditPrice: numberOrNull(form.credit),
    vatPercent: numberOrNull(form.vatPercent),
    packQty: numberOrNull(form.packQty),
    stock: numberOrNull(form.stock),

    brand: stringOrNull(form.brand),
    bin: stringOrNull(form.bin),
    size: stringOrNull(form.size),
    cupSize: stringOrNull(form.cupSize),
    prodGroup: stringOrNull(form.prodGroup),

    // If your API expects "category" instead of "categoryId", rename key here:
    categoryId: numberOrNull(form.category),

    unit: stringOrNull(form.unit),
    purchaseAcc: stringOrNull(form.purchaseAcc),
    salesAcc: stringOrNull(form.salesAcc),

    directSale: !!form.directSale,
    imageUrl: imageUrl || "",

    subItems: (subitems || []).map((s) => ({
      unit: stringOrNull(s.unit),
      retail: numberOrNull(s.price),
      factor: numberOrNull(s.quantity),
      barcode: stringOrNull(s.itemBarcode),
      wholesale: null,
      productCode: stringOrNull(s.productCode),
    })),
  });

  const handleSubmit = async () => {
    try {
      const imageUrl = await uploadImageIfNeeded();
      const payload = buildPayload(imageUrl);

      if (mode === "add") {
        const res = await axios.get("/products/check-unique", {
          params: { barcode: form.barcode, code: form.code, productCode: form.productCode },
        });
        if (res.data?.barcodeUnique === false) { alert("❌ Barcode already exists."); return; }
        if (res.data?.codeUnique === false)    { alert("❌ Product code already exists."); return; }
        if (res.data?.productCodeUnique === false) { alert("❌ Pole scale product code already exists."); return; }

        await axios.post("/products", payload);
      } else {
        const id = form.id || editData?.id || editData?._id;
        if (!id) { alert("❌ Missing product ID."); return; }
        await axios.put(`/products/${id}`, payload);
      }

      alert("✅ Product saved!");
      onSave?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        err.message;
      console.error("Save Error:", err?.response?.data || err);
      alert(`❌ Failed to save product. ${msg || "Server error"}`);
    }
  };

  return (
    <div className="product-form-overlay" role="dialog" aria-modal="true">
      <div className="product-form-container">
        <div className="form-header">
          <h2>{mode === "edit" ? "Edit Product" : "Add Product"}</h2>
        <button type="button" className="form-close-btn" onClick={onClose}>×</button>
        </div>

        <form className="product-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            {/* identifiers & bilingual names */}
            <div className="input-row">
              <input name="barcode" placeholder="Barcode" value={form.barcode ?? ""} onChange={handleChange} />
              <input name="code" placeholder="Product Code" value={form.code ?? ""} onChange={handleChange} />
              <input name="name" placeholder="Product Name (English)" value={form.name ?? ""} onChange={handleChange} ref={nameInputRef} />
              <input name="nameAr" placeholder="اسم المنتج (Arabic)" value={form.nameAr ?? ""} onChange={handleArabicChange} style={{ direction: "rtl" }} />
            </div>

            {/* grid rows */}
            {FIELD_ROWS.map((row, idx) => (
              <div key={`row-${idx}`} className="input-row">
                {row.map((field) =>
                  field === "unit" ? (
                    <div className="unit-input-group" key="unit">
                      <input name="unit" placeholder="Unit" value={form.unit ?? ""} onChange={handleChange} />
                      <button type="button" className="unit-icon-btn" onClick={() => setShowUnitModal(true)} title="Manage Units">🔍</button>
                    </div>
                  ) : (
                    <input key={field} name={field} placeholder={cap(field)} value={form[field] ?? ""} onChange={handleChange} />
                  )
                )}
              </div>
            ))}

            {/* image (above direct sale) */}
            <div className="input-row">
              <div className="image-upload-wrap">
                <div className="field-title">Product Image (for Direct Sale)</div>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(sel) => {
                    setImageSel(sel);
                    if (!sel) setForm((p) => ({ ...p, imageUrl: "" }));
                  }}
                />
              </div>
            </div>

            {/* wholesale + credit + direct-sale */}
            <div className="input-row">
              <input name="wholesale" placeholder="Wholesale" value={form.wholesale ?? ""} onChange={handleChange} />
              <input name="credit" placeholder="Credit" value={form.credit ?? ""} onChange={handleChange} />
              <label className="checkbox-inline" htmlFor="directSale">
                <input id="directSale" type="checkbox" name="directSale" checked={!!form.directSale} onChange={handleChange} />{" "}
                Direct Sale Item
              </label>
            </div>
          </div>

          {/* Subitems */}
          <div className="subitem-section">
            <h4>Subitems (for bulk items)</h4>
            <div className="subitem-inputs">
              <input name="unit" placeholder="Unit" value={subitemInput.unit ?? ""} onChange={handleSubitemChange} />
              <input name="price" placeholder="Price" value={subitemInput.price ?? ""} onChange={handleSubitemChange} />
              <input name="quantity" placeholder="Qty" value={subitemInput.quantity ?? ""} onChange={handleSubitemChange} />
              <input name="itemBarcode" placeholder="Item Barcode (opt)" value={subitemInput.itemBarcode ?? ""} onChange={handleSubitemChange} />
              <input name="productCode" placeholder="Product Code (opt)" value={subitemInput.productCode ?? ""} onChange={handleSubitemChange} />
              <button type="button" className="product-btn green" onClick={addSubitem}>Add</button>
            </div>

            <table className="subitem-table">
              <thead>
                <tr><th>Unit</th><th>Price</th><th>Qty</th><th>Barcode</th><th>ProdCode</th><th>Action</th></tr>
              </thead>
              <tbody>
                {subitems.map((item, i) => (
                  <tr key={`${item.unit || "u"}-${item.itemBarcode || "b"}-${i}`}>
                    <td>{item.unit}</td>
                    <td>{item.price}</td>
                    <td>{item.quantity}</td>
                    <td>{item.itemBarcode}</td>
                    <td>{item.productCode}</td>
                    <td>
                      <button type="button" className="product-btn red" onClick={() => removeSubitem(i)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="subitem-subtotal">
              <strong>Subtotal:</strong>&nbsp;{subitemTotal.toFixed(2)}
            </div>
          </div>

          <div className="form-buttons">
            <button type="button" className="product-btn green" onClick={handleSubmit}>
              {mode === "edit" ? "Update" : "Save"}
            </button>
            <button type="button" className="product-btn red" onClick={onClose}>Close</button>
          </div>
        </form>
      </div>

      {showUnitModal && (
        <UnitMasterModal
          onClose={() => setShowUnitModal(false)}
          onUnitAdded={(unit) => setForm((prev) => ({ ...prev, unit }))}
        />
      )}
    </div>
  );
}

ProductForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit"]),
  editData: PropTypes.object,
};
ProductForm.defaultProps = { mode: "add", editData: null };
export default ProductForm;
