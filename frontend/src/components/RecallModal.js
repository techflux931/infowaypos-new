import React from 'react';
import PropTypes from 'prop-types';
import './RecallModal.css';
import { FaTrash, FaCheckCircle, FaTimes } from 'react-icons/fa';

const RecallModal = ({ onClose }) => {
  const handleDelete = () => {
    alert('Delete clicked');
  };

  const handleSelect = () => {
    alert('Select clicked');
  };

  return (
    <div className="recall-modal">
      <div className="recall-header">
        <h2>INVOICE RECALL</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="recall-search">
        <input type="text" placeholder="Search" />
      </div>

      <table className="recall-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Date</th>
            <th>Serial No</th>
            <th>Customer</th>
            <th>Net Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No records found</td>
          </tr>
        </tbody>
      </table>

      <div className="recall-actions">
        <button className="delete-btn" onClick={handleDelete}>
          <FaTrash /> Delete
        </button>
        <button className="select-btn" onClick={handleSelect}>
          <FaCheckCircle /> Select
        </button>
        <button className="close-btn" onClick={onClose}>
          <FaTimes /> Close
        </button>
      </div>
    </div>
  );
};

RecallModal.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default RecallModal;
