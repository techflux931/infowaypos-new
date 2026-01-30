// src/components/LogoutModal.js
import React from 'react';
import PropTypes from 'prop-types';
import './LogoutModal.css';

const LogoutModal = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="logout-overlay">
      <div className="logout-modal">
        <div className="logout-header">POS</div>
        <div className="logout-message">Are you sure Logout?</div>
        <div className="logout-buttons">
          <button className="btn-no" onClick={onClose}>No</button>
          <button className="btn-yes" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
};

LogoutModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default LogoutModal;
