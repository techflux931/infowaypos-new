// src/components/PriceModal.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PriceModal.css';

const PriceModal = ({ onSave, onClose }) => {
  const [salesRate, setSalesRate] = useState('');
  const [changePermanent, setChangePermanent] = useState(false);
  const [includeTax, setIncludeTax] = useState(false);

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '00'];

  const handleClick = (value) => {
    if (value === 'C') {
      setSalesRate('');
    } else if (value === '←') {
      setSalesRate((prev) => prev.slice(0, -1));
    } else {
      setSalesRate((prev) => prev + value);
    }
  };

  const handleOk = () => {
    const entered = parseFloat(salesRate);
    if (isNaN(entered) || entered <= 0) return;

    let price = entered;
    if (includeTax) {
      price = +(entered / 1.05).toFixed(2); // remove 5% VAT
    }

    const tax = +(price * 0.05).toFixed(2);
    const fullPrice = +(price + tax).toFixed(2);

    onSave({
      price,
      tax,
      fullPrice,
      changePermanent,
    });

    onClose();
  };

  return (
    <div className="price-modal-overlay">
      <div className="price-modal-box">
        {/* Header */}
        <div className="price-modal-header">
          <strong>CHANGE PRICE</strong>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        {/* Input Section */}
        <div className="price-input-section">
          <label htmlFor="salesRate">Sales Rate</label>
          <input id="salesRate" type="text" value={salesRate} readOnly />
        </div>

        {/* Option Checkboxes */}
        <div className="price-options">
          <div className="option-line">
            <input
              type="checkbox"
              id="changePermanent"
              checked={changePermanent}
              onChange={() => setChangePermanent(!changePermanent)}
            />
            <label htmlFor="changePermanent">Change Price Permanently</label>
          </div>
          <div className="option-line">
            <input
              type="checkbox"
              id="includeTax"
              checked={includeTax}
              onChange={() => setIncludeTax(!includeTax)}
            />
            <label htmlFor="includeTax">Include Tax</label>
          </div>
        </div>

        {/* Keypad */}
        <div className="price-keypad">
          {keypad.map((btn) => (
            <button key={btn} onClick={() => handleClick(btn)}>
              {btn}
            </button>
          ))}
          <button onClick={() => handleClick('←')}>←</button>
          <button onClick={() => handleClick('C')}>C</button>
        </div>

        {/* Action Buttons */}
        <div className="price-modal-actions">
          <button className="ok-btn" onClick={handleOk}>✔ OK</button>
          <button className="cancel-btn" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </div>
  );
};

PriceModal.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PriceModal;
