import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./CompanyForm.css";
import {
  FaHome,
  FaBuilding,
  FaSave,
  FaSyncAlt,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

/* ===============================
   Shop Modal (Add/Edit)
=============================== */
function ShopModal({ open, initial, onClose, onSave, saving = false }) {
  const [shop, setShop] = useState(
    initial || { id: "", name: "", trn: "", pincode: "", phone: "", active: true, default: false }
  );
  const nameRef = useRef(null);

  useEffect(() => {
    setShop(
      initial || { id: "", name: "", trn: "", pincode: "", phone: "", active: true, default: false }
    );
  }, [initial]);

  // focus + keyboard handlers
  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shop]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setShop((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = () => {
    const s = { ...shop };
    if (!s.name?.trim()) return alert("Shop Name is required");
    // stable id
    if (!s.id) s.id = `shop_${Math.random().toString(36).slice(2, 8)}`;
    onSave(s);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Shop">
        <h3>Shop</h3>

        <div className="modal-grid">
          <label htmlFor="shop-name-input">
            Shop Name
            <input
              id="shop-name-input"
              ref={nameRef}
              name="name"
              value={shop.name}
              onChange={handle}
            />
          </label>

          <label htmlFor="shop-trn">
            TRN
            <input id="shop-trn" name="trn" value={shop.trn} onChange={handle} />
          </label>

          <label htmlFor="shop-pincode">
            Pincode
            <input id="shop-pincode" name="pincode" value={shop.pincode} onChange={handle} />
          </label>

          <label htmlFor="shop-phone">
            Phone
            <input id="shop-phone" name="phone" value={shop.phone} onChange={handle} />
          </label>

          <label className="checkbox-row">
            <input type="checkbox" name="active" checked={!!shop.active} onChange={handle} />
            Active
          </label>

          <label className="checkbox-row">
            <input type="checkbox" name="default" checked={!!shop.default} onChange={handle} />
            Default Shop
          </label>
        </div>

        <div className="modal-actions">
          <button className="button-save" onClick={handleSave} disabled={saving}>
            <FaSave /> Save
          </button>
          <button className="button-clear" onClick={onClose} disabled={saving}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Main Company Form
=============================== */
const EMPTY = {
  id: "",
  name: "",
  trn: "",
  address: "",
  pincode: "",
  phone: "",
  mobile: "",
  email: "",
  shopId: "", // optional single-shop id
  adminUsername: "",
};

export default function CompanyForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY);
  const [shops, setShops] = useState([]); // [{id,name,trn,pincode,phone,active,default}]
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [busy, setBusy] = useState(false);

  // Modal state
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  // avoid memory leaks for object URL
  const prevObjectUrl = useRef("");
  useEffect(
    () => () => prevObjectUrl.current && URL.revokeObjectURL(prevObjectUrl.current),
    []
  );

  const clearForm = () => {
    setFormData(EMPTY);
    setShops([]);
    setLogoFile(null);
    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    prevObjectUrl.current = "";
    setPreviewUrl("");
    setIsEditMode(false);
    setMsg("");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      const file = files?.[0] || null;
      setLogoFile(file);
      if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
      const url = file ? URL.createObjectURL(file) : "";
      prevObjectUrl.current = url;
      setPreviewUrl(url);
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const loadExistingCompany = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.get("/company");
      const c = res?.data || {};
      setFormData({
        id: c.id || c._id || "",
        name: c.name || "",
        trn: c.trn || "",
        address: c.address || "",
        pincode: c.pincode || "",
        phone: c.phone || "",
        mobile: c.mobile || "",
        email: c.email || "",
        shopId: c.shopId || "",
        adminUsername: c.adminUsername || "",
      });
      setShops(Array.isArray(c.shops) ? c.shops : []);
      if (c.logoUrl) setPreviewUrl(c.logoUrl);
      setIsEditMode(true);
    } catch (err) {
      console.error("Load company failed:", err);
      setMsg("❌ No company found");
      setIsEditMode(false);
      setShops([]);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!formData.name?.trim()) return setMsg("❌ Company Name is required");

    setBusy(true);
    setMsg("");

    // Enforce one default shop max
    const defaults = shops.filter((s) => s.default);
    if (defaults.length > 1) {
      setBusy(false);
      return setMsg("❌ Only one shop can be Default");
    }

    const multipart = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") multipart.append(k, v);
    });
    multipart.append("shops", JSON.stringify(shops));
    if (logoFile) multipart.append("logo", logoFile);

    try {
      await api.post("/company", multipart, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(isEditMode ? "✅ Company updated successfully" : "✅ Company saved successfully");
      if (!isEditMode) clearForm();
    } catch (err) {
      console.error("Save company failed:", err);
      setMsg("❌ Error saving company");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const saveLabel = useMemo(() => (isEditMode ? "Update" : "Save"), [isEditMode]);

  // ---- shops helpers ----
  const addShop = () => {
    setEditingShop(null);
    setShopModalOpen(true);
  };

  const editShop = (row) => {
    setEditingShop(row);
    setShopModalOpen(true);
  };

  const deleteShop = (id) => {
    if (!window.confirm("Delete this shop?")) return;
    setShops((list) => list.filter((s) => s.id !== id));
  };

  const upsertShop = (s) => {
    setShops((list) => {
      // duplicate guard (by name, case-insensitive)
      const nameExists = list.some(
        (x) => x.id !== s.id && x.name.trim().toLowerCase() === s.name.trim().toLowerCase()
      );
      if (nameExists) {
        alert("Shop name already exists");
        return list;
      }

      let next = [...list];
      const idx = next.findIndex((x) => x.id === s.id);
      if (idx === -1) next.push(s);
      else next[idx] = s;

      // enforce single default
      if (s.default) {
        next = next.map((x) => ({ ...x, default: x.id === s.id }));
      }
      return next;
    });
    setShopModalOpen(false);
  };

  return (
    <div className="company-form-container" aria-busy={busy}>
      <div className="company-header">
        <button
          type="button"
          className="icon-only-btn"
          title="Home"
          onClick={() => navigate("/dashboard")}
        >
          <FaHome />
        </button>
        <h2>
          <FaBuilding /> Company Setup
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="company-grid">
          <label htmlFor="name">
            Company Name
            <input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </label>

          <label htmlFor="trn">
            TRN Number
            <input id="trn" name="trn" value={formData.trn} onChange={handleChange} />
          </label>

          <label htmlFor="address">
            Address
            <input id="address" name="address" value={formData.address} onChange={handleChange} />
          </label>

          <label htmlFor="pincode">
            Pincode
            <input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
          </label>

          <label htmlFor="phone">
            Phone Number
            <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </label>

          <label htmlFor="mobile">
            Mobile Number
            <input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} />
          </label>

          <label htmlFor="email">
            Email ID
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </label>

          <label htmlFor="shopId">
            Shop ID
            <input id="shopId" name="shopId" value={formData.shopId} onChange={handleChange} />
          </label>

          <label htmlFor="adminUsername">
            Admin Username
            <input
              id="adminUsername"
              name="adminUsername"
              value={formData.adminUsername}
              onChange={handleChange}
              autoComplete="username"
            />
          </label>

          <label className="file-label" htmlFor="logo">
            Company Logo
            <input id="logo" type="file" name="logo" accept="image/*" onChange={handleChange} />
          </label>
        </div>

        {previewUrl && (
          <div className="logo-preview" aria-label="Logo Preview">
            <img src={previewUrl} alt="Company Logo Preview" />
          </div>
        )}

        {/* Shops (Branches) */}
        <div className="shops-card">
          <div className="shops-head">
            <h3>Shops (Branches)</h3>
            <button type="button" className="button-add" onClick={addShop}>
              <FaPlus /> Add Shop
            </button>
          </div>

          {shops.length === 0 ? (
            <div className="shops-empty">No shops added yet.</div>
          ) : (
            <div className="shops-table-wrapper">
              <table className="shops-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Shop Name</th>
                    <th>TRN</th>
                    <th>Pincode</th>
                    <th>Phone</th>
                    <th>Active</th>
                    <th>Default</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td>{s.trn || "-"}</td>
                      <td>{s.pincode || "-"}</td>
                      <td>{s.phone || "-"}</td>
                      <td>{s.active ? "Yes" : "No"}</td>
                      <td>{s.default ? "Yes" : "No"}</td>
                      <td className="row-actions">
                        <button type="button" className="btn-link" onClick={() => editShop(s)}>
                          <FaEdit /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-link danger"
                          onClick={() => deleteShop(s.id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="button-group">
          <button type="submit" className="button-save" disabled={busy}>
            <FaSave /> {saveLabel}
          </button>
          <button type="button" className="button-clear" onClick={clearForm} disabled={busy}>
            Clear
          </button>
          <button type="button" className="button-load" onClick={loadExistingCompany} disabled={busy}>
            <FaSyncAlt /> Load
          </button>
        </div>
      </form>

      {msg && <div className="success-message">{msg}</div>}

      <ShopModal
        open={shopModalOpen}
        initial={editingShop}
        onClose={() => setShopModalOpen(false)}
        onSave={upsertShop}
        saving={busy}
      />
    </div>
  );
}
