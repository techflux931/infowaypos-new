import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import "./InvoiceCustomizationTab.css";

export default function InvoiceCustomizationTab() {
  const [settings, setSettings] = useState({
    invoiceFormat: "Format1",
    footerMessage: "",
    showQRCode: true,
    showBarcode: true,
    logoUrl: "",
    logoFileId: ""
  });

  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------- Fetch existing settings ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/pos-settings/invoice");
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("❌ Failed to fetch invoice settings:", err);
      }
    })();
  }, []);

  /* ---------- Handlers ---------- */
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setSettings((prev) => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
  };

  /* ---------- Save Settings ---------- */
  const handleSave = async () => {
    setLoading(true);
    try {
      let updatedSettings = { ...settings };

      // Upload new logo if provided
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const { data } = await axios.post("/pos-settings/invoice/logo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedSettings = { ...updatedSettings, ...data };
        setLogoFile(null);
      }

      // Save all settings
      const payload = {
        invoiceFormat: updatedSettings.invoiceFormat,
        footerMessage: updatedSettings.footerMessage,
        showQRCode: updatedSettings.showQRCode,
        showBarcode: updatedSettings.showBarcode,
        logoFileId: updatedSettings.logoFileId || undefined,
      };

      await axios.put("/pos-settings/invoice", payload);
      setSettings(updatedSettings);
      alert("✅ Invoice settings saved successfully.");
    } catch (err) {
      console.error("❌ Error saving invoice settings:", err);
      alert("❌ Failed to save invoice settings.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="invoice-customization-tab">
      <h2>🧾 Invoice Customization</h2>

      {/* Invoice Format */}
      <div className="form-row">
        <label htmlFor="invoiceFormat">Invoice Format:</label>
        <select
          id="invoiceFormat"
          name="invoiceFormat"
          value={settings.invoiceFormat}
          onChange={handleChange}
        >
          <option value="Format1">Thermal Receipt</option>
          <option value="Format2">A4 Invoice</option>
          <option value="Format3">Smooth Flour Mill</option>
        </select>
      </div>

      {/* Logo Upload */}
      <div className="form-row">
        <label htmlFor="logoUpload">Upload Logo:</label>
        <input id="logoUpload" type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {settings.logoUrl && (
        <div className="form-row">
          <img src={settings.logoUrl} alt="Logo Preview" className="logo-preview" />
        </div>
      )}

      {/* Footer Message */}
      <div className="form-row">
        <label htmlFor="footerMessage">Invoice Footer Message:</label>
        <textarea
          id="footerMessage"
          name="footerMessage"
          value={settings.footerMessage}
          onChange={handleChange}
          rows={4}
          placeholder="Thank you for shopping with us!"
        />
      </div>

      {/* Toggles */}
      <div className="form-row checkbox-row">
        <label>
          <input
            type="checkbox"
            name="showQRCode"
            checked={settings.showQRCode}
            onChange={handleChange}
          />
          Show QR Code
        </label>

        <label>
          <input
            type="checkbox"
            name="showBarcode"
            checked={settings.showBarcode}
            onChange={handleChange}
          />
          Show Barcode
        </label>
      </div>

      {/* Save Button */}
      <div className="form-row">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "💾 Saving..." : "💾 Save Settings"}
        </button>
      </div>
    </div>
  );
}
