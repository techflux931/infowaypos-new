import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PriceModal.css';

const PriceModal = ({ onSubmit, onClose }) => {
  const [salesRate, setSalesRate] = useState('');
  const [changePermanent, setChangePermanent] = useState(false);
  const [includeTax, setIncludeTax] = useState(false);

  const handleClick = (value) => {
    if (value === 'C') setSalesRate('');
    else if (value === '←') setSalesRate((prev) => prev.slice(0, -1));
    else setSalesRate((prev) => prev + value);
  };

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '00'];

  return (
    <div className="price-modal-overlay">
      <div className="price-modal-box">
        <div className="price-modal-header">
          <strong>CHANGE PRICE</strong>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="price-input-section">
          <label htmlFor="salesRate">Sales Rate</label>
          <input id="salesRate" type="text" value={salesRate} readOnly />
        </div>

        <div className="price-options">
          <div className="option-line">
            <input
              type="checkbox"
              id="changePermanent"
              checked={changePermanent}
              onChange={() => setChangePermanent(!changePermanent)}
            />
            <label htmlFor="changePermanent">Change Price Permanently [F1]</label>
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

        <div className="price-keypad">
          {keypad.map((btn) => (
            <button key={`key-${btn}`} onClick={() => handleClick(btn)}>{btn}</button>
          ))}
          <button onClick={() => handleClick('←')}>←</button>
          <button onClick={() => handleClick('C')}>C</button>
        </div>

        <div className="price-modal-actions">
          <button
            className="ok-btn"
            onClick={() =>
              onSubmit({ salesRate, changePermanent, includeTax })
            }
          >
            ✔ OK
          </button>
          <button className="cancel-btn" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </div>
  );
};

PriceModal.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PriceModal;
