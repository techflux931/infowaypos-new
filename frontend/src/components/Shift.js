import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Shift.css';
import { FaPrint, FaSyncAlt } from 'react-icons/fa';
import ConfirmModal from './PrintModal';

const Shift = ({ onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reportType, setReportType] = useState('Z');

  const handleReportClick = (type) => {
    setReportType(type);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    console.log(`${reportType} Report Printed`);
    window.print(); // Replace with backend logic if needed
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="shift-modal">
      <div className="shift-header">
        <h2>SHIFT</h2>
        <button className="close-button" onClick={onClose}>✖</button>
      </div>

      <div className="shift-content">
        <button className="shift-option clickable" onClick={() => handleReportClick('X')}>
          <FaPrint className="icon blue" />
          <div>
            <strong>X Report</strong>
            <div className="key-label">F1</div>
          </div>
        </button>

        <div className="shift-text">
          Z Report Printer
          
        </div>

        <button className="shift-option clickable" onClick={() => handleReportClick('Z')}>
          <FaSyncAlt className="icon green" />
          <div>
            <strong>Z Report</strong>
            <div className="key-label">F2</div>
          </div>
        </button>
      </div>

      <div className="shift-actions">
        
      <button className="close-btn" onClick={onClose}>✖ Cancel</button>
      </div>

      {showConfirm && (
        <ConfirmModal
          message={`Print ${reportType} Report?`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

Shift.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Shift;
