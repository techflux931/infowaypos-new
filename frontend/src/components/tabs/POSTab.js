import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./POSTab.css";

const DEFAULTS = {
  fixedDiscount: false,
  variableDiscount: false,
  autoPrint: false,
  enableReprint: false,
  splitPayment: false,
  showCostInInvoice: false,
  returnWithoutBill: false,
};

const FIELDS = [
  ["fixedDiscount", "Enable Fixed Discount"],
  ["variableDiscount", "Enable Variable Discount"],
  ["autoPrint", "Auto-print Invoice After Save"],
  ["enableReprint", "Enable Bill Reprint"],
  ["splitPayment", "Allow Split Payment (Cash + Card)"],
  ["showCostInInvoice", "Show Cost Price in Invoice"],
  ["returnWithoutBill", "Allow Return Without Bill"],
];

export default function POSTab() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await api.get("/settings/pos");
        if (live && data) setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Error loading POS settings:", err);
        alert("❌ Failed to load POS settings");
      } finally {
        live = false;
        setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    try {
      await api.put("/settings/pos", settings);
      alert("✅ POS settings saved");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "❌ Save failed");
    }
  };

  const handleClose = () => window.history.back();

  if (loading) return <div className="pos-tab-container">Loading…</div>;

  return (
    <div className="pos-tab-container">
      <h3>POS / Billing Settings</h3>

      <div className="pos-settings-grid">
        {FIELDS.map(([key, label]) => (
          <label className="pos-check" key={key}>
            <input
              type="checkbox"
              checked={!!settings[key]}
              onChange={() => toggle(key)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="pos-actions">
        <button type="button" className="pos-btn pos-btn--save pos-btn--md" onClick={handleSave}>
          💾 Save Settings
        </button>

        {/* SMALL close button */}
        <button
          type="button"
          className="pos-btn pos-btn--close pos-btn--sm"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
