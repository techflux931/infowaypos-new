// src/components/DayReport.js
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

import CalendarModal from "./CalendarModal";
import ConfirmModal from "./PrintModal";
import "./DayReport.css";

import api from "../api/axios"; // use the axios instance with baseURL=/api
import {
  buildThermalHtml,
  renderXZBody,
  openPrintWindow,
  downloadHtml,
} from "../utils/thermalPrint";

const FILTER = { DATE: "DATE", DAY: "DAY" };
const pad2 = (n) => String(n).padStart(2, "0");

export default function DayReport({ onClose }) {
  const [filter, setFilter] = useState(FILTER.DATE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [targetField, setTargetField] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") setShowConfirm(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openCalendar = (target) => {
    setTargetField(target);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const formatted = date.toLocaleDateString("en-GB");
    if (targetField === "from") setFromDate(formatted);
    if (targetField === "to") setToDate(formatted);
    setShowCalendar(false);
  };

  // Decide the [from, to] range
  const resolvedRange = useMemo(() => {
    if (filter === FILTER.DAY && selectedDay) {
      const d = new Date(selectedDay);
      const iso = d.toISOString().slice(0, 10);
      return { from: iso, to: iso };
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    return { from: fromDate || todayIso, to: toDate || todayIso };
  }, [filter, fromDate, toDate, selectedDay]);

  // Build payload + HTML (used by both Print and Save)
  const buildReportHtml = async () => {
    const { from, to } = resolvedRange;

    // Call backend: GET /api/reports/dayz?from=YYYY-MM-DD&to=YYYY-MM-DD
    let data;
    try {
      const res = await api.get("/reports/dayz", {
        params: { from, to },
        headers: { Accept: "application/json" },
        validateStatus: () => true, // we'll handle non-2xx
      });

      const contentType = String(res.headers?.["content-type"] || "");
      if (res.status < 200 || res.status >= 300) {
        const payload =
          typeof res.data === "string"
            ? res.data
            : contentType.includes("application/json")
            ? JSON.stringify(res.data)
            : `HTTP ${res.status}`;
        throw new Error(payload);
      }
      if (!contentType.includes("application/json")) {
        // Dev proxy or server sent HTML (index.html / error page)
        throw new Error(
          "Unexpected response (not JSON). Check the API URL or proxy."
        );
      }
      data = res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to fetch report";
      throw new Error(msg);
    }

    const payload = {
      type: "X",
      store: { name: "POS STORE" },
      meta: {
        printDate: new Date().toLocaleString(),
        saleDate: resolvedRange.from,
        txnCount: data?.count ?? data?.totals?.bills ?? 0,
        counter: 1,
      },
      sales: {
        itemTotal: data?.totals?.grossTotal ?? data?.totals?.gross ?? 0,
        salesReturn: data?.totals?.returns ?? 0,
        discount: 0,
        salesTotal: data?.totals?.grossTotal ?? 0,
        totalTax: data?.totals?.vat ?? 0,
        subTotal: (data?.totals?.grossTotal ?? 0) + (data?.totals?.vat ?? 0),
        creditSales: data?.totals?.credit ?? 0,
        netTotal: data?.totals?.net ?? data?.totals?.netTotal ?? 0,
      },
      pay: {
        cash: data?.totals?.cash ?? 0,
        card: data?.totals?.card ?? 0,
        total: (data?.totals?.cash ?? 0) + (data?.totals?.card ?? 0),
      },
      tax: {
        taxable:
          (data?.totals?.net ?? data?.totals?.netTotal ?? 0) -
          (data?.totals?.vat ?? 0),
        rate: 5,
        tax: data?.totals?.vat ?? 0,
        net: data?.totals?.net ?? data?.totals?.netTotal ?? 0,
      },
      cashout: {
        opening: data?.shiftBox?.openingFloat ?? 0,
        cashSales: data?.totals?.cash ?? 0,
        total: (data?.shiftBox?.openingFloat ?? 0) + (data?.totals?.cash ?? 0),
      },
      groups: (data?.items || []).map((x) => ({
        name: x.category || x.shift || x.date || "Group",
        count: x.bills ?? x.billCount ?? 0,
        total: x.net ?? x.netTotal ?? 0,
      })),
    };

    const body = renderXZBody(payload);
    const html = buildThermalHtml("X Report", body);

    const now = new Date();
    const filename = `X_Report_${now.getFullYear()}${pad2(
      now.getMonth() + 1
    )}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(
      now.getMinutes()
    )}${pad2(now.getSeconds())}.html`;

    return { html, filename };
  };

  const handlePrint = async () => {
    try {
      setBusy(true);
      const { html } = await buildReportHtml();
      openPrintWindow(html);
    } catch (e) {
      alert(e.message || "Print failed");
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      const { html, filename } = await buildReportHtml();
      downloadHtml(html, filename);
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="dr-backdrop" onClick={onClose} />
      <div
        className="day-report-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Day Report"
      >
        <div className="day-report-header">
          <h2>DAY REPORT</h2>
          <button
            type="button"
            className="close-button--solid"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <div className="day-report-body">
          <fieldset className="filter-section">
            <legend>Filter by</legend>

            <div className="filter-row">
              <input
                id="dr-date"
                type="radio"
                name="dr-filter"
                checked={filter === FILTER.DATE}
                onChange={() => setFilter(FILTER.DATE)}
              />
              <label htmlFor="dr-date" className="lbl">
                DATE
              </label>

              <div className="date-range">
                <button
                  type="button"
                  className="date-btn"
                  onClick={() => openCalendar("from")}
                  disabled={filter !== FILTER.DATE}
                >
                  FROM : <span className="date-val">{fromDate || "Select"}</span>
                </button>
                <button
                  type="button"
                  className="date-btn"
                  onClick={() => openCalendar("to")}
                  disabled={filter !== FILTER.DATE}
                >
                  TO : <span className="date-val">{toDate || "Select"}</span>
                </button>
              </div>
            </div>

            <div className="filter-row">
              <input
                id="dr-day"
                type="radio"
                name="dr-filter"
                checked={filter === FILTER.DAY}
                onChange={() => setFilter(FILTER.DAY)}
              />
              <label htmlFor="dr-day" className="lbl">
                DAY
              </label>

              <input
                type="datetime-local"
                className="day-input"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                disabled={filter !== FILTER.DAY}
              />
            </div>
          </fieldset>

          <div className="day-report-actions">
            <button
              type="button"
              className="ok-btn"
              onClick={() => setShowConfirm(true)}
              disabled={busy}
            >
              ✓ Ok
            </button>
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              disabled={busy}
            >
              ✖ Close
            </button>
          </div>
        </div>
      </div>

      {showCalendar &&
        createPortal(
          <div className="calendar-layer">
            <CalendarModal
              onSelect={handleDateSelect}
              onClose={() => setShowCalendar(false)}
            />
          </div>,
          document.body
        )}

      {showConfirm &&
        createPortal(
          <div className="calendar-layer">
            <ConfirmModal
              message="X Report"
              okText="Print"
              extraText="Save"
              onConfirm={handlePrint}
              onExtra={handleSave}
              onCancel={() => setShowConfirm(false)}
            />
          </div>,
          document.body
        )}
    </>
  );
}

DayReport.propTypes = { onClose: PropTypes.func.isRequired };
