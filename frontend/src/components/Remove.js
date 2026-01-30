// Remove.js – Confirm All Items Delete (F2)
import React from 'react';
import PropTypes from 'prop-types';
import './Remove.css';
import { FaExclamationTriangle } from 'react-icons/fa';

const Remove = ({ onConfirm, onCancel }) => {
  return (
    <div className="remove-modal">
      <div className="remove-header">
        <FaExclamationTriangle className="icon" />
        <div>
          <h3>Confirm</h3>
          <p>Do you want to remove all items?</p>
        </div>
      </div>

      <div className="remove-actions">
        <button className="cancel-btn" onClick={onCancel}>No</button>
        <button className="confirm-btn" onClick={onConfirm}>Yes</button>
      </div>
    </div>
  );
};

Remove.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Remove;