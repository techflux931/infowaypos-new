// src/components/SuccessPopup.js
import React from 'react';
import './SuccessPopup.css';

const SuccessPopup = ({ message, onClose }) => {
  return (
    <div className="success-popup-overlay">
      <div className="success-popup-box">
        <h3>✅ Success</h3>
        <p>{message}</p>
        <button className="close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default SuccessPopup;
