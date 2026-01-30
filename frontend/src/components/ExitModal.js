// src/components/ExitModal.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "./ExitModal.css";

const ExitModal = ({ show, onClose, onConfirm }) => {
  // Always call the hook; only attach the listener when `show` is true
  useEffect(() => {
    if (!show) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="exit-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-title"
      onClick={(e) => {
        // click on the dimmed backdrop closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="exit-modal">
        <div id="exit-title" className="exit-modal-title">POS</div>
        <div className="exit-modal-message">Are you sure Exit?</div>
        <div className="exit-modal-buttons">
          <button className="exit-btn no" onClick={onClose}>No</button>
          <button className="exit-btn yes" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
};

ExitModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ExitModal;
