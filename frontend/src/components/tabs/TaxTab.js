// src/components/tabs/TaxTab.js
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./TaxTab.css";

const DEFAULTS = {
  enableTax: false,
  priceIncludesTax: false,
  defaultTaxRate: 5, // %
  vatLabel: "VAT",
  inputLedger: "",
  outputLedger: "",
};

export default function TaxTab() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/settings/tax");
        if (alive && data) setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Failed to load tax settings:", err);
        alert("Failed to load tax settings");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Generic field change handler
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    // number field: allow empty string while typing; coerce later
    if (name === "defaultTaxRate") {
      const v = value === "" ? "" : Number(value);
      // prevent negatives & NaN
      const clean = v === "" ? "" : Math.max(0, isNaN(v) ? 0 : v);
      setSettings((s) => ({ ...s, [name]: clean }));
      return;
    }

    setSettings((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Save
  const handleSave = async () => {
    const payload = {
      ...settings,
      // if the input is temporarily "", coerce to 0 to satisfy backend
      defaultTaxRate:
        settings.defaultTaxRate === "" ? 0 : Number(settings.defaultTaxRate),
    };

    setSaving(true);
    try {
      await api.put("/settings/tax", payload);
      alert("✅ Tax settings saved.");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving tax settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="tax-tab">Loading…</div>;

  return (
    <div className="tax-tab">
      <h2>🧾 Tax Settings</h2>

      <div className="form-row form-row--check">
        <input
          id="enableTax"
          type="checkbox"
          name="enableTax"
          checked={!!settings.enableTax}
          onChange={handleChange}
        />
        <label htmlFor="enableTax">Enable Tax</label>
      </div>

      <div className="form-row form-row--check">
        <input
          id="priceIncludesTax"
          type="checkbox"
          name="priceIncludesTax"
          checked={!!settings.priceIncludesTax}
          onChange={handleChange}
        />
        <label htmlFor="priceIncludesTax">Price Includes Tax</label>
      </div>

      <div className="form-row">
        <label htmlFor="defaultTaxRate">Default Tax Rate (%)</label>
        <input
          id="defaultTaxRate"
          type="number"
          min="0"
          step="0.01"
          name="defaultTaxRate"
          value={settings.defaultTaxRate}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="vatLabel">Tax Label (e.g. VAT, GST)</label>
        <input
          id="vatLabel"
          type="text"
          name="vatLabel"
          value={settings.vatLabel}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="inputLedger">Input Tax Ledger</label>
        <input
          id="inputLedger"
          type="text"
          name="inputLedger"
          value={settings.inputLedger}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="outputLedger">Output Tax Ledger</label>
        <input
          id="outputLedger"
          type="text"
          name="outputLedger"
          value={settings.outputLedger}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
      </div>
    </div>
  );
}
