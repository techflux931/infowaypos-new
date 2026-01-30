import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './QuantityModal.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const QuantityModal = ({ onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus(); // Auto-focus input on mount
  }, []);

  const handleClick = (num) => setValue(prev => prev + num);
  const handleClear = () => setValue('');
  const handleBackspace = () => setValue(prev => prev.slice(0, -1));

  const handleOk = () => {
    if (!isNaN(value) && value.trim() !== '') {
      onSubmit(parseFloat(value));
    }
  };

  return (
    <div className="quantity-modal-overlay">
      <div className="quantity-modal">
        <div className="quantity-modal-header">
          <span>CHANGE QUANTITY</span>
          {/* <button className="close-btn" onClick={onClose}>×</button> */}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="quantity-display"
          value={value}
          onChange={(e) => {
            const input = e.target.value;
            if (/^\d*\.?\d*$/.test(input)) setValue(input); // Allow only valid numbers
          }}
        />
        <div className="quantity-buttons">
          {['1','2','3','4','5','6','7','8','9','0','.','00'].map(num => (
            <button key={num} onClick={() => handleClick(num)}>{num}</button>
          ))}
          <button onClick={handleBackspace}>←</button>
          <button onClick={handleClear}>C</button>
        </div>
        <div className="quantity-modal-footer">
          <button className="ok-btn" onClick={handleOk}>
            <FaCheckCircle /> OK
          </button>
          <button className="cancel-btn" onClick={onClose}>
            <FaTimesCircle /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

QuantityModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default QuantityModal;
