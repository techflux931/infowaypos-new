import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './SalesTypeModal.css';
import { FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const SalesTypeModal = ({ onSelect, onClose }) => {
  const [selectedType, setSelectedType] = useState('');

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="sales-type-modal">
      <div className="sales-type-box">
        <div className="sales-type-header">
          <span>SALE TYPES</span>
          <button className="sales-type-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="sales-type-options">
          <button className="sales-type-option" onClick={() => handleSelect('RETAIL')}>
            RETAIL
          </button>
          <button className="sales-type-option" onClick={() => handleSelect('WHOLESALE')}>
            WHOLESALE
          </button>
          <button className="sales-type-option" onClick={() => handleSelect('CREDIT')}>
            CREDIT
          </button>
        </div>

        <div className="sales-type-actions">
          <button className="ok-btn" onClick={handleConfirm}>
            <FaCheckCircle /> Ok
          </button>
          <button className="close-btn" onClick={onClose}>
            <FaTimesCircle /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ PropTypes validation
SalesTypeModal.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SalesTypeModal;
