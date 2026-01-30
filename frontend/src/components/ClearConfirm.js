// ClearConfirm.js
import React from 'react';
import PropTypes from 'prop-types';
import './ClearConfirm.css';
import { FaQuestionCircle } from 'react-icons/fa';

const ClearConfirm = ({ onYes, onNo }) => {
  return (
    <div className="clear-confirm-modal">
      <div className="clear-confirm-header">
        <FaQuestionCircle className="icon" />
        <div>
          <h3>POS</h3>
          <p>Delete selected item?</p>
        </div>
      </div>

      <div className="clear-confirm-actions">
        <button className="no-btn" onClick={onNo}>No</button>
        <button className="yes-btn" onClick={onYes}>Yes</button>
      </div>
    </div>
  );
};

ClearConfirm.propTypes = {
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func.isRequired,
};

export default ClearConfirm;
