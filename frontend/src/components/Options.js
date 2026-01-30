// src/components/Options.js
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./Options.css";
import { FaPrint, FaSyncAlt } from "react-icons/fa";

import Transaction from "./Transaction";
import ItemSummary from "./ItemSummary";
import Shift from "./Shift";
import DayReport from "./DayReport";
import DayClose from "./DayClose";

export default function Options({ onClose = () => {} }) {
  const [showTransaction, setShowTransaction] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [showDayPrint, setShowDayPrint] = useState(false);
  const [showDayClose, setShowDayClose] = useState(false);

  const [poleDisplay, setPoleDisplay] = useState(false);
  const [port, setPort] = useState("");
  const [duplicateInvoice, setDuplicateInvoice] = useState(false);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="options-modal" role="dialog" aria-modal="true" aria-label="Other Options">
      <div className="options-header">
        <h2>OTHER OPTIONS</h2>
        <button className="close-button" onClick={onClose} aria-label="Close">
          ✖
        </button>
      </div>

      <div className="options-buttons">
        <button onClick={() => setShowTransaction(true)}>Transactions</button>
        <button onClick={() => setShowSummary(true)}>Item Summary Report</button>
        <button onClick={() => setShowDayPrint(true)}>
          Day Print <FaPrint className="icon" />
        </button>
        <button onClick={() => setShowDayClose(true)}>
          Day Close <FaSyncAlt className="icon" />
        </button>
        <button onClick={() => setShowShift(true)}>Shift</button>
      </div>

      <div className="options-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={poleDisplay}
            onChange={(e) => setPoleDisplay(e.target.checked)}
          />{" "}
          Pole Display
        </label>

        <label className="port-label">
          PORT{" "}
          <input
            type="text"
            className="port-input"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="e.g. COM3 / 192.168.1.50"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={duplicateInvoice}
            onChange={(e) => setDuplicateInvoice(e.target.checked)}
          />{" "}
          Duplicate invoice
        </label>
      </div>

      {/* Child modals */}
      {showTransaction && <Transaction onClose={() => setShowTransaction(false)} />}
      {showSummary && <ItemSummary onClose={() => setShowSummary(false)} />}
      {showDayPrint && <DayReport onClose={() => setShowDayPrint(false)} />}
      {showDayClose && <DayClose onClose={() => setShowDayClose(false)} />}
      {showShift && <Shift onClose={() => setShowShift(false)} />}
    </div>
  );
}

Options.propTypes = {
  onClose: PropTypes.func, // optional now
};
