import React, { useEffect, useState } from "react";
import api from "../api/axios";
import DealForm from "./DealForm";
import DealList from "./DealList";
import "./styles/DealPage.css";

export default function DealPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/deals");
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleAddDeal = async (deal) => {
    try {
      await api.post("/deals", deal);
      await fetchDeals();
    } catch (err) {
      console.error("Failed to add deal:", err);
      alert("Failed to add deal.");
    }
  };

  /* -------- Download: ALL -------- */
  const handleDownloadPDF = async () => {
    try {
      const res = await api.get("/deals/pdf", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deals_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed", err);
      alert("❌ PDF download failed");
    }
  };

  /* -------- Download: ONE -------- */
  const handleDownloadOne = async (deal) => {
    const id = deal?.id || deal?._id;
    if (!id) return alert("Deal id missing.");
    try {
      const res = await api.get(`/deals/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deal_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Single PDF download failed", err);
      alert("❌ Download failed for this deal.");
    }
  };

  /* -------- WhatsApp helpers -------- */
  const promptUaeNumber = () => {
    const def = "+971";
    const n = prompt("Enter UAE mobile (+9715XXXXXXXX):", def);
    if (!n) return null;
    const num = n.trim();
    const uae = /^\+9715\d{8}$/;
    if (!uae.test(num)) {
      alert("❌ Invalid UAE number! Use +9715XXXXXXXX format.");
      return null;
    }
    return num;
  };

  /* -------- Send: ALL -------- */
  const handleSendWhatsAppAll = async () => {
    const number = promptUaeNumber();
    if (!number) return;
    try {
      const message = deals
        .map((d) => `${d.title} - ${d.date}\n${d.description}`)
        .join("\n\n");

      // include both 'toNumbers' (array) and 'mobile' (string) for backend compatibility
      await api.post("/deals/send", {
        toNumbers: [number],
        mobile: number,
        message,
      });

      alert("✅ WhatsApp message sent!");
    } catch (err) {
      console.error("WhatsApp send failed:", err);
      alert("❌ WhatsApp message failed.");
    }
  };

  /* -------- Send: ONE -------- */
  const handleSendWhatsAppOne = async (deal) => {
    const id = deal?.id || deal?._id;
    if (!id) return alert("Deal id missing.");
    const number = promptUaeNumber();
    if (!number) return;
    try {
      await api.post(`/deals/${id}/send`, {
        toNumbers: [number],
        mobile: number,
        message: "Check this deal!",
      });
      alert("✅ Deal PDF sent on WhatsApp!");
    } catch (err) {
      console.error("WhatsApp single send failed:", err);
      alert("❌ Send failed for this deal.");
    }
  };

  return (
    <div className="deal-page">
      <DealForm onAdd={handleAddDeal} />

      <div className="deal-actions">
        <button onClick={handleDownloadPDF}>📄 Download Deals PDF</button>
        <button onClick={handleSendWhatsAppAll}>📤 Send WhatsApp</button>
      </div>

      {loading ? <p style={{ textAlign: "center" }}>Loading…</p> : null}

      <DealList
        deals={deals}
        onDownloadOne={handleDownloadOne}
        onSendOne={handleSendWhatsAppOne}
      />
    </div>
  );
}
