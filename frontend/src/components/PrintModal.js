import React from 'react';
import PropTypes from 'prop-types';
import './PrintModal.css';

const PrintModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="print-overlay">
      <div className="print-modal">
        <div className="print-title">POS</div>
        <div className="print-message">{message}</div>
        <div className="print-actions">
          <button className="btn-no" onClick={onCancel}>No</button>
          <button className="btn-yes" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
};

PrintModal.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PrintModal;
