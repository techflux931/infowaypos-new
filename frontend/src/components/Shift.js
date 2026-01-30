// src/components/Shift.js
import React, { useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { FaPrint, FaSyncAlt } from "react-icons/fa";

import XReportConfirmModal from "./XReportConfirmModal";
import DayClose from "./DayClose";              // Z Report modal (Print / Save)
import "./Shift.css";

export default function Shift({ onClose = () => {} }) {
  const [showX, setShowX] = useState(false);
  const [showZ, setShowZ] = useState(false);

  const onEsc = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onEsc]);

  return (
    <div className="shift-modal" role="dialog" aria-modal="true" aria-labelledby="shift-title">
      <div className="shift-header">
        <h2 id="shift-title">SHIFT</h2>
        <button type="button" className="close-button" aria-label="Close" onClick={onClose}>✖</button>
      </div>

      <div className="shift-content">
        <button type="button" className="shift-option clickable" onClick={() => setShowX(true)}>
          <FaPrint className="icon blue" aria-hidden="true" />
          <div><strong>X Report</strong></div>
        </button>

        <div className="shift-text">Z Report Printer</div>

        <button type="button" className="shift-option clickable" onClick={() => setShowZ(true)}>
          <FaSyncAlt className="icon green" aria-hidden="true" />
          <div><strong>Z Report</strong></div>
        </button>
      </div>

      {/* X Report modal */}
      {showX && <XReportConfirmModal open onClose={() => setShowX(false)} />}

      {/* Z Report modal (Day Close) */}
      {showZ && <DayClose open onClose={() => setShowZ(false)} />}
    </div>
  );
}

Shift.propTypes = {
  onClose: PropTypes.func,
};
